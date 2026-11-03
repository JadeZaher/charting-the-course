// Native Web Push only; no application response caching.
function safeNotificationPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/updates';
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin || url.pathname.startsWith('//')) return '/updates';
    return url.pathname + url.search + url.hash;
  } catch { return '/updates'; }
}
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* Generic preview below. */ }
  const options = {
    body: 'There is a new update in your communities.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: safeNotificationPath(payload?.url) },
  };
  event.waitUntil(self.registration.showNotification('NEOS update', options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = new URL(safeNotificationPath(event.notification.data?.url), self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
        const navigated = await client.navigate(destination);
        if (navigated && 'focus' in navigated) return navigated.focus();
      }
    }
    return self.clients.openWindow(destination);
  }));
});
