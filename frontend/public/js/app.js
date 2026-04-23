/* ════════════════════════════════════════════════════════════
   AMA Timbangan Aditif — Frontend Application
   Industrial Monitoring Dashboard v2
════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────── */
const SMALL_SCALE_MAX_KG    = 2.0;
const AUTO_CONFIRM_DELAY_MS = 1500;

/* ──────────────────────────────────────────────────────────
   STATE
────────────────────────────────────────────────────────── */
const State = {
  currentMO:          null,
  moData:             null,
  produkRMItems:      [],
  produkRMQty:        [],
  targetWeights:      [],
  currentRMIndex:     0,
  currentLot:         0,
  qtyPlan:            0,
  weightAboveZero:    false,
  autoConfirmActive:  false,
  overloadShown:      { small: false, large: false },

  reset() {
    this.currentMO         = null;
    this.moData            = null;
    this.produkRMItems     = [];
    this.produkRMQty       = [];
    this.targetWeights     = [];
    this.currentRMIndex    = 0;
    this.currentLot        = 0;
    this.qtyPlan           = 0;
    this.weightAboveZero   = false;
    this.autoConfirmActive = false;
    this.overloadShown     = { small: false, large: false };
  }
};

/* ──────────────────────────────────────────────────────────
   DOM CACHE
────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const DOM = {
  moBtn:        $('input-mo'),
  moNumberEl:   $('nomorMO'),
  lotCurrentEl: $('lotCurrent'),
  lotTotalEl:   $('lotTotal'),
  clockEl:      $('systemClock'),

  small: {
    card:         $('scaleCardSmall'),
    weight:       $('liveWeightSmall'),
    target:       $('targetWeightSmall'),
    material:     $('materialBahanSmall'),
    timestamp:    $('lastUpdateSmall'),
    stability:    $('stabilitySmall'),
    stabilityTxt: $('stabilityTextSmall'),
    progress:     $('progressSmall'),
    printBtn:     $('printBtnSmall'),
    chip:         $('chipSmall'),
    chipState:    $('statusTextSmall'),
  },
  large: {
    card:         $('scaleCardLarge'),
    weight:       $('liveWeightLarge'),
    target:       $('targetWeightLarge'),
    material:     $('materialBahanLarge'),
    timestamp:    $('lastUpdateLarge'),
    stability:    $('stabilityLarge'),
    stabilityTxt: $('stabilityTextLarge'),
    progress:     $('progressLarge'),
    printBtn:     $('printBtnLarge'),
    chip:         $('chipLarge'),
    chipState:    $('statusTextLarge'),
  }
};

/* ──────────────────────────────────────────────────────────
   MODAL CONTROLLER
────────────────────────────────────────────────────────── */
const Modal = {
  open(id, afterOpen) {
    const el = $(id);
    if (!el) return;
    el.classList.add('show');
    afterOpen?.();
  },
  close(id) {
    const el = $(id);
    if (el) el.classList.remove('show');
  }
};

/* ──────────────────────────────────────────────────────────
   SCALE HELPERS
────────────────────────────────────────────────────────── */
function getExpectedScale() {
  if (!State.targetWeights.length || State.currentRMIndex >= State.targetWeights.length) return 'small';
  const t = parseFloat(State.targetWeights[State.currentRMIndex]) || 0;
  return t <= SMALL_SCALE_MAX_KG ? 'small' : 'large';
}

function setScaleConnection(scale, connected) {
  const el = DOM[scale];
  el.chip.classList.toggle('is-connected',    connected);
  el.chip.classList.toggle('is-disconnected', !connected);
  el.chipState.textContent = connected ? 'ON' : 'OFF';
}

function setScaleStability(scale, stable) {
  const pill = DOM[scale].stability;
  const txt  = DOM[scale].stabilityTxt;
  pill.classList.toggle('is-stable',   stable);
  pill.classList.toggle('is-unstable', !stable);
  txt.textContent = stable ? 'STABIL' : 'GOYANG';
}

