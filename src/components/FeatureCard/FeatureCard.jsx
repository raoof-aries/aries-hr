import { Link } from "react-router-dom";
import "./FeatureCard.css";

export default function FeatureCard({ feature }) {
  return (
    <Link to={feature.route} className="featureCard-root">
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </Link>
  );
}
