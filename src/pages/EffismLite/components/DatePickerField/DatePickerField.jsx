import "./DatePickerField.css";

export default function DatePickerField({
  id,
  label,
  value,
  onChange,
  formatDisplayValue,
  className = "",
  disabled = false,
}) {
  return (
    <label
      className={`effismLite-field${className ? ` ${className}` : ""}`}
      htmlFor={id}
    >
      <span className="effismLite-fieldLabel">{label}</span>
      <div
        className={`effismLite-pickerField${disabled ? " is-disabled" : ""}`}
      >
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

        <input
          id={id}
          className="effismLite-pickerNativeInput"
          type="date"
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={disabled}
        />
      </div>
    </label>
  );
}
