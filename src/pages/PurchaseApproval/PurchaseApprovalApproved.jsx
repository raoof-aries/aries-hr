import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getApprovedDetails,
  isApprovalAccessDenied,
  getApprovalDeniedMessage,
} from "../../services/purchaseApprovalService";
import { fmtAmount, formatDate } from "../../utils/approvalFormat";
import DatePickerField from "../EffismLite/components/DatePickerField/DatePickerField";
import { formatDateDisplayValue } from "../EffismLite/utils/effismLiteUtils";
import ApprovalAccessDenied from "./components/ApprovalAccessDenied";
import ApprovalLoader from "./components/ApprovalLoader";
import "./PurchaseApproval.css";

function toDateInputValue(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function defaultDateRange() {
  const now = new Date();
  return {
    from: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export default function PurchaseApprovalApproved() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");
  const subdivisionIdParam = searchParams.get("subdivision_id");
  const subdivisionNameParam = searchParams.get("name");

  const [range, setRange] = useState(() => {
    const d = defaultDateRange();
    return {
      from: urlFrom || d.from,
      to: urlTo || d.to,
    };
  });

  const [subdivisionId, setSubdivisionId] = useState(subdivisionIdParam || null);
  const [subdivisionName, setSubdivisionName] = useState(subdivisionNameParam || "");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState("");

  const loadApproved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getApprovedDetails(range.from, range.to, subdivisionId);
      setItems(data || []);
      setAccessDenied(false);
    } catch (err) {
      console.error("Could not load approved list:", err);
      if (isApprovalAccessDenied(err)) {
        setAccessDenied(true);
        setDeniedMessage(getApprovalDeniedMessage(err));
      } else {
        setError(err.message || "Could not load approved requests.");
      }
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, subdivisionId]);

  useEffect(() => {
    loadApproved();
  }, [loadApproved]);

  const clearSubdivisionFilter = () => {
    setSubdivisionId(null);
    setSubdivisionName("");
    const params = new URLSearchParams(searchParams);
    params.delete("subdivision_id");
    params.delete("name");
    setSearchParams(params);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const requestNo = String(item.request_no || "").toLowerCase();
      const subject = String(item.req_id || "").toLowerCase();
      return requestNo.includes(term) || subject.includes(term);
    });
  }, [items, search]);

  const grandTotal = useMemo(() => {
    return (items || []).reduce(
      (sum, r) => sum + Number(r.converted_amount_aed || 0),
      0
    );
  }, [items]);

  if (loading) {
    return <ApprovalLoader />;
  }

  if (accessDenied) {
    return (
      <section className="pa-screen">
        <ApprovalAccessDenied message={deniedMessage} onRetry={loadApproved} />
      </section>
    );
  }

  return (
    <section className="pa-screen">
      {/* Date Range Selector */}
      <div className="pa-date-range-row">
        <DatePickerField
          id="pa-approved-date-from"
          label="From"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          formatDisplayValue={formatDateDisplayValue}
          max={range.to || undefined}
          placeholder="Select from date"
        />
        <DatePickerField
          id="pa-approved-date-to"
          label="To"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          formatDisplayValue={formatDateDisplayValue}
          min={range.from || undefined}
          placeholder="Select to date"
        />
      </div>

      {/* Subdivision Active Filter Badge (if filtered) */}
      {subdivisionName && (
        <div className="pa-filter-pill-row">
          <span className="pa-filter-pill-label">Subdivision:</span>
          <span className="pa-filter-pill">
            {subdivisionName}
            <button
              type="button"
              className="pa-filter-pill-remove"
              onClick={clearSubdivisionFilter}
              title="Remove filter"
            >
              &times;
            </button>
          </span>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="pa-summary-card">
        <div className="pa-summary-col">
          <div className="pa-summary-label">Approved Count</div>
          <div className="pa-summary-value count">{items.length}</div>
        </div>
        <div className="pa-summary-divider" />
        <div className="pa-summary-col">
          <div className="pa-summary-label">Total Amount</div>
          <div className="pa-summary-value amount">
            {fmtAmount(grandTotal)} <small>AED</small>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="pa-search-row">
        <input
          type="search"
          className="pa-search-input"
          placeholder="Search by request no. or subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error state */}
      {error && <div className="pa-notice-banner">{error}</div>}

      {/* Empty state */}
      {!error && filtered.length === 0 && (
        <div className="pa-empty-state">
          <div className="pa-empty-icon">&#128221;</div>
          <p>No approved requests found in this range.</p>
        </div>
      )}

      {/* Kanban Cards List */}
      {filtered.length > 0 && (
        <div className="pa-pending-list">
          {filtered.map((item) => (
            <div className="pa-approved-card" key={item.requesting_id}>
              <div className="pa-approved-card-top">
                <span className="pa-approved-request-no">
                  {item.request_no || "N/A"}
                </span>
                <span className="pa-approved-badge">&#10003; Approved</span>
              </div>

              <div className="pa-approved-subject">{item.req_id}</div>

              <div className="pa-approved-meta">
                <span className="pa-approved-date">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDate(item.management_approval)}
                </span>
              </div>

              <div className="pa-approved-footer">
                <div className="pa-approved-amount">
                  {fmtAmount(item.converted_amount_aed)} <small>AED</small>
                </div>
                <Link
                  className="pa-approved-view-btn"
                  to={`/purchase-approval/action?mode=pwa&id=${item.requesting_id}&code=MANAGEMENT_APPROVAL`}
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
