// Test setup and configuration
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { server } from './mocks/server'

// Configure testing library
configure({ testIdAttribute: 'data-testid' })

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3001'

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
}))

// Mock Notification API
global.Notification = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
}))
Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true,
})
Object.defineProperty(Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
})

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  },
  writable: true,
})

// Setup MSW server
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})
afterAll(() => server.close())

// Global test utilities
export const mockGeolocationSuccess = (coords: {
  latitude: number
  longitude: number
  accuracy?: number
}) => {
  mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
    success({
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy || 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  )
}

export const mockGeolocationError = (error: GeolocationPositionError) => {
  mockGeolocation.getCurrentPosition.mockImplementationOnce((_, error_callback) =>
    error_callback(error)
  )
}

export const createMockUser = () => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'FIELD_AGENT',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createMockCustomer = () => ({
  id: 'customer-1',
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+1234567890',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  customerType: 'RETAIL' as const,
  status: 'ACTIVE' as const,
  latitude: 40.7128,
  longitude: -74.0060,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createMockVisit = () => ({
  id: 'visit-1',
  customerId: 'customer-1',
  agentId: 'user-1',
  scheduledDate: new Date().toISOString(),
  status: 'SCHEDULED' as const,
  visitType: 'SALES' as const,
  purpose: 'Product demonstration',
  notes: 'Test visit notes',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createMockBoard = () => ({
  id: 'board-1',
  customerId: 'customer-1',
  agentId: 'user-1',
  boardType: 'BANNER',
  size: '4x8',
  brand: 'Test Brand',
  status: 'ACTIVE' as const,
  placementDate: new Date().toISOString(),
  photos: ['photo1.jpg', 'photo2.jpg'],
  coverageScore: 85,
  commissionAmount: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createMockProduct = () => ({
  id: 'product-1',
  name: 'Test Product',
  category: 'SIM_CARD',
  brand: 'Test Brand',
  price: 29.99,
  commissionRate: 0.1,
  status: 'ACTIVE' as const,
  description: 'Test product description',
  specifications: { color: 'blue', size: 'standard' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const createMockCommission = () => ({
  id: 'commission-1',
  agentId: 'user-1',
  type: 'BOARD_PLACEMENT' as const,
  amount: 100,
  status: 'PENDING' as const,
  description: 'Board placement commission',
  referenceId: 'board-1',
  calculatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))