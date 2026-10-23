import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthGateLoader from "../AuthGateLoader/AuthGateLoader";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthGateLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
