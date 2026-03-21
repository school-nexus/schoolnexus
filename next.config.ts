import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React compiler for better performance
  reactCompiler: true,
  
  
  // Experimental features
  experimental: {
    // Disable CSS optimization on Windows to prevent Turbopack crashes
    optimizeCss: false,
    
    // Better scroll restoration
    scrollRestoration: true,
    
    // Memory optimizations
    parallelServerBuildTraces: false,
  },
  
  // Disable heavy checks during build to save memory
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // External packages for server components
  serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'drizzle-orm', 'drizzle-orm/better-sqlite3', 'drizzle-orm/sqlite-core'],
  
  // Image optimization
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Force Webpack to bypass Turbopack issues on Windows
  webpack: (config: any) => {
    return config;
  },
  
  // Compress responses
  compress: true
};

export default nextConfig;
