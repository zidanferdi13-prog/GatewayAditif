const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const config = require('./config');
const MQTTClient = require('./mqtt-client');

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize MQTT Client
const mqttClient = new MQTTClient(io);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API endpoint to get historical data
app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    data: mqttClient.getHistory()
  });
});

// API endpoint to get connection status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    connected: mqttClient.isConnected(),
    topic: config.mqtt.topic,
    broker: config.mqtt.broker
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('👤 New client connected:', socket.id);
  
  // Send current status to new client
  socket.emit('mqtt-status', { 
    connected: mqttClient.isConnected() 
  });
  
  // Send historical data to new client
  socket.emit('history-data', mqttClient.getHistory());
  
  socket.on('disconnect', () => {
    console.log('👤 Client disconnected:', socket.id);
  });
  
  // Handle request for history
  socket.on('request-history', () => {
    socket.emit('history-data', mqttClient.getHistory());
  });
});

// Start MQTT connection
mqttClient.connect();

// Start server
server.listen(config.server.port, '0.0.0.0', () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   AmaNerve Loadcell Dashboard          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`🚀 Server running on http://0.0.0.0:${config.server.port}`);
  console.log(`📡 MQTT Topic: ${config.mqtt.topic}`);
  console.log(`🔌 MQTT Broker: ${config.mqtt.broker}`);
  console.log('════════════════════════════════════════');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  
  // Set timeout to force exit if graceful shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    console.log('⚠️ Forcing exit...');
    process.exit(1);
  }, 3000);
  
  // Disconnect MQTT
  mqttClient.disconnect();
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed');
    clearTimeout(forceExitTimer);
    process.exit(0);
  });
  
  // Force close all connections
  server.closeAllConnections?.();
});
