'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GalleryView } from './components/GalleryView';
import { FilterBar } from './components/FilterBar';
import { ViewSwitcher } from './components/ViewSwitcher';
import { GalleryHeader } from './components/GalleryHeader';
import { Gallery } from '@/lib/db/schema';

type ViewType = 'masonry' | 'justified' | 'timeline' | 'slideshow' | 'folders' | 'map';
type SortByType = 'dateTaken' | 'name' | 'size' | 'camera' | 'random';

interface GalleryWithDetails extends Gallery {
  folders?: string[];
  cameras?: Array<{ make: string; model: string }>;
  _count?: { media: number };
}

interface Props {
  gallery: GalleryWithDetails;
}

export default function GalleryClient({ gallery }: Props) {
  const [view, setView] = useState<ViewType>(gallery.settings?.defaultView || 'justified');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<SortByType>(gallery.settings?.sortBy || 'dateTaken');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(gallery.settings?.sortDir || 'desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['gallery-media', gallery.id, view, filters, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({
        galleryId: gallery.id,
        view,
        sortBy,
        sortDir,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });
      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) throw new Error('Failed to fetch media');
      return res.json();
    },
    staleTime: 30000,
  });

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
            Erro ao carregar a galeria: {error.message}
          </div>
        ) : (
          <GalleryView
            gallery={gallery}
            media={data?.items || []}
            view={view}
            nextCursor={data?.nextCursor}
            hasMore={!!data?.nextCursor}
            onLoadMore={() => {}}
          />
        )}
      </div>
    </div>
  );
}