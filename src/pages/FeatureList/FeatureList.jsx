import { features } from "../../data/features";
import FeatureCard from "../../components/FeatureCard/FeatureCard";
import "./FeatureList.css";

export default function FeatureList() {
  return (
    <main className="container featureList-root">
      <header className="featureList-header">
        <h1>HR Portal</h1>
        <p>Employee self-service</p>
      </header>

      <section className="featureList-grid">
        {features.map((f) => (
          <FeatureCard key={f.id} feature={f} />
        ))}
      </section>
    </main>
  );
}
