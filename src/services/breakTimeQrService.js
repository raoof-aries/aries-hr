import { getRuntimeConfig } from "../utils/runtimeConfig";

const TOKEN_STORAGE_KEY = "authToken";

function normalizeActionType(buttonValue) {
  const normalizedValue = `${buttonValue || ""}`.trim().toLowerCase();
  return normalizedValue === "in" || normalizedValue === "out"
    ? normalizedValue
    : "";
}

export async function validateBreakTimeQrCodeWithApi(scannedValue) {
  const qrValue = `${scannedValue || ""}`.trim();

  if (!qrValue) {
    return {
      success: false,
      message: "Invalid QR Code",
    };
  }

  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return {
      success: false,
      message: "API base URL missing. Update public/config/app-config.json.",
    };
  }

  const validateUrls = [`${apiBaseUrl}?action=validateQR`];

  const form = new FormData();
  form.set("qr_value", qrValue);
  const authToken = localStorage.getItem(TOKEN_STORAGE_KEY) || "";

  let response = null;
  let payload = null;
  let networkError = null;

  for (const validateUrl of validateUrls) {
    try {
      response = await fetch(validateUrl, {
        method: "POST",
        headers: {
          ...(authToken
            ? {
                Authorization: `Bearer ${authToken}`,
              }
            : {}),
        },
        body: form,
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
      message:
        "Cannot reach QR validation API from browser (network/CORS). If running locally, restart dev server so proxy is active.",
      details: networkError?.message || "",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      message: payload?.message || `QR validation failed (HTTP ${response.status})`,
    };
  }

  const isSuccess = payload?.status === true || payload?.status === "true";
  const actionType = normalizeActionType(payload?.button);

  if (isSuccess && !actionType) {
    return {
      success: false,
      message: "QR validation succeeded, but no valid IN/OUT action was returned.",
      payload,
    };
  }

  return {
    success: isSuccess,
    message: payload?.message || (isSuccess ? "QR code is valid." : "Invalid QR Code"),
    actionType,
    logId: payload?.log_id ?? null,
    qrValue,
    payload,
  };
}
