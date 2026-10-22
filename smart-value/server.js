const app = require('./src/app');
const config = require('./src/config/config');

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 Tracking & Traffic Backend Running`);
  console.log(`📡 Port: ${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🏠 Landing Page: http://localhost:${config.port}/info/home/`);
  console.log(`🔗 Primary Tracker: ${config.routeclk.baseUrl}`);
  console.log(`🛡️  Fallback: ${config.fallback.baseUrl}`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
