import { NextRequest, NextResponse } from 'next/server';
import { mcpOAuthProvider } from '@/lib/mcp/oauth/provider';
import { DEFAULT_SCOPES, parseScopes, resolveMcpUser } from '@/lib/mcp/oauth/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const responseType = searchParams.get('response_type');
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256';
  const scope = parseScopes(searchParams.get('scope') || DEFAULT_SCOPES.join(' '));
  const state = searchParams.get('state');
  const resource = searchParams.get('resource') || undefined;

  if (responseType !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 });
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'client_id, redirect_uri and code_challenge are required' }, { status: 400 });
  }

  if (codeChallengeMethod !== 'S256') {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Only S256 code_challenge_method is supported' }, { status: 400 });
  }

  const user = await resolveMcpUser();
  if (!user) {
    return NextResponse.json({
      error: 'login_required',
      error_description: 'You must be signed in via Google or provide MCP_OAUTH_TEST_USER_EMAIL for local testing.',
    }, { status: 401 });
  }

  try {
    const authorizationCode = await mcpOAuthProvider.issueAuthorizationCode({
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: 'S256',
      scopes: scope.length ? scope : DEFAULT_SCOPES,
      state,
      resource,
      user,
    });

    const redirectTarget = new URL(redirectUri);
    redirectTarget.searchParams.set('code', authorizationCode.code);
    if (state) {
      redirectTarget.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectTarget.toString());
  } catch (error) {
    return NextResponse.json({
      error: 'invalid_request',
      error_description: error instanceof Error ? error.message : 'Unable to issue authorization code',
    }, { status: 400 });
  }
}
