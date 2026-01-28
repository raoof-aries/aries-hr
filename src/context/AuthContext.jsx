import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Load userProfile from public folder
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/data/userProfile.json");
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (!userProfile) return;
    
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUserName = localStorage.getItem("userName");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
      setUser(userProfile);
      setUserName(storedUserName || userProfile.name);
    }
    setIsLoading(false);
  }, [userProfile]);

  const login = (username, password) => {
    // Dummy credentials for now
    // TODO: Replace with actual API call to PHP backend
    if (!userProfile) {
      return { success: false, error: "User profile not loaded" };
    }
    if (username === "admin" && password === "password") {
      setIsAuthenticated(true);
      setUser(userProfile);
      setUserName(userProfile.name);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userName", userProfile.name);
      return { success: true };
    }
    return { success: false, error: "Invalid username or password" };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserName("");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userName");
  };

  const value = {
    isAuthenticated,
    isLoading,
    userName,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
