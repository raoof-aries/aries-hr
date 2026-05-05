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

function isSuccessfulPayload(payload) {
  return payload?.status === true || payload?.status === "true";
}

function getActionName(actionType) {
  return actionType === "in" ? "breakIn" : "breakOut";
}

function getRecordedTimestamp(payload, actionType) {
  if (actionType === "in") {
    return payload?.break_in || payload?.in_time || "";
  }

  return payload?.break_out || payload?.out_time || "";
}

function buildBreakLogId(entry, index) {
  const parts = [
    entry?.date || "date",
    entry?.break_out || "break-out",
    entry?.break_in || "break-in",
    entry?.reason || "reason",
    index,
  ];

  return parts.join("--").replace(/\s+/g, "-").toLowerCase();
}

function normalizeBreakLogEntry(entry, index) {
  return {
    id: buildBreakLogId(entry, index),
    breakOut: `${entry?.break_out || ""}`.trim(),
    breakIn: `${entry?.break_in || ""}`.trim(),
    reason: `${entry?.reason || ""}`.trim(),
    status: `${entry?.status || ""}`.trim(),
    date: `${entry?.date || ""}`.trim(),
    breakTime: `${entry?.break_time || ""}`.trim(),
  };
}

export function formatBreakApiTime(timestamp) {
  const rawValue = `${timestamp || ""}`.trim();
  if (!rawValue) {
    return "";
  }

  const normalizedValue = rawValue.includes("T")
    ? rawValue
    : rawValue.replace(" ", "T");
  const parsedDate = new Date(normalizedValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsedDate);
  }

  const timePart = rawValue.split(" ").at(-1) || rawValue;
  const [hours = "0", minutes = "0"] = timePart.split(":");
  const fallbackDate = new Date();
  fallbackDate.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(fallbackDate);
}

export async function fetchBreakLogListing({ date }) {
  const normalizedDate = `${date || ""}`.trim();

  if (!normalizedDate) {
    return {
      success: false,
      logs: [],
      message: "Date is required to load break logs.",
    };
  }

  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return {
      success: false,
      logs: [],
      message: "API base URL missing. Update public/config/app-config.json.",
    };
  }

  const form = new FormData();
  form.set("date", normalizedDate);

  let response = null;
  let payload = null;

  try {
    response = await fetch(`${apiBaseUrl}?action=breakLogListing`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
    });

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } catch (error) {
    return {
      success: false,
      logs: [],
      message:
        "Cannot reach break log API from browser (network/CORS). If running locally, restart dev server so proxy is active.",
      details: error?.message || "",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      logs: [],
      message:
        payload?.message || `Break log listing failed (HTTP ${response.status})`,
      payload,
    };
  }

  const success = isSuccessfulPayload(payload);
  const logs = Array.isArray(payload?.data)
    ? payload.data.map((entry, index) => normalizeBreakLogEntry(entry, index))
    : [];

  return {
    success,
    logs: success ? logs : [],
    message: payload?.message || "",
    payload,
  };
}

export async function submitBreakTimeAction({
  actionType,
  qrValue,
  logId = null,
  reason = "",
}) {
  const normalizedAction = `${actionType || ""}`.trim().toLowerCase();
  const normalizedQrValue = `${qrValue || ""}`.trim();
  const normalizedReason = `${reason || ""}`.trim();

  if (normalizedAction !== "in" && normalizedAction !== "out") {
    return {
      success: false,
      message: "Unsupported break action.",
    };
  }

  if (!normalizedQrValue) {
    return {
      success: false,
      message: "Missing QR value for break submission.",
    };
  }

  if (normalizedAction === "out" && !normalizedReason) {
    return {
      success: false,
      message: "Reason is required for break out.",
    };
  }

  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return {
      success: false,
      message: "API base URL missing. Update public/config/app-config.json.",
    };
  }

  const submitUrl = `${apiBaseUrl}?action=${getActionName(normalizedAction)}`;
  const form = new FormData();
  form.set("qr_value", normalizedQrValue);

  if (logId !== null && logId !== undefined && `${logId}`.trim() !== "") {
    form.set("log_id", `${logId}`.trim());
  }

  if (normalizedAction === "out") {
    form.set("reason", normalizedReason);
  }

  let response = null;
  let payload = null;

  try {
    response = await fetch(submitUrl, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
    });

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } catch (error) {
    return {
      success: false,
      message:
        "Cannot reach the break-time API from browser (network/CORS). If running locally, restart dev server so proxy is active.",
      details: error?.message || "",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      message:
        payload?.message ||
        `Break ${normalizedAction === "in" ? "in" : "out"} failed (HTTP ${response.status})`,
      payload,
    };
  }

  const success = isSuccessfulPayload(payload);

  return {
    success,
    message:
      payload?.message ||
      `Break ${normalizedAction === "in" ? "IN" : "OUT"} recorded successfully.`,
    recordedAt: getRecordedTimestamp(payload, normalizedAction),
    logId: payload?.log_id ?? logId ?? null,
    payload,
  };
}
