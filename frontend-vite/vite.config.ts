import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api')
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api/],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SalesSync - Van Sales Management',
        short_name: 'SalesSync',
        description: 'Enterprise Field Force Platform for Van Sales Operations',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        version: '1.0.' + Date.now(),
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 12000,
    cors: true,
    strictPort: false,
    allowedHosts: [
      'work-1-otdktmkeksbigpch.prod-runtime.all-hands.dev',
      'work-1-vmhjvymxmtxtzzmm.prod-runtime.all-hands.dev',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 12000
    },
    proxy: {
      '/api': {
        target: 'http://localhost:12001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log for debugging
            console.log('Proxying request to:', req.url)
            console.log('Original headers:', req.headers)
            
            // Forward X-Tenant-Code header from client, or set default
            const tenantCode = req.headers['x-tenant-code'] || 'DEMO'
            proxyReq.setHeader('X-Tenant-Code', tenantCode)
            
            console.log('Forwarding with X-Tenant-Code:', tenantCode)
          })
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 12000,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', 'lucide-react'],
          charts: ['recharts'],
          maps: ['@react-google-maps/api'],
          utils: ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    alias: {
      '../../services/api.service': path.resolve(__dirname, './src/tests/__mocks__/api.service.ts'),
    },
  },
})
