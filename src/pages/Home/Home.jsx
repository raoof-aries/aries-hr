import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BREAK_STATUS_UPDATED_EVENT,
  getBreakStatus,
} from "../../services/breakTimeStatusService";
import {
  LEAVE_DAY_SUBTYPE_OPTIONS,
  NON_EFFISM_DAY_TYPE_OPTIONS,
  OFF_DAY_SUBTYPE_OPTIONS,
} from "../../data/attendanceOptions";
import {
  listEffismLiteDayLeaveTypes,
  listEffismLiteDayTypes,
} from "../../services/effismLiteService";
import { getIsRegularUser } from "../../utils/userMode";
import "./Home.css";

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

export default function Home() {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [dayType, setDayType] = useState("");
  const [daySubtype, setDaySubtype] = useState("");
  const [dayTypeOptions, setDayTypeOptions] = useState(DAY_TYPE_SELECT_OPTIONS);
  const [offSubtypeOptions, setOffSubtypeOptions] = useState(
    OFF_SUBTYPE_SELECT_OPTIONS,
  );
  const [leaveSubtypeOptions, setLeaveSubtypeOptions] = useState(
    LEAVE_SUBTYPE_SELECT_OPTIONS,
  );
  const { user } = useAuth();
  const isRegularUser = getIsRegularUser(user);
  const implementedModuleIds = new Set(["break", "salary", "effism-lite"]);
  const showOffTypeField = dayType === "off";
  const showLeaveTypeField = dayType === "leave";

  useEffect(() => {
    let isActive = true;

    const loadBreakStatus = async () => {
      const result = await getBreakStatus();

      if (!isActive || !result?.success) {
        return;
      }

      setIsOnBreak(result.isOnBreak);
    };

    loadBreakStatus();
    window.addEventListener(BREAK_STATUS_UPDATED_EVENT, loadBreakStatus);

    return () => {
      isActive = false;
      window.removeEventListener(BREAK_STATUS_UPDATED_EVENT, loadBreakStatus);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadDayTypeOptions = async () => {
      const options = await listEffismLiteDayTypes();

      if (isActive && options.length > 0) {
        setDayTypeOptions([{ value: "", label: "Select day type" }, ...options]);
      }
    };

    loadDayTypeOptions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (dayType !== "off" && dayType !== "leave") {
      return;
    }

    let isActive = true;

    const loadDaySubtypeOptions = async () => {
      const options = await listEffismLiteDayLeaveTypes(dayType);

      if (!isActive || options.length === 0) {
        return;
      }

      const selectOptions = [{ value: "", label: "Select" }, ...options];

      if (dayType === "off") {
        setOffSubtypeOptions(selectOptions);
      } else {
        setLeaveSubtypeOptions(selectOptions);
      }
    };

    loadDaySubtypeOptions();

    return () => {
      isActive = false;
    };
  }, [dayType]);

  const quickAccessItems = [
    {
      id: "break",
      title: "Break",
      statusBadge: isOnBreak ? "Break Initiated" : null,
      description: isOnBreak ? "Tap to mark IN" : "Open your break time log",
      route: "/break-time-log",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <polyline points="12 7 12 12 15 15"></polyline>
        </svg>
      ),
      bgColor: isOnBreak ? "#FFF4F4" : "#E6F3EF",
      iconColor: isOnBreak ? "#CF5B5B" : "#0F7A67",
      shadowColor: isOnBreak
        ? "rgba(198, 69, 69, 0.16)"
        : "rgba(1, 67, 66, 0.14)",
      cardTone: isOnBreak ? "warning" : null,
    },
    {
      id: "effism-lite",
      title: "EFFISM Lite",
      description: "Time log and task entry",
      route: "/effism-lite",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          <path d="M8 7h8"></path>
          <path d="M8 11h8"></path>
          <path d="M8 15h5"></path>
        </svg>
      ),
      bgColor: "#E7F5F1",
      iconColor: "#0D6C5F",
      shadowColor: "rgba(1, 67, 66, 0.14)",
    },
    {
      id: "salary",
      title: "Salary",
      description: "View your latest salary slip",
      route: "/salary-slip",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
          <path d="M7 14h.01"></path>
          <path d="M7 18h.01"></path>
          <path d="M17 14h.01"></path>
          <path d="M17 18h.01"></path>
        </svg>
      ),
      bgColor: "#EEF7F2",
      iconColor: "#166D5F",
      shadowColor: "rgba(1, 67, 66, 0.12)",
    },
    {
      id: "incentive",
      title: "Incentive",
      description: "Check current incentive slip",
      route: "/incentive-slip",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      ),
      bgColor: "#E3F4EE",
      iconColor: "#12725F",
      shadowColor: "rgba(1, 67, 66, 0.13)",
    },
    {
      id: "allowance",
      title: "Allowance",
      description: "See your allowance details",
      route: "/allowance",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 7h-4V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"></path>
          <path d="M9 7V4h6v3"></path>
          <path d="M12 12v6"></path>
          <path d="M9 15h6"></path>
        </svg>
      ),
      bgColor: "#F0F8F4",
      iconColor: "#23876C",
      shadowColor: "rgba(1, 67, 66, 0.11)",
    },
    {
      id: "health",
      title: "Health",
      description: "Manage your health benefits",
      route: "/health",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>
        </svg>
      ),
      bgColor: "#EAF5F0",
      iconColor: "#2B7B67",
      shadowColor: "rgba(1, 67, 66, 0.12)",
    },
    {
      id: "leave",
      title: "Leave",
      description: "Leaves, holidays and balance",
      route: "/leave",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      bgColor: "#E8F5F1",
      iconColor: "#178C78",
      shadowColor: "rgba(1, 67, 66, 0.13)",
    },
    {
      id: "calendar",
      title: "Calendar",
      description: "Upcoming events and dates",
      route: "/calendar",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 18h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
        </svg>
      ),
      bgColor: "#EDF7F2",
      iconColor: "#327F6D",
      shadowColor: "rgba(1, 67, 66, 0.1)",
    },
  ].map((item) => {
    if (implementedModuleIds.has(item.id)) {
      return {
        ...item,
        isAvailable: true,
      };
    }

    return {
      ...item,
      isAvailable: false,
      description: "This feature will be available soon",
      bgColor: "#ECEFF0",
      iconColor: "#8C9592",
      shadowColor: "rgba(129, 136, 136, 0.05)",
    };
  });

  const handleDayTypeChange = (event) => {
    const nextDayType = event.target.value;
    const shouldResetSubtype =
      nextDayType !== dayType ||
      (nextDayType !== "off" && nextDayType !== "leave");

    setDayType(nextDayType);

    if (shouldResetSubtype) {
      setDaySubtype("");
    }
  };

  if (!isRegularUser) {
    return (
      <div className="dashboard-container dashboard-container-simple">
        <section className="attendance-panel" aria-label="Attendance details">
          <div className="attendance-form">
            <label className="attendance-field attendance-field-time">
              <span className="attendance-label">Time in</span>
              <input
                type="time"
                className="attendance-input"
                value={timeIn}
                onChange={(event) => setTimeIn(event.target.value)}
              />
            </label>

            <label className="attendance-field attendance-field-time">
              <span className="attendance-label">Time out</span>
              <input
                type="time"
                className="attendance-input"
                value={timeOut}
                onChange={(event) => setTimeOut(event.target.value)}
              />
            </label>

            <label className="attendance-field attendance-field-choice">
              <span className="attendance-label">Day type</span>
              <select
                className="attendance-input attendance-select"
                value={dayType}
                onChange={handleDayTypeChange}
              >
                {dayTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {showOffTypeField ? (
              <label className="attendance-field attendance-field-secondary">
                <span className="attendance-label">OFF Type</span>
                <select
                  className="attendance-input attendance-select"
                  value={daySubtype}
                  onChange={(event) => setDaySubtype(event.target.value)}
                >
                  {offSubtypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {showLeaveTypeField ? (
              <label className="attendance-field attendance-field-secondary">
                <span className="attendance-label">Leave Type</span>
                <select
                  className="attendance-input attendance-select"
                  value={daySubtype}
                  onChange={(event) => setDaySubtype(event.target.value)}
                >
                  {leaveSubtypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-quick-access">
        <div className="dashboard-grid">
          {quickAccessItems.map((item, index) => {
            const cardClassName = `dashboard-card${item.cardTone ? ` dashboard-card-${item.cardTone}` : ""}${item.isAvailable ? "" : " dashboard-card-inactive"}`;
            const cardStyle = {
              "--card-accent": item.iconColor,
              "--card-soft": item.bgColor,
              "--card-icon-bg": item.bgColor,
              "--card-shadow": item.shadowColor,
              "--card-order": index,
            };

            const cardContent = (
              <>
                <div className="dashboard-card-main">
                  <div
                    className="dashboard-card-icon"
                    style={{ color: item.iconColor }}
                  >
                    {item.icon}
                  </div>
                  <div className="dashboard-card-content">
                    <h4 className="dashboard-card-title">{item.title}</h4>
                    {item.description && (
                      <p className="dashboard-card-desc">{item.description}</p>
                    )}
                    {item.statusBadge && (
                      <span className="dashboard-card-status-badge">
                        {item.statusBadge}
                      </span>
                    )}
                  </div>
                </div>
                {item.isAvailable ? (
                  <span className="dashboard-card-arrow" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </span>
                ) : (
                  <span className="dashboard-card-lock" aria-hidden="true">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                      <path d="M8 11V8a4 4 0 1 1 8 0v3"></path>
                    </svg>
                  </span>
                )}
              </>
            );

            if (item.isAvailable) {
              return (
                <Link
                  key={item.id}
                  to={item.route}
                  className={cardClassName}
                  style={cardStyle}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                className={cardClassName}
                style={cardStyle}
                aria-disabled="true"
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
