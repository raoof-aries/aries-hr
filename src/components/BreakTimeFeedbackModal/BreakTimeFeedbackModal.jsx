import { createPortal } from "react-dom";
import "../BreakTimeEntryModal/BreakTimeEntryModal.css";
import "./BreakTimeFeedbackModal.css";

function getActionLabel(actionType) {
  return actionType === "out" ? "OUT" : "IN";
}

function getTitle(type, actionType) {
  if (type === "success") {
    return `Break ${getActionLabel(actionType)} Recorded`;
  }

  return actionType
    ? `Break ${getActionLabel(actionType)} Not Recorded`
    : "Unable to Record Break Time";
}

function getBadgeLabel(type, actionType) {
  if (type === "success") {
    return `Break ${getActionLabel(actionType)}`;
  }

  return "Submission Error";
}

function getSubtitle(type) {
  return type === "success"
    ? "Review the confirmation below, then close this window."
    : "Please review the message below before trying again.";
}

export default function BreakTimeFeedbackModal({
  feedback,
  isOpen,
  onClose,
}) {
  if (!isOpen || !feedback) {
    return null;
  }

  const tone = feedback.type === "success" ? "success" : "error";

  const modalContent = (
    <div className="breakTimeModalOverlay" onClick={onClose}>
      <div
        className="breakTimeModalCard breakTimeFeedbackModalCard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="breakTimeModalHeader">
          <div>
            <h2 className="breakTimeModalTitle">
              {getTitle(feedback.type, feedback.actionType)}
            </h2>
            <p className="breakTimeModalSubtitle">
              {getSubtitle(feedback.type)}
            </p>
          </div>
          <button
            type="button"
            className="breakTimeModalClose"
            onClick={onClose}
            aria-label="Close break time result modal"
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

        <div className="breakTimeFeedbackModalBody">
          <div className={`breakTimeFeedbackModalPanel ${tone}`}>
            <div className="breakTimeFeedbackModalIcon" aria-hidden="true">
              {tone === "success" ? (
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              ) : (
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 8v5"></path>
                  <path d="M12 16h.01"></path>
                </svg>
              )}
            </div>

            <span className="breakTimeFeedbackModalBadge">
              {getBadgeLabel(feedback.type, feedback.actionType)}
            </span>

            {feedback.recordedTime && (
              <strong className="breakTimeFeedbackModalTime">
                {feedback.recordedTime}
              </strong>
            )}

            <p className="breakTimeFeedbackModalMessage">{feedback.message}</p>
          </div>

          <div className="breakTimeModalActions breakTimeFeedbackModalActions">
            <button
              type="button"
              className="breakTimeModalPrimaryButton"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
