module.exports = {
  apps: [
    {
      name: 'beyond-qurban',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/beyond-qurban',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
