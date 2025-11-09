import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize bundle size
  experimental: {
    serverMinification: true,
  },
  
  // Keep Prisma external to avoid bundling issues
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
};

export default nextConfig;
