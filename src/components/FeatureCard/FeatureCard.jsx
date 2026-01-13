import { Link } from "react-router-dom";
import "./FeatureCard.css";

export default function FeatureCard({ feature }) {
  return (
    <Link to={feature.route} className="featureCard-root">
      <div className="featureCard-glow"></div>

      <div className="featureCard-icon">
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
          {feature.id === "salary" ? (
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          ) : (
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          )}
        </svg>
      </div>

      <div className="featureCard-content">
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>

      <div className="featureCard-arrow">
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
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
