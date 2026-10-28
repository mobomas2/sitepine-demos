/* Arella offline shell. All source assets are local; the reel is cached for saved visits too. */
'use strict';
const CACHE_NAME = 'arella-nail-v3';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './arella-mark.svg',
  './fonts/vazirmatn-arabic-wght.woff2',
  './img/hero.mp4',
  './img/poster.webp',
  './img/w1.webp',
  './img/w2.webp',
  './img/w3.webp',
  './img/w4.webp',
  './img/reel-detail-01.jpg',
  './img/reel-detail-02.jpg',
  './img/reel-detail-03.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('arella-nail-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cachedRangeResponse(request, cache) {
  const url = new URL(request.url);
  const cached = await cache.match(new Request(url.origin + url.pathname));
  if (!cached) return null;
  const range = request.headers.get('range');
  if (!range) return cached;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${(await cached.clone().arrayBuffer()).byteLength}` } });
  const buffer = await cached.arrayBuffer();
  const total = buffer.byteLength;
  let start = match[1] ? Number(match[1]) : Math.max(total - Number(match[2]), 0);
  let end = match[2] && match[1] ? Math.min(Number(match[2]), total - 1) : total - 1;
  if (start > end || start >= total) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  const headers = new Headers(cached.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(buffer.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', fresh.clone());
        }
        return fresh;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (url.pathname.endsWith('/img/hero.mp4')) {
      const rangeResponse = await cachedRangeResponse(request, cache);
      if (rangeResponse) return rangeResponse;
    }
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
