import { NextResponse } from 'next/server';

// Simple health check that doesn't use database
export async function GET() {
  console.log('[Health Check] Starting...');
  
  try {
    // Test if Prisma can be imported
    const startTime = Date.now();
    
    // Don't actually connect, just test import
    const { PrismaClient } = await import('@prisma/client');
    const importTime = Date.now() - startTime;
    
    console.log(`[Health Check] Prisma imported in ${importTime}ms`);
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      prismaImportTime: importTime,
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        hasCosmosConnection: !!process.env.COSMOS_DB_CONNECTION_STRING,
      }
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
