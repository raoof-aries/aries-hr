import React, { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getActionContext, submitDecision } from "../../services/purchaseApprovalService";
import { fmtAmount, formatDate, formatDateTime } from "../../utils/approvalFormat";
import Combo from "./components/Combo";
import "./PurchaseApproval.css";

const QUOTE_PREVIEW_BASE = "https://markndget.com/testfile/preview.php?file=";

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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    value: "CA",
    label: "Cancel",
    theme: "theme-cancel",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    value: "AC",
    label: "Approve with CC to Higher Authority",
    gate: "canApproveWithCc",
    theme: "theme-cc",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
      </svg>
    ),
  },
  {
    value: "R",
    label: "Reject",
    theme: "theme-reject",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="pa-pro-table-wrap">
        <table className="pa-pro-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Amount</th>
              <th>Tax %</th>
              <th>Currency</th>
              <th>Quote</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q, i) => (
              <tr key={i}>
                <td>{q.quote_level}</td>
                <td>{q.quote_amount}</td>
                <td>{q.quote_tax_per}</td>
                <td>{q.currency}</td>
                <td>
                  {q.quote_file ? (
                    <a
                      className="pa-quote-file-link"
                      href={QUOTE_PREVIEW_BASE + encodeURIComponent(q.quote_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View Quote File"
                    >
                      📄
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

function LogItem({ log, quotes, finalQuotes, downloadBase }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pa-log-item">
      <div className="pa-log-item-top">
        <span className="pa-log-label">{log.label}</span>
        <span className={`pa-log-status pa-bg-${log.colour}`}>{log.status_label}</span>
      </div>
      <div className="pa-log-meta">
        By {log.username} — {formatDateTime(log.created_at)}
      </div>

      {log.is_quote_row ? (
        <>
          <button
            type="button"
            className="pa-log-toggle"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Show"} Remarks &amp; Quotes
          </button>
          {open && (
            <div className="pa-log-detail">
              {log.remarks && (
                <div
                  className="pa-remarks-box"
                  dangerouslySetInnerHTML={{ __html: log.remarks }}
                />
              )}
              {log.label === "Review Of Quote" && (
                <QuoteTable heading="Comparison Quotes" rows={quotes} />
              )}
              {log.label === "Final Negotiation" && (
                <QuoteTable heading="Final Quote" rows={finalQuotes} />
              )}
            </div>
          )}
        </>
      ) : (
        log.remarks && (
          <div
            className="pa-remarks-box"
            style={{ marginTop: 6 }}
            dangerouslySetInnerHTML={{ __html: log.remarks }}
          />
        )
      )}

      {(log.files || []).map((f, i) => (
        <a
          key={i}
          className="pa-attachment-link"
          href={`${downloadBase}${encodeURIComponent(f.file)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          📎 {f.title}
        </a>
      ))}
    </div>
  );
}

export default function PurchaseApprovalAction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const id = params.get("id");
  const code = params.get("code") || "MANAGEMENT_APPROVAL";
  const mode = params.get("mode") || "pwa";
  const isLegacy = mode === "legacy" || code !== "MANAGEMENT_APPROVAL";

  const [tab, setTab] = useState("actions");
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(!isLegacy);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [frameLoading, setFrameLoading] = useState(isLegacy);

  const [decision, setDecision] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [clarifyTo, setClarifyTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getActionContext(id, code);
      setCtx(data);
    } catch (err) {
      setError(err.message || "Could not load this request.");
    } finally {
      setLoading(false);
    }
  }, [id, code]);

  useEffect(() => {
    if (!id) {
      navigate("/purchase-approval/pending", { replace: true });
      return;
    }
    if (!isLegacy) load();
  }, [id, isLegacy, load, navigate]);

  if (!id) return null;

  if (isLegacy) {
    return (
      <section className="pa-screen">
        {frameLoading && (
          <div className="pa-empty-state">
            <p>Loading…</p>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>This may take a moment</p>
          </div>
        )}
        <iframe
          style={{ width: "100%", height: "80vh", border: "none", borderRadius: "14px" }}
          title="Take Action"
          src={
            "https://purchaseapproval.markndget.com/actions/" +
            encodeURIComponent(id) +
            "/" +
            encodeURIComponent(code)
          }
          onLoad={() => setFrameLoading(false)}
        />
      </section>
    );
  }

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
    if (decision === "NC" && !remarks.trim()) {
      return setError("Remarks are required when requesting clarification.");
    }
    if (decision === "R" && !remarks.trim()) {
      return setError("Remarks are required when rejecting.");
    }

    setSubmitting(true);
    try {
      const body = {
        requesting_id: Number(ctx.requestingId),
        decision,
        remarks: remarks.trim(),
      };
      if (decision === "FW" || decision === "AC") {
        body.forward_to = Number(forwardTo);
      }
      if (decision === "NC") {
        body.clarify_to = Number(clarifyTo);
      }

      await submitDecision(body);

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
      }, 700);
    } catch (err) {
      setError(err.message || "Could not record this decision. Please try again.");
      setSubmitting(false);
    }
  };

  const p = ctx?.purchase || {};
  const a = ctx?.approver || {};
  const cc = p.category_code;
  const alreadyApproved =
    Number(p.management_approval_status) === 1 && ctx?.nextActionCode === "MANAGEMENT_APPROVAL";

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

      {!loading && error && !ctx && (
        <div className="pa-tabpanel">
          <div className="pa-error-banner">{error}</div>
          <button type="button" className="pa-btn pa-btn-primary pa-btn-block" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!loading && ctx && (
        <>
          {/* ========================================================
              ACTIONS TAB
              ======================================================== */}
          {tab === "actions" && (
            <div className="pa-tabpanel">
              {/* Approval Authority Summary */}
              <div className="pa-navy-card">
                <div className="pa-navy-header">🛡 Approval Authority Summary</div>
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
                      {Number(ctx.rate) !== 1 && (
                        <span className="pa-fab-converted"> = {fmtAmount(ctx.aedAmount)} AED</span>
                      )}
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
                      <div className="pa-pro-table-wrap">
                        <table className="pa-pro-table">
                          <tbody>
                            <tr>
                              <th>Initial Quoted Amount</th>
                              <th>Discount Obtained</th>
                              <th>Final Amount</th>
                            </tr>
                            <tr>
                              <td>{fmtAmount(Number(p.final_amount) + Number(ctx.totalDiscount))}</td>
                              <td>{fmtAmount(ctx.totalDiscount)}</td>
                              <td>{fmtAmount(p.final_amount)}</td>
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

              {/* General Remarks */}
              {(ctx.priorRemarks || (ctx.finalRemarks && ctx.finalRemarks.length > 0)) && (
                <div className="pa-navy-card">
                  <div className="pa-navy-header">💬 General Remarks</div>
                  <div className="pa-navy-body">
                    {ctx.priorRemarks && (
                      <div
                        className="pa-remarks-box"
                        dangerouslySetInnerHTML={{ __html: ctx.priorRemarks }}
                      />
                    )}
                    {ctx.finalRemarks?.map((fr, i) => (
                      <div key={i} className="pa-remarks-box">
                        <strong>{fr.full_name}:</strong>{" "}
                        <span dangerouslySetInnerHTML={{ __html: fr.remarks }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Decision Form */}
              {alreadyApproved ? (
                <div className="pa-navy-card">
                  <div className="pa-approval-done">&#10003; Approval has been completed</div>
                </div>
              ) : (
                <div className="pa-navy-card">
                  <div className="pa-navy-header">✎ Record Action</div>
                  <div className="pa-navy-body">
                    <form onSubmit={handleSubmit}>
                      {error && <div className="pa-error-banner">{error}</div>}

                      <div className="pa-decision-list">
                        {DECISIONS.map((d) => {
                          if (d.gate && !ctx[d.gate]) return null;
                          const isSelected = decision === d.value;
                          return (
                            <label
                              key={d.value}
                              className={`pa-action-btn ${d.theme} ${isSelected ? "selected" : ""}`}
                            >
                              <input
                                type="radio"
                                name="rdStatus"
                                value={d.value}
                                checked={isSelected}
                                onChange={() => {
                                  setDecision(d.value);
                                  setError("");
                                }}
                                className="pa-sr-only"
                              />
                              <span className="pa-action-btn-icon">{d.icon}</span>
                              <span className="pa-action-btn-label">{d.label}</span>
                              <span className="pa-action-btn-radio">
                                <span className="pa-action-btn-dot" />
                              </span>
                            </label>
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
              {/* Basic Details */}
              <div className="pa-pcard accent-blue">
                <div className="pa-pcard-header">Basic Details</div>
                <div className="pa-pcard-body">
                  <Row label="Request Type" value={p.requesting_for} />
                  <Row label="Request Date" value={formatDate(p.requesting_date)} />
                  <Row label="Request Generated" value={formatDateTime(p.created_at)} />
                  <Row label="Request No" value={p.request_no} />
                  <Row label="Requested By" value={p.requested_by_name} />
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

              {/* Approval Details */}
              <div className="pa-pcard accent-red">
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
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ctx.split.map((s, si) => (
                              <Fragment key={si}>
                                {s.category1_name && (
                                  <tr>
                                    <td>{s.category1_name}</td>
                                    <td>{fmtAmount(s.split_amount1)}</td>
                                  </tr>
                                )}
                                {s.category2_name && (
                                  <tr>
                                    <td>{s.category2_name}</td>
                                    <td>{fmtAmount(s.split_amount2)}</td>
                                  </tr>
                                )}
                                {s.category3_name && (
                                  <tr>
                                    <td>{s.category3_name}</td>
                                    <td>{fmtAmount(s.split_amount3)}</td>
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

              {/* Attachments */}
              {ctx.attachments && ctx.attachments.length > 0 && (
                <div className="pa-pcard accent-cyan">
                  <div className="pa-pcard-header">Attachments</div>
                  <div className="pa-pcard-body">
                    {ctx.attachments.map((a, i) => (
                      <a
                        key={i}
                        className="pa-attachment-link"
                        href={`${ctx.downloadBase}${encodeURIComponent(a.file)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📎 {a.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Requisition Additional Information */}
              {p.description && (
                <div className="pa-pcard accent-amber">
                  <div className="pa-pcard-header">Requisition Additional Information</div>
                  <div
                    className="pa-pcard-body"
                    dangerouslySetInnerHTML={{ __html: p.description }}
                  />
                </div>
              )}

              {/* PO Details */}
              {(p.lpono || p.lpo_amount) && (
                <div className="pa-pcard accent-amber">
                  <div className="pa-pcard-header">PO Details</div>
                  <div className="pa-pcard-body">
                    <Row label="LPO No" value={p.lpono} />
                    <Row
                      label="LPO Amount"
                      value={
                        p.lpo_amount
                          ? `${p.lpo_amount} ${p.lpo_amount_currency || ""}`.trim()
                          : ""
                      }
                    />
                    <Row label="LPO Generated Date" value={p.lpo_generated_date} />
                  </div>
                </div>
              )}

              {/* Invoice Details */}
              {p.invoice_amount ? (
                <div className="pa-pcard accent-green">
                  <div className="pa-pcard-header">Invoice Details</div>
                  <div className="pa-pcard-body">
                    <div className="pa-kv-row">
                      <span className="pa-kv-label">Invoice Amount</span>
                      <span className="pa-kv-value">
                        {p.invoice_amount} {p.invoice_currency}
                      </span>
                    </div>
                    <Row label="Tax %" value={p.tax_percent ? `${p.tax_percent}%` : ""} />
                    <Row label="Invoice Received" value={p.invoice_recieved_date} />
                  </div>
                </div>
              ) : null}

              {/* Expense Allocation, SAP Entry */}
              {(p.expense_allocated_company || p.ap_invoice) && (
                <div className="pa-pcard accent-cyan">
                  <div className="pa-pcard-header">Expense Allocation, SAP Entry</div>
                  <div className="pa-pcard-body">
                    <Row label="Expense Allocated Company" value={p.expense_allocated_company} />
                    <Row label="AP Invoice" value={p.ap_invoice} />
                    <Row label="AR Invoice No" value={p.ar_invoice} />
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
                <div className="pa-empty-note">No actions recorded yet.</div>
              )}
              {ctx.actionsLog && ctx.actionsLog.length >= 20 && (
                <div className="pa-empty-note">Showing the most recent 20 actions.</div>
              )}
              {ctx.actionsLog?.map((l, i) => (
                <LogItem
                  key={i}
                  log={l}
                  quotes={ctx.quotes}
                  finalQuotes={ctx.finalQuotes}
                  downloadBase={ctx.downloadBase}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
