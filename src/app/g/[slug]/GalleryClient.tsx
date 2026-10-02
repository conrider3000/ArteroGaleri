'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { GalleryView } from './components/GalleryView';
import { FilterBar } from './components/FilterBar';
import { ViewSwitcher } from './components/ViewSwitcher';
import { GalleryHeader } from './components/GalleryHeader';
import { Gallery } from '@/lib/db/schema';

type ViewType = 'masonry' | 'justified' | 'timeline' | 'slideshow' | 'folders' | 'map';
type SortByType = 'dateTaken' | 'name' | 'size' | 'camera' | 'random';

interface MediaItem {
  id: string;
  name: string;
  mimeType: string;
  extension: string;
  kind: 'image' | 'video' | 'other';
  sizeBytes: number;
  width: number | null;
  height: number | null;
  dateTaken: Date | string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  iso: number | null;
  aperture: string | null;
  shutterSpeed: string | null;
  focalLength: string | null;
  orientation: number | null;
  latitude: string | null;
  longitude: string | null;
  durationMs: number | null;
  folderPath: string;
  parentFolderId: string | null;
  isStarred: boolean;
  tags: string[];
  thumbKey: string | null;
  gridKey: string | null;
  previewKey: string | null;
  lqip: string | null;
  dominantColor: string | null;
  indexedAt: Date | string;
  updatedAt: Date | string;
  galleryId: string;
  providerFileId: string;
  providerFileHash: string | null;
}

interface MediaPageResponse {
  items: MediaItem[];
  nextCursor?: string;
}

interface Props {
  gallery: Gallery & {
    _count?: { media: number };
    folders?: string[];
    cameras?: Array<{ make: string; model: string }>;
  };
}

export default function GalleryClient({ gallery }: Props) {
  const [view, setView] = useState<'justified' | 'masonry' | 'timeline' | 'slideshow' | 'folders' | 'map'>(
    gallery.settings?.defaultView || 'justified'
  );
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<'dateTaken' | 'name' | 'size' | 'camera' | 'random'>(
    gallery.settings?.sortBy || 'dateTaken'
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(gallery.settings?.sortDir || 'desc');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['gallery-media', gallery.id, view, filters, sortBy, sortDir],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        galleryId: gallery.id,
        view,
        sortBy,
        sortDir,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        ...(pageParam ? { cursor: pageParam as string } : {}),
      });
      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) throw new Error('Failed to fetch media');
      return res.json();
    },
    getNextPageParam: (lastPage: MediaPageResponse) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30000,
  });

  const media = data?.pages.flatMap(p => p.items) || [];

  return (
    <div className="min-h-screen bg-background">
      <GalleryHeader gallery={gallery} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ViewSwitcher current={view} onChange={setView} />
          <FilterBar
            gallery={gallery}
            filters={filters}
            onFiltersChange={setFilters}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={(s) => { setSortBy(s.by as SortByType); setSortDir(s.dir); }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erro ao carregar a galeria: {(error as Error).message}
          </div>
        ) : (
          <div>
            <GalleryView
              gallery={gallery}
              media={media}
              view={view}
              nextCursor={data?.pages[data.pages.length - 1]?.nextCursor}
              hasMore={hasNextPage}
              onLoadMore={() => fetchNextPage()}
            />
            {hasNextPage && isFetchingNextPage && (
              <div className="flex h-20 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}