import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  options: { contentType: string; cacheControl?: string } = { contentType: 'application/octet-stream' }
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body as any,
    ContentType: options.contentType,
    CacheControl: options.cacheControl || 'public, max-age=31536000, immutable',
  }));
  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(r2, command, { expiresIn });
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

export function generateMediaKeys(galleryId: string, mediaId: string) {
  return {
    thumb: `g/${galleryId}/thumb/${mediaId}.webp`,
    grid: `g/${galleryId}/grid/${mediaId}.webp`,
    preview: `g/${galleryId}/preview/${mediaId}.webp`,
  };
}