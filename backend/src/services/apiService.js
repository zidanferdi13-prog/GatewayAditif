'use strict';

const axios = require('axios');
const config = require('../config/config');

const client = axios.create({
  baseURL: config.api.kanban.baseUrl,
  timeout: 10000,                              // 10 s — prevent hanging
  headers: { 'Content-Type': 'application/json' }
});

/**
 * POST data to a Kanban API endpoint.
 * @param {string} endpoint - Path such as '/mo/confirmed'
 * @param {object} data
 * @returns {Promise<object>} Response body
 */
async function sendData(endpoint, data) {
  const response = await client.post(endpoint, data);
  console.log(`✅ [API] POST ${endpoint} — ${response.status}`);
  return response.data;
}

/**
 * GET data from a Kanban API endpoint.
 * @param {string} endpoint
 * @returns {Promise<object>} Response body
 */
async function fetchData(endpoint) {
  const response = await client.get(endpoint);
  return response.data;
}

module.exports = { sendData, fetchData };
