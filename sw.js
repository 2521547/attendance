const CACHE_NAME = 'attendance-v1';
const ASSETS = [
  './',
  './index.html'
];

// 安装：缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求策略：网络优先，失败用缓存
self.addEventListener('fetch', (event) => {
  // Supabase API请求不走缓存
  if (event.request.url.includes('supabase.co')) return;
  // CDN请求走缓存优先
  if (event.request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }
  // 本地资源：网络优先
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
