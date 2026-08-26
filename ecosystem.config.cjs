module.exports = {
  apps: [
    {
      name: 'shogun-frontend',
      script: './scripts/serve-dist.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      }
    },
    {
      name: 'shogun-backend',
      script: './dist/server.js',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
