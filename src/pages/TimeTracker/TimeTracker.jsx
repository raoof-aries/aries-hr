import { useEffect, useState } from "react";
import {
  addEffismLiteJob,
  completeEffismLiteJobDiary,
  editEffismLiteJob,
  listEffismLiteJobs,
  listEffismLiteMainTypes,
} from "../../services/effismLiteService";
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
  const [mainTypes, setMainTypes] = useState([]);
  const [completeStatus, setCompleteStatus] = useState("idle");
  const [completeMessage, setCompleteMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadTypes = async () => {
      const types = await listEffismLiteMainTypes();
      if (isMounted) {
        setMainTypes(types);
      }
    };
    loadTypes();
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
        const taskList = await listEffismLiteJobs(date);
        if (!isMounted) return;
        
        // Normalize tasks
        const normalizedTasks = Array.isArray(taskList) ? taskList.map((t) => ({
          id: `time-tracker-task-${t.workreport_id || t.id}`,
          workreportId: t.workreport_id,
          taskName: t.taskname || t.job_name || "",
          jobNumber: t.job_no || "",
          mainType: t.main_type_name || t.main_type || "",
          estimatedTime: t.est_time || "00:00",
          actualTime: t.act_time || "00:00",
          outcome: t.desc || t.description || t.remarks || "",
          isEditing: false,
          isSaved: true,
        })) : [];
        
        setTasks(normalizedTasks);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadTasks();
    return () => {
      isMounted = false;
    };
  }, [date]);

  const handleComplete = async () => {
    if (completeStatus === "loading") return;
    setCompleteStatus("loading");
    const result = await completeEffismLiteJobDiary(date);
    if (result.success) {
      setCompleteStatus("success");
      setCompleteMessage("Job diary completed successfully.");
    } else {
      setCompleteStatus("error");
      setCompleteMessage(result.message || "Failed to complete job diary.");
    }
  };

  const handleAddTask = () => {
    const newTask = {
      id: createTaskId(),
      workreportId: "",
      taskName: "",
      jobNumber: "",
      mainType: mainTypes.length > 0 ? mainTypes[0].label : "",
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
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId ? { ...t, isEditing: !t.isEditing } : t
      )
    );
  };

  const saveTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // ensure time is formatted
    const normalizedTask = {
      ...task,
      estimatedTime: normalizeClockInput(task.estimatedTime) || "00:00",
      actualTime: normalizeClockInput(task.actualTime) || "00:00",
    };

    updateTask(taskId, "estimatedTime", normalizedTask.estimatedTime);
    updateTask(taskId, "actualTime", normalizedTask.actualTime);

    // If mainType is missing, default to the first available one to satisfy API
    if (!normalizedTask.mainType && mainTypes.length > 0) {
      normalizedTask.mainType = mainTypes[0].label;
    }

    let payload;
    if (normalizedTask.workreportId) {
      payload = await editEffismLiteJob(normalizedTask, date);
    } else {
      payload = await addEffismLiteJob(normalizedTask, date);
    }

    if (payload) {
      // Reload tasks after save to get the new workreportId
      const taskList = await listEffismLiteJobs(date);
      const normalizedTasks = Array.isArray(taskList) ? taskList.map((t) => ({
        id: `time-tracker-task-${t.workreport_id || t.id}`,
        workreportId: t.workreport_id,
        taskName: t.taskname || t.job_name || "",
        jobNumber: t.job_no || "",
        mainType: t.main_type_name || t.main_type || "",
        estimatedTime: t.est_time || "00:00",
        actualTime: t.act_time || "00:00",
        outcome: t.desc || t.description || t.remarks || "",
        isEditing: false,
        isSaved: true,
      })) : [];
      setTasks(normalizedTasks);
    } else {
      alert("Failed to save task. Please ensure all required fields are filled.");
    }
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
              <div className="timeTracker-taskHeader">
                <div className="timeTracker-taskHeaderMain" onClick={() => !task.isEditing && toggleEditTask(task.id)}>
                  <h3 className="timeTracker-taskTitle">
                    {task.taskName || "Untitled Task"}
                  </h3>
                  {!task.isEditing && (
                    <div className="timeTracker-taskMeta">
                      {task.jobNumber && <span>Job: {task.jobNumber}</span>}
                      {task.estimatedTime && <span>Time: {task.estimatedTime}</span>}
                    </div>
                  )}
                </div>
                <div className="timeTracker-taskActions">
                  <button
                    type="button"
                    className={`timeTracker-taskIconButton${task.isEditing ? " is-active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (task.isEditing) {
                        saveTask(task.id);
                      } else {
                        toggleEditTask(task.id);
                      }
                    }}
                    title={task.isEditing ? "Save task" : "Edit task"}
                  >
                    {task.isEditing ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <path d="M17 21v-8H7v8" />
                        <path d="M7 3v5h8" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m3 21 3.8-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L3 21Z" />
                        <path d="m12.5 5.5 3 3" />
                      </svg>
                    )}
                  </button>
                </div>
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