function setScaleWeight(scale, weight, target) {
  const el    = DOM[scale];
  const ratio = target > 0 ? Math.min(weight / target, 1.1) : 0;

  el.weight.textContent    = weight.toFixed(2);
  el.progress.style.width  = `${Math.min(ratio * 100, 100)}%`;

  el.progress.classList.remove('is-near', 'is-ok', 'is-over');
  el.weight.classList.remove('is-overload');

  if (ratio >= 1.0) {
    el.progress.classList.add('is-over');
    el.weight.classList.add('is-overload');
  } else if (ratio >= 0.9) {
    el.progress.classList.add('is-near');
  } else if (ratio >= 0.98) {
    el.progress.classList.add('is-ok');
  }
}

function updateActiveScaleHighlight() {
  const expected = getExpectedScale();
  DOM.small.card.classList.toggle('active-scale', expected === 'small');
  DOM.large.card.classList.toggle('active-scale', expected === 'large');
}

/* ──────────────────────────────────────────────────────────
   CLOCK
────────────────────────────────────────────────────────── */
function startClock() {
  const tick = () => {
    DOM.clockEl.textContent = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
}

/* ──────────────────────────────────────────────────────────
   MO MANAGEMENT
────────────────────────────────────────────────────────── */
function saveMO(moNumber) {
  const mo = moNumber.trim();
  if (!mo) return;

  State.currentMO = mo;
  DOM.moNumberEl.textContent = mo;
  DOM.moBtn.className = 'mo-btn mo-btn--active';

  socket.emit('mo-confirmed', { mo, timestamp: new Date().toISOString() });
  Modal.close('moModal');
  $('moInputField').value = '';
}

function resetMO() {
  State.reset();

  DOM.moNumberEl.textContent = 'INPUT MO';
  DOM.moBtn.className = 'mo-btn mo-btn--idle';
  DOM.lotCurrentEl.textContent = '0';
  DOM.lotTotalEl.textContent   = '0';

  ['small', 'large'].forEach(s => {
    DOM[s].material.textContent  = '— Bahan Material —';
    DOM[s].target.textContent    = '--';
    DOM[s].progress.style.width  = '0%';
    DOM[s].progress.className    = 'progress-fill';
    DOM[s].weight.className      = 'weight-readout__val';
  });

  updateActiveScaleHighlight();
  Modal.close('confirmResetModal');
  Modal.open('moModal', () => $('moInputField').focus());
}

/* ──────────────────────────────────────────────────────────
   RM / LOT PROGRESS
────────────────────────────────────────────────────────── */
function updateCurrentRM() {
  if (State.currentRMIndex >= State.produkRMItems.length) return;

  const material = State.produkRMItems[State.currentRMIndex];
  const target   = parseFloat(State.targetWeights[State.currentRMIndex]) || 0;
  const expected = getExpectedScale();

  ['small', 'large'].forEach(s => {
    DOM[s].material.textContent = material;
    DOM[s].target.textContent   = s === expected ? target.toFixed(2) : '--';
    if (s !== expected) {
      DOM[s].progress.style.width = '0%';
    }
  });

  DOM.lotCurrentEl.textContent = String(State.currentLot);
  DOM.lotTotalEl.textContent   = String(State.qtyPlan);
  updateActiveScaleHighlight();

  console.log(`📦 RM[${State.currentRMIndex}]: ${material} → ${target.toFixed(2)} kg via ${expected}`);
}

function confirmCurrentRM(weight, target, scale, source = 'manual') {
  if (!State.currentMO || !State.moData || State.autoConfirmActive) return;
  State.autoConfirmActive = true;

  const rm = State.produkRMItems[State.currentRMIndex];
  console.log(`✅ [${source.toUpperCase()}] RM[${State.currentRMIndex}]: ${rm} | ${weight}/${target} kg | ${scale}`);

  socket.emit('print-confirm', {
    mo:         State.currentMO,
    lot:        State.currentLot,
    rm_index:   State.currentRMIndex,
    rm_name:    rm,
    scale_used: scale,
    weight,
    target,
    timestamp:  new Date().toISOString()
  });

  setTimeout(() => {
    State.autoConfirmActive = false;
    advanceRMProgress();
  }, AUTO_CONFIRM_DELAY_MS);
}

function advanceRMProgress() {
  State.currentRMIndex++;

  if (State.currentRMIndex >= State.produkRMItems.length) {
    const done = State.currentLot;
    State.currentLot++;
    State.currentRMIndex = 0;

    if (State.currentLot >= State.qtyPlan) {
      showCompletionSummary();
      socket.emit('mo-completed', {
        mo:             State.currentMO,
        lots_completed: State.qtyPlan,
        timestamp:      new Date().toISOString()
      });
      return;
    }

    showLotCompleteToast(done, State.currentLot);
  }

  updateCurrentRM();
}

/* ──────────────────────────────────────────────────────────
   NOTIFICATION HELPERS
────────────────────────────────────────────────────────── */
function showLotCompleteToast(done, next) {
  $('completedLotNumber').textContent = done;
  $('nextLotNumber').textContent      = next;
  Modal.open('lotIncrementModal');
  setTimeout(() => Modal.close('lotIncrementModal'), 2600);
}

function showCompletionSummary() {
  $('summaryMONumber').textContent   = State.currentMO  || '—';
  $('summaryTotalLot').textContent   = State.qtyPlan;
  $('summaryRMCount').textContent    = State.produkRMItems.length;
  $('summaryTotalItems').textContent = State.qtyPlan * State.produkRMItems.length;
  Modal.open('completionModal');
}

function buildMOConfirmModal(data) {
  $('confirmMONumber').textContent = data.nomor_mo;
  $('confirmTotalLot').textContent = data.qty_plan;
  $('confirmRMCount').textContent  = data.total_rm;

  const list = $('confirmRMDetails');
  list.innerHTML = '';

  data.produk_rm_items.forEach((item, i) => {
    const t     = parseFloat(data.target_weights[i]) || 0;
    const scale = t <= SMALL_SCALE_MAX_KG ? 'SMALL' : 'LARGE';
    const cls   = t <= SMALL_SCALE_MAX_KG ? '' : 'rm-item--large';
    list.insertAdjacentHTML('beforeend', `
      <div class="rm-item ${cls}">
        <span class="rm-item__idx">${i + 1}</span>
        <span class="rm-item__name">${item}</span>
        <span class="rm-item__meta">${t.toFixed(2)} kg &bull; ${scale}</span>
      </div>
    `);
  });

  window._tempMOData = data;
  Modal.open('moDataConfirmModal');
}

/* ──────────────────────────────────────────────────────────
   SOCKET.IO
────────────────────────────────────────────────────────── */
const socket = io();

socket.on('connect', () => console.log('🔌 Socket.IO connected'));

socket.on('disconnect', () => {
  setScaleConnection('small', false);
  setScaleConnection('large', false);
});

socket.on('serial-status', s => {
  if (s?.scale) setScaleConnection(s.scale, !!s.connected);
});

socket.on('serial-status:small', s => setScaleConnection('small', !!s.connected));
socket.on('serial-status:large', s => setScaleConnection('large', !!s.connected));

socket.on('weightData', data => {
  const scale    = data.scale === 'large' ? 'large' : 'small';
  const weight   = parseFloat(data.weight || 0);
  const expected = getExpectedScale();
  const target   = State.currentRMIndex < State.targetWeights.length
    ? parseFloat(State.targetWeights[State.currentRMIndex]) || 0
    : 0;

  /* — stability — */
  setScaleStability(scale, !!data.stable);

  /* — weight readout + progress bar — */
  setScaleWeight(scale, weight, scale === expected ? target : 0);

  /* — timestamp — */
  const ts = new Date(data.timestamp || Date.now());
  DOM[scale].timestamp.textContent = ts.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  /* — prompt MO if weight detected — */
  if (weight > 0 && !State.weightAboveZero && !State.currentMO) {
    State.weightAboveZero = true;
    Modal.open('moModal', () => $('moInputField').focus());
  } else if (weight === 0) {
    State.weightAboveZero = false;
    State.overloadShown[scale] = false;
  }

  /* — overload alarm (only for expected scale) — */
  if (scale === expected && target > 0) {
    if (weight > target && !State.overloadShown[scale]) {
      State.overloadShown[scale] = true;
      $('overloadWeight').textContent = weight.toFixed(2);
      $('overloadTarget').textContent = target.toFixed(2);
      Modal.open('alertOverloadModal');
    } else if (weight <= target && State.overloadShown[scale]) {
      State.overloadShown[scale] = false;
      Modal.close('alertOverloadModal');
    }
  }

  /* — auto-confirm — */
  if (
    data.stable &&
    State.moData &&
    scale === expected &&
    !State.autoConfirmActive &&
    State.currentRMIndex < State.targetWeights.length &&
    target > 0 &&
    Math.round(weight * 100) === Math.round(target * 100)
  ) {
    console.log(`🤖 AUTO: [${scale}] ${weight} === ${target} kg (ST)`);
    confirmCurrentRM(weight, target, scale, 'auto');
  }
});

socket.on('mo-data-confirm', response => {
  if (response.success) {
    buildMOConfirmModal(response.data);
  } else {
    console.error('MO API Error:', response.error);
  }
});

/* ──────────────────────────────────────────────────────────
   EVENT BINDINGS
────────────────────────────────────────────────────────── */

/* MO Button */
$('input-mo').addEventListener('click', () => {
  if (State.currentMO) {
    $('currentMODisplay').textContent = State.currentMO;
    Modal.open('confirmResetModal');
  } else {
    Modal.open('moModal', () => $('moInputField').focus());
  }
});

/* MO Submit */
$('moSubmitBtn').addEventListener('click', () => saveMO($('moInputField').value));
$('moInputField').addEventListener('keypress', e => {
  if (e.key === 'Enter') saveMO($('moInputField').value);
});

/* MO Cancel */
$('moCancelBtn').addEventListener('click', () => {
  Modal.close('moModal');
  $('moInputField').value = '';
  State.weightAboveZero = false;
});

/* Reset Confirm */
$('confirmResetBtn').addEventListener('click', resetMO);
$('cancelResetBtn').addEventListener('click', () => Modal.close('confirmResetModal'));

/* Overload OK */
$('overloadOkBtn').addEventListener('click', () => Modal.close('alertOverloadModal'));

/* MO Data Confirm */
$('confirmDataBtn').addEventListener('click', () => {
  if (!window._tempMOData) return;
  const data = window._tempMOData;

  State.moData         = data;
  State.produkRMItems  = data.produk_rm_items;
  State.produkRMQty    = data.produk_rm_qty;
  State.targetWeights  = data.target_weights;
  State.qtyPlan        = data.qty_plan;
  State.currentRMIndex = 0;
  State.currentLot     = data.lot || 0;

  updateCurrentRM();
  Modal.close('moDataConfirmModal');
  window._tempMOData = null;
  console.log('✅ MO confirmed, RM[0]:', State.produkRMItems[0]);
});

$('cancelDataBtn').addEventListener('click', () => {
  Modal.close('moDataConfirmModal');
  window._tempMOData = null;
  resetMO();
});

/* Completion */
$('completionOkBtn').addEventListener('click', () => {
  Modal.close('completionModal');
  resetMO();
});

/* Manual Confirm Buttons */
function bindManualConfirm(btnId, scale) {
  $(btnId).addEventListener('click', function () {
    if (!State.currentMO)  return console.warn('No MO active');
    if (!State.moData)     return console.warn('No MO data');
    if (scale !== getExpectedScale()) {
      console.warn(`Wrong scale: expected ${getExpectedScale()}, got ${scale}`);
      return;
    }

    const weight = parseFloat(DOM[scale].weight.textContent);
    const target = parseFloat(State.targetWeights[State.currentRMIndex]) || 0;
    if (isNaN(weight)) return;

    this.disabled = true;
    confirmCurrentRM(weight, target, scale, 'manual');
    setTimeout(() => {
      this.disabled = false;
    }, AUTO_CONFIRM_DELAY_MS + 300);
  });
}

bindManualConfirm('printBtnSmall', 'small');
bindManualConfirm('printBtnLarge', 'large');

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  updateActiveScaleHighlight();
  setScaleConnection('small', false);
  setScaleConnection('large', false);
  console.log('🏭 AMA Timbangan Aditif v2 — Ready');
});

