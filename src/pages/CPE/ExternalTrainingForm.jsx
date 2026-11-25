import React, { useState, useRef } from 'react';
import {
  LuGlobe,
  LuBuilding2,
  LuBookOpen,
  LuClock,
  LuCalendar,
  LuUpload,
  LuFileCheck,
  LuTrash2,
  LuCircleCheck,
  LuCircleAlert,
  LuSend
} from 'react-icons/lu';
import './ExternalTrainingForm.css';

const QUICK_DURATIONS = ['00:30', '01:00', '02:00', '04:00', '08:00'];

const ExternalTrainingForm = ({ onClose }) => {
  // Form fields
  const [trainingType, setTrainingType] = useState('online'); // 'online' | 'offline'
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [remarks, setRemarks] = useState('');

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-format duration to HH:MM as user types
  const handleDurationChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    if (val.length === 2 && !val.includes(':') && duration.length < 2) {
      val = val + ':';
    }
    if (val.length > 5) val = val.slice(0, 5);
    setDuration(val);
    if (errors.duration) {
      setErrors((prev) => ({ ...prev, duration: null }));
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      setErrors((prev) => ({
        ...prev,
        certificate: 'File size exceeds maximum allowed 10MB limit.'
      }));
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setCertificateFile({
      name: file.name,
      size: sizeFormatted,
      type: file.type
    });

    if (errors.certificate) {
      setErrors((prev) => ({ ...prev, certificate: null }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) {
      newErrors.topic = 'Please enter the training topic name.';
    }

    if (!duration.trim()) {
      newErrors.duration = 'Please specify the training duration (HH:MM).';
    } else {
      const parts = duration.split(':');
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        newErrors.duration = 'Duration must follow HH:MM format (e.g. 02:30).';
      }
    }

    if (!issuedDate) {
      newErrors.issuedDate = 'Please select the certificate issue date.';
    }

    if (!certificateFile) {
      newErrors.certificate = 'Please upload a certificate document (PDF, PNG, or JPG).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const submittedTopic = topic.trim();
      const submittedDuration = duration;

      setIsSubmitting(false);
      setSuccessBanner({
        topic: submittedTopic,
        duration: submittedDuration
      });

      // Reset form
      setTopic('');
      setDuration('');
      setIssuedDate('');
      setExpiryDate('');
      setCertificateFile(null);
      setRemarks('');
      setErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 600);
  };

  const handleResetForm = () => {
    setTopic('');
    setDuration('');
    setIssuedDate('');
    setExpiryDate('');
    setCertificateFile(null);
    setRemarks('');
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ext-training-page">
      {/* Success Alert Banner */}
      {successBanner && (
        <div className="ext-success-banner" role="alert">
          <div className="ext-success-icon-wrap">
            <LuCircleCheck size={20} />
          </div>
          <div className="ext-success-body">
            <h4 className="ext-success-title">Submission Successful!</h4>
            <p className="ext-success-text">
              Your external training <strong>"{successBanner.topic}"</strong> ({successBanner.duration} hrs) has been submitted for HR verification.
            </p>
            <div className="ext-success-actions">
              <button 
                type="button" 
                className="ext-success-link-btn"
                onClick={() => {
                  setSuccessBanner(null);
                  if (onClose) onClose();
                }}
              >
                Back to CPE Home
              </button>
              <button 
                type="button" 
                className="ext-success-dismiss"
                onClick={() => setSuccessBanner(null)}
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <form className="ext-form-card" onSubmit={handleSubmit} noValidate>
        {/* Training Type Toggle */}
        <div className="ext-form-group">
          <label className="ext-field-label">
            <span>Training Type</span>
            <span className="ext-req-mark">*</span>
          </label>
          <div className="ext-type-segmented" role="radiogroup" aria-label="Training Type">
            <button
              type="button"
              role="radio"
              aria-checked={trainingType === 'online'}
              className={`ext-type-segmented-btn ${trainingType === 'online' ? 'active' : ''}`}
              onClick={() => setTrainingType('online')}
            >
              <LuGlobe size={16} />
              <span>Online</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={trainingType === 'offline'}
              className={`ext-type-segmented-btn ${trainingType === 'offline' ? 'active' : ''}`}
              onClick={() => setTrainingType('offline')}
            >
              <LuBuilding2 size={16} />
              <span>Offline</span>
            </button>
          </div>
        </div>

        {/* Topic */}
        <div className="ext-form-group">
          <label htmlFor="ext-topic" className="ext-field-label">
            <span>Topic Name</span>
            <span className="ext-req-mark">*</span>
          </label>
          <div className={`ext-input-wrap ${errors.topic ? 'has-error' : ''}`}>
            <LuBookOpen size={16} className="ext-input-icon" />
            <input
              id="ext-topic"
              type="text"
              className="ext-text-input"
              placeholder="e.g. HR Technology, Leadership Workshop..."
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (errors.topic) setErrors((prev) => ({ ...prev, topic: null }));
              }}
            />
          </div>
          {errors.topic && (
            <span className="ext-error-text">
              <LuCircleAlert size={12} />
              <span>{errors.topic}</span>
            </span>
          )}
        </div>

        {/* Duration (HH:MM) */}
        <div className="ext-form-group">
          <label htmlFor="ext-duration" className="ext-field-label">
            <span>Duration (HH:MM)</span>
            <span className="ext-req-mark">*</span>
          </label>
          <div className={`ext-input-wrap ${errors.duration ? 'has-error' : ''}`}>
            <LuClock size={16} className="ext-input-icon" />
            <input
              id="ext-duration"
              type="text"
              className="ext-text-input"
              placeholder="HH:MM (e.g. 01:30)"
              maxLength={5}
              value={duration}
              onChange={handleDurationChange}
            />
          </div>
          {errors.duration ? (
            <span className="ext-error-text">
              <LuCircleAlert size={12} />
              <span>{errors.duration}</span>
            </span>
          ) : (
            <div className="ext-quick-presets">
              <span className="ext-presets-label">Quick select:</span>
              <div className="ext-presets-chips">
                {QUICK_DURATIONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`ext-preset-btn ${duration === preset ? 'active' : ''}`}
                    onClick={() => {
                      setDuration(preset);
                      if (errors.duration) setErrors((prev) => ({ ...prev, duration: null }));
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Row: Certificate Issued Date & Expiry Date (Side by Side) */}
        <div className="ext-form-row">
          <div className="ext-form-group ext-col">
            <label htmlFor="ext-issued-date" className="ext-field-label">
              <span>Issued Date</span>
              <span className="ext-req-mark">*</span>
            </label>
            <div className={`ext-input-wrap ${errors.issuedDate ? 'has-error' : ''}`}>
              <LuCalendar size={16} className="ext-input-icon" />
              <input
                id="ext-issued-date"
                type="date"
                className="ext-date-input"
                max={new Date().toISOString().split('T')[0]}
                value={issuedDate}
                onChange={(e) => {
                  setIssuedDate(e.target.value);
                  if (errors.issuedDate) {
                    setErrors((prev) => ({ ...prev, issuedDate: null }));
                  }
                }}
              />
            </div>
            {errors.issuedDate && (
              <span className="ext-error-text">
                <LuCircleAlert size={12} />
                <span>{errors.issuedDate}</span>
              </span>
            )}
          </div>

          <div className="ext-form-group ext-col">
            <label htmlFor="ext-expiry-date" className="ext-field-label">
              <span>Expiry Date</span>
              <span className="ext-optional-pill">Optional</span>
            </label>
            <div className="ext-input-wrap">
              <LuCalendar size={16} className="ext-input-icon" />
              <input
                id="ext-expiry-date"
                type="date"
                className="ext-date-input"
                min={issuedDate || undefined}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Certificate Upload Dropzone */}
        <div className="ext-form-group">
          <label className="ext-field-label">
            <span>Certificate Document</span>
            <span className="ext-req-mark">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {!certificateFile ? (
            <div 
              className={`ext-compact-dropzone ${isDragOver ? 'drag-over' : ''} ${errors.certificate ? 'has-error' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="ext-dropzone-icon-box">
                <LuUpload size={18} />
              </div>
              <div className="ext-dropzone-text-group">
                <span className="ext-dropzone-main">
                  <strong>Choose Certificate</strong> or drag & drop
                </span>
                <span className="ext-dropzone-sub">
                  PDF, PNG, JPG (Max 10 MB)
                </span>
              </div>
            </div>
          ) : (
            <div className="ext-file-card">
              <div className="ext-file-card-left">
                <div className="ext-file-icon-box">
                  <LuFileCheck size={18} />
                </div>
                <div className="ext-file-details">
                  <span className="ext-file-name" title={certificateFile.name}>
                    {certificateFile.name}
                  </span>
                  <span className="ext-file-size">
                    {certificateFile.size}
                  </span>
                </div>
              </div>

              <div className="ext-file-card-actions">
                <button
                  type="button"
                  className="ext-file-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="ext-file-remove-btn"
                  onClick={() => {
                    setCertificateFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  title="Remove file"
                >
                  <LuTrash2 size={15} />
                </button>
              </div>
            </div>
          )}

          {errors.certificate && (
            <span className="ext-error-text">
              <LuCircleAlert size={12} />
              <span>{errors.certificate}</span>
            </span>
          )}
        </div>

        {/* Remarks */}
        <div className="ext-form-group">
          <div className="ext-label-with-presets">
            <label htmlFor="ext-remarks" className="ext-field-label">
              <span>Remarks</span>
              <span className="ext-optional-pill">Optional</span>
            </label>
            <span className="ext-char-count">{remarks.length} / 500</span>
          </div>
          <textarea
            id="ext-remarks"
            className="ext-textarea"
            rows={2}
            maxLength={500}
            placeholder="Training institute, trainer name, or notes for HR..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Form Actions */}
        <div className="ext-form-actions">
          <button
            type="submit"
            className="ext-btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="ext-spinner" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <LuSend size={15} />
                <span>Submit Training</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="ext-btn-cancel"
            onClick={() => {
              handleResetForm();
              if (onClose) onClose();
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExternalTrainingForm;
