/**
 * MCP OAuth Client Registration Endpoint
 * POST /api/mcp/oauth/register
 * Allows clients to register for OAuth access
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOAuthProvider } from '@/lib/mcp/oauth/provider';

export async function POST(request: NextRequest) {
  try {
    // Require authentication to register clients
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          error_description: 'Authentication required to register OAuth clients',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { client_name, redirect_uris } = body;

    // Validate required parameters
    if (!client_name || !redirect_uris || !Array.isArray(redirect_uris)) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing or invalid required parameters: client_name, redirect_uris',
        },
        { status: 400 }
      );
    }

    // Validate redirect URIs
    for (const uri of redirect_uris) {
      try {
        new URL(uri);
      } catch {
        return NextResponse.json(
          {
            error: 'invalid_request',
            error_description: `Invalid redirect URI: ${uri}`,
          },
          { status: 400 }
        );
      }
    }

    const provider = getOAuthProvider();

    // Register the client
    const client = await provider.registerClient(client_name, redirect_uris);

    return NextResponse.json({
      client_id: client.id,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      created_at: client.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('OAuth client registration error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'server_error',
        error_description: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp/oauth/register
 * List all registered OAuth clients
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication to list clients
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          error_description: 'Authentication required to list OAuth clients',
        },
        { status: 401 }
      );
    }

    const provider = getOAuthProvider();

    // List all clients
    const clients = await provider.listClients();

    return NextResponse.json({
      clients: clients.map(client => ({
        client_id: client.id,
        client_name: client.name,
        redirect_uris: client.redirectUris,
        created_at: client.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('OAuth client listing error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'server_error',
        error_description: errorMessage,
      },
      { status: 500 }
    );
  }
}
