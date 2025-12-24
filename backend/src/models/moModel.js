/**
 * Manufacturing Order Model
 * Handles database operations for MO, RM details, and weight records
 */

const db = require('../config/database');

class MOModel {
  /**
   * Create new Manufacturing Order
   * @param {Object} data - MO data {nomor_mo, qty_plan, lot, total_rm}
   * @returns {Promise} Insert result
   */
  static async create(data) {
    const query = `
      INSERT INTO tbl_m_manufacturing_orders 
      (t_mo_id, work_center, nomor_mo, nama_produk, schedule_mo, qty_plan, lot, total_rm, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    try {
      const [result] = await db.execute(query, [
        data.t_mo_id,
        data.work_center,
        data.nomor_mo, 
        data.nama_produk,
        data.schedule_mo,
        data.qty_plan, 
        data.lot, 
        data.total_rm
      ]);
      return result;
    } catch (error) {
      console.error('❌ Error creating MO:', error.message);
      throw error;
    }
  }

  /**
   * Create RM detail for specific MO
   * @param {Number} moId - MO ID
   * @param {Object} data - RM data {item, qty, target_weight}
   * @returns {Promise} Insert result
   */
  static async createRMDetail(moId, data) {
    const query = `
      INSERT INTO tbl_mo_rm_details 
      (mo_id, item, qty, target_weight, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    try {
      const [result] = await db.execute(query, [
        data.nomor_mo, 
        data.item, 
        data.qty, 
        data.target_weight
      ]);
      return result;
    } catch (error) {
      console.error('❌ Error creating RM detail:', error.message);
      throw error;
    }
  }

  /**
   * Create weight record
   * @param {Object} data - Weight data {mo_id, rm_item, actual_weight, timestamp}
   * @returns {Promise} Insert result
   */
  static async createWeightRecord(data) {
    const query = `
      INSERT INTO tbl_weight_records 
      (mo_id, rm_item, actual_weight, timestamp) 
      VALUES (?, ?, ?, ?)
    `;
    try {
      const [result] = await db.execute(query, [
        data.nomor_mo, 
        data.rm_item, 
        data.actual_weight, 
        data.timestamp
      ]);
      return result;
    } catch (error) {
      console.error('❌ Error creating weight record:', error.message);
      throw error;
    }
  }

  /**
   * Get MO by nomor_mo
   * @param {String} nomorMO - MO number
   * @returns {Promise} MO data with RM details
   */
  static async getByNomorMO(nomorMO) {
    const query = `
      SELECT mo.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'item', rm.item,
                 'qty', rm.qty,
                 'target_weight', rm.target_weight
               )
             ) as rm_details
      FROM tbl_m_manufacturing_orders mo
      LEFT JOIN tbl_mo_rm_details rm ON mo.id = rm.mo_id
      WHERE mo.nomor_mo = ?
      GROUP BY mo.id
    `;
    try {
      const [rows] = await db.execute(query, [nomorMO]);
      return rows[0] || null;
    } catch (error) {
      console.error('❌ Error getting MO:', error.message);
      throw error;
    }
  }

  /**
   * Get weight records for specific MO
   * @param {Number} moId - MO ID
   * @returns {Promise} Array of weight records
   */
  static async getWeightRecords(moId) {
    const query = `
      SELECT * FROM tbl_weight_records 
      WHERE mo_id = ? 
      ORDER BY timestamp DESC
    `;
    try {
      const [rows] = await db.execute(query, [moId]);
      return rows;
    } catch (error) {
      console.error('❌ Error getting weight records:', error.message);
      throw error;
    }
  }

  /**
   * Update MO status
   * @param {Number} moId - MO ID
   * @param {String} status - New status
   * @returns {Promise} Update result
   */
  static async updateStatus(moId, status) {
    const query = `
      UPDATE tbl_m_manufacturing_orders 
      SET status = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    try {
      const [result] = await db.execute(query, [status, moId]);
      return result;
    } catch (error) {
      console.error('❌ Error updating MO status:', error.message);
      throw error;
    }
  }
}

module.exports = MOModel;
