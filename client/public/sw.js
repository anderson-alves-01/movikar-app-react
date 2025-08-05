const CACHE_NAME = 'alugae-mobi-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network with error handling
self.addEventListener('fetch', (event) => {
  try {
    // Skip caching for non-GET requests, non-HTTP schemes, and API endpoints
    if (event.request.method !== 'GET' || 
        !event.request.url.startsWith('http') ||
        event.request.url.includes('/api/')) {
      event.respondWith(
        fetch(event.request).catch(err => {
          console.log('Fetch error for non-cached request:', err);
          return new Response('Network error', { status: 503 });
        })
      );
      return;
    }

    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((response) => {
            // Check if we received a valid response and can be cached
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Skip caching for chrome-extension and other non-http schemes
            if (!event.request.url.startsWith('http')) {
              return response;
            }

            // Clone the response for cache with error handling
            try {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.log('Cache put error:', err);
                });
            } catch (err) {
              console.log('Response clone error:', err);
            }

            return response;
          }).catch(err => {
            console.log('Network fetch error:', err);
            return new Response('Network error', { status: 503 });
          });
        })
        .catch(err => {
          console.log('Cache match error:', err);
          return fetch(event.request).catch(() => {
            return new Response('Network error', { status: 503 });
          });
        })
    );
  } catch (error) {
    console.log('Fetch event error:', error);
    event.respondWith(
      new Response('Service worker error', { status: 503 })
    );
  }
});

// Push notifications with error handling
self.addEventListener('push', (event) => {
  try {
    let options = {
      body: 'Nova notificação do alugae',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver Detalhes',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'close', 
          title: 'Fechar',
          icon: '/icons/icon-96x96.png'
        }
      ]
    };

    if (event.data) {
      try {
        const data = event.data.json();
        options.body = data.body || options.body;
        options.data = data;
      } catch (e) {
        console.log('Error parsing push data:', e);
      }
    }

    event.waitUntil(
      self.registration.showNotification('alugae', options).catch(err => {
        console.log('Error showing notification:', err);
      })
    );
  } catch (error) {
    console.log('Push event error:', error);
  }
});

// Handle notification clicks with error handling
self.addEventListener('notificationclick', (event) => {
  try {
    event.notification.close();

    if (event.action === 'explore') {
      // Open the app
      event.waitUntil(
        clients.openWindow('/').catch(err => {
          console.log('Error opening window:', err);
        })
      );
    }
  } catch (error) {
    console.log('Notification click error:', error);
  }
});

// Background sync for offline actions with error handling
self.addEventListener('sync', (event) => {
  try {
    if (event.tag === 'background-sync') {
      event.waitUntil(
        Promise.resolve().then(() => {
          console.log('Background sync triggered');
        }).catch(err => {
          console.log('Background sync error:', err);
        })
      );
    }
  } catch (error) {
    console.log('Sync event error:', error);
  }
});