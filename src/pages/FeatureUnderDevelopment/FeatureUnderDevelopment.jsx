import { Link } from "react-router-dom";
import "./FeatureUnderDevelopment.css";

export default function FeatureUnderDevelopment() {
  return (
    <div className="feature-under-development">
      <section className="feature-under-development-card">
        <div className="feature-under-development-icon" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
          </svg>
        </div>
        <p className="feature-under-development-label">Coming Soon</p>
        <h2 className="feature-under-development-title">
          This feature is under development.
        </h2>
        <Link to="/" className="feature-under-development-link">
          Back to Home
        </Link>
      </section>
    </div>
  );
}
