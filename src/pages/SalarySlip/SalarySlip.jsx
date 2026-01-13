import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import salaryData from "../../data/salarySlips.json";
import "./SalarySlip.css";

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

export default function SalarySlip() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yrs = Array.from(new Set(salaryData.salarySlips.map((s) => s.year)));
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
    return salaryData.salarySlips
      .filter((s) => s.year === selectedYear)
      .map((s) => s.month)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [selectedYear]);

  const filtered = useMemo(() => {
    let items = salaryData.salarySlips.filter((s) => s.year === selectedYear);

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

  return (
    <main className="container salarySlip-root">
      <div className="salarySlip-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header className="salarySlip-header">
        <button
          className="salarySlip-backButton"
          onClick={() => navigate("/")}
          aria-label="Go back to home"
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="salarySlip-titleGroup">
          <h1 className="salarySlip-title">Salary Slip</h1>
          <p className="salarySlip-sub">
            Select year and month to view your salary slip PDF.
          </p>
        </div>
      </header>

      <section className="salarySlip-controls">
        <div className="salarySlip-controlRow">
          <div className="salarySlip-selectGroup">
            <label className="salarySlip-label" htmlFor="salary-year">
              Year
            </label>
            <select
              id="salary-year"
              className="salarySlip-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="salarySlip-selectGroup">
            <label className="salarySlip-label" htmlFor="salary-month">
              Month
            </label>
            <select
              id="salary-month"
              className="salarySlip-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All months</option>
              {monthsForYear.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="salarySlip-searchGroup">
            <input
              type="search"
              placeholder="Search month, file or id..."
              className="salarySlip-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search salary slips"
            />
          </div>
        </div>
      </section>

      <section className="salarySlip-summary">
        <p className="salarySlip-count">
          <span className="salarySlip-countNumber">{filtered.length}</span>{" "}
          slip(s) found
        </p>
      </section>

      <section className="salarySlip-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="salarySlip-empty">
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
            <article className="salarySlip-item" key={item.id}>
              <div className="salarySlip-itemTop">
                <div className="salarySlip-itemIcon">
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

                <div className="salarySlip-itemLeft">
                  <div className="salarySlip-itemTitle">
                    {item.month} {item.year}
                  </div>
                  <div className="salarySlip-itemMeta">
                    Slip ID:{" "}
                    <span className="salarySlip-metaValue">{item.id}</span>
                  </div>
                </div>
              </div>

              <div className="salarySlip-itemRight">
                <a
                  className="salarySlip-link"
                  href={item.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View
                </a>
                <a
                  className="salarySlip-download"
                  href={item.pdf}
                  download
                  aria-label={`Download salary slip ${item.month} ${item.year}`}
                >
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download
                </a>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
