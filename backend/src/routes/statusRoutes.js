/**
 * Status Routes
 * Routes for status and system monitoring endpoints
 */

const express = require('express');
const router = express.Router();

module.exports = (statusController) => {
  // GET /api/status - Get MQTT connection status
  router.get('/', (req, res) => statusController.getStatus(req, res));

  // GET /api/system/status - Get detailed system status
  router.get('/system/status', (req, res) => statusController.getSystemStatus(req, res));

  return router;
};
