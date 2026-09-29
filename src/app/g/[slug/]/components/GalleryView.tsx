'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { JustifiedView } from './JustifiedView';
import { MasonryView } from './MasonryView';
import { TimelineView } from './TimelineView';
import { SlideshowView } from './SlideshowView';
import { FoldersView } from './FoldersView';
import { MapView } from './MapView';

interface Props {
  gallery: any;
  media: Media[];
  view: string;
  nextCursor?: string;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function GalleryView({ gallery, media, view, nextCursor, hasMore, onLoadMore }: Props) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = useState(media.length);

  useEffect(() => {
    if (!hasMore || !observerTarget.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const renderView = () => {
    switch (view) {
      case 'justified':
        return <JustifiedView media={media} gallery={gallery} />;
      case 'masonry':
        return <MasonryView media={media} gallery={gallery} />;
      case 'timeline':
        return <TimelineView media={media} gallery={gallery} />;
      case 'slideshow':
        return <SlideshowView media={media} gallery={gallery} />;
      case 'folders':
        return <FoldersView media={media} gallery={gallery} />;
      case 'map':
        return <MapView media={media} gallery={gallery} />;
      default:
        return <JustifiedView media={media} gallery={gallery} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderView()}
      {hasMore && (
        <div ref={observerTarget} className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}