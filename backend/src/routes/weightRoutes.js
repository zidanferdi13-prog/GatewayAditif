/**
 * Weight Routes
 * Routes for weight-related endpoints
 */

const express = require('express');
const router = express.Router();

module.exports = (weightController) => {
  // GET /api/weight/latest - Get latest weight reading
  router.get('/latest', (req, res) => weightController.getLatest(req, res));

  // GET /api/weight/history - Get weight history
  router.get('/history', (req, res) => weightController.getHistory(req, res));

  // GET /api/weight/stats - Get weight statistics
  router.get('/stats', (req, res) => weightController.getStats(req, res));

  return router;
};
