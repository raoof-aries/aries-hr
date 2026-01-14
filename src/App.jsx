import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login/Login";
import FeatureList from "./pages/FeatureList/FeatureList";
import SalarySlip from "./pages/SalarySlip/SalarySlip";
import IncentiveSlip from "./pages/IncentiveSlip/IncentiveSlip";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        }}
      >
        <div
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FeatureList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/salary-slip"
        element={
          <ProtectedRoute>
            <SalarySlip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incentive-slip"
        element={
          <ProtectedRoute>
            <IncentiveSlip />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
