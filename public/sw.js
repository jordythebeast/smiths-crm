self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || "Smith's Motorcycles", {
      body: data.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/' },
      requireInteraction: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(event.notification.data?.url || '/')
          return client.focus()
        }
      }
      return clients.openWindow(event.notification.data?.url || '/')
    })
  )
})
