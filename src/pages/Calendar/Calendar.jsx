import { useState } from "react";
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
    description: "Marked in red on the calendar image.",
    color: "#d84b57",
    glow: "rgba(216, 75, 87, 0.18)",
  },
  {
    id: "compensatory-working-saturday",
    title: "Compensatory Working Saturday",
    description: "Marked in green on the calendar image.",
    color: "#1f9b62",
    glow: "rgba(31, 155, 98, 0.18)",
  },
];

const CALENDAR_IMAGE_MAP = {
  // Add final image paths here when the month assets are available.
  // Example:
  // "kochi-2026-04": "/calendars/kochi/2026/04.webp",
};

function buildCalendarKey(place, year, month) {
  return `${place}-${year}-${month}`;
}

function preventInteraction(event) {
  event.preventDefault();
}

function buildPlaceholderImage(placeLabel, monthLabel, year) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 48 1200 1160" role="img" aria-label="${placeLabel} ${monthLabel} ${year} calendar preview">
      <defs>
        <linearGradient id="header" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f5b55" />
          <stop offset="100%" stop-color="#014342" />
        </linearGradient>
      </defs>
      <g>
        <rect x="118" y="48" width="964" height="248" rx="28" fill="url(#header)" />
        <rect x="118" y="224" width="964" height="72" fill="#0a3836" />

        <circle cx="260" cy="70" r="18" fill="#d7e4e2" />
        <circle cx="940" cy="70" r="18" fill="#d7e4e2" />
        <rect x="228" y="42" width="64" height="150" rx="24" fill="#c7d6d3" />
        <rect x="908" y="42" width="64" height="150" rx="24" fill="#c7d6d3" />

        <text x="154" y="144" fill="#ffffff" font-size="78" font-family="Open Sans, Segoe UI, Arial, sans-serif" font-weight="700" letter-spacing="2">
          ${placeLabel.toUpperCase()}
        </text>
        <text x="154" y="214" fill="#dfeceb" font-size="44" font-family="Open Sans, Segoe UI, Arial, sans-serif">
          ${monthLabel} ${year}
        </text>

        <g fill="#ffffff" opacity="0.88" font-size="28" font-family="Open Sans, Segoe UI, Arial, sans-serif" font-weight="700" text-anchor="middle">
          <text x="186" y="274">S</text>
          <text x="322" y="274">M</text>
          <text x="458" y="274">T</text>
          <text x="594" y="274">W</text>
          <text x="730" y="274">T</text>
          <text x="866" y="274">F</text>
          <text x="1002" y="274">S</text>
        </g>

        <g stroke="#b7cdca" stroke-width="6" fill="#ffffff">
          <rect x="124" y="332" width="952" height="876" rx="18" />
          <line x1="124" y1="478" x2="1076" y2="478" />
          <line x1="124" y1="624" x2="1076" y2="624" />
          <line x1="124" y1="770" x2="1076" y2="770" />
          <line x1="124" y1="916" x2="1076" y2="916" />
          <line x1="124" y1="1062" x2="1076" y2="1062" />
          <line x1="260" y1="332" x2="260" y2="1208" />
          <line x1="396" y1="332" x2="396" y2="1208" />
          <line x1="532" y1="332" x2="532" y2="1208" />
          <line x1="668" y1="332" x2="668" y2="1208" />
          <line x1="804" y1="332" x2="804" y2="1208" />
          <line x1="940" y1="332" x2="940" y2="1208" />
        </g>

        <g fill="#d84b57">
          <rect x="144" y="352" width="104" height="104" rx="14" />
          <rect x="688" y="936" width="104" height="104" rx="14" />
        </g>

        <g fill="#1f9b62">
          <rect x="416" y="498" width="104" height="104" rx="14" />
          <rect x="960" y="790" width="104" height="104" rx="14" />
        </g>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function Calendar() {
  const today = new Date();
  const defaultMonth = String(today.getMonth() + 1).padStart(2, "0");
  const defaultYear = YEAR_OPTIONS.includes(String(today.getFullYear()))
    ? String(today.getFullYear())
    : YEAR_OPTIONS[YEAR_OPTIONS.length - 1];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(PLACE_OPTIONS[0].value);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [failedCalendarKey, setFailedCalendarKey] = useState("");

  const activePlace =
    PLACE_OPTIONS.find((place) => place.value === selectedPlace) ??
    PLACE_OPTIONS[0];
  const activeMonth =
    MONTH_OPTIONS.find((month) => month.value === selectedMonth) ??
    MONTH_OPTIONS[0];
  const calendarKey = buildCalendarKey(
    selectedPlace,
    selectedYear,
    selectedMonth,
  );
  const configuredImageSrc = CALENDAR_IMAGE_MAP[calendarKey];
  const hasImageError = failedCalendarKey === calendarKey;
  const placeholderImageSrc = buildPlaceholderImage(
    activePlace.label,
    activeMonth.label,
    selectedYear,
  );
  const imageSrc =
    configuredImageSrc && !hasImageError ? configuredImageSrc : placeholderImageSrc;

  return (
    <div className="calendarPage">
      <div className="calendarToolbar">
        <button
          type="button"
          className="calendarFilterToggle"
          onClick={() => setIsFilterOpen((current) => !current)}
          aria-expanded={isFilterOpen}
          aria-controls="calendar-filter-panel"
        >
          <span>{isFilterOpen ? "Hide Filters" : "Show Filters"}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18"></path>
            <path d="M6 12h12"></path>
            <path d="M10 18h4"></path>
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
            src={imageSrc}
            alt={`${activePlace.label} ${activeMonth.label} ${selectedYear} calendar`}
            draggable="false"
            loading="eager"
            onDragStart={preventInteraction}
            onContextMenu={preventInteraction}
            onError={() => setFailedCalendarKey(calendarKey)}
          />
          <span className="calendarImageShield" aria-hidden="true"></span>
        </figure>
      </section>

      <section className="calendarLegendSection" aria-label="Calendar legends">
        <div className="calendarLegendGrid">
          {LEGEND_ITEMS.map((item) => (
            <article key={item.id} className="calendarLegendCard">
              <span
                className="calendarLegendSwatch"
                style={{
                  "--legend-color": item.color,
                  "--legend-glow": item.glow,
                }}
                aria-hidden="true"
              ></span>
              <div className="calendarLegendContent">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
