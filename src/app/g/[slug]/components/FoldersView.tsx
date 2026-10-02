'use client';

import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { FolderOpen, Image, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { MediaItem } from './MediaItem';

interface Props {
  media: Media[];
  gallery: any;
}

export function FoldersView({ media, gallery }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>Nenhuma mídia encontrada</p>
      </div>
    );
  }

  const grouped = new Map<string, Media[]>();
  media.forEach(item => {
    const folder = item.folderPath || 'Raiz';
    if (!grouped.has(folder)) grouped.set(folder, []);
    grouped.get(folder)!.push(item);
  });

  const sortedFolders = Array.from(grouped.keys()).sort();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(sortedFolders.slice(0, 3)));

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  return (
    <div className="space-y-6" role="tree" aria-label="Árvore de pastas">
      {sortedFolders.map((folder) => {
        const items = grouped.get(folder)!;
        const isExpanded = expandedFolders.has(folder);
        return (
          <section key={folder} className="space-y-3">
            <button
              onClick={() => toggleFolder(folder)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-lg font-medium rounded-lg',
                'hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              aria-expanded={isExpanded}
            >
              <FolderOpen className={cn('h-5 w-5 text-primary', isExpanded && 'rotate-90')} />
              <span>{folder}</span>
              <span className="ml-auto text-sm text-muted-foreground">{items.length} itens</span>
            </button>

            {isExpanded && (
              <div className="ml-6 space-y-4 border-l-2 border-border pl-4">
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {items.slice(0, 20).map((item) => (
                    <MediaItem
                      key={item.id}
                      media={item}
                      gallery={gallery}
                      width={200}
                      height={Math.round(200 / ((item.width || 4) / (item.height || 3)))}
                    />
                  ))}
                </div>
                {items.length > 20 && (
                  <p className="text-sm text-muted-foreground">
                    +{items.length - 20} itens a mais
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}