import { getRuntimeConfig } from "../utils/runtimeConfig";

const TOKEN_STORAGE_KEY = "authToken";
export const BREAK_STATUS_UPDATED_EVENT = "break-status-updated";

function getAuthHeaders() {
  const authToken = localStorage.getItem(TOKEN_STORAGE_KEY) || "";

  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
      }
    : {};
}

function isSuccessfulPayload(payload) {
  return payload?.status === true || payload?.status === "true";
}

function normalizeBreakStatusValue(value) {
  return `${value ?? ""}`.trim() === "1";
}

export function normalizeBreakAction(actionType) {
  return String(actionType).trim().toLowerCase() === "out" ? "out" : "in";
}

export function getBreakActionLabel(actionType) {
  return normalizeBreakAction(actionType).toUpperCase();
}

export function notifyBreakStatusUpdated() {
  window.dispatchEvent(new Event(BREAK_STATUS_UPDATED_EVENT));
}

export async function getBreakStatus() {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return {
      success: false,
      isOnBreak: false,
      breakStatus: 0,
      message: "API base URL missing. Update public/config/app-config.json.",
    };
  }

  let response = null;
  let payload = null;

  try {
    response = await fetch(`${apiBaseUrl}?action=breakStatus`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: new FormData(),
    });

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } catch (error) {
    return {
      success: false,
      isOnBreak: false,
      breakStatus: 0,
      message:
        "Cannot reach break status API from browser (network/CORS). If running locally, restart dev server so proxy is active.",
      details: error?.message || "",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      isOnBreak: false,
      breakStatus: 0,
      message:
        payload?.message || `Break status failed to load (HTTP ${response.status})`,
      payload,
    };
  }

  const success = isSuccessfulPayload(payload);
  const breakStatus = Number.parseInt(`${payload?.break_status ?? 0}`, 10) === 1 ? 1 : 0;
  const isOnBreak = normalizeBreakStatusValue(payload?.break_status);

  return {
    success,
    isOnBreak: success ? isOnBreak : false,
    breakStatus,
    message: payload?.message || "",
    payload,
  };
}

export async function getNextBreakAction() {
  const result = await getBreakStatus();
  const actionType = normalizeBreakAction(result.isOnBreak ? "in" : "out");

  return {
    ...result,
    actionType,
    label: getBreakActionLabel(actionType),
  };
}
