import { auth } from '@/lib/auth';
import { getCloudProvidersByUser } from '@/lib/db/queries/galleries';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';
import { FolderOpen, Key, Shield, ExternalLink, Settings, Plus, LogOut, Edit } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const providers = await getCloudProvidersByUser(session.user.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Provedores de nuvem conectados
          </CardTitle>
          <CardDescription>Gerencie suas conexões com Google Drive</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum provedor conectado</p>
              <Link href="/admin/galleries/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Conectar Google Drive
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{provider.displayName || provider.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        Conectado em {formatDateTime(provider.connectedAt)}
                        {provider.isDefault && ' · Padrão'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.isDefault && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Padrão
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Desconectar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança da conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticação de dois fatores</p>
              <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alterar senha</p>
              <p className="text-sm text-muted-foreground">Atualize sua senha periodicamente</p>
            </div>
            <Button variant="outline">Alterar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader className="border-destructive">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ExternalLink className="h-5 w-5" />
            Zona de perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="destructive" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}