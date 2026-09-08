import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getRuntimeConfig } from "../utils/runtimeConfig";
import { getProfile } from "../services/profileService";

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = "authToken";
const USER_STORAGE_KEY = "authUser";
const USERNAME_STORAGE_KEY = "userName";

function parseJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isJwtExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function formatDateValue(value) {
  if (!value || value === "0000-00-00") return "-";
  return value;
}

function normalizeUser(apiUser = {}) {
  const name =
    apiUser.full_name || apiUser.display_name || apiUser.username || "User";

  return {
    ...apiUser,
    name,
    employeeCode: apiUser.employee_code || "-",
    designation: apiUser.designation || "-",
    reportingPerson: apiUser.reporting_person || apiUser.parent_name || "-",
    hourlyRate: apiUser.hourly_rate
      ? `${apiUser.hourly_rate} ${apiUser.currency || ""}`.trim()
      : "-",
    dateOfBirth: formatDateValue(apiUser.dob),
    company: apiUser.emp_company_name || "-",
    division: apiUser.emp_division_name || "-",
    subDivision: apiUser.emp_subdivision_name || "-",
    jobType: apiUser.emp_type_name || "-",
    jobCategory: apiUser.work_category_name || "-",
    reportingTime: apiUser.reporting_time || "-",
    dateOfJoining: formatDateValue(apiUser.doj),
    groupJoiningDate: formatDateValue(apiUser.gdoj),
    qualificationIndex: apiUser.qualificationIndex || "-",
    outsideExperience: apiUser.outsideExperience || {
      total: "-",
      relevant: "-",
    },
    profileImageUrl: apiUser.profile_img_url || "",
  };
}


function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USERNAME_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  // Tracks whether the user is authenticated inside event listeners
  const isAuthenticatedRef = useRef(false);
  // Timestamp of the last background refresh (for visibility cooldown)
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  /**
   * Silently fetches fresh user data from the API and updates state + localStorage.
   * Never throws. If the API fails (offline, server error), cached data is kept as-is.
   */
  const refreshUser = async () => {
    const freshData = await getProfile();
    if (!freshData) return;

    const normalizedUser = normalizeUser(freshData);
    setUser(normalizedUser);
    setUserName(normalizedUser?.name || "");
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
    lastRefreshRef.current = Date.now();
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken && storedUser && !isJwtExpired(storedToken)) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = normalizeUser(parsedUser);
        setIsAuthenticated(true);
        setToken(storedToken);
        setUser(normalizedUser);
        setUserName(normalizedUser?.name || "");
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
        // Fire a background refresh immediately after restoring cached session
        // so any changes made in CRM are picked up on every app open / reload
        void refreshUser();
      } catch (error) {
        console.error("Invalid stored user session:", error);
        clearStoredSession();
      }
    } else if (storedToken || storedUser) {
      clearStoredSession();
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthFailure = () => {
      setIsAuthenticated(false);
      setToken("");
      setUser(null);
      setUserName("");
      clearStoredSession();
    };

    window.addEventListener("auth-failure", handleAuthFailure);
    return () => window.removeEventListener("auth-failure", handleAuthFailure);
  }, []);

  // Refresh user data when the app comes back to the foreground.
  // 5-second cooldown prevents rapid back-and-forth switches from spamming the API.
  const VISIBILITY_COOLDOWN_MS = 5_000;
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isAuthenticatedRef.current &&
        Date.now() - lastRefreshRef.current > VISIBILITY_COOLDOWN_MS
      ) {
        void refreshUser();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 1. Periodically refresh user data (every 30 seconds) while authenticated & tab is visible
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshUser();
      }
    }, 30_000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // 2. Refresh user data on route changes if at least 15 seconds have passed since the last fetch
  const ROUTE_CHANGE_COOLDOWN_MS = 15_000;
  useEffect(() => {
    if (!isAuthenticated) return;

    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;
    if (timeSinceLastRefresh > ROUTE_CHANGE_COOLDOWN_MS) {
      void refreshUser();
    }
  }, [location.pathname, isAuthenticated]);

  // 3. Keep the authUser localStorage item in sync with the user React state
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      // Also update effismLockResponse_${userId} to keep backward compatibility with Lock Page
      const userId = user.user_id || user.userId || user.id || user.uid;
      if (userId !== undefined && userId !== null) {
        const isLockValue = user.is_lock !== undefined ? Number(user.is_lock) : (user.isLock !== undefined ? Number(user.isLock) : 0);
        localStorage.setItem(`effismLockResponse_${userId}`, String(isLockValue));
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // 4. Synchronize user details and token updates across multiple tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === USER_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsedUser = JSON.parse(e.newValue);
            setUser(parsedUser);
            setUserName(parsedUser.name || "");
          } catch (err) {
            console.error("Failed to parse user from storage event:", err);
          }
        } else {
          setUser(null);
          setUserName("");
        }
      } else if (e.key === TOKEN_STORAGE_KEY) {
        if (e.newValue) {
          setToken(e.newValue);
          setIsAuthenticated(true);
        } else {
          setToken("");
          setIsAuthenticated(false);
          setUser(null);
          setUserName("");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (username, password) => {
    try {
      const { apiBaseUrl } = await getRuntimeConfig();
      if (!apiBaseUrl) {
        return {
          success: false,
          error: "API base URL missing. Update public/config/app-config.json.",
        };
      }

      const loginUrls = [`${apiBaseUrl}?action=login`];
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isAbsoluteApi = /^https?:\/\//i.test(apiBaseUrl);

      if (isLocalhost && isAbsoluteApi) {
        loginUrls.push("/arieshrms-api?action=login");
      }

      const form = new URLSearchParams();
      form.set("username", username);
      form.set("password", password);

      let response = null;
      let payload = null;
      let networkError = null;

      for (const loginUrl of loginUrls) {
        try {
          response = await fetch(loginUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString(),
          });

          try {
            payload = await response.json();
          } catch {
            payload = null;
          }

          networkError = null;
          break;
        } catch (error) {
          networkError = error;
          response = null;
          payload = null;
        }
      }

      if (!response) {
        return {
          success: false,
          error:
            "Cannot reach login API from browser (network/CORS). If running locally, restart dev server so proxy is active.",
          details: networkError?.message || "",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: payload?.message || `Login failed (HTTP ${response.status})`,
        };
      }

      const isSuccess = payload?.status === true || payload?.status === "true";
      if (!isSuccess) {
        return {
          success: false,
          error: payload?.message || "Invalid username or password",
        };
      }

      if (!payload?.token || !payload?.data) {
        return {
          success: false,
          error: "Login response is missing token or user details",
        };
      }

      const normalizedUser = normalizeUser(payload.data);
      setIsAuthenticated(true);
      setToken(payload.token);
      setUser(normalizedUser);
      setUserName(normalizedUser.name);
      localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
      localStorage.setItem(USERNAME_STORAGE_KEY, normalizedUser.name);
      return { success: true };
    } catch (error) {
      console.error("Login API error:", error);
      return {
        success: false,
        error: "Unable to connect to server. Please try again.",
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken("");
    setUser(null);
    setUserName("");
    clearStoredSession();
  };

  const value = {
    isAuthenticated,
    isLoading,
    userName,
    user,
    token,
    login,
    logout,
    refreshUser,
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
