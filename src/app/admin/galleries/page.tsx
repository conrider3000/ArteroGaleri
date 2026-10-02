import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';
import { getGalleriesByOwner } from '@/lib/db/queries/galleries';
import { Edit, Trash2, ExternalLink, RefreshCw, Eye, Lock, Globe, GalleryVertical, Plus } from 'lucide-react';

interface GalleryWithCount {
  id: string;
  title: string;
  slug: string;
  sourceFolderId: string;
  sourceDriveId: string | null;
  sourcePath: string | null;
  accessMode: string;
  settings: any;
  updatedAt: Date;
  _count?: { media: number };
  provider: any;
}

export default async function GalleriesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const galleries = await getGalleriesByOwner(session.user.id) as GalleryWithCount[];

  const accessIcons = {
    public: Globe,
    unlisted: ExternalLink,
    password: Lock,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Minhas Galerias</h1>
        <Link href="/admin/galleries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Galeria
          </Button>
        </Link>
      </div>

      {galleries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <GalleryVertical className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Nenhuma galeria ainda</h3>
            <p className="mb-4 text-muted-foreground">
              Conecte seu Google Drive e crie sua primeira galeria.
            </p>
            <Link href="/admin/galleries/new">
              <Button>Criar primeira galeria</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <Card key={gallery.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gallery.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {gallery._count?.media || 0} mídia · Atualizado {formatDateTime(gallery.updatedAt)}
                    </p>
                  </div>
                  <AccessIcon mode={gallery.accessMode} />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Pasta: <code className="text-xs bg-muted px-1 rounded">{gallery.sourcePath || gallery.sourceFolderId}</code>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{gallery.settings?.defaultView || 'justified'}</span>
                  <span>·</span>
                  <span>{gallery.settings?.sortBy || 'dateTaken'}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Link href={`/g/${gallery.slug}`} target="_blank" rel="noopener">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    Ver
                  </Button>
                </Link>
                <Link href={`/admin/galleries/${gallery.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                  <RefreshCw className="h-3 w-3" />
                  Sync
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive ml-auto">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessIcon({ mode }: { mode: string }) {
  const icons = { public: Globe, unlisted: ExternalLink, password: Lock };
  const Icon = icons[mode as keyof typeof icons] || Globe;
  return (
    <span className="rounded-full bg-primary/10 p-1.5 text-primary" title={mode}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
