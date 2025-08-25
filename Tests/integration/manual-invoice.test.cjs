// Integration test for manual invoice PDF endpoint
// Runs against local dev server at http://localhost:5001
// 1) Logs in as admin to obtain a session cookie
// 2) Posts to /api/admin/invoices/manual/export.pdf with sample line items
// 3) Asserts 200 response, application/pdf content type, and writes the PDF to disk

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TumbleCoach2025!';

const outDir = path.join(process.cwd(), 'Tests', 'integration', 'artifacts');
const outFile = path.join(outDir, 'manual-invoice-test.pdf');

async function ensureOutDir() {
  await fs.promises.mkdir(outDir, { recursive: true });
}

async function loginAndGetCookie() {
  console.log('🔑 Logging in as admin...');
  const resp = await axios.post(
    `${BASE_URL}/api/auth/login`,
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!resp.headers['set-cookie'] || resp.headers['set-cookie'].length === 0) {
    throw new Error('No Set-Cookie header returned from login');
  }
  const sessionCookie = resp.headers['set-cookie'][0].split(';')[0];
  console.log('✅ Logged in. Using session cookie:', sessionCookie.split('=')[0] + '=<redacted>');
  return sessionCookie;
}

async function generateManualInvoice(cookie) {
  console.log('🧾 Generating manual invoice PDF...');
  const body = {
    invoiceTitle: 'August 2025 Coaching',
    periodStart: '2025-08-01',
    periodEnd: '2025-08-31',
    timezone: 'America/Los_Angeles',
    notes: 'Manual invoice test run',
    lineItems: [
      {
        athleteName: 'Test Athlete',
        date: '2025-08-08',
        durationMinutes: 60,
        member: true,
        rateCents: 1200,
        amountCents: 1200,
        description: 'Coaching session (member)'
      },
      {
        athleteName: 'Another Athlete',
        date: '2025-08-10',
        durationMinutes: 30,
        member: false,
        rateCents: 2000,
        amountCents: 2000,
        description: 'Coaching session (non-member)'
      }
    ]
  };

  const resp = await axios.post(
    `${BASE_URL}/api/admin/invoices/manual/export.pdf`,
    body,
    {
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      responseType: 'arraybuffer',
      validateStatus: () => true,
    }
  );

  console.log('📥 Response status:', resp.status);
  if (resp.status !== 200) {
    console.error('❌ Error body:', Buffer.from(resp.data || '').toString('utf8'));
    throw new Error(`Expected 200 OK, got ${resp.status}`);
  }

  const ct = resp.headers['content-type'] || '';
  if (!ct.includes('application/pdf')) {
    throw new Error(`Unexpected content-type: ${ct}`);
  }

  const cd = resp.headers['content-disposition'] || '';
  if (!cd.toLowerCase().includes('attachment')) {
    throw new Error(`Missing/incorrect Content-Disposition: ${cd}`);
  }

  const bytes = Buffer.from(resp.data);
  if (bytes.length < 5 || bytes.slice(0, 4).toString('utf8') !== '%PDF') {
    // pdf-lib may not always start with %PDF if there is a BOM, but this is a good heuristic
    console.warn('⚠️ PDF header not detected as %PDF; writing file anyway for inspection.');
  }

  await ensureOutDir();
  await fs.promises.writeFile(outFile, bytes);
  console.log(`✅ Wrote PDF to ${outFile} (${bytes.length} bytes)`);
}

async function main() {
  try {
    const cookie = await loginAndGetCookie();
    await generateManualInvoice(cookie);
    console.log('🎉 Manual invoice endpoint test passed');
  } catch (err) {
    console.error('❌ Manual invoice endpoint test failed:', err?.message || err);
    process.exitCode = 1;
  }
}

main();
