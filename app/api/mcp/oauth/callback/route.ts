/**
 * MCP OAuth Callback Endpoint
 * GET /api/mcp/oauth/callback
 * Handles completion of OAuth flow after Google authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOAuthProvider } from '@/lib/mcp/oauth/provider';

export async function GET(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse(
        '<html><body><h1>Authentication Failed</h1><p>You must be logged in to authorize MCP access.</p></body></html>',
        {
          status: 401,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Get MCP OAuth session from cookie (try both dev and prod names)
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Host-mcp_oauth_session' : 'mcp_oauth_session';
    const mcpSessionId = request.cookies.get(cookieName)?.value;

    if (!mcpSessionId) {
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Missing OAuth session. Please start the authorization flow again.</p></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const provider = getOAuthProvider();

    // Complete authorization
    const { code, redirectUri, state } = await provider.completeAuthorization(
      mcpSessionId,
      {
        userId: session.user.email, // Using email as user ID
        userEmail: session.user.email,
      }
    );

    // Build redirect URL with authorization code
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    // Clear MCP OAuth session cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(cookieName);

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);

    // Do not leak internal error details to the user
    return new NextResponse(
      '<html><body><h1>Authorization Error</h1><p>An error occurred during authorization. Please try again.</p></body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
