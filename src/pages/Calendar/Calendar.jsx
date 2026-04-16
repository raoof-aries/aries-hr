import { useState } from "react";
import calendarImage from "../../assets/calendar.PNG";
import "./Calendar.css";

const PLACE_OPTIONS = [
  { value: "sharjah", label: "Sharjah" },
  { value: "qatar", label: "Qatar" },
  { value: "kochi", label: "Kochi" },
  { value: "punalur", label: "Punalur" },
  { value: "saudi", label: "Saudi" },
  { value: "oman", label: "Oman" },
  { value: "singapore", label: "Singapore" },
  { value: "bahrain", label: "Bahrain" },
  { value: "goa", label: "Goa" },
  { value: "china", label: "China" },
  { value: "mumbai", label: "Mumbai" },
  { value: "mangalore", label: "Mangalore" },
  { value: "kolkata", label: "Kolkata" },
  { value: "kuwait", label: "Kuwait" },
  { value: "angola", label: "Angola" },
  { value: "batam", label: "Batam" },
];

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) =>
  String(CURRENT_YEAR - 2 + index),
);

const LEGEND_ITEMS = [
  {
    id: "holiday",
    title: "Holiday",
    color: "#d84b57",
    glow: "rgba(216, 75, 87, 0.18)",
  },
  {
    id: "compensatory-working-saturday",
    title: "Compensatory Saturday",
    color: "#1f9b62",
    glow: "rgba(31, 155, 98, 0.18)",
  },
];

const DEFAULT_PLACE = "kochi";

function preventInteraction(event) {
  event.preventDefault();
}

export default function Calendar() {
  const today = new Date();
  const defaultMonth = String(today.getMonth() + 1).padStart(2, "0");
  const defaultYear = YEAR_OPTIONS.includes(String(today.getFullYear()))
    ? String(today.getFullYear())
    : YEAR_OPTIONS[YEAR_OPTIONS.length - 1];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(DEFAULT_PLACE);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const activePlace =
    PLACE_OPTIONS.find((place) => place.value === selectedPlace) ??
    PLACE_OPTIONS[0];
  const activeMonth =
    MONTH_OPTIONS.find((month) => month.value === selectedMonth) ??
    MONTH_OPTIONS[0];

  return (
    <div className="calendarPage">
      <div className="calendarToolbar">
        <div className="calendarToolbarMeta" aria-live="polite">
          <h2 className="calendarToolbarMonth">
            {activeMonth.label} {selectedYear}
            <span className="calendarToolbarPlaceInline">{activePlace.label}</span>
          </h2>
        </div>

        <button
          type="button"
          className="calendarFilterToggle"
          onClick={() => setIsFilterOpen((current) => !current)}
          aria-expanded={isFilterOpen}
          aria-controls="calendar-filter-panel"
          aria-label="Toggle filters"
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
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </button>
      </div>

      {isFilterOpen ? (
        <section
          id="calendar-filter-panel"
          className="calendarPanel"
          aria-label="Calendar filters"
        >
          <div className="calendarFilterGrid">
            <label className="calendarField calendarFieldPlace">
              <span className="calendarFieldLabel">Place</span>
              <select
                className="calendarSelect"
                value={selectedPlace}
                onChange={(event) => setSelectedPlace(event.target.value)}
              >
                {PLACE_OPTIONS.map((place) => (
                  <option key={place.value} value={place.value}>
                    {place.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="calendarField">
              <span className="calendarFieldLabel">Year</span>
              <select
                className="calendarSelect"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="calendarField">
              <span className="calendarFieldLabel">Month</span>
              <select
                className="calendarSelect"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}

      <section className="calendarViewer">
        <figure
          className="calendarImageFrame"
          onContextMenu={preventInteraction}
          aria-label={`${activePlace.label} ${activeMonth.label} ${selectedYear} calendar image`}
        >
          <img
            className="calendarImage"
            src={calendarImage}
            alt={`${activePlace.label} ${activeMonth.label} ${selectedYear} calendar`}
            draggable="false"
            loading="eager"
            onDragStart={preventInteraction}
            onContextMenu={preventInteraction}
          />
          <span className="calendarImageShield" aria-hidden="true"></span>
        </figure>
      </section>

      <section className="calendarLegendSection" aria-label="Calendar legends">
        <div className="calendarLegendGrid">
          <article className="calendarLegendCard">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.id} className="calendarLegendItem">
                <span
                  className="calendarLegendSwatch"
                  style={{
                    "--legend-color": item.color,
                    "--legend-glow": item.glow,
                  }}
                  aria-hidden="true"
                ></span>
                <h3 className="calendarLegendTitle">{item.title}</h3>
              </div>
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}
