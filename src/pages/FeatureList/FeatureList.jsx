import { features } from "../../data/features";
import FeatureCard from "../../components/FeatureCard/FeatureCard";
import "./FeatureList.css";

export default function FeatureList() {
  return (
    <main className=" page-root featureList-root">
      <div className="page-background featureList-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header className="featureList-header">
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
