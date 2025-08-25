#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

type Expect = { file: string; mustInclude: string[] };

const dist = path.resolve(process.cwd(), 'dist', 'public');
const cases: Expect[] = [
  { file: 'index.html', mustInclude: ['WebSite', 'LocalBusiness', 'BreadcrumbList'] },
  { file: 'booking/index.html', mustInclude: ['Service', 'BreadcrumbList'] },
  { file: 'contact/index.html', mustInclude: ['LocalBusiness', 'BreadcrumbList'] },
  { file: 'blog/index.html', mustInclude: ['CollectionPage', 'BreadcrumbList'] },
  { file: 'tips/index.html', mustInclude: ['CollectionPage', 'BreadcrumbList'] },
];

let failures: string[] = [];
let warnings: string[] = [];

for (const c of cases) {
  const p = path.join(dist, c.file);
  if (!fs.existsSync(p)) {
    // Not fatal if route is CSR-only in SPA, warn only
    warnings.push(`[jsonld-smoke] Skipping missing built file: ${c.file}`);
    continue;
  }
  const html = fs.readFileSync(p, 'utf8');
  const scripts = (html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g) || []).join('\n');
  for (const term of c.mustInclude) {
    if (!scripts.includes(term)) {
      failures.push(`${c.file}: missing JSON-LD type ${term}`);
    }
  }
}

if (warnings.length) {
  console.warn(warnings.join('\n'));
}

if (failures.length) {
  console.error('JSON-LD smoke test failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
} else {
  console.log('JSON-LD smoke test: PASS');
}
