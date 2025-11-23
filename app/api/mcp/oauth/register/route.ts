import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mcpOAuthProvider } from '@/lib/mcp/oauth/provider';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const redirect_uris = body.redirect_uris as string[] | undefined;
  const client_name = body.client_name as string | undefined;
  const client_id = body.client_id as string | undefined;
  const client_secret = body.client_secret as string | undefined;

  try {
    const client = await mcpOAuthProvider.registerClient({
      redirect_uris: redirect_uris || [],
      client_name,
      client_id,
      client_secret: client_secret || randomUUID(),
    });

    return NextResponse.json({
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uris: client.redirect_uris,
      client_name: client.client_name,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'invalid_client_metadata',
      error_description: error instanceof Error ? error.message : 'Unable to register client',
    }, { status: 400 });
  }
}
