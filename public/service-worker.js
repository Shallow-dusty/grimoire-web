/**
 * Service Worker - 血染钟楼魔典
 *
 * 功能：
 * 1. 离线缓存 - 缓存静态资源和关键页面
 * 2. 网络优先策略 - 优先使用网络，网络失败则使用缓存
 * 3. 后台同步 - 离线时的行动队列
 */

const STATIC_CACHE_NAME = 'grimoire-static-v2';
const DYNAMIC_CACHE_NAME = 'grimoire-dynamic-v2';
const DYNAMIC_CACHE_MAX_ENTRIES = 50;
const APP_SHELL_URL = '/index.html';
const DEFAULT_NOTIFICATION_URL = '/';

// 静态资源缓存列表
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/img/lobby-bg-v2.webp',
    '/img/grimoire-bg-v2.webp',
    '/img/icon-192.png',
    '/img/icon-512.png',
    '/img/icon-512-maskable.png',
    '/img/badge-72.png',
];

// 需要离线支持的 API 前缀
const API_PREFIXES = [
    '/api/',
];

// ============================================================
// Service Worker 安装
// ============================================================

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        try {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.addAll(STATIC_ASSETS);

            // 立即激活此 Service Worker
            await self.skipWaiting();
        } catch (error) {
            reportServiceWorkerError('Service Worker: 安装失败', error);
        }
    })());
});

// ============================================================
// Service Worker 激活
// ============================================================

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        try {
            const cacheNames = await caches.keys();

            // 删除旧的缓存
            const deletePromises = cacheNames
                .filter(name => name.startsWith('grimoire-') && name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
                .map(name => caches.delete(name));

            await Promise.all(deletePromises);

            // 立即获得所有控制权
            await self.clients.claim();
        } catch (error) {
            reportServiceWorkerError('Service Worker: 激活失败', error);
        }
    })());
});

// ============================================================
// Fetch 事件处理
// ============================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 忽略非 GET 请求
    if (request.method !== 'GET') {
        return;
    }

    // 忽略跨域请求（除了特定的 API）
    if (url.origin !== self.location.origin && !isApiEndpoint(url)) {
        return;
    }

    // 区分策略处理不同类型的请求
    if (isStaticAsset(url)) {
        // 静态资源：缓存优先
        event.respondWith(cacheFirst(request));
    } else if (isApiEndpoint(url)) {
        // API 请求：网络优先（带降级缓存）
        event.respondWith(networkFirst(request));
    } else {
        // HTML/动态内容：网络优先
        event.respondWith(networkFirst(request));
    }
});

// ============================================================
// 缓存策略
// ============================================================

/**
 * 缓存优先策略 - 优先使用缓存，缓存不存在才请求网络
 */
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('Service Worker: 缓存优先策略失败', error);
        // 返回离线页面
        return createOfflineResponse();
    }
}

/**
 * 网络优先策略 - 优先使用网络，网络失败才使用缓存
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);

        // Cache successful responses, but skip external API data (Supabase, etc.)
        // to avoid persisting sensitive game state in the cache.
        const requestUrl = new URL(request.url);
        const isExternalApi = requestUrl.origin !== self.location.origin;
        if (response.ok && !isExternalApi) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
            await trimCache(cache, DYNAMIC_CACHE_MAX_ENTRIES);
        }

        return response;
    } catch (error) {
        // 网络失败，先尝试动态/静态缓存，再为文档请求回退到 app shell。
        const cached = await matchAnyCache(request);

        if (cached) {
            return cached;
        }

        reportServiceWorkerError('Service Worker: 网络优先策略失败', error);

        if (request.destination === 'document') {
            const appShell = await getCachedAppShell();
            if (appShell) {
                return appShell;
            }
        }

        return new Response('Offline - No cached data', { status: 503 });
    }
}

// ============================================================
// 辅助函数
// ============================================================

function isStaticAsset(url) {
    return [
        '.js',
        '.css',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.webp',
        '.woff',
        '.woff2',
        '.ttf',
        '.otf',
        '.eot'
    ].some(ext => url.pathname.endsWith(ext));
}

function isApiEndpoint(url) {
    return API_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
}

async function matchAnyCache(request) {
    const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
    const dynamicMatch = await dynamicCache.match(request);
    if (dynamicMatch) {
        return dynamicMatch;
    }

    const staticCache = await caches.open(STATIC_CACHE_NAME);
    return staticCache.match(request);
}

async function getCachedAppShell() {
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    const staticShell = await staticCache.match(APP_SHELL_URL);
    if (staticShell) {
        return staticShell;
    }

    const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
    return dynamicCache.match(APP_SHELL_URL);
}

/**
 * Evict oldest entries when the cache exceeds maxEntries.
 */
async function trimCache(cache, maxEntries) {
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        await cache.delete(keys[0]);
        await trimCache(cache, maxEntries);
    }
}

function createOfflineResponse() {
    return new Response('Offline - No network connection', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/plain; charset=UTF-8'
        })
    });
}

function reportServiceWorkerError(message, error) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error(message, error);
    }
}

function asString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}

function parsePushPayload(event) {
    if (!event.data) {
        return {};
    }

    try {
        return asRecord(event.data.json());
    } catch {
        try {
            return { body: event.data.text() };
        } catch {
            return {};
        }
    }
}

function getNotificationTargetUrl(data) {
    const record = asRecord(data);
    const candidate = asString(record.url) ?? asString(record.roomUrl) ?? DEFAULT_NOTIFICATION_URL;
    const url = new URL(candidate, self.location.origin);
    return url.origin === self.location.origin ? url.href : new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).href;
}

async function focusOrOpenClient(targetUrl) {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) {
            continue;
        }

        if ('navigate' in client && clientUrl.href !== targetUrl) {
            await client.navigate(targetUrl);
        }

        if ('focus' in client) {
            return client.focus();
        }

        return client;
    }

    return self.clients.openWindow(targetUrl);
}

// ============================================================
// Push 通知
// ============================================================

self.addEventListener('push', (event) => {
    const payload = parsePushPayload(event);
    const data = asRecord(payload.data);
    const title = asString(payload.title) ?? 'Grimoire Web';
    const body = asString(payload.body) ?? 'A game update is available.';
    const tag = asString(payload.tag) ?? 'grimoire-update';
    const icon = asString(payload.icon) ?? '/img/icon-192.png';
    const badge = asString(payload.badge) ?? '/img/badge-72.png';

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            tag,
            icon,
            badge,
            data: {
                ...data,
                url: asString(data.url) ?? DEFAULT_NOTIFICATION_URL,
            },
            renotify: true,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = getNotificationTargetUrl(event.notification.data);
    event.waitUntil(focusOrOpenClient(targetUrl));
});

// ============================================================
// 消息处理（可选 - 用于客户端与 Service Worker 通信）
// ============================================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// 周期同步（PWA）
// ============================================================

self.addEventListener('periodicsync', (event) => {
    if (event.tag !== 'room-state-sync') {
        return;
    }

    event.waitUntil((async () => {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((client) => {
            client.postMessage({ type: 'PERIODIC_ROOM_SYNC' });
        });
    })());
});
