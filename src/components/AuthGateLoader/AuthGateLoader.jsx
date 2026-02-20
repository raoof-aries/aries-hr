import React from "react";
import "./AuthGateLoader.css";

export default function AuthGateLoader() {
  return (
    <div className="auth-gate-loader" role="status" aria-live="polite" aria-label="Loading">
      <div className="auth-gate-loader__spinner" />
    </div>
  );
}
