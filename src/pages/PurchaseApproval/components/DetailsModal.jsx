import React, { useEffect, useState } from "react";
import { getApprovedDetails } from "../../../services/purchaseApprovalService";
import { fmtAmount, truncate, formatDate } from "../../../utils/approvalFormat";

export default function DetailsModal({ title, subdivisionId, from, to, onClose }) {
  const [rows, setRows] = useState(null); // null = loading
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");

    getApprovedDetails(from, to, subdivisionId)
      .then((data) => {
        if (!cancelled) setRows(data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load details.");
      });

    return () => {
      cancelled = true;
    };
  }, [subdivisionId, from, to]);

  const grandTotal = (rows || []).reduce(
    (sum, r) => sum + Number(r.converted_amount_aed || 0),
    0
  );

  return (
    <div
      className="pa-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pa-sheet details-sheet">
        <div className="pa-sheet-header">
          <h3>{title}</h3>
          <button
            className="icon-btn"
            style={{
              background: "#f1f5f9",
              border: "none",
              color: "#64748b",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              fontSize: "18px",
              cursor: "pointer",
            }}
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="pa-details-modal-body">
          <div className="pa-modal-total-card">
            <span className="pa-modal-total-label">Grand Total</span>
            <span className="pa-modal-total-value">
              {rows ? `${fmtAmount(grandTotal)} AED` : "-"}
            </span>
          </div>

          <div className="pa-details-list">
            {(rows || []).map((r) => (
              <div key={r.requesting_id} className="pa-details-card">
                <div className="pa-details-card-top">
                  <span className="pa-details-req-no">{r.request_no || "N/A"}</span>
                  <span className="pa-details-date">{formatDate(r.management_approval)}</span>
                </div>
                <div className="pa-details-subject">{r.req_id || "-"}</div>
                <div className="pa-details-amount-row">
                  <span className="pa-details-amount-label">Approved Amount</span>
                  <span className="pa-details-amount-val">
                    {fmtAmount(r.converted_amount_aed)} <small>AED</small>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="pa-details-empty">{error}</div>}
          {!error && rows && rows.length === 0 && (
            <div className="pa-details-empty">No approved requests in this range.</div>
          )}
        </div>
      </div>
    </div>
  );
}
