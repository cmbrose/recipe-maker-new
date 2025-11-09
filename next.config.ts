import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize bundle size
  experimental: {
    serverMinification: true,
  },
  
  // Keep Prisma and OpenTelemetry external to avoid bundling issues
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/engines',
    '@azure/monitor-opentelemetry',
  ],
};

export default nextConfig;
