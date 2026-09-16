self.__WB_DISABLE_DEV_LOGS = true;

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

// Clean up old caches and precache build assets injected by Vite
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Route all API requests directly through the network
registerRoute(
  ({ url }) =>
    url.pathname.startsWith("/arieshrms-api") ||
    url.hostname === "www.efftime.com" ||
    url.pathname.includes("/webservices/"),
  new NetworkOnly()
);

// Activate new service worker immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Handle incoming push events from the server
self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "Aries HRMS", message: event.data.text() };
    }
  }

  const title = payload.title || "Aries HRMS Notification";
  const bodyText = payload.message || payload.body || "";
  const iconType =
    payload.icon_type || payload.iconType || payload.data?.iconType || "salary";
  const targetUrl = payload.url || payload.data?.url || "/salary-slip";
  const notificationId =
    payload.notification_id || payload.data?.notificationId || Date.now();

  const options = {
    body: bodyText,
    icon: payload.icon || "/hrms2/icons/icon-192.png",
    badge: payload.badge || "/hrms2/icons/icon-192.png",
    data: {
      url: targetUrl,
      iconType,
      notificationId,
      ...(payload.data || {}),
    },
    vibrate: [100, 50, 100],
    tag: payload.tag || `aries-push-${notificationId}`,
    renotify: true,
  };

  // Broadcast to open clients so foreground app can update badge / notification lists
  const broadcastPromise = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((windowClients) => {
      windowClients.forEach((client) => {
        client.postMessage({
          type: "PUSH_RECEIVED",
          payload: {
            id: notificationId,
            title,
            message: bodyText,
            body: bodyText,
            iconType,
            url: targetUrl,
            data: options.data,
            timestamp: new Date().toISOString(),
          },
        });
      });
    });

  const showNotificationPromise = self.registration
    .showNotification(title, options)
    .catch((err) => {
      console.warn("Failed to display notification banner:", err);
    });

  event.waitUntil(Promise.all([broadcastPromise, showNotificationPromise]));
});

// 2. Handle user clicking on the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let rawTarget = event.notification.data?.url || "/salary-slip";
  let targetUrl = rawTarget;
  if (!rawTarget.startsWith("http")) {
    const cleanPath = rawTarget
      .replace(/^\/(hrms[0-9]*|hrms)/, "")
      .replace(/^\/?/, "/");
    targetUrl = `/hrms2${cleanPath}`;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If there's an existing app window open, focus it and notify navigation
        for (const client of windowClients) {
          if (
            client.url &&
            (client.url.includes("/hrms2") || client.url.includes("/hrms1") || client.url.includes("/hrms")) &&
            "focus" in client
          ) {
            client.postMessage({
              type: "NAVIGATE_TO",
              url: targetUrl,
            });
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
