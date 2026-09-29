// @ts-nocheck
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createGoogleDriveSource } from '@/lib/drive/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { mediaId } = await params;
  const session = await auth();

  const media = await db.query.media.findFirst({
    where: eq(schema.media.id, mediaId),
    with: { gallery: { with: { provider: true } } },
  });

  if (!media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  // Check access
  const hasAccess = await checkGalleryAccess(media.gallery, session?.user?.id, request);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Check download permission
  const isDownload = request.nextUrl.searchParams.get('download') === 'true';
  if (isDownload && !media.gallery.allowDownload) {
    return NextResponse.json({ error: 'Download not allowed' }, { status: 403 });
  }

  try {
    const source = createGoogleDriveSource(media.gallery.providerId);
    const range = request.headers.get('range');
    const stream = await source.downloadFile(media.providerFileId, range || undefined);

    const headers = new Headers();
    headers.set('Content-Type', media.mimeType);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    if (isDownload) {
      headers.set('Content-Disposition', `attachment; filename="${media.name}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${media.name}"`);
    }

    return new NextResponse(stream, { headers });
  } catch (e) {
    console.error('Stream error:', e);
    return NextResponse.json({ error: 'Failed to stream media' }, { status: 500 });
  }
}

async function checkGalleryAccess(gallery: any, userId?: string, request?: NextRequest): Promise<boolean> {
  if (gallery.accessMode === 'public') return true;
  if (userId && gallery.ownerId === userId) return true;

  const gallerySession = request?.cookies.get(`gallery_session_${gallery.slug}`)?.value;
  if (gallerySession) {
    // TODO: Verify JWT
    return true;
  }

  return false;
}