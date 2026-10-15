type MediaThumbKeys = {
  id: string;
  thumbKey?: string | null;
  gridKey?: string | null;
  previewKey?: string | null;
};

export type ThumbSize = 'thumb' | 'grid' | 'preview';

export function mediaThumbUrl(
  galleryId: string,
  media: MediaThumbKeys,
  size: ThumbSize
): string | null {
  const hasKey = size === 'thumb' ? media.thumbKey : size === 'grid' ? media.gridKey : media.previewKey;
  if (!hasKey) return null;

  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (baseUrl) {
    return `${baseUrl}/g/${galleryId}/${size}/${media.id}.webp`;
  }
  return `/api/thumb/${media.id}/${size}`;
}
