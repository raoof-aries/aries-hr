// Purchase & Management Approval Service
// Live connection to https://purchaseapproval.markndget.com/api/pwa-approval

export const API_BASE =
  import.meta.env.VITE_PURCHASE_API_BASE ||
  "https://purchaseapproval.markndget.com/api/pwa-approval";

const TOKEN_KEY = "mgmt_approval_token";
const NAME_KEY = "mgmt_approval_name";

export const HMAC_SECRET =
  "bfdbe25d7921ec86a07bdf5f5b1c7c0f4678d47b4341702395e70b54069076e2";

export const DEFAULT_EMPLOYEE_ID = 107;

/**
 * Computes HMAC-SHA256 hex string matching PHP:
 * hash_hmac('sha256', $employeeId . '|' . $ts, $secret)
 */
export async function computeHmacSha256(keyStr, messageStr) {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(messageStr)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates the dynamic SSO parameters and complete URL:
 * https://purchaseapproval.markndget.com/pwa-approval/?employee_id=...&ts=...&sig=...
 */
export async function createSsoPayload(employeeId = DEFAULT_EMPLOYEE_ID) {
  const ts = Math.floor(Date.now() / 1000);
  const message = `${employeeId}|${ts}`;
  const sig = await computeHmacSha256(HMAC_SECRET, message);
  const url = `https://purchaseapproval.markndget.com/pwa-approval/?employee_id=${employeeId}&ts=${ts}&sig=${sig}`;
  return {
    employee_id: String(employeeId),
    ts: String(ts),
    sig,
    url,
  };
}

/**
 * Returns the dynamic URL:
 * https://purchaseapproval.markndget.com/pwa-approval/?employee_id=...&ts=...&sig=...
 */
export async function generateApprovalUrl(employeeId = DEFAULT_EMPLOYEE_ID) {
  const payload = await createSsoPayload(employeeId);
  return payload.url;
}

/**
 * Creates fresh SSO credentials and sends to /sso-login
 */
export async function authenticateWithSso(employeeId = DEFAULT_EMPLOYEE_ID) {
  const payload = await createSsoPayload(employeeId);
  const res = await fetch(`${API_BASE}/sso-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      employee_id: payload.employee_id,
      ts: payload.ts,
      sig: payload.sig,
    }),
  });

  const data = await res.json().catch(() => null);
  if (res.ok && data?.data?.token) {
    setStoredSession(data.data.token, data.data.full_name);
    return {
      success: true,
      token: data.data.token,
      fullName: data.data.full_name,
      url: payload.url,
    };
  }

  throw new Error(data?.message || "Could not authenticate via SSO link.");
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredFullName() {
  return localStorage.getItem(NAME_KEY) || "Approver";
}

export function setStoredSession(token, fullName) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (fullName !== undefined) {
    localStorage.setItem(NAME_KEY, fullName || "");
  }
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
}

export async function ensureSession(employeeId = DEFAULT_EMPLOYEE_ID) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  try {
    const sso = await authenticateWithSso(employeeId);
    return sso.token;
  } catch (e) {
    console.error("SSO auto-login failed:", e);
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  let token = getToken();
  if (!token) {
    token = await ensureSession();
  }

  const headers = {
    Accept: "application/json",
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    Authorization: "Bearer " + (token || ""),
    ...(options.headers || {}),
  };

  let res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no body
  }

  // If token expired (401), automatically regenerate fresh HMAC SSO credentials and retry once
  if (res.status === 401) {
    try {
      clearStoredSession();
      const sso = await authenticateWithSso(DEFAULT_EMPLOYEE_ID);
      const newToken = sso?.token;
      if (newToken) {
        headers.Authorization = "Bearer " + newToken;
        res = await fetch(API_BASE + path, {
          ...options,
          headers,
        });
        try {
          data = await res.json();
        } catch (e) {
          // no body
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (!res.ok) {
    const err = new Error(
      (data && data.message) || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function ssoLogin(employeeId, ts, sig) {
  const res = await fetch(`${API_BASE}/sso-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ employee_id: employeeId, ts, sig }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no body
  }

  if (res.ok && data?.data?.token) {
    setStoredSession(data.data.token, data.data.full_name);
    return {
      success: true,
      token: data.data.token,
      fullName: data.data.full_name,
    };
  }

  throw new Error(data?.message || "Could not sign in with SSO link.");
}

export async function getApprovalStats(from, to) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await apiFetch("/stats?" + params.toString());
  return res.data;
}

export async function getPendingApprovals() {
  const res = await apiFetch("/pending");
  return res.data || [];
}

export async function getApprovedDetails(from, to, subdivisionId) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (
    subdivisionId !== null &&
    typeof subdivisionId !== "undefined" &&
    subdivisionId !== "unassigned"
  ) {
    params.set("subdivision_id", subdivisionId);
  }

  const res = await apiFetch("/approved-details?" + params.toString());
  return res.data || [];
}

export async function getActionContext(requestId, nextActionCode = "MANAGEMENT_APPROVAL") {
  const res = await apiFetch(
    `/action-context?id=${encodeURIComponent(requestId)}&next_action_code=${encodeURIComponent(nextActionCode)}`
  );
  return res.data;
}

export async function submitDecision({
  requesting_id,
  decision,
  remarks,
  forward_to,
  clarify_to,
}) {
  const body = {
    requesting_id: Number(requesting_id),
    decision,
    remarks: (remarks || "").trim(),
  };

  if (decision === "FW" || decision === "AC") {
    body.forward_to = Number(forward_to);
  }
  if (decision === "NC") {
    body.clarify_to = Number(clarify_to);
  }

  const res = await apiFetch("/decide", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return res;
}
