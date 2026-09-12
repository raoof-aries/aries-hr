import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BREAK_STATUS_UPDATED_EVENT,
  getBreakStatus,
} from "../../services/breakTimeStatusService";
import {
  listEffismLiteDayLeaveTypes,
  listEffismLiteDayTypes,
} from "../../services/effismLiteService";
import { getIsRegularUser } from "../../utils/userMode";
import "./Home.css";

const DAY_TYPE_SELECT_OPTIONS = [
  { value: "", label: "Select day type" },
];

const OFF_SUBTYPE_SELECT_OPTIONS = [
  { value: "", label: "Select" },
];

const LEAVE_SUBTYPE_SELECT_OPTIONS = [
  { value: "", label: "Select" },
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
  const implementedModuleIds = new Set(["break", "salary", "effism-lite", "time-tracker", "incentive"]);
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
    ...(user?.usertype === 1 || user?.usertype === 2 ? [{
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
    }] : []),
    ...(user?.usertype === 3 ? [{
      id: "time-tracker",
      title: "Time Tracker",
      description: "Quick task entry",
      route: "/time-tracker",
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
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      bgColor: "#E9F2FA",
      iconColor: "#1A5A99",
      shadowColor: "rgba(26, 90, 153, 0.12)",
    }] : []),
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
      id: "hospital-assistance",
      title: "Hospital Assistance",
      description: "Chat with us on WhatsApp",
      externalUrl: "https://api.whatsapp.com/send?phone=971565367442",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.57a.75.75 0 0 0 .92.918l5.84-1.49A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.96-1.362l-.356-.212-3.69.941.978-3.585-.232-.368A9.715 9.715 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
      ),
      bgColor: "#FFF3E0",
      iconColor: "#e68900",
      shadowColor: "rgba(230, 137, 0, 0.16)",
    },
    {
      id: "cpe",
      title: "CPE",
      description: "Watch training videos",
      route: "/cpe",
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
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ),
      bgColor: "#E3F2FD",
      iconColor: "#1976D2",
      shadowColor: "rgba(25, 118, 210, 0.16)",
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
  ].filter((item) => {
    if (user?.usertype === 3) {
      return item.id === "time-tracker";
    }
    return true;
  }).map((item) => {
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

    if (nextDayType === "off") {
      setOffSubtypeOptions(OFF_SUBTYPE_SELECT_OPTIONS);
    } else if (nextDayType === "leave") {
      setLeaveSubtypeOptions(LEAVE_SUBTYPE_SELECT_OPTIONS);
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
              if (item.externalUrl) {
                return (
                  <a
                    key={item.id}
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                    style={cardStyle}
                  >
                    {cardContent}
                  </a>
                );
              }
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
