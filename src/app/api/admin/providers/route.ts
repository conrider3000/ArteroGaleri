import { auth } from '@/lib/auth';
import { getCloudProvidersByUser } from '@/lib/db/queries/galleries';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providers = await getCloudProvidersByUser(session.user.id);
  return NextResponse.json(providers.map(p => ({ id: p.id, name: p.displayName || p.provider })));
}