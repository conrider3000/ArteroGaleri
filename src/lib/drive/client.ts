import { decryptToken } from '@/lib/crypto/tokens';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { MediaSource, ListOptions, ListResult, MediaFile } from './types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export class GoogleDriveSource implements MediaSource {
  readonly provider = 'google_drive';
  readonly displayName = 'Google Drive';

  private accessToken: string | null = null;
  private providerId: string;

  constructor(providerId: string) {
    this.providerId = providerId;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const provider = await db.query.cloudProviders.findFirst({
      where: eq(schema.cloudProviders.id, this.providerId),
    });

    if (!provider || !provider.encryptedRefreshToken) {
      throw new Error('Provider not found or not connected');
    }

    const refreshToken = await decryptToken(provider.encryptedRefreshToken);
    const { access_token, expires_in } = await this.refreshToken(refreshToken);

    this.accessToken = access_token;

    await db.update(schema.cloudProviders)
      .set({
        encryptedAccessToken: await this.encryptForStorage(access_token),
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      })
      .where(eq(schema.cloudProviders.id, this.providerId));

    return access_token;
  }

  private async encryptForStorage(token: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'base64'),
      { name: 'aes-256-gcm' },
      false,
      ['encrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(token);
    const ciphertext = await crypto.subtle.encrypt({ name: 'aes-256-gcm', iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return Buffer.from(combined).toString('base64');
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${DRIVE_API_BASE}/about?fields=user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<{ accessToken: string; expiresAt: Date }> {
    const provider = await db.query.cloudProviders.findFirst({
      where: eq(schema.cloudProviders.id, this.providerId),
    });

    if (!provider || !provider.encryptedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshToken = await decryptToken(provider.encryptedRefreshToken);
    const { access_token, expires_in } = await this.refreshToken(refreshToken);

    return {
      accessToken: access_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  private async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const params = new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    return res.json();
  }

  async listFiles(opts: ListOptions): Promise<ListResult> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      q: `'${opts.folderId}' in parents and trashed=false${opts.query ? ` and ${opts.query}` : ''}`,
      pageSize: String(opts.pageSize || 1000),
      orderBy: opts.orderBy || 'folder,modifiedTime desc,name',
      fields: opts.fields || 'files(id,name,mimeType,size,modifiedTime,thumbnailLink,imageMediaMetadata,videoMediaMetadata,shortcutDetails,parents,md5Checksum),nextPageToken,incompleteSearch',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    if (opts.pageToken) params.set('pageToken', opts.pageToken);
    if (opts.driveId) {
      params.set('driveId', opts.driveId);
      params.set('corpora', 'drive');
    }

    const res = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  async getFile(fileId: string): Promise<MediaFile> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      fields: 'id,name,mimeType,size,modifiedTime,thumbnailLink,imageMediaMetadata,videoMediaMetadata,shortcutDetails,parents,md5Checksum',
      supportsAllDrives: 'true',
    });

    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Drive get file failed: ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  async downloadFile(fileId: string, range?: string): Promise<ReadableStream> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (range) headers['Range'] = range;

    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media&supportsAllDrives=true`, {
      headers,
    });

    if (!res.ok && res.status !== 206) {
      throw new Error(`Drive download failed: ${res.status} ${await res.text()}`);
    }

    return res.body!;
  }

  async getThumbnailUrl(fileId: string, size?: number): Promise<string> {
    const file = await this.getFile(fileId);
    if (!file.thumbnailLink) {
      throw new Error('No thumbnail available');
    }
    let url = file.thumbnailLink;
    if (size) {
      url = url.replace(/=s\d+/, `=s${size}`);
    }
    return url;
  }

  async watchChanges(folderId: string, webhookUrl: string): Promise<{ channelId: string; resourceId: string }> {
    const token = await this.getAccessToken();
    const channelId = crypto.randomUUID();
    const expiration = Date.now() + 24 * 60 * 60 * 1000;

    const res = await fetch(`${DRIVE_API_BASE}/files/watch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        params: { ttl: '86400' },
      }),
    });

    if (!res.ok) {
      throw new Error(`Watch failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { channelId: data.id, resourceId: data.resourceId };
  }

  async stopWatch(channelId: string, resourceId: string): Promise<void> {
    const token = await this.getAccessToken();
    await fetch(`https://www.googleapis.com/drive/v3/channels/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: channelId, resourceId }),
    });
  }
}

export function createGoogleDriveSource(providerId: string): MediaSource {
  return new GoogleDriveSource(providerId);
}