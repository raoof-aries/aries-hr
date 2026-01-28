import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AllowanceUpload.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ALLOWANCE_TYPES = [
  { label: "Father Allowance", key: "father" },
  { label: "Mother Allowance", key: "mother" },
  { label: "Spouse Allowance", key: "spouse" },
];

export default function AllowanceUpload() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = MONTHS[new Date().getMonth()];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [files, setFiles] = useState({
    father: null,
    mother: null,
    spouse: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const years = useMemo(() => {
    const yrs = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      yrs.push(i);
    }
    return yrs;
  }, [currentYear]);

  const handleFileChange = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [type]: file,
      }));
    }
  };

  const removeFile = (type) => {
    setFiles((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate upload process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Here you would typically upload the files to your backend
    console.log("Uploading files:", {
      year: selectedYear,
      month: selectedMonth,
      files,
    });

    setIsSubmitting(false);
    // Navigate back to allowance page after successful upload
    navigate("/allowance");
  };

  const hasFiles = Object.values(files).some((file) => file !== null);

  return (
    <div className="allowanceUpload-container">
      <div className="allowanceUpload-header">
        <h1 className="allowanceUpload-title">Upload Allowance</h1>
        <p className="allowanceUpload-subtitle">
          Select year and month, then upload allowance files
        </p>
      </div>

      <form className="allowanceUpload-form" onSubmit={handleSubmit}>
        <div className="allowanceUpload-dateSection">
          <div className="allowanceUpload-field">
            <label
              htmlFor="year-select"
              className="allowanceUpload-label"
            >
              Year
            </label>
            <select
              id="year-select"
              className="allowanceUpload-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select year"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="allowanceUpload-field">
            <label
              htmlFor="month-select"
              className="allowanceUpload-label"
            >
              Month
            </label>
            <select
              id="month-select"
              className="allowanceUpload-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select month"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="allowanceUpload-uploadsSection">
          {ALLOWANCE_TYPES.map((type) => (
            <div key={type.key} className="allowanceUpload-uploadItem">
              <label
                htmlFor={`file-${type.key}`}
                className="allowanceUpload-uploadLabel"
              >
                <span className="allowanceUpload-uploadTitle">
                  {type.label}
                </span>
                {files[type.key] ? (
                  <div className="allowanceUpload-fileInfo">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                    <span className="allowanceUpload-fileName">
                      {files[type.key].name}
                    </span>
                    <button
                      type="button"
                      className="allowanceUpload-removeFile"
                      onClick={(e) => {
                        e.preventDefault();
                        removeFile(type.key);
                      }}
                      aria-label={`Remove ${type.label} file`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="allowanceUpload-uploadArea">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span className="allowanceUpload-uploadText">
                      Click to upload or drag and drop
                    </span>
                    <span className="allowanceUpload-uploadHint">
                      PDF, DOC, DOCX (Max 10MB)
                    </span>
                  </div>
                )}
              </label>
              <input
                id={`file-${type.key}`}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                capture="environment"
                className="allowanceUpload-fileInput"
                onChange={(e) => handleFileChange(type.key, e)}
                aria-label={`Upload ${type.label}`}
              />
            </div>
          ))}
        </div>

        <div className="allowanceUpload-actions">
          <button
            type="button"
            className="allowanceUpload-cancelButton"
            onClick={() => navigate("/allowance")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="allowanceUpload-submitButton"
            disabled={isSubmitting || !hasFiles}
          >
            {isSubmitting ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
