import React, { useMemo, useState, useEffect } from "react";
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
  return i >= 0 ? i + 1 : 0; // 1-based month number
}

export default function SalarySlip() {
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

  // Ensure when year changes, month resets to "All"
  useEffect(() => {
    setSelectedMonth("All");
  }, [selectedYear]);

  // months available for selected year
  const monthsForYear = useMemo(() => {
    return salaryData.salarySlips
      .filter((s) => s.year === selectedYear)
      .map((s) => s.month)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  }, [selectedYear]);

  // filtered & sorted list
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

    // sort by month descending (latest first)
    items.sort((a, b) => monthIndex(b.month) - monthIndex(a.month));
    return items;
  }, [selectedYear, selectedMonth, query]);

  return (
    <main className="container salarySlip-root">
      <header className="salarySlip-header">
        <h1 className="salarySlip-title">Salary Slip</h1>
        <p className="salarySlip-sub">
          Select year and month to view your salary slip PDF.
        </p>
      </header>

      <section className="salarySlip-controls">
        <div className="salarySlip-controlRow">
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

          <input
            type="search"
            placeholder="Search month, file or id..."
            className="salarySlip-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search salary slips"
          />
        </div>
      </section>

      <section className="salarySlip-summary">
        <p className="salarySlip-count">{filtered.length} slip(s) found</p>
      </section>

      <section className="salarySlip-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="salarySlip-empty">
            No salary slips found for the selected filters.
          </div>
        ) : (
          filtered.map((item) => (
            <article className="salarySlip-item" key={item.id}>
              <div className="salarySlip-itemLeft">
                <div className="salarySlip-itemTitle">
                  {item.month}{" "}
                  <span className="salarySlip-itemYear">— {item.year}</span>
                </div>
                <div className="salarySlip-itemMeta">
                  Slip ID:{" "}
                  <span className="salarySlip-metaValue">{item.id}</span>
                </div>
              </div>

              <div className="salarySlip-itemRight">
                <a
                  className="salarySlip-link"
                  href={item.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View PDF
                </a>
                <a
                  className="salarySlip-download"
                  href={item.pdf}
                  download
                  aria-label={`Download salary slip ${item.month} ${item.year}`}
                >
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
