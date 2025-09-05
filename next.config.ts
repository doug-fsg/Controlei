import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    outputStandalone: true,
  },
};

export default nextConfig;
