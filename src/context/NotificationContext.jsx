import React, { createContext, useContext, useState, useEffect } from "react";

const NotificationContext = createContext(null);

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

// Helper function to check if date is today
const isToday = (date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Icon components
const getIcon = (type) => {
  const iconProps = {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (type) {
    case "salary":
      return (
        <svg {...iconProps}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      );
    case "incentive":
      return (
        <svg {...iconProps}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      );
    case "leave":
      return (
        <svg {...iconProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      );
    default:
      return null;
  }
};

export function NotificationProvider({ children }) {
  // Initialize with dummy notifications
  const initialNotifications = [
    {
      id: 1,
      title: "New Salary Slip Available",
      message: "Your salary slip for December 2024 is now available",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      iconType: "salary",
    },
    {
      id: 2,
      title: "Incentive Payment Processed",
      message: "Your incentive for Q4 2024 has been processed",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
      iconType: "incentive",
    },
    {
      id: 3,
      title: "Leave Request Approved",
      message: "Your leave request for Jan 15-20 has been approved",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: false,
      iconType: "leave",
    },
  ];

  // Load notifications from localStorage or use initial
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if this is old format (has icon JSX) - if so, clear and use initial
        if (parsed.length > 0 && parsed[0].icon && typeof parsed[0].icon === 'object') {
          localStorage.removeItem("notifications");
          return initialNotifications;
        }
        // Convert timestamp strings back to Date objects and ensure iconType exists
        return parsed.map((notif) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
          iconType: notif.iconType || "salary", // fallback for old data
        }));
      } catch (e) {
        console.error("Error loading notifications from localStorage:", e);
        localStorage.removeItem("notifications");
        return initialNotifications;
      }
    }
    return initialNotifications;
  });

  // Save to localStorage whenever notifications change (without icon JSX)
  useEffect(() => {
    try {
      const notificationsToSave = notifications.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        timestamp: notif.timestamp.toISOString(),
        read: notif.read,
        iconType: notif.iconType,
      }));
      localStorage.setItem("notifications", JSON.stringify(notificationsToSave));
    } catch (e) {
      console.error("Error saving notifications to localStorage:", e);
    }
  }, [notifications]);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  // Get unread count
  const unreadCount = notifications.filter((notif) => !notif.read).length;

  // Add icon to each notification
  const notificationsWithIcons = notifications.map(notif => ({
    ...notif,
    icon: getIcon(notif.iconType),
  }));

  const value = {
    notifications: notificationsWithIcons,
    unreadCount,
    markAsRead,
    markAllAsRead,
    groupedNotifications: () => {
      const today = [];
      const older = [];

      notificationsWithIcons.forEach((notif) => {
        if (isToday(notif.timestamp)) {
          today.push(notif);
        } else {
          older.push(notif);
        }
      });

      return { today, older };
    },
    formatTimeAgo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
