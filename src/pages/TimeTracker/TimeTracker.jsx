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
  addTimeTrackerJob,
  editTimeTrackerJob,
  listTimeTrackerJobs,
} from "../../services/timeTrackerService";
import "./TimeTracker.css";

export default function TimeTracker() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completeStatus, setCompleteStatus] = useState("idle");
  const [completeMessage, setCompleteMessage] = useState("");
  const wait = (duration) =>
    new Promise((resolve) => {
      setTimeout(resolve, duration);
    });

  useEffect(() => {
    if (!date) return;
    let isMounted = true;

    const loadTasks = async () => {
      setIsLoading(true);

      const result = await listTimeTrackerJobs(date);

      if (!isMounted) {
        return;
      }

      if (result.success) {
        setTasks(result.jobs);
        setCompleteStatus("idle");
        setCompleteMessage("");
      } else {
        setTasks([]);
        setCompleteStatus("error");
        setCompleteMessage(result.message || "Could not load tasks.");
      }

      setIsLoading(false);
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [date]);

  const refreshTasks = async () => {
    const result = await listTimeTrackerJobs(date);

    if (result.success) {
      setTasks(result.jobs);
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
    if (completeStatus === "loading") return;
    setCompleteStatus("loading");
    setTimeout(() => {
      setCompleteStatus("success");
      setCompleteMessage("Job diary completed successfully.");
    }, 500);
  };

  const handleAddTask = () => {
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

  const updateTask = (taskId, field, value) => {
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

    const result = normalizedTask.workreportId
      ? await editTimeTrackerJob(normalizedTask, date)
      : await addTimeTrackerJob(normalizedTask, date);

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
              setDate(e.target.value);
              setCompleteStatus("idle");
              setCompleteMessage("");
            }}
          />
        </div>
        <button
          type="button"
          className="timeTracker-completeButton"
          onClick={handleComplete}
          disabled={completeStatus === "loading"}
          title="Complete Entry"
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

      {completeStatus === "error" && (
        <div className="timeTracker-notice is-error">{completeMessage}</div>
      )}

      <div className="timeTracker-taskToolbarRow">
        <h2 className="timeTracker-taskToolbarTitle">Tasks ({tasks.length})</h2>
        <button
          type="button"
          className="timeTracker-taskToolbarButton"
          onClick={handleAddTask}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          Add Task
        </button>
      </div>

      <div className="timeTracker-panelTasks">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
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
                    />

                    <label className="timeTracker-fieldWide">
                      <span className="timeTracker-fieldLabel">Outcome</span>
                      <input
                        type="text"
                        className="timeTracker-input"
                        value={task.outcome}
                        onChange={(e) => updateTask(task.id, "outcome", e.target.value)}
                        placeholder="Describe the outcome..."
                      />
                    </label>
                  </div>
                  <div className="timeTracker-taskActionsBottom">
                    <button
                      type="button"
                      className="timeTracker-buttonPrimary"
                      onClick={() => saveTask(task.id)}
                      disabled={task.isSaving}
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
    </div>
  );
}
