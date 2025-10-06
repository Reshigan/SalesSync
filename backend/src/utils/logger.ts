import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Define different formats for different environments
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [];

// Console transport
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // HTTP requests log
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { 
    service: 'salessync-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log levels
export const logError = (message: string, error?: any) => {
  if (error) {
    logger.error(`${message}: ${error.message}`, { 
      stack: error.stack,
      ...error 
    });
  } else {
    logger.error(message);
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Audit logging for security events
export const logAudit = (action: string, userId: string, details: any) => {
  logger.info('AUDIT', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    details,
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info('PERFORMANCE', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Database operation logging
export const logDatabase = (operation: string, table: string, duration?: number, error?: any) => {
  if (error) {
    logger.error('DATABASE_ERROR', {
      operation,
      table,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.debug('DATABASE_OPERATION', {
      operation,
      table,
      duration,
    });
  }
};

export { logger };