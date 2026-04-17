import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LEAVE_DAY_SUBTYPE_OPTIONS,
  NON_EFFISM_DAY_TYPE_OPTIONS,
  OFF_DAY_SUBTYPE_OPTIONS,
} from "../../data/attendanceOptions";
import mockTasks from "../../data/effismLiteMockTasks.json";
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
    // path: "/",
  },
];

function getTodayDateInputValue() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    taskName: task.taskName || "",
    mainType: task.mainType || "",
    jobNumber: task.jobNumber || "",
    estimatedTime: task.estimatedTime || "",
    actualTime: task.actualTime || "",
    outcome: task.outcome || "",
    status: normalizeStatusValue(task.status),
    isSaved: false,
    isEditing: true,
    isExpanded: false,
    ...overrides,
  };
}

function getInitialTasks() {
  return mockTasks.map((task) =>
    createEditableTask(task, {
      isSaved: true,
      isEditing: false,
      isExpanded: false,
    }),
  );
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

function getTaskJobNumberLabel(value) {
  return value || "No job number";
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
}) {
  return (
    <label className="effismLite-field" htmlFor={id}>
      <span className="effismLite-fieldLabel">{label}</span>
      <div className="effismLite-timeControl">
        <input
          id={id}
          className="effismLite-timeValue"
          type="text"
          inputMode="text"
          value={timeValue}
          onChange={onTimeChange}
          onBlur={onBlur}
          placeholder="00:00"
        />
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
    </label>
  );
}

export default function EffismLite() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTaskStep = location.pathname.startsWith("/effism-lite/tasks");
  const currentStepPath = isTaskStep ? "/effism-lite/tasks" : "/effism-lite";

  const [jobDetails, setJobDetails] = useState({
    date: getTodayDateInputValue(),
    dayType: "",
    daySubtype: "",
    timeIn: "",
    timeInMeridiem: "AM",
    timeOut: "",
    timeOutMeridiem: "PM",
    breakTime: "",
    siteTravel: "",
  });
  const [tasks, setTasks] = useState(getInitialTasks);
  const showOffTypeField = jobDetails.dayType === "off";
  const showLeaveTypeField = jobDetails.dayType === "leave";
  const updateJobDetails = (field, value) => {
    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      [field]: value,
    }));
  };

  const handleJobTimeBlur = (field) => {
    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      [field]: normalizeClockInput(currentJobDetails[field]),
    }));
  };

  const handleDayTypeChange = (event) => {
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

  const handleAddTask = () => {
    const newTask = createEditableTask();

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
              [field]: normalizeMeridiemTime(task[field]),
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
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              estimatedTime: normalizeMeridiemTime(task.estimatedTime),
              actualTime: normalizeMeridiemTime(task.actualTime),
              isSaved: true,
              isEditing: false,
            }
          : task,
      ),
    );
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
      </div>

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
                <button
                  type="button"
                  className="effismLite-taskHeader"
                  onClick={() => toggleTaskExpanded(task.id)}
                  aria-expanded={task.isExpanded}
                >
                  <div className="effismLite-taskHeaderMain">
                    <div className="effismLite-taskHeaderTop">
                      <span className="effismLite-taskTypePill">
                        {getTaskMainTypeLabel(task.mainType)}
                      </span>

                      <span
                        className="effismLite-taskChevron"
                        aria-hidden="true"
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
                        >
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </span>
                    </div>

                    <h4 className="effismLite-taskTitle">
                      {getTaskSummaryTitle(task)}
                    </h4>

                    <span className="effismLite-taskJobNumber">
                      {getTaskJobNumberLabel(task.jobNumber)}
                    </span>

                    <div className="effismLite-taskSummary">
                      <span className="effismLite-taskSummaryItem">
                        {renderTaskSummaryTime("Est.", task.estimatedTime)}
                      </span>
                      <span className="effismLite-taskSummaryItem">
                        {renderTaskSummaryTime("Act", task.actualTime)}
                      </span>
                      <span
                        className={`effismLite-taskSummaryItem effismLite-taskStatusPill is-${getTaskStatusTone(task.status)}`}
                      >
                        {normalizeStatusValue(task.status)}
                      </span>
                    </div>
                  </div>
                </button>

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
                            placeholder="09:30 AM"
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
                            placeholder="10:00 AM"
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
          <div className="effismLite-formGrid">
            <label
              className="effismLite-field effismLite-fieldWide"
              htmlFor="effism-lite-date"
            >
              <span className="effismLite-fieldLabel">Date</span>
              <input
                id="effism-lite-date"
                className="effismLite-input"
                type="date"
                value={jobDetails.date}
                onChange={(event) =>
                  updateJobDetails("date", event.target.value)
                }
              />
            </label>

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
              label="Time In"
              timeValue={jobDetails.timeIn}
              meridiemValue={jobDetails.timeInMeridiem}
              onTimeChange={(event) =>
                updateJobDetails("timeIn", event.target.value)
              }
              onMeridiemChange={(event) =>
                updateJobDetails("timeInMeridiem", event.target.value)
              }
              onBlur={() => handleJobTimeBlur("timeIn")}
            />

            <MeridiemTimeInput
              id="effism-lite-time-out"
              label="Time Out"
              timeValue={jobDetails.timeOut}
              meridiemValue={jobDetails.timeOutMeridiem}
              onTimeChange={(event) =>
                updateJobDetails("timeOut", event.target.value)
              }
              onMeridiemChange={(event) =>
                updateJobDetails("timeOutMeridiem", event.target.value)
              }
              onBlur={() => handleJobTimeBlur("timeOut")}
            />

            <label className="effismLite-field" htmlFor="effism-lite-break">
              <span className="effismLite-fieldLabel">Break</span>
              <input
                id="effism-lite-break"
                className="effismLite-input"
                type="text"
                inputMode="text"
                value={jobDetails.breakTime}
                onChange={(event) =>
                  updateJobDetails("breakTime", event.target.value)
                }
                placeholder="00:00"
              />
            </label>

            <label
              className="effismLite-field"
              htmlFor="effism-lite-site-travel"
            >
              <span className="effismLite-fieldLabel">Site Travel</span>
              <input
                id="effism-lite-site-travel"
                className="effismLite-input"
                type="text"
                inputMode="text"
                value={jobDetails.siteTravel}
                onChange={(event) =>
                  updateJobDetails("siteTravel", event.target.value)
                }
                placeholder="00:00"
              />
            </label>
          </div>
        </section>
      )}
    </div>
  );
}
