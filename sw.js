const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `growth-cream-${CACHE_VERSION}`;
const RUNTIME_CACHE = `growth-cream-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const APP_SHELL = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.webmanifest',
    '/css/variables.css',
    '/css/main.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/responsive.css',
    '/css/themes.css',
    '/js/app.js',
    '/js/router.js',
    '/js/db/database.js',
    '/js/db/habits-db.js',
    '/js/db/projects-db.js',
    '/js/db/goals-db.js',
    '/js/db/images-db.js',
    '/js/db/storage-db.js',
    '/js/services/streak-calculator.js',
    '/js/services/growth-calculator.js',
    '/js/services/storage-calculator.js',
    '/js/services/image-resizer.js',
    '/js/services/image-compressor.js',
    '/js/services/image-converter.js',
    '/js/services/image-cropper.js',
    '/js/services/image-metadata.js',
    '/js/features/dashboard.js',
    '/js/features/habits.js',
    '/js/features/projects.js',
    '/js/features/goals.js',
    '/js/features/image-studio.js',
    '/js/features/storage-tracker.js',
    '/js/components/navbar.js',
    '/js/components/modal.js',
    '/js/components/toast.js',
    '/js/components/progress-bar.js',
    '/js/components/chart.js',
    '/js/components/image-dropzone.js',
    '/js/utils/dates.js',
    '/js/utils/format.js',
    '/js/utils/validation.js',
    '/js/utils/files.js',
    '/js/utils/download.js',
    '/pages/dashboard.html',
    '/pages/habits.html',
    '/pages/projects.html',
    '/pages/goals.html',
    '/pages/image-studio.html',
    '/pages/storage.html',
    '/pages/settings.html',
    '/assets/icons/icon-72.png',
    '/assets/icons/icon-96.png',
    '/assets/icons/icon-128.png',
    '/assets/icons/icon-144.png',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-384.png',
    '/assets/icons/icon-512.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }

    // For navigation requests, try network first, fall back to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the latest version of the page
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Try cache first
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Fall back to offline page
                            return caches.match('/offline.html');
                        });
                })
        );
        return;
    }

    // For other requests, try cache first, fall back to network
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
            })
    );
});

// Handle messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHES') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Background sync for future use
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // This would sync data with a backend if one existed
    // For now, it's a placeholder for future functionality
    console.log('Background sync triggered');
}