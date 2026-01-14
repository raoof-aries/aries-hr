import { features } from "../../data/features";
import FeatureCard from "../../components/FeatureCard/FeatureCard";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./FeatureList.css";

export default function FeatureList() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className=" page-root featureList-root">
      <div className="page-background featureList-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header className="featureList-header">
        <button
          className="featureList-logoutButton"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
        <div className="featureList-badge">Employee Portal</div>
        <h1>HR Portal</h1>
        <p>Employee self-service platform</p>
      </header>

      <section className="featureList-grid">
        {features.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </section>
    </main>
  );
}
