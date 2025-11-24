/**
 * MCP OAuth Token Endpoint
 * POST /api/mcp/oauth/token
 * Exchanges authorization code for access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider } from '@/lib/mcp/oauth/provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      grant_type,
      code,
      client_id,
      code_verifier,
      redirect_uri,
    } = body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code grant type is supported',
        },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!code || !client_id || !code_verifier || !redirect_uri) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

    const provider = getOAuthProvider();

    // Exchange authorization code for access token
    const { accessToken, tokenType, expiresIn } =
      await provider.exchangeAuthorizationCode(
        code,
        client_id,
        code_verifier,
        redirect_uri
      );

    return NextResponse.json({
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn,
    });
  } catch (error) {
    console.error('OAuth token exchange error:', error);

    // Use generic error messages to avoid information disclosure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorCode = 'server_error';
    let errorDescription = 'An internal server error occurred.';

    // Use a generic message for all invalid_grant scenarios
    if (errorMessage.includes('Invalid') || errorMessage.includes('expired') || errorMessage.includes('mismatch') || errorMessage.includes('used')) {
      errorCode = 'invalid_grant';
      errorDescription = 'The provided authorization grant is invalid, expired, or has been revoked.';
    }

    return NextResponse.json(
      {
        error: errorCode,
        error_description: errorDescription,
      },
      { status: 400 }
    );
  }
}
