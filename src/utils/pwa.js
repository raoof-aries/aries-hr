import { registerSW } from "virtual:pwa-register";

const PWA_UPDATE_INTERVAL_MS = 60 * 1000;

let applyServiceWorkerUpdate = null;

export function registerAppServiceWorker() {
  if (!import.meta.env.PROD) {
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
