import { getGalleryById, upsertMedia, updateMediaThumbs, getMediaCount } from '@/lib/db/queries/galleries';
import { createGoogleDriveSource } from '@/lib/drive/client';
import { processImage, getMediaKind, isSupportedImage } from '@/lib/media/processor';
import { uploadToR2, generateMediaKeys } from '@/lib/r2/client';
import type { MediaFile } from '@/lib/drive/types';

interface SyncCursor {
  folderId: string;
  pageToken?: string;
  depth: number;
  driveId?: string;
}

interface SyncChunkResult {
  processed: number;
  totalEstimated: number;
  nextCursor?: SyncCursor;
  errors: Array<{ fileId: string; error: string }>;
}

const CHUNK_SIZE = 200;
const TIME_BUDGET_MS = 14000;

export async function syncGalleryChunk(
  galleryId: string,
  cursor?: SyncCursor,
  chunkSize = CHUNK_SIZE,
  timeBudgetMs = TIME_BUDGET_MS
): Promise<SyncChunkResult> {
  const gallery = await getGalleryById(galleryId);
  if (!gallery) throw new Error('Gallery not found');

  const source = createGoogleDriveSource(gallery.providerId);
  const start = Date.now();
  
  let processed = 0;
  const folderQueue: SyncCursor[] = cursor ? [cursor] : [{ 
    folderId: gallery.sourceFolderId, 
    pageToken: undefined, 
    depth: 0,
    driveId: gallery.sourceDriveId ?? undefined,
  }];
  const errors: SyncChunkResult['errors'] = [];

  while (folderQueue.length > 0 && processed < chunkSize && (Date.now() - start) < timeBudgetMs) {
    const current = folderQueue.shift()!;
    
    const result = await source.listFiles({
      folderId: current.folderId,
      driveId: current.driveId,
      pageToken: current.pageToken,
      pageSize: 1000,
      orderBy: 'folder,modifiedTime desc,name',
      fields: 'files(id,name,mimeType,size,modifiedTime,thumbnailLink,imageMediaMetadata,videoMediaMetadata,shortcutDetails,parents,md5Checksum),nextPageToken,incompleteSearch',
    });

    for (const file of result.files) {
      if (processed >= chunkSize) break;
      if ((Date.now() - start) >= timeBudgetMs) break;

      try {
        await processFile(gallery, file, source);
        processed++;
      } catch (e) {
        errors.push({ fileId: file.id, error: String(e) });
      }

      // If it's a folder, queue it for processing
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        folderQueue.push({ 
          folderId: file.id, 
          pageToken: undefined, 
          depth: current.depth + 1,
          driveId: current.driveId,
        });
      }
      // If it's a shortcut, follow the target
      else if (file.shortcutDetails?.targetId) {
        try {
          const target = await source.getFile(file.shortcutDetails.targetId);
          if (target.mimeType === 'application/vnd.google-apps.folder') {
            folderQueue.push({ 
              folderId: target.id, 
              pageToken: undefined, 
              depth: current.depth + 1,
              driveId: current.driveId,
            });
          } else {
            await processFile(gallery, target, source);
            processed++;
          }
        } catch (e) {
          errors.push({ fileId: file.shortcutDetails.targetId, error: String(e) });
        }
      }
    }

    if (result.nextPageToken) {
      folderQueue.unshift({ 
        folderId: current.folderId, 
        pageToken: result.nextPageToken, 
        depth: current.depth,
        driveId: current.driveId,
      });
    }
  }

  const totalEstimated = await getMediaCount(galleryId);

  return {
    processed,
    totalEstimated,
    nextCursor: folderQueue[0],
    errors,
  };
}

async function processFile(gallery: any, file: MediaFile, source: any) {
  const kind = getMediaKind(file.mimeType || '');
  if (kind === 'other') return;

  // Upsert media record
  const mediaRecord = await upsertMedia(gallery.id, file, source);

  // Process image thumbnails
  if (isSupportedImage(file.mimeType || '') && file.thumbnailLink) {
    try {
      const thumbnailRes = await fetch(file.thumbnailLink.replace(/=s\d+/, '=s1600'));
      if (thumbnailRes.ok) {
        const buffer = Buffer.from(await thumbnailRes.arrayBuffer());
        const processed = await processImage(buffer, file.mimeType || '');
        
        // Upload to R2
        const keys = generateMediaKeys(gallery.id, mediaRecord.id);
        await Promise.all([
          uploadToR2(keys.thumb, processed.buffers.thumb, { contentType: 'image/webp' }),
          uploadToR2(keys.grid, processed.buffers.grid, { contentType: 'image/webp' }),
          uploadToR2(keys.preview, processed.buffers.preview, { contentType: 'image/webp' }),
        ]);

        await updateMediaThumbs(mediaRecord.id, {
          thumbKey: keys.thumb,
          gridKey: keys.grid,
          previewKey: keys.preview,
          lqip: processed.lqip,
          dominantColor: processed.dominantColor,
        });
      }
    } catch (e) {
      console.error(`Failed to process thumbnails for ${file.id}:`, e);
    }
  }
}