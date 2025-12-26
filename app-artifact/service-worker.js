// DevOps Dashboard PWA Service Worker v3.0.0
const CACHE_NAME = 'devops-dashboard-v3';
const APP_VERSION = '3.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('📦 Service Worker: Installing v' + APP_VERSION);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📁 Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker: Activating v' + APP_VERSION);
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('devops-dashboard-')) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    // Skip analytics
    if (event.request.url.includes('analytics')) return;
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.status === 200 && event.request.url.startsWith('http')) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // For navigation requests, return cached index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        // Return a fallback for other requests
                        return new Response(
                            JSON.stringify({
                                error: 'Offline',
                                message: 'You are offline. Please check your connection.'
                            }), {
                                status: 503,
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Cache-Control': 'no-cache'
                                }
                            }
                        );
                    });
            })
    );
});

// Background sync for offline operations
self.addEventListener('sync', event => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'sync-tasks') {
        event.waitUntil(syncPendingTasks());
    } else if (event.tag === 'sync-activities') {
        event.waitUntil(syncActivities());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('📨 Push notification received');
    
    let data = {
        title: 'DevOps Dashboard',
        body: 'New notification',
        icon: './icons/icon-192x192.png',
        badge: './icons/badge-96x96.png',
        tag: 'devops-notification'
    };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: data.tag || 'devops-notification',
            url: data.url || './'
        },
        actions: [
            { action: 'open', title: 'Open Dashboard' },
            { action: 'close', title: 'Close' }
        ],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('👆 Notification clicked:', event.notification.tag);
    
    event.notification.close();

    const urlToOpen = event.notification.data?.url || './';

    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ 
                type: 'window',
                includeUncontrolled: true 
            })
            .then(clientList => {
                // Check if there's already a window/tab open with the target URL
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window/tab
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', event => {
        if (event.tag === 'update-data') {
            event.waitUntil(updateCachedData());
        }
    });
}

// Sync pending tasks (example implementation)
async function syncPendingTasks() {
    console.log('🔄 Syncing pending tasks in background...');
    
    // Get pending tasks from IndexedDB or localStorage
    const pendingTasks = await getPendingTasks();
    
    if (pendingTasks.length > 0) {
        // In a real app, you would send these to your backend API
        console.log(`📤 Syncing ${pendingTasks.length} pending tasks`);
        
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ Tasks synced successfully');
                clearPendingTasks();
                resolve();
            }, 2000);
        });
    }
    
    return Promise.resolve();
}

// Sync activities
async function syncActivities() {
    console.log('🔄 Syncing activities in background...');
    // Implementation for syncing activities
    return Promise.resolve();
}

// Update cached data periodically
async function updateCachedData() {
    console.log('🔄 Updating cached data periodically...');
    
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = STATIC_ASSETS.map(url => new Request(url));
        
        for (const request of requests) {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(request, response);
                }
            } catch (error) {
                console.log(`Failed to update: ${request.url}`, error);
            }
        }
        
        console.log('✅ Cached data updated');
    } catch (error) {
        console.error('❌ Failed to update cached data:', error);
    }
}

// Helper functions
async function getPendingTasks() {
    // In a real app, this would read from IndexedDB
    return JSON.parse(localStorage.getItem('pendingTasks') || '[]');
}

async function clearPendingTasks() {
    // In a real app, this would clear from IndexedDB
    localStorage.removeItem('pendingTasks');
}

// Handle messages from the main thread
self.addEventListener('message', event => {
    console.log('📨 Message from main thread:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_NEW_VERSION') {
        caches.open(CACHE_NAME).then(cache => {
            cache.addAll(STATIC_ASSETS);
        });
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        event.ports[0].postMessage({
            cacheName: CACHE_NAME,
            version: APP_VERSION
        });
    }
});

// Error handling
self.addEventListener('error', event => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Unhandled promise rejection:', event.reason);
});