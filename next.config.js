const path = require('path')

/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

// Sentry es opcional - solo se usa si está instalado y configurado
let withSentryConfig = null
try {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig
} catch (error) {
  // Sentry no está instalado o no está disponible - continuar sin él
  console.warn('⚠️ @sentry/nextjs no está disponible, continuando sin Sentry')
}

const nextConfig = {
  // Configuración básica para despliegue (solo en producción)
  ...(isProduction ? { output: 'standalone' } : {}),

  // Directorio de build (evita conflictos con permisos en .next durante desarrollo)
  distDir: isProduction ? '.next' : '.next-dev',
  
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

  // Configuración de webpack para resolver path aliases
  webpack: (config) => {
    // Resolver path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: blob:;
              connect-src 'self' ${process.env.NEXT_PUBLIC_CORE_API_URL ? process.env.NEXT_PUBLIC_CORE_API_URL.replace(/\/$/, '') : 'http://localhost:3000'} https://*.supabase.co wss://*.supabase.co https://*.sentry.io;
              font-src 'self' https://fonts.gstatic.com;
              frame-src 'self';
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ]
  },
  
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

// Configuración de Sentry
const sentryWebpackPluginOptions = {
  // Silenciar logs durante el build (opcional)
  silent: true,
  // Organización y proyecto de Sentry (se obtienen del DSN)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps (solo en producción)
  widenClientFileUpload: true,
  // Ocultar source maps del bundle final
  hideSourceMaps: true,
  // Deshabilitar source maps en desarrollo
  disableServerWebpackPlugin: !isProduction,
  disableClientWebpackPlugin: !isProduction,
  // Configuración de source maps
  sourcemaps: {
    assets: './.next/**',
    ignore: ['node_modules'],
    deleteSourceMapsAfterUpload: true,
  },
}

// Exportar con configuración de Sentry (si está disponible)
if (withSentryConfig) {
  module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
} else {
  // Si Sentry no está disponible, exportar configuración normal
  module.exports = nextConfig
}