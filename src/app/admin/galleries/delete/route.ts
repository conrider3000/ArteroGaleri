import { auth } from '@/lib/auth';
import { deleteGallery } from '@/lib/db/queries/galleries';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await deleteGallery(id);
    
    return NextResponse.redirect(new URL('/admin/galleries', request.url), 303);
  } catch (e) {
    console.error('Delete gallery error:', e);
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 });
  }
}