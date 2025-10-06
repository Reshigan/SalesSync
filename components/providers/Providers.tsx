'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './AuthProvider'
import { PWAProvider } from './PWAProvider'
import { OfflineProvider } from './OfflineProvider'
import { NotificationProvider } from './NotificationProvider'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 401/403 errors
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            return false
          }
          return failureCount < 3
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <PWAProvider>
        <OfflineProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </OfflineProvider>
      </PWAProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}