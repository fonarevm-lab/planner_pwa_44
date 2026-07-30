// Service Worker для PWA — офлайн-режим.
// Cache-on-demand: кэшируем все запросы по мере поступления.
// Работает на любом base path (включая GitHub Pages подпапку).
const CACHE_NAME = 'planner-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Кэшируем только удачные ответы для статических ресурсов
        if (response.ok) {
          const dest = event.request.destination
          if (
            dest === 'document' ||
            dest === 'script' ||
            dest === 'style' ||
            dest === 'image' ||
            dest === 'font' ||
            dest === 'manifest'
          ) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
        }
        return response
      }).catch(() => {
        // Офлайн-фоллбек только для HTML-навигации
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html')
        }
      })
    })
  )
})
