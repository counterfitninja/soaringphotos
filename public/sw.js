self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function rememberPush(data) {
  const entry = {
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});

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
  if (event.data?.type !== "soaring-get-last-push") return;
  event.source?.postMessage({ type: "soaring-last-push", entry: self.__lastPushDebug ?? null });
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
