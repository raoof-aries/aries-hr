import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getRuntimeConfig } from "../../utils/runtimeConfig";
import "./SalarySlip.css";

const CURRENT_YEAR = new Date().getFullYear();
const FALLBACK_YEARS_TO_SHOW = 10;
const TOKEN_STORAGE_KEY = "authToken";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthLabel(monthValue) {
  const monthNumber = Number.parseInt(monthValue, 10);
  return MONTHS[monthNumber - 1] || `Month ${monthValue}`;
}

function getMonthIndex(monthValue) {
  if (typeof monthValue === "number") {
    return monthValue;
  }

  const parsedMonth = Number.parseInt(monthValue, 10);
  if (Number.isFinite(parsedMonth) && parsedMonth > 0) {
    return parsedMonth;
  }

  const monthName = `${monthValue || ""}`.trim();
  const foundIndex = MONTHS.findIndex(
    (label) => label.toLowerCase() === monthName.toLowerCase()
  );

  return foundIndex >= 0 ? foundIndex + 1 : 0;
}

function getSuccessfulPayload(payload) {
  return payload?.status === true || payload?.status === "true";
}

function extractUserId(user = {}) {
  const candidates = [
    user.user_id,
    user.userId,
    user.userID,
    user.id,
    user.uid,
    user.employee_id,
    user.employeeId,
    user.emp_id,
    user.empId,
    user.emp_user_id,
    user.empUserId,
  ];

  const foundValue = candidates.find(
    (value) => value !== null && value !== undefined && `${value}`.trim() !== ""
  );

  return foundValue ? `${foundValue}`.trim() : "";
}

function getJoiningYear(user = {}) {
  const rawValue = `${user.dateOfJoining || user.doj || ""}`.trim();
  const yearMatch = rawValue.match(/^(\d{4})/);
  const parsedYear = yearMatch ? Number.parseInt(yearMatch[1], 10) : NaN;

  return Number.isFinite(parsedYear) && parsedYear <= CURRENT_YEAR
    ? parsedYear
    : null;
}

function buildYearOptions(user = {}) {
  const joiningYear = getJoiningYear(user);
  const earliestYear = joiningYear ?? CURRENT_YEAR - FALLBACK_YEARS_TO_SHOW;
  const years = [];

  for (let year = CURRENT_YEAR; year >= earliestYear; year -= 1) {
    years.push(year);
  }

  return years;
}

function normalizePdfUrl(pdfUrl) {
  const trimmedUrl = `${pdfUrl || ""}`.trim();
  if (!trimmedUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/^\/\//.test(trimmedUrl)) {
    return `https:${trimmedUrl}`;
  }

  return `https://${trimmedUrl.replace(/^\/+/, "")}`;
}

function normalizeSalarySlips(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const monthNumber = getMonthIndex(item?.month);
      const year = Number.parseInt(item?.year, 10) || CURRENT_YEAR;

      return {
        key: `${year}-${monthNumber || index + 1}-${index}`,
        year,
        monthNumber,
        monthLabel: getMonthLabel(item?.month),
        pdf: normalizePdfUrl(item?.pdf),
      };
    })
    .sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return b.monthNumber - a.monthNumber;
    });
}

async function fetchSalarySlips({ apiBaseUrl, userId, year, token }) {
  const requestUrls = [`${apiBaseUrl}?action=listSalary`];
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isAbsoluteApi = /^https?:\/\//i.test(apiBaseUrl);

  if (isLocalhost && isAbsoluteApi) {
    requestUrls.push("/arieshrms-api?action=listSalary");
  }

  const form = new FormData();
  form.set("user_id", userId);

  if (year) {
    form.set("year", `${year}`);
  }

  const authToken = token || localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  let response = null;
  let payload = null;
  let networkError = null;

  for (const requestUrl of requestUrls) {
    try {
      response = await fetch(requestUrl, {
        method: "POST",
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
        body: form,
      });

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      networkError = null;
      break;
    } catch (error) {
      networkError = error;
      response = null;
      payload = null;
    }
  }

  if (!response) {
    throw new Error(
      networkError?.message ||
        "Cannot reach salary API from the browser. If you are testing locally, restart the dev server so the proxy is active."
    );
  }

  if (!response.ok) {
    throw new Error(
      payload?.message || `Salary slip request failed (HTTP ${response.status})`
    );
  }

  if (!getSuccessfulPayload(payload)) {
    throw new Error(payload?.message || "Salary slip data was not returned.");
  }

  return payload;
}

