// Purchase & Management Approval Service
// Live connection to https://purchaseapproval.markndget.com/api/pwa-approval

export const API_BASE =
  import.meta.env.VITE_PURCHASE_API_BASE ||
  "https://purchaseapproval.markndget.com/api/pwa-approval";

const TOKEN_KEY = "mgmt_approval_token";
const NAME_KEY = "mgmt_approval_name";
const EMP_KEY = "mgmt_approval_emp_id";

export const HMAC_SECRET =
  "bfdbe25d7921ec86a07bdf5f5b1c7c0f4678d47b4341702395e70b54069076e2";

/**
 * Retrieves the currently authenticated user's employee_id from stored profile session.
 * Returns null if not found (strictly no fallback to any hardcoded user).
 */
export function getCurrentEmployeeId() {
  try {
    const raw = localStorage.getItem("authUser");
    if (raw) {
      const user = JSON.parse(raw);
      const candidates = [
        user.employee_id,
        user.employeeId,
        user.emp_id,
        user.empId,
        user.id,
        user.user_id,
      ];
      const found = candidates.find(
        (v) => v !== undefined && v !== null && `${v}`.trim() !== ""
      );
      if (found) {
        return String(found).trim();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

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
export async function createSsoPayload(employeeId = getCurrentEmployeeId()) {
  const empId = employeeId ? String(employeeId).trim() : "";
  if (!empId) {
    const err = new Error("Cannot authenticate: Employee ID is missing from user profile.");
    err.status = 403;
    err.isSsoError = true;
    throw err;
  }
  const ts = Math.floor(Date.now() / 1000);
  const message = `${empId}|${ts}`;
  const sig = await computeHmacSha256(HMAC_SECRET, message);
  const url = `https://purchaseapproval.markndget.com/pwa-approval/?employee_id=${empId}&ts=${ts}&sig=${sig}`;
  return {
    employee_id: empId,
    ts: String(ts),
    sig,
    url,
  };
}

/**
 * Returns the dynamic URL:
 * https://purchaseapproval.markndget.com/pwa-approval/?employee_id=...&ts=...&sig=...
 */
export async function generateApprovalUrl(employeeId = getCurrentEmployeeId()) {
  const payload = await createSsoPayload(employeeId);
  return payload.url;
}

/**
 * Creates fresh SSO credentials and sends to /sso-login
 */
export async function authenticateWithSso(employeeId = getCurrentEmployeeId()) {
  let payload;
  try {
    payload = await createSsoPayload(employeeId);
  } catch (payloadErr) {
    payloadErr.isSsoError = true;
    throw payloadErr;
  }

  let res;
  let data = null;
  try {
    res = await fetch(`${API_BASE}/sso-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        employee_id: payload.employee_id,
        ts: payload.ts,
        sig: payload.sig,
      }),
    });
    data = await res.json().catch(() => null);
  } catch (fetchErr) {
    clearStoredSession();
    fetchErr.isSsoError = true;
    throw fetchErr;
  }

  if (res.ok && data?.data?.token) {
    setStoredSession(data.data.token, data.data.full_name, payload.employee_id);
    return {
      success: true,
      token: data.data.token,
      fullName: data.data.full_name,
      url: payload.url,
    };
  }

  clearStoredSession();
  const err = new Error(data?.message || "Could not authenticate via SSO link.");
  err.status = res.status;
  err.data = data;
  err.isSsoError = true;
  throw err;
}

export function getToken(employeeId = getCurrentEmployeeId()) {
  const currentEmpId = employeeId ? String(employeeId).trim() : "";
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const storedEmpId = localStorage.getItem(EMP_KEY) || "";
  if (currentEmpId && storedEmpId && storedEmpId !== currentEmpId) {
    return "";
  }
  return token;
}

export function getStoredFullName() {
  return localStorage.getItem(NAME_KEY) || "Approver";
}

export function setStoredSession(token, fullName, employeeId) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (fullName !== undefined) {
    localStorage.setItem(NAME_KEY, fullName || "");
  }
  if (employeeId !== undefined && employeeId !== null) {
    localStorage.setItem(EMP_KEY, String(employeeId));
  }
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(EMP_KEY);
}

export async function ensureSession(employeeId = getCurrentEmployeeId()) {
  const currentEmpId = employeeId ? String(employeeId).trim() : "";
  const token = localStorage.getItem(TOKEN_KEY);
  const storedEmpId = localStorage.getItem(EMP_KEY);

  // If a token is already cached AND matches this current employee, reuse it:
  if (token && storedEmpId && storedEmpId === currentEmpId) {
    return token;
  }

  // Token is either absent OR belonged to a DIFFERENT employee -> wipe it!
  clearStoredSession();

  if (!currentEmpId) {
    const err = new Error("No employee ID found in user profile.");
    err.status = 403;
    err.isSsoError = true;
    throw err;
  }

  try {
    const sso = await authenticateWithSso(currentEmpId);
    return sso.token;
  } catch (e) {
    console.error("SSO auto-login failed:", e);
    e.isSsoError = true;
    throw e;
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
  } catch {
    // no body
  }

  // If token expired (401), automatically regenerate fresh HMAC SSO credentials and retry once
  if (res.status === 401) {
    try {
      clearStoredSession();
      const sso = await authenticateWithSso();
      const newToken = sso?.token;
      if (newToken) {
        headers.Authorization = "Bearer " + newToken;
        res = await fetch(API_BASE + path, {
          ...options,
          headers,
        });
        try {
          data = await res.json();
        } catch {
          // no body
        }
      }
    } catch (e) {
      e.isSsoError = true;
      throw e;
    }
  }

  if (!res.ok) {
    const err = new Error(
      (data && data.message) || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.data = data;
    if (res.status === 401 || res.status === 403) {
      err.isAuthError = true;
    }
    throw err;
  }
  return data;
}

export async function ssoLogin(employeeId, ts, sig) {
  let res;
  let data = null;
  try {
    res = await fetch(`${API_BASE}/sso-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ employee_id: employeeId, ts, sig }),
    });
    data = await res.json().catch(() => null);
  } catch (fetchErr) {
    clearStoredSession();
    fetchErr.isSsoError = true;
    throw fetchErr;
  }

  if (res.ok && data?.data?.token) {
    setStoredSession(data.data.token, data.data.full_name, employeeId);
    return {
      success: true,
      token: data.data.token,
      fullName: data.data.full_name,
    };
  }

  clearStoredSession();
  const err = new Error(data?.message || "Could not sign in with SSO link.");
  err.status = res.status;
  err.data = data;
  err.isSsoError = true;
  throw err;
}

/**
 * Determines whether an error represents an access denied / authorization / SSO failure.
 * When SSO fails (e.g. 404 "No active account for this employee", 401 unauthorized,
 * or user doesn't exist on purchase approval server), or when permission is denied,
 * this returns true.
 */
export function isApprovalAccessDenied(err) {
  if (!err) return false;

  // Any SSO / login failure means the user cannot authenticate in purchase approval module
  if (err.isSsoError || err.isAuthError) return true;

  // HTTP unauthorized / forbidden
  if (err.status === 401 || err.status === 403) return true;

  const msg = (err.message || "").toLowerCase();

  // If status is 404, check if it relates to missing/inactive user or SSO
  if (err.status === 404) {
    if (
      msg.includes("no active account") ||
      msg.includes("employee") ||
      msg.includes("user") ||
      msg.includes("approver") ||
      msg.includes("account")
    ) {
      return true;
    }
  }

  return (
    msg.includes("not a management approver") ||
    msg.includes("not authorized") ||
    msg.includes("no active account") ||
    msg.includes("no employee id") ||
    msg.includes("access denied") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("permission") ||
    msg.includes("sso link expired") ||
    msg.includes("cannot authenticate")
  );
}

/**
 * Returns a user-friendly message for the Access Denied screen.
 */
export function getApprovalDeniedMessage(err) {
  if (!err) return "This account is not authorized as a management approver.";

  const raw = typeof err === "string" ? err : err.message || "";
  const trimmed = raw.trim();

  // If the message is a raw HTTP/fetch string or empty
  if (
    !trimmed ||
    /^request failed \(\d+\)$/i.test(trimmed) ||
    /^failed to fetch$/i.test(trimmed)
  ) {
    return "No active account or authorization found for this employee in the Purchase Approval module.";
  }

  return trimmed;
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
