import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, GalleryVertical, Settings, LogOut, FolderOpen, Plus } from 'lucide-react';

const navigation = [
  { name: 'Galerias', href: '/admin/galleries', icon: GalleryVertical },
  { name: 'Nova Galeria', href: '/admin/galleries/new', icon: Plus },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/admin/galleries" className="flex items-center gap-2 font-bold text-xl">
            <FolderOpen className="h-6 w-6" />
            Artero Galeri
          </Link>
          <nav className="flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="ghost" size="icon" className="h-9 w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  );
}
