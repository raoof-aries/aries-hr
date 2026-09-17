import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import "./PushNotificationModal.css";

export default function PushNotificationModal() {
  const { isAuthenticated } = useAuth();
  const {
    isPushSupported,
    pushPermission,
    isPushSubscribed,
    subscribePush,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Only show if user is logged in, push is supported, user is not subscribed,
  // and browser permission is not yet granted or denied.
  const shouldShow =
    isAuthenticated &&
    isPushSupported &&
    !isPushSubscribed &&
    pushPermission === "default";

  if (!shouldShow) {
    return null;
  }

  const handleAllow = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await subscribePush();
      if (!result?.success && result?.error) {
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          setErrorMsg("Permission was blocked in browser settings.");
        } else {
          setErrorMsg(result.error);
        }
      }
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      setErrorMsg("Failed to enable notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="push-modal-overlay" role="dialog" aria-modal="true">
      <div className="push-modal-card">
        <div className="push-modal-icon-wrapper">
          <div className="push-modal-icon-pulse"></div>
          <div className="push-modal-icon-inner">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
        </div>

        <h3 className="push-modal-title">Enable Push Notifications</h3>
        
        <p className="push-modal-desc">
          Stay updated with real-time alerts for your salary slips, incentive releases,
          leave approvals, and important announcements.
        </p>

        {errorMsg && <div className="push-modal-error">{errorMsg}</div>}

        <div className="push-modal-actions">
          <button
            className="push-modal-btn-allow"
            onClick={handleAllow}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="push-modal-spinner-row">
                <span className="push-modal-spinner"></span>
                <span>Enabling...</span>
              </span>
            ) : (
              "Allow Notifications"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
