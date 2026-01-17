import React from "react";
import { useNotifications } from "../../context/NotificationContext";
import "./Notifications.css";

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, groupedNotifications, formatTimeAgo } = useNotifications();
  const { today, older } = groupedNotifications();

  return (
    <div className="notifications-container">
      <div className="notifications-content">
        {notifications.length > 0 ? (
          <>
            {notifications.filter((n) => !n.read).length > 0 && (
              <div className="notifications-header">
                <h2>Notifications</h2>
                <button
                  className="notifications-mark-all-read"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              </div>
            )}
            <div className="notifications-list">
              {today.length > 0 && (
                <>
                  <div className="notification-group-header">Today</div>
                  {today.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.read ? "read" : ""}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notification-icon">
                        {notif.icon}
                      </div>
                      <div className="notification-content">
                        <p className="notification-title">{notif.title}</p>
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-time">{formatTimeAgo(notif.timestamp)}</span>
                      </div>
                      {!notif.read && <div className="notification-unread-dot"></div>}
                    </div>
                  ))}
                </>
              )}
              {older.length > 0 && (
                <>
                  <div className="notification-group-header">Older</div>
                  {older.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${notif.read ? "read" : ""}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notification-icon">
                        {notif.icon}
                      </div>
                      <div className="notification-content">
                        <p className="notification-title">{notif.title}</p>
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-time">{formatTimeAgo(notif.timestamp)}</span>
                      </div>
                      {!notif.read && <div className="notification-unread-dot"></div>}
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="notifications-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}

