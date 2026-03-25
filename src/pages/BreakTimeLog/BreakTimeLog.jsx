import { useCallback, useState } from "react";
import BreakTimeFeedbackModal from "../../components/BreakTimeFeedbackModal/BreakTimeFeedbackModal";
import BreakTimeEntryModal from "../../components/BreakTimeEntryModal/BreakTimeEntryModal";
import QrScannerModal from "../../components/QrScannerModal/QrScannerModal";
import {
  formatBreakApiTime,
  submitBreakTimeAction,
} from "../../services/breakTimeLogService";
import { validateBreakTimeQrCodeWithApi } from "../../services/breakTimeQrService";
import "./BreakTimeLog.css";

function buildSubmissionFeedback(actionType, result) {
  return {
    type: "success",
    actionType,
    message: result.message,
    recordedTime: formatBreakApiTime(result.recordedAt),
  };
}

export default function BreakTimeLog() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);

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
    [],
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

      if (result.actionType === "in") {
        setIsScannerOpen(false);
        const submissionResult = await handleSubmitAction({
          actionType: "in",
          qrValue: result.qrValue,
          logId: result.logId,
        });

        if (!submissionResult.success) {
          setFeedback({
            type: "error",
            actionType: "in",
            message: submissionResult.message || "Unable to record break in.",
          });
        }

        if (submissionResult.success) {
          setFeedback(buildSubmissionFeedback("in", submissionResult));
        }

        return true;
      }

      setIsScannerOpen(false);
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
      setFeedback(buildSubmissionFeedback(pendingSubmission.actionType, result));
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
        <div className="breakTimeLogToolbarCopy">
          <span className="breakTimeLogEyebrow">Break Management</span>
          <h2>Log Break Time</h2>
          <p>
            Scan the approved QR code. The backend decides whether this scan
            records Break IN or Break OUT.
          </p>
        </div>

        <div className="breakTimeLogQrTile" aria-hidden="true">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="6" height="6" rx="1.2" />
            <rect x="15" y="3" width="6" height="6" rx="1.2" />
            <rect x="3" y="15" width="6" height="6" rx="1.2" />
            <path d="M15 15h1" />
            <path d="M18 15h.01" />
            <path d="M21 15h.01" />
            <path d="M15 18h.01" />
            <path d="M18 18h1" />
            <path d="M21 18h.01" />
            <path d="M15 21h.01" />
            <path d="M18 21h.01" />
          </svg>
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

        <div className="breakTimeLogHintCard">
          <span className="breakTimeLogHintIcon" aria-hidden="true">
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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </span>
          <p>
            Auto-detects Break IN or Break OUT based on your last activity.
          </p>
        </div>
      </section>

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

      <BreakTimeFeedbackModal
        feedback={feedback}
        isOpen={Boolean(feedback)}
        onClose={() => setFeedback(null)}
      />
    </div>
  );
}
