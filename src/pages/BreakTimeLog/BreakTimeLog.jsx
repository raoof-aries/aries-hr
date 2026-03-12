import { useCallback, useState } from "react";
import BreakTimeEntryModal from "../../components/BreakTimeEntryModal/BreakTimeEntryModal";
import QrScannerModal from "../../components/QrScannerModal/QrScannerModal";
import {
  formatBreakApiTime,
  submitBreakTimeAction,
} from "../../services/breakTimeLogService";
import { validateBreakTimeQrCodeWithApi } from "../../services/breakTimeQrService";
import "./BreakTimeLog.css";

function getStatusTone(type) {
  return type === "success" ? "success" : "error";
}

function getActionLabel(actionType) {
  return actionType === "out" ? "OUT" : "IN";
}

export default function BreakTimeLog() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const showSubmissionFeedback = useCallback((actionType, result) => {
    const recordedTime = formatBreakApiTime(result.recordedAt);

    setFeedback({
      type: "success",
      actionType,
      message: result.message,
      recordedTime,
    });
  }, []);

  const handleOpenScanner = () => {
    if (isSubmitting) {
      return;
    }

    setScannerError("");
    setFeedback(null);
    setPendingSubmission(null);
    setIsScannerOpen(true);
  };

  const handleSubmitAction = useCallback(
    async ({ actionType, qrValue, logId = null, reason = "" }) => {
      setIsSubmitting(true);

      try {
        const result = await submitBreakTimeAction({
          actionType,
          qrValue,
          logId,
          reason,
        });

        if (!result.success) {
          return result;
        }

        showSubmissionFeedback(actionType, result);
        return result;
      } catch (error) {
        console.error("Unable to submit break time:", error);
        return {
          success: false,
          message: "Unable to submit break time right now.",
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [showSubmissionFeedback],
  );

  const handleQrDetected = useCallback(
    async (decodedValue) => {
      if (isSubmitting) {
        return false;
      }

      const result = await validateBreakTimeQrCodeWithApi(decodedValue);

      if (!result.success) {
        setScannerError(result.message || "Invalid QR Code");
        return false;
      }

      setScannerError("");
      setFeedback(null);
      setIsScannerOpen(false);

      if (result.actionType === "in") {
        const submissionResult = await handleSubmitAction({
          actionType: "in",
          qrValue: result.qrValue,
          logId: result.logId,
        });

        if (!submissionResult.success) {
          setFeedback({
            type: "error",
            message: submissionResult.message || "Unable to record break in.",
          });
        }

        return true;
      }

      setPendingSubmission({
        actionType: result.actionType,
        qrValue: result.qrValue,
        logId: result.logId,
      });
      setIsEntryModalOpen(true);
      return true;
    },
    [handleSubmitAction, isSubmitting],
  );

  const handleCreateOutLog = async ({ reason }) => {
    if (!pendingSubmission) {
      return {
        success: false,
        message: "No break out submission is pending.",
      };
    }

    const result = await handleSubmitAction({
      actionType: pendingSubmission.actionType,
      qrValue: pendingSubmission.qrValue,
      logId: pendingSubmission.logId,
      reason,
    });

    if (result.success) {
      setIsEntryModalOpen(false);
      setPendingSubmission(null);
    }

    return result;
  };

  const handleCloseEntryModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsEntryModalOpen(false);
    setPendingSubmission(null);
  };

  return (
    <div className="breakTimeLogPage">
      <section className="breakTimeLogActionCard">
        <div className="breakTimeLogToolbar">
          <div className="breakTimeLogToolbarCopy">
            <h2>Log Break Time</h2>
            <p>
              Scan the approved QR code. The backend decides whether this scan
              records Break IN or Break OUT.
            </p>
          </div>
          <button
            type="button"
            className="breakTimeLogPrimaryButton"
            onClick={handleOpenScanner}
            disabled={isSubmitting}
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
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <path d="M7 12h10"></path>
            </svg>
            <span>{isSubmitting ? "Processing..." : "Scan QR Code"}</span>
          </button>
        </div>
      </section>

      {feedback && (
        <section
          className={`breakTimeLogFeedbackCard ${getStatusTone(feedback.type)}`}
        >
          <div className="breakTimeLogFeedbackHeader">
            <span className="breakTimeLogFeedbackBadge">
              {feedback.type === "success"
                ? `Break ${getActionLabel(feedback.actionType)}`
                : "Submission Error"}
            </span>
            {feedback.recordedTime && (
              <strong className="breakTimeLogFeedbackTime">
                {feedback.recordedTime}
              </strong>
            )}
          </div>
          <p className="breakTimeLogFeedbackMessage">{feedback.message}</p>
        </section>
      )}

      {isScannerOpen && (
        <QrScannerModal
          isOpen={isScannerOpen}
          errorMessage={scannerError}
          onClose={() => setIsScannerOpen(false)}
          onDetected={handleQrDetected}
        />
      )}

      {isEntryModalOpen && (
        <BreakTimeEntryModal
          actionType={pendingSubmission?.actionType}
          isOpen={isEntryModalOpen}
          isSubmitting={isSubmitting}
          onClose={handleCloseEntryModal}
          onSubmit={handleCreateOutLog}
        />
      )}
    </div>
  );
}
