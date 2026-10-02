'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FolderOpen, ChevronRight, Loader2, Save, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

interface FormData {
  providerId: string;
  title: string;
  sourceFolderId: string;
  sourceDriveId: string;
  accessMode: 'public' | 'unlisted' | 'password';
  password: string;
  allowedEmails: string;
  requireEmailVerification: boolean;
  allowDownload: boolean;
  maxResolution: 'full' | 'preview' | 'grid';
  defaultView: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  theme: string;
  showMetadata: boolean;
  showMap: boolean;
}

export default function NewGalleryPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [currentPath, setCurrentPath] = useState<DriveFolder[]>([{ id: 'root', name: 'Meu Drive' }]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [providers, setProviders] = useState<Array<{ id: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      accessMode: 'unlisted',
      password: '',
      allowedEmails: '',
      requireEmailVerification: false,
      allowDownload: true,
      maxResolution: 'full',
      defaultView: 'justified',
      sortBy: 'dateTaken',
      sortDir: 'desc',
      theme: 'system',
      showMetadata: true,
      showMap: false,
    },
  });

  const selectedProvider = watch('providerId');

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFolders = async (folderId: string, driveId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folderId });
      if (driveId) params.set('driveId', driveId);
      const res = await fetch(`/api/admin/folders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder: DriveFolder) => {
    const newPath = [...currentPath, folder];
    setCurrentPath(newPath);
    setCurrentFolderId(folder.id);
    await fetchFolders(folder.id, watch('sourceDriveId'));
  };

  const handlePathClick = async (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    const folderId = newPath[newPath.length - 1].id;
    setCurrentFolderId(folderId === 'root' ? 'root' : folderId);
    await fetchFolders(folderId === 'root' ? 'root' : folderId, watch('sourceDriveId'));
  };

  const onSubmit = async (data: FormData) => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { gallery } = await res.json();
        router.push(`/admin/galleries/${gallery.id}`);
      } else {
        alert('Erro ao criar galeria');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao criar galeria');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Galeria</h1>
          <p className="text-muted-foreground">Selecione uma pasta do Drive e configure o acesso</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Provedor e Pasta</CardTitle>
            <CardDescription>Escolha o provedor conectado e a pasta que será a galeria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="providerId">Provedor</Label>
              <Select {...register('providerId', { required: true })} onValueChange={async (v) => {
                setValue('providerId', v);
                setValue('sourceDriveId', '');
                setCurrentFolderId('root');
                setCurrentPath([{ id: 'root', name: 'Meu Drive' }]);
                await fetchFolders('root');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.providerId && <p className="text-sm text-destructive">Selecione um provedor</p>}
            </div>

            <div>
              <Label>Pasta de origem</Label>
              <div className="mb-2 flex flex-wrap gap-1 text-sm">
                {currentPath.map((segment, i) => (
                  <span key={segment.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <button
                      type="button"
                      onClick={() => handlePathClick(i)}
                      className={i === currentPath.length - 1
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground'}
                    >
                      {segment.name}
                    </button>
                  </span>
                ))}
              </div>
              <div className="border rounded-lg p-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : folders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma pasta encontrada</p>
                ) : (
                  <ul className="space-y-1">
                    {folders.map((folder) => (
                      <li key={folder.id}>
                        <button
                          type="button"
                          onClick={() => handleFolderClick(folder)}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-accent"
                        >
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{folder.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Input
                type="hidden"
                {...register('sourceFolderId', { required: true })}
                value={currentFolderId === 'root' ? '' : currentFolderId}
              />
              {errors.sourceFolderId && <p className="text-sm text-destructive">Selecione uma pasta</p>}
            </div>

            <div>
              <Label htmlFor="sourceDriveId">Shared Drive (opcional)</Label>
              <Input
                id="sourceDriveId"
                placeholder="ID do Shared Drive"
                {...register('sourceDriveId')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Título e Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da galeria</Label>
              <Input {...register('title', { required: true })} placeholder="Minha Galeria" />
              {errors.title && <p className="text-sm text-destructive">Título é obrigatório</p>}
            </div>

            <div>
              <Label>Modo de acesso</Label>
              <Select {...register('accessMode')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público (indexável)</SelectItem>
                  <SelectItem value="unlisted">Não listado (link secreto)</SelectItem>
                  <SelectItem value="password">Com senha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watch('accessMode') === 'password' && (
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  type="password"
                  id="password"
                  {...register('password', { required: true, minLength: 8 })}
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.password && <p className="text-sm text-destructive">Senha mínima 8 caracteres</p>}
              </div>
            )}

            <div>
              <Label>E-mails permitidos (um por linha, opcional)</Label>
              <textarea
                {...register('allowedEmails')}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="email1@exemplo.com&#10;email2@exemplo.com"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                {...register('requireEmailVerification')}
                id="requireEmailVerification"
              />
              <Label htmlFor="requireEmailVerification">Exigir verificação por e-mail (OTP)</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opções avançadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="allowDownload">Permitir download do original</Label>
              <Switch {...register('allowDownload')} id="allowDownload" />
            </div>
            <div>
              <Label htmlFor="maxResolution">Resolução máxima</Label>
              <Select {...register('maxResolution')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Original completo</SelectItem>
                  <SelectItem value="preview">Até 1920px (preview)</SelectItem>
                  <SelectItem value="grid">Apenas grid (800px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultView">Visualização padrão</Label>
              <Select {...register('defaultView')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="justified">Justificado</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                  <SelectItem value="slideshow">Apresentação</SelectItem>
                  <SelectItem value="folders">Árvore de pastas</SelectItem>
                  <SelectItem value="map">Mapa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Ordenar por</Label>
              <Select {...register('sortBy')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateTaken">Data da foto</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="size">Tamanho</SelectItem>
                  <SelectItem value="camera">Câmera</SelectItem>
                  <SelectItem value="random">Aleatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortDir">Direção</Label>
              <Select {...register('sortDir')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Decrescente (mais novo primeiro)</SelectItem>
                  <SelectItem value="asc">Crescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="theme">Tema</Label>
              <Select {...register('theme')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch {...register('showMetadata')} id="showMetadata" />
              <Label htmlFor="showMetadata">Mostrar metadados (EXIF)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch {...register('showMap')} id="showMap" />
              <Label htmlFor="showMap">Mostrar mapa (se houver GPS)</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={creating}>
            <Save className="mr-2 h-4 w-4" />
            {creating ? 'Criando...' : 'Criar Galeria'}
          </Button>
        </div>
      </form>
    </div>
  );
}