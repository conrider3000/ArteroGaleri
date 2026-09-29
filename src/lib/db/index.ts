import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle<typeof schema>>;

if (databaseUrl && process.env.NEXT_PHASE !== 'phase-production-build') {
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
} else {
  // Create a minimal mock db for build time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db = {
    query: {},
    select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => [] }) }) }) }),
    insert: () => ({ values: () => ({ returning: () => [], onConflictDoUpdate: () => {} }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => {} }),
  } as any;
}

export { db };