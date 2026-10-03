import { db } from '../index';
import * as schema from '../schema';
import { eq, and, desc, asc, ilike, inArray, sql, or, isNull, gte, lte } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export async function getUserByGoogleSub(googleSub: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.googleSub, googleSub),
  });
}

export async function createUser(data: typeof schema.users.$inferInsert) {
  const [user] = await db.insert(schema.users).values(data).returning();
  return user;
}

export async function getCloudProvidersByUser(userId: string) {
  return db.query.cloudProviders.findMany({
    where: eq(schema.cloudProviders.userId, userId),
    orderBy: desc(schema.cloudProviders.isDefault),
  });
}

export async function getDefaultCloudProvider(userId: string) {
  return db.query.cloudProviders.findFirst({
    where: and(
      eq(schema.cloudProviders.userId, userId),
      eq(schema.cloudProviders.isDefault, true)
    ),
  });
}

export async function createCloudProvider(data: typeof schema.cloudProviders.$inferInsert) {
  const [provider] = await db.insert(schema.cloudProviders).values(data).returning();
  return provider;
}

export async function updateCloudProvider(id: string, data: Partial<typeof schema.cloudProviders.$inferInsert>) {
  const [provider] = await db.update(schema.cloudProviders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.cloudProviders.id, id))
    .returning();
  return provider;
}

async function attachMediaCount<T extends { id: string }>(galleries: T[]): Promise<(T & { _count: { media: number } })[]> {
  if (galleries.length === 0) return galleries as (T & { _count: { media: number } })[];

  const counts = await db
    .select({ galleryId: schema.media.galleryId, count: sql<number>`count(*)::int` })
    .from(schema.media)
    .where(inArray(schema.media.galleryId, galleries.map(g => g.id)))
    .groupBy(schema.media.galleryId);

  const countMap = new Map(counts.map(c => [c.galleryId, c.count]));
  return galleries.map(g => ({ ...g, _count: { media: countMap.get(g.id) ?? 0 } })) as (T & { _count: { media: number } })[];
}

async function attachMediaCountOne<T extends { id: string }>(gallery: T): Promise<T & { _count: { media: number } }> {
  const [withCount] = await attachMediaCount([gallery]);
  return withCount;
}

export async function getGalleriesByOwner(ownerId: string) {
  const galleries = await db.query.galleries.findMany({
    where: eq(schema.galleries.ownerId, ownerId),
    orderBy: desc(schema.galleries.updatedAt),
    with: {
      provider: true,
    },
  });
  return attachMediaCount(galleries);
}

export async function getGalleryById(id: string) {
  return db.query.galleries.findFirst({
    where: eq(schema.galleries.id, id),
    with: {
      provider: true,
      owner: true,
    },
  });
}

export async function getGalleryBySlug(slug: string) {
  const gallery = await db.query.galleries.findFirst({
    where: eq(schema.galleries.slug, slug),
    with: {
      provider: true,
      owner: true,
    },
  });
  if (!gallery) return null;
  return attachMediaCountOne(gallery);
}

export async function getGalleryWithDetails(slug: string) {
  const gallery = await db.query.galleries.findFirst({
    where: eq(schema.galleries.slug, slug),
    with: {
      provider: true,
      owner: true,
    },
  });

  if (!gallery) return null;

  const galleryWithCount = await attachMediaCountOne(gallery);

  // Fetch folders
  const foldersResult = await db.selectDistinct({ folderPath: schema.media.folderPath })
    .from(schema.media)
    .where(and(eq(schema.media.galleryId, gallery.id), sql`${schema.media.folderPath} IS NOT NULL`))
    .orderBy(schema.media.folderPath);
  const folders = foldersResult.map(r => r.folderPath).filter(Boolean);

  // Fetch cameras
  const camerasResult = await db.selectDistinct({
    make: schema.media.cameraMake,
    model: schema.media.cameraModel,
  }).from(schema.media)
    .where(and(eq(schema.media.galleryId, gallery.id), sql`${schema.media.cameraMake} IS NOT NULL`))
    .orderBy(schema.media.cameraMake, schema.media.cameraModel);
  const cameras = camerasResult.filter(r => r.make && r.model).map(r => ({ make: r.make!, model: r.model! }));

  return {
    ...galleryWithCount,
    folders,
    cameras,
  };
}

export async function createGallery(data: typeof schema.galleries.$inferInsert) {
  const [gallery] = await db.insert(schema.galleries).values(data).returning();
  return gallery;
}

export async function updateGallery(id: string, data: Partial<typeof schema.galleries.$inferInsert>) {
  const [gallery] = await db.update(schema.galleries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.galleries.id, id))
    .returning();
  return gallery;
}

export async function deleteGallery(id: string) {
  await db.delete(schema.galleries).where(eq(schema.galleries.id, id));
}

