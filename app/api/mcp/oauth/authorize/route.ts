/**
 * MCP OAuth Authorization Endpoint
 * POST /api/mcp/oauth/authorize
 * Initiates the OAuth flow for MCP clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider } from '@/lib/mcp/oauth/provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      client_id,
      code_challenge,
      code_challenge_method,
      resource,
      redirect_uri,
      state,
    } = body;

    // Validate required parameters
    if (!client_id || !code_challenge || !code_challenge_method || !redirect_uri) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

    // Explicit type and length validation
    if (
      typeof client_id !== 'string' || client_id.length > 256 ||
      typeof code_challenge !== 'string' || code_challenge.length > 256 ||
      typeof redirect_uri !== 'string' || redirect_uri.length > 2048
    ) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Invalid parameter types or lengths',
        },
        { status: 400 }
      );
    }
    const provider = getOAuthProvider();

    // Initiate authorization
    const { sessionId, authUrl } = await provider.initiateAuthorization({
      clientId: client_id,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      resource,
      redirectUri: redirect_uri,
      state,
    });

    // Return authorization URL
    // The MCP client should direct the user to open this URL in their browser
    return NextResponse.json({
      authorization_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${authUrl}`,
      session_id: sessionId,
    });
  } catch (error) {
    console.error('OAuth authorization error:', error);

    // Do not leak internal error details to the client
    return NextResponse.json(
      {
        error: 'server_error',
        error_description: 'An internal error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
