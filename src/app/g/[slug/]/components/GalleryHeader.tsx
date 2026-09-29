'use client';

import { Image, MapPin } from 'lucide-react';

interface GalleryHeaderProps {
  id: string;
  title: string;
  accessMode: string;
  expiresAt: Date | null;
  settings: any;
  _count?: { media: number };
}

export function GalleryHeader({ gallery }: { gallery: GalleryHeaderProps }) {
  const accessLabels = {
    public: 'Público',
    unlisted: 'Não listado',
    password: 'Protegido por senha',
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{gallery.title}</h1>
            <p className="text-sm text-muted-foreground">
              {accessLabels[gallery.accessMode as keyof typeof accessLabels] || gallery.accessMode}
              {gallery.expiresAt && ` · Expira em ${new Date(gallery.expiresAt).toLocaleDateString('pt-BR')}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Image className="h-4 w-4" /> {gallery._count?.media || 0} mídia
            </span>
            {gallery.settings?.showMap && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Mapa
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}