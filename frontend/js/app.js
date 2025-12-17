// Socket.io connection
const socket = io();

// State variables
let currentMO = null;
let weightAboveZero = false;
let overloadWarningShown = false;

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
  const target = parseFloat(document.getElementById('targetWeight').innerText) || 0;
  const liveWeightElement = document.getElementById('liveWeight');

  // const weight = 100.0; // Example weight value
  // const target = 2.0;  // Example target value

  console.log(`Live Weight: ${weight} kg, Target: ${target} kg`);
  
  // Check jika berat > 0 dan belum ada MO
  if (weight > 0 && !weightAboveZero && !currentMO) {
    weightAboveZero = true;
    showMOModal();
  } else if (weight === 0) {
    weightAboveZero = false;
    overloadWarningShown = false;
  }
  
  // Check overload (hanya trigger 1x)
  if (weight > target && target > 0 && !overloadWarningShown) {
    overloadWarningShown = true;
    showOverloadWarning(weight, target);
  } else if (weight <= target && overloadWarningShown) {
    overloadWarningShown = false;
    closeOverloadWarning();
  }
  
  // Direct update
  liveWeightElement.textContent = weight.toFixed(2);
  document.getElementById('targetWeight').textContent = target.toFixed(2);
  
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

// Modal Functions
function showMOModal() {
  const modal = document.getElementById('moModal');
  modal.classList.add('show');
  document.getElementById('moInputField').focus();
}

function closeMOModal() {
  const modal = document.getElementById('moModal');
  modal.classList.remove('show');
  document.getElementById('moInputField').value = '';
}

function showConfirmResetModal() {
  const modal = document.getElementById('confirmResetModal');
  document.getElementById('currentMODisplay').innerText = currentMO;
  modal.classList.add('show');
}

function closeConfirmResetModal() {
  const modal = document.getElementById('confirmResetModal');
  modal.classList.remove('show');
}

function showOverloadWarning(weight, target) {
  const modal = document.getElementById('alertOverloadModal');
  document.getElementById('overloadWeight').innerText = weight.toFixed(2);
  document.getElementById('overloadTarget').innerText = target.toFixed(2);
  modal.classList.add('show');
  console.log(`⚠️ OVERLOAD: ${weight.toFixed(2)} kg > ${target.toFixed(2)} kg`);
}

function closeOverloadWarning() {
  const modal = document.getElementById('alertOverloadModal');
  modal.classList.remove('show');
}

function resetMO() {
  currentMO = null;
  console.log('🔄 MO Reset');
  
  // Update display
  document.getElementById('nomorMO').innerText = 'INPUT - MO';
  document.getElementById('input-mo').classList.remove('connected');
  document.getElementById('input-mo').classList.add('disconnected');
  
  // Close confirmation modal
  closeConfirmResetModal();
  
  // Open input modal
  showMOModal();
}

function showOverloadWarning(weight, target) {
  const modal = document.getElementById('alertOverloadModal');
  document.getElementById('overloadWeight').innerText = weight.toFixed(2);
  document.getElementById('overloadTarget').innerText = target.toFixed(2);
  modal.classList.add('show');
  console.log(`⚠️ OVERLOAD: ${weight.toFixed(2)} kg > ${target.toFixed(2)} kg`);
}

function closeOverloadWarning() {
  const modal = document.getElementById('alertOverloadModal');
  modal.classList.remove('show');
}

function saveMO(moNumber) {
  if (moNumber.trim() === '') {
    alert('Nomor MO tidak boleh kosong!');
    return;
  }
  
  currentMO = moNumber;
  console.log('✅ MO Saved:', currentMO);
  
  // Update display
  document.getElementById('nomorMO').innerText = currentMO;
  document.getElementById('input-mo').classList.remove('disconnected');
  document.getElementById('input-mo').classList.add('connected');
  
  // Emit ke server
  socket.emit('mo-confirmed', {
    mo: currentMO,
    timestamp: new Date().toISOString()
  });
  
  closeMOModal();
}

// Socket event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server');
  updateConnectionStatus(true);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
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

socket.on('weightData', (data) => {
  console.log('Received weight data:', data);
  updateWeight(data);
});

// Button Event Listeners
document.getElementById('input-mo').addEventListener('click', function() {
  if (!currentMO) {
    // MO belum ada, langsung buka input modal
    showMOModal();
  } else {
    // MO sudah ada, minta konfirmasi reset
    showConfirmResetModal();
  }
});

document.getElementById('moSubmitBtn').addEventListener('click', function() {
  const moNumber = document.getElementById('moInputField').value;
  saveMO(moNumber);
});

document.getElementById('moCancelBtn').addEventListener('click', function() {
  closeMOModal();
  weightAboveZero = false;
});

// Confirm Reset Modal Handlers
document.getElementById('confirmResetBtn').addEventListener('click', function() {
  resetMO();
});

document.getElementById('cancelResetBtn').addEventListener('click', function() {
  closeConfirmResetModal();
});

// Overload Alert Handler
document.getElementById('overloadOkBtn').addEventListener('click', function() {
  closeOverloadWarning();
});

// Enter key untuk submit modal
document.getElementById('moInputField').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    saveMO(this.value);
  }
});

// Print Button Handler
document.getElementById('printBtn').addEventListener('click', function() {
  if (!currentMO) {
    alert('Silakan input Nomor MO terlebih dahulu!');
    return;
  }
  
  const weight = document.getElementById('liveWeight').innerText;
  console.log('🖨️ Print clicked! MO:', currentMO, 'Weight:', weight);
  
  socket.emit('print-confirm', {
    mo: currentMO,
    weight: parseFloat(weight),
    timestamp: new Date().toISOString()
  });
  
  this.disabled = true;
  this.innerText = '✓ Printing...';
  
  setTimeout(() => {
    this.disabled = false;
    this.innerText = 'Print';
    // Reset MO setelah print selesai
    currentMO = null;
    document.getElementById('nomorMO').innerText = 'INPUT - MO';
    document.getElementById('input-mo').classList.remove('connected');
    document.getElementById('input-mo').classList.add('disconnected');
    console.log('🔄 MO reset after print');
  }, 2000);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Loadcell Monitor initialized');
});