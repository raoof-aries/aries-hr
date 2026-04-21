import { useEffect, useId, useRef, useState } from "react";
import "./EffismLiteDropdown.css";

export default function EffismLiteDropdown({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuAlign = "stretch",
  ariaLabel,
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const showPlaceholder = selectedOption === undefined;

  return (
    <div
      className={`effismLite-dropdownRoot${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className={`effismLite-dropdownTrigger effismLite-input effismLite-select${triggerClassName ? ` ${triggerClassName}` : ""}${showPlaceholder ? " is-placeholder" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        {displayLabel}
      </button>

      {open && !disabled ? (
        <ul
          id={listboxId}
          className={`effismLite-dropdownMenu${menuAlign === "end" ? " is-align-end" : ""}`}
          role="listbox"
        >
          {options.map((option) => {
            const isActive = option.value === value;

            return (
              <li key={`${option.value}`} role="presentation">
                <button
                  type="button"
                  className={`effismLite-dropdownOption${isActive ? " is-selected" : ""}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
