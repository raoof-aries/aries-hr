import { useCallback, useEffect, useRef, useState } from "react";
import BreakTimeFeedbackModal from "../../components/BreakTimeFeedbackModal/BreakTimeFeedbackModal";
import BreakTimeEntryModal from "../../components/BreakTimeEntryModal/BreakTimeEntryModal";
import QrScannerModal from "../../components/QrScannerModal/QrScannerModal";
import {
  fetchBreakLogListing,
  formatBreakApiTime,
  submitBreakTimeAction,
} from "../../services/breakTimeLogService";
import { validateBreakTimeQrCodeWithApi } from "../../services/breakTimeQrService";
import { notifyBreakStatusUpdated } from "../../services/breakTimeStatusService";
import "./BreakTimeLog.css";

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

function getBreakSortValue(log) {
  return log.breakOut || log.breakIn || "00:00:00";
}

function sortBreaksByLatest(first, second) {
  return getBreakSortValue(second).localeCompare(getBreakSortValue(first));
}

function parseDurationToSeconds(durationValue) {
  const [hours = "0", minutes = "0", seconds = "0"] = `${durationValue || ""}`
    .trim()
    .split(":");

  return (
    Number.parseInt(hours, 10) * 3600 +
    Number.parseInt(minutes, 10) * 60 +
    Number.parseInt(seconds, 10)
  );
}

function formatDurationFromSeconds(totalSeconds) {
  const safeTotalSeconds = Math.max(0, totalSeconds);
  const hours = String(Math.floor(safeTotalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeTotalSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(safeTotalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function getStatusTone(status) {
  return `${status || ""}`.trim().toLowerCase() === "closed"
    ? "closed"
    : "active";
}

function renderBreakDetailValue(value) {
  if (value) {
    return <strong>{value}</strong>;
  }

  return <span className="breakTimeLogDetailPlaceholder">-</span>;
}

function renderSummaryTimeValue(value) {
  if (value) {
    return <span>{value}</span>;
  }

  return <span className="breakTimeLogSummaryPlaceholder">-</span>;
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
                <span className="breakTimeLogDurationPill">
                  {log.breakTime || "-"}
                </span>
                <span className="breakTimeLogSummaryRange">
                  {renderSummaryTimeValue(log.breakOut)}
                  <span
                    className="breakTimeLogSummarySeparator"
                    aria-hidden="true"
                  >
                    -
                  </span>
                  {renderSummaryTimeValue(log.breakIn)}
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
            {renderBreakDetailValue(log.breakOut)}
          </div>

          <div className="breakTimeLogDetailRow">
            <span>Break in</span>
            {renderBreakDetailValue(log.breakIn)}
          </div>

          <div className="breakTimeLogDetailRow">
            <span>Break time</span>
            {renderBreakDetailValue(log.breakTime)}
          </div>

          <div className="breakTimeLogDetailRow">
            <span>Status</span>
            <strong>{log.status || "-"}</strong>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function BreakTimeLog() {
  const latestBreakLogRequestRef = useRef(0);
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateValue());
  const [breakLogs, setBreakLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [logsError, setLogsError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const refreshBreakLogs = useCallback(async (dateValue) => {
    const requestId = latestBreakLogRequestRef.current + 1;
    latestBreakLogRequestRef.current = requestId;
    setIsLoadingLogs(true);
    setLogsError("");

    try {
      const result = await fetchBreakLogListing({ date: dateValue });

      if (latestBreakLogRequestRef.current !== requestId) {
        return result;
      }

      if (!result.success) {
        setBreakLogs([]);
        setLogsError(result.message || "Unable to load break logs.");
        return result;
      }

      setBreakLogs(result.logs);
      return result;
    } finally {
      if (latestBreakLogRequestRef.current === requestId) {
        setIsLoadingLogs(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshBreakLogs(selectedDate);
  }, [refreshBreakLogs, selectedDate]);

  const filteredBreakLogs = [...breakLogs].sort(sortBreaksByLatest);
  const activeBreaks = filteredBreakLogs.filter(
    (entry) => getStatusTone(entry.status) === "active",
  );
  const completedBreaks = filteredBreakLogs.filter(
    (entry) => getStatusTone(entry.status) !== "active",
  );
  const activeBreak = activeBreaks[0] || null;
  const totalBreakDuration = formatDurationFromSeconds(
    completedBreaks.reduce(
      (totalSeconds, entry) =>
        totalSeconds + parseDurationToSeconds(entry.breakTime),
      0,
    ),
  );

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

  const refreshBreakData = useCallback(async () => {
    notifyBreakStatusUpdated();
    setExpandedLogId("");

    const todayDateValue = getTodayDateValue();
    if (selectedDate !== todayDateValue) {
      setSelectedDate(todayDateValue);
      return;
    }

    await refreshBreakLogs(todayDateValue);
  }, [refreshBreakLogs, selectedDate]);

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
          await refreshBreakData();
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
    [handleSubmitAction, isSubmitting, refreshBreakData],
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
      await refreshBreakData();
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

  const renderTimelineState = () => {
    if (isLoadingLogs) {
      return (
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
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <h4>Loading break log</h4>
            <p>Please wait while we fetch your break entries.</p>
          </div>
        </div>
      );
    }

    if (logsError) {
      return (
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
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <div>
            <h4>Unable to load break log</h4>
            <p>{logsError}</p>
          </div>
        </div>
      );
    }

    if (filteredBreakLogs.length === 0) {
      return (
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
      );
    }

    return null;
  };

  const timelineState = renderTimelineState();

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
          <span>
            {isSubmitting
              ? "Processing..."
              : activeBreak
                ? "Scan to End Break"
                : "Scan QR Code"}
          </span>
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
            <span>Break time</span>
            <strong>{totalBreakDuration}</strong>
          </div>
          <div className="breakTimeLogStatCard active">
            <span>Open break</span>
            <strong>{activeBreak ? "1 active" : "None"}</strong>
          </div>
        </div>
      </section>

      <section className="breakTimeLogTimeline">
        {activeBreaks.length > 0 && !timelineState && (
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

        {completedBreaks.length > 0 && !timelineState ? (
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

        {timelineState}
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
