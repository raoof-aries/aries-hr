import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { getDataUrl } from "../../utils/dataUrl";
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
    title: "Salary",
    route: "/salary-slip",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
        <path d="M7 14h.01"></path>
        <path d="M7 18h.01"></path>
        <path d="M17 14h.01"></path>
        <path d="M17 18h.01"></path>
      </svg>
    ),
  },
  {
    id: "incentive",
    title: "Incentive",
    route: "/incentive-slip",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
      </svg>
    ),
  },
  {
    id: "allowance",
    title: "Allowance",
    route: "/allowance",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-4V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"></path>
        <path d="M9 7V4h6v3"></path>
        <path d="M12 12v6"></path>
        <path d="M9 15h6"></path>
      </svg>
    ),
  },
  {
    id: "health",
    title: "Health",
    route: "/health",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>
      </svg>
    ),
  },
  {
    id: "leave",
    title: "Leave",
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
    id: "calendar",
    title: "Calendar",
    route: "/calendar",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="M8 14h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 18h.01"></path>
        <path d="M12 18h.01"></path>
        <path d="M16 18h.01"></path>
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
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userName, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, groupedNotifications, formatTimeAgo } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userProfile, setUserProfile] = useState(null);
  const notificationRef = useRef(null);
  const isHomeScreen = location.pathname === "/";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(getDataUrl("data/userProfile.json"));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const { today, older } = groupedNotifications();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profileData = user || userProfile;
  const displayName = (user && user.name) || userName || profileData?.name || "User";

  // Extract first name from user display name
  const getFirstName = () => {
    if (!displayName) return "User";
    const nameParts = displayName.trim().split(/\s+/);
    return nameParts[0];
  };
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const firstName = getFirstName();
  const profileImageUrl = "https://i.pravatar.cc/300?img=12";

  // Get page title based on current route
  const getPageTitle = () => {
    const routeMap = {
      "/": "HRMS",
      "/salary-slip": "Salary",
      "/incentive-slip": "Incentive",
      "/allowance": "Allowance",
      "/health": "Health",
      "/leave": "Leave",
      "/calendar": "Calendar",
      "/notifications": "Notifications",
      "/profile": "Profile",
    };
    // Handle exact pathname match
    const currentPath = location.pathname;
    return routeMap[currentPath] || "HRMS";
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`layout-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="layout-sidebar-header">
          <div className="layout-logo">
            <div className="layout-logo-icon">
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="layout-logo-profile-image"
              />
            </div>
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
      <div className={`layout-main ${isHomeScreen ? "layout-main-home" : "layout-main-page"}`}>
        {/* Top Bar */}
        <header className={`layout-header ${isHomeScreen ? "layout-header-home" : "layout-header-page"}`}>
          {isHomeScreen ? (
            <div className="home-hero-card">
              <div className="home-hero-top">
                <div className="home-hero-greeting">
                  <span className="home-hero-hello">
                    Hello, {profileData?.name || firstName}
                  </span>
                  <span className="home-hero-date">{formattedDate}</span>
                </div>
                <div className="layout-notifications" ref={notificationRef}>
                  <button
                    className="layout-notification-button layout-notification-button--light"
                    onClick={() => {
                      if (isMobile) {
                        navigate("/notifications");
                      } else {
                        setNotificationOpen(!notificationOpen);
                      }
                    }}
                    aria-label="Notifications"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {unreadCount > 0 && (
                      <span className="layout-notification-badge" aria-label={`${unreadCount} unread notifications`}></span>
                    )}
                  </button>
                  {!isMobile && notificationOpen && (
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
                          <>
                            {today.length > 0 && (
                              <>
                                <div className="layout-notification-group-header">Today</div>
                                {today.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className={`layout-notification-item ${notif.read ? "read" : ""}`}
                                    onClick={() => markAsRead(notif.id)}
                                  >
                                    <div className="layout-notification-icon">
                                      {notif.icon}
                                    </div>
                                    <div className="layout-notification-content">
                                      <p className="layout-notification-title">{notif.title}</p>
                                      <p className="layout-notification-message">{notif.message}</p>
                                      <span className="layout-notification-time">{formatTimeAgo(notif.timestamp)}</span>
                                    </div>
                                    {!notif.read && <div className="layout-notification-unread-dot"></div>}
                                  </div>
                                ))}
                              </>
                            )}
                            {older.length > 0 && (
                              <>
                                <div className="layout-notification-group-header">Older</div>
                                {older.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className={`layout-notification-item ${notif.read ? "read" : ""}`}
                                    onClick={() => markAsRead(notif.id)}
                                  >
                                    <div className="layout-notification-icon">
                                      {notif.icon}
                                    </div>
                                    <div className="layout-notification-content">
                                      <p className="layout-notification-title">{notif.title}</p>
                                      <p className="layout-notification-message">{notif.message}</p>
                                      <span className="layout-notification-time">{formatTimeAgo(notif.timestamp)}</span>
                                    </div>
                                    {!notif.read && <div className="layout-notification-unread-dot"></div>}
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        ) : (
                          <div className="layout-notification-empty">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Link to="/profile" className="home-hero-profile">
                <div className="home-hero-avatar">
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="layout-header-profile-image"
                  />
                </div>
                <div className="home-hero-details">
                  <h2 className="home-hero-name">{profileData?.name}</h2>
                  <p className="home-hero-role">{profileData?.designation}</p>
                  <div className="home-hero-meta">
                    <span className="home-hero-pill">{profileData?.employeeCode}</span>
                    <span className="home-hero-pill">{profileData?.yearsInAries} yrs</span>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            // Other Pages Header: Back icon on left, page title in center, notification on right
            <>
              <button
                className="layout-header-back"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h1 className="layout-header-title">{getPageTitle()}</h1>
              <div className="layout-header-right">
                <div className="layout-notifications" ref={notificationRef}>
                  <button
                    className="layout-notification-button layout-notification-button--light"
                    onClick={() => {
                      if (isMobile) {
                        navigate("/notifications");
                      } else {
                        setNotificationOpen(!notificationOpen);
                      }
                    }}
                    aria-label="Notifications"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {unreadCount > 0 && (
                      <span className="layout-notification-badge" aria-label={`${unreadCount} unread notifications`}></span>
                    )}
                  </button>
                  {!isMobile && notificationOpen && (
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
                          <>
                            {today.length > 0 && (
                              <>
                                <div className="layout-notification-group-header">Today</div>
                                {today.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className={`layout-notification-item ${notif.read ? "read" : ""}`}
                                    onClick={() => markAsRead(notif.id)}
                                  >
                                    <div className="layout-notification-icon">
                                      {notif.icon}
                                    </div>
                                    <div className="layout-notification-content">
                                      <p className="layout-notification-title">{notif.title}</p>
                                      <p className="layout-notification-message">{notif.message}</p>
                                      <span className="layout-notification-time">{formatTimeAgo(notif.timestamp)}</span>
                                    </div>
                                    {!notif.read && <div className="layout-notification-unread-dot"></div>}
                                  </div>
                                ))}
                              </>
                            )}
                            {older.length > 0 && (
                              <>
                                <div className="layout-notification-group-header">Older</div>
                                {older.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className={`layout-notification-item ${notif.read ? "read" : ""}`}
                                    onClick={() => markAsRead(notif.id)}
                                  >
                                    <div className="layout-notification-icon">
                                      {notif.icon}
                                    </div>
                                    <div className="layout-notification-content">
                                      <p className="layout-notification-title">{notif.title}</p>
                                      <p className="layout-notification-message">{notif.message}</p>
                                      <span className="layout-notification-time">{formatTimeAgo(notif.timestamp)}</span>
                                    </div>
                                    {!notif.read && <div className="layout-notification-unread-dot"></div>}
                                  </div>
                                ))}
                              </>
                            )}
                          </>
                        ) : (
                          <div className="layout-notification-empty">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Page Content */}
        <main className={`layout-content ${isHomeScreen ? "home-content" : "page-content"}`}>
          {isHomeScreen ? (
            <div className="home-shell">
              <div className="home-accent"></div>
              <div className="home-body">
                <div className="home-body-inner">{children}</div>
              </div>
            </div>
          ) : (
            <div className="page-shell">
              <div className="page-accent"></div>
              <div className="page-body">
                <div className="page-body-inner">{children}</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="layout-mobile-nav">
        <Link
          to="/"
          className={`layout-mobile-nav-item ${location.pathname === "/" ? "active" : ""}`}
          aria-label="Dashboard"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </Link>
        <Link
          to="/salary-slip"
          className={`layout-mobile-nav-item ${location.pathname === "/salary-slip" ? "active" : ""}`}
          aria-label="Salary"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
            <path d="M7 14h.01"></path>
            <path d="M7 18h.01"></path>
            <path d="M17 14h.01"></path>
            <path d="M17 18h.01"></path>
          </svg>
        </Link>
        <Link
          to="/incentive-slip"
          className={`layout-mobile-nav-item ${location.pathname === "/incentive-slip" ? "active" : ""}`}
          aria-label="Incentive"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </Link>
        <button
          className="layout-mobile-nav-item layout-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="More"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
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