export async function getMediaPage(input: {
  galleryId: string;
  cursor?: string;
  limit?: number;
  filters?: MediaFilters;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}) {
  const { galleryId, cursor, limit = 60, filters, sortBy = 'dateTaken', sortDir = 'desc' } = input;

  const conditions = [eq(schema.media.galleryId, galleryId)];

  if (filters) {
    if (filters.dateFrom) conditions.push(gte(schema.media.dateTaken, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(schema.media.dateTaken, new Date(filters.dateTo)));
    if (filters.folderPath) conditions.push(eq(schema.media.folderPath, filters.folderPath));
    if (filters.cameraMake) conditions.push(eq(schema.media.cameraMake, filters.cameraMake));
    if (filters.cameraModel) conditions.push(eq(schema.media.cameraModel, filters.cameraModel));
    if (filters.kind) conditions.push(eq(schema.media.kind, filters.kind));
    if (filters.orientation) {
      if (filters.orientation === 'landscape') conditions.push(sql`${schema.media.width} > ${schema.media.height}`);
      else if (filters.orientation === 'portrait') conditions.push(sql`${schema.media.width} < ${schema.media.height}`);
      else if (filters.orientation === 'square') conditions.push(sql`${schema.media.width} = ${schema.media.height}`);
    }
    if (filters.hasGps !== undefined) {
      if (filters.hasGps) {
        conditions.push(and(
          sql`${schema.media.latitude} IS NOT NULL`,
          sql`${schema.media.longitude} IS NOT NULL`
        )!);
      } else {
        conditions.push(or(
          sql`${schema.media.latitude} IS NULL`,
          sql`${schema.media.longitude} IS NULL`
        )!);
      }
    }
    if (filters.isStarred) conditions.push(eq(schema.media.isStarred, true));
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${schema.media.tags} && ${filters.tags}`);
    }
    if (filters.search) {
      conditions.push(ilike(schema.media.name, `%${filters.search}%`));
    }
  }

  if (cursor) {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
    const { value: cursorValue, id: cursorId } = decoded;
    if (sortDir === 'asc') {
      conditions.push(or(
        sql`${sql.identifier(sortBy)} > ${cursorValue}`,
        and(sql`${sql.identifier(sortBy)} = ${cursorValue}`, sql`${schema.media.id} > ${cursorId}`)
      )!);
    } else {
      conditions.push(or(
        sql`${sql.identifier(sortBy)} < ${cursorValue}`,
        and(sql`${sql.identifier(sortBy)} = ${cursorValue}`, sql`${schema.media.id} < ${cursorId}`)
      )!);
    }
  }

  const orderBy = sortDir === 'asc' ? asc(sql.identifier(sortBy)) : desc(sql.identifier(sortBy));

  const items = await db.query.media.findMany({
    where: and(...conditions),
    orderBy: [orderBy, desc(schema.media.id)],
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (items.length > limit) {
    const lastItem = items[limit - 1];
    const cursorValue = (lastItem as any)[sortBy];
    nextCursor = Buffer.from(JSON.stringify({
      value: cursorValue,
      id: lastItem.id,
    })).toString('base64');
    items.pop();
  }

  return { items, nextCursor };
}

export interface MediaFilters {
  dateFrom?: string;
  dateTo?: string;
  folderPath?: string;
  cameraMake?: string;
  cameraModel?: string;
  kind?: 'image' | 'video';
  orientation?: 'landscape' | 'portrait' | 'square';
  hasGps?: boolean;
  isStarred?: boolean;
  tags?: string[];
  search?: string;
}

export async function getMediaCount(galleryId: string, filters?: MediaFilters) {
  const conditions = [eq(schema.media.galleryId, galleryId)];
  if (filters) {
    if (filters.dateFrom) conditions.push(gte(schema.media.dateTaken, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(schema.media.dateTaken, new Date(filters.dateTo)));
    if (filters.folderPath) conditions.push(eq(schema.media.folderPath, filters.folderPath));
    if (filters.cameraMake) conditions.push(eq(schema.media.cameraMake, filters.cameraMake));
    if (filters.cameraModel) conditions.push(eq(schema.media.cameraModel, filters.cameraModel));
    if (filters.kind) conditions.push(eq(schema.media.kind, filters.kind));
    if (filters.hasGps !== undefined) {
      if (filters.hasGps) {
        conditions.push(and(
          sql`${schema.media.latitude} IS NOT NULL`,
          sql`${schema.media.longitude} IS NOT NULL`
        )!);
      } else {
        conditions.push(or(
          sql`${schema.media.latitude} IS NULL`,
          sql`${schema.media.longitude} IS NULL`
        )!);
      }
    }
    if (filters.isStarred) conditions.push(eq(schema.media.isStarred, true));
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${schema.media.tags} && ${filters.tags}`);
    }
    if (filters.search) {
      conditions.push(ilike(schema.media.name, `%${filters.search}%`));
    }
  }
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(schema.media).where(and(...conditions));
  return result.count;
}

