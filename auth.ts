import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isEmailAllowed } from "@/lib/services/user-service";

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
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user's email is in the allowlist
      if (!user.email) {
        console.log("Sign-in denied: No email provided");
        return false;
      }

      const allowed = await isEmailAllowed(user.email);

      if (!allowed) {
        console.log(`Sign-in denied: ${user.email} not in allowlist`);
        return false;
      }

      console.log(`Sign-in allowed: ${user.email}`);
      return true;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith("/api");

      if (isApiRoute) {
        // API routes are handled by their own middleware
        return true;
      }

      // Allow all page access
      return true;
    },
  },
});
