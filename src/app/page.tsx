import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Lock, Globe, Zap, Eye, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight">Artero Galeri</h1>
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm font-medium hover:underline">Entrar</Link>
            <Link href="/auth/signin">
              <Button>Começar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Suas fotos do Drive, <br /> transformadas em galeria.
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Conecte seu Google Drive, escolha as pastas e publique galerias bonitas
          com múltiplas visualizações. Sem upload, sem duplicação, privacidade total.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/signin">
            <Button size="lg" className="w-full sm:w-auto">
              Conectar Google Drive
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Ver demo
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <FolderOpen className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Sem upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fotos ficam no seu Drive. O app só indexa metadados e cria miniaturas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Múltiplas visualizações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Masonry, Justificado, Timeline, Apresentação, Pastas e Mapa.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Controle de acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Público, link secreto, senha ou lista de e-mails. Expiração opcional.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h3 className="mb-10 text-center text-3xl font-bold">Como funciona</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl">
              1
            </div>
            <h4 className="mb-2 font-semibold">Conecte</h4>
            <p className="text-muted-foreground">Autorize o app no Google Drive (somente leitura).</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl">
              2
            </div>
            <h4 className="mb-2 font-semibold">Selecione</h4>
            <p className="text-muted-foreground">Escolha as pastas que viram galerias.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl">
              3
            </div>
            <h4 className="mb-2 font-semibold">Compartilhe</h4>
            <p className="text-muted-foreground">Defina acesso e envie o link para quem quiser.</p>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>Artero Galeri — Suas fotos, sua galeria, seu controle.</p>
      </footer>
    </main>
  );
}