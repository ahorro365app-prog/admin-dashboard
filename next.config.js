/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica para Vercel
  output: 'standalone',
  
  // Optimización de imágenes
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configuración de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuración de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuración de trailing slash
  trailingSlash: false,
  
  // Configuración de powered by header
  poweredByHeader: false,
  
  // Configuración de react strict mode
  reactStrictMode: true,
  
  // Configuración de swc minify
  swcMinify: true,
  
  // Redirecciones
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig