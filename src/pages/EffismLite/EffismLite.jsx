import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  listEffismLiteMainTypes,
  listEffismLiteJobs,
  listEffismLiteSubTypes,
  mapTaskMainTypeIdToLabel,
  mapTaskSubTypeIdToLabel,
  mapApiWorkStatusToDayType,
  normalizeApiClockValue,
  saveEffismLiteTimeRecord,
} from "../../services/effismLiteService";
import "./EffismLite.css";

const FALLBACK_MAIN_TYPE_OPTIONS = ["Invoiceable", "Non Invoiceable"];

const JOB_NUMBER_OPTIONS = [
  "AES/Website/Plex/Ariesplex",
  "Effism/2020/ESOL/EFFISM",
  "AES/JN/2022/BIZEVENTS",
  "ESOL/AMR/WEBS/24",
];

const DAY_TYPE_SELECT_OPTIONS = [
  { value: "", label: "Select day type" },
  ...NON_EFFISM_DAY_TYPE_OPTIONS,
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

function createTaskId() {
  return `effism-lite-task-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getTaskComparableSnapshot(task) {
  return JSON.stringify({
    taskName: `${task?.taskName ?? ""}`,
    mainType: `${task?.mainType ?? ""}`,
    subType: `${task?.subType ?? ""}`,
    jobNumber: `${task?.jobNumber ?? ""}`,
    estimatedTime: `${task?.estimatedTime ?? ""}`,
    actualTime: `${task?.actualTime ?? ""}`,
    outcome: `${task?.outcome ?? ""}`,
    status: normalizeStatusValue(task?.status),
    cfDate: `${task?.cfDate ?? ""}`,
    targetDate: `${task?.targetDate ?? ""}`,
  });
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

  const colonMatch = rawValue.match(/^(\d{0,2})\s*[:.]\s*(\d{0,2})/);
  if (colonMatch && /[:.]/.test(rawValue)) {
    const hoursPart = colonMatch[1].slice(0, 2);
    const minutesPart = colonMatch[2].slice(0, 2);

    if (!hoursPart && !minutesPart) {
      return "";
    }

    if (!minutesPart.length) {
      return hoursPart.length ? `${hoursPart.padStart(2, "0")}:` : "";
    }

    if (minutesPart.length < 2) {
      return `${hoursPart.padStart(2, "0")}:${minutesPart}`;
    }

    return `${hoursPart.padStart(2, "0")}:${minutesPart.slice(0, 2)}`;
  }

  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 4);

  if (!digitsOnly.length) {
    return "";
  }

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2, 4)}`;
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
  const baseTask = {
    id: task.id || createTaskId(),
    workreportId: task.workreportId || "",
    taskName: task.taskName || "",
    mainType: task.mainType || "",
    subType: task.subType || "",
    jobNumber: task.jobNumber || "",
    estimatedTime: task.estimatedTime || "00:00",
    actualTime: task.actualTime || "00:00",
    outcome: task.outcome || "",
    status: normalizeStatusValue(task.status),
    cfDate: task.cfDate || "",
    targetDate: task.targetDate || "",
    isSaving: false,
    saveError: "",
    isSaved: false,
    isEditing: true,
    isExpanded: true,
    editSnapshot: "",
    isDirty: false,
  };

  const nextTask = {
    ...baseTask,
    ...overrides,
  };

  return {
    ...nextTask,
    editSnapshot: nextTask.editSnapshot || getTaskComparableSnapshot(nextTask),
    isDirty: Boolean(nextTask.isDirty),
  };
}

function isEmptyDraftTask(task) {
  if (`${task.workreportId || ""}`.trim()) {
    return false;
  }

  if (task.isSaved) {
    return false;
  }

  const name = `${task.taskName || ""}`.trim();
  const mainType = `${task.mainType || ""}`.trim();
  const jobNumber = `${task.jobNumber || ""}`.trim();
  const outcome = `${task.outcome || ""}`.trim();
  const cfDate = `${task.cfDate || ""}`.trim();
  const targetDate = `${task.targetDate || ""}`.trim();
  const est = normalizeClockInput(`${task.estimatedTime || ""}`.trim()) || "00:00";
  const act = normalizeClockInput(`${task.actualTime || ""}`.trim()) || "00:00";

  return (
    !name &&
    !mainType &&
    !jobNumber &&
    !outcome &&
    !cfDate &&
    !targetDate &&
    est === "00:00" &&
    act === "00:00" &&
    normalizeStatusValue(task.status) === "0%"
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

function getTaskMainTypeTone(value) {
  if (value === "Non Invoiceable") {
    return "non-invoiceable";
  }

  return "invoiceable";
}

function getTaskJobNumberLabel(value) {
  return value || "No job number";
}

function normalizeApiDateValue(value) {
  const normalizedValue = `${value || ""}`.trim();
  if (!normalizedValue || normalizedValue === "0000-00-00") {
    return "";
  }
  return normalizedValue;
}

function formatDateDisplayValue(value) {
  const normalizedValue = normalizeApiDateValue(value);
  if (!normalizedValue) {
    return "Select date";
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);

  if (!year || !month || !day) {
    return normalizedValue;
  }

  const dateValue = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateValue);
}

const HOURS_24_LIST = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const MINUTES_LIST = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const HOURS_12_LIST = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const MERIDIEM_OPTIONS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

function EffismLiteDropdown({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuAlign = "stretch",
  ariaLabel,
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const showPlaceholder = selectedOption === undefined;

  return (
    <div
      className={`effismLite-dropdownRoot${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className={`effismLite-dropdownTrigger effismLite-input effismLite-select${triggerClassName ? ` ${triggerClassName}` : ""}${showPlaceholder ? " is-placeholder" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        {displayLabel}
      </button>

      {open && !disabled ? (
        <ul
          id={listboxId}
          className={`effismLite-dropdownMenu${menuAlign === "end" ? " is-align-end" : ""}`}
          role="listbox"
        >
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <li key={`${option.value}`} role="presentation">
                <button
                  type="button"
                  className={`effismLite-dropdownOption${isActive ? " is-selected" : ""}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function EffismLiteTimePickerColumns({ hour, minute, hoursList, onHour, onMinute }) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  useEffect(() => {
    const hourButton = hourRef.current?.querySelector(".is-selected");
    hourButton?.scrollIntoView({ block: "nearest" });
  }, [hour]);

  useEffect(() => {
    const minuteButton = minuteRef.current?.querySelector(".is-selected");
    minuteButton?.scrollIntoView({ block: "nearest" });
  }, [minute]);

  return (
    <div className="effismLite-timePickerColumns">
      <div className="effismLite-timePickerColumn" ref={hourRef}>
        <span className="effismLite-timePickerColumnLabel">Hour</span>
        <div className="effismLite-timePickerColumnScroll">
          {hoursList.map((item) => (
            <button
              key={item}
              type="button"
              className={`effismLite-timePickerCell${item === hour ? " is-selected" : ""}`}
              onClick={() => onHour(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="effismLite-timePickerColumn" ref={minuteRef}>
        <span className="effismLite-timePickerColumnLabel">Minute</span>
        <div className="effismLite-timePickerColumnScroll">
          {MINUTES_LIST.map((item) => (
            <button
              key={item}
              type="button"
              className={`effismLite-timePickerCell${item === minute ? " is-selected" : ""}`}
              onClick={() => onMinute(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EffismLiteMeridiemPickerColumns({
  hour,
  minute,
  meridiem,
  onHour,
  onMinute,
  onMeridiem,
}) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const meridiemRef = useRef(null);

  useEffect(() => {
    hourRef.current?.querySelector(".is-selected")?.scrollIntoView({
      block: "nearest",
    });
  }, [hour]);

  useEffect(() => {
    minuteRef.current?.querySelector(".is-selected")?.scrollIntoView({
      block: "nearest",
    });
  }, [minute]);

  useEffect(() => {
    meridiemRef.current?.querySelector(".is-selected")?.scrollIntoView({
      block: "nearest",
    });
  }, [meridiem]);

  return (
    <div className="effismLite-timePickerColumns effismLite-timePickerColumnsTriple">
      <div className="effismLite-timePickerColumn" ref={hourRef}>
        <span className="effismLite-timePickerColumnLabel">Hour</span>
        <div className="effismLite-timePickerColumnScroll">
          {HOURS_12_LIST.map((item) => (
            <button
              key={item}
              type="button"
              className={`effismLite-timePickerCell${item === hour ? " is-selected" : ""}`}
              onClick={() => onHour(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="effismLite-timePickerColumn" ref={minuteRef}>
        <span className="effismLite-timePickerColumnLabel">Minute</span>
        <div className="effismLite-timePickerColumnScroll">
          {MINUTES_LIST.map((item) => (
            <button
              key={item}
              type="button"
              className={`effismLite-timePickerCell${item === minute ? " is-selected" : ""}`}
              onClick={() => onMinute(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="effismLite-timePickerColumn" ref={meridiemRef}>
        <span className="effismLite-timePickerColumnLabel">Period</span>
        <div className="effismLite-timePickerColumnScroll">
          {MERIDIEM_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`effismLite-timePickerCell${item.value === meridiem ? " is-selected" : ""}`}
              onClick={() => onMeridiem(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EffismLiteTimeModal({
  open,
  title,
  onClose,
  onApply,
  children,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="effismLite-modalBackdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="effismLite-modalPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="effismLite-modalHead">
          <span className="effismLite-modalTitle">{title}</span>
          <button
            type="button"
            className="effismLite-modalClose"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="effismLite-modalBody">{children}</div>

        <div className="effismLite-modalActions">
          <button
            type="button"
            className="effismLite-button effismLite-buttonGhost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="effismLite-button effismLite-buttonPrimary"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
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

  if (hours === 0 && minutes === "00") {
    return {
      time: "00:00",
      meridiem: "AM",
    };
  }
  const meridiem = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return {
    time: `${String(normalizedHours).padStart(2, "0")}:${minutes}`,
    meridiem,
  };
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

function EffismLiteSearchableCombo({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className = "",
  disabled = false,
  ariaLabel,
}) {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = `${value || ""}`.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) =>
      `${option}`.toLowerCase().includes(query),
    );
  }, [options, value]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  const showMenu =
    menuOpen && !disabled && filteredOptions.length > 0;

  return (
    <div
      className={`effismLite-field${className ? ` ${className}` : ""}`}
    >
      <span className="effismLite-fieldLabel">{label}</span>
      <div className="effismLite-searchComboRoot" ref={rootRef}>
        <div className="effismLite-inputWrap">
          <input
            id={id}
            className="effismLite-input effismLite-inputWithHint"
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => setMenuOpen(true)}
            onBlur={() => {
              setTimeout(() => setMenuOpen(false), 150);
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            aria-label={ariaLabel}
            aria-expanded={showMenu}
            aria-autocomplete="list"
          />
          <button
            type="button"
            className="effismLite-inputGlyphButton"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              if (!disabled) {
                setMenuOpen((current) => !current);
              }
            }}
            aria-label={menuOpen ? "Close options" : "Open options"}
            disabled={disabled}
          >
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
          </button>
        </div>

        {showMenu ? (
          <ul
            className="effismLite-dropdownMenu effismLite-searchComboMenu"
            role="listbox"
          >
            {filteredOptions.map((option) => (
              <li key={option} role="presentation">
                <button
                  type="button"
                  className="effismLite-dropdownOption"
                  role="option"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onChange({
                      target: { value: option },
                    });
                    setMenuOpen(false);
                  }}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftHour, setDraftHour] = useState("12");
  const [draftMinute, setDraftMinute] = useState("00");
  const [draftMeridiem, setDraftMeridiem] = useState("AM");
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  const displayMeridiem = `${meridiemValue || "AM"}`.toUpperCase();
  const displayTime = isEditingTime
    ? editBuffer
    : `${timeValue || ""}`;

  const openPicker = () => {
    const sourceTime = isEditingTime ? editBuffer : `${timeValue || ""}`;
    const matchedTime = `${sourceTime}`.trim().match(/^(\d{1,2})[:.](\d{2})$/);

    if (matchedTime) {
      const rawHour = matchedTime[1].padStart(2, "0");
      setDraftHour(rawHour === "00" ? "12" : rawHour);
      setDraftMinute(matchedTime[2]);
    } else {
      setDraftHour("12");
      setDraftMinute("00");
    }

    setDraftMeridiem(displayMeridiem);
    setPickerOpen(true);
  };

  const applyPicker = () => {
    const next = `${draftHour}:${draftMinute}`;
    onTimeChange({
      target: {
        value: next,
      },
    });
    onMeridiemChange({
      target: {
        value: draftMeridiem,
      },
    });
    if (isEditingTime) {
      setEditBuffer(next);
    }
    setPickerOpen(false);
  };

  const handleTimeFocus = () => {
    setIsEditingTime(true);
    setEditBuffer(`${timeValue || ""}`);
  };

  const handleTimeChange = (event) => {
    setEditBuffer(formatClockInputAsTyped(event.target.value));
  };

  const handleTimeBlur = () => {
    const trimmed = editBuffer.trim();
    const normalized = normalizeClockInput(trimmed);
    const committed = normalized || trimmed;
    setIsEditingTime(false);
    onTimeChange({
      target: { value: committed },
    });
    setEditBuffer(committed);
    onBlur();
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
            value={displayTime}
            onChange={handleTimeChange}
            onFocus={handleTimeFocus}
            onBlur={handleTimeBlur}
            placeholder="00:00"
            autoComplete="off"
          />
          <div className="effismLite-timePickerTrigger">
            <button
              type="button"
              className="effismLite-timePickerIconButton"
              onClick={openPicker}
              aria-label={`${label} time picker`}
            >
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
            </button>
          </div>
        </div>
        <button
          type="button"
          className="effismLite-timeMeridiem"
          onClick={openPicker}
          aria-label={`${label} period ${displayMeridiem}, open time picker`}
        >
          {displayMeridiem}
        </button>
      </div>

      <EffismLiteTimeModal
        open={pickerOpen}
        title={`${label} — time`}
        onClose={() => setPickerOpen(false)}
        onApply={applyPicker}
      >
        <EffismLiteMeridiemPickerColumns
          hour={draftHour}
          minute={draftMinute}
          meridiem={draftMeridiem}
          onHour={setDraftHour}
          onMinute={setDraftMinute}
          onMeridiem={setDraftMeridiem}
        />
      </EffismLiteTimeModal>
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
  disabled = false,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftHour, setDraftHour] = useState("00");
  const [draftMinute, setDraftMinute] = useState("00");
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  const displayTime = isEditingTime ? editBuffer : `${value || ""}`;

  const openPicker = () => {
    if (disabled) {
      return;
    }

    const sourceTime = isEditingTime ? editBuffer : `${value || ""}`;
    const matchedValue = `${sourceTime}`.trim().match(/^(\d{1,2})[:.](\d{2})$/);

    if (matchedValue) {
      setDraftHour(String(matchedValue[1]).padStart(2, "0"));
      setDraftMinute(matchedValue[2]);
    } else {
      setDraftHour("00");
      setDraftMinute("00");
    }

    setPickerOpen(true);
  };

  const applyPicker = () => {
    const next = `${draftHour}:${draftMinute}`;
    onChange({
      target: {
        value: next,
      },
    });
    if (isEditingTime) {
      setEditBuffer(next);
    }
    setPickerOpen(false);
  };

  const handleTimeFocus = () => {
    if (disabled) {
      return;
    }
    setIsEditingTime(true);
    setEditBuffer(`${value || ""}`);
  };

  const handleTimeChange = (event) => {
    setEditBuffer(formatClockInputAsTyped(event.target.value));
  };

  const handleTimeBlur = () => {
    const trimmed = editBuffer.trim();
    const normalized = normalizeClockInput(trimmed);
    const committed = normalized || trimmed;
    setIsEditingTime(false);
    onChange({
      target: { value: committed },
    });
    setEditBuffer(committed);
    onBlur();
  };

  return (
    <div className="effismLite-field">
      <label className="effismLite-fieldLabel" htmlFor={id}>
        {label}
      </label>
      <div className="effismLite-inputWrap">
        <input
          id={id}
          className="effismLite-input effismLite-timeOnlyInput"
          type="text"
          inputMode="numeric"
          value={displayTime}
          onChange={handleTimeChange}
          onFocus={handleTimeFocus}
          onBlur={handleTimeBlur}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
        />
        <div className="effismLite-inputPickerGlyph">
          <button
            type="button"
            className="effismLite-timePickerIconButton effismLite-inputPickerGlyphButton"
            onClick={openPicker}
            aria-label={`${label} time picker`}
            disabled={disabled}
          >
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
          </button>
        </div>
      </div>

      <EffismLiteTimeModal
        open={pickerOpen}
        title={`${label} — time (24h)`}
        onClose={() => setPickerOpen(false)}
        onApply={applyPicker}
      >
        <EffismLiteTimePickerColumns
          hour={draftHour}
          minute={draftMinute}
          hoursList={HOURS_24_LIST}
          onHour={setDraftHour}
          onMinute={setDraftMinute}
        />
      </EffismLiteTimeModal>
    </div>
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
    timeIn: "00:00",
    timeInMeridiem: "AM",
    timeOut: "00:00",
    timeOutMeridiem: "PM",
    breakTime: "",
    siteTravel: "",
  });
  const [tasks, setTasks] = useState([]);
  const [taskMainTypeOptions, setTaskMainTypeOptions] = useState(
    FALLBACK_MAIN_TYPE_OPTIONS,
  );
  const [taskSubTypeOptions, setTaskSubTypeOptions] = useState([]);
  const [isTimeLogLoading, setIsTimeLogLoading] = useState(true);
  const [isTaskListLoading, setIsTaskListLoading] = useState(false);
  const [timeSaveStatus, setTimeSaveStatus] = useState("idle");
  const [jobDiaryCompleteStatus, setJobDiaryCompleteStatus] = useState("idle");
  const [jobDiaryCompleteMessage, setJobDiaryCompleteMessage] = useState("");
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const hasHydratedTimeRef = useRef(false);
  const loadedTaskDateRef = useRef("");
  const autosaveTimerRef = useRef(null);
  const hasUserEditedTimeRef = useRef(false);
  const saveStatusHideTimerRef = useRef(null);

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

    if (loadedTaskDateRef.current === jobDetails.date) {
      return;
    }

    let isMounted = true;

    const loadTasks = async () => {
      setIsTaskListLoading(true);
      try {
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
              subType:
                `${task.job_type_name ?? task.sub_type_name ?? task.sub_type ?? ""}`.trim() ||
                mapTaskSubTypeIdToLabel(
                  task.sub_type ?? task.subtype ?? task.job_type ?? task.job_type_id,
                ),
                jobNumber: `${task.job_no || ""}`,
                estimatedTime: normalizeApiClockValue(task.est_time),
                actualTime: normalizeApiClockValue(task.act_time),
                outcome: `${task.desc ?? task.description ?? ""}`,
                status: `${task.status ?? 0}%`,
                cfDate: normalizeApiDateValue(task.cf_date ?? task.cf),
                targetDate: normalizeApiDateValue(task.target_date ?? task.target),
              },
              {
                isSaved: true,
                isEditing: false,
                isExpanded: false,
              },
            ),
          ),
        );
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

  const handleTimeLogDateChange = async (event) => {
    const nextDate = `${event?.target?.value || ""}`.trim();
    if (!nextDate || nextDate === jobDetails.date) {
      return;
    }

    setIsTimeLogLoading(true);

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
          daySubtype: "",
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
          date: nextDate,
          dayType: "",
          daySubtype: "",
          timeIn: "00:00",
          timeInMeridiem: "AM",
          timeOut: "00:00",
          timeOutMeridiem: "PM",
          breakTime: "",
          siteTravel: "",
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

    const payload = normalizedTask.workreportId
      ? await editEffismLiteJob(normalizedTask, jobDetails.date)
      : await addEffismLiteJob(normalizedTask, jobDetails.date);

    if (!payload) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                isSaving: false,
                saveError:
                  "Could not save this task. Please check required fields (Task Name, Main Type, Est Time) and try again.",
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
            mainType: mapTaskMainTypeIdToLabel(task.main_type ?? task.mian_type),
            subType:
              `${task.job_type_name ?? task.sub_type_name ?? task.sub_type ?? ""}`.trim() ||
              mapTaskSubTypeIdToLabel(
                task.sub_type ?? task.subtype ?? task.job_type ?? task.job_type_id,
              ),
            jobNumber: `${task.job_no || ""}`,
            estimatedTime: normalizeApiClockValue(task.est_time),
            actualTime: normalizeApiClockValue(task.act_time),
            outcome: `${task.desc ?? task.description ?? ""}`,
            status: `${task.status ?? 0}%`,
            cfDate: normalizeApiDateValue(task.cf_date ?? task.cf),
            targetDate: normalizeApiDateValue(task.target_date ?? task.target),
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

  const handleTaskHeaderKeyDown = (event, taskId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTaskExpanded(taskId);
    }
  };

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
          {isTaskListLoading ? (
            <div className="effismLite-stepLoader" role="status" aria-live="polite">
              <span className="effismLite-spinner" aria-hidden="true" />
            </div>
          ) : (
            <div className="effismLite-taskStack">
              {tasks.map((task, taskIndex) => (
                <article
                  key={task.id}
                  className={`effismLite-taskCard${task.isExpanded ? " is-expanded" : ""}${task.isEditing ? " is-editing" : ""}`}
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
                        </div>

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
                      <span className="effismLite-taskNumberPill">
                        {taskDisplayNumberById.get(task.id) ?? taskIndex + 1}
                      </span>
                      <div className="effismLite-taskExpandedToolbarActions">
                        {task.isEditing ? (
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
                        )}
                      </div>
                    </div>

                    <div className="effismLite-taskBody">
                      <div className="effismLite-taskFields">
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
                            disabled={!task.isEditing}
                          />
                        </label>

                        <EffismLiteSearchableCombo
                          id={`task-main-type-${task.id}`}
                          label="Main Type"
                          value={task.mainType}
                          onChange={(event) =>
                            updateTask(task.id, "mainType", event.target.value)
                          }
                          options={taskMainTypeOptions}
                          placeholder="Select or type a main type"
                          disabled={!task.isEditing}
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
                          disabled={!task.isEditing}
                          ariaLabel="Sub type"
                        />

                        <EffismLiteSearchableCombo
                          id={`task-job-number-${task.id}`}
                          label="Job Number"
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

                        <div className="effismLite-taskTimeRow effismLite-fieldWide">
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
                          />

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
                          />
                        </div>

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
                          disabled={!task.isEditing}
                        />

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
                        />
                      </div>

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
                    </div>
                  </>
                ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : isTimeLogLoading ? (
        <div
          className="effismLite-stepLoader effismLite-stepLoaderStandalone"
          role="status"
          aria-live="polite"
        >
          <span className="effismLite-spinner" aria-hidden="true" />
        </div>
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
              onChange={handleTimeLogDateChange}
            />

            <div className="effismLite-field effismLite-fieldWide">
              <span className="effismLite-fieldLabel">Day Type</span>
              <EffismLiteDropdown
                id="effism-lite-day-type"
                ariaLabel="Day type"
                value={jobDetails.dayType}
                onValueChange={handleDayTypeChange}
                options={DAY_TYPE_SELECT_OPTIONS}
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
                  options={OFF_SUBTYPE_SELECT_OPTIONS}
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
                  options={LEAVE_SUBTYPE_SELECT_OPTIONS}
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
