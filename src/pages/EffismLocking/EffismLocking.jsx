import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./EffismLocking.css";
import DatePickerField from "../EffismLite/components/DatePickerField/DatePickerField";
import EffismLiteDropdown from "../EffismLite/components/EffismLiteDropdown/EffismLiteDropdown";
import { formatDateDisplayValue } from "../EffismLite/utils/effismLiteUtils";
import "../EffismLite/EffismLite.css";

const LOCK_RESPONSE_KEY = "effismLockResponse";
const LOCK_TYPES = ["Personal", "Medical", "Official"];

function getInitialLockResponse() {
  try {
    return Number(localStorage.getItem(LOCK_RESPONSE_KEY)) === 1 ? 1 : 0;
  } catch {
    return 0;
  }
}

export default function EffismLocking() {
  const { user, userName } = useAuth();
  const employeeName = useMemo(() => {
    const displayName = user?.name || userName || "Employee";
    const employeeCode = user?.employeeCode || user?.employee_code;
    return employeeCode ? `${displayName} - ${employeeCode}` : displayName;
  }, [user, userName]);

  const [lockResponse, setLockResponse] = useState(getInitialLockResponse);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    fromDate: "",
    toDate: "",
    contactNumber: "",
    remarks: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.type) {
      alert("Please select a locking type.");
      return;
    }
    if (!formData.fromDate) {
      alert("Please select From date.");
      return;
    }
    if (!formData.toDate) {
      alert("Please select To date.");
      return;
    }
    if (!formData.contactNumber) {
      alert("Please enter a contact number.");
      return;
    }
    if (!formData.remarks) {
      alert("Please enter remarks.");
      return;
    }

    setIsSubmitting(true);

    // Frontend-only mocked lock response.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLockResponse(1);
    localStorage.setItem(LOCK_RESPONSE_KEY, "1");
    setIsSubmitting(false);
  };

  const handleUnlock = () => {
    setLockResponse(0);
    localStorage.setItem(LOCK_RESPONSE_KEY, "0");
  };

  return (
    <div className="effismLocking-container">
      <div className="effismLocking-card">
        {lockResponse === 1 ? (
          <div className="effismLocking-lockedState">
            <div className="effismLocking-lockedIcon" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="11" width="16" height="9" rx="2"></rect>
                <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
              </svg>
            </div>
            <h3>Effism Locked</h3>
            <p>Your profile lock request is active.</p>
            <div className="effismLocking-lockedActions">
              <button
                className="effismLocking-submit effismLocking-unlock"
                type="button"
                onClick={handleUnlock}
              >
                Unlock
              </button>
            </div>
          </div>
        ) : (
          <form className="effismLocking-form" onSubmit={handleSubmit}>
            <div className="effismLocking-grid">
              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-name">
                  Name<span className="effismLocking-required">*</span>
                </label>
                <div className="effismLocking-field">
                  <input
                    id="effism-name"
                    className="effismLocking-control"
                    type="text"
                    name="name"
                    value={employeeName}
                    readOnly
                  />
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-type">
                  Type<span className="effismLocking-required">*</span>
                </label>
                <div className="effismLocking-field">
                  <EffismLiteDropdown
                    id="effism-type"
                    value={formData.type}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                    options={LOCK_TYPES.map((option) => ({ value: option, label: option }))}
                    placeholder="Select an Option"
                  />
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label">
                  Duration<span className="effismLocking-required">*</span>
                </label>
                <div className="effismLocking-field effismLocking-durationCell">
                  <DatePickerField
                    id="effism-from-date"
                    label="From"
                    value={formData.fromDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                    formatDisplayValue={formatDateDisplayValue}
                  />
                  <DatePickerField
                    id="effism-to-date"
                    label="To"
                    value={formData.toDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                    min={formData.fromDate || undefined}
                    formatDisplayValue={formatDateDisplayValue}
                  />
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-contact">
                  Contact number in case of emergency
                  <span className="effismLocking-required">*</span>
                </label>
                <div className="effismLocking-field">
                  <input
                    id="effism-contact"
                    className="effismLocking-control"
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-remarks">
                  Remarks<span className="effismLocking-required">*</span>
                </label>
                <div className="effismLocking-field">
                  <textarea
                    id="effism-remarks"
                    className="effismLocking-control effismLocking-remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="effismLocking-actions">
                <button
                  className="effismLocking-submit"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
