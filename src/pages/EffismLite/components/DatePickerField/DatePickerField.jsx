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
        title={label}
        onClose={() => setPickerOpen(false)}
        onApply={() => setPickerOpen(false)}
      >
        <EffismLiteCalendar
          value={value}
          onChange={handleDateSelect}
          max={max}
          min={min}
        />
      </EffismLiteTimeModal>
    </div>
  );
}
