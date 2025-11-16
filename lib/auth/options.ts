import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { isEmailAllowed } from '@/lib/auth/allowlist';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth environment variables are not configured');
}

if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set');
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      const allowed = await isEmailAllowed(user.email);

      if (!allowed) {
        console.warn(`Sign-in blocked: ${user.email ?? 'unknown email'} is not allowlisted`);
        return false;
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? undefined;
      }
      return session;
    },
  },
};
