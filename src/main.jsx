import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";
import { registerAppServiceWorker } from "./utils/pwa";

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  // Clone the response to read the body without consuming the original stream
  const clonedResponse = response.clone();
  clonedResponse
    .json()
    .then((payload) => {
      if (payload && payload.authStatus === false) {
        window.dispatchEvent(new Event("auth-failure"));
      }
    })
    .catch(() => {});

  return response;
};

registerAppServiceWorker();

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/hrms">
    <App />
  </BrowserRouter>,
);
