const mqtt = require('mqtt');
const config = require('./config');

class MQTTClient {
  constructor(io) {
    this.io = io;
    this.client = null;
    this.connected = false;
    this.dataHistory = [];
    this.maxHistorySize = 100;
  }

  connect() {
    console.log(`🔌 Connecting to MQTT broker: ${config.mqtt.broker}`);
    
    this.client = mqtt.connect(config.mqtt.broker, {
      port: config.mqtt.port,
      clientId: config.mqtt.clientId,
      clean: true,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      this.connected = true;
      this.io.emit('mqtt-status', { connected: true });
      
      // Subscribe to topic
      this.client.subscribe(config.mqtt.topic, (err) => {
        if (!err) {
          console.log(`📡 Subscribed to topic: ${config.mqtt.topic}`);
        } else {
          console.error('❌ Subscription error:', err);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      try {
        const rawMessage = message.toString();
        // console.log('📊 Received raw data:', rawMessage);
        
        let weight;
        // Try to parse as JSON first
        try {
          const jsonData = JSON.parse(rawMessage);
          weight = parseFloat(jsonData.weight || jsonData.value || jsonData.kg || jsonData);
        } catch (e) {
          // If not JSON, treat as plain number
          weight = parseFloat(rawMessage);
        }
        
        // Create data object with server timestamp
        const data = {
          weight: weight,
          timestamp: new Date().toISOString()
        };
        
        console.log('📊 Processed data:', data);
        
        // Store in history
        this.dataHistory.push(data);
        if (this.dataHistory.length > this.maxHistorySize) {
          this.dataHistory.shift();
        }
        
        // Emit to all connected clients
        this.io.emit('telemetry-data', data);
      } catch (err) {
        console.error('❌ Error parsing message:', err);
      }
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
      this.connected = false;
      this.io.emit('mqtt-status', { connected: false, error: err.message });
    });

    this.client.on('close', () => {
      console.log('⚠️ MQTT connection closed');
      this.connected = false;
      this.io.emit('mqtt-status', { connected: false });
    });

    this.client.on('offline', () => {
      console.log('⚠️ MQTT client offline');
      this.connected = false;
      this.io.emit('mqtt-status', { connected: false });
    });

    this.client.on('reconnect', () => {
      console.log('🔄 Reconnecting to MQTT broker...');
    });
  }

  getHistory() {
    return this.dataHistory;
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = MQTTClient;
