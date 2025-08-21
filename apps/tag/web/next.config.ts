import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    webSocketServer: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Desabilitar WebSockets em desenvolvimento
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
