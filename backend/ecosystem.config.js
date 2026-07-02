module.exports = {
  apps: [
    {
      name: 'onlymans-api',
      script: './src/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable load balancing
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
};
