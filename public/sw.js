self.__soaringSwVersion = "2026-09-06-push-receipts-v3";

function broadcastToWindows(message) {
  return clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((windowClients) => {
      windowClients.forEach((client) => client.postMessage(message));
    });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function rememberPush(data) {
  const entry = {
    serviceWorkerVersion: self.__soaringSwVersion,
    receivedAt: new Date().toISOString(),
    title: data.title ?? "Soaring Photos",
    body: data.body ?? "You have a new notification.",
    tag: data.tag ?? null,
    url: data.url ?? "/notifications",
  };
  self.__lastPushDebug = entry;
  return Promise.allSettled([
    fetch("/api/push/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(entry),
    }),
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      windowClients.forEach((client) => client.postMessage({ type: "soaring-push-received", entry }));
    }),
  ]);
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  event.waitUntil(
    Promise.all([
      rememberPush(data),
      self.registration.showNotification(data.title ?? "Soaring Photos", {
        body: data.body ?? "You have a new notification.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data.tag,
        data: { url: data.url ?? "/notifications" },
      }),
    ]),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "soaring-get-last-push") {
    event.waitUntil(broadcastToWindows({ type: "soaring-last-push", entry: self.__lastPushDebug ?? null }));
  }
  if (event.data?.type === "soaring-get-sw-version") {
    event.waitUntil(broadcastToWindows({ type: "soaring-sw-version", version: self.__soaringSwVersion }));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const matchingClient = windowClients.find((client) => new URL(client.url).pathname === url);
      return matchingClient ? matchingClient.focus() : clients.openWindow(url);
    }),
  );
});
