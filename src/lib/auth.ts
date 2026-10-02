import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { encryptToken } from '@/lib/crypto/tokens';
import { eq } from 'drizzle-orm';

const hasDatabase = !!process.env.DATABASE_URL && process.env.NEXT_PHASE !== 'phase-production-build';

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      if (account?.provider === 'google' && hasDatabase) {
        try {
          let dbUser = await db.query.users.findFirst({
            where: eq(schema.users.googleSub, account.providerAccountId),
          });

          if (!dbUser && user.email) {
            dbUser = await db.query.users.findFirst({
              where: eq(schema.users.email, user.email),
            });
          }

          if (!dbUser) {
            const [created] = await db.insert(schema.users).values({
              googleSub: account.providerAccountId,
              email: user.email!,
              name: user.name,
              avatarUrl: user.image,
            }).returning();
            dbUser = created;
            user.id = dbUser.id;
          } else {
            user.id = dbUser.id;
            await db.update(schema.users).set({
              name: user.name,
              avatarUrl: user.image,
              updatedAt: new Date(),
            }).where(eq(schema.users.id, dbUser.id));
          }

          if (account.refresh_token) {
            const encryptedRefresh = await encryptToken(account.refresh_token);
            const encryptedAccess = account.access_token ? await encryptToken(account.access_token) : null;

            await db.insert(schema.cloudProviders).values({
              userId: dbUser.id,
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
        } catch (e) {
          console.error('signIn callback error:', e);
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.providerId = account.providerAccountId;
        token.email = user.email;
      }

      if (hasDatabase) {
        const email = token.email as string | undefined;
        const googleSub = token.providerId as string | undefined;
        if (email || googleSub) {
          try {
            let dbUser = googleSub
              ? await db.query.users.findFirst({ where: eq(schema.users.googleSub, googleSub) })
              : undefined;
            if (!dbUser && email) {
              dbUser = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
            }

            if (dbUser) {
              token.sub = dbUser.id;
              token.userId = dbUser.id;

              const provider = await db.query.cloudProviders.findFirst({
                where: eq(schema.cloudProviders.userId, dbUser.id),
              });
              token.cloudProviderId = provider?.id;
              token.hasDrive = !!provider?.encryptedRefreshToken;
            }
          } catch (e) {
            console.error('jwt callback error:', e);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) || token.sub!;
        (session.user as any).cloudProviderId = token.cloudProviderId as string;
        (session.user as any).hasDrive = token.hasDrive as boolean;
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