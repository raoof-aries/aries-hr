import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getLocalTimeValue } from "../../services/breakTimeLogService";
import "./BreakTimeEntryModal.css";

const LOG_TYPES = [
  {
    value: "out",
    label: "Out Time",
    description: "Use this when you are stepping away.",
  },
  {
    value: "in",
    label: "In Time",
    description: "Use this when you are returning.",
  },
];

const BREAK_REASONS = ["Lunch", "Personal Work", "Client Visit", "Other"];

function getInitialState() {
  return {
    logType: "out",
    reason: BREAK_REASONS[0],
    addCustomTime: false,
    customTime: getLocalTimeValue(),
  };
}

export default function BreakTimeEntryModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [formState, setFormState] = useState(getInitialState);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedLogType = useMemo(
    () => LOG_TYPES.find((item) => item.value === formState.logType),
    [formState.logType],
  );

  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formState.logType === "out" && !formState.reason.trim()) {
      setErrorMessage("Reason is required.");
      return;
    }

    if (formState.addCustomTime && !formState.customTime) {
      setErrorMessage("Custom time is required when enabled.");
      return;
    }

    setErrorMessage("");

    await onSubmit({
      logType: formState.logType,
      reason: formState.logType === "out" ? formState.reason : "",
      customTimeUsed: formState.addCustomTime,
      customTime: formState.addCustomTime ? formState.customTime : "",
    });
  };

  const modalContent = (
    <div className="breakTimeModalOverlay" onClick={onClose}>
      <div
        className="breakTimeModalCard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="breakTimeModalHeader">
          <div>
            <h2 className="breakTimeModalTitle">Log Break Time</h2>
            <p className="breakTimeModalSubtitle">
              QR verified. Choose how you want this entry recorded.
            </p>
          </div>
          <button
            type="button"
            className="breakTimeModalClose"
            onClick={onClose}
            aria-label="Close break time log modal"
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="breakTimeEntryForm" onSubmit={handleSubmit}>
          <div className="breakTimeEntryTypeGrid">
            {LOG_TYPES.map((option) => {
              const isSelected = formState.logType === option.value;
              return (
                <label
                  key={option.value}
                  className={`breakTimeEntryTypeOption ${isSelected ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="logType"
                    value={option.value}
                    checked={isSelected}
                    onChange={handleFieldChange}
                  />
                  <span className="breakTimeEntryTypeLabel">{option.label}</span>
                  <span className="breakTimeEntryTypeDescription">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="breakTimeEntryRow">
            <label className="breakTimeEntryFieldLabel">
              <span>Add Custom Time</span>
              <input
                type="checkbox"
                name="addCustomTime"
                checked={formState.addCustomTime}
                onChange={handleFieldChange}
              />
            </label>
            <p className="breakTimeEntryHint">
              When this is off, the current system time will be recorded.
            </p>
          </div>

          {formState.addCustomTime && (
            <div className="breakTimeEntryRow">
              <label
                className="breakTimeEntryStandaloneLabel"
                htmlFor="break-time-custom-time"
              >
                Custom {selectedLogType?.label}
              </label>
              <input
                id="break-time-custom-time"
                className="breakTimeEntryControl"
                type="time"
                name="customTime"
                value={formState.customTime}
                onChange={handleFieldChange}
                required
              />
            </div>
          )}

          {formState.logType === "out" && (
            <div className="breakTimeEntryRow">
              <label
                className="breakTimeEntryStandaloneLabel"
                htmlFor="break-time-reason"
              >
                Reason
              </label>
              <select
                id="break-time-reason"
                className="breakTimeEntryControl"
                name="reason"
                value={formState.reason}
                onChange={handleFieldChange}
                required
              >
                {BREAK_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMessage && (
            <div className="breakTimeModalMessage breakTimeModalMessageError">
              {errorMessage}
            </div>
          )}

          <div className="breakTimeModalActions">
            <button
              type="button"
              className="breakTimeModalSecondaryButton"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="breakTimeModalPrimaryButton"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
