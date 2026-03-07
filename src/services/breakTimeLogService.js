const BREAK_TIME_LOGS_STORAGE_KEY = "breakTimeLogs";

function parseStoredLogs() {
  try {
    const rawLogs = localStorage.getItem(BREAK_TIME_LOGS_STORAGE_KEY);
    if (!rawLogs) {
      return [];
    }

    const parsedLogs = JSON.parse(rawLogs);
    return Array.isArray(parsedLogs) ? parsedLogs : [];
  } catch (error) {
    console.error("Unable to parse break time logs:", error);
    return [];
  }
}

function persistLogs(logs) {
  localStorage.setItem(BREAK_TIME_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

function createLogId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `break-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalTimeValue(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function resolveBreakTimeUserId(user, userName = "") {
  return (
    user?.id ||
    user?.user_id ||
    user?.employeeId ||
    user?.employee_id ||
    user?.employeeCode ||
    user?.employee_code ||
    user?.username ||
    userName ||
    "anonymous-user"
  );
}

export function getBreakTimeLogsForDate({ userId, date }) {
  return parseStoredLogs()
    .filter((record) => record.user_id === userId && record.date === date)
    .sort(
      (left, right) =>
        new Date(right.submitted_time).getTime() -
        new Date(left.submitted_time).getTime(),
    );
}

export function createBreakTimeLog({
  userId,
  logType,
  reason = "",
  customTimeUsed = false,
  customTime = "",
  qrVerified = true,
}) {
  const submittedAt = new Date();
  const submittedTime = submittedAt.toISOString();
  const date = getLocalDateValue(submittedAt);
  const recordedTime = customTimeUsed && customTime
    ? customTime
    : getLocalTimeValue(submittedAt);

  const record = {
    id: createLogId(),
    user_id: userId,
    date,
    out_time: logType === "out" ? recordedTime : "",
    in_time: logType === "in" ? recordedTime : "",
    reason: logType === "out" ? reason.trim() : "",
    custom_time_used: Boolean(customTimeUsed),
    custom_time: customTimeUsed ? customTime : "",
    submitted_time: submittedTime,
    qr_verified: Boolean(qrVerified),
    log_type: logType,
    meta: {
      approval_status: "logged",
      location_verified: false,
      qr_source: "single-config",
    },
  };

  const logs = parseStoredLogs();
  logs.unshift(record);
  persistLogs(logs);
  return record;
}
