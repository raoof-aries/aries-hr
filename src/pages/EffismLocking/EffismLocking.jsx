import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./EffismLocking.css";
import DatePickerField from "../EffismLite/components/DatePickerField/DatePickerField";
import EffismLiteDropdown from "../EffismLite/components/EffismLiteDropdown/EffismLiteDropdown";
import { formatDateDisplayValue } from "../EffismLite/utils/effismLiteUtils";
import "../EffismLite/EffismLite.css";
import { getUsers, getLeaveTypes, lockUser, unlockUser } from "../../services/lockService";

function extractUserId(user = {}) {
  if (!user) return "";
  const candidates = [
    user.user_id,
    user.userId,
    user.userID,
    user.id,
    user.uid,
    user.employee_id,
    user.employeeId,
    user.emp_id,
    user.empId,
    user.emp_user_id,
    user.empUserId,
  ];

  const foundValue = candidates.find(
    (value) => value !== null && value !== undefined && `${value}`.trim() !== ""
  );

  return foundValue ? `${foundValue}`.trim() : "";
}

export default function EffismLocking() {
  const { user, userName } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [lockTypes, setLockTypes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [lockResponse, setLockResponse] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    type: "",
    fromDate: "",
    toDate: "",
    contactNumber: "",
    remarks: "",
  });

  const loggedInUserId = useMemo(() => extractUserId(user), [user]);

  // Fetch users and lock types on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoadingData(true);
        const [usersList, typesList] = await Promise.all([
          getUsers(),
          getLeaveTypes()
        ]);
        
        if (isMounted) {
          setUsers(usersList);
          setLockTypes(typesList);
          
          // Default to logged-in user if available and in the list, otherwise select first user
          if (loggedInUserId) {
            setFormData(prev => ({ ...prev, userId: loggedInUserId }));
          } else if (usersList.length > 0) {
            setFormData(prev => ({ ...prev, userId: String(usersList[0].user_id) }));
          }
        }
      } catch (error) {
        console.error("Failed to load lock screen data:", error);
        if (isMounted) {
          setErrorMsg(error?.message || "Failed to load users or lock types.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [loggedInUserId]);

  // Update lock state based on selected user
  useEffect(() => {
    if (formData.userId) {
      const isLocked = Number(localStorage.getItem(`effismLockResponse_${formData.userId}`)) === 1 ? 1 : 0;
      setLockResponse(isLocked);
    }
  }, [formData.userId]);

  const selectedUserName = useMemo(() => {
    const selected = users.find((u) => String(u.user_id) === String(formData.userId));
    if (selected) {
      return selected.full_name_code;
    }
    
    if (String(formData.userId) === String(loggedInUserId)) {
      const displayName = user?.name || userName || "Employee";
      const employeeCode = user?.employeeCode || user?.employee_code;
      return employeeCode ? `${displayName} - ${employeeCode}` : displayName;
    }
    return formData.userId ? `User #${formData.userId}` : "Employee";
  }, [users, formData.userId, user, userName, loggedInUserId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.userId) {
      alert("Please select a user.");
      return;
    }
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

    try {
      await lockUser({
        userId: formData.userId,
        type: formData.type,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        contactNumber: formData.contactNumber,
        remarks: formData.remarks,
      });
      
      setLockResponse(1);
      localStorage.setItem(`effismLockResponse_${formData.userId}`, "1");
    } catch (err) {
      alert(err.message || "Failed to submit user lock request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (!formData.userId) return;
    setIsSubmitting(true);
    try {
      await unlockUser({ userId: formData.userId });
      setLockResponse(0);
      localStorage.setItem(`effismLockResponse_${formData.userId}`, "0");
    } catch (err) {
      alert(err.message || "Failed to submit user unlock request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="effismLocking-container">
        <div className="effismLocking-card" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="effismLocking-container">
        <div className="effismLocking-card" style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
          <p>{errorMsg}</p>
          <button 
            className="effismLocking-submit" 
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            <p>Profile lock request is active for <strong>{selectedUserName}</strong>.</p>
            <div className="effismLocking-lockedActions">
              <button
                className="effismLocking-submit effismLocking-unlock"
                type="button"
                onClick={handleUnlock}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Unlocking..." : "Click to unlock Effism"}
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
                  <EffismLiteDropdown
                    id="effism-name"
                    value={formData.userId}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, userId: val }))}
                    options={users.map((item) => ({
                      value: String(item.user_id),
                      label: item.full_name_code || `User #${item.user_id}`,
                    }))}
                    placeholder="Select a User"
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
                    options={lockTypes.map((item) => ({
                      value: String(item.id || item.type),
                      label: item.type || `Type #${item.id}`,
                    }))}
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
