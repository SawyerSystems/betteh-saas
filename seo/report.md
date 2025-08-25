# SEO Report — CoachWillTumbles.com (v1)

Date: 2025-08-13

This is a scaffold to be populated by CI and manual notes.

## Summary
- Targets: SEO=100, Performance≥90 (mobile), A11y≥95
- CWV Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1

## Scorecards (Pre vs Post)
- To be filled after LHCI run

## Changes
- Head meta and JSON-LD across key routes via `SEOHead`
- robots.txt present with Sitemap
- sitemap.xml generated on build
- Noindex on auth/admin/private routes

## CWV Notes
- Preconnects added in index.html; lazy-loading for below-fold images

## Internal Linking Map
- To be captured in next iteration
# SEO Report — CoachWillTumbles.com v1

Date: 2025-08-13

This report tracks baseline and initial non-visual technical SEO updates. Lighthouse/CWV automated runs to be wired via CI next.

## Targets
- LCP < 2.5s, INP < 200ms, CLS < 0.1
- Lighthouse: Performance >= 90 (mobile), Accessibility >= 95, SEO = 100

## Changes (this PR)
- Default head tags in `client/index.html` (canonical, robots, OG/Twitter, preconnects)
- Added `SEOHead` component for per-page dynamic head/meta/JSON-LD (non-visual)
- Robots.txt with Sitemap reference
- Added sitemap generator script and build hook

## Pending
- Per-route titles/descriptions and JSON-LD injection via `SEOHead`
- LHCI in CI with budgets and CWV surfacing
- Alt text coverage audit (>95%) and aria/breadcrumbs markings

## CWV (Lab) — placeholder
- LCP: TBD
- INP: TBD
- CLS: TBD
