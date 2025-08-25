// Service Worker for Coach Will Tumbles - Performance Optimization

const CACHE_NAME = 'coach-will-tumbles-v1.0';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// Cache strategies for different content types
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: ['/assets/', '/images/', '/icons/'],
  
  // API content with longer cache times
  longCache: ['/api/stripe/products', '/api/blog-posts', '/api/tips'],
  
  // API content with shorter cache times
  shortCache: ['/api/auth/status', '/api/parent-auth/status'],
  
  // Dynamic content - network first
  dynamic: ['/api/bookings', '/api/available-times']
};

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![CACHE_NAME, STATIC_CACHE, API_CACHE].includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    if (CACHE_STRATEGIES.longCache.some(route => url.pathname.startsWith(route))) {
      // Stale-while-revalidate for long-cache API content
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
    } else if (CACHE_STRATEGIES.shortCache.some(route => url.pathname.startsWith(route))) {
      // Network first with short cache for auth content
      event.respondWith(networkFirst(request, API_CACHE, 2000));
    } else if (CACHE_STRATEGIES.dynamic.some(route => url.pathname.startsWith(route))) {
      // Network only for dynamic content
      event.respondWith(fetch(request));
    }
    return;
  }

  // Handle static assets
  if (CACHE_STRATEGIES.static.some(path => url.pathname.includes(path))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default: network first for HTML pages
  event.respondWith(networkFirst(request, CACHE_NAME, 3000));
});

// Cache strategies implementation
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeout = 3000) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), timeout)
      )
    ]);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      // Clone the response before caching to avoid "Response body is already used" error
      const responseClone = response.clone();
      cache.then(c => c.put(request, responseClone));
    }
    return response;
  });

  return cachedResponse || fetchPromise;
}