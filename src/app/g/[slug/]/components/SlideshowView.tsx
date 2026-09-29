'use client';

import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { MediaItem } from './MediaItem';
import { ChevronLeft, ChevronRight, Play, Pause, X, Expand } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface Props {
  media: Media[];
  gallery: any;
}

export function SlideshowView({ media, gallery }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p>Nenhuma mídia encontrada</p>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, media.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % media.length);
    if (e.key === ' ') { e.preventDefault(); setIsPlaying(!isPlaying); }
    if (e.key === 'Escape') { setIsFullscreen(false); setShowControls(true); }
    if (e.key === 'f') setIsFullscreen(!isFullscreen);
  }, [isPlaying, media.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentMedia = media[currentIndex];
  const previewUrl = currentMedia.previewKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/preview/${currentMedia.id}.webp`
    : `/api/thumb/${currentMedia.id}/preview`;

  return (
    <div className="relative h-[calc(100vh-200px)] min-h-[500px]">
      <div
        className={cn(
          'relative w-full h-full bg-black',
          isFullscreen && 'fixed inset-0 z-50'
        )}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {currentMedia.kind === 'video' ? (
          <video
            src={`/api/stream/${currentMedia.id}`}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={previewUrl}
            alt={currentMedia.name}
            className="w-full h-full object-contain"
          />
        )}

        {showControls && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white',
                'hover:bg-black/70 transition-colors',
                media.length <= 1 && 'invisible'
              )}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % media.length)}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white',
                'hover:bg-black/70 transition-colors',
                media.length <= 1 && 'invisible'
              )}
              aria-label="Próximo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-sm">
                {currentIndex + 1} / {media.length}
              </span>
              <span className="text-white/70 text-sm max-w-xs truncate">
                {currentMedia.name}
              </span>
              {currentMedia.dateTaken && (
                <span className="text-white/50 text-xs">
                  {new Date(currentMedia.dateTaken).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              <Expand className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-16 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto pb-4 px-4" role="tablist">
          {media.slice(Math.max(0, currentIndex - 5), currentIndex + 6).map((item, i) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={currentIndex === i + Math.max(0, currentIndex - 5)}
              onClick={() => { setCurrentIndex(i + Math.max(0, currentIndex - 5)); setIsPlaying(false); }}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all',
                currentIndex === i + Math.max(0, currentIndex - 5)
                  ? 'border-primary scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/thumb/${item.id}.webp`}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}