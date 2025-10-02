const path = require('path');

const config = {
  development: {
    type: process.env.DB_TYPE || 'sqlite',
    database: process.env.DB_PATH || path.join(__dirname, '../../database/salessync.db'),
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
    entities: [path.join(__dirname, '../models/*.js')],
    migrations: [path.join(__dirname, '../database/migrations/*.js')],
    seeds: [path.join(__dirname, '../database/seeds/*.js')],
  },
  
  production: {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '../models/*.js')],
    migrations: [path.join(__dirname, '../database/migrations/*.js')],
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000
    }
  },
  
  test: {
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities: [path.join(__dirname, '../models/*.js')],
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];