# SEO Implementation Plan (derived from SEOPrompt.md)

Scope: Non-visual SEO per brief. This plan turns the prompt into actionable PR steps.

## Step 1 — Per-page meta + JSON-LD wiring
- Add SEOHead to key pages (home, booking, contact, blog index/post, tips index/detail, 404)
- Pull canonical base from SITE_URL (fallback to window.location) and route path
- Inject:
  - title/metaDescription from SEOPrompt.md specs
  - canonical (self-referencing)
  - robots according to page
  - OG/Twitter fallbacks
  - JSON-LD per template: WebSite, LocalBusiness, SportsActivityLocation, Service, Article/BlogPosting, FAQPage, BreadcrumbList

## Step 2 — Sitemaps
- Expand generator to include dynamic blog/tips routes if available; fallback to static list
- Ensure build outputs sitemap.xml

## Step 3 — Robots and redirects
- robots.txt present with Sitemap line (done)
- Document redirect policy (https, www/non-www, trailing slash) in SEOPrompt.md for server config

## Step 4 — Performance tweaks (non-visual)
- Preconnects (done base); add any Supabase/asset origins if needed
- Lazy-load below-the-fold images via loading="lazy" and decoding="async" (safe, non-visual)
- font-display: swap already via Tailwind; consider preloading fonts if custom

## Step 5 — Tests & CI
- Add simple node tests to validate robots/sitemap exist (200) in dev build
- Add JSON-LD validation smoke test (well-formed JSON in head)
- Add title/description length lint for pages

## Deliverables
- PR: "SEO Local Optimization — CoachWillTumbles.com v1"
- Updated pages with SEOHead wiring
- Enhanced sitemap generator
- Tests validating presence of essentials
- Updated seo/report.md with outcomes
