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

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.dataset.disablePullRefresh = "true";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      delete document.body.dataset.disablePullRefresh;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.paddingRight = previousPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="effismLite-modalBackdrop"
      role="presentation"
      onClick={onClose}
      data-disable-pull-refresh
    >
      <div
        className="effismLite-modalPanel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        data-disable-pull-refresh
      >
        <div className="effismLite-modalHead">
          <div className="effismLite-modalTitleContainer">
            {typeof title === "string" ? (
              <span className="effismLite-modalTitle">{title}</span>
            ) : (
              title
            )}
          </div>
          <button
            type="button"
            className="effismLite-modalClose"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="effismLite-modalBody" data-disable-pull-refresh>{children}</div>

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
