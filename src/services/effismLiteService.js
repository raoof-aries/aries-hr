import { getRuntimeConfig } from "../utils/runtimeConfig";

function isSuccessfulPayload(payload) {
  return payload?.status === true || payload?.status === "true";
}

function getAuthHeaders() {
  const authToken = localStorage.getItem("authToken") || "";

  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
      }
    : {};
}

function normalizeClockInput(value) {
  const trimmedValue = `${value || ""}`.trim();

  if (!trimmedValue) {
    return "";
  }

  const matchedValue = trimmedValue.match(/^(\d{1,2})[:.](\d{2})$/);

  if (!matchedValue) {
    return trimmedValue;
  }

  const [, rawHours, rawMinutes] = matchedValue;
  const minutes = Number(rawMinutes);

  if (minutes < 0 || minutes > 59) {
    return trimmedValue;
  }

  return `${String(rawHours).padStart(2, "0")}:${rawMinutes}`;
}

function normalizeDurationForApi(value) {
  const normalizedValue = normalizeClockInput(value);
  const matchedValue = normalizedValue.match(/^(\d{1,2}):(\d{2})$/);

  if (!matchedValue) {
    return "";
  }

  return `${String(Number(matchedValue[1])).padStart(2, "0")}:${matchedValue[2]}`;
}

function convertMeridiemToNativeTime(timeValue, meridiemValue) {
  const matchedValue = `${timeValue || ""}`
    .trim()
    .match(/^(\d{1,2})[:.](\d{2})$/);

  if (!matchedValue) {
    return "";
  }

  const hours = Number(matchedValue[1]);
  const minutes = Number(matchedValue[2]);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return "";
  }

  const normalizedMeridiem = `${meridiemValue || "AM"}`.toUpperCase();
  let nativeHours = hours % 12;

  if (normalizedMeridiem === "PM") {
    nativeHours += 12;
  }

  return `${String(nativeHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function mapDayTypeToApiWorkStatus(value) {
  const normalizedValue = `${value || ""}`.trim().toLowerCase();

  if (normalizedValue === "working-day") {
    return "work";
  }

  if (normalizedValue === "work-from-home") {
    return "wfh";
  }

  return normalizedValue;
}

const TASK_MAIN_TYPE_TO_ID = {
  Invoiceable: "1",
  "Non Invoiceable": "2",
};

const TASK_MAIN_TYPE_ID_TO_LABEL = {
  "1": "Invoiceable",
  "2": "Non Invoiceable",
};

export function mapApiWorkStatusToDayType(value) {
  const normalizedValue = `${value || ""}`.trim().toLowerCase();

  if (normalizedValue === "work") {
    return "working-day";
  }

  if (normalizedValue === "wfh") {
    return "work-from-home";
  }

  return normalizedValue;
}

export function normalizeApiClockValue(value) {
  const matchedValue = `${value || ""}`
    .trim()
    .match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!matchedValue) {
    return "";
  }

  return `${matchedValue[1]}:${matchedValue[2]}`;
}

function normalizeTaskTimeForApi(value) {
  const normalizedValue = normalizeClockInput(value);
  const matchedValue = `${normalizedValue || ""}`.match(/^(\d{1,2}):(\d{2})$/);

  if (!matchedValue) {
    return "";
  }

  return `${String(Number(matchedValue[1])).padStart(2, "0")}:${matchedValue[2]}`;
}

export function mapTaskMainTypeIdToLabel(value) {
  const normalizedValue = `${value || ""}`.trim();
  if (!normalizedValue) {
    return "";
  }

  if (TASK_MAIN_TYPE_ID_TO_LABEL[normalizedValue]) {
    return TASK_MAIN_TYPE_ID_TO_LABEL[normalizedValue];
  }

  if (normalizedValue === "Invoiceable" || normalizedValue === "Non Invoiceable") {
    return normalizedValue;
  }

  return "";
}

export function mapTaskMainTypeLabelToId(value) {
  const normalizedValue = `${value || ""}`.trim();
  if (!normalizedValue) {
    return "";
  }

  if (TASK_MAIN_TYPE_TO_ID[normalizedValue]) {
    return TASK_MAIN_TYPE_TO_ID[normalizedValue];
  }

  const lowered = normalizedValue.toLowerCase();
  const matchedKey = Object.keys(TASK_MAIN_TYPE_TO_ID).find(
    (key) => key.toLowerCase() === lowered,
  );

  return matchedKey ? TASK_MAIN_TYPE_TO_ID[matchedKey] : "";
}

export async function getEffismLiteLastWorkingDate() {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return "";
  }

  try {
    const response = await fetch(`${apiBaseUrl}?action=lastWorkingDate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: new FormData(),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return "";
    }

    return `${payload?.last_working_date || ""}`;
  } catch {
    return "";
  }
}

export async function getEffismLiteTimeRecord(dateValue) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return null;
  }

  const normalizedDateValue = `${dateValue || ""}`.trim();
  if (!normalizedDateValue) {
    return null;
  }

  const formData = new FormData();
  formData.append("date", normalizedDateValue);

  try {
    const response = await fetch(`${apiBaseUrl}?action=fetchTime`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return null;
    }

    return payload?.data || null;
  } catch {
    return null;
  }
}

