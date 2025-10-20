module.exports = {
  apps: [
    {
      name: 'salessync-backend',
      script: 'src/server.js',
      cwd: '/workspace/project/SalesSync/backend-api',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: './logs/salessync-backend.log',
      out_file: './logs/salessync-backend-out.log',
      error_file: './logs/salessync-backend-error.log',
      time: true
    },
    {
      name: 'salessync-frontend',
      script: 'simple-frontend-server.js',
      cwd: '/workspace/project/SalesSync',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: './logs/salessync-frontend.log',
      out_file: './logs/salessync-frontend-out.log',
      error_file: './logs/salessync-frontend-error.log',
      time: true
    }
  ]
};
