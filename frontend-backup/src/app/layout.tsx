import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SalesSync - Van Sales Management',
  description: 'Enterprise Field Force Platform for Van Sales Operations',
  keywords: 'van sales, field force, sales management, enterprise, CRM',
  authors: [{ name: 'SalesSync Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
