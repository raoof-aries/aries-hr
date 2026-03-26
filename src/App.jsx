import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import BreakTimeLog from "./pages/BreakTimeLog/BreakTimeLog";
import SalarySlip from "./pages/SalarySlip/SalarySlip";
import FeatureUnderDevelopment from "./pages/FeatureUnderDevelopment/FeatureUnderDevelopment";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import MobileOnlyWrapper from "./components/MobileOnlyWrapper/MobileOnlyWrapper";
import AuthGateLoader from "./components/AuthGateLoader/AuthGateLoader";

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthGateLoader />;
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
              <Home />
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
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/allowance"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/allowance/upload"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/health"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/effism-locking"
        element={
          <ProtectedRoute>
            <Layout>
              <FeatureUnderDevelopment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/break-time-log"
        element={
          <ProtectedRoute>
            <Layout>
              <BreakTimeLog />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <MobileOnlyWrapper>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </MobileOnlyWrapper>
  );
}
