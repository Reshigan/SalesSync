'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface OfflineData {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  data: any
  timestamp: number
}

interface OfflineContextType {
  isOnline: boolean
  pendingOperations: OfflineData[]
  addOfflineOperation: (operation: Omit<OfflineData, 'id' | 'timestamp'>) => void
  syncOfflineData: () => Promise<void>
  clearOfflineData: () => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingOperations, setPendingOperations] = useState<OfflineData[]>([])
  const queryClient = useQueryClient()

  useEffect(() => {
    // Load pending operations from localStorage
    const stored = localStorage.getItem('offline_operations')
    if (stored) {
      try {
        setPendingOperations(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading offline operations:', error)
      }
    }

    // Monitor online status
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      // Auto-sync when coming back online
      if (online && pendingOperations.length > 0) {
        syncOfflineData()
      }
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [pendingOperations.length])

  // Save operations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('offline_operations', JSON.stringify(pendingOperations))
  }, [pendingOperations])

  const addOfflineOperation = (operation: Omit<OfflineData, 'id' | 'timestamp'>) => {
    const newOperation: OfflineData = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    setPendingOperations(prev => [...prev, newOperation])
  }

  const syncOfflineData = async () => {
    if (!isOnline || pendingOperations.length === 0) return

    const operations = [...pendingOperations]
    const successfulOperations: string[] = []

    for (const operation of operations) {
      try {
        // Here you would implement the actual API calls based on operation type
        // For now, we'll simulate the sync
        await new Promise(resolve => setTimeout(resolve, 100))
        
        successfulOperations.push(operation.id)
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [operation.entity] })
        
        console.log(`Synced offline operation: ${operation.type} ${operation.entity}`)
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error)
        // Keep failed operations for retry
      }
    }

    // Remove successful operations
    setPendingOperations(prev => 
      prev.filter(op => !successfulOperations.includes(op.id))
    )
  }

  const clearOfflineData = () => {
    setPendingOperations([])
    localStorage.removeItem('offline_operations')
  }

  const value: OfflineContextType = {
    isOnline,
    pendingOperations,
    addOfflineOperation,
    syncOfflineData,
    clearOfflineData,
  }

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}