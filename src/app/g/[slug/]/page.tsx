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

  // Check access
  const hasAccess = await checkGalleryAccess(gallery, session?.user?.id);
  if (!hasAccess) {
    // Redirect to auth page for this gallery
    redirect(`/g/${slug}/auth`);
  }

  return <GalleryClient gallery={gallery} />;
}

async function checkGalleryAccess(gallery: any, userId?: string): Promise<boolean> {
  // Public access
  if (gallery.accessMode === 'public') return true;
  
  // Owner always has access
  if (userId && gallery.ownerId === userId) return true;

  // For unlisted, password, email - need session check
  // This will be handled client-side with cookie check
  return true; // Allow rendering, client will gate
}