import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDataUrl } from "../../utils/dataUrl";
import "./BreakTimeEntryModal.css";

const DEFAULT_BREAK_OUT_REASONS = [
  "Breakfast",
  "Lunch",
  "Client Visit",
  "Personal",
];
const OTHER_REASON = "Other";
const REASON_PLACEHOLDER = "";

function normalizeBreakOutReasons(payload) {
  const reasons = Array.isArray(payload?.breakOutReasons)
    ? payload.breakOutReasons
    : [];

  return reasons
    .map((reason) => (typeof reason === "string" ? reason.trim() : ""))
    .filter((reason) => reason && reason !== OTHER_REASON);
}

export default function BreakTimeEntryModal({
  actionType,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [availableReasons, setAvailableReasons] = useState(
    DEFAULT_BREAK_OUT_REASONS,
  );
  const [reason, setReason] = useState(REASON_PLACEHOLDER);
  const [customReason, setCustomReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const breakOutReasons = [...availableReasons, OTHER_REASON];

  useEffect(() => {
    if (!isOpen || actionType !== "out") {
      return undefined;
    }

    let isCancelled = false;

    const loadBreakOutReasons = async () => {
      try {
        const response = await fetch(getDataUrl("config/break-time-options.json"), {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const nextReasons = normalizeBreakOutReasons(payload);

        if (!isCancelled && nextReasons.length > 0) {
          setAvailableReasons(nextReasons);
        }
      } catch (error) {
        console.error("Unable to load break time options:", error);

        if (!isCancelled) {
          setAvailableReasons(DEFAULT_BREAK_OUT_REASONS);
        }
      }
    };

    loadBreakOutReasons();

    return () => {
      isCancelled = true;
    };
  }, [actionType, isOpen]);

  useEffect(() => {
    if (isOpen && actionType === "out") {
      setReason(REASON_PLACEHOLDER);
      setCustomReason("");
      setErrorMessage("");
    }
  }, [actionType, isOpen]);

  useEffect(() => {
    const validReasons = new Set([...availableReasons, OTHER_REASON]);

    if (reason !== REASON_PLACEHOLDER && !validReasons.has(reason)) {
      setReason(REASON_PLACEHOLDER);
      setCustomReason("");
    }
  }, [availableReasons, reason]);

  if (!isOpen || actionType !== "out") {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedReason =
      reason === OTHER_REASON ? customReason.trim() : reason.trim();

    if (!normalizedReason) {
      setErrorMessage("Reason is required.");
      return;
    }

    setErrorMessage("");
    const result = await onSubmit({
      reason: normalizedReason,
    });

    if (!result?.success) {
      setErrorMessage(result?.message || "Unable to submit break out.");
    }
  };

  const modalContent = (
    <div className="breakTimeModalOverlay" onClick={onClose}>
      <div
        className="breakTimeModalCard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="breakTimeModalHeader">
          <div>
            <h2 className="breakTimeModalTitle">Break OUT</h2>
            <p className="breakTimeModalSubtitle">
              Enter a short reason to record your break out time.
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
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              required
            >
              <option value="" disabled>
                Select an option
              </option>
              {breakOutReasons.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {reason === OTHER_REASON && (
              <input
                id="break-time-custom-reason"
                className="breakTimeEntryControl"
                type="text"
                name="customReason"
                value={customReason}
                onChange={(event) => {
                  setCustomReason(event.target.value);
                  if (errorMessage) {
                    setErrorMessage("");
                  }
                }}
                maxLength="250"
                placeholder="Type your reason"
                required
              />
            )}
          </div>

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
