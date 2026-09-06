"use client";

import { useEffect, useState } from "react";
import { deletePushSubscriptionAsAdmin, sendTestPushAsAdmin } from "@/app/actions/admin";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PushDebugEntry = {
  serviceWorkerVersion?: string;
  receivedAt: string;
  title: string;
  body: string;
  tag: string | null;
  url: string;
};

function decodeVapidKey(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

function encodeVapidKey(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function fingerprint(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export default function AdminPushPwaTools({
  isVapidConfigured,
  totalSubscriptions,
  subscriptions,
}: {
  isVapidConfigured: boolean;
  totalSubscriptions: number;
  subscriptions: {
    id: string;
    username: string;
    provider: string;
    endpointFingerprint: string;
    userAgent: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosBrowser, setIsIosBrowser] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [serverPublicKeyFingerprint, setServerPublicKeyFingerprint] = useState<string | null>(null);
  const [browserPublicKeyFingerprint, setBrowserPublicKeyFingerprint] = useState<string | null>(null);
  const [browserEndpointTail, setBrowserEndpointTail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [lastRemotePush, setLastRemotePush] = useState<PushDebugEntry | null>(null);
  const [serviceWorkerVersion, setServiceWorkerVersion] = useState<string | null>(null);
  const [swControlled, setSwControlled] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  useEffect(() => {
    setIsSecure(window.isSecureContext);
    const swSupport = "serviceWorker" in navigator;
    const pushSupport = swSupport && "PushManager" in window && "Notification" in window;
    setPushSupported(pushSupport);

    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    setIsStandalone(standalone);
    setIsIosBrowser(ios && !standalone);

    if (swSupport) {
      navigator.serviceWorker.ready
        .then(async (registration) => {
          setSwRegistered(true);
          const subscription = await registration.pushManager.getSubscription();
          setBrowserEndpointTail(subscription?.endpoint.slice(-18) ?? null);
          const applicationServerKey = subscription?.options.applicationServerKey;
          setBrowserPublicKeyFingerprint(
            applicationServerKey ? await fingerprint(encodeVapidKey(applicationServerKey)) : null,
          );
        })
        .catch(() => {});
    }

    void fetch("/api/push/subscription")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.publicKey) setPublicKey(data.publicKey);
        if (data?.publicKeyFingerprint) setServerPublicKeyFingerprint(data.publicKeyFingerprint);
        if (data?.subscribed) setIsSubscribed(true);
      })
      .catch(() => {});

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    function handleServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.type === "soaring-push-received" || event.data?.type === "soaring-last-push") {
        setLastRemotePush(event.data.entry ?? null);
      }
      if (event.data?.type === "soaring-sw-version") {
        setServiceWorkerVersion(event.data.version ?? null);
      }
    }

    function pingWorker() {
      const controller = navigator.serviceWorker?.controller;
      if (!controller) return;
      setSwControlled(true);
      controller.postMessage({ type: "soaring-get-last-push" });
      controller.postMessage({ type: "soaring-get-sw-version" });
    }

    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    // The worker may take control after this component mounts (fresh registration); ping again when that happens.
    navigator.serviceWorker?.addEventListener("controllerchange", pingWorker);
    pingWorker();
    navigator.serviceWorker?.ready.then(pingWorker).catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
      navigator.serviceWorker?.removeEventListener("controllerchange", pingWorker);
    };
  }, []);

  async function handleInstallPwa() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setTestResult("PWA installation accepted!");
      }
    } else if (isIosBrowser) {
      setShowIosGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  }

  async function handleEnablePush() {
    setLoading(true);
    setTestResult(null);
    try {
      if (!("Notification" in window)) {
        setTestResult("Notifications are not supported by this browser.");
        return;
      }

      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission !== "granted") {
        setTestResult("Notification permission was denied or closed.");
        return;
      }

      let keyToUse = publicKey;
      if (!keyToUse) {
        const res = await fetch("/api/push/subscription");
        const data = await res.json();
        if (!data.configured || !data.publicKey) {
          setTestResult("Push notifications are not configured on server (VAPID missing).");
          return;
        }
        keyToUse = data.publicKey as string;
        setPublicKey(keyToUse);
      }

      if (!keyToUse) {
        setTestResult("VAPID public key unavailable.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
        await subscription.unsubscribe();
        subscription = null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(keyToUse),
      });
      setBrowserEndpointTail(subscription.endpoint.slice(-18));
      const applicationServerKey = subscription.options.applicationServerKey;
      setBrowserPublicKeyFingerprint(
        applicationServerKey ? await fingerprint(encodeVapidKey(applicationServerKey)) : null,
      );

      const saveRes = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save push subscription to database.");
      }

      const verifyRes = await fetch("/api/push/subscription");
      const verifyData = verifyRes.ok ? await verifyRes.json() : null;
      if (!verifyData?.subscribed) {
        throw new Error("Server did not confirm the saved push subscription.");
      }

      setIsSubscribed(true);
      setTestResult("Push notifications successfully enabled for this device!");
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestLocalNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      setTestResult("Notification permission not granted. Enable notifications first.");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("🔔 Local Test Notification", {
        body: "If you see this, Service Worker notifications are working properly on this device!",
        icon: "/logo.jpeg",
        tag: `test-local-${Date.now()}`,
      });
      setTestResult("Local test notification sent to device!");
    } catch {
      new Notification("🔔 Local Test Notification", {
        body: "If you see this, browser notifications are working!",
        icon: "/logo.jpeg",
      });
      setTestResult("Fallback local notification triggered!");
    }
  }

  async function handleSendServerPushTest() {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await sendTestPushAsAdmin();
      setTestResult(res.message);
    } catch (err) {
      setTestResult(`Failed to trigger push: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePingPushReceipt() {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/push/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceWorkerVersion: serviceWorkerVersion ?? "page-ping",
          receivedAt: new Date().toISOString(),
          title: "Manual receipt ping",
          body: "Admin diagnostics verified the receipt endpoint.",
          tag: "manual-receipt-ping",
          url: "/admin",
        }),
      });
      if (!res.ok) throw new Error(`Receipt endpoint returned ${res.status}.`);
      setTestResult("Receipt endpoint ping logged on the server.");
    } catch (err) {
      setTestResult(`Receipt endpoint ping failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  function handleResetInstallBanner() {
    localStorage.removeItem("pwa_prompt_dismissed");
    window.dispatchEvent(new Event("reset-pwa-banner"));
    setTestResult("PWA install prompt banner reset. Refresh or visit app pages to view it.");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase text-neutral-400">Server VAPID</p>
          <p className="mt-1 text-sm font-semibold">
            {isVapidConfigured ? (
              <span className="text-emerald-600">✓ Configured</span>
            ) : (
              <span className="text-red-600">✗ Not Configured</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase text-neutral-400">DB Subscriptions</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{totalSubscriptions} active</p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase text-neutral-400">PWA Mode</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {isStandalone ? "📱 Standalone App" : "🌐 Web Browser"}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase text-neutral-400">Device Push</p>
          <p className="mt-1 text-sm font-semibold">
            {permission === "granted" && isSubscribed ? (
              <span className="text-emerald-600">✓ Subscribed</span>
            ) : permission === "granted" ? (
              <span className="text-amber-600">Granted (Unsubscribed)</span>
            ) : (
              <span className="text-neutral-500">Not Subscribed</span>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700">
        <p className="font-semibold text-neutral-900">VAPID key diagnostic</p>
        <dl className="mt-2 grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-400">Server public key</dt>
            <dd className="mt-1 font-mono">{serverPublicKeyFingerprint ?? "Unavailable"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-400">Browser subscription key</dt>
            <dd className="mt-1 font-mono">{browserPublicKeyFingerprint ?? "No local subscription"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase text-neutral-400">Browser endpoint</dt>
            <dd className="mt-1 font-mono">{browserEndpointTail ? `...${browserEndpointTail}` : "No local subscription"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-neutral-500">
          Matching fingerprints mean this browser subscription was created with the server's current VAPID public key.
        </p>
        <p className="mt-2 text-neutral-500">
          Active service worker:{" "}
          <span className="font-mono text-neutral-700">
            {serviceWorkerVersion ??
              (swControlled
                ? "Old worker without version reporting — unregister and reload"
                : "Not controlling this tab yet — reload once")}
          </span>
        </p>
        {!isSecure && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-800">
            ⚠️ This page is loaded over an insecure context (plain HTTP, non-localhost). Service workers and push
            notifications are disabled by the browser here. Use localhost or HTTPS.
          </p>
        )}
      </div>

      {!isVapidConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
          <p className="font-semibold">⚠️ Web Push VAPID keys are missing or invalid in server environment!</p>
          <p className="mt-1">
            Push notifications require valid <code>VAPID_PUBLIC_KEY</code> and <code>VAPID_PRIVATE_KEY</code> in your <code>.env</code> file.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleInstallPwa}
          className="rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
        >
          {isStandalone
            ? "✓ PWA Installed"
            : installPrompt
              ? "Install PWA App Now"
              : isIosBrowser
                ? "How to Install on iOS"
                : "Install PWA Instructions"}
        </button>

        <button
          type="button"
          onClick={handleEnablePush}
          disabled={loading || !isVapidConfigured}
          className="rounded-lg bg-sky-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-900 disabled:opacity-50"
        >
          {isSubscribed ? "Re-subscribe Push Notifications" : "Enable Push Notifications"}
        </button>

        <button
          type="button"
          onClick={handleTestLocalNotification}
          className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Test Local Device Notification
        </button>

        <button
          type="button"
          onClick={handleSendServerPushTest}
          disabled={loading || !isVapidConfigured}
          className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Send Server Push Test (All Subscribers)
        </button>

        <button
          type="button"
          onClick={handlePingPushReceipt}
          disabled={loading}
          className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Ping Push Receipt Log
        </button>

        <button
          type="button"
          onClick={handleResetInstallBanner}
          className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50"
        >
          Reset Banner State
        </button>
      </div>

      {testResult && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
          <p className="font-medium">{testResult}</p>
        </div>
      )}

      <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700">
        <p className="font-semibold text-neutral-900">Remote push event</p>
        {lastRemotePush ? (
          <dl className="mt-2 grid gap-2 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] font-medium uppercase text-neutral-400">Received</dt>
              <dd className="mt-1">{new Date(lastRemotePush.receivedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase text-neutral-400">Title</dt>
              <dd className="mt-1 truncate" title={lastRemotePush.title}>{lastRemotePush.title}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase text-neutral-400">Tag</dt>
              <dd className="mt-1 font-mono">{lastRemotePush.tag ?? "None"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase text-neutral-400">Target</dt>
              <dd className="mt-1 font-mono">{lastRemotePush.url}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase text-neutral-400">Worker</dt>
              <dd className="mt-1 font-mono">{lastRemotePush.serviceWorkerVersion ?? "Unknown"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-neutral-500">No remote push event observed by this open browser session yet.</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-neutral-50 uppercase text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">Account</th>
              <th className="px-3 py-2 font-medium">Push provider</th>
              <th className="px-3 py-2 font-medium">Browser / device</th>
              <th className="px-3 py-2 font-medium">Endpoint</th>
              <th className="px-3 py-2 font-medium">Last updated</th>
              <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-3 text-neutral-500">No active subscriptions.</td>
              </tr>
            ) : (
              subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-3 py-2 font-medium">@{subscription.username}</td>
                  <td className="px-3 py-2">{subscription.provider}</td>
                  <td className="max-w-72 truncate px-3 py-2" title={subscription.userAgent ?? undefined}>
                    {subscription.userAgent ?? "Recorded before device details"}
                  </td>
                  <td className="px-3 py-2 font-mono text-neutral-500">...{subscription.endpointFingerprint}</td>
                  <td className="px-3 py-2 text-neutral-500" title={`Created ${subscription.createdAt}`}>{subscription.updatedAt}</td>
                  <td className="px-3 py-2 text-right">
                    <form
                      action={deletePushSubscriptionAsAdmin.bind(null, subscription.id)}
                      onSubmit={(event) => {
                        if (!window.confirm(`Delete the push subscription for @${subscription.username}? The device will need to subscribe again.`)) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <button className="font-medium text-red-600 hover:text-red-800" title="Delete this push subscription">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* iOS Install Instructions Modal / Card */}
      {showIosGuide && (
        <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 text-xs text-sky-900">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">How to Install Soaring Photos on iPhone / iPad:</h3>
            <button onClick={() => setShowIosGuide(false)} className="text-neutral-500 hover:text-neutral-800">
              ✕
            </button>
          </div>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4">
            <li>Open this app in <strong>Safari</strong> on your iOS device.</li>
            <li>Tap the <strong>Share icon</strong> (box with arrow pointing up) in the Safari navigation bar.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> in the top-right corner.</li>
            <li>Launch Soaring Photos from your home screen to enable Push Notifications!</li>
          </ol>
        </div>
      )}

      {/* Desktop / Android Install Guide Modal / Card */}
      {showDesktopGuide && (
        <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Installing PWA on Chrome, Edge, or Android:</h3>
            <button onClick={() => setShowDesktopGuide(false)} className="text-neutral-500 hover:text-neutral-800">
              ✕
            </button>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Look for the <strong>Install app icon</strong> (monitor/arrow symbol) on the right side of your address bar.</li>
            <li>Or open the browser menu (⋮ or ⋯) and select <strong>Save and Share &gt; Install Soaring Photos</strong> or <strong>Install App</strong>.</li>
            <li>If you previously installed or dismissed it, click <em>Reset Banner State</em> above to trigger the installation banner again.</li>
          </ul>
        </div>
      )}
    </div>
  );
}