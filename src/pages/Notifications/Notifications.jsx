import React from "react";
import "./Notifications.css";

export default function Notifications() {
  // Dummy notifications - same as in Layout
  const notifications = [
    {
      title: "New Salary Slip Available",
      message: "Your salary slip for December 2024 is now available",
      time: "2 hours ago",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      title: "Incentive Payment Processed",
      message: "Your incentive for Q4 2024 has been processed",
      time: "1 day ago",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      ),
    },
    {
      title: "Leave Request Approved",
      message: "Your leave request for Jan 15-20 has been approved",
      time: "3 days ago",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
  ];

  return (
    <div className="notifications-container">
      <div className="notifications-content">
        {notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notif, index) => (
              <div key={index} className="notification-item">
                <div className="notification-icon">
                  {notif.icon}
                </div>
                <div className="notification-content">
                  <p className="notification-title">{notif.title}</p>
                  <p className="notification-message">{notif.message}</p>
                  <span className="notification-time">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
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

