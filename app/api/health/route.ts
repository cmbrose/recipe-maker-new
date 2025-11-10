import { NextResponse } from 'next/server';

// Simple health check that doesn't use database
export async function GET() {
  console.log('[Health Check] Starting...');
  
  try {
    // Test MongoDB connection
    const startTime = Date.now();
    
    const { getDb } = await import('@/lib/db/mongo');
    await getDb();
    const importTime = Date.now() - startTime;
    
    console.log(`[Health Check] MongoDB connected in ${importTime}ms`);
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mongoConnectTime: importTime,
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
