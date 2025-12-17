/**
 * LED Routes
 * Routes for LED control endpoints
 */

const express = require('express');
const router = express.Router();

module.exports = (ledController) => {
  // POST /api/led/control - Send LED control command
  router.post('/control', (req, res) => ledController.control(req, res));

  return router;
};
