import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizationServerMetadata } from '@/lib/mcp/oauth/metadata';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const metadata = buildAuthorizationServerMetadata(request.url);
  return NextResponse.json(metadata);
}
