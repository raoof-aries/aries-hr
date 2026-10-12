import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getApprovedDetails } from "../../../services/purchaseApprovalService";
import { fmtAmount, formatDate, truncate } from "../../../utils/approvalFormat";

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

  const modalContent = (
    <div
      className="pa-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pa-sheet details-sheet">
        <div className="pa-sheet-header">
          <h3>{title}</h3>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="pa-details-table-wrap">
          <table className="pa-details-table">
            <thead>
              <tr>
                <th>Request No</th>
                <th>Subject</th>
                <th>Amount (AED)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((r) => (
                <tr key={r.requesting_id}>
                  <td>{r.request_no || ""}</td>
                  <td title={r.req_id || ""}>{truncate(r.req_id, 40)}</td>
                  <td>{fmtAmount(r.converted_amount_aed)}</td>
                  <td>{formatDate(r.management_approval)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>Grand Total</th>
                <th colSpan={2}>{rows ? `${fmtAmount(grandTotal)} AED` : ""}</th>
              </tr>
            </tfoot>
          </table>
          {error && <div className="pa-details-empty">{error}</div>}
          {!error && rows && rows.length === 0 && (
            <div className="pa-details-empty">No approved requests in this range.</div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
