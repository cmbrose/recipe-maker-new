import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize bundle size
  experimental: {
    serverMinification: true,
  },
  
  // Keep OpenTelemetry external to avoid bundling issues
  serverExternalPackages: [
    '@azure/monitor-opentelemetry',
  ],
};

export default nextConfig;
