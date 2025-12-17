/**
 * Express Application Setup
 * Configures Express app with middleware and routes
 */

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes');

function createApp(controllers) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../frontend/public')));

  // Mount API routes
  app.use('/api', apiRoutes(controllers));

  // Root route - serve index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
  });

  return app;
}

module.exports = createApp;
