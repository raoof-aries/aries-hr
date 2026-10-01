import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Combo({ label, placeholder, options = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => String(o.user_id) === String(value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.full_name || "").toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  return (
    <div className="pa-combo-field" ref={rootRef}>
      {label && <label className="pa-field-label">{label}</label>}
      <div
        className={"pa-s2-select" + (open ? " open" : "")}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className={"pa-s2-selection-text" + (selected ? "" : " placeholder")}>
          {selected ? selected.full_name : placeholder}
        </span>
        <span className="pa-s2-arrow">▼</span>
      </div>

      {open && (
        <div className="pa-s2-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="pa-s2-search"
            placeholder="Search by name..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="pa-s2-results" role="listbox">
            {filtered.length === 0 && <div className="pa-combo-empty">No matching approvers</div>}
            {filtered.map((o) => (
              <div
                key={o.user_id}
                role="option"
                aria-selected={String(o.user_id) === String(value)}
                className={"pa-combo-item" + (String(o.user_id) === String(value) ? " active" : "")}
                onClick={() => {
                  onChange(String(o.user_id));
                  setOpen(false);
                  setQuery("");
                }}
              >
                {o.full_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
