import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./FeatureList.css";

export default function FeatureList() {
  const { userName } = useAuth();
  const displayName = userName || "User";

  const quickAccessItems = [
    {
      id: "salary",
      title: "Salary Slip",
      description: "View and download your salary slips",
      route: "/salary-slip",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      color: "#3b82f6",
    },
    {
      id: "incentive",
      title: "Incentive Slip",
      description: "View and download your incentive slips",
      route: "/incentive-slip",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      ),
      color: "#8b5cf6",
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Track your attendance records",
      route: "/attendance",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      color: "#10b981",
    },
    {
      id: "leave",
      title: "Leave Management",
      description: "Request and manage your leaves",
      route: "/leave",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      color: "#f59e0b",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-quick-access">
        <h3 className="dashboard-section-title">Quick Access</h3>
        <div className="dashboard-grid">
          {quickAccessItems.map((item) => (
            <Link key={item.id} to={item.route} className="dashboard-card">
              <div className="dashboard-card-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="dashboard-card-content">
                <h4 className="dashboard-card-title">{item.title}</h4>
                <p className="dashboard-card-description">{item.description}</p>
              </div>
              <div className="dashboard-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
