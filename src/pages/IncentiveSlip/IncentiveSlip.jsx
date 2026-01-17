import React, { useMemo, useState, useEffect } from "react";
import incentiveData from "../../data/incentiveSlips.json";
import "./IncentiveSlip.css";

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

function monthIndex(monthName) {
  const i = MONTHS.indexOf(monthName);
  return i >= 0 ? i + 1 : 0;
}

export default function IncentiveSlip() {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yrs = Array.from(
      new Set(incentiveData.incentiveSlips.map((s) => s.year))
    );
    return yrs.sort((a, b) => b - a);
  }, []);

  const [selectedYear, setSelectedYear] = useState(
    years.includes(currentYear) ? currentYear : years[0] || currentYear
  );
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSelectedMonth("All");
  }, [selectedYear]);

  const monthsForYear = useMemo(() => {
    return incentiveData.incentiveSlips
      .filter((s) => s.year === selectedYear)
      .map((s) => s.month)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [selectedYear]);

  const filtered = useMemo(() => {
    let items = incentiveData.incentiveSlips.filter(
      (s) => s.year === selectedYear
    );

    if (selectedMonth !== "All") {
      items = items.filter((s) => s.month === selectedMonth);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (s) =>
          s.month.toLowerCase().includes(q) ||
          s.pdf.toLowerCase().includes(q) ||
          (s.id && s.id.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => monthIndex(b.month) - monthIndex(a.month));
    return items;
  }, [selectedYear, selectedMonth, query]);

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

  const activeFilters = useMemo(() => {
    const filters = [];
    if (selectedMonth !== "All") {
      filters.push({ type: "month", label: selectedMonth, value: selectedMonth });
    }
    if (query.trim()) {
      filters.push({ type: "search", label: `Search: "${query}"`, value: query });
    }
    return filters;
  }, [selectedMonth, query]);

  const removeFilter = (filterType) => {
    if (filterType === "month") {
      setSelectedMonth("All");
    } else if (filterType === "search") {
      setQuery("");
    }
  };

  return (
    <div className="incentiveSlip-container">
      <section className="incentiveSlip-controls">
        {/* Active Filters Chips */}
        {activeFilters.length > 0 && (
          <div className="filter-chips incentiveSlip-filter-chips">
            {activeFilters.map((filter, index) => (
              <div key={index} className="filter-chip incentiveSlip-filter-chip">
                <span className="filter-chip-label">{filter.label}</span>
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter(filter.type)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <svg
                    width="14"
                    height="14"
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
            ))}
          </div>
        )}

        <div className="filter-controlRow incentiveSlip-controlRow">
          <div className="filter-filtersSection incentiveSlip-filtersSection">
            <select
              className="filter-select incentiveSlip-select"
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
              className="filter-select incentiveSlip-select"
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

            <input
              type="search"
              placeholder="Search month, file or id..."
              className="filter-search incentiveSlip-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search incentive slips"
            />
          </div>

          <div className="filter-countSection incentiveSlip-countSection">
            <p className="filter-count incentiveSlip-count">
              <span className="filter-countNumber incentiveSlip-countNumber">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "slip" : "slips"} found
            </p>
          </div>
        </div>
      </section>

      <section className="slip-list incentiveSlip-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="slip-empty incentiveSlip-empty">
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
            <p>No incentive slips found for the selected filters.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <article className="slip-item incentiveSlip-item" key={item.id}>
              <div className="slip-itemTop incentiveSlip-itemTop">
                <div className="slip-itemIcon incentiveSlip-itemIcon">
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

                <div className="slip-itemLeft incentiveSlip-itemLeft">
                  <div className="slip-itemTitle incentiveSlip-itemTitle">
                    {item.month}
                  </div>
                  <div className="slip-itemMeta incentiveSlip-itemMeta">
                    Slip ID:{" "}
                    <span className="slip-metaValue incentiveSlip-metaValue">
                      {item.id}
                    </span>
                  </div>
                </div>

                <button
                  className="slip-download incentiveSlip-download"
                  onClick={() =>
                    handleDownload(
                      item.pdf,
                      `incentive-slip-${item.month}-${item.year}.pdf`
                    )
                  }
                  aria-label={`Download incentive slip ${item.month}`}
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
