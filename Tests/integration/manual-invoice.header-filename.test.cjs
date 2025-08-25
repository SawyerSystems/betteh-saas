// Test that Content-Disposition filename is sanitized and present
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

    const body = {
      invoiceTitle: 'AUG 2025 / Coaching: Will & Kids *Test*',
      periodStart: '2025-08-01',
      periodEnd: '2025-08-31',
      lineItems: [ { athleteName: 'X', date: '2025-08-08', amountCents: 1000 } ],
    };

    const resp = await axios.post(`${BASE_URL}/api/admin/invoices/manual/export.pdf`, body, {
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    if (resp.status !== 200) {
      console.error('Unexpected status', resp.status, Buffer.from(resp.data||'').toString('utf8'));
      process.exitCode = 1;
      return;
    }

    const cd = resp.headers['content-disposition'] || '';
    if (!/attachment;\s*filename="[a-z0-9\-]+-INV-\d+\.pdf"/i.test(cd)) {
      console.error('Filename not sanitized as expected:', cd);
      process.exitCode = 1;
      return;
    }

    console.log('✅ Header filename looks sanitized:', cd);
  } catch (e) {
    console.error('Test failed:', e?.message || e);
    process.exitCode = 1;
  }
}

main();
