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
  return i >= 0 ? i + 1 : 0; // 1-based month number
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

  return (
    <main className="container incentiveSlip-root">
      <header className="incentiveSlip-header">
        <h1 className="incentiveSlip-title">Incentive Slip</h1>
        <p className="incentiveSlip-sub">
          View and download your incentive payment slips (PDF).
        </p>
      </header>

      <section className="incentiveSlip-controls">
        <div className="incentiveSlip-controlRow">
          <label className="incentiveSlip-label" htmlFor="incentive-year">
            Year
          </label>
          <select
            id="incentive-year"
            className="incentiveSlip-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <label className="incentiveSlip-label" htmlFor="incentive-month">
            Month
          </label>
          <select
            id="incentive-month"
            className="incentiveSlip-select"
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
            className="incentiveSlip-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search incentive slips"
          />
        </div>
      </section>

      <section className="incentiveSlip-summary">
        <p className="incentiveSlip-count">{filtered.length} slip(s) found</p>
      </section>

      <section className="incentiveSlip-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="incentiveSlip-empty">
            No incentive slips found for the selected filters.
          </div>
        ) : (
          filtered.map((item) => (
            <article className="incentiveSlip-item" key={item.id}>
              <div className="incentiveSlip-itemLeft">
                <div className="incentiveSlip-itemTitle">
                  {item.month}{" "}
                  <span className="incentiveSlip-itemYear">— {item.year}</span>
                </div>
                <div className="incentiveSlip-itemMeta">
                  Slip ID:{" "}
                  <span className="incentiveSlip-metaValue">{item.id}</span>
                </div>
              </div>

              <div className="incentiveSlip-itemRight">
                <a
                  className="incentiveSlip-link"
                  href={item.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View PDF
                </a>
                <a
                  className="incentiveSlip-download"
                  href={item.pdf}
                  download
                  aria-label={`Download incentive slip ${item.month} ${item.year}`}
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
