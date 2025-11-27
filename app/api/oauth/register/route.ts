import { NextRequest, NextResponse } from 'next/server';
import { mcpOAuthProvider } from '@/lib/mcp/oauth/provider';
import { isValidUrl } from '@/lib/mcp/oauth/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const redirect_uris = body.redirect_uris as string[] | undefined;
  const client_name = body.client_name as string | undefined;
  const client_secret = body.client_secret as string | undefined;

  if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return NextResponse.json(
      {
        error: 'invalid_client_metadata',
        error_description: 'At least one redirect_uri is required',
      },
      { status: 400 },
    );
  }

  if (redirect_uris.some((uri) => !isValidUrl(uri))) {
    return NextResponse.json(
      {
        error: 'invalid_client_metadata',
        error_description: 'All redirect_uris must be valid URLs',
      },
      { status: 400 },
    );
  }

  try {
    const client = await mcpOAuthProvider.registerClient({
      redirect_uris,
      client_name,
      client_secret,
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
