// @ts-nocheck
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPublicUrl } from '@/lib/r2/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { mediaId, size } = await params;

  if (!['thumb', 'grid', 'preview'].includes(size)) {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
  }

  const media = await db.query.media.findFirst({
    where: eq(schema.media.id, mediaId),
    columns: { thumbKey: true, gridKey: true, previewKey: true, galleryId: true },
  });

  if (!media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  const keyMap = {
    thumb: media.thumbKey,
    grid: media.gridKey,
    preview: media.previewKey,
  };

  const key = keyMap[size as keyof typeof keyMap];
  if (!key) {
    return NextResponse.json({ error: 'Thumbnail not generated' }, { status: 404 });
  }

  const url = getPublicUrl(key);
  return NextResponse.redirect(url, 302);
}