import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./App.css";

const PWA_UPDATE_INTERVAL_MS = 60 * 1000;

if (import.meta.env.PROD) {
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
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/salary">
    <App />
  </BrowserRouter>
);
