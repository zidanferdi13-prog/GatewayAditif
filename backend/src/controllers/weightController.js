/**
 * Weight Controller
 * Handles all weight-related endpoints
 */

class WeightController {
  constructor(mqttClient) {
    this.mqttClient = mqttClient;
  }

  /**
   * GET /api/weight/latest
   * Get the latest weight reading
   */
  getLatest(req, res) {
    const latestWeight = this.mqttClient.getLatestWeight();
    if (!latestWeight) {
      return res.status(404).json({
        success: false,
        message: 'No weight data available'
      });
    }
    res.json({
      success: true,
      data: latestWeight
    });
  }

  /**
   * GET /api/weight/history
   * Get weight history with optional limit
   */
  getHistory(req, res) {
    const limit = parseInt(req.query.limit) || 50;
    const history = this.mqttClient.getWeightHistory(limit);
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  }

  /**
   * GET /api/weight/stats
   * Get weight statistics
   */
  getStats(req, res) {
    const stats = this.mqttClient.getStatistics();
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'No weight data available'
      });
    }
    res.json({
      success: true,
      data: stats
    });
  }

  /**
   * GET /api/history (backward compatibility)
   * Get historical data
   */
  getHistoricalData(req, res) {
    res.json({
      success: true,
      data: this.mqttClient.getHistory()
    });
  }
}

module.exports = WeightController;
