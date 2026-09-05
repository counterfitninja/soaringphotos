"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function decodeVapidKey(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

export default function PushNotifications() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosBrowser, setIsIosBrowser] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    void navigator.serviceWorker.register("/sw.js");
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setIsStandalone(standalone);
    setIsIosBrowser(ios && !standalone);

    void fetch("/api/push/subscription")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.configured || data.subscribed) return;
        setPublicKey(data.publicKey);
        if (ios || standalone) setShowPrompt(true);
      })
      .catch(() => setStatus("error"));

    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      if (standalone) return;
      setInstallPrompt(event as InstallPromptEvent);
      setShowPrompt(true);
    }

    function hideInstallPrompt() {
      setInstallPrompt(null);
      setShowPrompt(false);
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", hideInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", hideInstallPrompt);
    };
  }, []);

  async function subscribeToPush() {
    if (!publicKey) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey),
    });
    const response = await fetch("/api/push/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) throw new Error("Subscription could not be saved.");
  }

  async function installApp() {
    setStatus("saving");
    try {
      if (installPrompt) {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        setInstallPrompt(null);
        if (choice.outcome === "accepted") setShowPrompt(false);
      } else if (!isIosBrowser) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") await subscribeToPush();
        setShowPrompt(false);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (!showPrompt) return null;

  return (
    <aside className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-sm rounded-xl border border-sky-200 bg-white p-4 shadow-lg sm:bottom-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">
            {isStandalone ? "Enable notifications" : "Install Soaring Photos"}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            {isIosBrowser
              ? "Use Share, then Add to Home Screen."
              : isStandalone
                ? "Turn on notifications to receive new family post and tag alerts."
                : "Install once to receive new family post and tag alerts."}
          </p>
        </div>
        {!isIosBrowser && (
          <button
            type="button"
            onClick={installApp}
            disabled={status === "saving"}
            className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {isStandalone ? "Enable" : "Install app"}
          </button>
        )}
      </div>
      {status === "error" && <p className="mt-3 text-xs text-red-600">Installation could not be completed.</p>}
    </aside>
  );
}
