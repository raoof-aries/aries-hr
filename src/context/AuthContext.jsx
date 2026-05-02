import React, { createContext, useContext, useEffect, useState } from "react";
import { getRuntimeConfig } from "../utils/runtimeConfig";

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
    reportingPerson:
      apiUser.reporting_person ||
      apiUser.reportingPerson ||
      (apiUser.parent_id ? `#${apiUser.parent_id}` : "-"),
    hourlyRate: apiUser.hourly_rate
      ? `${apiUser.hourly_rate} ${apiUser.currency || ""}`.trim()
      : "-",
    dateOfBirth: formatDateValue(apiUser.dob),
    company: apiUser.company || apiUser.emp_company_id || "-",
    division: apiUser.division || apiUser.emp_division_id || "-",
    subDivision: apiUser.subDivision || apiUser.emp_subdivision_id || "-",
    jobType: apiUser.jobType || apiUser.emp_type || "-",
    jobCategory: apiUser.work_category_name || "-",
    reportingTime: apiUser.reportingTime || apiUser.reporting_time || "-",
    dateOfJoining: formatDateValue(apiUser.doj),
    groupJoiningDate: formatDateValue(apiUser.gdoj),
    qualificationIndex: apiUser.qualificationIndex || "-",
    outsideExperience: apiUser.outsideExperience || {
      total: "-",
      relevant: "-",
    },
    profileImageUrl: apiUser.profile_img_url || apiUser.profileImageUrl || "",
  };
}

function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(USERNAME_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

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
        loginUrls.push("?action=login");
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
