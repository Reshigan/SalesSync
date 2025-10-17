module.exports = {
  apps: [
    {
      name: 'salessync-frontend',
      cwd: './frontend-vite',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
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
