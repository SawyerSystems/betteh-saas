# SEO Prompt — CoachWillTumbles.com

Last updated: 2025-08-13

This document is the single source of truth for non-visual SEO work in this repo. Paste or refine your SEO guidance here; we’ll implement strictly from this.

## How to use
- Paste your master SEO brief under “Authoritative Prompt”.
- Use the “Per-Page Specs” section to define titles/descriptions/canonicals and schema per route.
- We’ll keep this file in version control and reference it during changes.

---

## Authoritative Prompt
<!-- Goal: Maximize SEO to compete for #1 on Google/Bing/Yandex without changing visible UI/UX. You may edit only non-visual layers (head tags, metadata, attributes, schema, headers, robots, sitemaps, caching, perf).
Repo: This workspace. Prod URL (if available): <insert>.
Constraints (must obey)
Do not alter layout, copy, colors, or component structure users see.
Allowed: <head> tags, meta, link, canonical, hreflang, robots, JSON-LD schema, image alt, aria-label (non-visual), rel=preload/preconnect, HTTP caching headers, redirects, sitemap(s), robots.txt, server config, build pipeline, perf optimizations that don’t change visuals.
Additions must be idempotent and type-safe with tests.
Tasks
Baseline scan
Run Lighthouse + Core Web Vitals for mobile & desktop.
Dump renderable HTML for top templates (home, services, blog index, blog post, booking, contact, 404).
Collect: title length, meta description, h1 presence/uniqueness, canonical, OG/Twitter tags, robots meta, structured data types present, image alt coverage, link rels, internal link depth, pagination tags, 3xx/4xx, sitemap & robots references.
Technical SEO
Create/validate:
sitemap.xml (and index if multiple), auto-generated in CI.
robots.txt with correct Sitemap: line; disallow only what’s needed.
Canonicals across all pages (self-referencing unless otherwise needed).
hreflang if multi-locale; otherwise omit.
Pagination: rel="prev/next" where relevant or strong internal links.
301 rules for www/non-www, http→https, trailing slash policy, and duplicate paths/params.
404 and 410 behavior for removed content.
On-page (non-visual)
For every template:
Generate unique, keyword-targeted <title> (50–60 chars) and meta description (140–160).
Ensure a single <h1> and semantic outline (no visual changes).
Add comprehensive JSON-LD:
Organization/LocalBusiness (with sameAs), WebSite + SearchAction.
Template-specific: Article/BlogPosting, Product (if applicable), Service, FAQPage, BreadcrumbList, HowTo where appropriate.
Add Open Graph + Twitter cards with fallbacks.
Fill missing alt text (programmatic but human-sensible); do not stuff keywords.
Mark nav breadcrumbs (aria) for accessibility and snippet eligibility.
Performance (CWV)
Without altering visuals:
Add rel=preconnect/dns-prefetch for critical origins.
Convert heavy images to webp/avif with same dimensions; keep srcset + sizes.
Add loading="lazy" to below-the-fold media; decoding="async".
Preload critical webfont subsets; use font-display: swap.
Tree-shake & code-split; defer non-critical scripts; move 3P scripts to async/defer.
Set HTTP caching (immutable for hashed assets, sensible TTLs for HTML).
Generate a CWV report with LCP/INP/CLS targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
Internal linking & crawl budget
Build an internal links map; ensure all money pages are ≤3 clicks from home.
Add contextual (non-visual) links where allowed (e.g., footer/head markup only).
No orphan pages; fix parameterized duplicates; add noindex to thin/admin pages.
Deliverables
seo/report.md with:
Scorecards (pre vs post), CWV numbers, prioritized issues (P0–P2), and wins.
Checklist of what changed and why, with file paths.
seo/issues.json structured list (page→issues→fix).
Open a PR with all edits, tests, and CI that:
Validates sitemap/robots.
Runs Lighthouse CI.
Lints titles/descriptions for length & uniqueness.
Validates JSON-LD with schema.org types.
Acceptance criteria
All pages have valid canonical, unique title/meta, proper schema, and OG/Twitter tags.
Sitemap/robots correctly deployed; 200 for sitemap, robots allows crawl.
No duplicate content paths; redirects consistent.
Image alt coverage ≥95% (non-decorative).
Lighthouse Performance ≥90 mobile (target), Accessibility ≥95, SEO ≥100.
CWV lab metrics meet targets; document any limits due to third-party scripts.
Start now. Output a short execution plan, then proceed step-by-step creating the PR and seo/report.md.

