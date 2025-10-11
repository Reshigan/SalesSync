/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Performance optimizations for Team X2 speed
  experimental: {
    swcMinify: true,
    optimizeCss: true,
    serverComponents: true,
    turbo: {
      loaders: {
        '.svg': ['@svgr/webpack'],
      },
    },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Build optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          services: {
            test: /[\\/]src[\\/]services[\\/]/,
            name: 'services',
            chunks: 'all',
            priority: 8,
          },
          components: {
            test: /[\\/]src[\\/]components[\\/]/,
            name: 'components',
            chunks: 'all',
            priority: 7,
          },
        },
      }
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/types': path.resolve(__dirname, 'src/types'),
    }

    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  },

  // Image optimization
  images: {
    domains: ['localhost', 'api.salessync.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ]
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BUILD_TIME: new Date().toISOString(),
  },

  // Performance settings
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  optimizeFonts: true,
  swcMinify: true,

  // Modularize imports for better tree shaking
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
  },
}

module.exports = nextConfig
