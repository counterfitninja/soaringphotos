"use client";

import { useEffect } from "react";

/** Registers the service worker on every page (including /login) so the
 *  PWA install prompt is available from first open. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update())
      .catch(() => {});
  }, []);
  return null;
}
