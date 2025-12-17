/**
 * Routes Index
 * Main router that combines all route modules
 */

const express = require('express');
const router = express.Router();

const weightRoutes = require('./weightRoutes');
const ledRoutes = require('./ledRoutes');
const statusRoutes = require('./statusRoutes');

module.exports = (controllers) => {
  const { weightController, ledController, statusController } = controllers;

  // Mount weight routes
  router.use('/weight', weightRoutes(weightController));

  // Mount LED routes
  router.use('/led', ledRoutes(ledController));

  // Mount status routes at /status
  router.use('/status', statusRoutes(statusController));

  // System status route at /system/status
  router.get('/system/status', (req, res) => statusController.getSystemStatus(req, res));

  // Backward compatibility route for /api/history
  router.get('/history', (req, res) => weightController.getHistoricalData(req, res));

  return router;
};
