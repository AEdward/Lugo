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

// Surface Chapa's actual error message (e.g. "Invalid authorization credentials")
// instead of axios's generic "Request failed with status code 401".
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Chapa's "message" field is a plain string for most errors (e.g. bad
      // auth), but for validation failures it's an object keyed by field
      // name (e.g. { email: ["email is required"] }) — stringify either way.
      const rawMessage = error.response.data?.message;
      const chapaMessage =
        typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage ?? error.response.data);
      const wrapped = new Error(`Chapa API error (${error.response.status}): ${chapaMessage}`);
      wrapped.status = error.response.status;
      wrapped.chapaResponse = error.response.data;
      return Promise.reject(wrapped);
    }
    return Promise.reject(error);
  }
);

function assertConfigured() {
  if (!chapaConfig.secretKey) {
    throw new Error(
      'CHAPA_SECRET_KEY is not set. Add it to your .env file and restart the server before accepting payments.'
    );
  }
}

/**
 * Initialize a Chapa checkout transaction.
 * https://developer.chapa.co/docs/accept-payments
 */
async function initializeTransaction({ txRef, amount, currency, email, firstName, lastName, callbackUrl, returnUrl, title, description }) {
  assertConfigured();

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
  assertConfigured();

  const response = await client.get(`/transaction/verify/${encodeURIComponent(txRef)}`);
  return response.data;
}

module.exports = { initializeTransaction, verifyTransaction };
