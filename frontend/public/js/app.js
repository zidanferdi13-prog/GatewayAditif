// Socket.io connection
const socket = io();

// State variables
let currentMO = null;
let weightAboveZero = false;
let overloadWarningShown = false;

// MO Data state (untuk sistem lot)
let moData = null;
let produkRMItems = [];
let produkRMQty = [];
let targetWeights = [];
let currentRMIndex = 0;
let currentLot = 0;
let qtyPlan = 0;

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

function showMODataConfirmModal(data) {
  const modal = document.getElementById('moDataConfirmModal');
  
  // Set data ke modal
  document.getElementById('confirmMONumber').innerText = data.nomor_mo;
  document.getElementById('confirmTotalLot').innerText = data.qty_plan;
  document.getElementById('confirmRMCount').innerText = data.total_rm;
  
  // Build detail RM list
  let detailHTML = '';
  data.produk_rm_items.forEach((item, index) => {
    detailHTML += `
      <div style="padding: 8px; margin-bottom: 5px; background: rgba(37, 99, 235, 0.1); border-left: 3px solid var(--primary-color); border-radius: 4px;">
        <strong>${index + 1}. ${item}</strong><br>
        <span style="color: var(--text-secondary);">Qty: ${data.produk_rm_qty[index].toFixed(2)} kg</span><br>
        <span style="color: var(--success-color);">Target/Lot: ${data.target_weights[index].toFixed(2)} kg</span>
      </div>
    `;
  });
  document.getElementById('confirmRMDetails').innerHTML = detailHTML;
  
  // Simpan data ke state sementara
  window.tempMOData = data;
  
  modal.classList.add('show');
}

function closeMODataConfirmModal() {
  const modal = document.getElementById('moDataConfirmModal');
  modal.classList.remove('show');
  window.tempMOData = null;
}

function confirmMOData() {
  if (!window.tempMOData) return;
  
  const data = window.tempMOData;
  
  // Set global state
  moData = data;
  produkRMItems = data.produk_rm_items;
  produkRMQty = data.produk_rm_qty;
  targetWeights = data.target_weights;
  qtyPlan = data.qty_plan;
  currentRMIndex = 0;
  currentLot = data.lot || 0;
  
  // Update UI dengan RM pertama
  updateCurrentRM();
  
  console.log('✅ MO Data Confirmed. Starting with RM[0]:', produkRMItems[0]);
  
  closeMODataConfirmModal();
}

function updateCurrentRM() {
  if (currentRMIndex < produkRMItems.length) {
    // Update material bahan label
    document.getElementById('materialBahan').innerText = produkRMItems[currentRMIndex];
    
    // Update target weight
    document.getElementById('targetWeight').innerText = targetWeights[currentRMIndex].toFixed(2);
    
    // Update lot display
    document.getElementById('lotText').innerText = `LOT: ${currentLot} / ${qtyPlan}`;
    
    console.log(`📦 Current RM[${currentRMIndex}]: ${produkRMItems[currentRMIndex]} - Target: ${targetWeights[currentRMIndex].toFixed(2)} kg`);
  }
}

function showLotIncrementNotification(completedLot, nextLot) {
  const modal = document.getElementById('lotIncrementModal');
  document.getElementById('completedLotNumber').innerText = completedLot;
  document.getElementById('nextLotNumber').innerText = nextLot;
  modal.classList.add('show');
  
  console.log(`✅ Lot ${completedLot} completed! → Lot ${nextLot}`);
  
  // Auto close setelah 2 detik
  setTimeout(() => {
    modal.classList.remove('show');
  }, 2000);
}

function showCompletionSummary() {
  const modal = document.getElementById('completionModal');
  
  // Set summary data
  document.getElementById('summaryMONumber').innerText = currentMO || '-';
  document.getElementById('summaryTotalLot').innerText = qtyPlan;
  document.getElementById('summaryRMCount').innerText = produkRMItems.length;
  document.getElementById('summaryTotalItems').innerText = qtyPlan * produkRMItems.length;
  
  modal.classList.add('show');
  
  console.log('🎉 All lots completed! Showing summary...');
}

