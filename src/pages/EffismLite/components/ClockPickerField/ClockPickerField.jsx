import { useState } from "react";
import EffismLiteTimeModal from "../EffismLiteTimeModal/EffismLiteTimeModal";
import EffismLiteTimePickerColumns, {
  HOURS_24_LIST,
} from "../EffismLiteTimePickerColumns/EffismLiteTimePickerColumns";
import "./ClockPickerField.css";

export default function ClockPickerField({
  id,
  label,
  className = "",
  value,
  onChange,
  onBlur,
  formatClockInputAsTyped,
  normalizeClockInput,
  placeholder = "00:00",
  disabled = false,
  indicator = null,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftHour, setDraftHour] = useState("00");
  const [draftMinute, setDraftMinute] = useState("00");
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  const displayTime = isEditingTime ? editBuffer : `${value || ""}`;

  const openPicker = () => {
    if (disabled) {
      return;
    }

    const sourceTime = isEditingTime ? editBuffer : `${value || ""}`;
    const matchedValue = `${sourceTime}`.trim().match(/^(\d{1,2})[:.](\d{2})$/);

    if (matchedValue) {
      setDraftHour(String(matchedValue[1]).padStart(2, "0"));
      setDraftMinute(matchedValue[2]);
    } else {
      setDraftHour("00");
      setDraftMinute("00");
    }

    setPickerOpen(true);
  };

  const applyPicker = () => {
    const next = `${draftHour}:${draftMinute}`;
    onChange({
      target: {
        value: next,
      },
    });
    if (isEditingTime) {
      setEditBuffer(next);
    }
    setPickerOpen(false);
  };

  const handleTimeFocus = () => {
    if (disabled) {
      return;
    }
    setIsEditingTime(true);
    setEditBuffer(`${value || ""}`);
  };

  const handleTimeChange = (event) => {
    setEditBuffer(formatClockInputAsTyped(event.target.value));
  };

  const handleTimeBlur = () => {
    const trimmed = editBuffer.trim();
    const normalized = normalizeClockInput(trimmed);
    const committed = normalized || trimmed;
    setIsEditingTime(false);
    onChange({
      target: { value: committed },
    });
    setEditBuffer(committed);
    onBlur();
  };

  return (
    <div className={`effismLite-field${className ? ` ${className}` : ""}`}>
      <div className="effismLite-fieldLabelRow">
        <label className="effismLite-fieldLabel" htmlFor={id}>
          {label}
        </label>
        {indicator}
      </div>
      <div className="effismLite-inputWrap">
        <input
          id={id}
          className="effismLite-input effismLite-timeOnlyInput"
          type="text"
          inputMode="numeric"
          value={displayTime}
          onChange={handleTimeChange}
          onFocus={handleTimeFocus}
          onBlur={handleTimeBlur}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
        />
        <div className="effismLite-inputPickerGlyph">
          <button
            type="button"
            className="effismLite-timePickerIconButton effismLite-inputPickerGlyphButton"
            onClick={openPicker}
            aria-label={`${label} time picker`}
            disabled={disabled}
          >
            <span className="effismLite-timePickerIcon" aria-hidden="true">
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
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v5l3 3"></path>
              </svg>
            </span>
          </button>
        </div>
      </div>

      <EffismLiteTimeModal
        open={pickerOpen}
        title={label}
        onClose={() => setPickerOpen(false)}
        onApply={applyPicker}
      >
        <EffismLiteTimePickerColumns
          hour={draftHour}
          minute={draftMinute}
          hoursList={HOURS_24_LIST}
          onHour={setDraftHour}
          onMinute={setDraftMinute}
        />
      </EffismLiteTimeModal>
    </div>
  );
}
