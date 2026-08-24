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
  const { user, userName, refreshUser } = useAuth();
  
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

  const [errors, setErrors] = useState({});

  const loggedInUserId = useMemo(() => extractUserId(user), [user]);

  // Clear errors when the selected user changes
  useEffect(() => {
    setErrors({});
  }, [formData.userId]);

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
      let isLocked = 0;

      // 1. If it's the logged-in user, check the AuthContext user object
      if (String(formData.userId) === String(loggedInUserId)) {
        isLocked = user && (Number(user.is_lock) === 1 || Number(user.isLock) === 1) ? 1 : 0;
      } else {
        // 2. Otherwise, check the users list
        const selected = users.find((u) => String(u.user_id) === String(formData.userId));
        if (selected) {
          isLocked = Number(selected.is_lock) === 1 || Number(selected.isLock) === 1 ? 1 : 0;
        }
      }

      // 3. Fallback to localStorage if not found/zero in profile/users API
      if (isLocked === 0) {
        const localVal = localStorage.getItem(`effismLockResponse_${formData.userId}`);
        if (localVal !== null) {
          isLocked = Number(localVal) === 1 ? 1 : 0;
        }
      }

      setLockResponse(isLocked);
    }
  }, [formData.userId, user, users, loggedInUserId]);

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

  const selectedLockType = useMemo(() => {
    return lockTypes.find((item) => String(item.id) === String(formData.type));
  }, [lockTypes, formData.type]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (value) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newErrors = {};
    if (!formData.userId) {
      newErrors.userId = "Please select a user.";
    }
    if (!formData.type) {
      newErrors.type = "Please select a locking type.";
    }
    if (!formData.fromDate) {
      newErrors.fromDate = "Please select From date.";
    }
    if (!formData.toDate) {
      newErrors.toDate = "Please select To date.";
    }
    if (!formData.contactNumber) {
      newErrors.contactNumber = "Please enter a contact number.";
    }
    if (!formData.remarks) {
      newErrors.remarks = "Please enter remarks.";
    }

    if (selectedLockType && selectedLockType.fields) {
      selectedLockType.fields.forEach((field) => {
        if (!formData[field.name]) {
          newErrors[field.name] = `Please enter ${field.label || field.name}.`;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        userId: formData.userId,
        type: formData.type,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        contactNumber: formData.contactNumber,
        remarks: formData.remarks,
      };

      if (selectedLockType && selectedLockType.fields) {
        selectedLockType.fields.forEach((field) => {
          payload[field.name] = formData[field.name];
        });
      }

      await lockUser(payload);
      
      setLockResponse(1);
      localStorage.setItem(`effismLockResponse_${formData.userId}`, "1");

      // Update local users array
      setUsers(prevUsers => prevUsers.map(u => 
        String(u.user_id) === String(formData.userId) ? { ...u, is_lock: 1 } : u
      ));

      // Refresh AuthContext profile if locking self
      if (String(formData.userId) === String(loggedInUserId) && refreshUser) {
        await refreshUser().catch(console.error);
      }
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

      // Update local users array
      setUsers(prevUsers => prevUsers.map(u => 
        String(u.user_id) === String(formData.userId) ? { ...u, is_lock: 0 } : u
      ));

      // Auto clear the form on successful unlock
      setFormData(prev => ({
        userId: prev.userId,
        type: "",
        fromDate: "",
        toDate: "",
        contactNumber: "",
        remarks: "",
      }));
      setErrors({});

      // Refresh AuthContext profile if unlocking self
      if (String(formData.userId) === String(loggedInUserId) && refreshUser) {
        await refreshUser().catch(console.error);
      }
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
          <form className="effismLocking-form" onSubmit={handleSubmit} noValidate>
            <div className="effismLocking-grid">
              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-name">
                  Name<span className="effismLocking-required">*</span>
                </label>
                <div className={`effismLocking-field ${errors.userId ? "is-invalid" : ""}`}>
                  <EffismLiteDropdown
                    id="effism-name"
                    value={formData.userId}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, userId: val }));
                      if (val) setErrors(prev => ({ ...prev, userId: "" }));
                    }}
                    options={users.map((item) => ({
                      value: String(item.user_id),
                      label: item.full_name_code || `User #${item.user_id}`,
                    }))}
                    placeholder="Select a User"
                  />
                  {errors.userId && (
                    <span className="effismLocking-errorText">{errors.userId}</span>
                  )}
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-type">
                  Type<span className="effismLocking-required">*</span>
                </label>
                <div className={`effismLocking-field ${errors.type ? "is-invalid" : ""}`}>
                  <EffismLiteDropdown
                    id="effism-type"
                    value={formData.type}
                    onValueChange={(val) => {
                      setFormData(prev => {
                        const baseForm = {
                          userId: prev.userId,
                          type: val,
                          fromDate: prev.fromDate,
                          toDate: prev.toDate,
                          contactNumber: prev.contactNumber,
                          remarks: prev.remarks,
                        };
                        const nextType = lockTypes.find(item => String(item.id) === String(val));
                        if (nextType && nextType.fields) {
                          nextType.fields.forEach(field => {
                            baseForm[field.name] = "";
                          });
                        }
                        return baseForm;
                      });

                      setErrors(prev => {
                        const nextErrors = { ...prev };
                        delete nextErrors.type;
                        if (selectedLockType && selectedLockType.fields) {
                          selectedLockType.fields.forEach(field => {
                            delete nextErrors[field.name];
                          });
                        }
                        return nextErrors;
                      });
                    }}
                    options={lockTypes.map((item) => ({
                      value: String(item.id || item.type),
                      label: item.type || `Type #${item.id}`,
                    }))}
                    placeholder="Select an Option"
                    searchable={true}
                  />
                  {errors.type && (
                    <span className="effismLocking-errorText">{errors.type}</span>
                  )}
                </div>
              </div>

              {selectedLockType &&
                selectedLockType.fields &&
                selectedLockType.fields.map((field) => (
                  <div key={field.name} className="effismLocking-row">
                    <label className="effismLocking-label" htmlFor={`effism-${field.name}`}>
                      {field.label}
                      <span className="effismLocking-required">*</span>
                    </label>
                    <div className={`effismLocking-field ${errors[field.name] ? "is-invalid" : ""}`}>
                      {field.type === "date" ? (
                        <DatePickerField
                          id={`effism-${field.name}`}
                          placeholder={`Select ${field.label.toLowerCase()}`}
                          value={formData[field.name] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({ ...prev, [field.name]: val }));
                            if (val) setErrors((prev) => ({ ...prev, [field.name]: "" }));
                          }}
                          className={errors[field.name] ? "is-invalid" : ""}
                          formatDisplayValue={formatDateDisplayValue}
                        />
                      ) : (
                        <input
                          id={`effism-${field.name}`}
                          className="effismLocking-control"
                          type={field.type || "text"}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({ ...prev, [field.name]: val }));
                            if (val) setErrors((prev) => ({ ...prev, [field.name]: "" }));
                          }}
                        />
                      )}
                      {errors[field.name] && (
                        <span className="effismLocking-errorText">{errors[field.name]}</span>
                      )}
                    </div>
                  </div>
                ))}

              <div className="effismLocking-row">
                <label className="effismLocking-label">
                  Duration<span className="effismLocking-required">*</span>
                </label>
                <div className="effismLocking-field effismLocking-durationCell">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <DatePickerField
                      id="effism-from-date"
                      placeholder="Select from date"
                      value={formData.fromDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, fromDate: val }));
                        if (val) setErrors(prev => ({ ...prev, fromDate: "" }));
                      }}
                      className={errors.fromDate ? "is-invalid" : ""}
                      formatDisplayValue={formatDateDisplayValue}
                    />
                    {errors.fromDate && (
                      <span className="effismLocking-errorText">{errors.fromDate}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <DatePickerField
                      id="effism-to-date"
                      placeholder="Select to date"
                      value={formData.toDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, toDate: val }));
                        if (val) setErrors(prev => ({ ...prev, toDate: "" }));
                      }}
                      min={formData.fromDate || undefined}
                      className={errors.toDate ? "is-invalid" : ""}
                      formatDisplayValue={formatDateDisplayValue}
                    />
                    {errors.toDate && (
                      <span className="effismLocking-errorText">{errors.toDate}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-contact">
                  Contact number in case of emergency
                  <span className="effismLocking-required">*</span>
                </label>
                <div className={`effismLocking-field ${errors.contactNumber ? "is-invalid" : ""}`}>
                  <input
                    id="effism-contact"
                    className="effismLocking-control"
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                  {errors.contactNumber && (
                    <span className="effismLocking-errorText">{errors.contactNumber}</span>
                  )}
                </div>
              </div>

              <div className="effismLocking-row">
                <label className="effismLocking-label" htmlFor="effism-remarks">
                  Remarks<span className="effismLocking-required">*</span>
                </label>
                <div className={`effismLocking-field ${errors.remarks ? "is-invalid" : ""}`}>
                  <textarea
                    id="effism-remarks"
                    className="effismLocking-control effismLocking-remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                  {errors.remarks && (
                    <span className="effismLocking-errorText">{errors.remarks}</span>
                  )}
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
