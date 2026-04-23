'use strict';

/**
 * MO Service
 * Handles all Manufacturing Order business logic:
 *   - Fetch MO data from Kanban API
 *   - Parse RM items and calculate per-lot target weights
 *   - Persist to database (non-blocking — errors are logged, not thrown)
 *   - Record print confirmations
 *   - Mark MO as completed
 */

const MOModel   = require('../models/moModel');
const { sendData, fetchData } = require('./apiService');
const config    = require('../config/config');

/* ── Input validation helpers ──────────────────────────── */

/**
 * Validate that a nomor_mo string is safe before using it in API calls.
 * Allowed: alphanumeric, hyphens, underscores, max 60 chars.
 */
function isValidMONumber(nomor_mo) {
  if (typeof nomor_mo !== 'string') return false;
  if (nomor_mo.length === 0 || nomor_mo.length > 60) return false;
  return /^[A-Za-z0-9\-_./]+$/.test(nomor_mo);
}

/* ── Main MO fetch + process ───────────────────────────── */

/**
 * Fetch MO from Kanban API, parse RM data, save to DB.
 * @param {string} nomor_mo
 * @returns {Promise<object>} Processed MO payload ready to emit to the client
 * @throws {Error} when API returns an error or nomor_mo is invalid
 */
async function fetchAndProcessMO(nomor_mo) {
  if (!isValidMONumber(nomor_mo)) {
    const err = new Error('Nomor MO tidak valid');
    err.status = 400;
    throw err;
  }

  const apiData = await sendData(config.api.kanban.findOneEndpoint, { nomor_mo });
  const item    = apiData;   // alias — keep original naming intent

  const {
    t_mo_id, work_center, nomor_mo: moNumber, nama_produk,
    schedule_mo, qty_plan, lot, produk_rm
  } = item.data;

  if (!Array.isArray(produk_rm) || produk_rm.length === 0) {
    throw new Error('Data RM kosong pada respon API');
  }
  if (!qty_plan || qty_plan <= 0) {
    throw new Error('qty_plan tidak valid pada respon API');
  }

  /* — Parse RM items — */
  const produkRMItems  = [];
  const produkRMQty    = [];
  const targetWeights  = [];

  produk_rm.forEach((rm, i) => {
    console.log(`  📦 RM[${i + 1}]: ${rm.item}  qty=${rm.qty}`);
    produkRMItems.push(rm.item);
    produkRMQty.push(rm.qty);
    targetWeights.push(parseFloat((rm.qty / qty_plan).toFixed(4)));
  });

  console.log(`📦 MO ${moNumber} — ${produkRMItems.length} RM, ${qty_plan} lot(s)`);

  /* — Persist to DB (best-effort, non-blocking) — */
  let moId = t_mo_id;
  try {
    await MOModel.create({
      t_mo_id, work_center, nomor_mo: moNumber, nama_produk,
      schedule_mo, qty_plan, lot: lot || 0, total_rm: produkRMItems.length
    });
    console.log(`✅ MO ${moNumber} saved to DB`);

    for (let i = 0; i < produkRMItems.length; i++) {
      await MOModel.createRMDetail(moId, {
        nomor_mo: moNumber,
        item:     produkRMItems[i],
        qty:      produkRMQty[i],
        target_weight: targetWeights[i]
      });
    }
    console.log('✅ RM details saved to DB');
  } catch (dbErr) {
    console.error('❌ DB error (non-fatal):', dbErr.message);
    // Continue — DB failure must not block the weighing session
  }

  /* — Notify external API — */
  sendData('/mo/confirmed', { item: item.data }).catch(e =>
    console.error('❌ Failed to notify /mo/confirmed:', e.message)
  );

  return {
    mo_id:           moId,
    nomor_mo:        moNumber,
    qty_plan,
    lot:             lot || 0,
    produk_rm_items: produkRMItems,
    produk_rm_qty:   produkRMQty,
    target_weights:  targetWeights,
    total_rm:        produkRMItems.length
  };
}

/* ── Print confirmation ────────────────────────────────── */

/**
 * Forward a print-confirm event to the external API.
 * @param {object} data - from the 'print-confirm' socket event
 */
async function recordPrintConfirm(data) {
  await sendData('/mo/print', { data });
  console.log(`✅ Print confirm sent: MO=${data.mo} lot=${data.lot} RM=${data.rm_index}`);
}

/* ── MO completion ─────────────────────────────────────── */

/**
 * Mark an MO as completed in DB and notify external API.
 * @param {object} data - from the 'mo-completed' socket event
 */
async function completeMO(data) {
  try {
    await MOModel.markAsCompleted(data);
    console.log(`✅ MO ${data.mo} marked as completed in DB`);
  } catch (dbErr) {
    console.error('❌ DB error on MO completion (non-fatal):', dbErr.message);
  }

  sendData('/mo/completed', { data }).catch(e =>
    console.error('❌ Failed to notify /mo/completed:', e.message)
  );
}

module.exports = { fetchAndProcessMO, recordPrintConfirm, completeMO };
