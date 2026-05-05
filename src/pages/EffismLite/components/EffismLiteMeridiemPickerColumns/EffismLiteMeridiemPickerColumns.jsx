import { useEffect, useRef } from "react";
import "./EffismLiteMeridiemPickerColumns.css";

const HOURS_12_LIST = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const MINUTES_LIST = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const MERIDIEM_OPTIONS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

export default function EffismLiteMeridiemPickerColumns({
  hour,
  minute,
  meridiem,
  onHour,
  onMinute,
  onMeridiem,
}) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const meridiemRef = useRef(null);

  useEffect(() => {
    hourRef.current?.querySelector(".is-selected")?.scrollIntoView({
      block: "nearest",
    });
  }, [hour]);

  useEffect(() => {
    minuteRef.current?.querySelector(".is-selected")?.scrollIntoView({
      block: "nearest",
    });
  }, [minute]);

  useEffect(() => {
    meridiemRef.current?.querySelector(".is-selected")?.scrollIntoView({
      block: "nearest",
    });
  }, [meridiem]);

  return (
    <div className="effismLite-timePickerColumns effismLite-timePickerColumnsTriple">
      <div className="effismLite-timePickerColumn" ref={hourRef}>
        <span className="effismLite-timePickerColumnLabel">Hour</span>
        <div className="effismLite-timePickerColumnScroll">
          {HOURS_12_LIST.map((item) => (
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

      <div className="effismLite-timePickerColumn" ref={meridiemRef}>
        <span className="effismLite-timePickerColumnLabel">Period</span>
        <div className="effismLite-timePickerColumnScroll">
          {MERIDIEM_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`effismLite-timePickerCell${item.value === meridiem ? " is-selected" : ""}`}
              onClick={() => onMeridiem(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
