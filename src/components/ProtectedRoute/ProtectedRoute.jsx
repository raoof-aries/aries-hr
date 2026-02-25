import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthGateLoader from "../AuthGateLoader/AuthGateLoader";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthGateLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
