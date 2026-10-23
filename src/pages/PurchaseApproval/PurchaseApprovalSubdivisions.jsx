import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getApprovalStats,
  isApprovalAccessDenied,
  getApprovalDeniedMessage,
} from "../../services/purchaseApprovalService";
import { fmtAmount } from "../../utils/approvalFormat";
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

export default function PurchaseApprovalSubdivisions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  const [range, setRange] = useState(() => {
    const d = defaultDateRange();
    return {
      from: urlFrom || d.from,
      to: urlTo || d.to,
    };
  });

  const [stats, setStats] = useState({
    approved_amount_aed: 0,
    subdivisions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState("");

  const loadSubdivisions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getApprovalStats(range.from, range.to);
      setStats(data || { approved_amount_aed: 0, subdivisions: [] });
      setAccessDenied(false);
    } catch (err) {
      console.error("Could not load subdivisions:", err);
      if (isApprovalAccessDenied(err)) {
        setAccessDenied(true);
        setDeniedMessage(getApprovalDeniedMessage(err));
      } else {
        setError(err.message || "Could not load subdivision breakdown.");
      }
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    loadSubdivisions();
  }, [loadSubdivisions]);

  const subdivisions = stats?.subdivisions || [];
  const totalApprovedAmount = Number(stats?.approved_amount_aed || 0);

  const filtered = useMemo(() => {
    const list = stats?.subdivisions || [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((s) => {
      const name = String(s.subdivision_name || "Unassigned").toLowerCase();
      return name.includes(term);
    });
  }, [stats?.subdivisions, search]);

  if (loading) {
    return <ApprovalLoader />;
  }

  if (accessDenied) {
    return (
      <section className="pa-screen">
        <ApprovalAccessDenied message={deniedMessage} onRetry={loadSubdivisions} />
      </section>
    );
  }

  const handleSelectSubdivision = (s) => {
    navigate(
      `/purchase-approval/approved?subdivision_id=${
        s.subdivision_id ?? ""
      }&name=${encodeURIComponent(
        s.subdivision_name || "Unassigned"
      )}&from=${range.from}&to=${range.to}`
    );
  };

  return (
    <section className="pa-screen">
      {/* Date Range Selector */}
      <div className="pa-date-range-row">
        <DatePickerField
          id="pa-subdiv-date-from"
          label="From"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          formatDisplayValue={formatDateDisplayValue}
          max={range.to || undefined}
          placeholder="Select from date"
        />
        <DatePickerField
          id="pa-subdiv-date-to"
          label="To"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          formatDisplayValue={formatDateDisplayValue}
          min={range.from || undefined}
          placeholder="Select to date"
        />
      </div>

      {/* KPI Overview Banner */}
      <div className="pa-summary-card">
        <div className="pa-summary-col">
          <div className="pa-summary-label">Subdivisions</div>
          <div className="pa-summary-value count">{subdivisions.length}</div>
        </div>
        <div className="pa-summary-divider" />
        <div className="pa-summary-col">
          <div className="pa-summary-label">Approved Total</div>
          <div className="pa-summary-value amount">
            {fmtAmount(totalApprovedAmount)} <small>AED</small>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="pa-search-row">
        <input
          type="search"
          className="pa-search-input"
          placeholder="Search subdivision name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error state */}
      {error && <div className="pa-notice-banner">{error}</div>}

      {/* Empty state */}
      {!error && filtered.length === 0 && (
        <div className="pa-empty-state">
          <div className="pa-empty-icon">&#128194;</div>
          <p>No subdivisions with approved requests in this range.</p>
        </div>
      )}

      {/* Kanban Cards Grid */}
      {filtered.length > 0 && (
        <div className="pa-pending-list">
          {filtered.map((s) => {
            const amount = Number(s.total_amount || 0);
            const share =
              totalApprovedAmount > 0
                ? Math.round((amount / totalApprovedAmount) * 1000) / 10
                : 0;

            return (
              <div
                className="pa-subdiv-kanban-card"
                key={s.subdivision_id ?? "unassigned"}
                onClick={() => handleSelectSubdivision(s)}
              >
                <div className="pa-subdiv-kanban-top">
                  <div className="pa-subdiv-kanban-title">
                    {s.subdivision_name || "Unassigned"}
                  </div>
                  <span className="pa-subdiv-share-pill">{share}%</span>
                </div>

                <div className="pa-subdiv-kanban-footer">
                  <div className="pa-subdiv-kanban-amount">
                    {fmtAmount(s.total_amount)} <small>AED</small>
                  </div>
                  <button
                    type="button"
                    className="pa-subdiv-kanban-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSubdivision(s);
                    }}
                  >
                    View Requests &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
