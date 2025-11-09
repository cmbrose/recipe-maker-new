// instrumentation.ts - Next.js instrumentation file
// This runs before the app starts and sets up Application Insights telemetry

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on Node.js runtime (server-side)
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    
    if (connectionString) {
      console.log('[Instrumentation] Setting up Application Insights...');
      
      try {
        const { useAzureMonitor } = await import('@azure/monitor-opentelemetry');
        
        useAzureMonitor({
          azureMonitorExporterOptions: {
            connectionString,
          },
          samplingRatio: 1.0, // 100% sampling for debugging, reduce in production
        });
        
        console.log('[Instrumentation] Application Insights configured successfully');
      } catch (error) {
        console.error('[Instrumentation] Failed to configure Application Insights:', error);
      }
    } else {
      console.warn('[Instrumentation] APPLICATIONINSIGHTS_CONNECTION_STRING not set, telemetry disabled');
    }
  }
}
