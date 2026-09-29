import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { encryptToken } from '@/lib/crypto/tokens';

const hasDatabase = process.env.DATABASE_URL && process.env.NEXT_PHASE !== 'phase-production-build';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: hasDatabase ? DrizzleAdapter(db) : undefined,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && account.refresh_token && hasDatabase) {
        const encryptedRefresh = await encryptToken(account.refresh_token);
        const encryptedAccess = account.access_token ? await encryptToken(account.access_token) : null;
        
        await db.insert(schema.cloudProviders).values({
          userId: user.id!,
          provider: 'google_drive',
          displayName: user.name || user.email || '',
          encryptedRefreshToken: encryptedRefresh,
          encryptedAccessToken: encryptedAccess,
          tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
          scope: account.scope,
          isDefault: true,
        }).onConflictDoUpdate({
          target: [schema.cloudProviders.userId, schema.cloudProviders.provider],
          set: {
            encryptedRefreshToken: encryptedRefresh,
            encryptedAccessToken: encryptedAccess,
            tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope,
            updatedAt: new Date(),
          },
        });
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.providerId = account.providerAccountId;
        if (hasDatabase) {
          const provider = await db.query.cloudProviders.findFirst({
            where: (providers, { eq, and }) => and(
              eq(providers.userId, user.id!),
              eq(providers.provider, 'google_drive')
            ),
          });
          token.cloudProviderId = provider?.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).cloudProviderId = token.cloudProviderId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      cloudProviderId?: string;
    };
  }
}