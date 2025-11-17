import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/services/user-service";
import { AuthError } from "@/lib/constants/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // Update session every 24 hours
  },
  // trustHost is enabled in development for localhost support
  // In production, AUTH_URL is explicitly set to https://brose-recipes.com
  trustHost: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user's email is in the allowlist
      if (!user.email) {
        console.warn("⚠️  Sign-in denied: No email provided");
        // Redirect to error page instead of returning false to avoid verbose error logging
        return `/auth/error?error=${AuthError.CONFIGURATION}`;
      }

      const allowed = await isEmailAllowed(user.email);

      if (!allowed) {
        console.warn(`⚠️  Sign-in denied: ${user.email} not in allowlist`);
        // Redirect to error page instead of returning false to avoid verbose error logging
        return `/auth/error?error=${AuthError.ACCESS_DENIED}`;
      }

      console.log(`✓ Sign-in allowed: ${user.email}`);
      return true;
    },
  },
});
