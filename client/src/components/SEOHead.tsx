import React, { useEffect } from 'react';

type SEOProps = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string; // e.g., "index,follow" or "noindex,nofollow"
  og?: Partial<Record<string, string>>;
  twitter?: Partial<Record<string, string>>;
  structuredData?: Array<Record<string, any>> | Record<string, any> | null;
};

function upsertMeta(nameOrProperty: { name?: string; property?: string }, content: string) {
  if (!content) return;
  const selector = nameOrProperty.name
    ? `meta[name='${nameOrProperty.name}']`
    : `meta[property='${nameOrProperty.property}']`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    if (nameOrProperty.name) el.setAttribute('name', nameOrProperty.name);
    if (nameOrProperty.property) el.setAttribute('property', nameOrProperty.property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  if (!href) return;
  let link = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(structuredData?: Array<Record<string, any>> | Record<string, any> | null) {
  // Remove previous injected scripts (id: seo-jsonld)
  const existing = document.head.querySelectorAll<HTMLScriptElement>('script[data-seo-jsonld]');
  existing.forEach((s) => s.remove());
  if (!structuredData) return;
  const items = Array.isArray(structuredData) ? structuredData : [structuredData];
  for (const item of items) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    (script as any).dataset.seoJsonld = 'true';
    script.text = JSON.stringify(item);
    document.head.appendChild(script);
  }
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl,
  robots,
  og,
  twitter,
  structuredData,
}) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) upsertMeta({ name: 'description' }, description);
    if (robots) {
      upsertMeta({ name: 'robots' }, robots);
    } else {
      // Ensure we have a default robots value if none provided
      const existingRobots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (!existingRobots) {
        upsertMeta({ name: 'robots' }, 'index,follow');
      }
    }

    if (canonicalUrl) setCanonical(canonicalUrl);

    // Open Graph defaults + overrides
    const ogDefaults: Record<string, string> = {
      'og:type': 'website',
      'og:title': title || document.title || 'Coach Will Tumbles',
      'og:description': description || '',
      'og:url': canonicalUrl || window.location.href,
    };
    Object.entries({ ...ogDefaults, ...(og || {}) }).forEach(([property, content]) => {
      if (content) upsertMeta({ property }, content);
    });

    // Twitter defaults + overrides
    const twDefaults: Record<string, string> = {
      'twitter:card': 'summary_large_image',
      'twitter:title': title || document.title || 'Coach Will Tumbles',
      'twitter:description': description || '',
    };
    Object.entries({ ...twDefaults, ...(twitter || {}) }).forEach(([name, content]) => {
      if (content) upsertMeta({ name }, content);
    });

    // JSON-LD
    setJsonLd(structuredData || null);

    return () => {
      // Leave tags in place on unmount for back/forward cache stability
    };
  }, [title, description, canonicalUrl, robots, JSON.stringify(og), JSON.stringify(twitter), JSON.stringify(structuredData)]);

  return null; // non-visual
};

export default SEOHead;
