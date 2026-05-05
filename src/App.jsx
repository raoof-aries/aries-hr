import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import BreakTimeLog from "./pages/BreakTimeLog/BreakTimeLog";
import SalarySlip from "./pages/SalarySlip/SalarySlip";
import EffismLite from "./pages/EffismLite/EffismLite";
import FeatureUnderDevelopment from "./pages/FeatureUnderDevelopment/FeatureUnderDevelopment";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import MobileOnlyWrapper from "./components/MobileOnlyWrapper/MobileOnlyWrapper";
import AuthGateLoader from "./components/AuthGateLoader/AuthGateLoader";
import { getIsRegularUser } from "./utils/userMode";
import TimeTracker from "./pages/TimeTracker/TimeTracker";

function EffismLiteGuard({ children }) {
  const { user } = useAuth();

  if (user?.usertype !== 1) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FFF4F4", color: "#CF5B5B", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 style={{ marginBottom: "0.75rem", color: "#1E293B", fontSize: "1.5rem", fontWeight: "600" }}>Access Denied</h2>
        <p style={{ marginBottom: "2rem", color: "#64748B", maxWidth: "300px", lineHeight: "1.5" }}>You do not have permission to access the Effism Lite module.</p>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", backgroundColor: "#0F7A67", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "500", transition: "background-color 0.2s" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Return to Home
        </Link>
      </div>
    );
  }

  return children;
}

function TimeTrackerGuard({ children }) {
  const { user } = useAuth();

  if (user?.usertype !== 2) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FFF4F4", color: "#CF5B5B", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 style={{ marginBottom: "0.75rem", color: "#1E293B", fontSize: "1.5rem", fontWeight: "600" }}>Access Denied</h2>
        <p style={{ marginBottom: "2rem", color: "#64748B", maxWidth: "300px", lineHeight: "1.5" }}>You do not have permission to access the Time Tracker module.</p>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", backgroundColor: "#0F7A67", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "500", transition: "background-color 0.2s" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Return to Home
        </Link>
      </div>
    );
  }

  return children;
}

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

function ProtectedAppRoute({ children, allowNonRegular = false }) {
  const location = useLocation();
  const { user } = useAuth();
  const isRegularUser = getIsRegularUser(user);

  return (
    <ProtectedRoute>
      {!allowNonRegular && !isRegularUser ? (
        <Navigate to="/" replace state={{ from: location }} />
      ) : (
        <Layout>{children}</Layout>
      )}
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedAppRoute allowNonRegular>
            <Home />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/salary-slip"
        element={
          <ProtectedAppRoute>
            <SalarySlip />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/incentive-slip"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/allowance"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/allowance/upload"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/health"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedAppRoute>
            <Profile />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/effism-locking"
        element={
          <ProtectedAppRoute>
            <FeatureUnderDevelopment />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/effism-lite/*"
        element={
          <ProtectedAppRoute>
            <EffismLiteGuard>
              <EffismLite />
            </EffismLiteGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/time-tracker"
        element={
          <ProtectedAppRoute>
            <TimeTrackerGuard>
              <TimeTracker />
            </TimeTrackerGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/break-time-log"
        element={
          <ProtectedAppRoute>
            <BreakTimeLog />
          </ProtectedAppRoute>
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