Make CoachWillTumbles.com rank #1 on Google/Bing for parents booking private lessons for cheerleaders, gymnasts, tumbling, and stunting in Oceanside, California — without changing visible UI/UX. Only touch technical SEO, metadata, structured data, and other non-visual elements.
Scope & Constraints
Do not alter visible text, layout, colors, images, or structure.
You may:
Edit <head> meta tags, titles, descriptions.
Add/optimize Open Graph & Twitter card tags.
Add JSON-LD schema.
Add/optimize canonical tags, hreflang (if needed).
Improve alt text for images (non-keyword-stuffed, human-readable).
Optimize internal linking in code (not in visible layout).
Generate/update sitemap.xml and robots.txt.
Implement performance tweaks that don’t alter visuals.
Normalize redirects (301) and fix crawl errors.
1. Local & Niche Targeting
Main target keyword clusters:
"Private gymnastics lessons Oceanside CA"
"Private tumbling coach Oceanside"
"Cheer stunt coach near Oceanside"
"Kids gymnastics coach near me"
"Tumbling classes for kids Oceanside"
Ensure these terms appear naturally in:
<title> (50–60 chars, unique per page)
Meta descriptions (140–160 chars, persuasive for parents)
Alt text (descriptive but not spammy)
JSON-LD where relevant
2. Page Types to Audit & Optimize
Home page — strongest local intent; primary conversion keywords.
Booking page — optimize for "book private lessons Oceanside".
Athlete portal — schema for SportsActivityLocation / SportsClub.
Blog posts — schema Article / BlogPosting.
Features page — highlight benefits for parents booking lessons.
Contact page — local SEO: full NAP (Name, Address, Phone) in schema.
3. Structured Data (JSON-LD)
Add LocalBusiness schema for Coach Will Tumbles:
@type: "SportsActivityLocation" + "LocalBusiness"
address: Oceanside Gymnastics’ full address
geo: Lat/long for gym
openingHours: based on actual lesson availability
priceRange: e.g., "$$"
sameAs: links to social profiles
Add Service schema for:
Gymnastics Lessons
Cheerleading/Tumbling Lessons
Stunt Coaching
Add FAQPage schema for top parent questions (from booking page or blog).
Add BreadcrumbList schema for all navigable pages.
4. Technical SEO Checklist
One <h1> per page, keyword-aligned.
Canonical tag on each page (self-referencing unless redirecting).
robots.txt allowing crawl; link to sitemap.
sitemap.xml with all public pages, auto-regenerated on deploy.
301 redirect rules:
Force https
Non-www to www or vice versa (choose one)
Trailing slash consistency
Ensure no duplicate content URLs.
5. Performance (Core Web Vitals)
Lazy-load non-critical images.
Convert large hero/background images to WebP/AVIF.
Preload key fonts; font-display: swap.
Preconnect to critical domains (fonts, analytics, CDN).
Defer non-critical JS.
6. Deliverables
seo/report.md with:
Before/after Lighthouse SEO scores.
CWV metrics (LCP, INP, CLS).
All changes listed with file paths.
Updated sitemap.xml and robots.txt.
Updated head/meta/schema for all key pages.
Internal linking map (textual in report).
PR titled: "SEO Local Optimization — CoachWillTumbles.com v1".
Acceptance Criteria
Lighthouse SEO score = 100.
JSON-LD passes Google Rich Results Test for all types.
All target keywords appear naturally in titles/meta without affecting visible content.
LocalBusiness schema includes complete and correct NAP.
Sitemap and robots.txt deployed and valid.
All images have descriptive alt text.
CWV meets Google "Good" thresholds for mobile & desktop. -->



---

## Global Goals & Constraints
- Goal: Rank #1 locally for private gymnastics/tumbling/cheer stunt lessons in Oceanside, CA.
- Constraint: No visible UI/UX changes (non-visual layers only).
- Pages must have: canonical, unique title (50–60 chars), meta description (140–160 chars), OG/Twitter, valid JSON-LD.
- Sitemap and robots must be deployed and 200.
- CWV targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.

## Target Keyword Clusters
- "Private gymnastics lessons Oceanside CA"
- "Private tumbling coach Oceanside"
- "Cheer stunt coach near Oceanside"
- "Kids gymnastics coach near me"
- "Tumbling classes for kids Oceanside"

## Business Details (for LocalBusiness schema)
- Name: Coach Will Tumbles
- Location: Oceanside Gymnastics, 1935 Ave. del Oro #A, Oceanside, CA 92056
- Phone: (585) 755-8122
- Email: admin@coachwilltumbles.com
- Geo: [lat,long TBD]
- Hours: See server/index.ts siteContent.hours (or specify here explicitly)
- SameAs: [Facebook], [Instagram], [YouTube], [Google Business]

---

## Per-Page Specs
Use the template below per route. Add as many routes as needed.

### Template
- route: /example
- title: 
- metaDescription: 
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/example
- ogImage: https://www.coachwilltumbles.com/icons/icon-512.png
- twitterImage: (optional override)
- schema:
  - types: [WebPage, BreadcrumbList, Service | Article | BlogPosting | FAQPage | LocalBusiness | SportsActivityLocation]
  - data notes: (key fields to include)
- breadcrumbs: Home > Example
- notes: (anything special like noindex, pagination, etc.)

