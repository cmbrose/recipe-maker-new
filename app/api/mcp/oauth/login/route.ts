/**
 * MCP OAuth Login Endpoint
 * GET /api/mcp/oauth/login?session=<session_id>
 * Redirects user to Google OAuth for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider } from '@/lib/mcp/oauth/provider';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session');

    if (!sessionId) {
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Missing session parameter</p></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const provider = getOAuthProvider();

    // Verify session exists
    const authRequest = provider.getPendingAuthorization(sessionId);
    if (!authRequest) {
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Invalid or expired session</p></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Build the callback URL that NextAuth will redirect to after authentication
    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const callbackUrl = `${baseUrl}/api/mcp/oauth/callback`;

    // Store session ID in cookie and redirect to Google OAuth with callback URL
    const signInUrl = new URL('/api/auth/signin', baseUrl);
    signInUrl.searchParams.set('callbackUrl', callbackUrl);

    const response = NextResponse.redirect(signInUrl);

    // Set cookie with session ID (expires in 1 hour)
    response.cookies.set('mcp_oauth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth login error:', error);
    return new NextResponse(
      '<html><body><h1>Error</h1><p>An error occurred during login</p></body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
