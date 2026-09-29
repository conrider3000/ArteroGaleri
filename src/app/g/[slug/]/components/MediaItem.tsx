'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Media } from '@/lib/db/schema';
import { formatDate, formatRelative } from '@/lib/utils/date';
import { Camera, MapPin, Star, Play, Expand, Download, Info } from 'lucide-react';

interface Props {
  media: Media;
  gallery: any;
  width: number;
  height: number;
  priority?: boolean;
}

export function MediaItem({ media, gallery, width, height, priority }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageError, setImageError] = useState(false);

  const thumbUrl = media.gridKey 
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/grid/${media.id}.webp`
    : media.thumbKey
      ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/thumb/${media.id}.webp`
      : `/api/thumb/${media.id}/grid`;

  const previewUrl = media.previewKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/preview/${media.id}.webp`
    : `/api/thumb/${media.id}/preview`;

  const isVideo = media.kind === 'video';

  const handleClick = () => {
    // Open lightbox
    window.dispatchEvent(new CustomEvent('open-lightbox', { detail: { media, gallery, index: 0 } }));
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/stream/${media.id}?download=true`, '_blank');
  };

  if (imageError) {
    return (
      <div
        className={cn(
          'relative rounded-lg bg-muted flex items-center justify-center',
          'border border-border'
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4 text-muted-foreground">
          {isVideo ? <Play className="mx-auto h-12 w-12" /> : <Info className="mx-auto h-12 w-12" />}
          <p className="mt-2 text-sm">Erro ao carregar</p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        'relative group rounded-lg overflow-hidden bg-muted transition-all duration-200',
        'hover:shadow-lg hover:z-10',
        isHovered && 'ring-2 ring-primary/50'
      )}
      style={{ width, height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      role="button"
      aria-label={media.name}
    >
      <div className="relative aspect-[1/1] overflow-hidden">
        {media.lqip && !imageError && (
          <img
            src={media.lqip}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-opacity duration-500"
            aria-hidden="true"
          />
        )}

        <img
          src={thumbUrl}
          alt={media.name}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImageError(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-transform duration-300',
            'group-hover:scale-105'
          )}
        />

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-12 w-12 text-white/90 drop-shadow-lg" />
          </div>
        )}

        {media.isStarred && (
          <div className="absolute top-2 right-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow" />
          </div>
        )}

        {gallery.settings?.showMetadata && media.dateTaken && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 px-2 py-1 text-xs text-white rounded">
            {formatDate(media.dateTaken)}
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3 pointer-events-none">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {media.cameraMake && (
              <span className="text-xs text-white/90 bg-black/50 px-2 py-1 rounded">
                {media.cameraMake} {media.cameraModel || ''}
              </span>
            )}
            {media.latitude && media.longitude && (
              <span className="flex items-center gap-1 text-xs text-white/90 bg-black/50 px-2 py-1 rounded">
                <MapPin className="h-3 w-3" />
                GPS
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {gallery.allowDownload && (
              <button
                onClick={handleDownload}
                className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowMetadata(!showMetadata); }}
              className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Info"
            >
              <Info className="h-4 w-4" />
            </button>
            <button
              onClick={handleClick}
              className="p-1.5 rounded bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Ver em tela cheia"
            >
              <Expand className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showMetadata && (
        <div className="absolute inset-0 bg-black/90 z-10 p-4 overflow-y-auto pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMetadata(false); }}
            className="absolute top-2 right-2 p-1 text-white/70 hover:text-white"
          >
            <Info className="h-5 w-5" />
          </button>
          <div className="space-y-2 text-sm text-white/90 max-w-xs">
            <p className="font-medium">{media.name}</p>
            {media.dateTaken && <p>Data: {formatDate(media.dateTaken)} ({formatRelative(media.dateTaken)})</p>}
            {media.cameraMake && <p>Câmera: {media.cameraMake} {media.cameraModel || ''}</p>}
            {media.lensModel && <p>Lente: {media.lensModel}</p>}
            {media.iso && <p>ISO: {media.iso}</p>}
            {media.aperture && <p>Abertura: f/{media.aperture}</p>}
            {media.shutterSpeed && <p>Velocidade: {media.shutterSpeed}s</p>}
            {media.focalLength && <p>Focal: {media.focalLength}mm</p>}
            {media.width && media.height && <p>Dimensões: {media.width} × {media.height}</p>}
            {media.sizeBytes && <p>Tamanho: {(media.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>}
            {media.latitude && media.longitude && (
              <p>GPS: {media.latitude}, {media.longitude}</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}