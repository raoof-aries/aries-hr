import { useState } from "react";
import EffismLiteTimeModal from "../EffismLiteTimeModal/EffismLiteTimeModal";
import EffismLiteCalendar from "../EffismLiteCalendar/EffismLiteCalendar";
import "./DatePickerField.css";

export default function DatePickerField({
  id,
  label,
  value,
  onChange,
  formatDisplayValue,
  className = "",
  disabled = false,
  indicator = null,
  max,
  min,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const isPrevDisabled = min && new Date(year, month, 0) < new Date(min);
  const isNextDisabled = max && new Date(year, month + 1, 1) > new Date(max);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const modalHeader = (
    <div className="effismLite-calendarHeaderNavRow" style={{ width: '100%' }}>
      <button 
        type="button" 
        className={`effismLite-calendarNav is-prev ${isPrevDisabled ? "is-disabled" : ""}`} 
        onClick={handlePrevMonth}
        disabled={isPrevDisabled}
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
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );

  const openPicker = () => {
    if (!disabled) {
      setPickerOpen(true);
    }
  };

  const handleDateSelect = (dateStr) => {
    onChange({
      target: {
        value: dateStr,
      },
    });
    setPickerOpen(false);
  };

  return (
    <div className={`effismLite-field${className ? ` ${className}` : ""}`}>
      <div className="effismLite-fieldLabelRow">
        <label className="effismLite-fieldLabel" htmlFor={id}>
          {label}
        </label>
        {indicator}
      </div>
      <div className={`effismLite-pickerField${disabled ? " is-disabled" : ""}`} onClick={openPicker}>
        <span className="effismLite-pickerValue">{formatDisplayValue(value)}</span>

        <span className="effismLite-pickerIcon" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 2v4"></path>
            <path d="M16 2v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18"></path>
          </svg>
        </span>
      </div>

      <EffismLiteTimeModal
        open={pickerOpen}
        title={modalHeader}
        onClose={() => setPickerOpen(false)}
        onApply={() => setPickerOpen(false)}
      >
        <EffismLiteCalendar
          value={value}
          onChange={handleDateSelect}
          max={max}
          min={min}
          showHeader={false}
          viewDate={viewDate}
          onViewDateChange={setViewDate}
        />
      </EffismLiteTimeModal>
    </div>
  );
}
