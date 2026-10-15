import { auth } from '@/lib/auth';
import { getGalleryWithDetails } from '@/lib/db/queries/galleries';
import { redirect } from 'next/navigation';
import GalleryClient from './GalleryClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const gallery = await getGalleryWithDetails(slug);
  if (!gallery) {
    redirect('/404');
  }

  const hasAccess = await checkGalleryAccess(gallery, session?.user?.id);
  if (!hasAccess) {
    redirect(`/g/${slug}/auth`);
  }

  return <GalleryClient gallery={gallery} />;
}

async function checkGalleryAccess(gallery: any, userId?: string): Promise<boolean> {
  if (gallery.accessMode === 'public') return true;

  if (userId && gallery.ownerId === userId) return true;

  return true;
}
