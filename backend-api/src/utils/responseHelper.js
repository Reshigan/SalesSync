/**
 * Standardized API Response Helper
 * Ensures consistent response format across all endpoints
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, data = null, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    ...(data !== null && { data })
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a created response (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Optional success message
 */
const sendCreated = (res, data = null, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info { page, limit, total, totalPages }
 * @param {string} message - Optional message
 */
const sendPaginated = (res, items, pagination, message = null) => {
  const response = {
    success: true,
    ...(message && { message }),
    data: items,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || items.length,
      totalPages: pagination.totalPages || Math.ceil((pagination.total || items.length) / (pagination.limit || 10))
    }
  };
  return res.status(200).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Error code for client handling
 * @param {Object} details - Additional error details
 */
const sendError = (res, message, statusCode = 500, code = null, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details })
    }
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
};

/**
 * Send a not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Name of the resource not found
 */
const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Send an unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Send a forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendForbidden = (res, message = 'Access denied') => {
  return sendError(res, message, 403, 'FORBIDDEN');
};

/**
 * Send a conflict response (duplicate resource)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendConflict = (res, message = 'Resource already exists') => {
  return sendError(res, message, 409, 'CONFLICT');
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict
};
