// WebSocket service for real-time notifications and updates
class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<Function>> = new Map()
  private isConnecting = false
  private shouldReconnect = true

  constructor() {
    this.connect()
  }

  // Connect to WebSocket server
  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.isConnecting = true
    
    try {
      // Use secure WebSocket in production, regular WebSocket in development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/ws`
      
      console.log('WebSocket: Connecting to', wsUrl)
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.onOpen.bind(this)
      this.ws.onmessage = this.onMessage.bind(this)
      this.ws.onclose = this.onClose.bind(this)
      this.ws.onerror = this.onError.bind(this)
      
    } catch (error) {
      console.error('WebSocket: Connection failed:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  // Handle connection open
  private onOpen(event: Event) {
    console.log('WebSocket: Connected successfully')
    this.isConnecting = false
    this.reconnectAttempts = 0
    
    // Send authentication token
    const token = localStorage.getItem('auth_token')
    if (token) {
      this.send({
        type: 'auth',
        token: token
      })
    }
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Notify listeners
    this.emit('connected', { timestamp: new Date().toISOString() })
  }

  // Handle incoming messages
  private onMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data)
      console.log('WebSocket: Message received:', data)
      
      // Handle different message types
      switch (data.type) {
        case 'notification':
          this.handleNotification(data)
          break
        case 'visit_update':
          this.handleVisitUpdate(data)
          break
        case 'customer_update':
          this.handleCustomerUpdate(data)
          break
        case 'board_update':
          this.handleBoardUpdate(data)
          break
        case 'commission_update':
          this.handleCommissionUpdate(data)
          break
        case 'agent_location':
          this.handleAgentLocation(data)
          break
        case 'system_alert':
          this.handleSystemAlert(data)
          break
        case 'pong':
          // Heartbeat response
          break
        default:
          console.log('WebSocket: Unknown message type:', data.type)
      }
      
      // Emit to specific listeners
      this.emit(data.type, data)
      this.emit('message', data)
      
    } catch (error) {
      console.error('WebSocket: Failed to parse message:', error)
    }
  }

  // Handle connection close
  private onClose(event: CloseEvent) {
    console.log('WebSocket: Connection closed:', event.code, event.reason)
    this.isConnecting = false
    this.stopHeartbeat()
    
    // Notify listeners
    this.emit('disconnected', { 
      code: event.code, 
      reason: event.reason,
      timestamp: new Date().toISOString()
    })
    
    // Attempt to reconnect if not intentionally closed
    if (this.shouldReconnect && event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  // Handle connection error
  private onError(event: Event) {
    console.error('WebSocket: Connection error:', event)
    this.isConnecting = false
    
    // Notify listeners
    this.emit('error', { 
      error: 'Connection error',
      timestamp: new Date().toISOString()
    })
  }

  // Schedule reconnection attempt
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket: Max reconnection attempts reached')
      this.emit('max_reconnect_attempts', {
        attempts: this.reconnectAttempts,
        timestamp: new Date().toISOString()
      })
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
    
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() })
      }
    }, 30000) // Send ping every 30 seconds
  }

  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Send message to server
  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data))
        console.log('WebSocket: Message sent:', data)
      } catch (error) {
        console.error('WebSocket: Failed to send message:', error)
      }
    } else {
      console.warn('WebSocket: Cannot send message, connection not open')
    }
  }

  // Subscribe to agent location updates
  public subscribeToAgentLocation(agentId: string) {
    this.send({
      type: 'subscribe_agent_location',
      agentId: agentId
    })
  }

  // Unsubscribe from agent location updates
  public unsubscribeFromAgentLocation(agentId: string) {
    this.send({
      type: 'unsubscribe_agent_location',
      agentId: agentId
    })
  }

  // Subscribe to visit updates
  public subscribeToVisitUpdates(visitId?: string) {
    this.send({
      type: 'subscribe_visits',
      visitId: visitId
    })
  }

  // Subscribe to customer updates
  public subscribeToCustomerUpdates(customerId?: string) {
    this.send({
      type: 'subscribe_customers',
      customerId: customerId
    })
  }

  // Subscribe to commission updates
  public subscribeToCommissionUpdates(agentId?: string) {
    this.send({
      type: 'subscribe_commissions',
      agentId: agentId
    })
  }

  // Send agent location update
  public sendLocationUpdate(location: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
  }) {
    this.send({
      type: 'location_update',
      ...location
    })
  }

  // Send visit status update
  public sendVisitStatusUpdate(visitId: string, status: string, data?: any) {
    this.send({
      type: 'visit_status_update',
      visitId: visitId,
      status: status,
      data: data,
      timestamp: new Date().toISOString()
    })
  }

  // Handle notification messages
  private handleNotification(data: any) {
    console.log('WebSocket: Notification received:', data)
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || 'SalesSync', {
        body: data.message || data.body,
        icon: '/icons/icon-192x192.png',
        tag: data.tag || 'general',
        data: data.data
      })
    }
    
    // Store notification for in-app display
    this.storeNotification(data)
  }

  // Handle visit update messages
  private handleVisitUpdate(data: any) {
    console.log('WebSocket: Visit update received:', data)
    
    // Update local visit data if available
    if (data.visit) {
      this.updateLocalData('visits', data.visit)
    }
  }

  // Handle customer update messages
  private handleCustomerUpdate(data: any) {
    console.log('WebSocket: Customer update received:', data)
    
    // Update local customer data if available
    if (data.customer) {
      this.updateLocalData('customers', data.customer)
    }
  }

  // Handle board placement update messages
  private handleBoardUpdate(data: any) {
    console.log('WebSocket: Board update received:', data)
    
    // Update local board data if available
    if (data.board) {
      this.updateLocalData('boards', data.board)
    }
  }

  // Handle commission update messages
  private handleCommissionUpdate(data: any) {
    console.log('WebSocket: Commission update received:', data)
    
    // Update local commission data if available
    if (data.commission) {
      this.updateLocalData('commissions', data.commission)
    }
  }

  // Handle agent location messages
  private handleAgentLocation(data: any) {
    console.log('WebSocket: Agent location received:', data)
    
    // Update agent location in local storage or state
    if (data.agentId && data.location) {
      this.updateAgentLocation(data.agentId, data.location)
    }
  }

  // Handle system alert messages
  private handleSystemAlert(data: any) {
    console.log('WebSocket: System alert received:', data)
    
    // Show urgent system alerts
    if (data.level === 'critical' || data.level === 'error') {
      this.showSystemAlert(data)
    }
  }

  // Store notification for in-app display
  private storeNotification(notification: any) {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
      notifications.unshift({
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      })
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50)
      }
      
      localStorage.setItem('notifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('WebSocket: Failed to store notification:', error)
    }
  }

  // Update local data cache
  private updateLocalData(type: string, data: any) {
    try {
      const cacheKey = `cache_${type}`
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]')
      
      // Find and update existing item or add new one
      const index = cached.findIndex((item: any) => item.id === data.id)
      if (index >= 0) {
        cached[index] = { ...cached[index], ...data }
      } else {
        cached.unshift(data)
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(cached))
    } catch (error) {
      console.error('WebSocket: Failed to update local data:', error)
    }
  }

  // Update agent location
  private updateAgentLocation(agentId: string, location: any) {
    try {
      const locations = JSON.parse(localStorage.getItem('agent_locations') || '{}')
      locations[agentId] = {
        ...location,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('agent_locations', JSON.stringify(locations))
    } catch (error) {
      console.error('WebSocket: Failed to update agent location:', error)
    }
  }

  // Show system alert
  private showSystemAlert(alert: any) {
    // This would typically integrate with your app's alert/toast system
    console.warn('System Alert:', alert.message)
    
    // You can emit this to be handled by the UI
    this.emit('system_alert', alert)
  }

  // Event listener management
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('WebSocket: Listener error:', error)
        }
      })
    }
  }

  // Get connection status
  public getConnectionStatus(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }

  // Check if connected
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Disconnect WebSocket
  public disconnect() {
    this.shouldReconnect = false
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  // Reconnect WebSocket
  public reconnect() {
    this.disconnect()
    this.shouldReconnect = true
    this.reconnectAttempts = 0
    this.connect()
  }

  // Get stored notifications
  public getNotifications(): any[] {
    try {
      return JSON.parse(localStorage.getItem('notifications') || '[]')
    } catch (error) {
      console.error('WebSocket: Failed to get notifications:', error)
      return []
    }
  }

  // Mark notification as read
  public markNotificationRead(notificationId: string) {
    try {
      const notifications = this.getNotifications()
      const notification = notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
        localStorage.setItem('notifications', JSON.stringify(notifications))
      }
    } catch (error) {
      console.error('WebSocket: Failed to mark notification as read:', error)
    }
  }

  // Clear all notifications
  public clearNotifications() {
    localStorage.removeItem('notifications')
  }
}

// Create singleton instance
const webSocketService = new WebSocketService()

export default webSocketService
export { WebSocketService }