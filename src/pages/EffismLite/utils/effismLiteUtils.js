export function createTaskId() {
  return `effism-lite-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeClockInput(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  const matchedValue = trimmedValue.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!matchedValue) return value;
  const [, rawHours, rawMinutes] = matchedValue;
  const minutes = Number(rawMinutes);
  if (minutes < 0 || minutes > 59) return value;
  return `${String(rawHours).padStart(2, "0")}:${rawMinutes}`;
}

export function formatClockInputAsTyped(value) {
  const rawValue = `${value || ""}`;
  const colonMatch = rawValue.match(/^(\d{0,2})\s*[:.]\s*(\d{0,2})/);
  if (colonMatch && /[:.]/.test(rawValue)) {
    const hoursPart = colonMatch[1].slice(0, 2);
    const minutesPart = colonMatch[2].slice(0, 2);
    if (!hoursPart && !minutesPart) return "";
    if (!minutesPart.length) return hoursPart.length ? `${hoursPart.padStart(2, "0")}:` : "";
    if (minutesPart.length < 2) return `${hoursPart.padStart(2, "0")}:${minutesPart}`;
    return `${hoursPart.padStart(2, "0")}:${minutesPart.slice(0, 2)}`;
  }
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 4);
  if (!digitsOnly.length) return "";
  if (digitsOnly.length <= 2) return digitsOnly;
  return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2, 4)}`;
}

export function normalizeStatusValue(value) {
  const trimmedValue = `${value || ""}`.trim();
  if (!trimmedValue) return "0%";
  const matchedValue = trimmedValue.match(/^(\d{1,3})%$/);
  if (!matchedValue) return "0%";
  const percentage = Number(matchedValue[1]);
  if (percentage <= 0) return "0%";
  if (percentage >= 100) return "100%";
  return `${Math.round(percentage / 5) * 5}%`;
}

export function parseClockValueToMinutes(value) {
  const normalizedValue = normalizeClockInput(`${value || ""}`.trim());
  const matchedValue = normalizedValue.match(/^(\d{1,2}):(\d{2})$/);
  if (!matchedValue) return 0;
  const hours = Number(matchedValue[1]);
  const minutes = Number(matchedValue[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes > 59) return 0;
  return hours * 60 + minutes;
}

export function formatMinutesToClock(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getTaskComparableSnapshot(task) {
  return JSON.stringify({
    taskName: `${task?.taskName ?? ""}`,
    mainType: `${task?.mainType ?? ""}`,
    subType: `${task?.subType ?? ""}`,
    jobNumber: `${task?.jobNumber ?? ""}`,
    estimatedTime: `${task?.estimatedTime ?? ""}`,
    actualTime: `${task?.actualTime ?? ""}`,
    outcome: `${task?.outcome ?? ""}`,
    status: normalizeStatusValue(task?.status),
    cfDate: `${task?.cfDate ?? ""}`,
    targetDate: `${task?.targetDate ?? ""}`,
  });
}

export function createEditableTask(task = {}, overrides = {}) {
  const baseTask = {
    id: task.id || createTaskId(),
    workreportId: task.workreportId || "",
    taskName: task.taskName || "",
    mainType: task.mainType || "",
    subType: task.subType || "",
    jobNumber: task.jobNumber || "",
    estimatedTime: task.estimatedTime || "00:00",
    actualTime: task.actualTime || "00:00",
    outcome: task.outcome || "",
    status: normalizeStatusValue(task.status),
    cfDate: task.cfDate || "",
    targetDate: task.targetDate || "",
    isSaving: false,
    saveError: "",
    isSaved: false,
    isEditing: true,
    isExpanded: true,
    editSnapshot: "",
    isDirty: false,
  };
  const nextTask = { ...baseTask, ...overrides };
  return {
    ...nextTask,
    editSnapshot: nextTask.editSnapshot || getTaskComparableSnapshot(nextTask),
    isDirty: Boolean(nextTask.isDirty),
  };
}

export function isEmptyDraftTask(task) {
  if (`${task.workreportId || ""}`.trim()) return false;
  if (task.isSaved) return false;
  const name = `${task.taskName || ""}`.trim();
  const mainType = `${task.mainType || ""}`.trim();
  const jobNumber = `${task.jobNumber || ""}`.trim();
  const outcome = `${task.outcome || ""}`.trim();
  const cfDate = `${task.cfDate || ""}`.trim();
  const targetDate = `${task.targetDate || ""}`.trim();
  const est = normalizeClockInput(`${task.estimatedTime || ""}`.trim()) || "00:00";
  const act = normalizeClockInput(`${task.actualTime || ""}`.trim()) || "00:00";
  return (
    !name &&
    !mainType &&
    !jobNumber &&
    !outcome &&
    !cfDate &&
    !targetDate &&
    est === "00:00" &&
    act === "00:00" &&
    normalizeStatusValue(task.status) === "0%"
  );
}

export function getTaskSummaryTitle(task) {
  return task.taskName || "Untitled Task";
}

export function renderTaskSummaryTime(label, value) {
  return `${label}: ${value || "--"}`;
}

export function getTaskStatusTone(statusValue) {
  const percentage = Number.parseInt(`${statusValue || "0"}`, 10);
  return percentage >= 100 ? "complete" : "pending";
}

export function getTaskMainTypeLabel(value) {
  if (value === "Invoiceable") return "Inv";
  if (value === "Non Invoiceable") return "Non Inv";
  return value || "No type";
}

export function getTaskMainTypeTone(value) {
  if (value === "Non Invoiceable") return "non-invoiceable";
  return "invoiceable";
}

export function getTaskJobNumberLabel(value) {
  return value || "No job number";
}

export function normalizeApiDateValue(value) {
  const normalizedValue = `${value || ""}`.trim();
  if (!normalizedValue || normalizedValue === "0000-00-00") return "";
  return normalizedValue;
}

export function formatDateDisplayValue(value) {
  const normalizedValue = normalizeApiDateValue(value);
  if (!normalizedValue) return "Select date";
  const [year, month, day] = normalizedValue.split("-").map(Number);
  if (!year || !month || !day) return normalizedValue;
  const dateValue = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateValue);
}

export function mapTaskErrorsFromPayload(payload) {
  if (!payload || payload.sub_error !== true || !Array.isArray(payload.errors)) {
    return new Map();
  }
  return payload.errors.reduce((result, entry) => {
    const taskId =
      `${entry?.task_id ?? entry?.workreport_id ?? entry?.work_report_id ?? entry?.id ?? ""}`.trim();
    const reason = `${entry?.reason || ""}`.trim();
    if (taskId && reason) result.set(taskId, reason);
    return result;
  }, new Map());
}

export function convertNativeTimeToMeridiem(value) {
  const matchedValue = `${value || ""}`.match(/^(\d{2}):(\d{2})$/);
  if (!matchedValue) return { time: "", meridiem: "AM" };
  const hours = Number(matchedValue[1]);
  const minutes = matchedValue[2];
  if (hours === 0 && minutes === "00") return { time: "00:00", meridiem: "AM" };
  const meridiem = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return { time: `${String(normalizedHours).padStart(2, "0")}:${minutes}`, meridiem };
}
