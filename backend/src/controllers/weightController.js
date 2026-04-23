'use strict';

const HISTORY_LIMIT_MIN = 1;
const HISTORY_LIMIT_MAX = 500;

class WeightController {
  constructor(serialClient) {
    this.serialClient = serialClient;
  }

  /** GET /api/weight/latest */
  getLatest(req, res) {
    const data = this.serialClient.getLatestWeight();
    if (!data) {
      return res.status(404).json({ success: false, message: 'No weight data available' });
    }
    res.json({ success: true, data });
  }

  /** GET /api/weight/history?limit=N */
  getHistory(req, res) {
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < HISTORY_LIMIT_MIN) limit = 50;
    if (limit > HISTORY_LIMIT_MAX) limit = HISTORY_LIMIT_MAX;

    const history = this.serialClient.getWeightHistory(limit);
    res.json({ success: true, count: history.length, data: history });
  }

  /** GET /api/weight/stats */
  getStats(req, res) {
    const stats = this.serialClient.getStatistics();
    if (!stats) {
      return res.status(404).json({ success: false, message: 'No weight data available' });
    }
    res.json({ success: true, data: stats });
  }

  /** GET /api/history — backward compatibility */
  getHistoricalData(req, res) {
    res.json({ success: true, data: this.serialClient.getHistory() });
  }
}

module.exports = WeightController;
