import { registerSW } from "virtual:pwa-register";
import { getRuntimeConfig } from "./runtimeConfig";

const PWA_UPDATE_INTERVAL_MS = 60 * 1000;

export const DEFAULT_VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BFQSNk4CEMHxHhiS3iY7yTCMZGetOvcDsQG8cmWBBseiiwvGIONRzrCXcUoDq1idP7gDLTlf0EosJXil4WgoXWo";

let applyServiceWorkerUpdate = null;
let activeRegistration = null;

export function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) {
        return;
      }
      activeRegistration = registration;

      const checkForUpdates = () => {
        if (navigator.onLine) {
          void registration.update();
        }
      };

      checkForUpdates();
      window.setInterval(checkForUpdates, PWA_UPDATE_INTERVAL_MS);
      window.addEventListener("focus", checkForUpdates);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          checkForUpdates();
        }
      });
    },
    onRegisterError(error) {
      console.error("PWA registration failed", error);
    },
  });

  applyServiceWorkerUpdate = async () => {
    let didControllerChange = false;
    const handleControllerChange = () => {
      didControllerChange = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    try {
      await updateSW(true);
    } catch (error) {
      console.error("PWA update failed", error);
    }

    window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );

      if (!didControllerChange) {
        window.location.reload();
      }
    }, 1000);
  };
}

export async function refreshApp() {
  if (!applyServiceWorkerUpdate) {
    window.location.reload();
    return;
  }

  await applyServiceWorkerUpdate();
}

/**
 * Checks if Service Worker, Push API, and Notification API are supported by this browser.
 */
export function isPushNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Gets the active ServiceWorkerRegistration instance.
 */
export async function getSWRegistration() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  if (activeRegistration) {
    return activeRegistration;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error("Failed to get active Service Worker registration:", error);
    return null;
  }
}

/**
 * Converts a Base64 URL-safe VAPID public key string into a Uint8Array for PushManager.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Retrieves the current push subscription if one exists.
 */
export async function getPushSubscription(registration = null) {
  try {
    const reg = registration || (await getSWRegistration());
    if (!reg || !reg.pushManager) {
      return null;
    }
    return await reg.pushManager.getSubscription();
  } catch (error) {
    console.warn("Unable to check push subscription:", error);
    return null;
  }
}

async function getSubscriptionEndpoint() {
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (isLocalhost) {
    return "/arieshrms-api/save-subscription.php";
  }

  try {
    const { apiBaseUrl } = await getRuntimeConfig();
    if (apiBaseUrl) {
      return `${apiBaseUrl.replace(/\/?$/, "/")}save-subscription.php`;
    }
  } catch {
    // Fallback to relative path
  }

  return "/arieshrms-api/save-subscription.php";
}

/**
 * Sends a push subscription object to the backend server.
 */
export async function sendSubscriptionToBackend(subscription, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const authToken = token || localStorage.getItem("authToken");
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const endpointUrl = await getSubscriptionEndpoint();
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        action: "save_push_subscription",
      }),
    });

    if (!response.ok) {
      console.warn(
        `Backend push subscription endpoint returned status ${response.status}. (Will be active once backend is deployed)`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      "Unable to send push subscription to backend (backend may not be deployed yet):",
      error.message
    );
    return false;
  }
}

/**
 * Deletes a push subscription from the backend server.
 */
export async function removeSubscriptionFromBackend(subscription, token = null) {
  try {
    if (!subscription?.endpoint) return false;

    const headers = {
      "Content-Type": "application/json",
    };

    const authToken = token || localStorage.getItem("authToken");
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const endpointUrl = await getSubscriptionEndpoint();
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        action: "delete_push_subscription",
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn("Unable to remove subscription from backend:", error.message);
    return false;
  }
}

/**
 * Requests Notification permission and subscribes the user to PushManager.
 */
export async function subscribeUserToPush(
  registration = null,
  publicVapidKey = DEFAULT_VAPID_PUBLIC_KEY,
  token = null
) {
  if (!isPushNotificationSupported()) {
    console.warn("Push notifications are not supported in this browser.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push notification permission was not granted:", permission);
      return null;
    }

    const reg = registration || (await getSWRegistration());
    if (!reg || !reg.pushManager) {
      console.warn("ServiceWorker registration or PushManager not available.");
      return null;
    }

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicVapidKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // Inform backend of the active subscription
    await sendSubscriptionToBackend(subscription, token);

    return subscription;
  } catch (error) {
    console.error("Error subscribing user to push notifications:", error);
    return null;
  }
}

/**
 * Unsubscribes the user from PushManager and removes it from backend.
 */
export async function unsubscribeUserFromPush(registration = null, token = null) {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const reg = registration || (await getSWRegistration());
    if (!reg || !reg.pushManager) {
      return false;
    }

    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await removeSubscriptionFromBackend(subscription, token);
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error("Error unsubscribing user from push notifications:", error);
    return false;
  }
}
