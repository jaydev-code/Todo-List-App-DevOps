// Service Worker for DevOps Dashboard PWA
const CACHE_NAME = 'devops-dashboard-v2.0.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/manifest.json',
    '/assets/favicon.ico',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=devops'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Install completed');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event with stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip cross-origin requests
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin && !url.href.includes('dicebear')) {
        return;
    }
    
    // For HTML requests, network first
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the updated page
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    // If network fails, return cached version
                    return caches.match(event.request)
                        .then((cached) => cached || caches.match('/index.html'));
                })
        );
        return;
    }
    
    // For other assets, cache first with network update
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response immediately
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        // Update cache with fresh response
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, networkResponse.clone()));
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed, return cached if available
                        console.log('[Service Worker] Network failed, using cached version');
                    });
                
                return cachedResponse || fetchPromise;
            })
    );
});

// Background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-tasks') {
        console.log('[Service Worker] Background sync for tasks');
        event.waitUntil(syncTasks());
    }
});

async function syncTasks() {
    // Implementation for syncing tasks with backend
    console.log('[Service Worker] Syncing tasks in background');
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');
    
    const options = {
        body: event.data?.text() || 'New DevOps notification',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Open Dashboard',
                icon: '/assets/icon-192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('DevOps Dashboard', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received');
    
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Periodic sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'update-cache') {
            console.log('[Service Worker] Periodic sync triggered');
            event.waitUntil(updateCache());
        }
    });
}

async function updateCache() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await cache.put(request, response);
            }
        } catch (error) {
            console.log(`[Service Worker] Failed to update: ${request.url}`);
        }
    }
}