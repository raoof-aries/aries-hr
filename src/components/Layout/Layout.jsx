import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Layout.css";

const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
  },
  {
    id: "salary",
    title: "Salary Slip",
    route: "/salary-slip",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  },
  {
    id: "incentive",
    title: "Incentive Slip",
    route: "/incentive-slip",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    ),
  },
  {
    id: "attendance",
    title: "Attendance",
    route: "/attendance",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
  },
  {
    id: "leave",
    title: "Leave Management",
    route: "/leave",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
  },
  {
    id: "profile",
    title: "Profile",
    route: "/profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
  },
  {
    id: "documents",
    title: "Documents",
    route: "/documents",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  // Dummy notifications
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = userName || "User";

  // Get page title based on current route
  const getPageTitle = () => {
    const routeMap = {
      "/": "Dashboard",
      "/salary-slip": "Salary Slip",
      "/incentive-slip": "Incentive Slip",
      "/attendance": "Attendance",
      "/leave": "Leave Management",
      "/profile": "Profile",
      "/documents": "Documents",
    };
    return routeMap[location.pathname] || "Dashboard";
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`layout-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="layout-sidebar-header">
          <div className="layout-logo">
            <div className="layout-logo-icon">A</div>
            <span className="layout-logo-text">Aries HRMS</span>
          </div>
          <button
            className="layout-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

        <nav className="layout-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.route;
            return (
              <Link
                key={item.id}
                to={item.route}
                className={`layout-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="layout-nav-icon">{item.icon}</span>
                <span className="layout-nav-text">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="layout-sidebar-footer">
          <button className="layout-nav-item" onClick={handleLogout}>
            <span className="layout-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span className="layout-nav-text">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="layout-main">
        {/* Top Bar */}
        <header className="layout-header">
          <h1 className="layout-header-title">{getPageTitle()}</h1>
          <div className="layout-header-left">
            {/* Empty on desktop, greeting removed */}
          </div>
          <div className="layout-header-right">
            <div className="layout-notifications" ref={notificationRef}>
              <button
                className="layout-notification-button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications.length > 0 && (
                  <span className="layout-notification-badge">{notifications.length}</span>
                )}
              </button>
              {notificationOpen && (
                <div className="layout-notification-dropdown">
                  <div className="layout-notification-header">
                    <h3>Notifications</h3>
                    <button
                      className="layout-notification-close"
                      onClick={() => setNotificationOpen(false)}
                      aria-label="Close notifications"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="layout-notification-list">
                    {notifications.length > 0 ? (
                      notifications.map((notif, index) => (
                        <div key={index} className="layout-notification-item">
                          <div className="layout-notification-icon">
                            {notif.icon}
                          </div>
                          <div className="layout-notification-content">
                            <p className="layout-notification-title">{notif.title}</p>
                            <p className="layout-notification-message">{notif.message}</p>
                            <span className="layout-notification-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="layout-notification-empty">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="layout-user-info">
              <div className="layout-user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="layout-user-name">{displayName}</span>
            </div>
            <button
              className="layout-mobile-logout"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="layout-content">{children}</main>
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="layout-mobile-nav">
        <Link
          to="/"
          className={`layout-mobile-nav-item ${location.pathname === "/" ? "active" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/salary-slip"
          className={`layout-mobile-nav-item ${location.pathname === "/salary-slip" ? "active" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span>Salary</span>
        </Link>
        <Link
          to="/incentive-slip"
          className={`layout-mobile-nav-item ${location.pathname === "/incentive-slip" ? "active" : ""}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <span>Incentive</span>
        </Link>
        <button
          className="layout-mobile-nav-item layout-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Full Menu Modal */}
      {mobileMenuOpen && (
        <div className="layout-mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="layout-mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="layout-mobile-menu-header">
              <h3>Menu</h3>
              <button
                className="layout-mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="layout-mobile-menu-items">
              {menuItems
                .filter((item) => !["dashboard", "salary", "incentive"].includes(item.id))
                .map((item) => {
                  const isActive = location.pathname === item.route;
                  return (
                    <Link
                      key={item.id}
                      to={item.route}
                      className={`layout-mobile-menu-item ${isActive ? "active" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="layout-mobile-menu-icon">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              <button
                className="layout-mobile-menu-item layout-mobile-menu-logout"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <span className="layout-mobile-menu-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

