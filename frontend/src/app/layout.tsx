import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SalesSync - Advanced Field Force Management',
  description: 'Complete field force management platform with Van Sales, Promotions, Merchandising, and more',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}