export default function SalarySlip() {
  const { user, token } = useAuth();
  const [salarySlips, setSalarySlips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const years = useMemo(() => buildYearOptions(user), [user]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  useEffect(() => {
    setSelectedMonth("All");
  }, [selectedYear]);

  useEffect(() => {
    let isCancelled = false;

    const loadSalarySlips = async () => {
      const userId = extractUserId(user);

      if (!userId) {
        setSalarySlips([]);
        setLoadError("Employee ID was not found in the current session.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const { apiBaseUrl } = await getRuntimeConfig();
        if (!apiBaseUrl) {
          throw new Error(
            "API base URL missing. Update public/config/app-config.json."
          );
        }

        const payload = await fetchSalarySlips({
          apiBaseUrl,
          userId,
          year: selectedYear === CURRENT_YEAR ? "" : selectedYear,
          token,
        });

        if (isCancelled) {
          return;
        }

        setSalarySlips(normalizeSalarySlips(payload?.data));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Error loading salary slips:", error);
        setSalarySlips([]);
        setLoadError(error.message || "Failed to load salary slips");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSalarySlips();

    return () => {
      isCancelled = true;
    };
  }, [selectedYear, token, user]);

  const monthsForYear = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(salarySlips.map((item) => item.monthLabel))
    );

    return uniqueMonths.sort(
      (left, right) => getMonthIndex(right) - getMonthIndex(left)
    );
  }, [salarySlips]);

  const filtered = useMemo(() => {
    let items = salarySlips.filter((item) => item.year === Number(selectedYear));

    if (selectedMonth !== "All") {
      items = items.filter((item) => item.monthLabel === selectedMonth);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.monthLabel.toLowerCase().includes(q) ||
          `${item.year}`.includes(q) ||
          item.pdf.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return b.monthNumber - a.monthNumber;
    });

    return items;
  }, [query, salarySlips, selectedMonth, selectedYear]);

  const handleDownload = async (pdfUrl, fileName) => {
    if (!pdfUrl) {
      return;
    }

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="salarySlip-container">
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="salarySlip-container">
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            maxWidth: "24rem",
            margin: "2rem auto",
          }}
        >
          <p style={{ color: "var(--color-error, #c00)", marginBottom: "0.5rem" }}>
            Failed to load salary slips
          </p>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salarySlip-container">
      <section className="salarySlip-controls">
        <div className="filter-controlRow salarySlip-controlRow">
          {/* Search and Filter Icon Row */}
          <div className="salarySlip-searchFilterRow">
            <input
              type="search"
              placeholder="Search month or file..."
              className="filter-search salarySlip-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search salary slips"
            />
            <button
              className="salarySlip-filterToggleButton"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
              aria-expanded={showFilters}
            >
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
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
          </div>

          {/* Filter Dropdowns - Shown when filter icon is clicked */}
          {showFilters && (
            <div className="salarySlip-filtersDropdown">
              <select
                className="filter-select salarySlip-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Select year"
                disabled={years.length === 0}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="filter-select salarySlip-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Select month"
              >
                <option value="All">All months</option>
                {monthsForYear.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Count Section */}
          <div className="filter-countSection salarySlip-countSection">
            <p className="filter-count salarySlip-count">
              <span className="filter-countNumber salarySlip-countNumber">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "slip" : "slips"} found
            </p>
          </div>
        </div>
      </section>

      <section className="slip-list salarySlip-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="slip-empty salarySlip-empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p>No salary slips found for the selected filters.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <article className="slip-item salarySlip-item" key={item.key}>
              <div className="slip-itemTop salarySlip-itemTop">
                <div className="slip-itemIcon salarySlip-itemIcon">
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </div>

                <div className="slip-itemLeft salarySlip-itemLeft">
                  <div className="slip-itemTitle salarySlip-itemTitle">
                    {item.monthLabel}
                  </div>
                  <div className="slip-itemMeta salarySlip-itemMeta">
                    Year:{" "}
                    <span className="slip-metaValue salarySlip-metaValue">
                      {item.year}
                    </span>
                  </div>
                </div>

                <button
                  className="slip-download salarySlip-download"
                  onClick={() =>
                    handleDownload(
                      item.pdf,
                      `salary-slip-${item.monthLabel}-${item.year}.pdf`
                    )
                  }
                  aria-label={`Download salary slip ${item.monthLabel} ${item.year}`}
                >
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
