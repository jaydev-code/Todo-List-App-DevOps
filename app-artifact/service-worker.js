// DevOps Dashboard PWA - Service Worker v3.0.0
const CACHE_NAME = 'devops-dashboard-cache-v3';
const APP_VERSION = '3.0.0';
const OFFLINE_URL = '/offline.html';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Third-party assets to cache
const EXTERNAL_ASSETS = [
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/'
];

// Development mode flag
const DEBUG_MODE = false;

// Install Event
self.addEventListener('install', event => {
  if (DEBUG_MODE) console.log('🔧 Service Worker: Installing v' + APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        if (DEBUG_MODE) console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        if (DEBUG_MODE) console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  if (DEBUG_MODE) console.log('🔄 Service Worker: Activating v' + APP_VERSION);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches that don't match current version
          if (cacheName !== CACHE_NAME && cacheName.startsWith('devops-dashboard-')) {
            if (DEBUG_MODE) console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      if (DEBUG_MODE) console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network with Cache Fallback strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external resources that don't need caching
  if (request.url.includes('chrome-extension')) return;
  
  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return cached response if found
        if (response) {
          if (DEBUG_MODE) console.log('📦 Cache hit:', request.url);
          return response;
        }
        
        // Fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Cache the response for future use
            if (isCacheable(request, networkResponse)) {
              cacheResponse(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            if (DEBUG_MODE) console.log('🌐 Network error, using cache:', error);
            
            // For CSS/JS, return a custom offline response
            if (request.url.includes('.css') || request.url.includes('.js')) {
              return new Response(
                `/* Offline - Unable to load ${request.url} */`,
                { 
                  status: 200,
                  headers: { 'Content-Type': 'text/css' }
                }
              );
            }
            
            return caches.match('/') || new Response('Offline', { status: 503 });
          });
      })
  );
});

// Handle API requests with offline support
function handleApiRequest(request) {
  return fetch(request)
    .then(response => {
      // Store API response in IndexedDB for offline access
      if (response.ok) {
        storeApiResponse(request.url, response.clone());
      }
      return response;
    })
    .catch(error => {
      // Return cached API response if available
      return getCachedApiResponse(request.url)
        .then(cachedResponse => {
          if (cachedResponse) {
            if (DEBUG_MODE) console.log('📦 Using cached API response for:', request.url);
            return new Response(JSON.stringify(cachedResponse), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // No cached data available
          return new Response(
            JSON.stringify({ 
              error: 'Offline mode', 
              message: 'Network unavailable and no cached data',
              timestamp: new Date().toISOString()
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
    });
}

// Handle navigation requests
function handleNavigationRequest(request) {
  return fetch(request)
    .then(response => {
      // Cache the HTML page
      cacheResponse(request, response.clone());
      return response;
    })
    .catch(error => {
      // Return cached page or offline page
      return caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // Return offline page for navigation requests
          return caches.match('/')
            .then(homePage => homePage || new Response(
              '<html><body><h1>You are offline</h1></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            ));
        });
    });
}

// Cache response for future use
function cacheResponse(request, response) {
  if (!isCacheable(request, response)) return;
  
  caches.open(CACHE_NAME)
    .then(cache => {
      cache.put(request, response);
      if (DEBUG_MODE) console.log('💾 Cached:', request.url);
    })
    .catch(error => {
      console.error('Error caching response:', error);
    });
}

// Check if response is cacheable
function isCacheable(request, response) {
  // Don't cache non-successful responses
  if (!response || !response.ok) return false;
  
  // Don't cache API responses (handled separately)
  if (request.url.includes('/api/')) return false;
  
  // Don't cache large files
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) return false; // 10MB limit
  
  // Cache based on content type
  const contentType = response.headers.get('content-type');
  const cacheableTypes = [
    'text/html',
    'text/css',
    'application/javascript',
    'image/',
    'font/',
    'application/json'
  ];
  
  return cacheableTypes.some(type => contentType && contentType.includes(type));
}

// Store API response in IndexedDB
function storeApiResponse(url, response) {
  // Implementation for IndexedDB storage
  // This would store API responses for offline access
}

// Get cached API response from IndexedDB
function getCachedApiResponse(url) {
  // Implementation for retrieving cached API responses
  return Promise.resolve(null);
}

// Push Notification Support
self.addEventListener('push', event => {
  if (DEBUG_MODE) console.log('🔔 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'DevOps Dashboard Notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'devops-notification'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DevOps Dashboard', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  if (DEBUG_MODE) console.log('🔔 Notification clicked');
  
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if dashboard is already open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if dashboard not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Sync Event for Background Sync
self.addEventListener('sync', event => {
  if (DEBUG_MODE) console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks());
  }
});

// Sync pending tasks with server
function syncPendingTasks() {
  // Implementation for syncing pending tasks
  return Promise.resolve();
}

// Periodic Sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-stats') {
      event.waitUntil(updateDashboardStats());
    }
  });
}

// Update dashboard stats in background
function updateDashboardStats() {
  if (DEBUG_MODE) console.log('📊 Updating dashboard stats in background');
  // Implementation for background stats update
  return Promise.resolve();
}

// Handle offline analytics
function logOfflineEvent(eventType, data) {
  const event = {
    type: eventType,
    data: data,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // Store offline events for later sync
  // Implementation would store in IndexedDB
}

// Message handler for communication with main thread
self.addEventListener('message', event => {
  if (DEBUG_MODE) console.log('📨 Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME);
      break;
      
    case 'GET_CACHE_SIZE':
      caches.open(CACHE_NAME)
        .then(cache => cache.keys())
        .then(keys => {
          event.ports[0].postMessage({ size: keys.length });
        });
      break;
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker Error:', event.error);
  
  // Log error to analytics
  logOfflineEvent('service_worker_error', {
    error: event.error?.toString(),
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker Unhandled Rejection:', event.reason);
  
  logOfflineEvent('service_worker_unhandled_rejection', {
    reason: event.reason?.toString()
  });
});