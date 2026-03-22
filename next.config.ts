import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React compiler for better performance
  reactCompiler: true,
  
  
  // Experimental features
  experimental: {
    // Disable CSS optimization on Windows to prevent Turbopack crashes
    optimizeCss: false,
    
    // Better scroll restoration
    serverMinification: true,
    optimizePackageImports: [
        'lucide-react',
        'framer-motion',
        'recharts',
        'date-fns',
        '@radix-ui/react-icons',
        'lodash'
    ],
    // Memory optimizations
    parallelServerBuildTraces: false,
  },
  
  // Disable heavy checks during build to save memory
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // External packages for server components
  serverExternalPackages: [
      'better-sqlite3',
      'sqlite3',
      'electron',
      'bcryptjs',
      'jsonwebtoken',
      'postgres',
      'xlsx',
      'jspdf',
      'html2canvas'
  ],
  
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
  
  // Compress responses
  compress: true
};

export default nextConfig;
