import sharp from 'sharp';

export const SIZES = {
  thumb: { width: 400, height: 400, fit: 'cover' as const, quality: 75 },
  grid: { width: 800, height: 800, fit: 'inside' as const, quality: 80 },
  preview: { width: 1920, height: 1920, fit: 'inside' as const, quality: 82 },
} as const;

export interface ProcessedMedia {
  width: number;
  height: number;
  dominantColor: string;
  lqip: string;
  buffers: {
    thumb: Buffer;
    grid: Buffer;
    preview: Buffer;
  };
}

export interface VideoMetadata {
  durationMs: number;
  width: number;
  height: number;
  posterBuffer?: Buffer;
}

export async function processImage(buffer: Buffer, mimeType: string): Promise<ProcessedMedia> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not determine image dimensions');
  }

  const stats = await image.clone().resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const dominant = `#${stats.data[0].toString(16).padStart(2, '0')}${stats.data[1].toString(16).padStart(2, '0')}${stats.data[2].toString(16).padStart(2, '0')}`;

  const lqipBuffer = await image.clone().resize(20).webp({ quality: 20 }).toBuffer();
  const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

  const [thumbBuf, gridBuf, previewBuf] = await Promise.all([
    image.clone().resize(SIZES.thumb).webp({ quality: SIZES.thumb.quality }).toBuffer(),
    image.clone().resize(SIZES.grid).webp({ quality: SIZES.grid.quality }).toBuffer(),
    image.clone().resize(SIZES.preview).webp({ quality: SIZES.preview.quality }).toBuffer(),
  ]);

  return {
    width: metadata.width,
    height: metadata.height,
    dominantColor: dominant,
    lqip,
    buffers: { thumb: thumbBuf, grid: gridBuf, preview: previewBuf },
  };
}

export async function extractVideoMetadata(buffer: Buffer): Promise<VideoMetadata> {
  return {
    durationMs: 0,
    width: 0,
    height: 0,
  };
}

export async function extractVideoPoster(buffer: Buffer, timeMs = 1000): Promise<Buffer> {
  return Buffer.from('');
}

export function getMimeTypeExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
  };
  return map[mimeType] || 'bin';
}

export function isSupportedImage(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/gif'].includes(mimeType);
}

export function isSupportedVideo(mimeType: string): boolean {
  return ['video/mp4', 'video/webm', 'video/quicktime'].includes(mimeType);
}

export function getMediaKind(mimeType: string): 'image' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
}