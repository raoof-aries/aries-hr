import { useEffect, useMemo, useRef, useState } from "react";
import "./EffismLiteSearchableCombo.css";

export default function EffismLiteSearchableCombo({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className = "",
  disabled = false,
  ariaLabel,
}) {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = `${value || ""}`.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) => `${option}`.toLowerCase().includes(query));
  }, [options, value]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  const showMenu = menuOpen && !disabled && filteredOptions.length > 0;

  return (
    <div className={`effismLite-field${className ? ` ${className}` : ""}`}>
      <span className="effismLite-fieldLabel">{label}</span>
      <div className="effismLite-searchComboRoot" ref={rootRef}>
        <div className="effismLite-inputWrap">
          <input
            id={id}
            className="effismLite-input effismLite-inputWithHint"
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => setMenuOpen(true)}
            onBlur={() => {
              setTimeout(() => setMenuOpen(false), 150);
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            aria-label={ariaLabel}
            aria-expanded={showMenu}
            aria-autocomplete="list"
          />
          <button
            type="button"
            className="effismLite-inputGlyphButton"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              if (!disabled) {
                setMenuOpen((current) => !current);
              }
            }}
            aria-label={menuOpen ? "Close options" : "Open options"}
            disabled={disabled}
          >
            <span className="effismLite-inputGlyph" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </span>
          </button>
        </div>

        {showMenu ? (
          <ul className="effismLite-dropdownMenu effismLite-searchComboMenu" role="listbox">
            {filteredOptions.map((option) => (
              <li key={option} role="presentation">
                <button
                  type="button"
                  className="effismLite-dropdownOption"
                  role="option"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onChange({
                      target: { value: option },
                    });
                    setMenuOpen(false);
                  }}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
