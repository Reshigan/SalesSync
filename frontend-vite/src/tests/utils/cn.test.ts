import { describe, it, expect } from 'vitest'
import { cn } from '../../utils/cn'

describe('cn (classNames) Utility Tests', () => {
  it('should merge single class', () => {
    expect(cn('p-4')).toBe('p-4')
  })
  it('should merge multiple classes', () => {
    const result = cn('p-4', 'text-red-500')
    expect(result).toContain('p-4')
    expect(result).toContain('text-red-500')
  })
  it('should handle conditional classes', () => {
    const result = cn('p-4', true && 'text-red-500', false && 'hidden')
    expect(result).toContain('p-4')
    expect(result).toContain('text-red-500')
    expect(result).not.toContain('hidden')
  })
  it('should handle undefined', () => {
    const result = cn('p-4', undefined, 'text-red-500')
    expect(result).toContain('p-4')
    expect(result).toContain('text-red-500')
  })
  it('should handle null', () => {
    const result = cn('p-4', null, 'text-red-500')
    expect(result).toContain('p-4')
  })
  it('should handle empty string', () => {
    const result = cn('p-4', '', 'text-red-500')
    expect(result).toContain('p-4')
  })
  it('should merge conflicting tailwind classes', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })
  it('should merge conflicting text colors', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })
  it('should merge conflicting bg colors', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })
  it('should handle array input', () => {
    const result = cn(['p-4', 'text-red-500'])
    expect(result).toContain('p-4')
  })
  it('should handle object input', () => {
    const result = cn({ 'p-4': true, 'text-red-500': true, 'hidden': false })
    expect(result).toContain('p-4')
    expect(result).toContain('text-red-500')
    expect(result).not.toContain('hidden')
  })
  it('should handle mixed inputs', () => {
    const result = cn('p-4', { 'text-red-500': true }, ['bg-white'])
    expect(result).toContain('p-4')
  })
  it('should handle no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })
  it('should handle all false conditionals', () => {
    const result = cn(false && 'p-4', false && 'text-red-500')
    expect(result).toBe('')
  })
  it('should handle responsive classes', () => {
    const result = cn('p-4', 'md:p-8', 'lg:p-12')
    expect(result).toContain('p-4')
    expect(result).toContain('md:p-8')
    expect(result).toContain('lg:p-12')
  })
  it('should handle hover states', () => {
    const result = cn('bg-blue-500', 'hover:bg-blue-600')
    expect(result).toContain('bg-blue-500')
    expect(result).toContain('hover:bg-blue-600')
  })
  it('should handle focus states', () => {
    const result = cn('border-gray-300', 'focus:border-blue-500', 'focus:ring-2')
    expect(result).toContain('focus:border-blue-500')
  })
  it('should handle dark mode classes', () => {
    const result = cn('bg-white', 'dark:bg-gray-800')
    expect(result).toContain('bg-white')
    expect(result).toContain('dark:bg-gray-800')
  })
  const classTests = [
    ['flex', 'items-center', 'justify-between'],
    ['w-full', 'h-screen', 'min-h-0'],
    ['text-sm', 'font-medium', 'leading-6'],
    ['border', 'rounded-lg', 'shadow-sm'],
    ['transition-all', 'duration-200', 'ease-in-out'],
    ['grid', 'grid-cols-3', 'gap-4'],
  ]
  test.each(classTests)('should merge classes: %s, %s, %s', (...classes) => {
    const result = cn(...classes)
    classes.forEach((cls) => {
      expect(result).toContain(cls)
    })
  })
})
