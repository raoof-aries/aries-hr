import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const quickAccessItems = [
    {
      id: "salary",
      title: "Salary",
      description: "View your latest salary slip",
      route: "/salary-slip",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
          <path d="M7 14h.01"></path>
          <path d="M7 18h.01"></path>
          <path d="M17 14h.01"></path>
          <path d="M17 18h.01"></path>
        </svg>
      ),
      bgColor: "#FFF3DA",
      iconColor: "#FF9800",
    },
    {
      id: "incentive",
      title: "Incentive",
      description: "Check current incentive slip",
      route: "/incentive-slip",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      ),
      bgColor: "#E0F2FF",
      iconColor: "#2196F3",
    },
    {
      id: "allowance",
      title: "Allowance",
      description: "See your allowance details",
      route: "/allowance",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7h-4V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"></path>
          <path d="M9 7V4h6v3"></path>
          <path d="M12 12v6"></path>
          <path d="M9 15h6"></path>
        </svg>
      ),
      bgColor: "#E8F5E9",
      iconColor: "#4CAF50",
    },
    {
      id: "health",
      title: "Health",
      description: "Manage your health benefits",
      route: "/health",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>
        </svg>
      ),
      bgColor: "#FFEBEE",
      iconColor: "#F44336",
    },
    {
      id: "leave",
      title: "Leave",
      description: "Leaves, holidays and balance",
      route: "/leave",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      bgColor: "#FFF3E0",
      iconColor: "#FF9800",
    },
    {
      id: "calendar",
      title: "Calendar",
      description: "Upcoming events and dates",
      route: "/calendar",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      bgColor: "#E1F5FE",
      iconColor: "#00BCD4",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-quick-access">
        <div className="dashboard-grid">
          {quickAccessItems.map((item) => (
            <Link
              key={item.id}
              to={item.route}
              className={`dashboard-card ${
                item.id === "salary" || item.id === "incentive"
                  ? "dashboard-card--primary"
                  : ""
              }`}
            >
              <div 
                className="dashboard-card-icon" 
                style={{ backgroundColor: item.bgColor, color: item.iconColor }}
              >
                {item.icon}
              </div>
              <div className="dashboard-card-content">
                <h4 className="dashboard-card-title">{item.title}</h4>
                {item.description && (
                  <p className="dashboard-card-desc">{item.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
