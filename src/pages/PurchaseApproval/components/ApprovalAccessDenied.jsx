import React from "react";
import { Link } from "react-router-dom";

export default function ApprovalAccessDenied({
  title = "Access Denied",
  message = "This account is not authorized as a management approver.",
  onRetry,
}) {
  return (
    <div
      style={{
        padding: "4rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#FFF4F4",
          color: "#CF5B5B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
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
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h2
        style={{
          marginBottom: "0.75rem",
          color: "#1E293B",
          fontSize: "1.5rem",
          fontWeight: "600",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          marginBottom: "2rem",
          color: "#64748B",
          maxWidth: "340px",
          lineHeight: "1.5",
        }}
      >
        {message}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#ffffff",
              color: "#0F7A67",
              border: "1px solid #0F7A67",
              borderRadius: "8px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Try Again
          </button>
        )}
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0F7A67",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "500",
            transition: "background-color 0.2s",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Return to Home
        </Link>
      </div>
    </div>
  );
}
