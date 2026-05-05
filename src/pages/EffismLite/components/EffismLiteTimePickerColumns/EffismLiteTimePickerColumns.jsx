import { useEffect, useRef } from "react";
import "./EffismLiteTimePickerColumns.css";

const MINUTES_LIST = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

export const HOURS_24_LIST = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

export default function EffismLiteTimePickerColumns({
  hour,
  minute,
  hoursList = HOURS_24_LIST,
  onHour,
  onMinute,
}) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  useEffect(() => {
    const hourButton = hourRef.current?.querySelector(".is-selected");
    hourButton?.scrollIntoView({ block: "nearest" });
  }, [hour]);

  useEffect(() => {
    const minuteButton = minuteRef.current?.querySelector(".is-selected");
    minuteButton?.scrollIntoView({ block: "nearest" });
  }, [minute]);

  return (
    <div className="effismLite-timePickerColumns">
      <div className="effismLite-timePickerColumn" ref={hourRef}>
        <span className="effismLite-timePickerColumnLabel">Hour</span>
        <div className="effismLite-timePickerColumnScroll">
          {hoursList.map((item) => (
            <button
              key={item}
              type="button"
              className={`effismLite-timePickerCell${item === hour ? " is-selected" : ""}`}
              onClick={() => onHour(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="effismLite-timePickerColumn" ref={minuteRef}>
        <span className="effismLite-timePickerColumnLabel">Minute</span>
        <div className="effismLite-timePickerColumnScroll">
          {MINUTES_LIST.map((item) => (
            <button
              key={item}
              type="button"
              className={`effismLite-timePickerCell${item === minute ? " is-selected" : ""}`}
              onClick={() => onMinute(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
