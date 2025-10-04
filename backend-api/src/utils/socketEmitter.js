/**
 * Socket.IO Event Emitter Utility
 * Provides centralized functions for emitting real-time events
 */

/**
 * Emit event to specific user
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function emitToUser(io, userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to all users in a tenant
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Target tenant ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function emitToTenant(io, tenantId, event, data) {
  if (!io) return;
  io.to(`tenant:${tenantId}`).emit(event, data);
}

/**
 * Emit new order notification
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Tenant ID
 * @param {Object} order - Order data
 */
function emitNewOrder(io, tenantId, order) {
  emitToTenant(io, tenantId, 'order:created', {
    type: 'order_created',
    message: `New order #${order.order_number} created`,
    data: order,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit order update notification
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Tenant ID
 * @param {Object} order - Order data
 */
function emitOrderUpdate(io, tenantId, order) {
  emitToTenant(io, tenantId, 'order:updated', {
    type: 'order_updated',
    message: `Order #${order.order_number} updated`,
    data: order,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit visit check-in notification
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Tenant ID
 * @param {Object} visit - Visit data
 */
function emitVisitCheckIn(io, tenantId, visit) {
  emitToTenant(io, tenantId, 'visit:checkin', {
    type: 'visit_checkin',
    message: `Visit check-in at ${visit.customer_name}`,
    data: visit,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit inventory alert notification
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Tenant ID
 * @param {Object} inventory - Inventory data
 */
function emitInventoryAlert(io, tenantId, inventory) {
  emitToTenant(io, tenantId, 'inventory:alert', {
    type: 'inventory_alert',
    message: `Low stock alert: ${inventory.product_name}`,
    data: inventory,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit general notification
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Tenant ID
 * @param {string} type - Notification type
 * @param {string} message - Notification message
 * @param {Object} data - Additional data
 */
function emitNotification(io, tenantId, type, message, data = {}) {
  emitToTenant(io, tenantId, 'notification', {
    type,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit dashboard activity update
 * @param {Object} io - Socket.IO instance
 * @param {string} tenantId - Tenant ID
 * @param {Object} activity - Activity data
 */
function emitActivityUpdate(io, tenantId, activity) {
  emitToTenant(io, tenantId, 'activity:new', {
    type: 'activity_update',
    data: activity,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  emitToUser,
  emitToTenant,
  emitNewOrder,
  emitOrderUpdate,
  emitVisitCheckIn,
  emitInventoryAlert,
  emitNotification,
  emitActivityUpdate,
};
