import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getApprovalStats,
  ssoLogin,
  getToken,
} from "../../services/purchaseApprovalService";
import { fmtAmount } from "../../utils/approvalFormat";
import DatePickerField from "../EffismLite/components/DatePickerField/DatePickerField";
import { formatDateDisplayValue } from "../EffismLite/utils/effismLiteUtils";
// import NotifyToggle from "./components/NotifyToggle";
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
  const [searchParams] = useSearchParams();

  const [range, setRange] = useState(defaultDateRange);
  const [stats, setStats] = useState({
    pending_total: 0,
    approved_count: 0,
    approved_amount_aed: 0,
    approval_limit_monthly: 0,
    subdivisions: [],
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setNotice("");

    // Check for SSO handoff parameters in URL
    const employeeId = searchParams.get("employee_id");
    const ts = searchParams.get("ts");
    const sig = searchParams.get("sig");

    if (employeeId && ts && sig) {
      try {
        await ssoLogin(employeeId, ts, sig);
        // Clean URL parameters once processed
        window.history.replaceState(
          {},
          "",
          window.location.pathname + window.location.hash
        );
      } catch (err) {
        setNotice(err.message || "SSO link expired or invalid.");
      }
    }

    try {
      const res = await getApprovalStats(range.from, range.to);
      setStats(res || {
        pending_total: 0,
        approved_count: 0,
        approved_amount_aed: 0,
        approval_limit_monthly: 0,
        subdivisions: [],
      });
    } catch (err) {
      if (err.status === 401) {
        setNotice(
          "Approval session not active. Launch with an active SSO link to authenticate."
        );
      } else if (err.status === 403) {
        setNotice(err.message || "This account is not authorized as a management approver.");
      } else {
        setNotice(err.message || "Could not load approval dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, [range, searchParams]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <section className="pa-screen">
      {/* Date range row using HRMS DatePickerField */}
      <div className="pa-date-range-row">
        <DatePickerField
          id="pa-date-from"
          label="From"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          formatDisplayValue={formatDateDisplayValue}
          max={range.to || undefined}
          placeholder="Select from date"
        />
        <DatePickerField
          id="pa-date-to"
          label="To"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          formatDisplayValue={formatDateDisplayValue}
          min={range.from || undefined}
          placeholder="Select to date"
        />
      </div>

      {notice && <div className="pa-notice-banner">{notice}</div>}

      {/* Top 2 Count KPI Tiles */}
      <div className="pa-kpi-row">
        <button
          type="button"
          className="pa-kpi-card is-pending"
          onClick={() => navigate("/purchase-approval/pending")}
        >
          <div className="pa-kpi-card-header">
            <span className="pa-kpi-card-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Pending
            </span>
            <span className="pa-kpi-card-arrow">&rarr;</span>
          </div>
          <div className="pa-kpi-card-value">{stats.pending_total || 0}</div>
          <div className="pa-kpi-card-subtitle">Awaiting Your Action</div>
        </button>

        <button
          type="button"
          className="pa-kpi-card is-approved"
          onClick={() =>
            navigate(`/purchase-approval/approved?from=${range.from}&to=${range.to}`)
          }
        >
          <div className="pa-kpi-card-header">
            <span className="pa-kpi-card-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Approved
            </span>
            <span className="pa-kpi-card-arrow">&rarr;</span>
          </div>
          <div className="pa-kpi-card-value">{stats.approved_count || 0}</div>
          <div className="pa-kpi-card-subtitle">In Selected Period</div>
        </button>
      </div>

      {/* Hero Monthly Limit vs. Approved Spend Card with Progress Bar */}
      {(() => {
        const monthlyLimit = Number(stats.approval_limit_monthly || 0);
        const approvedAmount = Number(stats.approved_amount_aed || 0);
        const utilizationPct =
          monthlyLimit > 0
            ? Math.round((approvedAmount / monthlyLimit) * 1000) / 10
            : 0;
        const isOverLimit = monthlyLimit > 0 && approvedAmount > monthlyLimit;

        return (
          <div
            className="pa-limit-progress-card"
            onClick={() =>
              navigate(`/purchase-approval/approved?from=${range.from}&to=${range.to}`)
            }
          >
            <div className="pa-limit-card-header">
              <div className="pa-limit-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Monthly Spend vs Limit
              </div>
              <span className={`pa-limit-pill ${isOverLimit ? "is-exceeded" : "is-healthy"}`}>
                {isOverLimit ? `⚠️ ${utilizationPct}% Exceeded` : `${utilizationPct}% Used`}
              </span>
            </div>

            <div className="pa-limit-amounts-row">
              <div className="pa-limit-amount-col">
                <span className="pa-limit-amount-label">Approved Spend</span>
                <span className="pa-limit-amount-val is-approved">
                  {fmtAmount(approvedAmount)} <small>{stats.currency || "AED"}</small>
                </span>
              </div>
              <div className="pa-limit-amount-divider">/</div>
              <div className="pa-limit-amount-col">
                <span className="pa-limit-amount-label">Monthly Limit</span>
                <span className="pa-limit-amount-val is-cap">
                  {fmtAmount(monthlyLimit)} <small>{stats.currency || "AED"}</small>
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="pa-limit-bar-track">
              <div
                className={`pa-limit-bar-fill ${isOverLimit ? "is-exceeded" : "is-healthy"}`}
                style={{ width: `${Math.min(utilizationPct, 100)}%` }}
              />
            </div>

            <div className="pa-limit-card-footer">
              <span>View full approved requests ledger</span>
              <span className="pa-limit-footer-arrow">&rarr;</span>
            </div>
          </div>
        );
      })()}

      {/* Subdivision breakdown */}
      {stats.subdivisions && stats.subdivisions.length > 0 && (
        <div className="pa-subdiv-section">
          <div className="pa-subdiv-section-header">
            <div className="pa-subdiv-section-title">Subdivision Breakdown (AED)</div>
            <button
              type="button"
              className="pa-subdiv-view-all-btn"
              onClick={() =>
                navigate(
                  `/purchase-approval/subdivisions?from=${range.from}&to=${range.to}`
                )
              }
            >
              View All &rarr;
            </button>
          </div>
          <div className="pa-subdiv-grid">
            {(() => {
              const totalApproved = Number(stats.approved_amount_aed || 0);

              return stats.subdivisions.map((s) => {
                const amount = Number(s.total_amount || 0);
                const share =
                  totalApproved > 0
                    ? Math.round((amount / totalApproved) * 1000) / 10
                    : 0;

                return (
                  <button
                    key={s.subdivision_id ?? "unassigned"}
                    type="button"
                    className="pa-subdiv-tile"
                    onClick={() =>
                      navigate(
                        `/purchase-approval/approved?subdivision_id=${
                          s.subdivision_id ?? ""
                        }&name=${encodeURIComponent(
                          s.subdivision_name || "Unassigned"
                        )}&from=${range.from}&to=${range.to}`
                      )
                    }
                  >
                    <div className="pa-subdiv-tile-top">
                      <span className="pa-subdiv-name">
                        {s.subdivision_name || "Unassigned"}
                      </span>
                      <span className="pa-subdiv-share-tag">{share}%</span>
                    </div>
                    <div className="pa-subdiv-value">
                      {fmtAmount(s.total_amount)} <small>AED</small>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
