#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import https from 'https';

// Basic sitemap generator using known routes
const baseUrl = process.env.SITE_URL || 'https://www.coachwilltumbles.com';
const now = new Date().toISOString();

const routes: string[] = [
  '/',
  '/about',
  '/booking',
  '/blog',
  '/tips',
  '/contact',
  '/parent/login',
  '/parent-register'
];

function escapeXml(str: string) {
  return str.replace(/[<>&"']/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
}

function urlXml(loc: string, priority = '0.7') {
  return `  <url>
    <loc>${escapeXml(baseUrl + loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      https
        .get(url, (res) => {
          if (res.statusCode && res.statusCode >= 400) return resolve(null);
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(null);
            }
          });
        })
        .on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

async function build() {
  const pieces: string[] = [];
  for (const route of routes) {
    pieces.push(urlXml(route, route === '/' ? '1.0' : '0.7'));
  }

  // Try to include detail pages when API is available
  const posts = await fetchJson<Array<{ id: number }>>(`${baseUrl}/api/blog-posts`).catch(() => null);
  if (posts && Array.isArray(posts)) {
    for (const p of posts) pieces.push(urlXml(`/blog/${p.id}`));
  }
  const tips = await fetchJson<Array<{ id: number }>>(`${baseUrl}/api/tips`).catch(() => null);
  if (tips && Array.isArray(tips)) {
    for (const t of tips) pieces.push(urlXml(`/tips/${t.id}`));
  }

  const urlset = pieces.join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  const outDir = path.resolve(process.cwd(), 'client', 'public');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
  console.log('Sitemap generated at client/public/sitemap.xml');
}

// Execute
build().catch((e) => {
  console.error('Sitemap generation failed', e);
  process.exit(0); // Don't break build
});
