// Comprehensive Theme and Customization Service
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  colors: ThemeColors
  typography: {
    fontFamily: string
    fontSize: 'small' | 'medium' | 'large'
    fontWeight: 'normal' | 'medium' | 'bold'
  }
  layout: {
    sidebarWidth: number
    headerHeight: number
    borderRadius: number
    spacing: number
  }
  animations: {
    enabled: boolean
    duration: 'fast' | 'normal' | 'slow'
    easing: string
  }
  accessibility: {
    highContrast: boolean
    reducedMotion: boolean
    focusVisible: boolean
    screenReader: boolean
  }
}

export interface BrandTheme {
  id: string
  name: string
  brandId?: string
  config: ThemeConfig
  isDefault: boolean
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

// Default theme configurations
const lightTheme: ThemeColors = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  accent: '#10B981',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
}

const darkTheme: ThemeColors = {
  primary: '#60A5FA',
  secondary: '#9CA3AF',
  accent: '#34D399',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA'
}

const defaultThemeConfig: ThemeConfig = {
  mode: 'auto',
  colors: lightTheme,
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 'medium',
    fontWeight: 'normal'
  },
  layout: {
    sidebarWidth: 256,
    headerHeight: 64,
    borderRadius: 8,
    spacing: 16
  },
  animations: {
    enabled: true,
    duration: 'normal',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    screenReader: false
  }
}

interface ThemeStore {
  currentTheme: ThemeConfig
  availableThemes: BrandTheme[]
  isLoading: boolean
  
  // Actions
  setTheme: (theme: Partial<ThemeConfig>) => void
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void
  setColors: (colors: Partial<ThemeColors>) => void
  setTypography: (typography: Partial<ThemeConfig['typography']>) => void
  setLayout: (layout: Partial<ThemeConfig['layout']>) => void
  setAnimations: (animations: Partial<ThemeConfig['animations']>) => void
  setAccessibility: (accessibility: Partial<ThemeConfig['accessibility']>) => void
  
  // Theme management
  loadTheme: (themeId: string) => Promise<void>
  saveTheme: (name: string, brandId?: string) => Promise<BrandTheme>
  deleteTheme: (themeId: string) => Promise<void>
  resetTheme: () => void
  
  // System theme detection
  detectSystemTheme: () => 'light' | 'dark'
  applySystemTheme: () => void
  
  // CSS generation
  generateCSS: () => string
  applyCSSVariables: () => void
}

