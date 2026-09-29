import { auth } from '@/lib/auth';
import { getGalleryById, getMediaPage, MediaFilters } from '@/lib/db/queries/galleries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  const { searchParams } = new URL(request.url);
  const galleryId = searchParams.get('galleryId');
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '60', 10);
  const view = searchParams.get('view') || 'justified';
  const sortBy = searchParams.get('sortBy') || 'dateTaken';
  const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc';

  if (!galleryId) {
    return NextResponse.json({ error: 'galleryId required' }, { status: 400 });
  }

  const gallery = await getGalleryById(galleryId);
  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Check access
  const hasAccess = await checkGalleryAccess(gallery, session?.user?.id, searchParams);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const filters: MediaFilters = {};
  if (searchParams.get('dateFrom')) filters.dateFrom = searchParams.get('dateFrom')!;
  if (searchParams.get('dateTo')) filters.dateTo = searchParams.get('dateTo')!;
  if (searchParams.get('folderPath')) filters.folderPath = searchParams.get('folderPath')!;
  if (searchParams.get('camera')) filters.cameraMake = searchParams.get('camera')!;
  if (searchParams.get('kind')) filters.kind = searchParams.get('kind') as 'image' | 'video';
  if (searchParams.get('orientation')) filters.orientation = searchParams.get('orientation') as any;
  if (searchParams.get('hasGps')) filters.hasGps = searchParams.get('hasGps') === 'true';
  if (searchParams.get('isStarred')) filters.isStarred = searchParams.get('isStarred') === 'true';
  if (searchParams.get('search')) filters.search = searchParams.get('search')!;
  if (searchParams.get('tags')) filters.tags = searchParams.get('tags')!.split(',');

  const { items, nextCursor } = await getMediaPage({
    galleryId,
    cursor,
    limit,
    filters,
    sortBy,
    sortDir,
  });

  return NextResponse.json({ items, nextCursor });
}

async function checkGalleryAccess(gallery: any, userId?: string, searchParams?: URLSearchParams): Promise<boolean> {
  if (gallery.accessMode === 'public') return true;
  if (userId && gallery.ownerId === userId) return true;

  // Check for gallery session cookie
  const gallerySession = searchParams?.get('session') || '';
  if (gallerySession) {
    // TODO: Verify JWT
    return true;
  }

  return false;
}