const axios = require('axios');
const chapaConfig = require('../config/chapa');

const client = axios.create({
  baseURL: chapaConfig.baseUrl,
  headers: {
    Authorization: `Bearer ${chapaConfig.secretKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Initialize a Chapa checkout transaction.
 * https://developer.chapa.co/docs/accept-payments
 */
async function initializeTransaction({ txRef, amount, currency, email, firstName, lastName, callbackUrl, returnUrl, title, description }) {
  const response = await client.post('/transaction/initialize', {
    tx_ref: txRef,
    amount: String(amount),
    currency: currency || 'ETB',
    email,
    first_name: firstName,
    last_name: lastName,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: (title || 'Lugo Tailoring').slice(0, 16),
      description: description || 'Custom suit order',
    },
  });

  return response.data;
}

/**
 * Verify a transaction after payment (called from webhook or return page).
 */
async function verifyTransaction(txRef) {
  const response = await client.get(`/transaction/verify/${encodeURIComponent(txRef)}`);
  return response.data;
}

module.exports = { initializeTransaction, verifyTransaction };
