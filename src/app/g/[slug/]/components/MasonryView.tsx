'use client';

import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { MediaItem } from './MediaItem';

interface Props {
  media: Media[];
  gallery: any;
}

export function MasonryView({ media, gallery }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>Nenhuma mídia encontrada</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4',
        'space-y-4'
      )}
      role="list"
      aria-label="Galeria masonry"
    >
      {media.map((item, index) => (
        <div
          key={item.id}
          className="break-inside-avoid"
          role="listitem"
          style={{ 
            marginBottom: '16px',
            opacity: 0,
            animation: 'fadeIn 0.3s ease-out forwards',
            animationDelay: `${Math.min(index * 20, 300)}ms`,
          }}
        >
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <MediaItem
            media={item}
            gallery={gallery}
            width={300}
            height={Math.round(300 / ((item.width || 4) / (item.height || 3)))}
          />
        </div>
      ))}
    </div>
  );
}