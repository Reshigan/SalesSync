import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export type ModuleType = 'operations' | 'sales' | 'marketing' | 'crm' | 'finance' | 'admin'

interface ModuleContextType {
  currentModule: ModuleType
  setCurrentModule: (module: ModuleType) => void
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [currentModule, setCurrentModule] = useState<ModuleType>('operations')
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    
    if (path.startsWith('/van-sales') || path.startsWith('/field-operations') || path.startsWith('/field-agents') || path.startsWith('/inventory')) {
      setCurrentModule('operations')
    } else if (path.startsWith('/orders') || path.startsWith('/sales') || path.startsWith('/finance/invoices') || path.startsWith('/finance/payments')) {
      setCurrentModule('sales')
    } else if (path.startsWith('/trade-marketing') || path.startsWith('/promotions') || path.startsWith('/campaigns')) {
      setCurrentModule('marketing')
    } else if (path.startsWith('/customers') || path.startsWith('/kyc') || path.startsWith('/surveys')) {
      setCurrentModule('crm')
    } else if (path.startsWith('/finance')) {
      setCurrentModule('finance')
    } else if (path.startsWith('/admin') || path.startsWith('/superadmin')) {
      setCurrentModule('admin')
    }
  }, [location.pathname])

  return (
    <ModuleContext.Provider value={{ currentModule, setCurrentModule }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModule() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider')
  }
  return context
}
