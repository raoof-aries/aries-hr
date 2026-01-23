import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import allowanceData from "../../data/allowances.json";
import "./Allowance.css";

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

const ALLOWANCE_TYPES = [
  "All Types",
  "Father Allowance",
  "Mother Allowance",
  "Spouse Allowance",
];

function monthIndex(monthName) {
  const i = MONTHS.indexOf(monthName);
  return i >= 0 ? i + 1 : 0;
}

export default function Allowance() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = MONTHS[new Date().getMonth()];
  const years = useMemo(() => {
    const yrs = Array.from(
      new Set(allowanceData.allowances.map((s) => s.year))
    );
    return yrs.sort((a, b) => b - a);
  }, []);

  const [selectedYear, setSelectedYear] = useState(
    years.includes(currentYear) ? currentYear : years[0] || currentYear
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedType, setSelectedType] = useState("All Types");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Reset to current month when year changes, if current year is selected
    if (selectedYear === currentYear) {
      setSelectedMonth(currentMonth);
    } else {
      // If different year, keep current selection or default to first available month
      const monthsInYear = allowanceData.allowances
        .filter((s) => s.year === selectedYear)
        .map((s) => s.month)
        .filter((v, i, a) => a.indexOf(v) === i);
      if (monthsInYear.length > 0 && !monthsInYear.includes(selectedMonth)) {
        setSelectedMonth(monthsInYear[0]);
      }
    }
  }, [selectedYear, currentYear, currentMonth, selectedMonth]);

  const monthsForYear = useMemo(() => {
    return allowanceData.allowances
      .filter((s) => s.year === selectedYear)
      .map((s) => s.month)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [selectedYear]);

  const filtered = useMemo(() => {
    let items = allowanceData.allowances.filter(
      (s) => s.year === selectedYear && s.month === selectedMonth
    );

    if (selectedType !== "All Types") {
      items = items.filter((s) => s.type === selectedType);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (s) =>
          s.month.toLowerCase().includes(q) ||
          s.type.toLowerCase().includes(q) ||
          s.pdf.toLowerCase().includes(q) ||
          (s.id && s.id.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => {
      const monthDiff = monthIndex(b.month) - monthIndex(a.month);
      if (monthDiff !== 0) return monthDiff;
      const typeOrder = {
        "Father Allowance": 1,
        "Mother Allowance": 2,
        "Spouse Allowance": 3,
      };
      return (
        (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0)
      );
    });
    return items;
  }, [selectedYear, selectedMonth, selectedType, query]);

  const handleDownload = async (pdfUrl, fileName) => {
    try {
      const response = await fetch(pdfUrl);
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
      // Fallback to opening in new tab
      window.open(pdfUrl, "_blank");
    }
  };

  return (
    <div className="allowance-container">
      <section className="allowance-controls">
        <div className="filter-controlRow allowance-controlRow">
          {/* Search, Upload, and Filter Icon Row */}
          <div className="allowance-searchFilterRow">
            <input
              type="search"
              placeholder="Search month, type, file or id..."
              className="filter-search allowance-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search allowances"
            />
            <button
              className="allowance-filterToggleButton"
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

          {/* Upload Button Row */}
          <div className="allowance-uploadRow">
            <button
              className="allowance-uploadButton"
              onClick={() => navigate("/allowance/upload")}
              aria-label="Upload allowance"
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Upload</span>
            </button>
          </div>

          {/* Filter Dropdowns - Shown when filter icon is clicked */}
          {showFilters && (
            <div className="allowance-filtersDropdown">
              <select
                className="filter-select allowance-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Select year"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="filter-select allowance-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Select month"
              >
                {monthsForYear.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Count Section */}
          <div className="filter-countSection allowance-countSection">
            <p className="filter-count allowance-count">
              <span className="filter-countNumber allowance-countNumber">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "allowance" : "allowances"} found
            </p>
          </div>
        </div>
      </section>

      <section className="slip-list allowance-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="slip-empty allowance-empty">
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
            <p>No allowances found for the selected filters.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <article className="slip-item allowance-item" key={item.id}>
              <div className="allowance-itemRow allowance-itemRowFirst">
                <div className="slip-itemIcon allowance-itemIcon">
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
                <div className="allowance-itemContent">
                  <div className="slip-itemTitle allowance-itemTitle">
                    {item.month} - {item.type}
                  </div>
                  <div className="slip-itemMeta allowance-itemMeta">
                    Allowance ID:{" "}
                    <span className="slip-metaValue allowance-metaValue">
                      {item.id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="allowance-itemRow allowance-itemRowSecond">
                <button
                  className="slip-download allowance-download"
                  onClick={() =>
                    handleDownload(
                      item.pdf,
                      `allowance-${item.type.toLowerCase().replace(/\s+/g, "-")}-${item.month}-${item.year}.pdf`
                    )
                  }
                  aria-label={`Download ${item.type} ${item.month}`}
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