function closeCompletionModal() {
  const modal = document.getElementById('completionModal');
  modal.classList.remove('show');
  
  // Reset MO setelah close
  resetMO();
}

function resetMO() {
  currentMO = null;
  moData = null;
  produkRMItems = [];
  produkRMQty = [];
  targetWeights = [];
  currentRMIndex = 0;
  currentLot = 0;
  qtyPlan = 0;
  
  console.log('🔄 MO Reset - All data cleared');
  
  // Update display
  document.getElementById('nomorMO').innerText = 'INPUT - MO';
  document.getElementById('input-mo').classList.remove('connected');
  document.getElementById('input-mo').classList.add('disconnected');
  document.getElementById('lotText').innerText = 'LOT: 0 / 0';
  document.getElementById('materialBahan').innerText = 'Bahan Material';
  document.getElementById('targetWeight').innerText = '--';
  
  // Close confirmation modal
  closeConfirmResetModal();
  
  // Open input modal
  showMOModal();
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

// Socket handler untuk data MO dari API
socket.on('mo-data-confirm', (response) => {
  if (response.success) {
    console.log('📋 MO Data received from API:', response.data);
    showMODataConfirmModal(response.data);
  } else {
    console.error('❌ MO Data Error:', response.error);
    alert('Gagal mendapatkan data MO dari server');
  }
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

// MO Data Confirm Modal Handlers
document.getElementById('confirmDataBtn').addEventListener('click', function() {
  confirmMOData();
});

document.getElementById('cancelDataBtn').addEventListener('click', function() {
  closeMODataConfirmModal();
  // Cancel berarti reset MO
  resetMO();
});

// Completion Modal Handler
document.getElementById('completionOkBtn').addEventListener('click', function() {
  closeCompletionModal();
});

// Enter key untuk submit modal
document.getElementById('moInputField').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    saveMO(this.value);
  }
});

// Print Button Handler (Konfirmasi timbangan selesai)
document.getElementById('printBtn').addEventListener('click', function() {
  if (!currentMO) {
    alert('Silakan input Nomor MO terlebih dahulu!');
    return;
  }
  
  if (!moData || produkRMItems.length === 0) {
    alert('Data MO belum dikonfirmasi!');
    return;
  }
  
  const weight = parseFloat(document.getElementById('liveWeight').innerText);
  const currentRM = produkRMItems[currentRMIndex];
  const targetWeight = targetWeights[currentRMIndex];
  
  console.log(`🖨️ Print/Confirm - RM[${currentRMIndex}]: ${currentRM}, Weight: ${weight} kg, Target: ${targetWeight} kg`);
  
  // Emit ke server untuk save/log
  socket.emit('print-confirm', {
    mo: currentMO,
    lot: currentLot,
    rm_index: currentRMIndex,
    rm_name: currentRM,
    weight: weight,
    target: targetWeight,
    timestamp: new Date().toISOString()
  });
  
  this.disabled = true;
  this.innerText = '✓ Processing...';
  
  setTimeout(() => {
    this.disabled = false;
    this.innerText = 'Print';
    
    // Pindah ke RM berikutnya
    currentRMIndex++;
    
    // Cek apakah sudah selesai semua RM dalam lot ini
    if (currentRMIndex >= produkRMItems.length) {
      // Semua RM selesai, increment lot
      const completedLot = currentLot;
      currentLot++;
      currentRMIndex = 0;
      
      console.log(`✅ Lot ${completedLot} completed! Moving to Lot ${currentLot}`);
      
      // Cek apakah sudah mencapai target lot
      if (currentLot >= qtyPlan) {
        // Semua lot selesai
        console.log('🎉 All lots completed!');
        showCompletionSummary();
        return; // Stop disini, reset nanti di modal OK
      } else {
        // Masih ada lot lagi, tampilkan notifikasi
        showLotIncrementNotification(completedLot, currentLot);
      }
    }
    
    // Update UI dengan RM berikutnya (atau RM[0] untuk lot baru)
    updateCurrentRM();
    
  }, 1500);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Loadcell Monitor initialized');
});