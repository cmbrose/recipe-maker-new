import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use standalone for Azure Static Web Apps
  // Azure SWA has its own managed runtime
  
  // Optimize bundle size
  experimental: {
    serverMinification: true,
    optimizePackageImports: ['@prisma/client'],
  },
  
  // Ensure Prisma client is included in server bundle
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
};

export default nextConfig;
