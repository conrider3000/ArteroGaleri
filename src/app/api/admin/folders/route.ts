import { auth } from '@/lib/auth';
import { getCloudProvidersByUser } from '@/lib/db/queries/galleries';
import { createGoogleDriveSource } from '@/lib/drive/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');
  const driveId = searchParams.get('driveId') || undefined;

  if (!folderId) {
    return NextResponse.json({ error: 'folderId required' }, { status: 400 });
  }

  const providers = await getCloudProvidersByUser(session.user.id);
  const provider = providers.find(p => p.provider === 'google_drive');
  
  if (!provider) {
    return NextResponse.json({ error: 'No Google Drive connected' }, { status: 400 });
  }

  try {
    const source = createGoogleDriveSource(provider.id);
    const result = await source.listFiles({
      folderId,
      driveId,
      pageSize: 1000,
      orderBy: 'folder,name_natural',
      query: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id,name,parents),nextPageToken',
    });
    return NextResponse.json(result.files);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 });
  }
}