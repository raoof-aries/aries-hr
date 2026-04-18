import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LEAVE_DAY_SUBTYPE_OPTIONS,
  NON_EFFISM_DAY_TYPE_OPTIONS,
  OFF_DAY_SUBTYPE_OPTIONS,
} from "../../data/attendanceOptions";
import {
  addEffismLiteJob,
  completeEffismLiteJobDiary,
  editEffismLiteJob,
  getEffismLiteJobDiaryStatus,
  getEffismLiteLastWorkingDate,
  getEffismLiteTimeRecord,
  listEffismLiteJobs,
  mapTaskMainTypeIdToLabel,
  mapApiWorkStatusToDayType,
  normalizeApiClockValue,
  saveEffismLiteTimeRecord,
} from "../../services/effismLiteService";
import "./EffismLite.css";

const MAIN_TYPE_OPTIONS = ["Invoiceable", "Non Invoiceable"];

const JOB_NUMBER_OPTIONS = [
  "AES/Website/Plex/Ariesplex",
  "Effism/2020/ESOL/EFFISM",
  "AES/JN/2022/BIZEVENTS",
  "ESOL/AMR/WEBS/24",
];

const STATUS_OPTIONS = Array.from(
  { length: 21 },
  (_, index) => `${index * 5}%`,
);

const STEP_CONFIG = [
  {
    id: "details",
    title: "Time Log",
    path: "/effism-lite",
  },
  {
    id: "tasks",
    title: "Tasks",
    path: "/effism-lite/tasks",
  },
];

