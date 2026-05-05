import { useState } from "react";
import EffismLiteMeridiemPickerColumns from "../EffismLiteMeridiemPickerColumns/EffismLiteMeridiemPickerColumns";
import EffismLiteTimeModal from "../EffismLiteTimeModal/EffismLiteTimeModal";
import "./MeridiemTimeInput.css";

export default function MeridiemTimeInput({
  id,
  label,
  timeValue,
  meridiemValue,
  onTimeChange,
  onMeridiemChange,
  onBlur,
  formatClockInputAsTyped,
  normalizeClockInput,
  className = "",
  defaultPickerTime = "12:00",
  defaultPickerMeridiem = "AM",
  indicator = null,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftHour, setDraftHour] = useState("12");
  const [draftMinute, setDraftMinute] = useState("00");
  const [draftMeridiem, setDraftMeridiem] = useState("AM");
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editBuffer, setEditBuffer] = useState("");

  const displayMeridiem = `${meridiemValue || "AM"}`.toUpperCase();
  const displayTime = isEditingTime ? editBuffer : `${timeValue || ""}`;

  const openPicker = () => {
    const sourceTime = isEditingTime ? editBuffer : `${timeValue || ""}`;
    const matchedTime = `${sourceTime}`.trim().match(/^(\d{1,2})[:.](\d{2})$/);
    const defaultMatchedTime = `${defaultPickerTime || "12:00"}`
      .trim()
      .match(/^(\d{1,2})[:.](\d{2})$/);
    const isUnsetTime =
      !`${sourceTime}`.trim() || normalizeClockInput(`${sourceTime}`.trim()) === "00:00";

    if (isUnsetTime && defaultMatchedTime) {
      const rawHour = defaultMatchedTime[1].padStart(2, "0");
      setDraftHour(rawHour === "00" ? "12" : rawHour);
      setDraftMinute(defaultMatchedTime[2]);
    } else if (matchedTime) {
      const rawHour = matchedTime[1].padStart(2, "0");
      setDraftHour(rawHour === "00" ? "12" : rawHour);
      setDraftMinute(matchedTime[2]);
    } else {
      setDraftHour("12");
      setDraftMinute("00");
    }

    setDraftMeridiem(
      isUnsetTime ? `${defaultPickerMeridiem || "AM"}`.toUpperCase() : displayMeridiem,
    );
    setPickerOpen(true);
  };

  const applyPicker = () => {
    const next = `${draftHour}:${draftMinute}`;
    onTimeChange({
      target: {
        value: next,
      },
    });
    onMeridiemChange({
      target: {
        value: draftMeridiem,
      },
    });
    if (isEditingTime) {
      setEditBuffer(next);
    }
    setPickerOpen(false);
  };

  const handleTimeFocus = () => {
    setIsEditingTime(true);
    setEditBuffer(`${timeValue || ""}`);
  };

  const handleTimeChange = (event) => {
    setEditBuffer(formatClockInputAsTyped(event.target.value));
  };

  const handleTimeBlur = () => {
    const trimmed = editBuffer.trim();
    const normalized = normalizeClockInput(trimmed);
    const committed = normalized || trimmed;
    setIsEditingTime(false);
    onTimeChange({
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
      <div className="effismLite-timeControl">
        <div className="effismLite-timeValueWrap">
          <input
            id={id}
            className="effismLite-timeValue"
            type="text"
            inputMode="numeric"
            value={displayTime}
            onChange={handleTimeChange}
            onFocus={handleTimeFocus}
            onBlur={handleTimeBlur}
            placeholder="00:00"
            autoComplete="off"
          />
          <div className="effismLite-timePickerTrigger">
            <button
              type="button"
              className="effismLite-timePickerIconButton"
              onClick={openPicker}
              aria-label={`${label} time picker`}
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
        <button
          type="button"
          className="effismLite-timeMeridiem"
          onClick={openPicker}
          aria-label={`${label} period ${displayMeridiem}, open time picker`}
        >
          {displayMeridiem}
        </button>
      </div>

      <EffismLiteTimeModal
        open={pickerOpen}
        title={`${label} — time`}
        onClose={() => setPickerOpen(false)}
        onApply={applyPicker}
      >
        <EffismLiteMeridiemPickerColumns
          hour={draftHour}
          minute={draftMinute}
          meridiem={draftMeridiem}
          onHour={setDraftHour}
          onMinute={setDraftMinute}
          onMeridiem={setDraftMeridiem}
        />
      </EffismLiteTimeModal>
    </div>
  );
}
