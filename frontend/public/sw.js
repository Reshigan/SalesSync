// SalesSync Service Worker
// Provides offline functionality, background sync, and push notifications

const CACHE_NAME = 'salessync-v1.0.0'
const STATIC_CACHE = 'salessync-static-v1.0.0'
const DYNAMIC_CACHE = 'salessync-dynamic-v1.0.0'
const API_CACHE = 'salessync-api-v1.0.0'

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/field-agents',
  '/field-agents/customers',
  '/field-agents/visits',
  '/field-agents/boards',
  '/field-agents/commissions',
  '/field-agents/distribution',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/customers',
  '/api/visits',
  '/api/boards',
  '/api/products',
  '/api/commissions',
  '/api/surveys'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('Service Worker: Preparing API cache')
        return Promise.resolve()
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      return self.clients.claim()
    })
  )
})

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static files and pages
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request))
    return
  }
  
  // Let other requests pass through
  event.respondWith(fetch(request))
})

// Handle API requests with cache-first strategy for GET, network-first for others
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    if (request.method === 'GET') {
      // Cache-first strategy for GET requests
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        console.log('Service Worker: Serving API from cache:', url.pathname)
        
        // Update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, response.clone())
            })
          }
        }).catch(() => {
          // Network error, keep using cached version
        })
        
        return cachedResponse
      }
      
      // Fetch from network and cache
      const networkResponse = await fetch(request)
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE)
        cache.put(request, networkResponse.clone())
        console.log('Service Worker: Cached API response:', url.pathname)
      }
      return networkResponse
      
    } else {
      // Network-first strategy for POST, PUT, DELETE
      const networkResponse = await fetch(request)
      
      // If successful, invalidate related cache entries
      if (networkResponse.ok) {
        await invalidateRelatedCache(url.pathname)
      }
      
      return networkResponse
    }
  } catch (error) {
    console.log('Service Worker: API request failed:', error)
    
    // For GET requests, try to serve from cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        console.log('Service Worker: Serving stale API data from cache')
        return cachedResponse
      }
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'Please check your internet connection',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url)
      return cachedResponse
    }
    
    // Fetch from network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      console.log('Service Worker: Cached resource:', request.url)
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Service Worker: Static request failed:', error)
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 })
    }
    
    return new Response('Resource unavailable offline', { status: 503 })
  }
}

// Invalidate related cache entries after mutations
async function invalidateRelatedCache(pathname) {
  const cache = await caches.open(API_CACHE)
  const keys = await cache.keys()
  
  const relatedKeys = keys.filter((request) => {
    const url = new URL(request.url)
    return url.pathname.startsWith(pathname.split('/').slice(0, 3).join('/'))
  })
  
  await Promise.all(relatedKeys.map((key) => cache.delete(key)))
  console.log('Service Worker: Invalidated', relatedKeys.length, 'cache entries')
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync-visits') {
    event.waitUntil(syncVisits())
  } else if (event.tag === 'background-sync-customers') {
    event.waitUntil(syncCustomers())
  } else if (event.tag === 'background-sync-boards') {
    event.waitUntil(syncBoardPlacements())
  } else if (event.tag === 'background-sync-products') {
    event.waitUntil(syncProductDistributions())
  } else if (event.tag === 'background-sync-surveys') {
    event.waitUntil(syncSurveys())
  }
})

// Sync offline visits
async function syncVisits() {
  try {
    const offlineVisits = await getOfflineData('visits')
    
    for (const visit of offlineVisits) {
      try {
        const response = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visit)
        })
        
        if (response.ok) {
          await removeOfflineData('visits', visit.id)
          console.log('Service Worker: Synced offline visit:', visit.id)
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync visit:', visit.id, error)
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed for visits:', error)
  }
}

// Sync offline customers
async function syncCustomers() {
  try {
    const offlineCustomers = await getOfflineData('customers')
    
    for (const customer of offlineCustomers) {
      try {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        })
        
        if (response.ok) {
          await removeOfflineData('customers', customer.id)
          console.log('Service Worker: Synced offline customer:', customer.id)
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync customer:', customer.id, error)
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed for customers:', error)
  }
}

// Sync offline board placements
async function syncBoardPlacements() {
  try {
    const offlineBoards = await getOfflineData('board-placements')
    
    for (const board of offlineBoards) {
      try {
        const response = await fetch('/api/boards/placements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(board)
        })
        
        if (response.ok) {
          await removeOfflineData('board-placements', board.id)
          console.log('Service Worker: Synced offline board placement:', board.id)
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync board placement:', board.id, error)
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed for board placements:', error)
  }
}

// Sync offline product distributions
async function syncProductDistributions() {
  try {
    const offlineProducts = await getOfflineData('product-distributions')
    
    for (const product of offlineProducts) {
      try {
        const response = await fetch('/api/products/distributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        })
        
        if (response.ok) {
          await removeOfflineData('product-distributions', product.id)
          console.log('Service Worker: Synced offline product distribution:', product.id)
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync product distribution:', product.id, error)
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed for product distributions:', error)
  }
}

// Sync offline surveys
async function syncSurveys() {
  try {
    const offlineSurveys = await getOfflineData('surveys')
    
    for (const survey of offlineSurveys) {
      try {
        const response = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(survey)
        })
        
        if (response.ok) {
          await removeOfflineData('surveys', survey.id)
          console.log('Service Worker: Synced offline survey:', survey.id)
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync survey:', survey.id, error)
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed for surveys:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (error) {
      data = { title: 'SalesSync', body: event.data.text() }
    }
  }
  
  const options = {
    title: data.title || 'SalesSync',
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: data.tag || 'general',
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200]
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'dismiss') {
    return
  }
  
  const data = event.notification.data || {}
  let url = '/'
  
  if (event.action === 'view' || !event.action) {
    if (data.url) {
      url = data.url
    } else if (data.type) {
      switch (data.type) {
        case 'visit':
          url = `/field-agents/visits/${data.id || ''}`
          break
        case 'customer':
          url = `/field-agents/customers/${data.id || ''}`
          break
        case 'board':
          url = `/field-agents/boards/${data.id || ''}`
          break
        case 'commission':
          url = `/field-agents/commissions/${data.id || ''}`
          break
        default:
          url = '/field-agents'
      }
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Utility functions for offline data management
async function getOfflineData(type) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['offline-data'], 'readonly')
    const store = transaction.objectStore('offline-data')
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allData = request.result || []
        const filteredData = allData.filter(item => item.type === type)
        resolve(filteredData.map(item => item.data))
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.log('Service Worker: Failed to get offline data:', error)
    return []
  }
}

async function removeOfflineData(type, id) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['offline-data'], 'readwrite')
    const store = transaction.objectStore('offline-data')
    const key = `${type}-${id}`
    store.delete(key)
  } catch (error) {
    console.log('Service Worker: Failed to remove offline data:', error)
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SalesSyncOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id' })
      }
    }
  })
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true })
    })
  }
})

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  console.log('Service Worker: All caches cleared')
}

console.log('Service Worker: Script loaded successfully')