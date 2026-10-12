import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPendingApprovals } from "../../services/purchaseApprovalService";
import { fmtAmount, formatDate, truncate } from "../../utils/approvalFormat";
import "./PurchaseApproval.css";

function takeActionUrl(item) {
  const actionCode = item.next_action_code || "MANAGEMENT_APPROVAL";
  const mode = actionCode === "MANAGEMENT_APPROVAL" ? "pwa" : "legacy";
  const params = new URLSearchParams({ mode, id: item.requesting_id, code: actionCode });
  return "/purchase-approval/action?" + params.toString();
}

function PendingCard({ item }) {
  return (
    <div className="pa-pending-card">
      <div className="pa-pending-card-top">
        <div>
          <div className="pa-pending-request-no">{item.request_no || ""}</div>
          <div className="pa-pending-subject">{truncate(item.req_id, 70)}</div>
        </div>
      </div>
      <div className="pa-pending-meta">
        <span>{item.request_type_name || ""}</span>
        <span>{item.requester_name || ""}</span>
        <span>{formatDate(item.requesting_date)}</span>
      </div>
      {item.supplier_name && (
        <div className="pa-pending-meta">
          <span>{item.supplier_name}</span>
        </div>
      )}
      <div className="pa-pending-meta">
        <span className="pa-pending-amount">
          {fmtAmount(item.final_amount)} {item.final_amount_currency || ""}
        </span>
      </div>
      <div className="pa-pending-actions">
        <Link className="pa-act-take-action" to={takeActionUrl(item)}>
          Take Action
        </Link>
      </div>
    </div>
  );
}

export default function PurchaseApprovalPending() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingApprovals();
      setItems(data || []);
    } catch (err) {
      console.error("Could not load pending list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const requestNo = String(item.request_no || "").toLowerCase();
      const supplierName = String(item.supplier_name || "").toLowerCase();
      return requestNo.includes(term) || supplierName.includes(term);
    });
  }, [items, search]);

  return (
    <section className="pa-screen">
      <div className="pa-search-row">
        <input
          type="search"
          className="pa-search-input"
          placeholder="Search by request no. or supplier"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="pa-empty-state">
          <p>Loading...</p>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="pa-empty-state">
          <div className="pa-empty-icon">&#10003;</div>
          Nothing waiting on your approval right now.
        </div>
      )}

      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="pa-empty-state">No matching requests.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="pa-pending-list">
          {filtered.map((item) => (
            <PendingCard key={item.requesting_id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
