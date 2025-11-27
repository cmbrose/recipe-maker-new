import { NextRequest, NextResponse } from 'next/server';
import { buildProtectedResourceMetadata } from '@/lib/mcp/oauth/metadata';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const metadata = buildProtectedResourceMetadata(request.url);
  return NextResponse.json(metadata);
}
