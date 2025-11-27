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
    async redirect({ url, baseUrl }) {
      // Check if this is an MCP OAuth flow by looking at the return URL
      // NextAuth will redirect back to the page the user was on
      // For MCP OAuth, we need to redirect to the callback endpoint

      // This callback receives the url that NextAuth wants to redirect to
      // We check if the user came from the MCP OAuth login flow
      // by checking if the URL contains our callback path

      // For MCP OAuth flows, redirect to our callback endpoint
      // which will handle completing the OAuth flow
      try {
        const parsedUrl = new URL(url, baseUrl);
        if (parsedUrl.pathname === '/api/mcp/oauth/callback' && parsedUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        // Invalid URL, continue with default logic
      }

      // For regular auth flows, use default behavior
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
});
