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
  searchable = false,
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      setSearchTerm("");
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

  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.label || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div
      className={`effismLite-dropdownRoot${open && !disabled ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      {searchable && open && !disabled ? (
        <input
          type="text"
          id={id}
          className={`effismLite-dropdownTrigger effismLite-input effismLite-select${triggerClassName ? ` ${triggerClassName}` : ""}`}
          placeholder={displayLabel}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          autoFocus
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setSearchTerm("");
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (filteredOptions.length > 0) {
                onValueChange(filteredOptions[0].value);
                setOpen(false);
                setSearchTerm("");
              }
            }
          }}
        />
      ) : (
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
              setSearchTerm("");
            }
          }}
        >
          {displayLabel}
        </button>
      )}

      {open && !disabled ? (
        <ul
          id={listboxId}
          className={`effismLite-dropdownMenu${menuAlign === "end" ? " is-align-end" : ""}`}
          role="listbox"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
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
                      setSearchTerm("");
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          ) : (
            <li role="presentation">
              <button
                type="button"
                className="effismLite-dropdownOption"
                style={{ opacity: 0.5, cursor: "default" }}
                disabled
              >
                No results found
              </button>
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
