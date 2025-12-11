// App Service Worker
// Production mode only

const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `zeroday-cache-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png'
];

const RUNTIME_CACHE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.webp$/
];

// Helper to check if URL matches runtime cache patterns
function shouldCacheRuntime(url) {
  const pathname = new URL(url).pathname;
  return RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[SW] Failed to precache some assets:', error);
        return cache.addAll(['/manifest.json', '/favicon.png']);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('zeroday-cache-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Check if request is a navigation request
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
    (request.method === 'GET' && 
     request.headers.get('accept') && 
     request.headers.get('accept').includes('text/html'));
}

// Fetch event - network first with SPA fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests and dev server requests
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || 
      request.url.includes('hot-update') ||
      request.url.includes('ws://') ||
      request.url.includes('wss://')) {
    return;
  }

  // Handle navigation requests (SPA routing)
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached index.html for offline navigation
          return caches.match('/');
        })
    );
    return;
  }

  // Handle other requests (assets, etc.)
  // Use stale-while-revalidate for runtime assets
  if (shouldCacheRuntime(request.url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
