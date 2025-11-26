import { useEffect, useRef } from 'react'

/**
 * Hook to mark a page as ready for testing/interaction
 * Sets data-page-ready="true" on the main container when data is loaded
 * 
 * Usage:
 * const pageRef = usePageReady(isLoading)
 * <div ref={pageRef}>...</div>
 */
export function usePageReady(isReady: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (ref.current && isReady) {
      ref.current.setAttribute('data-page-ready', 'true')
    } else if (ref.current && !isReady) {
      ref.current.removeAttribute('data-page-ready')
    }
  }, [isReady])
  
  return ref
}

/**
 * Hook to set page ready state on document body
 * Useful for pages that don't have a single container
 */
export function usePageReadyGlobal(isReady: boolean) {
  useEffect(() => {
    if (isReady) {
      document.body.setAttribute('data-page-ready', 'true')
    } else {
      document.body.removeAttribute('data-page-ready')
    }
    
    return () => {
      document.body.removeAttribute('data-page-ready')
    }
  }, [isReady])
}
