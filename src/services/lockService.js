import { getRuntimeConfig } from "../utils/runtimeConfig";

const TOKEN_STORAGE_KEY = "authToken";

function getAuthHeaders() {
  const authToken = localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
      }
    : {};
}

export async function getUsers() {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    throw new Error("API base URL missing.");
  }

  const response = await fetch(`${apiBaseUrl}?action=getUsers`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.status === true || payload?.status === "true") {
    return payload.data || [];
  }
  throw new Error(payload?.message || "Failed to fetch users");
}

export async function getLeaveTypes() {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    throw new Error("API base URL missing.");
  }

  const response = await fetch(`${apiBaseUrl}?action=getLeaveTypes`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.status === true || payload?.status === "true") {
    return payload.data || [];
  }
  throw new Error(payload?.message || "Failed to fetch leave types");
}

export async function lockUser({ userId, type, fromDate, toDate, contactNumber, remarks }) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    throw new Error("API base URL missing.");
  }

  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("type", type);
  formData.append("from_date", fromDate);
  formData.append("to_date", toDate);
  formData.append("contact_number", contactNumber);
  formData.append("remarks", remarks);

  const response = await fetch(`${apiBaseUrl}?action=lockUser`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.status === true || payload?.status === "true") {
    return payload;
  }
  throw new Error(payload?.message || "Failed to submit user lock request.");
}

export async function unlockUser({ userId }) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    throw new Error("API base URL missing.");
  }

  const formData = new FormData();
  formData.append("user_id", userId);

  const response = await fetch(`${apiBaseUrl}?action=unLock`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.status === true || payload?.status === "true") {
    return payload;
  }
  throw new Error(payload?.message || "Failed to submit user unlock request.");
}