// Create theme store
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: defaultThemeConfig,
      availableThemes: [],
      isLoading: false,

      setTheme: (theme) => {
        set((state) => ({
          currentTheme: { ...state.currentTheme, ...theme }
        }))
        get().applyCSSVariables()
      },

      setThemeMode: (mode) => {
        set((state) => ({
          currentTheme: { ...state.currentTheme, mode }
        }))
        
        if (mode === 'auto') {
          get().applySystemTheme()
        } else {
          const colors = mode === 'dark' ? darkTheme : lightTheme
          set((state) => ({
            currentTheme: { ...state.currentTheme, colors }
          }))
        }
        
        get().applyCSSVariables()
      },

      setColors: (colors) => {
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            colors: { ...state.currentTheme.colors, ...colors }
          }
        }))
        get().applyCSSVariables()
      },

      setTypography: (typography) => {
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            typography: { ...state.currentTheme.typography, ...typography }
          }
        }))
        get().applyCSSVariables()
      },

      setLayout: (layout) => {
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            layout: { ...state.currentTheme.layout, ...layout }
          }
        }))
        get().applyCSSVariables()
      },

      setAnimations: (animations) => {
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            animations: { ...state.currentTheme.animations, ...animations }
          }
        }))
        get().applyCSSVariables()
      },

      setAccessibility: (accessibility) => {
        set((state) => ({
          currentTheme: {
            ...state.currentTheme,
            accessibility: { ...state.currentTheme.accessibility, ...accessibility }
          }
        }))
        get().applyCSSVariables()
      },

      loadTheme: async (themeId) => {
        set({ isLoading: true })
        try {
          // This would typically fetch from API
          const response = await fetch(`/api/themes/${themeId}`)
          const theme: BrandTheme = await response.json()
          
          set({ currentTheme: theme.config })
          get().applyCSSVariables()
        } catch (error) {
          console.error('Failed to load theme:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      saveTheme: async (name, brandId) => {
        const { currentTheme } = get()
        
        const themeData = {
          name,
          brandId,
          config: currentTheme,
          isCustom: true,
          isDefault: false
        }

        try {
          const response = await fetch('/api/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(themeData)
          })
          
          const savedTheme: BrandTheme = await response.json()
          
          set((state) => ({
            availableThemes: [...state.availableThemes, savedTheme]
          }))
          
          return savedTheme
        } catch (error) {
          console.error('Failed to save theme:', error)
          throw error
        }
      },

      deleteTheme: async (themeId) => {
        try {
          await fetch(`/api/themes/${themeId}`, { method: 'DELETE' })
          
          set((state) => ({
            availableThemes: state.availableThemes.filter(t => t.id !== themeId)
          }))
        } catch (error) {
          console.error('Failed to delete theme:', error)
          throw error
        }
      },

      resetTheme: () => {
        set({ currentTheme: defaultThemeConfig })
        get().applyCSSVariables()
      },

      detectSystemTheme: () => {
        if (typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return 'light'
      },

      applySystemTheme: () => {
        const systemTheme = get().detectSystemTheme()
        const colors = systemTheme === 'dark' ? darkTheme : lightTheme
        
        set((state) => ({
          currentTheme: { ...state.currentTheme, colors }
        }))
      },

      generateCSS: () => {
        const { currentTheme } = get()
        const { colors, typography, layout, animations, accessibility } = currentTheme

        return `
          :root {
            /* Colors */
            --color-primary: ${colors.primary};
            --color-secondary: ${colors.secondary};
            --color-accent: ${colors.accent};
            --color-background: ${colors.background};
            --color-surface: ${colors.surface};
            --color-text: ${colors.text};
            --color-text-secondary: ${colors.textSecondary};
            --color-border: ${colors.border};
            --color-success: ${colors.success};
            --color-warning: ${colors.warning};
            --color-error: ${colors.error};
            --color-info: ${colors.info};
            
            /* Typography */
            --font-family: ${typography.fontFamily};
            --font-size-base: ${typography.fontSize === 'small' ? '14px' : typography.fontSize === 'large' ? '18px' : '16px'};
            --font-weight-base: ${typography.fontWeight === 'normal' ? '400' : typography.fontWeight === 'medium' ? '500' : '600'};
            
            /* Layout */
            --sidebar-width: ${layout.sidebarWidth}px;
            --header-height: ${layout.headerHeight}px;
            --border-radius: ${layout.borderRadius}px;
            --spacing: ${layout.spacing}px;
            
            /* Animations */
            --animation-duration: ${animations.duration === 'fast' ? '150ms' : animations.duration === 'slow' ? '500ms' : '300ms'};
            --animation-easing: ${animations.easing};
            
            /* Accessibility */
            --focus-ring: ${accessibility.focusVisible ? '2px solid var(--color-primary)' : 'none'};
            --motion-reduce: ${accessibility.reducedMotion ? 'reduce' : 'no-preference'};
          }
          
          ${accessibility.highContrast ? `
            * {
              border-color: var(--color-text) !important;
            }
            
            .text-secondary {
              color: var(--color-text) !important;
            }
          ` : ''}
          
          ${!animations.enabled || accessibility.reducedMotion ? `
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          ` : ''}
        `
      },

      applyCSSVariables: () => {
        if (typeof document !== 'undefined') {
          const css = get().generateCSS()
          
          // Remove existing theme styles
          const existingStyle = document.getElementById('theme-variables')
          if (existingStyle) {
            existingStyle.remove()
          }
          
          // Add new theme styles
          const style = document.createElement('style')
          style.id = 'theme-variables'
          style.textContent = css
          document.head.appendChild(style)
          
          // Update body classes for theme mode
          const { currentTheme } = get()
          document.body.className = document.body.className
            .replace(/theme-(light|dark|auto)/g, '')
            .concat(` theme-${currentTheme.mode}`)
        }
      }
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({
        currentTheme: state.currentTheme
      })
    }
  )
)

