import { useCallback, useEffect, useMemo, useState } from "react";
import BreakTimeEntryModal from "../../components/BreakTimeEntryModal/BreakTimeEntryModal";
import QrScannerModal from "../../components/QrScannerModal/QrScannerModal";
import {
  createBreakTimeLog,
  getBreakTimeLogsForDate,
  getLocalDateValue,
  resolveBreakTimeUserId,
} from "../../services/breakTimeLogService";
import {
  getConfiguredBreakTimeQrCode,
  validateBreakTimeQrCode,
} from "../../services/breakTimeQrService";
import { useAuth } from "../../context/AuthContext";
import "./BreakTimeLog.css";

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(timeValue) {
  if (!timeValue) {
    return "--";
  }

  const [hours = "0", minutes = "0"] = timeValue.split(":");
  const sampleDate = new Date();
  sampleDate.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(sampleDate);
}

function formatSubmittedLabel(timestamp) {
  if (!timestamp) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getStatusTone(type) {
  return type === "success" ? "success" : "error";
}

export default function BreakTimeLog() {
  const { user, userName } = useAuth();
  const today = useMemo(() => getLocalDateValue(), []);
  const userId = useMemo(
    () => resolveBreakTimeUserId(user, userName),
    [user, userName],
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [logs, setLogs] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const refreshLogs = useCallback(() => {
    setLogs(getBreakTimeLogsForDate({ userId, date: selectedDate }));
  }, [selectedDate, userId]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const handleOpenScanner = () => {
    setScannerError("");
    setFeedback(null);
    setIsScannerOpen(true);
  };

  const handleQrDetected = useCallback(async (decodedValue) => {
    const configuredQrCode = await getConfiguredBreakTimeQrCode();
    const isValid = validateBreakTimeQrCode(decodedValue, configuredQrCode);

    if (!isValid) {
      setScannerError("Invalid QR Code");
      return false;
    }

    setScannerError("");
    setIsScannerOpen(false);
    setIsEntryModalOpen(true);
    return true;
  }, []);

  const handleCreateLog = async ({
    logType,
    reason,
    customTimeUsed,
    customTime,
  }) => {
    setIsSubmitting(true);

    try {
      createBreakTimeLog({
        userId,
        logType,
        reason,
        customTimeUsed,
        customTime,
        qrVerified: true,
      });

      setIsEntryModalOpen(false);
      setFeedback({
        type: "success",
        message: `Break ${logType === "out" ? "out time" : "in time"} logged successfully.`,
      });

      if (selectedDate === today) {
        refreshLogs();
      } else {
        setSelectedDate(today);
      }
    } catch (error) {
      console.error("Unable to save break time log:", error);
      setFeedback({
        type: "error",
        message: "Unable to save the log right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="breakTimeLogPage">
      <section className="breakTimeLogActionCard">
        <div className="breakTimeLogToolbar">
          <div className="breakTimeLogToolbarCopy">
            <h2>Log Button</h2>
            <p>Scan the approved QR code before creating an in or out entry.</p>
          </div>
          <button
            type="button"
            className="breakTimeLogPrimaryButton"
            onClick={handleOpenScanner}
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
            <span>Log Break Time</span>
          </button>
        </div>
      </section>

      {feedback && (
        <div className={`breakTimeLogFeedback ${getStatusTone(feedback.type)}`}>
          {feedback.message}
        </div>
      )}

      <section className="breakTimeLogListCard">
        <div className="breakTimeLogSectionHeader">
          <div>
            <h2>Log List</h2>
            <p>Showing records for {formatDateLabel(selectedDate)}.</p>
          </div>
          <div className="breakTimeLogDateField">
            <label htmlFor="break-time-date-picker">Date</label>
            <input
              id="break-time-date-picker"
              type="date"
              value={selectedDate}
              max={today}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>

        <div className="breakTimeLogList">
          {logs.length === 0 ? (
            <div className="breakTimeLogEmptyState">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11H4a1 1 0 0 0-1 1v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a1 1 0 0 0-1-1h-5"></path>
                <path d="M9 7V5a3 3 0 0 1 6 0v2"></path>
                <path d="M12 11v6"></path>
              </svg>
              <p>No break logs found for this date.</p>
            </div>
          ) : (
            logs.map((record) => (
              <article key={record.id} className="breakTimeLogItem">
                <div className="breakTimeLogItemIcon">
                  {record.log_type === "out" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"></path>
                      <polyline points="14 7 9 12 14 17"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  )}
                </div>

                <div className="breakTimeLogItemContent">
                  <div className="breakTimeLogItemTop">
                    <div>
                      <h3>
                        {record.log_type === "out"
                          ? "Break Out Recorded"
                          : "Break In Recorded"}
                      </h3>
                      <p>Submitted {formatSubmittedLabel(record.submitted_time)}</p>
                    </div>
                    <span className="breakTimeLogBadge">
                      {record.custom_time_used ? "Custom Time" : "System Time"}
                    </span>
                  </div>

                  <div className="breakTimeLogMetaGrid">
                    <div className="breakTimeLogMetaItem">
                      <span>Date</span>
                      <strong>{formatDateLabel(record.date)}</strong>
                    </div>
                    <div className="breakTimeLogMetaItem">
                      <span>Out Time</span>
                      <strong>{formatTimeLabel(record.out_time)}</strong>
                    </div>
                    <div className="breakTimeLogMetaItem">
                      <span>In Time</span>
                      <strong>{formatTimeLabel(record.in_time)}</strong>
                    </div>
                    <div className="breakTimeLogMetaItem">
                      <span>Reason</span>
                      <strong>{record.reason || "--"}</strong>
                    </div>
                    <div className="breakTimeLogMetaItem">
                      <span>Logged Time</span>
                      <strong>{formatSubmittedLabel(record.submitted_time)}</strong>
                    </div>
                    <div className="breakTimeLogMetaItem">
                      <span>QR Verified</span>
                      <strong>{record.qr_verified ? "Yes" : "No"}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
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
          isOpen={isEntryModalOpen}
          isSubmitting={isSubmitting}
          onClose={() => setIsEntryModalOpen(false)}
          onSubmit={handleCreateLog}
        />
      )}
    </div>
  );
}
