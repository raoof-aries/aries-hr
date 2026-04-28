import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LEAVE_DAY_SUBTYPE_OPTIONS,
  NON_EFFISM_DAY_TYPE_OPTIONS,
  OFF_DAY_SUBTYPE_OPTIONS,
} from "../../data/attendanceOptions";
import {
  addEffismLiteJob,
  completeEffismLiteJobDiary,
  editEffismLiteCFJob,
  editEffismLiteDelegatedJob,
  editEffismLiteJob,
  editEffismLiteRoutineJob,
  getEffismLiteJobDiaryStatus,
  getEffismLiteJobDiarySummary,
  getEffismLiteLastWorkingDate,
  getEffismLiteTimeRecord,
  listEffismLiteDayLeaveTypes,
  listEffismLiteDayTypes,
  listEffismLiteMainTypes,
  listEffismLiteJobs,
  listEffismLiteSubTypes,
  mapTaskMainTypeIdToLabel,
  mapTaskSubTypeIdToLabel,
  mapApiWorkStatusToDayType,
  normalizeApiClockValue,
  saveEffismLiteTimeRecord,
} from "../../services/effismLiteService";
import ClockPickerField from "./components/ClockPickerField/ClockPickerField";
import DatePickerField from "./components/DatePickerField/DatePickerField";
import EffismLiteDropdown from "./components/EffismLiteDropdown/EffismLiteDropdown";
import EffismLiteSearchableCombo from "./components/EffismLiteSearchableCombo/EffismLiteSearchableCombo";
import MeridiemTimeInput from "./components/MeridiemTimeInput/MeridiemTimeInput";
import {
  convertNativeTimeToMeridiem,
  createTaskId,
  createEditableTask,
  formatClockInputAsTyped,
  formatDateDisplayValue,
  formatMinutesToClock,
  getTaskComparableSnapshot,
  getTaskJobNumberLabel,
  getTaskMainTypeLabel,
  getTaskMainTypeTone,
  getTaskStatusTone,
  getTaskSummaryTitle,
  isEmptyDraftTask,
  mapTaskErrorsFromPayload,
  normalizeApiDateValue,
  normalizeClockInput,
  normalizeStatusValue,
  parseClockValueToMinutes,
  renderTaskSummaryTime,
} from "./utils/effismLiteUtils";
import "./EffismLite.css";

const FALLBACK_MAIN_TYPE_OPTIONS = ["Invoiceable", "Non Invoiceable"];

const JOB_NUMBER_OPTIONS = [
  "AES/Website/Plex/Ariesplex",
  "Effism/2020/ESOL/EFFISM",
  "AES/JN/2022/BIZEVENTS",
  "ESOL/AMR/WEBS/24",
];

const TASK_CATEGORY = {
  JOB: "job",
  ROUTINE: "routine",
  CF: "cf",
  DELEGATED: "delegated",
};

const TASK_SECTION_CONFIG = [
  {
    category: TASK_CATEGORY.ROUTINE,
    title: "Routine Jobs",
  },
  {
    category: TASK_CATEGORY.CF,
    title: "CF Jobs",
  },
  {
    category: TASK_CATEGORY.DELEGATED,
    title: "Delegated Jobs",
  },
  {
    category: TASK_CATEGORY.JOB,
    title: "Today",
  },
];

const TASK_CATEGORY_LABELS = {
  [TASK_CATEGORY.ROUTINE]: "Routine",
  [TASK_CATEGORY.CF]: "CF",
  [TASK_CATEGORY.DELEGATED]: "Delegate",
};

const TASK_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: TASK_CATEGORY.JOB, label: "Today" },
  { value: TASK_CATEGORY.ROUTINE, label: "Routine" },
  { value: TASK_CATEGORY.CF, label: "CF" },
  { value: TASK_CATEGORY.DELEGATED, label: "Delegate" },
];

function getTaskCategoryLabel(category) {
  return TASK_CATEGORY_LABELS[category] || "";
}

function normalizeTaskListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map((task) => ({ task, category: TASK_CATEGORY.JOB }));
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  return [
    ...(Array.isArray(payload.routineJobs)
      ? payload.routineJobs.map((task) => ({
          task,
          category: TASK_CATEGORY.ROUTINE,
        }))
      : []),
    ...(Array.isArray(payload.cfJobs)
      ? payload.cfJobs.map((task) => ({ task, category: TASK_CATEGORY.CF }))
      : []),
    ...(Array.isArray(payload.delegatedJobs)
      ? payload.delegatedJobs.map((task) => ({
          task,
          category: TASK_CATEGORY.DELEGATED,
        }))
      : []),
    ...(Array.isArray(payload.jobs)
      ? payload.jobs.map((task) => ({ task, category: TASK_CATEGORY.JOB }))
      : []),
  ];
}

const DAY_TYPE_SELECT_OPTIONS = [
  { value: "", label: "Select day type" },
  ...NON_EFFISM_DAY_TYPE_OPTIONS,
];

const TIME_LOG_EXTRA_FIELDS = [
  { field: "workHome", label: "Work Home" },
  { field: "night", label: "Night" },
  { field: "health", label: "Health" },
  { field: "family", label: "Family" },
  { field: "friends", label: "Friends" },
  { field: "sleep", label: "Sleep" },
  { field: "travel", label: "Travel" },
];

const OFF_SUBTYPE_SELECT_OPTIONS = [
  { value: "", label: "Select" },
  ...OFF_DAY_SUBTYPE_OPTIONS,
];

const LEAVE_SUBTYPE_SELECT_OPTIONS = [
  { value: "", label: "Select" },
  ...LEAVE_DAY_SUBTYPE_OPTIONS,
];

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


