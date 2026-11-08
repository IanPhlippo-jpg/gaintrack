/* GainTrack: meldingen na de rusttijd (web push). Wordt in de service worker geladen via workbox.importScripts. */
self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.title || "GainTrack", {
      body: d.body || "",
      tag: "gt-rust",
      renotify: true,
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: { url: d.url || "./" },
    }),
  );
});

// Tik op de melding: de app openen (of naar voren halen) op het snel-invulscherm van de juiste set
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "./", self.registration.scope).href;
  event.waitUntil(
    (async () => {
      const vensters = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const v of vensters) {
        v.postMessage({ type: "gt-log", url });
        try {
          await v.focus();
          return;
        } catch {
          /* focus niet toegestaan: hieronder een nieuw venster */
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
