import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { getIsRegularUser } from "./utils/userMode";
import Calendar from "./pages/Calendar/Calendar";

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
            <Calendar />
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
