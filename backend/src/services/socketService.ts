import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  role?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  initialize(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'http://localhost:12000',
          'https://work-1-drhntgqppzeokwjw.prod-runtime.all-hands.dev'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('Socket.IO service initialized');
    logger.info('Socket.IO CORS origins:', ['http://localhost:12000', 'https://work-1-drhntgqppzeokwjw.prod-runtime.all-hands.dev']);
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      logger.info('Socket authentication attempt:', {
        socketId: socket.id,
        auth: socket.handshake.auth,
        headers: socket.handshake.headers
      });

      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logger.warn('Socket authentication failed: No token provided');
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      socket.userId = decoded.userId;
      socket.tenantId = decoded.tenantId;
      socket.role = decoded.role;
      
      logger.info('Socket authenticated successfully:', {
        socketId: socket.id,
        userId: socket.userId,
        tenantId: socket.tenantId,
        role: socket.role
      });
      
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket) {
    logger.info(`User connected: ${socket.userId} (${socket.role})`);
    
    // Store the connected user
    if (socket.userId) {
      this.connectedUsers.set(socket.userId, socket);
    }

    // Join tenant-specific room
    if (socket.tenantId) {
      socket.join(`tenant:${socket.tenantId}`);
    }

    // Join role-specific room
    if (socket.role) {
      socket.join(`role:${socket.role}`);
    }

    // Handle real-time events
    this.setupEventHandlers(socket);

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      if (socket.userId) {
        this.connectedUsers.delete(socket.userId);
      }
    });
  }

  private setupEventHandlers(socket: AuthenticatedSocket) {
    // Location updates for field agents
    socket.on('location:update', (data) => {
      this.broadcastToTenant(socket.tenantId!, 'location:updated', {
        userId: socket.userId,
        location: data.location,
        timestamp: new Date()
      });
    });

    // Order status updates
    socket.on('order:status', (data) => {
      this.broadcastToTenant(socket.tenantId!, 'order:status:updated', {
        orderId: data.orderId,
        status: data.status,
        updatedBy: socket.userId,
        timestamp: new Date()
      });
    });

    // Inventory alerts
    socket.on('inventory:alert', (data) => {
      this.broadcastToRole('WAREHOUSE_MANAGER', 'inventory:alert', {
        productId: data.productId,
        currentStock: data.currentStock,
        threshold: data.threshold,
        location: data.location,
        timestamp: new Date()
      });
    });

    // Sales updates
    socket.on('sales:update', (data) => {
      this.broadcastToTenant(socket.tenantId!, 'sales:updated', {
        agentId: socket.userId,
        amount: data.amount,
        customerId: data.customerId,
        timestamp: new Date()
      });
    });

    // Chat messages
    socket.on('chat:message', (data) => {
      this.broadcastToTenant(socket.tenantId!, 'chat:message', {
        from: socket.userId,
        message: data.message,
        channel: data.channel,
        timestamp: new Date()
      });
    });
  }

  // Broadcast to specific user
  emitToUser(userId: string, event: string, data: any) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all users in a tenant
  broadcastToTenant(tenantId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`tenant:${tenantId}`).emit(event, data);
    }
  }

  // Broadcast to users with specific role
  broadcastToRole(role: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`role:${role}`).emit(event, data);
    }
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Send notification to user
  sendNotification(userId: string, notification: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
  }) {
    return this.emitToUser(userId, 'notification', notification);
  }

  // Send system alert
  sendSystemAlert(tenantId: string, alert: {
    id: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }) {
    this.broadcastToTenant(tenantId, 'system:alert', alert);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users for a tenant
  getTenantConnectedUsers(tenantId: string): string[] {
    const users: string[] = [];
    this.connectedUsers.forEach((socket, userId) => {
      if (socket.tenantId === tenantId) {
        users.push(userId);
      }
    });
    return users;
  }
}

export const socketService = new SocketService();