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
  }
};
