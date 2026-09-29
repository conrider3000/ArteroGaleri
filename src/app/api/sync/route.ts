import { auth } from '@/lib/auth';
import { getGalleryById, updateGallerySyncStatus } from '@/lib/db/queries/galleries';
import { syncGalleryChunk } from '@/lib/sync/indexer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const galleryId = request.nextUrl.searchParams.get('galleryId');
  if (!galleryId) {
    return NextResponse.json({ error: 'galleryId required' }, { status: 400 });
  }

  const gallery = await getGalleryById(galleryId);
  if (!gallery || gallery.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: gallery.syncStatus,
    lastSyncedAt: gallery.lastSyncedAt,
    cursor: gallery.syncCursor,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { galleryId, cursor } = await request.json();
    
    const gallery = await getGalleryById(galleryId);
    if (!gallery || gallery.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    await updateGallerySyncStatus(galleryId, 'running', cursor);

    const result = await syncGalleryChunk(galleryId, cursor ? JSON.parse(cursor) : undefined);

    if (!result.nextCursor) {
      await updateGallerySyncStatus(galleryId, 'completed');
    } else {
      await updateGallerySyncStatus(galleryId, 'running', JSON.stringify(result.nextCursor));
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('Sync error:', e);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}