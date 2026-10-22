const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const trackingRoutes = require('./routes/trackingRoutes');

const app = express();

// Disable ETags to ensure fresh JSON payloads without 304 caching
app.set('etag', false);

// Security middleware with custom CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", '*'],
      imgSrc: ["'self'", 'data:', '*'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin === '*' ? '*' : config.cors.origin.split(','),
  methods: ['GET', 'OPTIONS'],
}));

// Request logging (skip in test environment)
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount tracking routes
app.use('/', trackingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

module.exports = app;
