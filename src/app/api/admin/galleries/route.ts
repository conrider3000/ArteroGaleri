import { auth } from '@/lib/auth';
import { getGalleriesByOwner, createGallery } from '@/lib/db/queries/galleries';
import { generateSlug } from '@/lib/utils/slug';
import { hashPassword } from '@/lib/crypto/tokens';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createGallerySchema = z.object({
  providerId: z.string().uuid(),
  title: z.string().min(1).max(120),
  sourceFolderId: z.string().min(1),
  sourceDriveId: z.string().optional(),
  accessMode: z.enum(['public', 'unlisted', 'password']).default('unlisted'),
  password: z.string().min(8).max(128).optional(),
  allowedEmails: z.union([z.array(z.string().email()), z.string()])
    .optional()
    .transform(v =>
      Array.isArray(v)
        ? v
        : (v ?? '')
            .split(/[\n,]/)
            .map(s => s.trim())
            .filter(Boolean)
    ),
  requireEmailVerification: z.boolean().default(false),
  allowDownload: z.boolean().default(true),
  maxResolution: z.enum(['full', 'preview', 'grid']).default('full'),
  defaultView: z.enum(['masonry', 'justified', 'timeline', 'slideshow', 'folders', 'map']).default('justified'),
  sortBy: z.enum(['dateTaken', 'name', 'size', 'camera', 'random']).default('dateTaken'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  showMetadata: z.boolean().default(true),
  showMap: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const galleries = await getGalleriesByOwner(session.user.id);
  return NextResponse.json(galleries);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createGallerySchema.parse(body);

    const passwordHash = parsed.password ? await hashPassword(parsed.password) : null;
    const slug = generateSlug(parsed.title);

    const gallery = await createGallery({
      ownerId: session.user.id,
      providerId: parsed.providerId,
      title: parsed.title,
      slug,
      sourceFolderId: parsed.sourceFolderId,
      sourceDriveId: parsed.sourceDriveId,
      accessMode: parsed.accessMode,
      passwordHash,
      allowedEmails: parsed.allowedEmails,
      requireEmailVerification: parsed.requireEmailVerification,
      allowDownload: parsed.allowDownload,
      maxResolution: parsed.maxResolution,
      settings: {
        defaultView: parsed.defaultView,
        sortBy: parsed.sortBy,
        sortDir: parsed.sortDir,
        theme: parsed.theme,
        showMetadata: parsed.showMetadata,
        showMap: parsed.showMap,
      },
    });

    return NextResponse.json({ gallery });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Failed to create gallery' }, { status: 500 });
  }
}