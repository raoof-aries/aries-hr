import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApprovalStats } from "../../services/purchaseApprovalService";
import { fmtAmount } from "../../utils/approvalFormat";
import DetailsModal from "./components/DetailsModal";
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

export default function PurchaseApproval() {
  const navigate = useNavigate();

  const [range, setRange] = useState(defaultDateRange);
  const [stats, setStats] = useState({
    pending_total: 0,
    approved_count: 0,
    approved_amount_aed: 0,
    approval_limit_monthly: 500000,
    subdivisions: [],
  });
  const [modal, setModal] = useState(null); // { subdivisionId, title } | null

  const loadDashboard = useCallback(async () => {
    try {
      const res = await getApprovalStats(range.from, range.to);
      setStats(res);
    } catch (err) {
      console.error("Could not load dashboard:", err);
    }
  }, [range]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <section className="pa-screen">
      {/* Date range row */}
      <div className="pa-date-range-row">
        <label className="pa-date-range-field">
          <span>From</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          />
        </label>
        <label className="pa-date-range-field">
          <span>To</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          />
        </label>
      </div>

      {/* Stats row: 3 tiles side-by-side */}
      <div className="pa-stats-row">
        <button
          type="button"
          className="pa-stat-tile accent-navy"
          onClick={() => navigate("/purchase-approval/pending")}
        >
          <div className="pa-stat-tile-value">{stats.pending_total || 0}</div>
          <div className="pa-stat-tile-label">Purchase Approval Pending</div>
        </button>
        <button
          type="button"
          className="pa-stat-tile accent-green"
          onClick={() =>
            setModal({ subdivisionId: null, title: "Approved Requests" })
          }
        >
          <div className="pa-stat-tile-value">{stats.approved_count || 0}</div>
          <div className="pa-stat-tile-label">Total Approved</div>
        </button>
        <button
          type="button"
          className="pa-stat-tile accent-teal"
          onClick={() =>
            setModal({ subdivisionId: null, title: "Approved Requests" })
          }
        >
          <div className="pa-stat-tile-value">
            {fmtAmount(stats.approved_amount_aed || 0)}
          </div>
          <div className="pa-stat-tile-label">Approved Amount (AED)</div>
        </button>
      </div>

      {/* Limit card */}
      <div className="pa-limit-card">
        <div className="pa-limit-row">
          <span>Monthly limit</span>
          <strong>
            {typeof stats.approval_limit_monthly !== "undefined"
              ? `${fmtAmount(stats.approval_limit_monthly)} ${stats.currency || "AED"}`
              : "-"}
          </strong>
        </div>
      </div>

      {/* Subdivision breakdown */}
      {stats.subdivisions && stats.subdivisions.length > 0 && (
        <div className="pa-subdiv-section">
          <div className="pa-subdiv-section-title">Subdivision Breakdown (AED)</div>
          <div className="pa-subdiv-grid">
            {stats.subdivisions.map((s) => (
              <button
                key={s.subdivision_id ?? "unassigned"}
                type="button"
                className="pa-subdiv-tile"
                onClick={() =>
                  setModal({
                    subdivisionId: s.subdivision_id,
                    title: s.subdivision_name || "Unassigned",
                  })
                }
              >
                <div className="pa-subdiv-name">
                  {s.subdivision_name || "Unassigned"}
                </div>
                <div className="pa-subdiv-value">
                  {fmtAmount(s.total_amount)} <small>AED</small>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <DetailsModal
          title={modal.title}
          subdivisionId={modal.subdivisionId}
          from={range.from}
          to={range.to}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