export async function upsertMedia(galleryId: string, file: DriveFile, source: MediaSource) {
  const mediaData = mapDriveFileToMedia(galleryId, file);
  const [existing] = await db.select().from(schema.media).where(
    and(eq(schema.media.galleryId, galleryId), eq(schema.media.providerFileId, file.id))
  ).limit(1);

  if (existing) {
    if (existing.providerFileHash !== file.md5Checksum) {
      await db.update(schema.media)
        .set({ ...mediaData, updatedAt: new Date() })
        .where(eq(schema.media.id, existing.id));
    }
    return existing;
  } else {
    const [created] = await db.insert(schema.media).values(mediaData).returning();
    return created;
  }
}

function mapDriveFileToMedia(galleryId: string, file: DriveFile) {
  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const kind = (isImage ? 'image' : isVideo ? 'video' : 'other') as 'image' | 'video' | 'other';
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  return {
    galleryId,
    providerFileId: file.id,
    providerFileHash: file.md5Checksum,
    name: file.name,
    mimeType: file.mimeType || 'application/octet-stream',
    extension,
    kind,
    sizeBytes: file.size ? parseInt(file.size, 10) : 0,
    width: file.imageMediaMetadata?.width,
    height: file.imageMediaMetadata?.height,
    dateTaken: file.imageMediaMetadata?.dateTaken ? new Date(file.imageMediaMetadata.dateTaken) : undefined,
    cameraMake: file.imageMediaMetadata?.cameraMake,
    cameraModel: file.imageMediaMetadata?.cameraModel,
    lensModel: file.imageMediaMetadata?.lensModel,
    iso: file.imageMediaMetadata?.iso,
    aperture: file.imageMediaMetadata?.aperture?.toString(),
    shutterSpeed: file.imageMediaMetadata?.exposureTime,
    focalLength: file.imageMediaMetadata?.focalLength?.toString(),
    orientation: file.imageMediaMetadata?.orientation,
    latitude: file.imageMediaMetadata?.location?.latitude?.toString(),
    longitude: file.imageMediaMetadata?.location?.longitude?.toString(),
    durationMs: file.videoMediaMetadata?.durationMillis ? parseInt(file.videoMediaMetadata.durationMillis, 10) : undefined,
    folderPath: '',
    parentFolderId: file.parents?.[0],
    isStarred: false,
    tags: [],
  };
}

export async function updateMediaThumbs(mediaId: string, keys: { thumbKey?: string; gridKey?: string; previewKey?: string; lqip?: string; dominantColor?: string }) {
  await db.update(schema.media)
    .set({ ...keys, updatedAt: new Date() })
    .where(eq(schema.media.id, mediaId));
}

export async function getGalleryStats(galleryId: string) {
  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    images: sql<number>`count(*) filter (where ${schema.media.kind} = 'image')`,
    videos: sql<number>`count(*) filter (where ${schema.media.kind} = 'video')`,
    totalSize: sql<number>`sum(${schema.media.sizeBytes})`,
    oldestDate: sql<Date>`min(${schema.media.dateTaken})`,
    newestDate: sql<Date>`max(${schema.media.dateTaken})`,
  }).from(schema.media).where(eq(schema.media.galleryId, galleryId));
  return stats;
}

export async function getFolderPaths(galleryId: string) {
  const result = await db.selectDistinct({ folderPath: schema.media.folderPath })
    .from(schema.media)
    .where(eq(schema.media.galleryId, galleryId))
    .orderBy(schema.media.folderPath);
  return result.map(r => r.folderPath).filter(Boolean);
}

export async function getCameras(galleryId: string) {
  const result = await db.selectDistinct({
    make: schema.media.cameraMake,
    model: schema.media.cameraModel,
  }).from(schema.media)
    .where(and(eq(schema.media.galleryId, galleryId), sql`${schema.media.cameraMake} IS NOT NULL`))
    .orderBy(schema.media.cameraMake, schema.media.cameraModel);
  return result.filter(r => r.make && r.model);
}

export async function getAllTags(galleryId: string) {
  const result = await db.select({ tags: schema.media.tags })
    .from(schema.media)
    .where(eq(schema.media.galleryId, galleryId));
  const allTags = new Set<string>();
  result.forEach(r => r.tags?.forEach(t => allTags.add(t)));
  return Array.from(allTags).sort();
}

export async function logGalleryAccess(data: typeof schema.galleryAccessLogs.$inferInsert) {
  await db.insert(schema.galleryAccessLogs).values(data);
}

export async function updateGallerySyncStatus(galleryId: string, status: typeof schema.syncStatusEnum.enumValues[number], cursor?: string) {
  await db.update(schema.galleries)
    .set({
      syncStatus: status,
      syncCursor: cursor,
      lastSyncedAt: status === 'completed' ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(schema.galleries.id, galleryId));
}

import type { DriveFile, MediaSource } from '@/lib/drive/types';