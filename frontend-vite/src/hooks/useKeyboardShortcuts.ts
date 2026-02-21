import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ShortcutHandler {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const shortcuts: ShortcutHandler[] = [
      { key: 'k', ctrl: true, handler: () => {
        const searchInput = document.getElementById('search-field')
        searchInput?.focus()
      }, description: 'Focus search' },
      { key: 'h', alt: true, handler: () => navigate('/'), description: 'Go to dashboard' },
      { key: 'o', alt: true, handler: () => navigate('/orders'), description: 'Go to orders' },
      { key: 'c', alt: true, handler: () => navigate('/customers'), description: 'Go to customers' },
      { key: 'p', alt: true, handler: () => navigate('/products'), description: 'Go to products' },
      { key: 'n', ctrl: true, shift: true, handler: () => {
        const path = window.location.pathname
        if (path.startsWith('/orders')) navigate('/orders/create')
        else if (path.startsWith('/customers')) navigate('/customers/create')
        else if (path.startsWith('/products')) navigate('/products/create')
      }, description: 'Create new (context-aware)' },
      { key: '?', shift: true, handler: () => {
        const helpBtn = document.querySelector('[data-tour="help-button"]') as HTMLButtonElement
        helpBtn?.click()
      }, description: 'Open help' },
    ]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (!(e.ctrlKey && e.key === 'k')) return
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
        const altMatch = shortcut.alt ? e.altKey : !e.altKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && altMatch && shiftMatch) {
          e.preventDefault()
          shortcut.handler()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Focus search' },
  { keys: ['Alt', 'H'], description: 'Go to dashboard' },
  { keys: ['Alt', 'O'], description: 'Go to orders' },
  { keys: ['Alt', 'C'], description: 'Go to customers' },
  { keys: ['Alt', 'P'], description: 'Go to products' },
  { keys: ['Ctrl', 'Shift', 'N'], description: 'Create new (context-aware)' },
  { keys: ['Shift', '?'], description: 'Open help' },
]
