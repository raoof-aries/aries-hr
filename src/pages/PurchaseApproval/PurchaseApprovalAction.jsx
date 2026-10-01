import React, { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getActionContext, submitDecision } from "../../services/purchaseApprovalService";
import { fmtAmount, formatDate, formatDateTime } from "../../utils/approvalFormat";
import Combo from "./components/Combo";
import "./PurchaseApproval.css";

const TABS = [
  { key: "details", label: "Details" },
  { key: "log", label: "Actions Log" },
  { key: "actions", label: "Actions" },
];

const DECISIONS = [
  {
    value: "AP",
    label: "Approve",
    gate: "canApprove",
    theme: "theme-approve",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    value: "CA",
    label: "Cancel",
    theme: "theme-cancel",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
  {
    value: "NC",
    label: "Request for Clarification",
    theme: "theme-clarify",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    value: "AC",
    label: "Approve with CC to Higher Authority",
    gate: "canApproveWithCc",
    theme: "theme-cc",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
  },
  {
    value: "FW",
    label: "Forward To",
    theme: "theme-forward",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  },
  {
    value: "R",
    label: "Reject",
    theme: "theme-reject",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
];

function Row({ label, value }) {
  if (value === null || value === undefined || value === "" || value === 0) return null;
  return (
    <div className="pa-kv-row">
      <span className="pa-kv-label">{label}</span>
      <span className="pa-kv-value">{value}</span>
    </div>
  );
}

function QuoteTable({ heading, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="pa-quote-section">
      <div className="pa-pro-table-heading">{heading}</div>
      <div className="pa-quote-grid">
        {rows.map((q, i) => (
          <div key={i} className="pa-quote-card">
            <div className="pa-quote-card-header">
              <span className="pa-quote-level-name">{q.quote_level || `Quote #${i + 1}`}</span>
              {q.quote_file ? (
                <a
                  href={q.quote_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pa-quote-file-btn"
                  title="View Quote File"
                >
                  <span className="pa-file-glyph">📄</span>
                  <span>Quote File</span>
                </a>
              ) : null}
            </div>

            <div className="pa-quote-card-details">
              <div className="pa-quote-amount-group">
                <span className="pa-quote-amount">{fmtAmount(q.quote_amount)}</span>
                <span className="pa-quote-currency">{q.currency || "AED"}</span>
              </div>
              {q.quote_tax_per && (
                <div className="pa-quote-tax-badge">
                  Tax: <strong>{String(q.quote_tax_per).includes("%") ? q.quote_tax_per : `${q.quote_tax_per}%`}</strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function extraFields(p) {
  return [
    [["ARR", "APR", "CTR"], "Budget Availability", p.budget],
    [["APR", "ARR", "CER"], "Recommended Brand", p.brand],
    [["ARR"], "Type Of Repair", p.repair_type],
    [["ARR"], "Reason for Repair", p.repair_reason],
    [["ARR"], "Incident/Accident Involved", p.inc_acci],
    [["ARR"], "Job Managed Using Existing/Hire Unit", p.job_status],
    [["ARR"], "If Hired - Charges", p.hired_charge],
    [["ARR"], "Insurance Claim Status", p.insurance_status],
    [["CER", "CTR"], "Purpose of Training", p.insurance_status],
    [["ARR"], "Incident Report From", p.inc_report_from],
    [["ARR"], "Corrective/Preventive Action", p.corrective_prevetive],
    [["ARR"], "Who Bears the Cost", p.who_bare_cost],
    [["ARR"], "Discount Obtained for Repair", p.repair_discount],
    [["ARR", "CER"], "Confirmation from Division In-charge", p.div_incharge_confirmation],
    [["ARR", "CER"], "Selected Supplier", p.supplier_name],
    [["APR", "CER"], "Reason for Selecting Supplier", p.supplier_reason],
    [["JSH"], "Selected Subcontractor", p.sub_contractor],
    [["JSH"], "Manpower with Skilled Person Availability", p.skilled_availability],
    [["ARR", "APR", "CTR", "CER", "JSH"], "Discount Obtained by Division", p.discount_by_division],
    [["ARR", "APR", "CTR", "CER", "JSH"], "Discount Obtained by Purchase Division", p.discount_by_purchase_team],
    [["JSH"], "Estimated Hire Days", p.ext_hire_days],
    [["JSH"], "Possibility of Extension", p.extension],
    [["JSH", "APR", "CER", "CTR"], "Payment Terms", p.payment_terms],
    [["JSH", "APR", "CER"], "ICV Status", p.icv_status === "Y" ? "Yes" : p.icv_status ? "No" : ""],
    [["CER", "APR"], "Confirmation from Store", p.confirmation_from_store],
    [["APR", "CER"], "Technical Confirmation", p.tech_confirmation],
    [["CER"], "Certificate Validity", p.certificate_validity],
    [["APR"], "Status of Existing Equipment", p.ext_eqp_status],
    [["APR"], "Projected Income (Next 3 Months)", p.total_project_income],
    [["APR"], "Projects in Hand (6 Months)", p.no_of_projects],
    [["APR"], "Additional Manpower Required", p.additional_man_power],
    [["JSH", "APR", "CER", "CTR"], "Additional Expense Involved", p.additional_exp],
    [["CER"], "Lead Time", p.lead_time],
    [["JSH"], "Evaluated by Division Manager", p.manager_eval],
    [["JSH"], "Confirmation from Division Director", p.confirmation_from_director],
  ];
}

export default function PurchaseApprovalAction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const id = params.get("id");
  const code = params.get("code") || "MANAGEMENT_APPROVAL";

  const [tab, setTab] = useState("actions");
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [decision, setDecision] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [clarifyTo, setClarifyTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getActionContext(id);
      setCtx(data);
    } catch (err) {
      setError(err.message || "Could not load this request.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate("/purchase-approval/pending", { replace: true });
      return;
    }
    load();
  }, [id, load, navigate]);

  if (!id) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!decision) return setError("Please select an action.");
    if ((decision === "FW" || decision === "AC") && !forwardTo) {
      return setError("Please select who to forward this to (pick a name from the list).");
    }
    if (decision === "NC" && (!clarifyTo || clarifyTo === "0")) {
      return setError("Please select who to request clarification from.");
    }
    if (decision === "NC" && !remarks.trim())
      return setError("Remarks are required when requesting clarification.");
    if (decision === "R" && !remarks.trim())
      return setError("Remarks are required when rejecting.");

    setSubmitting(true);
    try {
      const res = await submitDecision({
        requesting_id: Number(ctx.requestingId),
        decision,
        remarks: remarks.trim(),
        forward_to: forwardTo ? Number(forwardTo) : undefined,
        clarify_to: clarifyTo ? Number(clarifyTo) : undefined,
        userName: user?.name || user?.full_name || "Approver",
      });

      const said =
        {
          AP: "Approved.",
          AC: "Approved with CC to higher authority.",
          FW: "Forwarded.",
          CA: "Cancelled.",
          NC: "Clarification requested.",
          R: "Rejected.",
        }[decision] || "Decision recorded.";

      setToastMessage(said);
      setTimeout(() => {
        navigate("/purchase-approval/pending", { replace: true });
      }, 900);
    } catch (err) {
      setError(err.message || "Could not record this decision. Please try again.");
      setSubmitting(false);
    }
  };

  const p = ctx?.purchase || {};
  const a = ctx?.approver || {};
  const cc = p.category_code;
  const alreadyApproved = Number(p.management_approval_status) === 1;

  const monthlyLimit = Number(a.approval_limit_monthly) || 0;
  const pct =
    monthlyLimit > 0
      ? Math.round(((monthlyLimit - Number(ctx?.totalMonthAmount || 0)) / monthlyLimit) * 1000) / 10
      : 0;

  return (
    <section className="pa-screen">
      {/* Tab bar */}
      <div className="pa-tabbar">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {toastMessage && <div className="pa-toast-box">{toastMessage}</div>}

      {loading && (
        <div className="pa-empty-state">
          <p>Loading…</p>
        </div>
      )}

      {!loading && error && (
        <div className="pa-tabpanel">
          <div className="pa-error-banner">{error}</div>
          <button type="button" className="pa-btn pa-btn-primary pa-btn-block" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && ctx && (
        <>
          {/* ========================================================
              ACTIONS TAB
              ======================================================== */}
          {tab === "actions" && (
            <div className="pa-tabpanel">
              <div className="pa-navy-card">
                <div className="pa-navy-header">&#128737; Approval Authority Summary</div>
                <div className="pa-navy-body">
                  <div className="pa-metric-grid">
                    <div className="pa-metric-tile">
                      <div className="pa-m-label">Approval Limit</div>
                      <div className="pa-m-value">
                        {fmtAmount(a.approval_limit)} {a.currency}
                      </div>
                    </div>
                    <div className="pa-metric-tile">
                      <div className="pa-m-label">Monthly Limit</div>
                      <div className="pa-m-value">
                        {fmtAmount(a.approval_limit_monthly)} {a.currency}
                      </div>
                    </div>
                    <div className="pa-metric-tile">
                      <div className="pa-m-label">Used This Month</div>
                      <div className="pa-m-value warn">
                        {fmtAmount(ctx.totalMonthAmount)} {a.currency}
                      </div>
                    </div>
                    <div className="pa-metric-tile">
                      <div className="pa-m-label">Used This Year</div>
                      <div className="pa-m-value warn">
                        {fmtAmount(ctx.totalYearAmount)} {a.currency}
                      </div>
                    </div>
                    <div className="pa-metric-tile">
                      <div className="pa-m-label">Balance (Month)</div>
                      <div className="pa-m-value good">
                        {fmtAmount(ctx.balanceLimit)} {a.currency}
                      </div>
                    </div>
                    <div className="pa-metric-tile">
                      <div className="pa-m-label">Balance %</div>
                      <div className={"pa-m-value " + (pct < 20 ? "bad" : "good")}>{pct}%</div>
                    </div>
                  </div>

                  <div className="pa-fab">
                    <span className="pa-fab-label">Amount Pending Approval</span>
                    <span className="pa-fab-amount">
                      {fmtAmount(p.final_amount)} {p.final_amount_currency}
                    </span>
                  </div>

                  {ctx.discounts && ctx.discounts.length > 0 && (
                    <>
                      <div className="pa-pro-table-wrap">
                        <table className="pa-pro-table">
                          <tbody>
                            <tr>
                              <th>Discount Obtained By</th>
                              <th>Amount</th>
                            </tr>
                            {ctx.discounts.map((d, i) => (
                              <tr key={i}>
                                <td>{d.display_name || d.Name || "Unknown"}</td>
                                <td>{fmtAmount(d.discount_amount)}</td>
                              </tr>
                            ))}
                            <tr className="pa-total-row">
                              <td>Total Discount</td>
                              <td>{fmtAmount(ctx.totalDiscount)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <QuoteTable heading="Comparison Quotes" rows={ctx.quotes} />
                  <QuoteTable heading="Final Quote" rows={ctx.finalQuotes} />
                </div>
              </div>

              {(ctx.priorRemarks || (ctx.finalRemarks && ctx.finalRemarks.length > 0)) && (
                <div className="pa-navy-card">
                  <div className="pa-navy-header">&#128172; General Remarks</div>
                  <div className="pa-navy-body">
                    {ctx.priorRemarks && (
                      <div className="pa-remark-box">
                        {ctx.priorRemarks}
                      </div>
                    )}
                    {ctx.finalRemarks?.map((fr, i) => (
                      <div key={i} className="pa-remark-box">
                        <strong>{fr.full_name}:</strong> {fr.remarks}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alreadyApproved ? (
                <div className="pa-navy-card">
                  <div className="pa-approved-banner">
                    &#10003; Approval has been completed
                  </div>
                </div>
              ) : (
                <div className="pa-navy-card">
                  <div className="pa-navy-header">&#9998; Record Action</div>
                  <div className="pa-navy-body">
                    <form onSubmit={handleSubmit}>
                      <div className="pa-decision-list">
                        {DECISIONS.map((d) => {
                          if (d.gate && !ctx[d.gate]) return null;
                          const isSelected = decision === d.value;
                          return (
                            <button
                              type="button"
                              key={d.value}
                              className={`pa-decision-chip ${d.theme} ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                setDecision(d.value);
                                setError("");
                              }}
                            >
                              <div className="pa-decision-icon">{d.icon}</div>
                              <div className="pa-decision-info">
                                <div className="pa-decision-label">{d.label}</div>
                              </div>
                              <div className="pa-decision-check">
                                <div className="pa-decision-check-dot" />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {(decision === "FW" || decision === "AC") && (
                        <Combo
                          label="Forward to"
                          placeholder="Select approver"
                          options={ctx.forwardTo}
                          value={forwardTo}
                          onChange={setForwardTo}
                        />
                      )}

                      {decision === "NC" && (
                        <Combo
                          label="Need clarification from"
                          placeholder="Select person"
                          options={ctx.needClarification}
                          value={clarifyTo}
                          onChange={setClarifyTo}
                        />
                      )}

                      <label className="pa-field">
                        <span>Remarks (required for Reject / Request for Clarification)</span>
                        <textarea
                          rows="3"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </label>

                      <button
                        type="submit"
                        className="pa-btn pa-btn-primary pa-btn-block"
                        disabled={submitting}
                      >
                        {submitting ? "Submitting…" : "Submit Decision"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              DETAILS TAB
              ======================================================== */}
          {tab === "details" && (
            <div className="pa-tabpanel">
              <div className="pa-pcard">
                <div className="pa-pcard-header">Basic Details</div>
                <div className="pa-pcard-body">
                  <Row label="Request Type" value={p.requesting_for || p.request_type_name} />
                  <Row label="Request Date" value={formatDate(p.requesting_date)} />
                  <Row label="Request Generated" value={formatDateTime(p.created_at)} />
                  <Row label="Request No" value={p.request_no} />
                  <Row label="Requested By" value={p.requested_by_name || p.requester_name} />
                  <Row label="Purchase Category" value={p.request_category} />
                  <Row label="Requirement" value={p.req_id} />
                  <Row label="Expense Category" value={p.expense_category_label} />
                  <Row label="Material Location" value={p.location_name} />
                  <Row label="Subdivision" value={p.subdivision_name} />
                  <Row label="Job No" value={p.job_no} />
                  <Row label="GRN No" value={p.grn_no} />
                  <Row label="Sales Order No" value={p.sales_order_no} />
                  <Row label="Work Order No" value={p.work_order_no} />
                  <Row label="Expected Delivery" value={p.expected_delivery_date} />
                </div>
              </div>

              <div className="pa-pcard">
                <div className="pa-pcard-header">Approval Details</div>
                <div className="pa-pcard-body">
                  <div className="pa-kv-row">
                    <span className="pa-kv-label">Amount</span>
                    <span className="pa-kv-value">
                      {fmtAmount(p.final_amount)} {p.final_amount_currency}
                    </span>
                  </div>
                  <Row label="Requisition With Approval" value={p.requisition_with_approval} />
                  <Row label="Approved By" value={p.approved_by_display} />
                  <Row label="Supplier" value={p.supplier_name} />
                  <Row label="Recommended Supplier" value={p.supplier_remarks} />
                  <Row label="Quote Compare" value={p.quote_compare} />
                  <Row label="Quote Compare Reason" value={p.quote_compare_reason} />
                  <Row
                    label="Discount by Division"
                    value={
                      p.discount_by_division
                        ? `${p.discount_by_division} ${p.discount_by_division_currency || ""}`.trim()
                        : ""
                    }
                  />

                  {extraFields(p).map(([codes, label, value], i) =>
                    codes.includes(cc) && value ? <Row key={i} label={label} value={value} /> : null
                  )}

                  {ctx.split && ctx.split.length > 0 && (
                    <>
                      <div className="pa-kv-row">
                        <span className="pa-kv-label">Split Details</span>
                        <span className="pa-kv-value">{ctx.split.length} categories</span>
                      </div>
                      <div className="pa-pro-table-wrap">
                        <table className="pa-pro-table">
                          <tbody>
                            <tr>
                              <th>Category</th>
                              <th>Amount</th>
                            </tr>
                            {ctx.split.map((s, si) => (
                              <Fragment key={si}>
                                {s.category1_name && (
                                  <tr>
                                    <td>{s.category1_name}</td>
                                    <td>{fmtAmount(s.split_amount1)}</td>
                                  </tr>
                                )}
                              </Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {ctx.attachments && ctx.attachments.length > 0 && (
                <div className="pa-pcard">
                  <div className="pa-pcard-header">Attachments</div>
                  <div className="pa-pcard-body">
                    {ctx.attachments.map((a, i) => (
                      <div key={i} className="pa-attachment-item">
                        <span className="pa-attachment-icon">📎</span>
                        <span className="pa-attachment-title">{a.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {p.description && (
                <div className="pa-pcard">
                  <div className="pa-pcard-header">Requisition Additional Information</div>
                  <div className="pa-pcard-body">
                    <div className="pa-additional-info">{p.description}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              ACTIONS LOG TAB
              ======================================================== */}
          {tab === "log" && (
            <div className="pa-tabpanel">
              {(!ctx.actionsLog || ctx.actionsLog.length === 0) && (
                <div className="pa-empty-state">No actions recorded yet.</div>
              )}
              {ctx.actionsLog?.map((l, i) => (
                <div key={i} className="pa-log-card">
                  <div className="pa-log-header">
                    <span className="pa-log-title">{l.label}</span>
                    <span className="pa-log-badge">{l.status_label}</span>
                  </div>
                  <div className="pa-log-meta">
                    By {l.username} — {formatDateTime(l.created_at)}
                  </div>
                  {l.remarks && (
                    <div className="pa-log-remarks">
                      {l.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
