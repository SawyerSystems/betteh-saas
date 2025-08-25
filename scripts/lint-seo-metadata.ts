#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

type Spec = { route: string; title?: string; metaDescription?: string };

function parseSpecs(md: string): Spec[] {
  const sections = md.split('### ').slice(1); // skip heading
  const specs: Spec[] = [];
  for (const s of sections) {
    const routeMatch = s.match(/- route:\s*(.*)/);
    const titleMatch = s.match(/- title:\s*(.*)/);
    const descMatch = s.match(/- metaDescription:\s*(.*)/);
    if (routeMatch) {
      specs.push({
        route: routeMatch[1].trim(),
        title: titleMatch?.[1]?.trim(),
        metaDescription: descMatch?.[1]?.trim(),
      });
    }
  }
  return specs;
}

function validate(specs: Spec[]) {
  const enforcedRoutes = new Set<string>(['/','/booking','/contact','/blog','/tips','/about']);
  const errors: string[] = [];
  const warnings: string[] = [];
  const titles = new Map<string, string>();
  for (const spec of specs) {
    // Skip template and dynamic/noindex routes
    if (spec.route === '/example' || spec.route.includes(':') || spec.route === '*' || spec.route.startsWith('/progress/')) {
      // len warnings for info only
      if (spec.title) {
        const tlen = spec.title.replace(/\{.*?\}/g, 'X').length;
        if (tlen < 45 || tlen > 65) warnings.push(`${spec.route}: title length ~${tlen} (advisory)`);
      }
      if (spec.metaDescription) {
        const dlen = spec.metaDescription.replace(/\{.*?\}/g, 'X').length;
        if (dlen < 130 || dlen > 170) warnings.push(`${spec.route}: description length ~${dlen} (advisory)`);
      }
      continue;
    }

    const isEnforced = enforcedRoutes.has(spec.route);
    if (isEnforced) {
      if (spec.title) {
        const len = spec.title.replace(/\{.*?\}/g, 'X').length; // approximate for patterns
        if (len < 45 || len > 65) warnings.push(`${spec.route}: title length ~${len} out of 50–60`);
        const existing = Array.from(titles.values()).find(t => t === spec.title);
        if (existing) errors.push(`${spec.route}: duplicate title detected`);
        titles.set(spec.route, spec.title);
      } else {
        errors.push(`${spec.route}: missing title`);
      }
      if (spec.metaDescription) {
        const len = spec.metaDescription.replace(/\{.*?\}/g, 'X').length;
        if (len < 130 || len > 170) warnings.push(`${spec.route}: meta description length ~${len} out of 140–160`);
      } else {
        errors.push(`${spec.route}: missing meta description`);
      }
    }
  }
  if (warnings.length) {
    console.warn('SEO metadata lint warnings:\n' + warnings.map(w => ' - ' + w).join('\n'));
  }
  if (errors.length) {
    console.error('SEO metadata lint failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  } else {
    console.log('SEO metadata lint: PASS');
  }
}

const mdPath = path.resolve(process.cwd(), 'docs/SEOPrompt.md');
const md = fs.readFileSync(mdPath, 'utf8');
const specs = parseSpecs(md);
validate(specs);
