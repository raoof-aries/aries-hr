import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import BreakTimeLog from "./pages/BreakTimeLog/BreakTimeLog";
import SalarySlip from "./pages/SalarySlip/SalarySlip";
import IncentiveSlip from "./pages/IncentiveSlip/IncentiveSlip";
import CPE from "./pages/CPE/CPE";
import EffismLite from "./pages/EffismLite/EffismLite";
import FeatureUnderDevelopment from "./pages/FeatureUnderDevelopment/FeatureUnderDevelopment";
import EffismLocking from "./pages/EffismLocking/EffismLocking";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import MobileOnlyWrapper from "./components/MobileOnlyWrapper/MobileOnlyWrapper";
import AuthGateLoader from "./components/AuthGateLoader/AuthGateLoader";
import { getIsRegularUser } from "./utils/userMode";
import TimeTracker from "./pages/TimeTracker/TimeTracker";
import Notifications from "./pages/Notifications/Notifications";
import PushNotificationModal from "./components/PushNotificationModal/PushNotificationModal";
import PurchaseApproval from "./pages/PurchaseApproval/PurchaseApproval";
import PurchaseApprovalPending from "./pages/PurchaseApproval/PurchaseApprovalPending";
import PurchaseApprovalAction from "./pages/PurchaseApproval/PurchaseApprovalAction";
import PurchaseApprovalApproved from "./pages/PurchaseApproval/PurchaseApprovalApproved";
import PurchaseApprovalSubdivisions from "./pages/PurchaseApproval/PurchaseApprovalSubdivisions";
import ApprovalAccessDenied from "./pages/PurchaseApproval/components/ApprovalAccessDenied";
import Grievance from "./pages/Grievance/Grievance";

function EffismLiteGuard({ children }) {
  const { user } = useAuth();

  if (user?.usertype !== 1 && user?.usertype !== 2) {
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

function ApprovalGuard({ children }) {
  const { user } = useAuth();
  const type = user?.usertype ?? user?.userType ?? user?.user_type;

  if (Number(type) !== 4) {
    return (
      <ApprovalAccessDenied message="You do not have permission to access the Purchase Approval module." />
    );
  }

  return children;
}

function TimeTrackerGuard({ children }) {
  const { user } = useAuth();

  if (user?.usertype !== 3) {
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

function HomeRoute() {
  const { user } = useAuth();
  if (user?.usertype === 3) {
    return <Navigate to="/time-tracker" replace />;
  }
  return <Home />;
}

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthGateLoader />;
  }

  if (isAuthenticated) {
    let from = "/";
    if (typeof location.state?.from === "string") {
      from = location.state.from;
    } else if (location.state?.from?.pathname) {
      from = `${location.state.from.pathname}${location.state.from.search || ""}${location.state.from.hash || ""}`;
    }
    if (!from || from === "/login") from = "/";
    return <Navigate to={from} replace />;
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
            <HomeRoute />
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
            <IncentiveSlip />
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/cpe"
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
            <Notifications />
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
            <EffismLocking />
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
      <Route
        path="/purchase-approval"
        element={
          <ProtectedAppRoute>
            <ApprovalGuard>
              <PurchaseApproval />
            </ApprovalGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/purchase-approval/pending"
        element={
          <ProtectedAppRoute>
            <ApprovalGuard>
              <PurchaseApprovalPending />
            </ApprovalGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/purchase-approval/action"
        element={
          <ProtectedAppRoute>
            <ApprovalGuard>
              <PurchaseApprovalAction />
            </ApprovalGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/purchase-approval/approved"
        element={
          <ProtectedAppRoute>
            <ApprovalGuard>
              <PurchaseApprovalApproved />
            </ApprovalGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/purchase-approval/subdivisions"
        element={
          <ProtectedAppRoute>
            <ApprovalGuard>
              <PurchaseApprovalSubdivisions />
            </ApprovalGuard>
          </ProtectedAppRoute>
        }
      />
      <Route
        path="/grievance"
        element={
          <ProtectedAppRoute>
            <Grievance />
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
          {/* Push notification popup hidden for testing before production */}
          {/* <PushNotificationModal /> */}
        </NotificationProvider>
      </AuthProvider>
    </MobileOnlyWrapper>
  );
}
