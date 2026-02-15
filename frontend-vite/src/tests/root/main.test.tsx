import { describe, it, expect, vi } from 'vitest'
import React from 'react'

// Ensure a #root exists
beforeAll(() => {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
})

// Mocks
const renderSpy = vi.fn()
vi.mock('react-dom/client', () => ({
  default: { createRoot: vi.fn(() => ({ render: renderSpy })) },
  createRoot: vi.fn(() => ({ render: renderSpy })),
}))

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => React.createElement('div', { 'data-testid': 'router' }, children),
}))

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => React.createElement('div', { 'data-testid': 'rq' }, children),
}))

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => React.createElement('div', { 'data-testid': 'rq-devtools' }),
}))

vi.mock('react-hot-toast', () => ({
  Toaster: () => React.createElement('div', { 'data-testid': 'toaster' }),
}))

vi.mock('../../App', () => ({
  default: () => React.createElement('div', null, 'AppRoot'),
}))

describe('main.tsx root render', () => {
  it('creates a root and renders the app tree', async () => {
    await import('../../main')
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
})
