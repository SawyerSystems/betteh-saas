#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist', 'public');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[prerender-jsonld] dist/public/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexPath, 'utf8');

type RouteSpec = {
  route: string;
  jsonLdBlocks: string[]; // stringified JSON objects
};

const siteUrl = 'https://www.coachwilltumbles.com';

const routes: RouteSpec[] = [
  {
    route: 'booking',
    jsonLdBlocks: [
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Private Gymnastics & Tumbling Lessons',
        areaServed: { '@type': 'City', name: 'Oceanside' },
        provider: { '@type': 'LocalBusiness', name: 'Coach Will Tumbles' },
        serviceType: ['Gymnastics Lessons', 'Tumbling Coaching', 'Cheer Stunt'],
        offers: { '@type': 'Offer', priceCurrency: 'USD' },
      }),
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Booking', item: `${siteUrl}/booking` },
        ],
      }),
    ],
  },
  {
    route: 'contact',
    jsonLdBlocks: [
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': ['LocalBusiness', 'SportsActivityLocation'],
        name: 'Coach Will Tumbles',
        image: `${siteUrl}/icons/icon-512.png`,
        telephone: '(585) 755-8122',
        email: 'admin@coachwilltumbles.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '1935 Ave. del Oro #A',
          addressLocality: 'Oceanside',
          addressRegion: 'CA',
          postalCode: '92056',
          addressCountry: 'US',
        },
      }),
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteUrl}/contact` },
        ],
      }),
    ],
  },
  {
    route: 'blog',
    jsonLdBlocks: [
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Blog' }),
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        ],
      }),
    ],
  },
  {
    route: 'tips',
    jsonLdBlocks: [
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Tips' }),
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Tips', item: `${siteUrl}/tips` },
        ],
      }),
    ],
  },
];

function injectJsonLd(html: string, blocks: string[]): string {
  const insertion = blocks
    .map((b) => `<script type="application/ld+json">\n${b}\n</script>`)
    .join('\n');
  // Insert before closing </head>
  return html.replace('</head>', `${insertion}\n</head>`);
}

for (const r of routes) {
  const outDir = path.join(distDir, r.route);
  const outPath = path.join(outDir, 'index.html');
  fs.mkdirSync(outDir, { recursive: true });
  const withLd = injectJsonLd(baseHtml, r.jsonLdBlocks);
  fs.writeFileSync(outPath, withLd, 'utf8');
  console.log(`[prerender-jsonld] Wrote ${path.relative(process.cwd(), outPath)}`);
}

console.log('[prerender-jsonld] Done');
