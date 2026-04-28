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

  if (normalizedValue === "site-job") {
    return "site";
  }

  if (normalizedValue === "off") {
    return "OFF";
  }

  if (normalizedValue === "work-from-home") {
    return "WFH";
  }

  return normalizedValue;
}

const TIME_LOG_EXTRA_FIELD_API_KEYS = {
  workHome: "home",
  night: "night",
  health: "health",
  family: "family",
  friends: "friend",
  sleep: "sleep",
  travel: "travel",
};


const TASK_MAIN_TYPE_TO_ID = {
  Invoiceable: "1",
  "Non Invoiceable": "2",
};

const TASK_MAIN_TYPE_ID_TO_LABEL = {
  "1": "Invoiceable",
  "2": "Non Invoiceable",
};

let taskMainTypeCatalog = [];
let taskSubTypeCatalog = [];

function normalizeMainTypeOption(item) {
  const id = `${item?.main_type_id ?? item?.id ?? ""}`.trim();
  const label = `${item?.main_type_name ?? item?.name ?? ""}`.trim();

  if (!id || !label) {
    return null;
  }

  return {
    id,
    label,
  };
}

function normalizeSubTypeOption(item) {
  const id = `${item?.id ?? item?.sub_type_id ?? item?.job_type_id ?? ""}`.trim();
  const label = `${item?.job_type_name ?? item?.sub_type_name ?? item?.name ?? ""}`.trim();

  if (!id || !label) {
    return null;
  }

  return {
    id,
    label,
  };
}

function normalizeDayTypeOption(item) {
  const apiValue = `${item?.value ?? item?.work_status ?? item?.id ?? ""}`.trim();
  const label = `${item?.name ?? item?.label ?? ""}`.trim();

  if (!apiValue || !label) {
    return null;
  }

  return {
    value: mapApiWorkStatusToDayType(apiValue),
    label,
    apiValue,
  };
}

function normalizeDayLeaveTypeOption(item) {
  const value = `${item?.leave_type_name ?? item?.value ?? item?.id ?? ""}`.trim();
  const label = `${item?.name ?? item?.label ?? ""}`.trim();

  if (!value || !label) {
    return null;
  }

  return {
    value,
    label,
  };
}

