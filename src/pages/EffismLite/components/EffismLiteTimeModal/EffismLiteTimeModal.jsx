import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./EffismLiteTimeModal.css";

export default function EffismLiteTimeModal({
  open,
  title,
  onClose,
  onApply,
  children,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="effismLite-modalBackdrop" role="presentation" onClick={onClose}>
      <div
        className="effismLite-modalPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="effismLite-modalHead">
          <span className="effismLite-modalTitle">{title}</span>
          <button
            type="button"
            className="effismLite-modalClose"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="effismLite-modalBody">{children}</div>

        <div className="effismLite-modalActions">
          <button
            type="button"
            className="effismLite-button effismLite-buttonGhost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="effismLite-button effismLite-buttonPrimary"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
