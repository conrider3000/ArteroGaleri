'use client';

import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { MediaItem } from './MediaItem';

interface Props {
  media: Media[];
  gallery: any;
}

export function JustifiedView({ media, gallery }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>Nenhuma mídia encontrada</p>
      </div>
    );
  }

  const rowHeight = 220;
  const maxRowWidth = 1200;
  const margin = 2;

  const rows: Media[][] = [];
  let currentRow: Media[] = [];
  let currentRowWidth = 0;

  media.forEach((item) => {
    const aspectRatio = (item.width || 4) / (item.height || 3);
    const itemWidth = rowHeight * aspectRatio;
    
    if (currentRowWidth + itemWidth > maxRowWidth && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [item];
      currentRowWidth = itemWidth;
    } else {
      currentRow.push(item);
      currentRowWidth += itemWidth;
    }
  });
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return (
    <div className="space-y-4" role="list" aria-label="Galeria justificada">
      {rows.map((row, rowIndex) => {
        const totalAspect = row.reduce((sum, item) => sum + (item.width || 4) / (item.height || 3), 0);
        const rowWidth = maxRowWidth - margin * 2 * row.length;
        const scale = rowWidth / (rowHeight * totalAspect);
        
        return (
          <div key={rowIndex} className="flex gap-2 justify-center" role="listitem">
            {row.map((item) => {
              const aspectRatio = (item.width || 4) / (item.height || 3);
              const width = Math.round(rowHeight * aspectRatio * scale);
              return (
                <MediaItem
                  key={item.id}
                  media={item}
                  gallery={gallery}
                  width={width}
                  height={Math.round(rowHeight * scale)}
                  priority={rowIndex === 0}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}