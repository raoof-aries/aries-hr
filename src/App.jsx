import { Routes, Route } from "react-router-dom";
import FeatureList from "./pages/FeatureList/FeatureList";
import SalarySlip from "./pages/SalarySlip/SalarySlip";
import IncentiveSlip from "./pages/IncentiveSlip/IncentiveSlip";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FeatureList />} />
      <Route path="/salary-slip" element={<SalarySlip />} />
      <Route path="/incentive-slip" element={<IncentiveSlip />} />
    </Routes>
  );
}
