/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para build standalone (Docker)
  output: 'standalone',
  
  // Configurações para Easypanel
  experimental: {
    serverComponentsExternalPackages: ['node-thermal-printer']
  },
  
  // Configurações de imagem para produção
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig 