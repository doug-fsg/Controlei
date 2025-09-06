import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build otimizado e leve
  output: 'standalone',
  
  // Otimizações de performance (swcMinify é padrão no Next.js 15+)
  compress: true,
  
  // Configurações para produção mais leve
  poweredByHeader: false,
  generateEtags: false,
  
  // TypeScript mais flexível para build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint mais flexível
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Otimizar imagens
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
