require('dotenv').config();

module.exports = {
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://localhost',
    port: parseInt(process.env.MQTT_PORT) || 1883,
    topic: process.env.MQTT_TOPIC || 'amanerve/loadcell/telemetry',
    clientId: process.env.MQTT_CLIENT_ID || 'amanerve_gateway_3'
  },
  server: {
    port: parseInt(process.env.PORT) || 3000
  },
  loadcell: {
    topics: {
      telemetry: 'amanerve/loadcell/telemetry',
      confirm: 'amanerve/button/confirm',
      led: 'amanerve/led/status'
    },
    max_weight: parseFloat(process.env.MAX_WEIGHT) || 100.0,
    overload_threshold: parseFloat(process.env.OVERLOAD_THRESHOLD) || 90.0,
    alert_enabled: process.env.ALERT_ENABLED !== 'false'
  }
};
