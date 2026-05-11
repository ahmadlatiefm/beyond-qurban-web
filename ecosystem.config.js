module.exports = {
  apps: [{
    name: 'beyond-qurban',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/beyond-qurban-web',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: '/root/.pm2/logs/beyond-qurban-error.log',
    out_file: '/root/.pm2/logs/beyond-qurban-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
}
