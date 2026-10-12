import React, { useEffect, useState } from "react";
import {
  pushSupported,
  getPushStatusForCurrentUser,
  subscribePush,
  unsubscribePush,
} from "../../../services/purchasePushService";

export default function NotifyToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!pushSupported()) return;
    setSupported(true);
    getPushStatusForCurrentUser().then((status) => {
      if (!cancelled) setSubscribed(status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!supported) return null;

  async function toggle() {
    setBusy(true);
    setToast("");
    try {
      if (subscribed) {
        await unsubscribePush();
        setSubscribed(false);
        setToast("Push notifications disabled.");
      } else {
        await subscribePush();
        setSubscribed(true);
        setToast("Push notifications enabled.");
      }
    } catch (err) {
      setToast(err.message || "Could not update notification settings.");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <>
      <div className="pa-limit-card">
        <div className="pa-limit-row">
          <span>Push notifications</span>
          <button
            type="button"
            className="pa-btn pa-btn-primary"
            style={{ width: "auto", minHeight: "36px", padding: "6px 16px", fontSize: "0.85rem" }}
            disabled={busy}
            onClick={toggle}
          >
            {subscribed ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
      {toast && <div className="pa-toast-box">{toast}</div>}
    </>
  );
}
