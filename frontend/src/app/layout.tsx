import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'SalesSync - Van Sales Management',
  description: 'Enterprise Field Force Platform for Van Sales Operations',
  keywords: 'van sales, field force, sales management, enterprise, CRM',
  authors: [{ name: 'SalesSync Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'SalesSync - Van Sales Management',
    description: 'Enterprise Field Force Platform for Van Sales Operations',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/favicon.ico" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Performance hints */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