function createTaskId() {
  return `effism-lite-task-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeMeridiemTime(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const matchedValue = trimmedValue.match(
    /^(\d{1,2})[:.](\d{2})\s*([AaPp][Mm])$/,
  );

  if (!matchedValue) {
    return value;
  }

  const [, rawHours, rawMinutes, rawMeridiem] = matchedValue;
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return value;
  }

  return `${String(hours).padStart(2, "0")}:${rawMinutes} ${rawMeridiem.toUpperCase()}`;
}

function normalizeClockInput(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const matchedValue = trimmedValue.match(/^(\d{1,2})[:.](\d{2})$/);

  if (!matchedValue) {
    return value;
  }

  const [, rawHours, rawMinutes] = matchedValue;
  const minutes = Number(rawMinutes);

  if (minutes < 0 || minutes > 59) {
    return value;
  }

  return `${String(rawHours).padStart(2, "0")}:${rawMinutes}`;
}

function formatClockInputAsTyped(value) {
  const rawValue = `${value || ""}`;
  const cleanedValue = rawValue.replace(/[^\d:]/g, "");
  const firstColonIndex = cleanedValue.indexOf(":");

  if (firstColonIndex === -1) {
    return cleanedValue.slice(0, 5);
  }

  const hoursPart = cleanedValue.slice(0, firstColonIndex).replace(/:/g, "");
  const minutesPart = cleanedValue.slice(firstColonIndex + 1).replace(/:/g, "");

  if (!hoursPart && !minutesPart) {
    return "";
  }

  return `${hoursPart.slice(0, 2)}:${minutesPart.slice(0, 2)}`;
}

function normalizeStatusValue(value) {
  const trimmedValue = `${value || ""}`.trim();

  if (!trimmedValue) {
    return "0%";
  }

  const matchedValue = trimmedValue.match(/^(\d{1,3})%$/);

  if (!matchedValue) {
    return "0%";
  }

  const percentage = Number(matchedValue[1]);

  if (percentage <= 0) {
    return "0%";
  }

  if (percentage >= 100) {
    return "100%";
  }

  return `${Math.round(percentage / 5) * 5}%`;
}

function createEditableTask(task = {}, overrides = {}) {
  return {
    id: task.id || createTaskId(),
    workreportId: task.workreportId || "",
    taskName: task.taskName || "",
    mainType: task.mainType || "",
    jobNumber: task.jobNumber || "",
    estimatedTime: task.estimatedTime || "00:00",
    actualTime: task.actualTime || "00:00",
    outcome: task.outcome || "",
    status: normalizeStatusValue(task.status),
    isSaved: false,
    isEditing: true,
    isExpanded: true,
    ...overrides,
  };
}

function getTaskSummaryTitle(task) {
  return task.taskName || "Untitled Task";
}

function renderTaskSummaryTime(label, value) {
  return `${label}: ${value || "--"}`;
}

function getTaskStatusTone(statusValue) {
  const percentage = Number.parseInt(`${statusValue || "0"}`, 10);

  return percentage >= 100 ? "complete" : "pending";
}

function getTaskMainTypeLabel(value) {
  if (value === "Invoiceable") {
    return "Inv";
  }

  if (value === "Non Invoiceable") {
    return "Non Inv";
  }

  return value || "No type";
}

function getTaskMainTypeTone(value) {
  if (value === "Non Invoiceable") {
    return "non-invoiceable";
  }

  return "invoiceable";
}

function getTaskJobNumberLabel(value) {
  return value || "No job number";
}

function formatDateDisplayValue(value) {
  if (!value) {
    return "Select date";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  const dateValue = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateValue);
}

function convertNativeTimeToMeridiem(value) {
  const matchedValue = `${value || ""}`.match(/^(\d{2}):(\d{2})$/);

  if (!matchedValue) {
    return {
      time: "",
      meridiem: "AM",
    };
  }

  const hours = Number(matchedValue[1]);
  const minutes = matchedValue[2];
  const meridiem = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return {
    time: `${String(normalizedHours).padStart(2, "0")}:${minutes}`,
    meridiem,
  };
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

function convertNativeTimeToClock(value) {
  const matchedValue = `${value || ""}`.match(/^(\d{2}):(\d{2})$/);

  if (!matchedValue) {
    return "";
  }

  return `${matchedValue[1]}:${matchedValue[2]}`;
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
  className = "",
  disabled = false,
}) {
  return (
    <label
      className={`effismLite-field${className ? ` ${className}` : ""}`}
      htmlFor={id}
    >
      <span className="effismLite-fieldLabel">{label}</span>
      <div className="effismLite-pickerField">
        <span className="effismLite-pickerValue">
          {formatDateDisplayValue(value)}
        </span>

        <span className="effismLite-pickerIcon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 2v4"></path>
            <path d="M16 2v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18"></path>
          </svg>
        </span>

        <input
          id={id}
          className="effismLite-pickerNativeInput"
          type="date"
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={disabled}
        />
      </div>
    </label>
  );
}

function DataListInput({
  id,
  label,
  value,
  onChange,
  list,
  options,
  placeholder,
  className = "",
  disabled = false,
}) {
  return (
    <label
      className={`effismLite-field${className ? ` ${className}` : ""}`}
      htmlFor={id}
    >
      <span className="effismLite-fieldLabel">{label}</span>
      <div className="effismLite-inputWrap">
        <input
          id={id}
          className="effismLite-input effismLite-inputWithHint"
          type="text"
          value={value}
          onChange={onChange}
          list={list}
          placeholder={placeholder}
          disabled={disabled}
        />
        <span className="effismLite-inputGlyph" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </span>
      </div>
      <datalist id={list}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function MeridiemTimeInput({
  id,
  label,
  timeValue,
  meridiemValue,
  onTimeChange,
  onMeridiemChange,
  onBlur,
  className = "",
}) {
  const nativePickerValue = convertMeridiemToNativeTime(
    timeValue,
    meridiemValue,
  );

  const handleNativeTimeChange = (event) => {
    const nextValue = convertNativeTimeToMeridiem(event.target.value);

    onTimeChange({
      target: {
        value: nextValue.time,
      },
    });

    onMeridiemChange({
      target: {
        value: nextValue.meridiem,
      },
    });
  };

  return (
    <div className={`effismLite-field${className ? ` ${className}` : ""}`}>
      <label className="effismLite-fieldLabel" htmlFor={id}>
        {label}
      </label>
      <div className="effismLite-timeControl">
        <div className="effismLite-timeValueWrap">
          <input
            id={id}
            className="effismLite-timeValue"
            type="text"
            inputMode="numeric"
            value={timeValue}
            onChange={onTimeChange}
            onBlur={onBlur}
            placeholder="00:00"
          />
          <div className="effismLite-timePickerTrigger">
            <span className="effismLite-timePickerIcon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v5l3 3"></path>
              </svg>
            </span>
            <input
              className="effismLite-timePickerNativeInput"
              type="time"
              value={nativePickerValue}
              onChange={handleNativeTimeChange}
              aria-label={`${label} time picker`}
            />
          </div>
        </div>
        <select
          className="effismLite-timeMeridiem"
          value={meridiemValue}
          onChange={onMeridiemChange}
          aria-label={`${label} meridiem`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

function ClockPickerField({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder = "00:00",
}) {
  const nativePickerValue = convertNativeTimeToClock(value);

  return (
    <label className="effismLite-field" htmlFor={id}>
      <span className="effismLite-fieldLabel">{label}</span>
      <div className="effismLite-inputWrap">
        <input
          id={id}
          className="effismLite-input effismLite-timeOnlyInput"
          type="text"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
        />
        <div className="effismLite-inputPickerGlyph">
          <span className="effismLite-timePickerIcon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 3"></path>
            </svg>
          </span>
          <input
            className="effismLite-timePickerNativeInput"
            type="time"
            value={nativePickerValue}
            onChange={(event) =>
              onChange({
                target: {
                  value: convertNativeTimeToClock(event.target.value),
                },
              })
            }
            aria-label={`${label} time picker`}
          />
        </div>
      </div>
    </label>
  );
}

export default function EffismLite() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTaskStep = location.pathname.startsWith("/effism-lite/tasks");
  const currentStepPath = isTaskStep ? "/effism-lite/tasks" : "/effism-lite";

  const [jobDetails, setJobDetails] = useState({
    date: "",
    dayType: "",
    daySubtype: "",
    timeIn: "",
    timeInMeridiem: "AM",
    timeOut: "",
    timeOutMeridiem: "PM",
    breakTime: "",
    siteTravel: "",
  });
  const [tasks, setTasks] = useState([]);
  const [timeSaveStatus, setTimeSaveStatus] = useState("idle");
  const [jobDiaryCompleteStatus, setJobDiaryCompleteStatus] = useState("idle");
  const [jobDiaryCompleteMessage, setJobDiaryCompleteMessage] = useState("");
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const hasHydratedTimeRef = useRef(false);
  const autosaveTimerRef = useRef(null);
  const hasUserEditedTimeRef = useRef(false);
  const saveStatusHideTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadTimeData = async () => {
      const lastWorkingDate = await getEffismLiteLastWorkingDate();
      const timeRecord = await getEffismLiteTimeRecord(lastWorkingDate);

      if (!isMounted) {
        return;
      }

      if (timeRecord) {
        const normalizedTimeIn = normalizeApiClockValue(timeRecord.time_in);
        const normalizedTimeOut = normalizeApiClockValue(timeRecord.time_out);
        const timeInValue = convertNativeTimeToMeridiem(normalizedTimeIn);
        const timeOutValue = convertNativeTimeToMeridiem(normalizedTimeOut);

        setJobDetails((currentJobDetails) => ({
          ...currentJobDetails,
          date: `${timeRecord.date_log || lastWorkingDate || ""}`,
          dayType: mapApiWorkStatusToDayType(timeRecord.work_status),
          timeIn: timeInValue.time,
          timeInMeridiem: timeInValue.meridiem,
          timeOut: timeOutValue.time,
          timeOutMeridiem: timeOutValue.meridiem,
          breakTime: normalizeApiClockValue(timeRecord.nwt),
          siteTravel: normalizeApiClockValue(timeRecord.site_travel),
        }));
      } else {
        setJobDetails((currentJobDetails) => ({
          ...currentJobDetails,
          date: lastWorkingDate,
        }));
      }

      if (lastWorkingDate) {
        const jobDiaryStatusResult =
          await getEffismLiteJobDiaryStatus(lastWorkingDate);

        if (jobDiaryStatusResult.isComplete) {
          setJobDiaryCompleteStatus("success");
          setJobDiaryCompleteMessage("Job diary completed.");
        } else if (jobDiaryStatusResult.success) {
          setJobDiaryCompleteStatus("idle");
          setJobDiaryCompleteMessage("");
        }
      }

      hasHydratedTimeRef.current = true;
    };

    loadTimeData();

    return () => {
      isMounted = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      if (saveStatusHideTimerRef.current) {
        clearTimeout(saveStatusHideTimerRef.current);
        saveStatusHideTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedTimeRef.current) {
      return;
    }

    if (!hasUserEditedTimeRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      if (saveStatusHideTimerRef.current) {
        clearTimeout(saveStatusHideTimerRef.current);
        saveStatusHideTimerRef.current = null;
      }

      setTimeSaveStatus("saving");
      saveEffismLiteTimeRecord(jobDetails)
        .then((payload) => {
          setTimeSaveStatus(payload ? "saved" : "error");
        })
        .catch(() => {
          setTimeSaveStatus("error");
        });
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [jobDetails]);

  useEffect(() => {
    if (timeSaveStatus !== "saved" && timeSaveStatus !== "error") {
      return;
    }

    saveStatusHideTimerRef.current = setTimeout(() => {
      setTimeSaveStatus("idle");
      saveStatusHideTimerRef.current = null;
    }, 2500);

    return () => {
      if (saveStatusHideTimerRef.current) {
        clearTimeout(saveStatusHideTimerRef.current);
        saveStatusHideTimerRef.current = null;
      }
    };
  }, [timeSaveStatus]);

  useEffect(() => {
    if (!isTaskStep || !jobDetails.date) {
      return;
    }

    let isMounted = true;

    const loadTasks = async () => {
      const taskList = await listEffismLiteJobs(jobDetails.date);
      if (!isMounted) {
        return;
      }

      setTasks(
        taskList.map((task) =>
          createEditableTask(
            {
              id: task.workreport_id
                ? `effism-lite-task-${task.workreport_id}`
                : createTaskId(),
              workreportId: `${task.workreport_id || ""}`,
              taskName: `${task.taskname || ""}`,
              mainType: mapTaskMainTypeIdToLabel(
                task.main_type ?? task.mian_type,
              ),
              jobNumber: `${task.job_no || ""}`,
              estimatedTime: normalizeApiClockValue(task.est_time),
              actualTime: normalizeApiClockValue(task.act_time),
              outcome: `${task.desc ?? task.description ?? ""}`,
              status: `${task.status ?? 0}%`,
            },
            {
              isSaved: true,
              isEditing: false,
              isExpanded: false,
            },
          ),
        ),
      );
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [isTaskStep, jobDetails.date]);

  const showOffTypeField = jobDetails.dayType === "off";
  const showLeaveTypeField = jobDetails.dayType === "leave";
  const updateJobDetails = (field, value) => {
    hasUserEditedTimeRef.current = true;
    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      [field]: value,
    }));
  };

  const handleJobClockChange = (field, value) => {
    updateJobDetails(field, formatClockInputAsTyped(value));
  };

  const handleJobTimeBlur = (field) => {
    hasUserEditedTimeRef.current = true;
    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      [field]: normalizeClockInput(currentJobDetails[field]),
    }));
  };

  const handleDayTypeChange = (event) => {
    hasUserEditedTimeRef.current = true;
    const nextDayType = event.target.value;
    const shouldResetSubtype =
      nextDayType !== jobDetails.dayType ||
      (nextDayType !== "off" && nextDayType !== "leave");

    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      dayType: nextDayType,
      daySubtype: shouldResetSubtype ? "" : currentJobDetails.daySubtype,
    }));
  };

  const goToStep = (path) => {
    navigate(path);
  };

  const handleComplete = () => {
    if (jobDiaryCompleteStatus === "loading") {
      return;
    }
    setShowCompleteConfirmation(true);
  };

  const handleConfirmComplete = async () => {
    setShowCompleteConfirmation(false);
    setJobDiaryCompleteStatus("loading");
    const result = await completeEffismLiteJobDiary(jobDetails.date);

    if (result.success) {
      setJobDiaryCompleteStatus("success");
      setJobDiaryCompleteMessage("Job diary completed.");
      return;
    }

    setJobDiaryCompleteStatus("error");
    setJobDiaryCompleteMessage(
      result.message || "Failed to complete job diary.",
    );
  };

  const handleCancelComplete = () => {
    setShowCompleteConfirmation(false);
  };

  const handleAddTask = () => {
    const newTask = createEditableTask(undefined, {
      isEditing: true,
      isExpanded: true,
    });

    setTasks((currentTasks) => [
      newTask,
      ...currentTasks.map((task) => ({
        ...task,
        isExpanded: false,
      })),
    ]);
  };

  const updateTask = (taskId, field, value) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: value,
            }
          : task,
      ),
    );
  };

  const handleTaskTimeBlur = (taskId, field) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: normalizeClockInput(task[field]) || "00:00",
            }
          : task,
      ),
    );
  };

  const toggleTaskExpanded = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isExpanded: !task.isExpanded,
            }
          : task,
      ),
    );
  };

  const handleSaveTask = (taskId) => {
    const taskToSave = tasks.find((task) => task.id === taskId);
    if (!taskToSave || !jobDetails.date) {
      return;
    }

    const normalizedTask = {
      ...taskToSave,
      estimatedTime: normalizeClockInput(taskToSave.estimatedTime) || "00:00",
      actualTime: normalizeClockInput(taskToSave.actualTime) || "00:00",
    };

    const saveTask = async () => {
      const payload = normalizedTask.workreportId
        ? await editEffismLiteJob(normalizedTask, jobDetails.date)
        : await addEffismLiteJob(normalizedTask, jobDetails.date);

      if (!payload) {
        return;
      }

      const refreshedTasks = await listEffismLiteJobs(jobDetails.date);
      setTasks(
        refreshedTasks.map((task) =>
          createEditableTask(
            {
              id: task.workreport_id
                ? `effism-lite-task-${task.workreport_id}`
                : createTaskId(),
              workreportId: `${task.workreport_id || ""}`,
              taskName: `${task.taskname || ""}`,
              mainType: mapTaskMainTypeIdToLabel(
                task.main_type ?? task.mian_type,
              ),
              jobNumber: `${task.job_no || ""}`,
              estimatedTime: normalizeApiClockValue(task.est_time),
              actualTime: normalizeApiClockValue(task.act_time),
              outcome: `${task.desc ?? task.description ?? ""}`,
              status: `${task.status ?? 0}%`,
            },
            {
              isSaved: true,
              isEditing: false,
              isExpanded: false,
            },
          ),
        ),
      );
    };

    saveTask();
  };

  const handleEditTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isEditing: true,
              isExpanded: true,
            }
          : task,
      ),
    );
  };

  const handleTaskHeaderKeyDown = (event, taskId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTaskExpanded(taskId);
    }
  };

  return (
    <div className="effismLite-page">
      <div className="effismLite-toolbar">
        <div
          className="effismLite-tabs"
          role="tablist"
          aria-label="EFFISM Lite sections"
        >
          {STEP_CONFIG.map((stepConfig) => {
            const isActive = stepConfig.path === currentStepPath;

            return (
              <button
                key={stepConfig.id}
                type="button"
                className={`effismLite-tab${isActive ? " is-active" : ""}`}
                onClick={() => goToStep(stepConfig.path)}
                role="tab"
                aria-selected={isActive}
              >
                {stepConfig.title}
              </button>
            );
          })}
        </div>

        <div className="effismLite-completeAction">
          <button
            type="button"
            className="effismLite-button effismLite-buttonPrimary effismLite-completeButton"
            onClick={handleComplete}
            disabled={jobDiaryCompleteStatus === "loading"}
            aria-label="Complete effism lite entry"
            title="Complete"
          >
            <svg
              width="16"
              height="16"
              className="effismLite-completeButtonIcon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </div>
      </div>

      {jobDiaryCompleteStatus === "success" ? (
        <div className="effismLite-completeNotice is-success" role="status">
          Job diary completed.
        </div>
      ) : null}

      {jobDiaryCompleteStatus === "error" ? (
        <div className="effismLite-completeNotice is-error" role="alert">
          {jobDiaryCompleteMessage}
        </div>
      ) : null}

      {showCompleteConfirmation ? (
        <div className="effismLite-completeConfirmCard" role="alertdialog">
          <p className="effismLite-completeConfirmText">
            Are you sure you want to complete this job diary?
          </p>
          <div className="effismLite-completeConfirmActions">
            <button
              type="button"
              className="effismLite-button effismLite-buttonGhost"
              onClick={handleCancelComplete}
            >
              Cancel
            </button>
            <button
              type="button"
              className="effismLite-button effismLite-buttonPrimary"
              onClick={handleConfirmComplete}
            >
              Complete
            </button>
          </div>
        </div>
      ) : null}

      {isTaskStep ? (
        <div className="effismLite-taskToolbarRow">
          <div className="effismLite-taskToolbarHeading">
            <h2 className="effismLite-taskToolbarTitle">
              Tasks{" "}
              <span className="effismLite-taskToolbarCount">
                ({tasks.length})
              </span>
            </h2>
          </div>

          <button
            type="button"
            className="effismLite-button effismLite-buttonGhost effismLite-taskToolbarButton"
            onClick={handleAddTask}
          >
            <span
              className="effismLite-taskToolbarButtonIcon"
              aria-hidden="true"
            >
              +
            </span>
            Add Task
          </button>
        </div>
      ) : null}

      {isTaskStep ? (
        <section className="effismLite-panelTasks">
          <div className="effismLite-taskStack">
            {tasks.map((task) => (
              <article
                key={task.id}
                className={`effismLite-taskCard${task.isExpanded ? " is-expanded" : ""}${task.isEditing ? " is-editing" : ""}`}
              >
                <div
                  className="effismLite-taskHeader"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleTaskExpanded(task.id)}
                  onKeyDown={(event) => handleTaskHeaderKeyDown(event, task.id)}
                  aria-expanded={task.isExpanded}
                >
                  <div className="effismLite-taskHeaderMain">
                    <div className="effismLite-taskHeaderTop">
                      <span
                        className={`effismLite-taskTypePill is-${getTaskMainTypeTone(task.mainType)}`}
                      >
                        {getTaskMainTypeLabel(task.mainType)}
                      </span>

                      <div className="effismLite-taskHeaderActions">
                        <button
                          type="button"
                          className={`effismLite-taskIconButton${task.isEditing ? " is-active" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (task.isEditing) {
                              handleSaveTask(task.id);
                              return;
                            }

                            handleEditTask(task.id);
                          }}
                          aria-label={
                            task.isEditing
                              ? `Save ${getTaskSummaryTitle(task)}`
                              : `Edit ${getTaskSummaryTitle(task)}`
                          }
                          title={task.isEditing ? "Save task" : "Edit task"}
                        >
                          {task.isEditing ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <path d="M17 21v-8H7v8" />
                              <path d="M7 3v5h8" />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="m3 21 3.8-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L3 21Z" />
                              <path d="m12.5 5.5 3 3" />
                            </svg>
                          )}
                        </button>

                        <button
                          type="button"
                          className="effismLite-taskIconButton effismLite-taskChevron"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleTaskExpanded(task.id);
                          }}
                          aria-label={
                            task.isExpanded ? "Collapse task" : "Expand task"
                          }
                          aria-expanded={task.isExpanded}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <h4 className="effismLite-taskTitle">
                      {getTaskSummaryTitle(task)}
                    </h4>

                    <span className="effismLite-taskJobNumber">
                      {getTaskJobNumberLabel(task.jobNumber)}
                    </span>

                    <div className="effismLite-taskSummary">
                      <span className="effismLite-taskSummaryItem">
                        {renderTaskSummaryTime("Est ", task.estimatedTime)}
                      </span>
                      <span className="effismLite-taskSummaryItem">
                        {renderTaskSummaryTime("Act ", task.actualTime)}
                      </span>
                      <span
                        className={`effismLite-taskSummaryItem effismLite-taskStatusPill is-${getTaskStatusTone(task.status)}`}
                      >
                        {normalizeStatusValue(task.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {task.isExpanded ? (
                  <div className="effismLite-taskBody">
                    <div className="effismLite-taskFields">
                      <label
                        className="effismLite-field effismLite-fieldWide"
                        htmlFor={`task-name-${task.id}`}
                      >
                        <span className="effismLite-fieldLabel">Task Name</span>
                        <input
                          id={`task-name-${task.id}`}
                          className="effismLite-input"
                          type="text"
                          value={task.taskName}
                          onChange={(event) =>
                            updateTask(task.id, "taskName", event.target.value)
                          }
                          placeholder="Enter task name"
                          disabled={!task.isEditing}
                        />
                      </label>

                      <DataListInput
                        id={`task-main-type-${task.id}`}
                        label="Main Type"
                        value={task.mainType}
                        onChange={(event) =>
                          updateTask(task.id, "mainType", event.target.value)
                        }
                        list={`effism-lite-main-type-options-${task.id}`}
                        options={MAIN_TYPE_OPTIONS}
                        placeholder="Select or type a main type"
                        disabled={!task.isEditing}
                      />

                      <DataListInput
                        id={`task-job-number-${task.id}`}
                        label="Job Number"
                        value={task.jobNumber}
                        onChange={(event) =>
                          updateTask(task.id, "jobNumber", event.target.value)
                        }
                        list={`effism-lite-job-number-options-${task.id}`}
                        options={JOB_NUMBER_OPTIONS}
                        placeholder="Select or type a job number"
                        disabled={!task.isEditing}
                      />

                      <div className="effismLite-taskTimeRow effismLite-fieldWide">
                        <label
                          className="effismLite-field"
                          htmlFor={`task-estimated-time-${task.id}`}
                        >
                          <span className="effismLite-fieldLabel">
                            Estimated Time
                          </span>
                          <input
                            id={`task-estimated-time-${task.id}`}
                            className="effismLite-input"
                            type="text"
                            inputMode="text"
                            value={task.estimatedTime}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "estimatedTime",
                                event.target.value,
                              )
                            }
                            onBlur={() =>
                              handleTaskTimeBlur(task.id, "estimatedTime")
                            }
                            placeholder="00:00"
                            disabled={!task.isEditing}
                          />
                        </label>

                        <label
                          className="effismLite-field"
                          htmlFor={`task-actual-time-${task.id}`}
                        >
                          <span className="effismLite-fieldLabel">
                            Actual Time
                          </span>
                          <input
                            id={`task-actual-time-${task.id}`}
                            className="effismLite-input"
                            type="text"
                            inputMode="text"
                            value={task.actualTime}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "actualTime",
                                event.target.value,
                              )
                            }
                            onBlur={() =>
                              handleTaskTimeBlur(task.id, "actualTime")
                            }
                            placeholder="00:00"
                            disabled={!task.isEditing}
                          />
                        </label>
                      </div>

                      <label
                        className="effismLite-field effismLite-fieldWide"
                        htmlFor={`task-outcome-${task.id}`}
                      >
                        <span className="effismLite-fieldLabel">Outcome</span>
                        <textarea
                          id={`task-outcome-${task.id}`}
                          className="effismLite-input effismLite-textarea"
                          value={task.outcome}
                          onChange={(event) =>
                            updateTask(task.id, "outcome", event.target.value)
                          }
                          placeholder="Describe the outcome"
                          disabled={!task.isEditing}
                        />
                      </label>

                      <label
                        className="effismLite-field"
                        htmlFor={`task-status-${task.id}`}
                      >
                        <span className="effismLite-fieldLabel">Status</span>
                        <select
                          id={`task-status-${task.id}`}
                          className="effismLite-input effismLite-select"
                          value={task.status}
                          onChange={(event) =>
                            updateTask(
                              task.id,
                              "status",
                              normalizeStatusValue(event.target.value),
                            )
                          }
                          disabled={!task.isEditing}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="effismLite-taskActions">
                      {task.isEditing ? (
                        <button
                          type="button"
                          className="effismLite-button effismLite-buttonPrimary"
                          onClick={() => handleSaveTask(task.id)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="effismLite-button effismLite-buttonGhost"
                          onClick={() => handleEditTask(task.id)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="effismLite-panel">
          {timeSaveStatus !== "idle" ? (
            <div className="effismLite-saveStatusWrap" aria-live="polite">
              <span
                className={`effismLite-saveStatusPill is-${timeSaveStatus}`}
                role="status"
              >
                {timeSaveStatus === "saving"
                  ? "Saving..."
                  : timeSaveStatus === "saved"
                    ? "Saved"
                    : "Save failed"}
              </span>
            </div>
          ) : null}

          <div className="effismLite-formGrid">
            <DatePickerField
              id="effism-lite-date"
              className="effismLite-fieldWide"
              label="Date"
              value={jobDetails.date}
              onChange={() => {}}
              disabled
            />

            <label
              className="effismLite-field effismLite-fieldWide"
              htmlFor="effism-lite-day-type"
            >
              <span className="effismLite-fieldLabel">Day Type</span>
              <select
                id="effism-lite-day-type"
                className="effismLite-input effismLite-select"
                value={jobDetails.dayType}
                onChange={handleDayTypeChange}
              >
                <option value="">Select day type</option>
                {NON_EFFISM_DAY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {showOffTypeField ? (
              <label
                className="effismLite-field effismLite-fieldWide"
                htmlFor="effism-lite-off-type"
              >
                <span className="effismLite-fieldLabel">OFF Type</span>
                <select
                  id="effism-lite-off-type"
                  className="effismLite-input effismLite-select"
                  value={jobDetails.daySubtype}
                  onChange={(event) =>
                    updateJobDetails("daySubtype", event.target.value)
                  }
                >
                  <option value="">Select</option>
                  {OFF_DAY_SUBTYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {showLeaveTypeField ? (
              <label
                className="effismLite-field effismLite-fieldWide"
                htmlFor="effism-lite-leave-type"
              >
                <span className="effismLite-fieldLabel">Leave Type</span>
                <select
                  id="effism-lite-leave-type"
                  className="effismLite-input effismLite-select"
                  value={jobDetails.daySubtype}
                  onChange={(event) =>
                    updateJobDetails("daySubtype", event.target.value)
                  }
                >
                  <option value="">Select</option>
                  {LEAVE_DAY_SUBTYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <MeridiemTimeInput
              id="effism-lite-time-in"
              className="effismLite-fieldWide"
              label="Time In"
              timeValue={jobDetails.timeIn}
              meridiemValue={jobDetails.timeInMeridiem}
              onTimeChange={(event) =>
                handleJobClockChange("timeIn", event.target.value)
              }
              onMeridiemChange={(event) =>
                updateJobDetails("timeInMeridiem", event.target.value)
              }
              onBlur={() => handleJobTimeBlur("timeIn")}
            />

            <MeridiemTimeInput
              id="effism-lite-time-out"
              className="effismLite-fieldWide"
              label="Time Out"
              timeValue={jobDetails.timeOut}
              meridiemValue={jobDetails.timeOutMeridiem}
              onTimeChange={(event) =>
                handleJobClockChange("timeOut", event.target.value)
              }
              onMeridiemChange={(event) =>
                updateJobDetails("timeOutMeridiem", event.target.value)
              }
              onBlur={() => handleJobTimeBlur("timeOut")}
            />

            <div className="effismLite-formRow effismLite-fieldWide">
              <ClockPickerField
                id="effism-lite-break"
                label="Break"
                value={jobDetails.breakTime}
                onChange={(event) =>
                  handleJobClockChange("breakTime", event.target.value)
                }
                onBlur={() => handleJobTimeBlur("breakTime")}
              />

              <ClockPickerField
                id="effism-lite-site-travel"
                label="Site Travel"
                value={jobDetails.siteTravel}
                onChange={(event) =>
                  handleJobClockChange("siteTravel", event.target.value)
                }
                onBlur={() => handleJobTimeBlur("siteTravel")}
              />
            </div>

            {/* <div className="effismLite-formActions effismLite-fieldWide">
              <button
                type="button"
                className="effismLite-button effismLite-buttonSoftAction"
                onClick={handleComplete}
                disabled={jobDiaryCompleteStatus === "loading"}
              >
                Complete
              </button>
            </div> */}
          </div>
        </section>
      )}
    </div>
  );
}
