import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { mcpOAuthProvider } from '@/lib/mcp/oauth/provider';
import { parseScopes } from '@/lib/mcp/oauth/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const form = isJson ? null : await request.formData();
  const jsonBody = isJson ? await request.json() : null;

  const grantType = isJson ? jsonBody?.grant_type : form?.get('grant_type');

  if (grantType === 'authorization_code') {
    const code = (isJson ? jsonBody?.code : form?.get('code'))?.toString();
    const clientId = (isJson ? jsonBody?.client_id : form?.get('client_id'))?.toString();
    const clientSecret = (isJson ? jsonBody?.client_secret : form?.get('client_secret'))?.toString();
    const redirectUri = (isJson ? jsonBody?.redirect_uri : form?.get('redirect_uri'))?.toString();
    const codeVerifier = (isJson ? jsonBody?.code_verifier : form?.get('code_verifier'))?.toString();

    if (!code || !clientId || !redirectUri || !codeVerifier) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing required parameters' }, { status: 400 });
    }

    const client = await mcpOAuthProvider.getClient(clientId);
    if (client?.client_secret) {
      if (!clientSecret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'client_secret is required for this client' },
          { status: 401 },
        );
      }

      const providedSecret = Buffer.from(clientSecret, 'utf-8');
      const storedSecret = Buffer.from(client.client_secret, 'utf-8');
      if (providedSecret.length !== storedSecret.length || !timingSafeEqual(providedSecret, storedSecret)) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'client_secret is invalid' },
          { status: 401 },
        );
      }
    }

    try {
      const tokens = await mcpOAuthProvider.exchangeAuthorizationCode({
        code,
        clientId,
        redirectUri,
        codeVerifier,
      });
      return NextResponse.json(tokens);
    } catch (error) {
      return NextResponse.json({ error: 'invalid_grant', error_description: error instanceof Error ? error.message : 'Unable to exchange code' }, { status: 400 });
    }
  }

  if (grantType === 'refresh_token') {
    const refreshToken = (isJson ? jsonBody?.refresh_token : form?.get('refresh_token'))?.toString();
    const clientId = (isJson ? jsonBody?.client_id : form?.get('client_id'))?.toString();
    const clientSecret = (isJson ? jsonBody?.client_secret : form?.get('client_secret'))?.toString();
    const scope = parseScopes((isJson ? jsonBody?.scope : form?.get('scope'))?.toString());
    const resource = (isJson ? jsonBody?.resource : form?.get('resource'))?.toString();

    if (!refreshToken || !clientId) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'refresh_token and client_id are required' }, { status: 400 });
    }

    const client = await mcpOAuthProvider.getClient(clientId);
    if (client?.client_secret) {
      if (!clientSecret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'client_secret is required for this client' },
          { status: 401 },
        );
      }

      const providedSecret = Buffer.from(clientSecret, 'utf-8');
      const storedSecret = Buffer.from(client.client_secret, 'utf-8');
      if (providedSecret.length !== storedSecret.length || !timingSafeEqual(providedSecret, storedSecret)) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'client_secret is invalid' },
          { status: 401 },
        );
      }
    }

    try {
      const tokens = await mcpOAuthProvider.exchangeRefreshToken({
        refreshToken,
        clientId,
        scopes: scope,
        resource: resource || undefined,
      });
      return NextResponse.json(tokens);
    } catch (error) {
      return NextResponse.json({ error: 'invalid_grant', error_description: error instanceof Error ? error.message : 'Unable to refresh token' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
}
