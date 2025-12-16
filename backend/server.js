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

// Middleware
app.use(express.json());
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

// GET /api/weight/latest
app.get('/api/weight/latest', (req, res) => {
  const latestWeight = mqttClient.getLatestWeight();
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
});

// GET /api/weight/history
app.get('/api/weight/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const history = mqttClient.getWeightHistory(limit);
  res.json({
    success: true,
    count: history.length,
    data: history
  });
});

// GET /api/weight/stats
app.get('/api/weight/stats', (req, res) => {
  const stats = mqttClient.getStatistics();
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
});

// POST /api/led/control
app.post('/api/led/control', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({
      success: false,
      message: 'Command is required'
    });
  }
  
  const result = mqttClient.sendLEDCommand(command);
  res.json({
    success: result,
    message: result ? `LED command sent: ${command}` : 'Failed to send LED command'
  });
});

// GET /api/system/status
app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      mqtt_connected: mqttClient.isConnected(),
      latest_weight: mqttClient.getLatestWeight(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
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

// Pass Socket.IO instance
mqttClient.setSocketIO(io);

// Register MQTT callbacks
mqttClient.onWeightData((data) => {
  // Check overload
  if (data.weight >= config.loadcell.overload_threshold) {
    console.warn(`⚠️ OVERLOAD WARNING: ${data.weight} kg`);
    mqttClient.sendLEDCommand('BLINK_RED');
  }
});

mqttClient.onConfirm((data) => {
  console.log(`📦 Processing confirmed weight: ${data.weight} kg`);
  // TODO: Save to database
  mqttClient.sendLEDCommand('HIGH_GREEN');
});

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
