import { apiFetch } from "./purchaseApprovalService";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function getPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function getPushStatusForCurrentUser() {
  const subscription = await getPushSubscription().catch(() => null);
  if (!subscription) return false;
  try {
    const status = await apiFetch(
      "/push/status?endpoint=" + encodeURIComponent(subscription.endpoint)
    );
    return !!status?.data?.subscribed;
  } catch {
    return false;
  }
}

export async function subscribePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }
  const keyRes = await apiFetch("/push/public-key");
  const publicKey = keyRes.data.public_key;
  const reg = await navigator.serviceWorker.ready;
  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = subscription.toJSON();
  await apiFetch("/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  return subscription;
}

export async function unsubscribePush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  try {
    await apiFetch("/push/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // subscription is already gone client-side; ignore server cleanup failures
  }
}
