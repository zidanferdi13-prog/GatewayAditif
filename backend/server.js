/**
 * Server Entry Point
 * Initializes and starts the application server
 */

const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const config = require('./src/config/config');
const createApp = require('./src/app');
const MQTTClient = require('./src/services/mqttService');

// Controllers
const WeightController = require('./src/controllers/weightController');
const LedController = require('./src/controllers/ledController');
const StatusController = require('./src/controllers/statusController');

// Initialize Socket.IO (will be set after server creation)
let io;

// Initialize MQTT Client (will pass io later)
const mqttClient = new MQTTClient(null);

// Initialize Controllers
const weightController = new WeightController(mqttClient);
const ledController = new LedController(mqttClient);
const statusController = new StatusController(mqttClient);

// Create Express app with controllers
const app = createApp({
  weightController,
  ledController,
  statusController
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
io = socketIo(server);

// Set Socket.IO instance to MQTT client
mqttClient.setSocketIO(io);

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
  
  // Handle MO confirmation
  socket.on('mo-confirmed', (data) => {
    console.log('📋 MO Confirmed:', data.mo, 'at', data.timestamp);
    
    // POST ke API eksternal
    const payload = {
      nomor_mo: data.mo
    };
    
    axios.post('https://services.ama.id/kanban/findOne', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        console.log('✅ API Response:');
        // Emit response kembali ke client
        socket.emit('mo-api-response', {
          success: true,
          data: response.data
        });

        let item = response.data
        console.log(item.data.nomor_mo, "Nomor MO dari API");
        console.log(item.data.qty_plan, "Qty Plan dari API");
        
        // Array untuk menyimpan semua data RM (flexible)
        let produkRMItems = [];
        let produkRMQty = [];
        let targetWeights = [];
        let totalQtyRM = 0;
        
        // Loop untuk ambil semua data RM dan hitung target weight
        item.data.produk_rm.forEach((rm, index) => {
          console.log(`📦 RM [${index + 1}]:`, rm.item, '- Qty:', rm.qty);
          
          // Push ke array
          produkRMItems.push(rm.item);
          produkRMQty.push(rm.qty);
          totalQtyRM += rm.qty;
          
          // Hitung target weight per RM
          let targetWeight = rm.qty / item.data.qty_plan;
          targetWeights.push(targetWeight);
        });
        
        // Log hasil
        console.log('📦 Total RM Items:', produkRMItems.length);
        console.log('📦 All RM Items:', produkRMItems);
        console.log('📦 All RM Qty:', produkRMQty);
        console.log('📦 Target Weights:', targetWeights.map(tw => tw.toFixed(2)));
        console.log('📦 Total Qty RM:', totalQtyRM.toFixed(2));
        
        // Emit data lengkap ke client untuk konfirmasi
        socket.emit('mo-data-confirm', {
          success: true,
          data: {
            nomor_mo: item.data.nomor_mo,
            // qty_plan: item.data.qty_plan,
            qty_plan: 1,  
            lot: item.data.lot || 0,
            produk_rm_items: produkRMItems,
            produk_rm_qty: produkRMQty,
            target_weights: targetWeights,
            total_rm: produkRMItems.length
          }
        });

      })
      .catch((error) => {
        console.error('❌ API Error:', error.message);
        socket.emit('mo-api-response', {
          success: false,
          error: error.message
        });
      });
  });
  
  // Handle print request
  socket.on('print-confirm', (data) => {
    console.log('🖨️ Print Request:', {
      mo: data.mo,
      weight: data.weight,
      timestamp: data.timestamp
    });
    // TODO: Send to printer or save to print queue
  });
});

// Start MQTT connection
mqttClient.connect();

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
  console.log('║       AmaNerve Loadcell Dashboard      ║');
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
