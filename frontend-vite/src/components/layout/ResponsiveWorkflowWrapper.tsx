import { ReactNode } from 'react'
import { useIsMobile } from '../../hooks/useMediaQuery'

interface ResponsiveWorkflowWrapperProps {
  mobileComponent: ReactNode
  desktopComponent: ReactNode
}

export default function ResponsiveWorkflowWrapper({
  mobileComponent,
  desktopComponent,
}: ResponsiveWorkflowWrapperProps) {
  const isMobile = useIsMobile()
  
  return <>{isMobile ? mobileComponent : desktopComponent}</>
}
