import { useCallback, useState } from "react";
import BreakTimeFeedbackModal from "../../components/BreakTimeFeedbackModal/BreakTimeFeedbackModal";
import BreakTimeEntryModal from "../../components/BreakTimeEntryModal/BreakTimeEntryModal";
import QrScannerModal from "../../components/QrScannerModal/QrScannerModal";
import breakTimeLogDummy from "../../data/breakTimeLogDummy.json";
import {
  formatBreakApiTime,
  submitBreakTimeAction,
} from "../../services/breakTimeLogService";
import { validateBreakTimeQrCodeWithApi } from "../../services/breakTimeQrService";
import "./BreakTimeLog.css";

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function buildSubmissionFeedback(actionType, result) {
  return {
    type: "success",
    actionType,
    message: result.message,
    recordedTime: formatBreakApiTime(result.recordedAt),
  };
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLatestAvailableDate(logs) {
  return [...logs]
    .map((item) => item.date)
    .filter(Boolean)
    .sort((first, second) => second.localeCompare(first))[0];
}

function formatSelectedDate(dateValue) {
  if (!dateValue) {
    return "Selected date";
  }

  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return dateValue;
  }

  return DATE_LABEL_FORMATTER.format(new Date(year, month - 1, day));
}

function getBreakSortValue(log) {
  return log.breakOut || log.breakIn || "00:00:00";
}

function sortBreaksByLatest(first, second) {
  return getBreakSortValue(second).localeCompare(getBreakSortValue(first));
}

function getStatusTone(status) {
  return status?.toLowerCase() === "active" ? "active" : "closed";
}

function BreakLogCard({
  log,
  variant = "default",
  isExpanded = false,
  onToggle,
}) {
  const statusTone = getStatusTone(log.status);
  const isPriorityCard = variant === "priority";
  const detailId = `break-log-panel-${log.id}`;

  return (
    <article
      className={`breakTimeLogEntryCard ${isPriorityCard ? "priority" : ""}`}
    >
      <button
        type="button"
        className="breakTimeLogEntryToggle"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={detailId}
      >
        <div className="breakTimeLogEntryTop">
          <div className="breakTimeLogEntryHeading">
            <div className="breakTimeLogEntryTitleRow">
              <h3>{log.reason || "Break reason pending"}</h3>
              {isPriorityCard ? (
                <span className={`breakTimeLogStatusBadge ${statusTone}`}>
                  Open
                </span>
              ) : null}
            </div>
            {!isPriorityCard ? (
              <div className="breakTimeLogEntrySummary">
                <span>{log.breakTime || "--:--:--"}</span>
                <span>
                  {log.breakOut || "--:--:--"} to {log.breakIn || "--:--:--"}
                </span>
              </div>
            ) : (
              <p className="breakTimeLogEntryMeta">
                Started at {log.breakOut || "--:--:--"}
              </p>
            )}
          </div>

          <div className="breakTimeLogEntryActions">
            <span
              className={`breakTimeLogToggleArrow ${isExpanded ? "expanded" : ""}`}
              aria-hidden="true"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </span>
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div id={detailId} className="breakTimeLogEntryDetails">
          <div className="breakTimeLogDetailRow">
            <span>Break out</span>
            <strong>{log.breakOut || "--:--:--"}</strong>
          </div>

          <div className="breakTimeLogDetailRow">
            <span>Break in</span>
            <strong>{log.breakIn || "--:--:--"}</strong>
          </div>

          <div className="breakTimeLogDetailRow">
            <span>Break time</span>
            <strong>{log.breakTime || "--:--:--"}</strong>
          </div>

          <div className="breakTimeLogDetailRow">
            <span>Status</span>
            <strong>{log.status}</strong>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function BreakTimeLog() {
  const dummyBreakLogs = Array.isArray(breakTimeLogDummy)
    ? breakTimeLogDummy
    : [];
  const todayDateValue = getTodayDateValue();
  const initialDate =
    dummyBreakLogs.find((entry) => entry.date === todayDateValue)?.date ||
    getLatestAvailableDate(dummyBreakLogs) ||
    todayDateValue;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [expandedLogId, setExpandedLogId] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const filteredBreakLogs = dummyBreakLogs
    .filter((entry) => entry.date === selectedDate)
    .sort(sortBreaksByLatest);
  const activeBreaks = filteredBreakLogs.filter(
    (entry) => getStatusTone(entry.status) === "active",
  );
  const completedBreaks = filteredBreakLogs.filter(
    (entry) => getStatusTone(entry.status) !== "active",
  );
  const activeBreak = activeBreaks[0] || null;
  const closedBreakCount = completedBreaks.length;

  const handleDateChange = (event) => {
    const nextDate = event.target.value;

    setSelectedDate(nextDate);
    setExpandedLogId("");
  };

  const handleToggleLog = (logId) => {
    setExpandedLogId((currentId) => (currentId === logId ? "" : logId));
  };

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
      <section className="breakTimeLogHeroCard">
        <button
          type="button"
          className="breakTimeLogPrimaryButton"
          onClick={handleOpenScanner}
          disabled={isSubmitting}
          aria-label={
            activeBreak
              ? `Scan QR Code to complete the active ${activeBreak.reason}`
              : "Scan QR Code to record your next break action"
          }
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
      </section>

      <section className="breakTimeLogOverviewCard">
        <div className="breakTimeLogOverviewTop">
          <label className="breakTimeLogDateFilter">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              aria-label="Select date"
            />
          </label>
        </div>

        <div className="breakTimeLogStats">
          <div className="breakTimeLogStatCard">
            <span>Total breaks</span>
            <strong>{filteredBreakLogs.length}</strong>
          </div>
          <div className="breakTimeLogStatCard">
            <span>Closed breaks</span>
            <strong>{closedBreakCount}</strong>
          </div>
          <div className="breakTimeLogStatCard active">
            <span>Open break</span>
            <strong>{activeBreak ? "1 active" : "None"}</strong>
          </div>
        </div>
      </section>

      <section className="breakTimeLogTimeline">
        {activeBreaks.length > 0 && (
          <div className="breakTimeLogPriorityStack">
          {activeBreaks.map((log) => (
            <BreakLogCard
              key={log.id}
              log={log}
              variant="priority"
              isExpanded={expandedLogId === log.id}
              onToggle={() => handleToggleLog(log.id)}
            />
          ))}
          </div>
        )}

        {completedBreaks.length > 0 ? (
          <div className="breakTimeLogList">
            {completedBreaks.map((log) => (
              <BreakLogCard
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggle={() => handleToggleLog(log.id)}
              />
            ))}
          </div>
        ) : null}

        {filteredBreakLogs.length === 0 && (
          <div className="breakTimeLogEmptyState">
            <div className="breakTimeLogEmptyIcon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <div>
              <h4>No breaks for this date</h4>
              <p>Change the date filter to view another day's break log.</p>
            </div>
          </div>
        )}
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