// Theme service class
class ThemeService {
  private store = useThemeStore

  // Initialize theme system
  init() {
    // Apply saved theme on load
    this.store.getState().applyCSSVariables()
    
    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        const { currentTheme, applySystemTheme } = this.store.getState()
        if (currentTheme.mode === 'auto') {
          applySystemTheme()
        }
      })
    }
  }

  // Get available themes
  async getAvailableThemes(): Promise<BrandTheme[]> {
    try {
      const response = await fetch('/api/themes')
      const themes: BrandTheme[] = await response.json()
      
      this.store.setState({ availableThemes: themes })
      return themes
    } catch (error) {
      console.error('Failed to fetch themes:', error)
      return []
    }
  }

  // Create theme from brand colors
  createBrandTheme(brandColors: { primary: string; secondary: string }): Partial<ThemeConfig> {
    return {
      colors: {
        ...lightTheme,
        primary: brandColors.primary,
        secondary: brandColors.secondary,
        accent: brandColors.primary
      }
    }
  }

  // Generate theme preview
  generatePreview(config: ThemeConfig): string {
    return `
      <div style="
        background: ${config.colors.background};
        color: ${config.colors.text};
        font-family: ${config.typography.fontFamily};
        padding: 16px;
        border-radius: ${config.layout.borderRadius}px;
        border: 1px solid ${config.colors.border};
      ">
        <div style="
          background: ${config.colors.primary};
          color: white;
          padding: 8px 16px;
          border-radius: ${config.layout.borderRadius}px;
          margin-bottom: 8px;
        ">
          Primary Button
        </div>
        <div style="
          background: ${config.colors.surface};
          padding: 8px;
          border-radius: ${config.layout.borderRadius}px;
          margin-bottom: 8px;
        ">
          Surface Content
        </div>
        <div style="color: ${config.colors.textSecondary};">
          Secondary Text
        </div>
      </div>
    `
  }

  // Export theme configuration
  exportTheme(theme: ThemeConfig): string {
    return JSON.stringify(theme, null, 2)
  }

  // Import theme configuration
  importTheme(themeJson: string): ThemeConfig {
    try {
      const theme = JSON.parse(themeJson)
      // Validate theme structure
      if (!theme.colors || !theme.typography || !theme.layout) {
        throw new Error('Invalid theme format')
      }
      return theme
    } catch (error) {
      console.error('Failed to import theme:', error)
      throw new Error('Invalid theme file')
    }
  }

  // Get CSS custom properties
  getCSSProperties(theme: ThemeConfig): Record<string, string> {
    const properties: Record<string, string> = {}
    
    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      properties[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value
    })
    
    // Typography
    properties['--font-family'] = theme.typography.fontFamily
    properties['--font-size-base'] = theme.typography.fontSize === 'small' ? '14px' : 
                                    theme.typography.fontSize === 'large' ? '18px' : '16px'
    properties['--font-weight-base'] = theme.typography.fontWeight === 'normal' ? '400' : 
                                      theme.typography.fontWeight === 'medium' ? '500' : '600'
    
    // Layout
    properties['--sidebar-width'] = `${theme.layout.sidebarWidth}px`
    properties['--header-height'] = `${theme.layout.headerHeight}px`
    properties['--border-radius'] = `${theme.layout.borderRadius}px`
    properties['--spacing'] = `${theme.layout.spacing}px`
    
    return properties
  }
}

const themeService = new ThemeService()
export default themeService
export { ThemeService }