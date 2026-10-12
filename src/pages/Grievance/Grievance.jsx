import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  GRIEVANCE_TYPES,
  getGrievances,
  submitGrievance,
} from "../../services/grievanceService";
import {
  LuSend,
  LuFileText,
  LuUpload,
  LuCircleCheck,
  LuCircleAlert,
  LuShieldCheck,
  LuClock,
  LuX,
  LuChevronDown,
  LuPaperclip,
  LuEye,
  LuCopy,
  LuCheck,
} from "react-icons/lu";
import "./Grievance.css";

export default function Grievance() {
  const { user, userName } = useAuth();
  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "history"
  const [grievancesList, setGrievancesList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Submission & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [formError, setFormError] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadGrievancesHistory();
  }, []);

  const loadGrievancesHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getGrievances();
      setGrievancesList(data);
    } catch (err) {
      console.error("Failed to load grievances history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileSelection = (file) => {
    setFileError("");
    if (!file) return;

    // Check size limit: 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError("File size exceeds the 10 MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        fileInstance: file,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedType) {
      setFormError("Please choose a grievance category.");
      return;
    }

    if (!description.trim()) {
      setFormError("Please provide a detailed description of the issue.");
      return;
    }

    if (description.trim().length < 15) {
      setFormError("Please provide at least 15 characters to explain the issue clearly.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate slight network roundtrip
      await new Promise((resolve) => setTimeout(resolve, 800));

      const authorName = userName || user?.name || "Employee";
      const result = await submitGrievance({
        type: selectedType,
        subject: subject.trim() || undefined,
        description: description.trim(),
        userName: authorName,
        attachment: attachedFile,
      });

      if (result.success) {
        setSubmissionSuccess(result.data);
        // Reset form
        setSelectedType("");
        setSubject("");
        setDescription("");
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refresh list
        loadGrievancesHistory();
      }
    } catch (err) {
      console.error("Grievance submission error:", err);
      setFormError("An error occurred while submitting your grievance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketId = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const toggleExpandCard = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "resolved":
        return "status-resolved";
      case "in_progress":
        return "status-in-progress";
      case "under_review":
        return "status-in-progress";
      default:
        return "status-submitted";
    }
  };

  return (
    <div className="grievance-container">
      {/* Tabs */}
      <div className="grievance-tabs">
        <button
          type="button"
          className={`grievance-tab-btn ${activeTab === "submit" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("submit");
            setSubmissionSuccess(null);
          }}
        >
          <LuFileText size={18} />
          <span>Submit</span>
        </button>
        <button
          type="button"
          className={`grievance-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("history");
            setSubmissionSuccess(null);
          }}
        >
          <LuClock size={18} />
          <span>History</span>
          {grievancesList.length > 0 && (
            <span className="grievance-tab-count">{grievancesList.length}</span>
          )}
        </button>
      </div>

      {/* SUCCESS MODAL POPUP */}
      {submissionSuccess && (
        <div className="grievance-success-card">
          <div className="grievance-success-icon">
            <LuCircleCheck size={36} />
          </div>
          <h3 className="grievance-success-title">Grievance Submitted Successfully</h3>
          <p className="grievance-success-text">
            Your grievance has been logged securely with HR. You can track updates and HR responses anytime in the "My Grievances" tab.
          </p>
          <div className="grievance-ticket-box">
            <div className="grievance-ticket-meta">
              <span className="grievance-ticket-label">Tracking Reference:</span>
              <strong className="grievance-ticket-val">{submissionSuccess.id}</strong>
            </div>
            <button
              type="button"
              className="grievance-copy-btn"
              onClick={() => handleCopyTicketId(submissionSuccess.id)}
              title="Copy Reference Code"
            >
              {copiedId ? <LuCheck size={16} /> : <LuCopy size={16} />}
              <span>{copiedId ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div className="grievance-success-actions">
            <button
              type="button"
              className="grievance-btn-secondary"
              onClick={() => {
                setSubmissionSuccess(null);
                setActiveTab("submit");
              }}
            >
              Submit Another
            </button>
            <button
              type="button"
              className="grievance-btn-primary"
              onClick={() => {
                setSubmissionSuccess(null);
                setActiveTab("history");
              }}
            >
              <LuEye size={16} />
              View Grievance Status
            </button>
          </div>
        </div>
      )}

      {/* SUBMIT TAB CONTENT */}
      {activeTab === "submit" && !submissionSuccess && (
        <form className="grievance-form-card" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="grievance-alert-box">
              <LuCircleAlert size={18} />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Grievance Category / Type Dropdown */}
          <div className="grievance-field-group">
            <label htmlFor="grievance-type-select" className="grievance-label">
              Type of Grievance <span className="grievance-req">*</span>
            </label>
            <div className="grievance-select-wrap">
              <select
                id="grievance-type-select"
                className={`grievance-select ${!selectedType ? "placeholder" : ""}`}
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  if (formError) setFormError("");
                }}
                required
              >
                <option value="" disabled>
                  -- Select Grievance Category --
                </option>
                {GRIEVANCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <span className="grievance-select-arrow" aria-hidden="true">
                <LuChevronDown size={18} />
              </span>
            </div>
          </div>

          {/* 2. Optional Subject / Brief Line */}
          <div className="grievance-field-group">
            <label htmlFor="grievance-subject-input" className="grievance-label">
              Subject / Brief Summary <span className="grievance-opt">(Optional)</span>
            </label>
            <input
              id="grievance-subject-input"
              type="text"
              className="grievance-input"
              placeholder="e.g. AC cooling issue in 3rd floor office"
              value={subject}
              maxLength={120}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* 3. Issue Description Textbox */}
          <div className="grievance-field-group">
            <div className="grievance-label-row">
              <label htmlFor="grievance-desc-textarea" className="grievance-label">
                Describe the Issue in Detail <span className="grievance-req">*</span>
              </label>
              <span className="grievance-char-count">
                {description.length} / 1000
              </span>
            </div>
            <textarea
              id="grievance-desc-textarea"
              className="grievance-textarea"
              placeholder="Please describe what happened, when it occurred, affected individuals, location, or any steps already taken..."
              rows={5}
              maxLength={1000}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formError) setFormError("");
              }}
              required
            />
          </div>

          {/* 4. Attachment File Dropzone */}
          <div className="grievance-field-group">
            <label className="grievance-label">
              Attachment <span className="grievance-opt">(Optional proof, photos, docs)</span>
            </label>

            {attachedFile ? (
              <div className="grievance-attached-file">
                <div className="grievance-attached-icon">
                  <LuPaperclip size={20} />
                </div>
                <div className="grievance-attached-details">
                  <span className="grievance-attached-name">{attachedFile.name}</span>
                  <span className="grievance-attached-size">
                    {(attachedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  className="grievance-remove-file-btn"
                  onClick={removeAttachment}
                  title="Remove attachment"
                  aria-label="Remove attachment"
                >
                  <LuX size={18} />
                </button>
              </div>
            ) : (
              <div
                className={`grievance-dropzone ${isDragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="grievance-file-hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileInputChange}
                />
                <div className="grievance-dropzone-icon">
                  <LuUpload size={24} />
                </div>
                <p className="grievance-dropzone-text">
                  <strong>Click to upload</strong> or drag and drop files here
                </p>
                <span className="grievance-dropzone-hint">
                  PDF, DOC, Images, Spreadsheets (Max 10MB)
                </span>
              </div>
            )}

            {fileError && <p className="grievance-file-error">{fileError}</p>}
          </div>

          {/* Form Actions */}
          <div className="grievance-form-actions">
            <button
              type="submit"
              className="grievance-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="grievance-btn-spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <LuSend size={18} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === "history" && !submissionSuccess && (
        <div className="grievance-history-wrap">
          {isLoadingHistory ? (
            <div className="grievance-history-loading">
              <div className="grievance-btn-spinner" />
              <p>Loading grievances...</p>
            </div>
          ) : grievancesList.length === 0 ? (
            <div className="grievance-empty-state">
              <div className="grievance-empty-icon">
                <LuFileText size={32} />
              </div>
              <h4>No Grievances Logged Yet</h4>
              <p>You haven't submitted any complaints or feedback so far.</p>
              <button
                type="button"
                className="grievance-btn-primary"
                onClick={() => setActiveTab("submit")}
              >
                Submit a Grievance
              </button>
            </div>
          ) : (
            <div className="grievance-history-list">
              {grievancesList.map((item) => {
                const isExpanded = expandedCardId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`grievance-history-card ${isExpanded ? "expanded" : ""}`}
                  >
                    <div
                      className="grievance-history-header"
                      onClick={() => toggleExpandCard(item.id)}
                    >
                      <div className="grievance-history-top-row">
                        <span className="grievance-item-ticket">{item.id}</span>
                        <div className="grievance-item-badges">
                          <span
                            className={`grievance-status-badge ${getStatusBadgeClass(item.status)}`}
                          >
                            {item.statusLabel || item.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="grievance-item-subject">{item.subject}</h4>

                      <div className="grievance-item-meta-row">
                        <span className="grievance-item-type">{item.typeLabel}</span>
                        <span className="grievance-item-dot">•</span>
                        <span className="grievance-item-date">{item.submittedAt}</span>
                        {item.attachment && (
                          <>
                            <span className="grievance-item-dot">•</span>
                            <span className="grievance-item-attach-flag">
                              <LuPaperclip size={13} /> 1 file
                            </span>
                          </>
                        )}
                      </div>

                      <span
                        className={`grievance-expand-icon ${isExpanded ? "open" : ""}`}
                        aria-hidden="true"
                      >
                        <LuChevronDown size={18} />
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="grievance-history-body">
                        <div className="grievance-body-section">
                          <span className="grievance-body-heading">Description</span>
                          <p className="grievance-body-text">{item.description}</p>
                        </div>

                        {item.attachment && (
                          <div className="grievance-body-section">
                            <span className="grievance-body-heading">Attachment</span>
                            <div className="grievance-history-attachment-pill">
                              <LuPaperclip size={14} />
                              <span className="attach-name">{item.attachment.name}</span>
                              <span className="attach-size">({item.attachment.size})</span>
                            </div>
                          </div>
                        )}

                        <div className="grievance-body-section">
                          <span className="grievance-body-heading">Submission Details</span>
                          <div className="grievance-meta-grid">
                            <div className="grievance-meta-cell">
                              <span>Submitted By:</span>
                              <strong>{item.submittedBy}</strong>
                            </div>
                            <div className="grievance-meta-cell">
                              <span>Date & Time:</span>
                              <strong>{item.submittedAt}</strong>
                            </div>
                          </div>
                        </div>

                        {item.adminResponse && (
                          <div className="grievance-admin-response-box">
                            <div className="grievance-admin-response-header">
                              <LuShieldCheck size={16} />
                              <span>HR / Admin Feedback</span>
                            </div>
                            <p className="grievance-admin-response-text">{item.adminResponse}</p>
                            {item.updatedAt && (
                              <span className="grievance-admin-response-date">
                                Updated on {item.updatedAt}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
