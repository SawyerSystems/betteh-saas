#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

function assertFile(p: string) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${p}`);
  }
}

function main() {
  const publicDir = path.resolve(process.cwd(), 'client', 'public');
  const robots = path.join(publicDir, 'robots.txt');
  const sitemap = path.join(publicDir, 'sitemap.xml');
  assertFile(robots);
  assertFile(sitemap);

  const robotsTxt = fs.readFileSync(robots, 'utf8');
  if (!/Sitemap:\s?https?:\/\//i.test(robotsTxt)) {
    throw new Error('robots.txt missing Sitemap: line');
  }

  const sitemapXml = fs.readFileSync(sitemap, 'utf8');
  if (!sitemapXml.includes('<urlset')) {
    throw new Error('sitemap.xml missing <urlset>');
  }

  // Simple JSON-LD presence smoke check on home HTML template
  const indexHtml = path.resolve(process.cwd(), 'client', 'index.html');
  if (fs.existsSync(indexHtml)) {
    const html = fs.readFileSync(indexHtml, 'utf8');
    const hasOg = html.includes('og:title') && html.includes('twitter:card');
    if (!hasOg) console.warn('[seo] Warning: OG/Twitter tags not detected in index.html');
  }

  console.log('SEO validation: PASS');
}

try {
  main();
} catch (e: any) {
  console.error('SEO validation failed:', e?.message || e);
  process.exit(1);
}
