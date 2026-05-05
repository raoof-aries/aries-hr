import { useEffect, useState } from "react";
import {
  createTaskId,
  formatDateDisplayValue,
  normalizeClockInput,
  formatClockInputAsTyped,
} from "../EffismLite/utils/effismLiteUtils";
import DatePickerField from "../EffismLite/components/DatePickerField/DatePickerField";
import ClockPickerField from "../EffismLite/components/ClockPickerField/ClockPickerField";
import {
  completeTimeTrackerJobDiary,
  getTimeTrackerDayData,
  getTimeTrackerJobDiaryStatus,
  getTimeTrackerLastWorkingDate,
  saveTimeTrackerJob,
} from "../../services/timeTrackerService";
import "./TimeTracker.css";

function getTodayDateValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function TimeTracker() {
  const [date, setDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completeStatus, setCompleteStatus] = useState("idle");
  const [completeMessage, setCompleteMessage] = useState("");
  const [showCompleteConfirmation, setShowCompleteConfirmation] =
    useState(false);
  const wait = (duration) =>
    new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  const isDiaryComplete = completeStatus === "success";

  useEffect(() => {
    let isMounted = true;

    const loadInitialDate = async () => {
      setIsLoading(true);
      const lastWorkingDate = await getTimeTrackerLastWorkingDate();

      if (isMounted) {
        setDate(lastWorkingDate || getTodayDateValue());
      }
    };

    loadInitialDate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!date) return;
    let isMounted = true;

    const loadTasks = async () => {
      setIsLoading(true);

      try {
        const [result, jobDiaryStatusResult] = await Promise.all([
          getTimeTrackerDayData(date),
          getTimeTrackerJobDiaryStatus(date),
        ]);

        if (!isMounted) {
          return;
        }

        if (result.success) {
          setTasks(result.jobs);
          setSummaryMetrics(result.summaryMetrics);
          if (jobDiaryStatusResult.isComplete) {
            setCompleteStatus("success");
            setCompleteMessage("Job diary completed.");
          } else if (jobDiaryStatusResult.success) {
            setCompleteStatus("idle");
            setCompleteMessage("");
          } else {
            setCompleteStatus("error");
            setCompleteMessage(
              jobDiaryStatusResult.message || "Could not load job diary status.",
            );
          }
        } else {
          setTasks([]);
          setSummaryMetrics(null);
          setCompleteStatus("error");
          setCompleteMessage(result.message || "Could not load tasks.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [date]);

  const refreshTasks = async () => {
    const result = await getTimeTrackerDayData(date);

    if (result.success) {
      setTasks(result.jobs);
      setSummaryMetrics(result.summaryMetrics);
      return;
    }

    setCompleteStatus("error");
    setCompleteMessage(result.message || "Could not refresh tasks.");
  };

  const setTaskSaveState = (taskId, state) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...state } : task)),
    );
  };

  const getTaskValidationMessage = (task) => {
    if (!date) {
      return "Date is required.";
    }

    if (!`${task.taskName || ""}`.trim()) {
      return "Task name is required.";
    }

    if (!`${task.jobNumber || ""}`.trim()) {
      return "Job number is required.";
    }

    if (!normalizeClockInput(task.estimatedTime)) {
      return "Time is required.";
    }

    return "";
  };

  const handleComplete = () => {
    if (completeStatus === "loading" || isDiaryComplete) return;
    setShowCompleteConfirmation(true);
  };

  const handleConfirmComplete = async () => {
    setShowCompleteConfirmation(false);
    setCompleteStatus("loading");
    setCompleteMessage("");

    const result = await completeTimeTrackerJobDiary(date);

    if (result.success) {
      setCompleteStatus("success");
      setCompleteMessage(result.message || "Job diary completed successfully.");
      await refreshTasks();
      return;
    }

    setCompleteStatus("error");
    setCompleteMessage(result.message || "Failed to complete job diary.");
  };

  const handleCancelComplete = () => {
    setShowCompleteConfirmation(false);
  };

  const handleAddTask = () => {
    if (isDiaryComplete) {
      return;
    }

    const newTask = {
      id: createTaskId(),
      workreportId: "",
      taskName: "",
      jobNumber: "",
      mainType: "",
      estimatedTime: "",
      actualTime: "",
      outcome: "",
      isEditing: true,
      isExpanded: true,
      isSaved: false,
      isSaving: false,
      saveStatus: "idle",
      saveError: "",
    };
    setTasks([newTask, ...tasks]);
  };

  const topMetrics = [
    {
      label: "Jobs",
      value: summaryMetrics?.jobCount || "0",
    },
    {
      label: "Total Time",
      value: summaryMetrics?.totalJob || "00:00",
    },
    {
      label: "Net Time",
      value: summaryMetrics?.netTime || "00:00",
    },
  ];

  const updateTask = (taskId, field, value) => {
    if (isDiaryComplete) {
      return;
    }

    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? { ...t, [field]: value, saveStatus: "idle", saveError: "" }
          : t,
      )
    );
  };

  const toggleTaskExpanded = (taskId) => {
    setTasks((current) => {
      const task = current.find(t => t.id === taskId);
      if (task && !task.isSaved && task.isExpanded) {
        return current.filter(t => t.id !== taskId);
      }
      const shouldExpand = task ? !task.isExpanded : true;
      return current.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isExpanded: shouldExpand,
              isEditing: shouldExpand ? t.isEditing : false,
              saveStatus: "idle",
              saveError: "",
            }
          : t
      );
    });
  };

  const editTask = (taskId) => {
    if (isDiaryComplete) {
      return;
    }

    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isEditing: true,
              isExpanded: true,
              saveStatus: "idle",
              saveError: "",
            }
          : t,
      ),
    );
  };

  const saveTask = async (taskId) => {
    if (isDiaryComplete) {
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.isSaving) return;

    const validationMessage = getTaskValidationMessage(task);
    if (validationMessage) {
      setTaskSaveState(taskId, { saveError: validationMessage });
      return;
    }

    const normalizedTask = {
      ...task,
      estimatedTime: normalizeClockInput(task.estimatedTime) || "00:00",
      actualTime: normalizeClockInput(task.estimatedTime) || "00:00",
    };

    setTaskSaveState(taskId, {
      isSaving: true,
      saveStatus: "saving",
      saveError: "",
    });

    const result = await saveTimeTrackerJob(normalizedTask, date);

    if (!result.success) {
      setTaskSaveState(taskId, {
        isSaving: false,
        saveStatus: "idle",
        saveError: result.message || "Could not save this task.",
      });
      return;
    }

    setTaskSaveState(taskId, {
      ...normalizedTask,
      isEditing: true,
      isExpanded: true,
      isSaved: true,
      isSaving: false,
      saveStatus: "saved",
      saveError: "",
    });

    await wait(900);
    setTaskSaveState(taskId, {
      isEditing: false,
      isExpanded: false,
      saveStatus: "idle",
    });
    await refreshTasks();
  };

  return (
    <div className="timeTracker-page">
      <div className="timeTracker-toolbar">
        <div className="timeTracker-datePicker timeTracker-hideDateLabel">
          <DatePickerField
            id="time-tracker-date"
            label="Date"
            value={date}
            formatDisplayValue={formatDateDisplayValue}
            onChange={(e) => {
              setIsLoading(true);
              setDate(e.target.value);
              setCompleteStatus("idle");
              setCompleteMessage("");
            }}
          />
        </div>
        <button
          type="button"
          className={`timeTracker-completeButton${isDiaryComplete ? " is-complete" : ""}`}
          onClick={handleComplete}
          disabled={completeStatus === "loading" || isDiaryComplete}
          title={isDiaryComplete ? "Completed" : "Complete Entry"}
        >
          {completeStatus === "loading" ? (
            <span className="timeTracker-spinner" aria-hidden="true" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </button>
      </div>

      {isLoading ? (
        <div
          className="timeTracker-loader"
          role="status"
          aria-live="polite"
        >
          <span className="timeTracker-spinner" aria-hidden="true" />
        </div>
      ) : null}

      {!isLoading && completeStatus === "error" && (
        <div className="timeTracker-notice is-error">{completeMessage}</div>
      )}

      {!isLoading && completeStatus === "success" && (
        <div className="timeTracker-notice is-success">{completeMessage}</div>
      )}

      {showCompleteConfirmation ? (
        <div className="timeTracker-completeConfirmCard" role="alertdialog">
          <p className="timeTracker-completeConfirmText">
            Are you sure you want to complete this job diary?
          </p>
          <div className="timeTracker-completeConfirmActions">
            <button
              type="button"
              className="timeTracker-confirmButton timeTracker-confirmButtonGhost"
              onClick={handleCancelComplete}
            >
              No
            </button>
            <button
              type="button"
              className="timeTracker-confirmButton timeTracker-confirmButtonPrimary"
              onClick={handleConfirmComplete}
            >
              Yes
            </button>
          </div>
        </div>
      ) : null}

      {!isLoading ? (
        <>
          <div className="timeTracker-taskToolbarRow">
            <h2 className="timeTracker-taskToolbarTitle">Tasks ({tasks.length})</h2>
            <button
              type="button"
            className="timeTracker-taskToolbarButton"
            onClick={handleAddTask}
            disabled={isDiaryComplete}
          >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
              Add Task
            </button>
          </div>

          <section
            className="timeTracker-taskMetricsContainer"
            aria-label="Time tracker summary"
          >
            <div className="timeTracker-taskMetricsRow">
              {topMetrics.map((metric) => (
                <article
                  key={metric.label}
                  className="timeTracker-taskMetricCard"
                >
                  <span className="timeTracker-taskMetricLabel">
                    {metric.label}
                  </span>
                  <strong className="timeTracker-taskMetricValue">
                    {metric.value}
                  </strong>
                </article>
              ))}
            </div>
          </section>

          <div className="timeTracker-panelTasks">
            {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
            No tasks found for this date.
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              className={`timeTracker-taskCard ${task.isExpanded ? "is-expanded" : ""} ${task.isEditing ? "is-editing" : ""}`}
            >
              <div className="timeTracker-taskHeader" onClick={() => toggleTaskExpanded(task.id)}>
                {task.isEditing ? (
                  <div className="timeTracker-taskHeaderEdit">
                    <button
                      type="button"
                      className="timeTracker-taskIconButton"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTaskExpanded(task.id);
                      }}
                      title="Cancel"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <div className="timeTracker-taskHeaderCenter">
                      <span className="timeTracker-taskNumber">{index + 1}</span>
                    </div>
                    <button
                      type="button"
                      className={`timeTracker-taskIconButton is-active${task.saveStatus === "saved" ? " is-saved" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        saveTask(task.id);
                      }}
                      title="Save task"
                      disabled={task.isSaving}
                    >
                      {task.saveStatus === "saving" ? (
                        <span className="timeTracker-spinner timeTracker-spinnerSmall" aria-hidden="true" />
                      ) : task.saveStatus === "saved" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <path d="M17 21v-8H7v8" />
                          <path d="M7 3v5h8" />
                        </svg>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="timeTracker-taskHeaderContent">
                    <div className="timeTracker-taskHeaderTop">
                      <div className="timeTracker-taskHeaderMeta">
                        <span className="timeTracker-taskNumber">{index + 1}</span>
                      </div>
                      <div className="timeTracker-taskActions">
                        <button
                          type="button"
                          className="timeTracker-taskIconButton"
                          onClick={(event) => {
                            event.stopPropagation();
                            editTask(task.id);
                          }}
                          title="Edit task"
                          disabled={isDiaryComplete}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m3 21 3.8-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L3 21Z" />
                            <path d="m12.5 5.5 3 3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="timeTracker-taskIconButton"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleTaskExpanded(task.id);
                          }}
                          title={task.isExpanded ? "Collapse task" : "Expand task"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {task.isExpanded ? (
                              <polyline points="18 15 12 9 6 15"></polyline>
                            ) : (
                              <polyline points="9 18 15 12 9 6"></polyline>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {!task.isExpanded && (
                      <>
                        <h3 className="timeTracker-taskTitle">
                          {task.taskName || "Untitled Task"}
                        </h3>

                        <div className="timeTracker-taskSummaryMetrics">
                          {task.jobNumber && (
                            <div className="timeTracker-taskJobNumber">
                              {task.jobNumber}
                            </div>
                          )}

                          {task.estimatedTime && (
                            <span className="timeTracker-summaryTimeItem">
                              <span className="timeTracker-summaryTimeValue">
                                {task.estimatedTime}
                              </span>
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {task.isExpanded && !task.isEditing && (
                <div className="timeTracker-taskBody">
                  <div className="timeTracker-readOnlyGrid">
                    <article className="timeTracker-readOnlyItem">
                      <span className="timeTracker-fieldLabel">Task Name</span>
                      <strong>{task.taskName || "Untitled Task"}</strong>
                    </article>
                    <article className="timeTracker-readOnlyItem">
                      <span className="timeTracker-fieldLabel">Job Number</span>
                      <strong>{task.jobNumber || "-"}</strong>
                    </article>
                    <article className="timeTracker-readOnlyItem">
                      <span className="timeTracker-fieldLabel">Time</span>
                      <strong>{task.estimatedTime || "00:00"}</strong>
                    </article>
                    <article className="timeTracker-readOnlyItem timeTracker-fieldWide">
                      <span className="timeTracker-fieldLabel">Outcome</span>
                      <strong>{task.outcome || "-"}</strong>
                    </article>
                  </div>
                </div>
              )}

              {task.isExpanded && task.isEditing && (
                <div className="timeTracker-taskBody">
                  <div className="timeTracker-formGrid">
                    <label className="timeTracker-fieldWide">
                      <span className="timeTracker-fieldLabel">Task Name *</span>
                      <input
                        type="text"
                        className="timeTracker-input"
                        value={task.taskName}
                        onChange={(e) => updateTask(task.id, "taskName", e.target.value)}
                        placeholder="Enter task name"
                        disabled={isDiaryComplete}
                      />
                    </label>

                    <label className="timeTracker-fieldWide">
                      <span className="timeTracker-fieldLabel">Job Number *</span>
                      <input
                        type="text"
                        className="timeTracker-input"
                        value={task.jobNumber}
                        onChange={(e) => updateTask(task.id, "jobNumber", e.target.value)}
                        placeholder="e.g. 12345"
                        disabled={isDiaryComplete}
                      />
                    </label>

                    <ClockPickerField
                      className="timeTracker-fieldWide"
                      id={`time-tracker-clock-${task.id}`}
                      label="Time *"
                      value={task.estimatedTime}
                      onChange={(e) => updateTask(task.id, "estimatedTime", e.target.value)}
                      onBlur={() => {}}
                      formatClockInputAsTyped={formatClockInputAsTyped}
                      normalizeClockInput={normalizeClockInput}
                      placeholder="00:00"
                      disabled={isDiaryComplete}
                    />

                    <label className="timeTracker-fieldWide">
                      <span className="timeTracker-fieldLabel">Outcome</span>
                      <input
                        type="text"
                        className="timeTracker-input"
                        value={task.outcome}
                        onChange={(e) => updateTask(task.id, "outcome", e.target.value)}
                        placeholder="Describe the outcome..."
                        disabled={isDiaryComplete}
                      />
                    </label>
                  </div>
                  <div className="timeTracker-taskActionsBottom">
                    <button
                      type="button"
                      className="timeTracker-buttonPrimary"
                      onClick={() => saveTask(task.id)}
                      disabled={task.isSaving || isDiaryComplete}
                    >
                      {task.isSaving ? (
                        <>
                          <span className="timeTracker-spinner timeTracker-spinnerOnButton" aria-hidden="true" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    {task.saveError && (
                      <div className="timeTracker-taskError">{task.saveError}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
