// Socket.io connection
const socket = io();

// Update connection status UI
function updateConnectionStatus(connected) {
  const statusBadge = document.getElementById('connectionStatus');
  const statusText = document.getElementById('statusText');
  
  if (connected) {
    statusBadge.className = 'status-badge connected';
    statusText.textContent = 'Connected';
  } else {
    statusBadge.className = 'status-badge disconnected';
    statusText.textContent = 'Disconnected';
  }
}

// Update live weight display
function updateWeight(data) {
  const weight = parseFloat(data.weight || data.value || 0);
  const liveWeightElement = document.getElementById('liveWeight');
  
  // Animate weight change
  liveWeightElement.style.transform = 'scale(1.1)';
  setTimeout(() => {
    liveWeightElement.style.transform = 'scale(1)';
  }, 200);
  
  liveWeightElement.textContent = weight.toFixed(2);
  
  // Update timestamp
  const timestamp = new Date(data.timestamp || Date.now());
  document.getElementById('lastUpdate').textContent = 
    timestamp.toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
}

// Socket event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  updateConnectionStatus(true);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  updateConnectionStatus(false);
});

socket.on('mqtt-status', (status) => {
  console.log('MQTT Status:', status);
  updateConnectionStatus(status.connected);
});

socket.on('telemetry-data', (data) => {
  console.log('Received telemetry data:', data);
  updateWeight(data);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Loadcell Monitor initialized');
  
  // Add smooth transition to weight value
  const weightValue = document.getElementById('liveWeight');
  weightValue.style.transition = 'transform 0.2s ease';
});
