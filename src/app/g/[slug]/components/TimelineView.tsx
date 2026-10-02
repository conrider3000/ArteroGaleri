'use client';

import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { formatMonthYear, getYear } from '@/lib/utils/date';
import { MediaItem } from './MediaItem';

interface Props {
  media: Media[];
  gallery: any;
}

export function TimelineView({ media, gallery }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>Nenhuma mídia encontrada</p>
      </div>
    );
  }

  const mediaWithDate = media.filter(m => m.dateTaken);
  const grouped = new Map<string, Media[]>();

  mediaWithDate.forEach(item => {
    if (!item.dateTaken) return;
    const key = formatMonthYear(item.dateTaken);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  const sortedMonths = Array.from(grouped.keys()).sort((a, b) => 
    new Date(b + ' 01').getTime() - new Date(a + ' 01').getTime()
  );

  const years = new Set(sortedMonths.map(m => getYear(new Date(m + ' 01'))));

  return (
    <div className="flex gap-6">
      <aside className="w-24 flex-shrink-0 sticky top-24 self-start">
        <nav className="space-y-1" aria-label="Anos">
          {Array.from(years).sort((a, b) => b - a).map(year => (
            <button
              key={year}
              className={cn(
                'w-full text-left px-2 py-1 text-sm rounded transition-colors',
                'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {year}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 space-y-8">
        {sortedMonths.map((monthKey, index) => {
          const items = grouped.get(monthKey)!;
          return (
            <section key={monthKey} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b pb-2">
                {monthKey}
              </h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((item) => (
                  <MediaItem
                    key={item.id}
                    media={item}
                    gallery={gallery}
                    width={200}
                    height={Math.round(200 / ((item.width || 4) / (item.height || 3)))}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}