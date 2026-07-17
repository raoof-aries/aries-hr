import { getRuntimeConfig } from "../utils/runtimeConfig";

const TOKEN_STORAGE_KEY = "authToken";

function getAuthHeaders() {
  const authToken = localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  return authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};
}

/**
 * Fetches fresh profile data for the currently authenticated user.
 * Returns the raw user data object on success, or null on any failure.
 * Never throws — safe to call without try/catch.
 */
export async function getProfile() {
  try {
    const { apiBaseUrl } = await getRuntimeConfig();
    if (!apiBaseUrl) return null;

    const response = await fetch(`${apiBaseUrl}?action=getProfile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    // 401 = token expired — signal auth failure so the app logs out cleanly
    if (response.status === 401) {
      window.dispatchEvent(new Event("auth-failure"));
      return null;
    }

    if (!response.ok) return null;

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      return null;
    }

    const isSuccess = payload?.status === true || payload?.status === "true";
    if (!isSuccess || !payload?.data) return null;

    return payload.data;
  } catch {
    // Network error, offline, etc. — silently do nothing
    return null;
  }
}
