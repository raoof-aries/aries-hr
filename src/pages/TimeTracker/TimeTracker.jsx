import { useEffect, useState } from "react";
import {
  createTaskId,
  formatDateDisplayValue,
  normalizeClockInput,
  formatClockInputAsTyped,
} from "../EffismLite/utils/effismLiteUtils";
import DatePickerField from "../EffismLite/components/DatePickerField/DatePickerField";
import ClockPickerField from "../EffismLite/components/ClockPickerField/ClockPickerField";
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

  useEffect(() => {
    if (!date) return;
    const loadTasks = () => {
      setIsLoading(true);
      try {
        const allData = JSON.parse(localStorage.getItem("timeTracker_data_v1")) || {};
        const dayTasks = allData[date] || [];
        setTasks(dayTasks.map(t => ({ ...t, isEditing: false })));
      } catch (e) {
        console.error("Failed to load tasks", e);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [date]);

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
      isSaved: false,
    };
    setTasks([newTask, ...tasks]);
  };

  const updateTask = (taskId, field, value) => {
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const toggleEditTask = (taskId) => {
    setTasks((current) => {
      const task = current.find(t => t.id === taskId);
      if (task && !task.isSaved && task.isEditing) {
        return current.filter(t => t.id !== taskId);
      }
      return current.map((t) =>
        t.id === taskId ? { ...t, isEditing: !t.isEditing } : t
      );
    });
  };

  const saveTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.taskName.trim()) {
      alert("Task name is required.");
      return;
    }

    const normalizedTask = {
      ...task,
      estimatedTime: normalizeClockInput(task.estimatedTime) || "00:00",
      actualTime: normalizeClockInput(task.actualTime) || "00:00",
      isEditing: false,
      isSaved: true,
    };

    const updatedTasks = tasks.map((t) => (t.id === taskId ? normalizedTask : t));
    setTasks(updatedTasks);

    const allData = JSON.parse(localStorage.getItem("timeTracker_data_v1")) || {};
    const tasksToSave = updatedTasks.filter((t) => t.isSaved).map((t) => ({ ...t, isEditing: false }));
    allData[date] = tasksToSave;
    localStorage.setItem("timeTracker_data_v1", JSON.stringify(allData));
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
          {completeStatus === "loading" ? "..." : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </button>
      </div>

      {completeStatus === "success" && (
        <div className="timeTracker-notice is-success">{completeMessage}</div>
      )}
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
              className={`timeTracker-taskCard ${task.isEditing ? "is-editing" : ""}`}
            >
              <div className="timeTracker-taskHeader" onClick={() => !task.isEditing && toggleEditTask(task.id)}>
                {task.isEditing ? (
                  <div className="timeTracker-taskHeaderEdit">
                    <button
                      type="button"
                      className="timeTracker-taskIconButton"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleEditTask(task.id);
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
                      className="timeTracker-taskIconButton is-active"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveTask(task.id);
                      }}
                      title="Save task"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <path d="M17 21v-8H7v8" />
                        <path d="M7 3v5h8" />
                      </svg>
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
                            toggleEditTask(task.id);
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
                          title="Expand task"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
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
                          <span className="timeTracker-summaryTimeValue">{task.estimatedTime}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {task.isEditing && (
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
                      <span className="timeTracker-fieldLabel">Job Number</span>
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
                      label="Time"
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
                    >
                      Save
                    </button>
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
