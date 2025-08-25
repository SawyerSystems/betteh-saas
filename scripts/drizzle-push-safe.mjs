#!/usr/bin/env node
// Safe wrapper for drizzle-kit push
// Behavior:
// - On Render (detected via env vars like RENDER or RENDER_EXTERNAL_URL), this script will SKIP pushing
//   unless ALLOW_DB_PUSH_ON_RENDER=true is set.
// - Elsewhere (local/dev/CI), it runs `drizzle-kit push` normally.

import { spawn } from 'node:child_process';

const isRender = !!(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID);
const allowOnRender = String(process.env.ALLOW_DB_PUSH_ON_RENDER).toLowerCase() === 'true';

if (isRender && !allowOnRender) {
  console.log('[drizzle-push-safe] Detected Render environment. Skipping drizzle-kit push.');
  console.log('[drizzle-push-safe] To force push on Render, set ALLOW_DB_PUSH_ON_RENDER=true (NOT recommended).');
  process.exit(0);
}

// Run drizzle-kit push
const child = spawn('npx', ['drizzle-kit', 'push'], {
  stdio: 'inherit',
  env: process.env,
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
