// Grievance / Complaint Box Service
// Handles grievance types, submission storage, and status tracking with localStorage persistence

const STORAGE_KEY_GRIEVANCES = "aries_hrms_grievances";

export const GRIEVANCE_TYPES = [
  { value: "workplace_environment", label: "Workplace Environment & Facilities" },
  { value: "compensation_payroll", label: "Salary, Allowance & Compensation" },
  { value: "harassment_conduct", label: "Harassment, Bias or Code of Conduct" },
  { value: "management_supervision", label: "Management & Supervision" },
  { value: "workload_schedule", label: "Workload, Overtime & Shift Scheduling" },
  { value: "leave_attendance", label: "Leave, Attendance & Holiday Issues" },
  { value: "policy_administration", label: "HR Policies & Administrative Support" },
  { value: "it_tools_equipment", label: "IT Systems, Tools & Equipment" },
  { value: "health_safety", label: "Health, Safety & Medical Facilities" },
  { value: "other", label: "Other Workplace Issue" },
];

const INITIAL_GRIEVANCES = [
  {
    id: "GRV-2026-0041",
    type: "workplace_environment",
    typeLabel: "Workplace Environment & Facilities",
    subject: "Air conditioning malfunction in 3rd Floor Engineering Bay",
    description: "The main HVAC unit cooling the 3rd floor design office has been intermittently shutting down since Monday afternoon. The room temperature gets uncomfortably high during the peak afternoon hours.",
    submittedBy: "Employee",
    submittedAt: "2026-10-02 11:30:00",
    status: "in_progress",
    statusLabel: "In Progress",
    attachment: {
      name: "ac_temperature_photo.jpg",
      size: "1.4 MB",
      type: "image/jpeg"
    },
    adminResponse: "Maintenance team has scheduled technician inspection for tomorrow 10:00 AM.",
    updatedAt: "2026-10-03 09:15:00"
  },
  {
    id: "GRV-2026-0038",
    type: "it_tools_equipment",
    typeLabel: "IT Systems, Tools & Equipment",
    subject: "CAD workstation multi-monitor display port adapter faulty",
    description: "The secondary display output adapter on workstation WS-04 flickers and disconnects frequently when opening heavy 3D structural models.",
    submittedBy: "Employee",
    submittedAt: "2026-09-24 15:45:00",
    status: "resolved",
    statusLabel: "Resolved",
    attachment: null,
    adminResponse: "Replacement DisplayPort cable and adapter delivered by IT support.",
    updatedAt: "2026-09-26 14:00:00"
  }
];

function getStoredGrievances() {
  const data = localStorage.getItem(STORAGE_KEY_GRIEVANCES);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(STORAGE_KEY_GRIEVANCES, JSON.stringify(INITIAL_GRIEVANCES));
  return INITIAL_GRIEVANCES;
}

function saveStoredGrievances(items) {
  localStorage.setItem(STORAGE_KEY_GRIEVANCES, JSON.stringify(items));
}

export function getGrievanceCategories() {
  return GRIEVANCE_TYPES;
}

export async function getGrievances() {
  return getStoredGrievances();
}

export async function submitGrievance({
  type,
  subject,
  description,
  userName = "Employee",
  attachment = null,
}) {
  const list = getStoredGrievances();
  const nextNum = String(list.length + 42).padStart(4, "0");
  const id = `GRV-2026-${nextNum}`;

  const typeObj = GRIEVANCE_TYPES.find((t) => t.value === type);
  const typeLabel = typeObj ? typeObj.label : "General Grievance";

  const now = new Date();
  const nowStr =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    " " +
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0") +
    ":" +
    String(now.getSeconds()).padStart(2, "0");

  const newGrievance = {
    id,
    type,
    typeLabel,
    subject: subject?.trim() || `${typeLabel} Report`,
    description: description.trim(),
    submittedBy: userName,
    submittedAt: nowStr,
    status: "submitted",
    statusLabel: "Submitted",
    attachment: attachment
      ? {
          name: attachment.name,
          size: formatFileSize(attachment.size),
          type: attachment.type,
          dataUrl: attachment.dataUrl || null,
        }
      : null,
    adminResponse: null,
    updatedAt: nowStr,
  };

  const updatedList = [newGrievance, ...list];
  saveStoredGrievances(updatedList);

  return {
    success: true,
    data: newGrievance,
    message: "Your grievance has been securely submitted to HR.",
  };
}

function formatFileSize(bytes) {
  if (typeof bytes === "string") return bytes;
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
