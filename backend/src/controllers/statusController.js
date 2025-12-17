/**
 * Status Controller
 * Handles system status endpoints
 */

const config = require('../config/config');

class StatusController {
  constructor(mqttClient) {
    this.mqttClient = mqttClient;
  }

  /**
   * GET /api/status
   * Get MQTT connection status
   */
  getStatus(req, res) {
    res.json({
      success: true,
      connected: this.mqttClient.isConnected(),
      topic: config.mqtt.topic,
      broker: config.mqtt.broker
    });
  }

  /**
   * GET /api/system/status
   * Get detailed system status
   */
  getSystemStatus(req, res) {
    res.json({
      success: true,
      data: {
        mqtt_connected: this.mqttClient.isConnected(),
        latest_weight: this.mqttClient.getLatestWeight(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    });
  }
}

module.exports = StatusController;
