import { useState } from "react";
import "./EffismLiteCalendar.css";

export default function EffismLiteCalendar({ 
  value, 
  onChange, 
  max, 
  min, 
  showHeader = true,
  viewDate: externalViewDate,
  onViewDateChange
}) {
  const currentDate = value ? new Date(value) : new Date();
  const [internalViewDate, setInternalViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  const viewDate = externalViewDate || internalViewDate;
  const setViewDate = onViewDateChange || setInternalViewDate;

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isPrevDisabled = min && new Date(year, month, 0) < new Date(min);
  const isNextDisabled = max && new Date(year, month + 1, 1) > new Date(max);

  const handleDateClick = (day) => {
    const selectedDate = new Date(year, month, day);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    
    if (max && dateStr > max) return;
    if (min && dateStr < min) return;

    onChange(dateStr);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Fill in empty slots for the first week
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="effismLite-calendarDay is-empty" />);
  }

  // Fill in the actual days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = value === dateStr;
    const isToday = new Date().toISOString().split("T")[0] === dateStr;
    const isDisabled = (max && dateStr > max) || (min && dateStr < min);

    days.push(
      <button
        key={day}
        type="button"
        className={`effismLite-calendarDay${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}${isDisabled ? " is-disabled" : ""}`}
        onClick={() => !isDisabled && handleDateClick(day)}
        disabled={isDisabled}
      >
        {day}
      </button>
    );
  }

  // Fill in empty slots at the end to keep the grid height constant (6 weeks * 7 days = 42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 0; i < remainingCells; i++) {
    days.push(<div key={`empty-end-${i}`} className="effismLite-calendarDay is-empty" />);
  }

  return (
    <div className="effismLite-calendar">
      {showHeader && (
        <div className="effismLite-calendarHeader">
          <div className="effismLite-calendarHeaderNavRow">
            <button 
              type="button" 
              className={`effismLite-calendarNav is-prev ${isPrevDisabled ? "is-disabled" : ""}`} 
              onClick={handlePrevMonth}
              disabled={isPrevDisabled}
              aria-label="Previous month"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <h3 className="effismLite-calendarMonthYear">
              {monthNames[month]} {year}
            </h3>
            
            <button 
              type="button" 
              className={`effismLite-calendarNav is-next ${isNextDisabled ? "is-disabled" : ""}`} 
              onClick={handleNextMonth}
              disabled={isNextDisabled}
              aria-label="Next month"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="effismLite-calendarGrid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
          <div key={day} className="effismLite-calendarWeekday">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
}
