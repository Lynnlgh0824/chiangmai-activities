// Service Worker for Chiengmai Activities Platform
// 提供离线支持和PWA功能

const CACHE_NAME = 'chiengmai-activities-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/public/index.html'
];

// 安装Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: 缓存已打开');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('❌ Service Worker: 缓存失败', error);
            })
    );
    self.skipWaiting(); // 立即激活新的Service Worker
});

// 激活Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️  Service Worker: 删除旧缓存', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // 立即控制所有客户端
});

// 拦截网络请求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 缓存命中，返回缓存资源
                if (response) {
                    console.log('✅ Service Worker: 缓存命中', event.request.url);
                    return response;
                }

                // 缓存未命中，发起网络请求
                return fetch(event.request)
                    .then(response => {
                        // 检查是否是有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 克隆响应
                        const responseToCache = response.clone();

                        // 添加到缓存
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('❌ Service Worker: 网络请求失败', error);
                        // 可以返回离线页面
                        // return caches.match('/offline.html');
                    });
            })
    );
});

// 消息处理
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 后台同步
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // 同步数据的逻辑
            fetch('/api/sync')
                .then(response => {
                    console.log('✅ Service Worker: 后台同步完成');
                    return response;
                })
                .catch(error => {
                    console.error('❌ Service Worker: 后台同步失败', error);
                })
        );
    }
});

// 推送通知
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : '您有新的更新',
        icon: '/icon.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('清迈活动平台', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
