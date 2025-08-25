// Test that bad request (missing lineItems) yields 400 with validation details
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TumbleCoach2025!';

async function login() {
  const resp = await axios.post(
    `${BASE_URL}/api/auth/login`,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const sessionCookie = resp.headers['set-cookie'][0].split(';')[0];
  return sessionCookie;
}

async function main() {
  try {
    const cookie = await login();

    const body = { invoiceTitle: 'No Items' }; // invalid – missing lineItems array

    const resp = await axios.post(`${BASE_URL}/api/admin/invoices/manual/export.pdf`, body, {
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      validateStatus: () => true,
    });

    if (resp.status !== 400) {
      console.error('Expected 400, got', resp.status, resp.data);
      process.exitCode = 1;
      return;
    }
    if (!resp.data || !resp.data.details) {
      console.error('Missing validation error details', resp.data);
      process.exitCode = 1;
      return;
    }

    console.log('✅ Bad request correctly returned 400 with details');
  } catch (e) {
    console.error('Test failed:', e?.message || e);
    process.exitCode = 1;
  }
}

main();
