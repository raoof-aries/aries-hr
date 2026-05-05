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

function normalizeApiClockValue(value) {
  const matchedValue = `${value || ""}`
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!matchedValue) {
    return "";
  }

  return `${matchedValue[1].padStart(2, "0")}:${matchedValue[2]}`;
}

function normalizeTimeForApi(value) {
  const matchedValue = `${value || ""}`
    .trim()
    .match(/^(\d{1,2})[:.](\d{2})$/);

  if (!matchedValue) {
    return "";
  }

  const hours = Number(matchedValue[1]);
  const minutes = Number(matchedValue[2]);

  if (hours < 0 || minutes < 0 || minutes > 59) {
    return "";
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildTaskId(task, index) {
  const workreportId = `${task?.workreport_id ?? task?.workreportId ?? ""}`.trim();
  return workreportId ? `time-tracker-${workreportId}` : `time-tracker-api-${index}`;
}

function mapApiTaskToTimeTrackerTask(task, index) {
  return {
    id: buildTaskId(task, index),
    workreportId: `${task?.workreport_id ?? task?.workreportId ?? ""}`.trim(),
    taskName: `${task?.taskname ?? task?.taskName ?? ""}`.trim(),
    jobNumber: `${task?.job_no ?? task?.jobNumber ?? ""}`.trim(),
    mainType: "",
    estimatedTime: normalizeApiClockValue(task?.act_time ?? task?.actualTime),
    actualTime: normalizeApiClockValue(task?.act_time ?? task?.actualTime),
    outcome: `${task?.description ?? task?.desc ?? task?.outcome ?? ""}`.trim(),
    isEditing: false,
    isSaved: true,
    isSaving: false,
    saveError: "",
  };
}

async function postTimeTrackerAction(action, formData) {
  const { freelancerApiBaseUrl, apiBaseUrl } = await getRuntimeConfig();
  const trackerApiBaseUrl =
    freelancerApiBaseUrl || "https://www.efftime.com/webservices/freelancer/";

  if (!trackerApiBaseUrl && !apiBaseUrl) {
    return {
      success: false,
      message: "API base URL missing. Update runtime config.",
    };
  }

  let response = null;
  let payload = null;

  try {
    response = await fetch(`${trackerApiBaseUrl || apiBaseUrl}?action=${action}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } catch (error) {
    return {
      success: false,
      message: "Cannot reach time tracker API.",
      details: error?.message || "",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      message: payload?.message || `Time tracker request failed (HTTP ${response.status}).`,
      payload,
    };
  }

  return {
    success: isSuccessfulPayload(payload),
    message: payload?.message || "",
    payload,
  };
}

function buildTaskFormData(task, date, { includeWorkreportId = false } = {}) {
  const normalizedDate = `${date || ""}`.trim();
  const workreportId = `${task?.workreportId || ""}`.trim();
  const taskName = `${task?.taskName || ""}`.trim();
  const jobNumber = `${task?.jobNumber || ""}`.trim();
  const actTime = normalizeTimeForApi(task?.estimatedTime || task?.actualTime);
  const description = `${task?.outcome || ""}`.trim();

  if (!normalizedDate || !taskName || !jobNumber || !actTime) {
    return null;
  }

  if (includeWorkreportId && !workreportId) {
    return null;
  }

  const formData = new FormData();

  if (includeWorkreportId) {
    formData.set("workreport_id", workreportId);
  }

  formData.set("date", normalizedDate);
  formData.set("job_no", jobNumber);
  formData.set("taskname", taskName);
  formData.set("act_time", actTime);
  formData.set("description", description);

  return formData;
}

export async function listTimeTrackerJobs(dateValue) {
  const normalizedDate = `${dateValue || ""}`.trim();

  if (!normalizedDate) {
    return {
      success: false,
      jobs: [],
      message: "Date is required to load tasks.",
    };
  }

  const formData = new FormData();
  formData.set("date", normalizedDate);

  const result = await postTimeTrackerAction("listFreelancerJob", formData);
  const payloadJobs = Array.isArray(result.payload?.jobs) ? result.payload.jobs : [];

  return {
    ...result,
    jobs: result.success ? payloadJobs.map(mapApiTaskToTimeTrackerTask) : [],
  };
}

export async function addTimeTrackerJob(task, date) {
  const formData = buildTaskFormData(task, date);

  if (!formData) {
    return {
      success: false,
      message: "Required fields missing: date, job_no, taskname, act_time",
    };
  }

  return postTimeTrackerAction("addJobFreelancer", formData);
}

export async function editTimeTrackerJob(task, date) {
  const formData = buildTaskFormData(task, date, { includeWorkreportId: true });

  if (!formData) {
    return {
      success: false,
      message: "Required fields missing: workreport_id, date, taskname, job_no, act_time",
    };
  }

  return postTimeTrackerAction("editFreelancerJob", formData);
}
