/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  eslint: {
    // Allow warnings during build, only fail on errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow warnings during build, only fail on errors
    ignoreBuildErrors: false,
  },
  // Allow cross-origin requests for development
  allowedDevOrigins: [
    'work-1-ifgxvhjrlkroyxsp.prod-runtime.all-hands.dev',
    'work-2-ifgxvhjrlkroyxsp.prod-runtime.all-hands.dev'
  ],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