### Home
- route: /
- title: Private Gymnastics & Tumbling Lessons | Oceanside, CA
- metaDescription: Book private gymnastics, tumbling, and cheer stunt lessons in Oceanside, CA. Personalized 1-on-1 coaching for kids and teens. Safe, fun, and progress-driven.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/
- schema:
  - types: [WebSite, LocalBusiness, SportsActivityLocation, BreadcrumbList]
  - data notes: include SearchAction, NAP, geo, priceRange, openingHours

### Booking
- route: /booking
- title: Book Private Gymnastics & Tumbling Lessons | Oceanside
- metaDescription: View availability and book 30 or 60-minute private or semi-private sessions with Coach Will Tumbles in Oceanside, CA. Secure checkout.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/booking
- schema:
  - types: [WebPage, Service, BreadcrumbList, FAQPage]
  - data notes: Services for Gymnastics/Tumbling/Cheer Stunt; FAQs

### Contact
- route: /contact
- title: Contact Coach Will Tumbles | Oceanside Gymnastics
- metaDescription: Call (585) 755-8122 or email admin@coachwilltumbles.com to ask questions or plan training. Visit 1935 Ave. del Oro #A, Oceanside, CA 92056. Were here to help.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/contact
- schema:
  - types: [WebPage, LocalBusiness, BreadcrumbList]
  - data notes: Full NAP, geo

### Blog Index
- route: /blog
- title: Training Blog | Gymnastics, Tumbling, Cheer Tips
- metaDescription: Practical training tips from Coach Will Tumblesskill progressions, safety habits, drills, and parent guides to support confident gymnastics, tumbling, and cheer.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/blog
- schema:
  - types: [CollectionPage, BreadcrumbList]

### Blog Post
- route: /blog/:id
- title: {post.title} | Coach Will Tumbles Blog
- metaDescription: Read about {post.topic}: coaching insights, drills, and safety tips from Coach Will Tumbles. Published {date}.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/blog/{slug}
- schema:
  - types: [Article, BlogPosting, BreadcrumbList]
  - data notes: author, datePublished, dateModified, headline, image

### Tips Index
- route: /tips
- title: How-To Tips | Tumbling & Gymnastics Tutorials
- metaDescription: Step-by-step how-to guides from Coach Will Tumblesclear progressions for cartwheels, back handsprings, aerials, and moresafety notes and coaching cues included.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/tips
- schema:
  - types: [CollectionPage, BreadcrumbList]

### Tips Detail
- route: /tips/:id
- title: {tip.title} — How To | Step-by-Step Guide
- metaDescription: Learn {tip.skill} with clear steps, safety notes, and coaching cues from Coach Will Tumbles.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/tips/{slug}
- schema:
  - types: [Article, HowTo, BreadcrumbList]

### About
- route: /about
- title: About Coach Will Tumbles | Private Coach in Oceanside
- metaDescription: Meet Coach Will Tumblesan experienced kids gymnastics and tumbling coach in Oceanside, CA. Safe progressions, positive mindset, and real results for young athletes.
- robots: index,follow
- canonical: https://www.coachwilltumbles.com/about
- schema:
  - types: [WebPage, BreadcrumbList]

### Progress Share (public tokens)
- route: /progress/:token
- robots: noindex, nofollow
- canonical: (omit)
- schema:
  - types: [WebPage]

### 404
- route: *
- robots: noindex,follow
- schema:
  - types: [WebPage]

---

## Technical SEO Requirements
- Canonicals: self-referencing unless otherwise noted.
- Pagination: rel prev/next when needed or strong internal links.
- Redirects: http→https, www policy, trailing slash consistency (document desired policy here).
- 404/410: return proper status; 410 for permanently removed content.
- robots.txt: must include `Sitemap: https://www.coachwilltumbles.com/sitemap.xml`.
- Sitemap: auto-generated on build; include key routes and content pages.

## Performance (CWV)
- Preconnect/dns-prefetch critical domains (fonts, Stripe, Supabase if needed).
- Lazy-load non-critical media; decoding="async".
- Preload critical webfonts; font-display: swap.
- Cache: immutable for hashed assets; HTML no-cache.
- Defer/async non-critical scripts.

## Internal Linking & Crawl
- Money pages ≤ 3 clicks from home.
- No orphan pages; add footer/head-only links if needed (non-visual).
- Add noindex to thin/admin pages.

---

## Implementation Notes
- All changes must be non-visual and type-safe.
- Use `SEOHead` for per-page injection of meta and JSON-LD.
- Keep alt text descriptive, not keyword-stuffed.

## Rollout Checklist
- [ ] Titles/descriptions per page populated
- [ ] JSON-LD validated (LocalBusiness, Service, Article, FAQPage, BreadcrumbList)
- [ ] Canonicals present and correct
- [ ] robots.txt deployed and valid
- [ ] sitemap.xml deployed (200) and accurate
- [ ] LHCI runs in CI; SEO >= 100, Perf >= 90 mobile
- [ ] CWV lab targets hit; document 3P limitations if any
