import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/Login/Login";
import FeatureList from "./pages/FeatureList/FeatureList";
import SalarySlip from "./pages/SalarySlip/SalarySlip";
import IncentiveSlip from "./pages/IncentiveSlip/IncentiveSlip";
import Allowance from "./pages/Allowance/Allowance";
import Health from "./pages/Health/Health";
import Leave from "./pages/Leave/Leave";
import Calendar from "./pages/Calendar/Calendar";
import Notifications from "./pages/Notifications/Notifications";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Layout from "./components/Layout/Layout";

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
            <Layout>
              <FeatureList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/salary-slip"
        element={
          <ProtectedRoute>
            <Layout>
              <SalarySlip />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incentive-slip"
        element={
          <ProtectedRoute>
            <Layout>
              <IncentiveSlip />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/allowance"
        element={
          <ProtectedRoute>
            <Layout>
              <Allowance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/health"
        element={
          <ProtectedRoute>
            <Layout>
              <Health />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <Layout>
              <Leave />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <Calendar />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}