async function listTaskCatalogByAction(actionValue, normalizeItem) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return [];
  }

  const formData = new FormData();

  try {
    const response = await fetch(`${apiBaseUrl}?action=${actionValue}`, {
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

    return payload.data
      .map((item) => normalizeItem(item))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function listCatalogByAction(actionValue, normalizeItem, buildFormData) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl) {
    return [];
  }

  const formData = buildFormData ? buildFormData() : new FormData();

  try {
    const response = await fetch(`${apiBaseUrl}?action=${actionValue}`, {
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

    return payload.data
      .map((item) => normalizeItem(item))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function listEffismLiteMainTypes() {
  const options = await listTaskCatalogByAction("mainType", normalizeMainTypeOption);
  taskMainTypeCatalog = options;
  return options;
}

export async function listEffismLiteSubTypes() {
  const options = await listTaskCatalogByAction("subType", normalizeSubTypeOption);
  taskSubTypeCatalog = options;
  return options;
}

export function getApiWorkStatusForDayType(value) {
  return mapDayTypeToApiWorkStatus(value);
}

export async function listEffismLiteDayTypes() {
  return listCatalogByAction("getDayType", normalizeDayTypeOption);
}

export async function listEffismLiteDayLeaveTypes(workStatus) {
  const apiWorkStatus = mapDayTypeToApiWorkStatus(workStatus);
  if (!apiWorkStatus) {
    return [];
  }

  return listCatalogByAction(
    "getDayLeaveTypes",
    normalizeDayLeaveTypeOption,
    () => {
      const formData = new FormData();
      formData.append("work_status", apiWorkStatus);
      return formData;
    },
  );
}

export function mapApiWorkStatusToDayType(value) {
  const normalizedValue = `${value || ""}`.trim().toLowerCase();

  if (normalizedValue === "work") {
    return "working-day";
  }

  if (normalizedValue === "wfh") {
    return "work-from-home";
  }

  if (normalizedValue === "site") {
    return "site";
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

  const fromCatalog = taskMainTypeCatalog.find((item) => item.id === normalizedValue);
  if (fromCatalog) {
    return fromCatalog.label;
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

  const loweredValue = normalizedValue.toLowerCase();
  const fromCatalog = taskMainTypeCatalog.find(
    (item) => item.label.toLowerCase() === loweredValue,
  );
  if (fromCatalog) {
    return fromCatalog.id;
  }

  if (TASK_MAIN_TYPE_TO_ID[normalizedValue]) {
    return TASK_MAIN_TYPE_TO_ID[normalizedValue];
  }

  const matchedKey = Object.keys(TASK_MAIN_TYPE_TO_ID).find(
    (key) => key.toLowerCase() === loweredValue,
  );

  return matchedKey ? TASK_MAIN_TYPE_TO_ID[matchedKey] : "";
}

export function mapTaskSubTypeIdToLabel(value) {
  const normalizedValue = `${value || ""}`.trim();
  if (!normalizedValue) {
    return "";
  }

  const fromCatalog = taskSubTypeCatalog.find((item) => item.id === normalizedValue);
  if (fromCatalog) {
    return fromCatalog.label;
  }

  return "";
}

export function mapTaskSubTypeLabelToId(value) {
  const normalizedValue = `${value || ""}`.trim();
  if (!normalizedValue) {
    return "";
  }

  const loweredValue = normalizedValue.toLowerCase();
  const fromCatalog = taskSubTypeCatalog.find(
    (item) => item.label.toLowerCase() === loweredValue,
  );

  return fromCatalog ? fromCatalog.id : "";
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
  const extraTimeValues = Object.entries(TIME_LOG_EXTRA_FIELD_API_KEYS).map(
    ([field, apiKey]) => ({
      apiKey,
      value: normalizeDurationForApi(jobDetails[field]),
    }),
  );

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

  extraTimeValues.forEach(({ apiKey, value }) => {
    if (value) {
      formData.append(apiKey, value);
    }
  });

  if ((workStatus === "OFF" || workStatus === "leave") && jobDetails.daySubtype) {
    formData.append("leave_type_name", jobDetails.daySubtype);
  }

  if (
    ![
      workStatus,
      timeIn,
      timeOut,
      nwt,
      siteTravel,
      jobDetails.daySubtype,
      ...extraTimeValues.map((entry) => entry.value),
    ].some(Boolean)
  ) {
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

    if (!response.ok || !isSuccessfulPayload(payload)) {
      return [];
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return payload;
  } catch {
    return [];
  }
}

function buildTaskFormData(task, date, options = {}) {
  const taskName = `${task?.taskName || ""}`.trim();
  const mainTypeId = mapTaskMainTypeLabelToId(task?.mainType);
  const subTypeId = mapTaskSubTypeLabelToId(task?.subType);
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
  if (subTypeId) {
    formData.append("sub_type", subTypeId);
  }
  formData.append("est_time", estimatedTime);
  formData.append("act_time", actualTime || "00:00");
  formData.append("job_no", jobNumber);
  formData.append("description", description);
  formData.append("desc", description);
  formData.append("status", normalizedStatusValue);

  const includeBlankDates = options?.includeBlankDates === true;
  const cfDate = `${task?.cfDate || ""}`.trim();
  const targetDate = `${task?.targetDate || ""}`.trim();

  if (includeBlankDates || cfDate) {
    formData.append("cf_date", cfDate);
  }

  if (includeBlankDates || targetDate) {
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

  const formData = buildTaskFormData(task, date, { includeBlankDates: true });
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

function buildPartialTaskFormData(task, date, idFieldName, idValue, options = {}) {
  const normalizedDate = `${date || ""}`.trim();
  const normalizedId = `${idValue || ""}`.trim();
  const estimatedTime = normalizeTaskTimeForApi(task?.estimatedTime);
  const actualTime = normalizeTaskTimeForApi(task?.actualTime) || "00:00";

  if (!normalizedDate || !normalizedId || !estimatedTime) {
    return null;
  }

  const formData = new FormData();
  formData.append(idFieldName, normalizedId);
  formData.append("date", normalizedDate);
  formData.append("est_time", estimatedTime);
  formData.append("act_time", actualTime);

  if (options.includeOutcome) {
    const description = `${task?.outcome || ""}`.trim();
    formData.append(options.outcomeField || "description", description);
  }

  if (options.includeStatus) {
    const statusValue = Number.parseInt(`${task?.status || "0"}`.replace("%", ""), 10);
    formData.append(
      "status",
      Number.isFinite(statusValue)
        ? `${Math.min(100, Math.max(0, statusValue))}`
        : "0",
    );
  }

  if (options.includeCfDate) {
    formData.append("cf_date", `${task?.cfDate || ""}`.trim());
  }

  if (options.includeTargetDate) {
    formData.append("target_date", `${task?.targetDate || ""}`.trim());
  }

  if (options.includeStore) {
    formData.append("store", `${task?.store ?? 0}`);
  }

  return formData;
}

async function postEffismLiteTaskAction(action, formData) {
  const { apiBaseUrl } = await getRuntimeConfig();
  if (!apiBaseUrl || !formData) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}?action=${action}`, {
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

export async function editEffismLiteRoutineJob(task, date) {
  const formData = buildPartialTaskFormData(
    task,
    date,
    "job_id",
    task?.routineJobId || task?.id,
    {
      includeOutcome: true,
      outcomeField: "remarks",
    },
  );

  return postEffismLiteTaskAction("addEditRoutineJob", formData);
}

export async function editEffismLiteCFJob(task, date) {
  const formData = buildPartialTaskFormData(
    task,
    date,
    "workreport_id",
    task?.workreportId,
    {
      includeOutcome: true,
      includeStatus: true,
      includeCfDate: true,
      includeTargetDate: true,
      includeStore: true,
    },
  );

  return postEffismLiteTaskAction("editCFJob", formData);
}

export async function editEffismLiteDelegatedJob(task, date) {
  const formData = buildPartialTaskFormData(
    task,
    date,
    "workreport_id",
    task?.workreportId,
    {
      includeOutcome: true,
      includeStatus: true,
      includeCfDate: true,
      includeTargetDate: true,
      includeStore: true,
    },
  );

  return postEffismLiteTaskAction("editDelegatedJob", formData);
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

export async function getEffismLiteJobDiarySummary(dateValue) {
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
    const response = await fetch(`${apiBaseUrl}?action=jobdiarySummary`, {
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

    return {
      netTime: normalizeApiClockValue(payload?.net_time),
      totalAct: normalizeApiClockValue(payload?.total_act),
      totalEst: normalizeApiClockValue(payload?.total_est),
    };
  } catch {
    return null;
  }
}
