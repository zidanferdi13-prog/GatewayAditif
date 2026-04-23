'use strict';

const config = require('../config/config');

class StatusController {
  constructor(serialClient, serialSmall, serialLarge) {
    this.serialClient = serialClient;
    this.serialSmall  = serialSmall;
    this.serialLarge  = serialLarge;
  }

  /** GET /api/status */
  getStatus(req, res) {
    res.json({
      success:   true,
      connected: this.serialClient.isConnected(),
      scales: {
        small: {
          connected: this.serialSmall ? this.serialSmall.isConnected() : false,
          port:      config.scales.small.port,
          baudRate:  config.scales.small.baudRate
        },
        large: {
          connected: this.serialLarge ? this.serialLarge.isConnected() : false,
          port:      config.scales.large.port,
          baudRate:  config.scales.large.baudRate
        }
      }
    });
  }

  /** GET /api/system/status */
  getSystemStatus(req, res) {
    const mem = process.memoryUsage();
    res.json({
      success: true,
      data: {
        uptime_s:       Math.floor(process.uptime()),
        serial_small:   this.serialSmall  ? this.serialSmall.isConnected()  : false,
        serial_large:   this.serialLarge  ? this.serialLarge.isConnected()  : false,
        latest_weight:  this.serialClient.getLatestWeight(),
        memory_mb: {
          rss:      (mem.rss          / 1048576).toFixed(1),
          heap_used:(mem.heapUsed     / 1048576).toFixed(1),
          heap_total:(mem.heapTotal   / 1048576).toFixed(1)
        }
      }
    });
  }
}

module.exports = StatusController;