export async function saveEffismLiteTimeRecord(jobDetails) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return null;
  }

  const workStatus = mapDayTypeToApiWorkStatus(jobDetails.dayType);
  const timeIn = convertMeridiemToNativeTime(
    jobDetails.timeIn,
    jobDetails.timeInMeridiem,
  );
  const timeOut = convertMeridiemToNativeTime(
    jobDetails.timeOut,
    jobDetails.timeOutMeridiem,
  );
  const nwt = normalizeDurationForApi(jobDetails.breakTime);
  const siteTravel = normalizeDurationForApi(jobDetails.siteTravel);

  if (!jobDetails.date) {
    return null;
  }

  const formData = new FormData();
  formData.append("date", jobDetails.date);

  if (workStatus) {
    formData.append("work_status", workStatus);
  }

  if (timeIn) {
    formData.append("time_in", timeIn);
  }

  if (timeOut) {
    formData.append("time_out", timeOut);
  }

  if (nwt) {
    formData.append("nwt", nwt);
  }

  if (siteTravel) {
    formData.append("site_travel", siteTravel);
  }

  if (![workStatus, timeIn, timeOut, nwt, siteTravel].some(Boolean)) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}?action=saveTime`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function listEffismLiteJobs(dateValue) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return [];
  }

  const normalizedDateValue = `${dateValue || ""}`.trim();
  if (!normalizedDateValue) {
    return [];
  }

  const formData = new FormData();
  formData.append("date", normalizedDateValue);

  try {
    const response = await fetch(`${apiBaseUrl}?action=listJobs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload) || !Array.isArray(payload?.data)) {
      return [];
    }

    return payload.data;
  } catch {
    return [];
  }
}

function buildTaskFormData(task, date) {
  const taskName = `${task?.taskName || ""}`.trim();
  const mainTypeId = mapTaskMainTypeLabelToId(task?.mainType);
  const estimatedTime = normalizeTaskTimeForApi(task?.estimatedTime);
  const actualTime = normalizeTaskTimeForApi(task?.actualTime);
  const jobNumber = `${task?.jobNumber || ""}`.trim();
  const description = `${task?.outcome || ""}`.trim();
  const statusValue = Number.parseInt(`${task?.status || "0"}`.replace("%", ""), 10);
  const normalizedStatusValue = Number.isFinite(statusValue)
    ? `${Math.min(100, Math.max(0, statusValue))}`
    : "0";

  if (!date || !taskName || !mainTypeId || !estimatedTime) {
    return null;
  }

  const formData = new FormData();
  formData.append("date", date);
  formData.append("taskname", taskName);
  formData.append("main_type", mainTypeId);
  formData.append("est_time", estimatedTime);
  formData.append("act_time", actualTime || "00:00");
  formData.append("job_no", jobNumber);
  formData.append("description", description);
  formData.append("desc", description);
  formData.append("status", normalizedStatusValue);

  const cfDate = `${task?.cfDate || ""}`.trim();
  const targetDate = `${task?.targetDate || ""}`.trim();

  if (cfDate) {
    formData.append("cf_date", cfDate);
  }

  if (targetDate) {
    formData.append("target_date", targetDate);
  }

  return formData;
}

export async function addEffismLiteJob(task, date) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return null;
  }

  const formData = buildTaskFormData(task, date);
  if (!formData) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}?action=addNewJob`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function editEffismLiteJob(task, date) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return null;
  }

  const workreportId = `${task?.workreportId || ""}`.trim();
  if (!workreportId) {
    return null;
  }

  const formData = buildTaskFormData(task, date);
  if (!formData) {
    return null;
  }

  formData.append("workreport_id", workreportId);

  try {
    const response = await fetch(`${apiBaseUrl}?action=editJob`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function completeEffismLiteJobDiary(dateValue) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return {
      success: false,
      message: "API base URL is missing.",
    };
  }

  const normalizedDateValue = `${dateValue || ""}`.trim();
  if (!normalizedDateValue) {
    return {
      success: false,
      message: "Date is required.",
    };
  }

  const formData = new FormData();
  formData.append("date", normalizedDateValue);

  try {
    const response = await fetch(`${apiBaseUrl}?action=completeJobdiary`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return {
        success: false,
        message: payload?.message || "Failed to complete job diary.",
        payload,
      };
    }

    return {
      success: true,
      message: payload?.message || "Job diary completed successfully.",
      payload,
    };
  } catch {
    return {
      success: false,
      message: "Failed to complete job diary.",
    };
  }
}

export async function getEffismLiteJobDiaryStatus(dateValue) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return {
      success: false,
      isComplete: false,
      message: "API base URL is missing.",
    };
  }

  const normalizedDateValue = `${dateValue || ""}`.trim();
  if (!normalizedDateValue) {
    return {
      success: false,
      isComplete: false,
      message: "Date is required.",
    };
  }

  const formData = new FormData();
  formData.append("date", normalizedDateValue);

  try {
    const response = await fetch(`${apiBaseUrl}?action=jobdiaryStatus`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return {
        success: false,
        isComplete: false,
        message: payload?.message || "Failed to fetch job diary status.",
      };
    }

    return {
      success: true,
      isComplete: Number.parseInt(`${payload?.is_complete ?? 0}`, 10) === 1,
      message: payload?.message || "",
      payload,
    };
  } catch {
    return {
      success: false,
      isComplete: false,
      message: "Failed to fetch job diary status.",
    };
  }
}