export default function EffismLite() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTaskStep = location.pathname.startsWith("/effism-lite/tasks");
  const currentStepPath = isTaskStep ? "/effism-lite/tasks" : "/effism-lite";

  const [jobDetails, setJobDetails] = useState({
    date: "",
    dayType: "",
    daySubtype: "",
    timeIn: "00:00",
    timeInMeridiem: "AM",
    timeOut: "00:00",
    timeOutMeridiem: "PM",
    breakTime: "",
    siteTravel: "",
    workHome: "",
    night: "",
    health: "",
    family: "",
    friends: "",
    sleep: "",
    travel: "",
  });
  const [tasks, setTasks] = useState([]);
  const [taskMainTypeOptions, setTaskMainTypeOptions] = useState(
    FALLBACK_MAIN_TYPE_OPTIONS,
  );
  const [taskSubTypeOptions, setTaskSubTypeOptions] = useState([]);
  const [dayTypeOptions, setDayTypeOptions] = useState(DAY_TYPE_SELECT_OPTIONS);
  const [offSubtypeOptions, setOffSubtypeOptions] = useState(
    OFF_SUBTYPE_SELECT_OPTIONS,
  );
  const [leaveSubtypeOptions, setLeaveSubtypeOptions] = useState(
    LEAVE_SUBTYPE_SELECT_OPTIONS,
  );
  const [isTimeLogLoading, setIsTimeLogLoading] = useState(true);
  const [isTaskListLoading, setIsTaskListLoading] = useState(false);
  const [timeSaveStatus, setTimeSaveStatus] = useState("idle");
  const [jobDiaryCompleteStatus, setJobDiaryCompleteStatus] = useState("idle");
  const [jobDiaryCompleteMessage, setJobDiaryCompleteMessage] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [taskErrorsByWorkreportId, setTaskErrorsByWorkreportId] = useState(new Map());
  const [taskSummaryMetrics, setTaskSummaryMetrics] = useState(null);
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const hasHydratedTimeRef = useRef(false);
  const loadedTaskDateRef = useRef("");
  const autosaveTimerRef = useRef(null);
  const hasUserEditedTimeRef = useRef(false);
  const saveStatusHideTimerRef = useRef(null);

  // Initial load: hydrate date/time details and completion status.
  useEffect(() => {
    let isMounted = true;

    const loadTimeData = async () => {
      setIsTimeLogLoading(true);
      try {
        const lastWorkingDate = await getEffismLiteLastWorkingDate();
        const timeRecord = await getEffismLiteTimeRecord(lastWorkingDate);

        if (!isMounted) {
          return;
        }

        if (timeRecord) {
          const normalizedTimeIn = normalizeApiClockValue(timeRecord.time_in);
          const normalizedTimeOut = normalizeApiClockValue(timeRecord.time_out);
          const timeInValue =
            normalizedTimeIn && normalizedTimeIn !== "00:00"
              ? convertNativeTimeToMeridiem(normalizedTimeIn)
              : { time: "00:00", meridiem: "AM" };
          const timeOutValue =
            normalizedTimeOut && normalizedTimeOut !== "00:00"
              ? convertNativeTimeToMeridiem(normalizedTimeOut)
              : { time: "00:00", meridiem: "PM" };

          setJobDetails((currentJobDetails) => ({
            ...currentJobDetails,
            date: `${timeRecord.date_log || lastWorkingDate || ""}`,
            dayType: mapApiWorkStatusToDayType(timeRecord.work_status),
            daySubtype: `${timeRecord.leave_type_name ?? timeRecord.leave_type ?? ""}`,
            timeIn: timeInValue.time,
            timeInMeridiem: timeInValue.meridiem,
            timeOut: timeOutValue.time,
            timeOutMeridiem: timeOutValue.meridiem,
            breakTime: normalizeApiClockValue(timeRecord.nwt),
            siteTravel: normalizeApiClockValue(timeRecord.site_travel),
            workHome: normalizeApiClockValue(timeRecord.home ?? timeRecord.work_home),
            night: normalizeApiClockValue(timeRecord.night),
            health: normalizeApiClockValue(timeRecord.health),
            family: normalizeApiClockValue(timeRecord.family),
            friends: normalizeApiClockValue(timeRecord.friend ?? timeRecord.friends),
            sleep: normalizeApiClockValue(timeRecord.sleep),
            travel: normalizeApiClockValue(timeRecord.travel),
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
      } finally {
        if (isMounted) {
          setIsTimeLogLoading(false);
        }
        hasHydratedTimeRef.current = true;
      }
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

  // Load day type dropdown options from API, with local fallbacks kept for offline/dev.
  useEffect(() => {
    let isMounted = true;

    const loadDayTypeOptions = async () => {
      const options = await listEffismLiteDayTypes();

      if (isMounted && options.length > 0) {
        setDayTypeOptions([{ value: "", label: "Select day type" }, ...options]);
      }
    };

    loadDayTypeOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load subtype options only when the selected day type needs the second API.
  useEffect(() => {
    if (jobDetails.dayType !== "off" && jobDetails.dayType !== "leave") {
      return;
    }

    let isMounted = true;

    const loadDaySubtypeOptions = async () => {
      const options = await listEffismLiteDayLeaveTypes(jobDetails.dayType);

      if (!isMounted || options.length === 0) {
        return;
      }

      const selectOptions = [{ value: "", label: "Select" }, ...options];

      if (jobDetails.dayType === "off") {
        setOffSubtypeOptions(selectOptions);
      } else {
        setLeaveSubtypeOptions(selectOptions);
      }
    };

    loadDaySubtypeOptions();

    return () => {
      isMounted = false;
    };
  }, [jobDetails.dayType]);

  // Load task type dropdown options once.
  useEffect(() => {
    let isMounted = true;

    const loadTaskTypeOptions = async () => {
      const [mainTypeOptions, subTypeOptions] = await Promise.all([
        listEffismLiteMainTypes(),
        listEffismLiteSubTypes(),
      ]);

      if (!isMounted) {
        return;
      }

      if (mainTypeOptions.length > 0) {
        setTaskMainTypeOptions(mainTypeOptions.map((item) => item.label));
      }

      if (subTypeOptions.length > 0) {
        setTaskSubTypeOptions(subTypeOptions.map((item) => item.label));
      }
    };

    loadTaskTypeOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Autosave time-log edits after a short debounce.
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

  // Hide transient save badge after success/error feedback.
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

  // Load tasks + summary whenever user enters task step for a new date.
  useEffect(() => {
    if (!isTaskStep || !jobDetails.date) {
      return;
    }

    if (loadedTaskDateRef.current === jobDetails.date) {
      return;
    }

    let isMounted = true;

    const loadTasks = async () => {
      setIsTaskListLoading(true);
      try {
        const [taskList, summaryMetrics] = await Promise.all([
          listEffismLiteJobs(jobDetails.date),
          getEffismLiteJobDiarySummary(jobDetails.date),
        ]);
        if (!isMounted) {
          return;
        }

        setTasks(
          normalizeTaskListPayload(taskList).map(mapApiTaskToEditableTask),
        );
        setTaskSummaryMetrics(summaryMetrics);
        loadedTaskDateRef.current = jobDetails.date;
      } finally {
        if (isMounted) {
          setIsTaskListLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [isTaskStep, jobDetails.date]);

  // Refresh summary metrics after diary completion.
  useEffect(() => {
    if (jobDiaryCompleteStatus !== "success" || !jobDetails.date) {
      return;
    }

    let isMounted = true;

    const loadSummaryMetrics = async () => {
      const summaryMetrics = await getEffismLiteJobDiarySummary(jobDetails.date);
      if (isMounted) {
        setTaskSummaryMetrics(summaryMetrics);
      }
    };

    loadSummaryMetrics();

    return () => {
      isMounted = false;
    };
  }, [jobDiaryCompleteStatus, jobDetails.date]);

  // Clear generic error state when no task-level API errors remain.
  useEffect(() => {
    if (jobDiaryCompleteStatus !== "error") {
      return;
    }

    if (taskErrorsByWorkreportId.size > 0) {
      return;
    }

    setJobDiaryCompleteStatus("idle");
    setJobDiaryCompleteMessage("");
  }, [jobDiaryCompleteStatus, taskErrorsByWorkreportId]);

  // Derived screen mode flags.
  const showOffTypeField = jobDetails.dayType === "off";
  const showLeaveTypeField = jobDetails.dayType === "leave";
  const isSummaryMode = jobDiaryCompleteStatus === "success";
  const selectedDayTypeLabel =
    dayTypeOptions.find((option) => option.value === jobDetails.dayType)?.label ||
    jobDetails.dayType ||
    "-";
  const selectedDaySubtypeLabel =
    (jobDetails.dayType === "off"
      ? offSubtypeOptions
      : leaveSubtypeOptions
    ).find((option) => option.value === jobDetails.daySubtype)?.label ||
    jobDetails.daySubtype ||
    "-";

  const mapApiTaskToEditableTask = ({ task, category }) => {
    const isRoutineTask = category === TASK_CATEGORY.ROUTINE;
    const workreportId = `${task.workreport_id || ""}`;
    const routineJobId = `${task.id || ""}`;
    const taskIdSource = isRoutineTask ? routineJobId : workreportId;
    const taskIdPrefix = isRoutineTask
      ? "effism-lite-routine-task"
      : `effism-lite-${category}-task`;

    return createEditableTask(
      {
        id: taskIdSource ? `${taskIdPrefix}-${taskIdSource}` : createTaskId(),
        jobCategory: category,
        routineJobId,
        workreportId,
        taskName: `${task.taskname ?? task.job_name ?? ""}`,
        mainType: mapTaskMainTypeIdToLabel(task.main_type ?? task.mian_type) ||
          `${task.main_type_name ?? ""}`,
        subType:
          `${task.job_type_name ?? task.sub_type_name ?? task.sub_type ?? ""}`.trim() ||
          mapTaskSubTypeIdToLabel(
            task.sub_type ?? task.subtype ?? task.job_type ?? task.job_type_id,
          ),
        jobNumber: `${task.job_no || ""}`,
        estimatedTime: normalizeApiClockValue(task.est_time),
        actualTime: normalizeApiClockValue(task.act_time),
        outcome: `${task.desc ?? task.description ?? task.remarks ?? ""}`,
        status: `${task.status ?? 0}%`,
        cfDate: normalizeApiDateValue(task.cf_date ?? task.cf),
        targetDate: normalizeApiDateValue(task.target_date ?? task.target),
      },
      {
        isSaved: true,
        isEditing: false,
        isExpanded: false,
      },
    );
  };

  // Generic job-details updater with autosave tracking.
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

  // Normalize clock text when user leaves time input.
  const handleJobTimeBlur = (field) => {
    hasUserEditedTimeRef.current = true;
    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      [field]: normalizeClockInput(currentJobDetails[field]),
    }));
  };

  const handleDayTypeChange = (nextDayType) => {
    hasUserEditedTimeRef.current = true;
    const shouldResetSubtype =
      nextDayType !== jobDetails.dayType ||
      (nextDayType !== "off" && nextDayType !== "leave");

    setJobDetails((currentJobDetails) => ({
      ...currentJobDetails,
      dayType: nextDayType,
      daySubtype: shouldResetSubtype ? "" : currentJobDetails.daySubtype,
    }));
  };

  // Switch date context and rehydrate time-log data for selected date.
  const handleTimeLogDateChange = async (event) => {
    const nextDate = `${event?.target?.value || ""}`.trim();
    if (!nextDate || nextDate === jobDetails.date) {
      return;
    }

    setIsTimeLogLoading(true);
    setTaskErrorsByWorkreportId(new Map());

    try {
      const [timeRecord, jobDiaryStatusResult] = await Promise.all([
        getEffismLiteTimeRecord(nextDate),
        getEffismLiteJobDiaryStatus(nextDate),
      ]);

      hasUserEditedTimeRef.current = false;

      if (timeRecord) {
        const normalizedTimeIn = normalizeApiClockValue(timeRecord.time_in);
        const normalizedTimeOut = normalizeApiClockValue(timeRecord.time_out);
        const timeInValue =
          normalizedTimeIn && normalizedTimeIn !== "00:00"
            ? convertNativeTimeToMeridiem(normalizedTimeIn)
            : { time: "00:00", meridiem: "AM" };
        const timeOutValue =
          normalizedTimeOut && normalizedTimeOut !== "00:00"
            ? convertNativeTimeToMeridiem(normalizedTimeOut)
            : { time: "00:00", meridiem: "PM" };

        setJobDetails((currentJobDetails) => ({
          ...currentJobDetails,
          date: nextDate,
          dayType: mapApiWorkStatusToDayType(timeRecord.work_status),
          daySubtype: `${timeRecord.leave_type_name ?? timeRecord.leave_type ?? ""}`,
          timeIn: timeInValue.time,
          timeInMeridiem: timeInValue.meridiem,
          timeOut: timeOutValue.time,
          timeOutMeridiem: timeOutValue.meridiem,
          breakTime: normalizeApiClockValue(timeRecord.nwt),
          siteTravel: normalizeApiClockValue(timeRecord.site_travel),
          workHome: normalizeApiClockValue(timeRecord.home ?? timeRecord.work_home),
          night: normalizeApiClockValue(timeRecord.night),
          health: normalizeApiClockValue(timeRecord.health),
          family: normalizeApiClockValue(timeRecord.family),
          friends: normalizeApiClockValue(timeRecord.friend ?? timeRecord.friends),
          sleep: normalizeApiClockValue(timeRecord.sleep),
          travel: normalizeApiClockValue(timeRecord.travel),
        }));
      } else {
        setJobDetails((currentJobDetails) => ({
          ...currentJobDetails,
          date: nextDate,
          dayType: "",
          daySubtype: "",
          timeIn: "00:00",
          timeInMeridiem: "AM",
          timeOut: "00:00",
          timeOutMeridiem: "PM",
          breakTime: "",
          siteTravel: "",
          workHome: "",
          night: "",
          health: "",
          family: "",
          friends: "",
          sleep: "",
          travel: "",
        }));
      }

      if (jobDiaryStatusResult.isComplete) {
        setJobDiaryCompleteStatus("success");
        setJobDiaryCompleteMessage("Job diary completed.");
      } else if (jobDiaryStatusResult.success) {
        setJobDiaryCompleteStatus("idle");
        setJobDiaryCompleteMessage("");
      }

      loadedTaskDateRef.current = "";
    } finally {
      setIsTimeLogLoading(false);
    }
  };

  const goToStep = (path) => {
    navigate(path);
  };

  // Completion flow handlers (confirm/cancel/submit).
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
      setTaskErrorsByWorkreportId(new Map());
      return;
    }

    setJobDiaryCompleteStatus("error");
    setJobDiaryCompleteMessage(
      result.message || "Failed to complete job diary.",
    );
    setTaskErrorsByWorkreportId(mapTaskErrorsFromPayload(result.payload));
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

  // Task-level edit/update helpers.
  const updateTask = (taskId, field, value) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              [field]: value,
              saveError: "",
              isDirty: task.isEditing
                ? getTaskComparableSnapshot({ ...task, [field]: value }) !==
                  task.editSnapshot
                : false,
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
    setTasks((currentTasks) => {
      const task = currentTasks.find((t) => t.id === taskId);

      if (task && task.isExpanded && isEmptyDraftTask(task)) {
        return currentTasks.filter((t) => t.id !== taskId);
      }

      const shouldExpand = task ? !task.isExpanded : true;

      return currentTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isExpanded: shouldExpand,
            isEditing:
              !shouldExpand && t.isSaved && t.isEditing && !t.isDirty
                ? false
                : t.isEditing,
            isDirty:
              !shouldExpand && t.isSaved && t.isEditing && !t.isDirty
                ? false
                : t.isDirty,
          };
        }

        if (shouldExpand) {
          return {
            ...t,
            isExpanded: false,
          };
        }

        return t;
      });
    });
  };

  // Persist a task (create or update), then refresh list from API.
  const handleSaveTask = async (taskId) => {
    const taskToSave = tasks.find((task) => task.id === taskId);
    if (!taskToSave || !jobDetails.date) {
      return;
    }

    const normalizedTask = {
      ...taskToSave,
      estimatedTime: normalizeClockInput(taskToSave.estimatedTime) || "00:00",
      actualTime: normalizeClockInput(taskToSave.actualTime) || "00:00",
    };

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, isSaving: true, saveError: "" }
          : task,
      ),
    );

    let payload = null;
    if (normalizedTask.jobCategory === TASK_CATEGORY.ROUTINE) {
      payload = await editEffismLiteRoutineJob(normalizedTask, jobDetails.date);
    } else if (normalizedTask.jobCategory === TASK_CATEGORY.CF) {
      payload = await editEffismLiteCFJob(normalizedTask, jobDetails.date);
    } else if (normalizedTask.jobCategory === TASK_CATEGORY.DELEGATED) {
      payload = await editEffismLiteDelegatedJob(normalizedTask, jobDetails.date);
    } else {
      payload = normalizedTask.workreportId
        ? await editEffismLiteJob(normalizedTask, jobDetails.date)
        : await addEffismLiteJob(normalizedTask, jobDetails.date);
    }

    if (!payload) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                isSaving: false,
                saveError:
                  "Could not save this task. Please check required fields and try again.",
              }
            : task,
        ),
      );
      return;
    }

    // Collapse immediately so it feels responsive.
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isSaving: false,
              isSaved: true,
              isEditing: false,
              isExpanded: false,
              saveError: "",
              isDirty: false,
              editSnapshot: getTaskComparableSnapshot(task),
            }
          : task,
      ),
    );

    const savedWorkreportId = `${taskToSave.workreportId || ""}`.trim();
    if (savedWorkreportId) {
      setTaskErrorsByWorkreportId((currentErrors) => {
        if (!currentErrors.has(savedWorkreportId)) {
          return currentErrors;
        }

        const nextErrors = new Map(currentErrors);
        nextErrors.delete(savedWorkreportId);
        return nextErrors;
      });
    }

    const [refreshedTasksResult, refreshedSummaryMetricsResult] =
      await Promise.allSettled([
        listEffismLiteJobs(jobDetails.date),
        getEffismLiteJobDiarySummary(jobDetails.date),
      ]);

    if (refreshedTasksResult.status === "fulfilled") {
      setTasks(
        normalizeTaskListPayload(refreshedTasksResult.value).map(
          mapApiTaskToEditableTask,
        ),
      );
    }

    if (refreshedSummaryMetricsResult.status === "fulfilled") {
      setTaskSummaryMetrics(refreshedSummaryMetricsResult.value);
    }
  };

  const handleEditTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isEditing: true,
              isExpanded: true,
              isDirty: false,
              editSnapshot: getTaskComparableSnapshot(task),
            }
          : {
              ...task,
              isExpanded: false,
            },
      ),
    );
  };

  // Accessibility: support Enter/Space on clickable task headers.
  const handleTaskHeaderKeyDown = (event, taskId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTaskExpanded(taskId);
    }
  };

  // Compute stable task numbering (saved first, drafts after).
  const taskDisplayNumberById = useMemo(() => {
    const savedIdsInOrder = tasks.filter((task) => task.isSaved).map((task) => task.id);
    const draftIdsInOrder = tasks.filter((task) => !task.isSaved).map((task) => task.id);
    const savedCount = savedIdsInOrder.length;
    const result = new Map();

    savedIdsInOrder.forEach((id, index) => {
      result.set(id, index + 1);
    });

    draftIdsInOrder.forEach((id, index) => {
      result.set(id, savedCount + index + 1);
    });

    return result;
  }, [tasks]);

  const taskSections = useMemo(
    () =>
      TASK_SECTION_CONFIG.map((section) => ({
        ...section,
        tasks: tasks.filter((task) => task.jobCategory === section.category),
      })).filter((section) => section.tasks.length > 0),
    [tasks],
  );

  const filteredTaskSections = useMemo(
    () =>
      taskFilter === "all"
        ? taskSections
        : taskSections.filter((section) => section.category === taskFilter),
    [taskFilter, taskSections],
  );

  const filteredTaskCount = useMemo(
    () =>
      filteredTaskSections.reduce(
        (total, section) => total + section.tasks.length,
        0,
      ),
    [filteredTaskSections],
  );

  // Top-level task metrics cards.
  const taskTopMetrics = useMemo(() => {
    const totalEstimatedMinutes = tasks.reduce(
      (total, task) => total + parseClockValueToMinutes(task.estimatedTime),
      0,
    );
    const totalActualMinutes = tasks.reduce(
      (total, task) => total + parseClockValueToMinutes(task.actualTime),
      0,
    );
    const fallbackTotalAct = formatMinutesToClock(totalActualMinutes);
    const fallbackTotalEst = formatMinutesToClock(totalEstimatedMinutes);

    return [
      {
        label: "Total Est",
        value: taskSummaryMetrics?.totalEst || fallbackTotalEst,
      },
      {
        label: "Total Act",
        value: taskSummaryMetrics?.totalAct || fallbackTotalAct,
      },
      {
        label: "Net Time",
        value: taskSummaryMetrics?.netTime || "--:--",
      },
    ];
  }, [tasks, taskSummaryMetrics]);

  // Aggregate task completion progress.
  const overallTaskProgress = useMemo(() => {
    if (!tasks.length) {
      return {
        percentage: 0,
        completedCount: 0,
        totalCount: 0,
      };
    }

    const completedCount = tasks.filter(
      (task) => Number.parseInt(normalizeStatusValue(task.status), 10) >= 100,
    ).length;
    const totalStatus = tasks.reduce(
      (sum, task) => sum + Number.parseInt(normalizeStatusValue(task.status), 10),
      0,
    );

    return {
      percentage: Math.round(totalStatus / tasks.length),
      completedCount,
      totalCount: tasks.length,
    };
  }, [tasks]);

  // Time-log summary metrics used by summary view.
  const timeLogMetrics = useMemo(() => {
    const metrics = [
      { label: "Date", value: formatDateDisplayValue(jobDetails.date) },
      { label: "Day Type", value: selectedDayTypeLabel },
      {
        label: "Duty Start",
        value: `${jobDetails.timeIn || "--:--"} ${jobDetails.timeInMeridiem || "AM"}`,
      },
      {
        label: "Duty End",
        value: `${jobDetails.timeOut || "--:--"} ${jobDetails.timeOutMeridiem || "PM"}`,
      },
      { label: "Break", value: jobDetails.breakTime || "--:--" },
      { label: "Site Travel", value: jobDetails.siteTravel || "--:--" },
      ...TIME_LOG_EXTRA_FIELDS.map((fieldConfig) => ({
        label: fieldConfig.label,
        value: jobDetails[fieldConfig.field] || "--:--",
      })),
    ];

    if (jobDetails.dayType === "off" || jobDetails.dayType === "leave") {
      metrics.push({
        label: jobDetails.dayType === "off" ? "OFF Type" : "Leave Type",
        value: selectedDaySubtypeLabel,
      });
    }

    if (isSummaryMode) {
      metrics.push(
        { label: "Net Time", value: taskSummaryMetrics?.netTime || "--:--" },
        { label: "Total Est", value: taskSummaryMetrics?.totalEst || "--:--" },
        { label: "Total Act", value: taskSummaryMetrics?.totalAct || "--:--" },
      );
    }

    return metrics;
  }, [isSummaryMode, jobDetails, selectedDaySubtypeLabel, selectedDayTypeLabel, taskSummaryMetrics]);

  return (
    <div className="effismLite-page">
      {/* Top navigation and completion action */}
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

      {jobDiaryCompleteStatus === "success" && !isSummaryMode ? (
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
        <>
          {/* Completion confirmation prompt */}
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
        </>
      ) : null}

      {isTaskStep ? (
        <>
          {/* Task section header and add-task action */}
          <div className="effismLite-taskToolbarRow">
          <div className="effismLite-taskToolbarHeading">
            <h2 className="effismLite-taskToolbarTitle">
              Tasks{" "}
              <span className="effismLite-taskToolbarCount">
                ({taskFilter === "all" ? tasks.length : filteredTaskCount})
              </span>
            </h2>
            {isSummaryMode ? (
              <span className="effismLite-inlineCompletePill">Completed</span>
            ) : null}
          </div>

          {!isSummaryMode ? (
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
          ) : null}
          </div>
        </>
      ) : null}

      {isTaskStep ? (
        <>
          {/* Task metrics and progress bar */}
          <section className="effismLite-taskMetricsContainer" aria-label="Task metrics">
          <div className="effismLite-taskMetricsRow">
            {taskTopMetrics.map((metric) => (
              <article key={metric.label} className="effismLite-taskMetricCard">
                <span className="effismLite-taskMetricLabel">{metric.label}</span>
                <strong className="effismLite-taskMetricValue">{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="effismLite-taskProgressRow" aria-live="polite">
            <div
              className="effismLite-taskProgressTrack"
              role="progressbar"
              aria-label="Task completion progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallTaskProgress.percentage}
            >
              <span
                className="effismLite-taskProgressFill"
                style={{ width: `${overallTaskProgress.percentage}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="effismLite-taskProgressCount">
              {overallTaskProgress.completedCount}/{overallTaskProgress.totalCount}
            </span>
          </div>
          </section>

          <div
            className="effismLite-taskFilterToggle"
            role="tablist"
            aria-label="Task type filter"
          >
            {TASK_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`effismLite-taskFilterButton${taskFilter === option.value ? " is-active" : ""}`}
                onClick={() => setTaskFilter(option.value)}
                role="tab"
                aria-selected={taskFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {isTaskStep ? (
        <>
          {/* Task list (collapsed/expanded cards with edit/summary modes) */}
          <section className="effismLite-panelTasks">
          {isTaskListLoading ? (
            <div className="effismLite-stepLoader" role="status" aria-live="polite">
              <span className="effismLite-spinner" aria-hidden="true" />
            </div>
          ) : (
            <div className="effismLite-taskSectionStack">
              {filteredTaskSections.length > 0 ? (
              filteredTaskSections.map((section) => (
                <section
                  key={section.category}
                  className="effismLite-taskGroup"
                  aria-labelledby={`effism-lite-task-group-${section.category}`}
                >
                  <div className="effismLite-taskGroupHeader">
                    <h3
                      id={`effism-lite-task-group-${section.category}`}
                      className="effismLite-taskGroupTitle"
                    >
                      {section.title}
                    </h3>
                    <span className="effismLite-taskGroupCount">
                      {section.tasks.length}
                    </span>
                  </div>

                  <div className="effismLite-taskStack">
              {section.tasks.map((task) => {
                const taskSubError = taskErrorsByWorkreportId.get(
                  `${task.workreportId || ""}`.trim(),
                );
                const taskIndex = tasks.findIndex(
                  (currentTask) => currentTask.id === task.id,
                );
                const isNewTask = !task.isSaved;
                const isRoutineTask = task.jobCategory === TASK_CATEGORY.ROUTINE;
                const isCfTask = task.jobCategory === TASK_CATEGORY.CF;
                const isDelegatedTask = task.jobCategory === TASK_CATEGORY.DELEGATED;
                const isStoredTask = isRoutineTask || isCfTask || isDelegatedTask;
                const canEditTaskIdentity = task.isEditing && !isStoredTask;
                const canEditTargetDate =
                  task.isEditing &&
                  !isRoutineTask &&
                  !isDelegatedTask &&
                  (!isCfTask || !normalizeApiDateValue(task.targetDate));
                const hasJobNumber = Boolean(`${task.jobNumber || ""}`.trim());
                const hasCfDate = Boolean(normalizeApiDateValue(task.cfDate));
                const hasTargetDate = Boolean(normalizeApiDateValue(task.targetDate));
                const statusPercentage = Number.parseInt(
                  normalizeStatusValue(task.status),
                  10,
                );
                const hasOutcome = Boolean(`${task.outcome || ""}`.trim());
                const estimatedSummary = renderTaskSummaryTime(
                  "Est",
                  task.estimatedTime,
                );
                const actualSummary = renderTaskSummaryTime("Act", task.actualTime);

                return (
                <article
                  key={task.id}
                  className={`effismLite-taskCard${task.isExpanded ? " is-expanded" : ""}${task.isEditing ? " is-editing" : ""}${taskSubError ? " is-sub-error" : ""}`}
                >
                {!task.isExpanded ? (
                  <div
                    className="effismLite-taskHeader"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTaskExpanded(task.id)}
                    onKeyDown={(event) =>
                      handleTaskHeaderKeyDown(event, task.id)
                    }
                    aria-expanded={false}
                  >
                    <div className="effismLite-taskHeaderMain">
                      <div className="effismLite-taskHeaderTop">
                        <div className="effismLite-taskHeaderMeta">
                          <span className="effismLite-taskNumberPill">
                            {taskDisplayNumberById.get(task.id) ?? taskIndex + 1}
                          </span>
                          <span
                            className={`effismLite-taskTypePill is-${getTaskMainTypeTone(task.mainType)}`}
                          >
                            {getTaskMainTypeLabel(task.mainType)}
                          </span>
                          {getTaskCategoryLabel(task.jobCategory) ? (
                            <span className="effismLite-taskCategoryText">
                              {getTaskCategoryLabel(task.jobCategory)}
                            </span>
                          ) : null}
                        </div>

                        <div className="effismLite-taskHeaderActions">
                          {!isSummaryMode ? (
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
                          ) : null}

                          <button
                            type="button"
                            className="effismLite-taskIconButton effismLite-taskChevron"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleTaskExpanded(task.id);
                            }}
                            aria-label="Expand task"
                            aria-expanded={false}
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

                      {hasJobNumber ? (
                        <span className="effismLite-taskJobNumber">
                          {getTaskJobNumberLabel(task.jobNumber)}
                        </span>
                      ) : null}

                      <div className="effismLite-taskSummary">
                        <span className="effismLite-taskSummaryItem">
                          <span className="effismLite-taskSummaryMetaLabel">
                            {estimatedSummary.label} :
                          </span>
                          <span className="effismLite-taskSummaryMetaValue">
                            {estimatedSummary.value}
                          </span>
                        </span>
                        <span className="effismLite-taskSummaryItem">
                          <span className="effismLite-taskSummaryMetaLabel">
                            {actualSummary.label} :
                          </span>
                          <span className="effismLite-taskSummaryMetaValue">
                            {actualSummary.value}
                          </span>
                        </span>
                        {!isRoutineTask ? (
                          <span
                            className={`effismLite-taskSummaryItem effismLite-taskStatusPill is-${getTaskStatusTone(task.status)}`}
                          >
                            {normalizeStatusValue(task.status)}
                          </span>
                        ) : null}
                      </div>
                      {taskSubError ? (
                        <div className="effismLite-taskSubErrorPill" role="alert">
                          {taskSubError}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {task.isExpanded ? (
                  <>
                    <div
                      className="effismLite-taskExpandedToolbar"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleTaskExpanded(task.id)}
                      onKeyDown={(event) =>
                        handleTaskHeaderKeyDown(event, task.id)
                      }
                      aria-expanded
                    >
                      <button
                        type="button"
                        className="effismLite-taskIconButton effismLite-taskChevron is-collapse"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleTaskExpanded(task.id);
                        }}
                        aria-label="Collapse task"
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
                      <div className="effismLite-taskExpandedMeta">
                        <span className="effismLite-taskNumberPill">
                          {taskDisplayNumberById.get(task.id) ?? taskIndex + 1}
                        </span>
                        <span
                          className={`effismLite-taskTypePill is-${getTaskMainTypeTone(task.mainType)}`}
                        >
                          {getTaskMainTypeLabel(task.mainType)}
                        </span>
                        {getTaskCategoryLabel(task.jobCategory) ? (
                          <span className="effismLite-taskCategoryText">
                            {getTaskCategoryLabel(task.jobCategory)}
                          </span>
                        ) : null}
                      </div>
                      <div className="effismLite-taskExpandedToolbarActions">
                        {!isSummaryMode ? task.isEditing ? (
                          <button
                            type="button"
                            className={`effismLite-taskIconButton${task.isEditing ? " is-active" : ""}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSaveTask(task.id);
                            }}
                            aria-label={`Save ${getTaskSummaryTitle(task)}`}
                            title="Save task"
                            disabled={task.isSaving}
                          >
                            {task.isSaving ? (
                              <span
                                className="effismLite-spinner"
                                aria-hidden="true"
                              />
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
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <path d="M17 21v-8H7v8" />
                                <path d="M7 3v5h8" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="effismLite-taskIconButton"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditTask(task.id);
                            }}
                            aria-label={`Edit ${getTaskSummaryTitle(task)}`}
                            title="Edit task"
                          >
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
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="effismLite-taskBody">
                      <div className="effismLite-taskFields">
                        {isSummaryMode ? (
                          <div className="effismLite-taskSummaryDetails">
                            <div className="effismLite-taskSummaryGrid">
                              <div className="effismLite-taskSummaryCard is-full-width">
                                <span className="effismLite-taskSummaryLabel">Task Name</span>
                                <span className="effismLite-taskSummaryValue">{task.taskName || "-"}</span>
                              </div>
                              {isRoutineTask ? (
                                <div className="effismLite-taskSummaryCard is-full-width">
                                  <span className="effismLite-taskSummaryLabel">Type</span>
                                  <span className="effismLite-taskSummaryValue">
                                    {task.subType || task.mainType || "-"}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="effismLite-taskSummaryCard is-full-width">
                                    <span className="effismLite-taskSummaryLabel">Main Type</span>
                                    <span className="effismLite-taskSummaryValue">{task.mainType || "-"}</span>
                                  </div>
                                  <div className="effismLite-taskSummaryCard is-full-width">
                                    <span className="effismLite-taskSummaryLabel">Sub Type</span>
                                    <span className="effismLite-taskSummaryValue">{task.subType || "-"}</span>
                                  </div>
                                </>
                              )}
                              {hasJobNumber ? (
                                <div className="effismLite-taskSummaryCard is-full-width">
                                  <span className="effismLite-taskSummaryLabel">Job Number</span>
                                  <span className="effismLite-taskSummaryValue">{task.jobNumber}</span>
                                </div>
                              ) : null}
                            </div>

                            <div className="effismLite-taskSummaryMetricsGrid">
                              <div className="effismLite-taskSummaryCard">
                                <span className="effismLite-taskSummaryLabel">Est Time</span>
                                <span className="effismLite-taskSummaryValue">{task.estimatedTime || "--:--"}</span>
                              </div>
                              <div className="effismLite-taskSummaryCard">
                                <span className="effismLite-taskSummaryLabel">Act Time</span>
                                <span className="effismLite-taskSummaryValue">{task.actualTime || "--:--"}</span>
                              </div>
                            </div>

                            {!isRoutineTask ? (
                              <div className="effismLite-taskSummaryCard effismLite-taskSummaryStatusCard">
                                <span className="effismLite-taskSummaryLabel">Status</span>
                                <div className="effismLite-taskSummaryStatusTrack" aria-hidden="true">
                                  <span
                                    className="effismLite-taskSummaryStatusFill"
                                    style={{ width: `${statusPercentage}%` }}
                                  />
                                </div>
                                <span className="effismLite-taskSummaryStatusText">
                                  {normalizeStatusValue(task.status)}
                                </span>
                              </div>
                            ) : null}

                            {hasCfDate || hasTargetDate ? (
                              <div className="effismLite-taskSummaryGrid">
                                {hasCfDate ? (
                                  <div className="effismLite-taskSummaryCard">
                                    <span className="effismLite-taskSummaryLabel">CF Date</span>
                                    <span className="effismLite-taskSummaryValue">
                                      {formatDateDisplayValue(task.cfDate)}
                                    </span>
                                  </div>
                                ) : null}
                                {hasTargetDate ? (
                                  <div className="effismLite-taskSummaryCard">
                                    <span className="effismLite-taskSummaryLabel">Target</span>
                                    <span className="effismLite-taskSummaryValue">
                                      {formatDateDisplayValue(task.targetDate)}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {hasOutcome ? (
                              <div className="effismLite-taskSummaryCard">
                                <span className="effismLite-taskSummaryLabel">Outcome</span>
                                <span className="effismLite-taskSummaryValue">{task.outcome}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <>
                        {task.saveError ? (
                          <div className="effismLite-taskSaveError" role="alert">
                            {task.saveError}
                          </div>
                        ) : null}
                        <label
                          className="effismLite-field effismLite-fieldWide"
                          htmlFor={`task-name-${task.id}`}
                        >
                          <span className="effismLite-fieldLabel">
                            Task Name
                          </span>
                          <input
                            id={`task-name-${task.id}`}
                            className="effismLite-input"
                            type="text"
                            value={task.taskName}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "taskName",
                                event.target.value,
                              )
                            }
                            placeholder="Enter task name"
                            disabled={!canEditTaskIdentity}
                          />
                        </label>

                        {isRoutineTask ? (
                          <label
                            className="effismLite-field effismLite-fieldWide"
                            htmlFor={`task-type-${task.id}`}
                          >
                            <span className="effismLite-fieldLabel">Type</span>
                            <input
                              id={`task-type-${task.id}`}
                              className="effismLite-input"
                              type="text"
                              value={task.subType || task.mainType}
                              readOnly
                              disabled
                            />
                          </label>
                        ) : (
                          <>
                            <EffismLiteSearchableCombo
                              id={`task-main-type-${task.id}`}
                              label="Main Type"
                              className={isNewTask ? "effismLite-fieldWide" : ""}
                              value={task.mainType}
                              onChange={(event) =>
                                updateTask(task.id, "mainType", event.target.value)
                              }
                              options={taskMainTypeOptions}
                              placeholder="Select or type a main type"
                              disabled={!canEditTaskIdentity}
                              ariaLabel="Main type"
                            />

                            <EffismLiteSearchableCombo
                              id={`task-sub-type-${task.id}`}
                              label="Sub Type"
                              className="effismLite-fieldWide"
                              value={task.subType}
                              onChange={(event) =>
                                updateTask(task.id, "subType", event.target.value)
                              }
                              options={taskSubTypeOptions}
                              placeholder="Select or type a sub type"
                              disabled={!canEditTaskIdentity}
                              ariaLabel="Sub type"
                            />
                          </>
                        )}

                        {!isStoredTask ? (
                          <EffismLiteSearchableCombo
                            id={`task-job-number-${task.id}`}
                            label="Job Number"
                            className={isNewTask ? "effismLite-fieldWide" : ""}
                            value={task.jobNumber}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "jobNumber",
                                event.target.value,
                              )
                            }
                            options={JOB_NUMBER_OPTIONS}
                            placeholder="Select or type a job number"
                            disabled={!task.isEditing}
                            ariaLabel="Job number"
                          />
                        ) : null}

                        <div
                          className={`effismLite-taskTimeRow effismLite-fieldWide${isNewTask ? " is-single-field" : ""}`}
                        >
                          <ClockPickerField
                            id={`task-estimated-time-${task.id}`}
                            label="Est Time"
                            value={task.estimatedTime}
                            onChange={(event) =>
                              updateTask(
                                task.id,
                                "estimatedTime",
                                formatClockInputAsTyped(event.target.value),
                              )
                            }
                            onBlur={() =>
                              handleTaskTimeBlur(task.id, "estimatedTime")
                            }
                            placeholder="00:00"
                            disabled={!task.isEditing}
                            formatClockInputAsTyped={formatClockInputAsTyped}
                            normalizeClockInput={normalizeClockInput}
                          />

                          {!isNewTask ? (
                            <ClockPickerField
                              id={`task-actual-time-${task.id}`}
                              label="Act Time"
                              value={task.actualTime}
                              onChange={(event) =>
                                updateTask(
                                  task.id,
                                  "actualTime",
                                  formatClockInputAsTyped(event.target.value),
                                )
                              }
                              onBlur={() =>
                                handleTaskTimeBlur(task.id, "actualTime")
                              }
                              placeholder="00:00"
                              disabled={!task.isEditing}
                              formatClockInputAsTyped={formatClockInputAsTyped}
                              normalizeClockInput={normalizeClockInput}
                            />
                          ) : null}
                        </div>

                        {!isNewTask ? (
                          <label
                            className="effismLite-field effismLite-fieldWide"
                            htmlFor={`task-outcome-${task.id}`}
                          >
                            <span className="effismLite-fieldLabel">
                              Outcome
                            </span>
                            <textarea
                              id={`task-outcome-${task.id}`}
                              className="effismLite-input effismLite-textarea effismLite-taskOutcomeInput"
                              rows={1}
                              value={task.outcome}
                              onChange={(event) =>
                                updateTask(task.id, "outcome", event.target.value)
                              }
                              placeholder="Describe the outcome"
                              disabled={!task.isEditing}
                            />
                          </label>
                        ) : null}

                        {!isNewTask && !isRoutineTask ? (
                          <>
                            <DatePickerField
                              id={`task-target-${task.id}`}
                              label="Target"
                              className="effismLite-fieldWide"
                              value={task.targetDate}
                              onChange={(event) =>
                                updateTask(
                                  task.id,
                                  "targetDate",
                                  event.target.value,
                                )
                              }
                              disabled={!canEditTargetDate}
                              formatDisplayValue={formatDateDisplayValue}
                            />

                            <div className="effismLite-field effismLite-taskStatusField">
                              <div className="effismLite-taskStatusHeader">
                                <span className="effismLite-fieldLabel">Status</span>
                                <span className="effismLite-taskStatusValue">
                                  {normalizeStatusValue(task.status)}
                                </span>
                              </div>
                              <div className="effismLite-taskStatusSliderWrap">
                                <input
                                  id={`task-status-${task.id}`}
                                  className="effismLite-taskStatusSlider"
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={Number.parseInt(normalizeStatusValue(task.status), 10)}
                                  style={{
                                    "--effismLite-status-progress": `${Number.parseInt(
                                      normalizeStatusValue(task.status),
                                      10,
                                    )}%`,
                                  }}
                                  onChange={(event) =>
                                    updateTask(
                                      task.id,
                                      "status",
                                      normalizeStatusValue(`${event.target.value}%`),
                                    )
                                  }
                                  disabled={!task.isEditing}
                                  aria-label="Task status"
                                />
                              </div>
                            </div>

                            <DatePickerField
                              id={`task-cf-date-${task.id}`}
                              label="CF date"
                              className="effismLite-fieldWide"
                              value={task.cfDate}
                              onChange={(event) =>
                                updateTask(task.id, "cfDate", event.target.value)
                              }
                              disabled={!task.isEditing}
                              formatDisplayValue={formatDateDisplayValue}
                            />
                          </>
                        ) : null}
                          </>
                        )}
                      </div>

                      {!isSummaryMode ? (
                      <div className="effismLite-taskActions">
                        {task.isEditing ? (
                          <button
                            type="button"
                            className="effismLite-button effismLite-buttonPrimary"
                            onClick={() => handleSaveTask(task.id)}
                            disabled={task.isSaving}
                          >
                            {task.isSaving ? (
                              <>
                                <span
                                  className="effismLite-spinner effismLite-spinnerOnButton"
                                  aria-hidden="true"
                                />
                                Saving...
                              </>
                            ) : (
                              "Save"
                            )}
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
                      ) : null}
                    </div>
                  </>
                ) : null}
                </article>
                );
              })}
                  </div>
                </section>
              ))
              ) : (
                <div className="effismLite-emptyTasks">
                  No tasks in this view.
                </div>
              )}
            </div>
          )}
          </section>
        </>
      ) : isTimeLogLoading ? (
        <>
          {/* Loading state for time-log page */}
          <div
          className="effismLite-stepLoader effismLite-stepLoaderStandalone"
          role="status"
          aria-live="polite"
        >
          <span className="effismLite-spinner" aria-hidden="true" />
          </div>
        </>
      ) : isSummaryMode ? (
        <>
          {/* Read-only time-log summary once diary is completed */}
          <div className="effismLite-timeLogSummaryPanel">
          <div className="effismLite-summaryHeaderRow">
            <h3 className="effismLite-summarySectionTitle">Time Log Summary</h3>
            <span className="effismLite-inlineCompletePill">Completed</span>
          </div>

          <section className="effismLite-timeLogSummaryShell">
            <div className="effismLite-timeLogSummaryList">
              {timeLogMetrics
                .filter(
                  (metric) =>
                    !["Net Time", "Total Est", "Total Act"].includes(metric.label),
                )
                .map((metric) =>
                  metric.label === "Date" ? (
                    <DatePickerField
                      key={metric.label}
                      id="effism-lite-summary-date"
                      className="effismLite-timeLogSummaryDateField"
                      label="Date"
                      value={jobDetails.date}
                      onChange={handleTimeLogDateChange}
                      formatDisplayValue={formatDateDisplayValue}
                    />
                  ) : (
                    <article
                      key={metric.label}
                      className="effismLite-timeLogSummaryItem"
                    >
                      <span className="effismLite-timeLogSummaryLabel">{metric.label}</span>
                      <strong className="effismLite-timeLogSummaryValue">{metric.value}</strong>
                    </article>
                  ),
                )}
            </div>
          </section>

          <section className="effismLite-timeTotalsShell">
            <div className="effismLite-timeTotalsGrid">
              {timeLogMetrics
                .filter((metric) =>
                  ["Total Est", "Total Act", "Net Time"].includes(metric.label),
                )
                .map((metric) => (
                  <article
                    key={metric.label}
                    className={`effismLite-timeLogSummaryItem${metric.label === "Net Time" ? " is-full-width is-net-time" : ""}`}
                  >
                    <span className="effismLite-timeLogSummaryLabel">{metric.label}</span>
                    <strong className="effismLite-timeLogSummaryValue">{metric.value}</strong>
                  </article>
                ))}
            </div>
          </section>
          </div>
        </>
      ) : (
        <>
          {/* Editable time-log form */}
          <section className="effismLite-timeLogFormSection">
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

          <div className="effismLite-timeLogCardStack">
            <div className="effismLite-timeLogCard">
              <DatePickerField
                id="effism-lite-date"
                className="effismLite-fieldWide"
                label="Date"
                value={jobDetails.date}
                onChange={handleTimeLogDateChange}
                formatDisplayValue={formatDateDisplayValue}
              />

              <div className="effismLite-field effismLite-fieldWide">
                <span className="effismLite-fieldLabel">Day Type</span>
                <EffismLiteDropdown
                  id="effism-lite-day-type"
                  ariaLabel="Day type"
                  value={jobDetails.dayType}
                  onValueChange={handleDayTypeChange}
                  options={dayTypeOptions}
                  placeholder="Select day type"
                />
              </div>

              {showOffTypeField ? (
                <div className="effismLite-field effismLite-fieldWide">
                  <span className="effismLite-fieldLabel">OFF Type</span>
                  <EffismLiteDropdown
                    id="effism-lite-off-type"
                    ariaLabel="OFF type"
                    value={jobDetails.daySubtype}
                    onValueChange={(nextValue) =>
                      updateJobDetails("daySubtype", nextValue)
                    }
                    options={offSubtypeOptions}
                    placeholder="Select"
                  />
                </div>
              ) : null}

              {showLeaveTypeField ? (
                <div className="effismLite-field effismLite-fieldWide">
                  <span className="effismLite-fieldLabel">Leave Type</span>
                  <EffismLiteDropdown
                    id="effism-lite-leave-type"
                    ariaLabel="Leave type"
                    value={jobDetails.daySubtype}
                    onValueChange={(nextValue) =>
                      updateJobDetails("daySubtype", nextValue)
                    }
                    options={leaveSubtypeOptions}
                    placeholder="Select"
                  />
                </div>
              ) : null}

              <MeridiemTimeInput
                id="effism-lite-duty-start"
                className="effismLite-fieldWide"
                label="Duty Start"
                timeValue={jobDetails.timeIn}
                meridiemValue={jobDetails.timeInMeridiem}
                onTimeChange={(event) =>
                  handleJobClockChange("timeIn", event.target.value)
                }
                onMeridiemChange={(event) =>
                  updateJobDetails("timeInMeridiem", event.target.value)
                }
                onBlur={() => handleJobTimeBlur("timeIn")}
                formatClockInputAsTyped={formatClockInputAsTyped}
                normalizeClockInput={normalizeClockInput}
                defaultPickerTime="08:00"
                defaultPickerMeridiem="AM"
              />

              <MeridiemTimeInput
                id="effism-lite-duty-end"
                className="effismLite-fieldWide"
                label="Duty End"
                timeValue={jobDetails.timeOut}
                meridiemValue={jobDetails.timeOutMeridiem}
                onTimeChange={(event) =>
                  handleJobClockChange("timeOut", event.target.value)
                }
                onMeridiemChange={(event) =>
                  updateJobDetails("timeOutMeridiem", event.target.value)
                }
                onBlur={() => handleJobTimeBlur("timeOut")}
                formatClockInputAsTyped={formatClockInputAsTyped}
                normalizeClockInput={normalizeClockInput}
                defaultPickerTime="06:00"
                defaultPickerMeridiem="PM"
              />
            </div>

            <div className="effismLite-timeLogCard">
              <ClockPickerField
                id="effism-lite-break"
                label="Break"
                value={jobDetails.breakTime}
                onChange={(event) =>
                  handleJobClockChange("breakTime", event.target.value)
                }
                onBlur={() => handleJobTimeBlur("breakTime")}
                formatClockInputAsTyped={formatClockInputAsTyped}
                normalizeClockInput={normalizeClockInput}
              />

              <ClockPickerField
                id="effism-lite-site-travel"
                label="Site Travel"
                value={jobDetails.siteTravel}
                onChange={(event) =>
                  handleJobClockChange("siteTravel", event.target.value)
                }
                onBlur={() => handleJobTimeBlur("siteTravel")}
                formatClockInputAsTyped={formatClockInputAsTyped}
                normalizeClockInput={normalizeClockInput}
              />

              {TIME_LOG_EXTRA_FIELDS.slice(0, 2).map((fieldConfig) => (
                <ClockPickerField
                  key={fieldConfig.field}
                  id={`effism-lite-${fieldConfig.field}`}
                  label={fieldConfig.label}
                  value={jobDetails[fieldConfig.field]}
                  onChange={(event) =>
                    handleJobClockChange(fieldConfig.field, event.target.value)
                  }
                  onBlur={() => handleJobTimeBlur(fieldConfig.field)}
                  formatClockInputAsTyped={formatClockInputAsTyped}
                  normalizeClockInput={normalizeClockInput}
                />
              ))}
            </div>

            <div className="effismLite-timeLogCard">
              {TIME_LOG_EXTRA_FIELDS.slice(2).map((fieldConfig, fieldIndex) => (
                <ClockPickerField
                  key={fieldConfig.field}
                  id={`effism-lite-${fieldConfig.field}`}
                  className={fieldIndex === 0 ? "effismLite-fieldWide" : ""}
                  label={fieldConfig.label}
                  value={jobDetails[fieldConfig.field]}
                  onChange={(event) =>
                    handleJobClockChange(fieldConfig.field, event.target.value)
                  }
                  onBlur={() => handleJobTimeBlur(fieldConfig.field)}
                  formatClockInputAsTyped={formatClockInputAsTyped}
                  normalizeClockInput={normalizeClockInput}
                />
              ))}
            </div>
          </div>
          </section>
        </>
      )}
    </div>
  );
}
