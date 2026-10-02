import { auth } from '@/lib/auth';
import { getGalleryById, getMediaPage, updateGallerySyncStatus } from '@/lib/db/queries/galleries';
import { syncGalleryChunk } from '@/lib/sync/indexer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDateTime, formatRelative } from '@/lib/utils/date';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Edit, Trash2, ExternalLink, RefreshCw, Eye, Lock, Globe, 
  Play, Pause, Loader2, FolderOpen, Image, Video, Settings,
  ChevronLeft, ChevronRight, BarChart2, CloudUpload
} from 'lucide-react';
import { Suspense } from 'react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GalleryDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const { id } = await params;
  const gallery = await getGalleryById(id);
  
  if (!gallery || gallery.ownerId !== session.user.id) {
    redirect('/admin/galleries');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/galleries" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold">{gallery.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/g/${gallery.slug}`} target="_blank" rel="noopener">
            <Button variant="ghost" size="sm" className="gap-1">
              <Eye className="h-3 w-3" />
              Ver galeria
            </Button>
          </Link>
          <Link href={`/admin/galleries/${gallery.id}/edit`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Edit className="h-3 w-3" />
              Editar
            </Button>
          </Link>
<form action="/admin/galleries/delete" method="POST" onSubmit={(e) => { if (!confirm('Tem certeza?')) e.preventDefault(); }}>
              <input type="hidden" name="id" value={gallery.id} />
              <Button type="submit" variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sincroniza├º├úo</CardTitle>
                <CardDescription>Sincronize as fotos do Google Drive</CardDescription>
              </div>
              <SyncStatus gallery={gallery} />
            </CardHeader>
            <CardContent>
              <SyncProgress gallery={gallery} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>M├¡dia recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentMedia gallery={gallery} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informa├º├Áes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Acesso</dt>
                  <dd className="font-medium capitalize">{gallery.accessMode}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pasta Drive</dt>
                  <dd className="font-medium text-truncate max-w-[200px]">{gallery.sourcePath || gallery.sourceFolderId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Visualiza├º├úo padr├úo</dt>
                  <dd className="font-medium capitalize">{gallery.settings?.defaultView || 'justified'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ordena├º├úo</dt>
                  <dd className="font-medium">{gallery.settings?.sortBy || 'dateTaken'} ({gallery.settings?.sortDir || 'desc'})</dd>
                </div>
                {gallery.expiresAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Expira em</dt>
                    <dd className="font-medium">{new Date(gallery.expiresAt).toLocaleDateString('pt-BR')}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader className="border-destructive">
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Zona de perigo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action="/admin/galleries/delete" method="POST" onSubmit={(e) => { if (!confirm('Tem certeza que deseja excluir esta galeria? Esta a├º├úo n├úo pode ser desfeita.')) e.preventDefault(); }}>
                <input type="hidden" name="id" value={gallery.id} />
                <Button type="submit" variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir galeria
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Isso remove a galeria e todos os metadados indexados. As fotos no Google Drive <strong>n├úo</strong> s├úo afetadas.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SyncStatus({ gallery }: { gallery: any }) {
  const statusColors: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusLabels: Record<string, string> = {
    idle: 'Parado',
    running: 'Sincronizando...',
    completed: 'Conclu├¡do',
    failed: 'Erro',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[gallery.syncStatus] || statusColors.idle}`}>
      {gallery.syncStatus === 'running' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {statusLabels[gallery.syncStatus] || 'Desconhecido'}
    </span>
  );
}

function SyncProgress({ gallery }: { gallery: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progresso</span>
        <span className="font-medium">
          {gallery.syncStatus === 'running' 
            ? `Sincronizando...` 
            : gallery.lastSyncedAt 
              ? `├Ültima sync: ${formatDistanceToNow(new Date(gallery.lastSyncedAt), { addSuffix: true, locale: ptBR })}` 
              : 'Nunca sincronizado'}
        </span>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${gallery.syncStatus === 'running' ? 'bg-blue-500 animate-pulse' : gallery.syncStatus === 'completed' ? 'bg-green-500' : gallery.syncStatus === 'failed' ? 'bg-red-500' : 'bg-muted-foreground/50'}`}
          style={{ width: gallery.syncStatus === 'running' ? '50%' : gallery.syncStatus === 'completed' ? '100%' : '0%' }}
        />
      </div>

      <SyncActions galleryId={gallery.id} />
    </div>
  );
}

function SyncActions({ galleryId }: { galleryId: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => window.location.reload()}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Sincronizar agora
      </Button>
      <Button variant="outline" size="sm">
        <BarChart2 className="mr-1 h-3 w-3" />
        Logs
      </Button>
    </div>
  );
}

function RecentMedia({ gallery }: { gallery: any }) {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <RecentMediaInner gallery={gallery} />
    </Suspense>
  );
}

async function RecentMediaInner({ gallery }: { gallery: any }) {
  const { items } = await getMediaPage({ galleryId: gallery.id, limit: 12 });
  
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Image className="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>Nenhuma m├¡dia indexada ainda</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sincronizar
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item: any) => (
        <Link key={item.id} href={`/g/${gallery.slug}`} target="_blank" rel="noopener" className="group block aspect-square rounded-lg overflow-hidden bg-muted transition-shadow hover:shadow-lg">
          <div className="relative aspect-square overflow-hidden">
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}/g/${gallery.id}/thumb/${item.id}.webp`}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {item.kind === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-8 w-8 text-white/90 drop-shadow-lg" />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs">
            {item.dateTaken && new Date(item.dateTaken).toLocaleDateString('pt-BR')}
          </div>
        </Link>
      ))}
    </div>
  );
}