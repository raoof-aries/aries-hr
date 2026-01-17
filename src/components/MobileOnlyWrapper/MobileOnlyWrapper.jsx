import React, { useState, useEffect } from "react";
import "./MobileOnlyWrapper.css";

export default function MobileOnlyWrapper({ children }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (!isMobile) {
    return (
      <div className="mobile-only-message">
        <div className="mobile-only-content">
          <div className="mobile-only-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h1 className="mobile-only-title">Please Open on Mobile</h1>
          <p className="mobile-only-description">
            This application is optimized for mobile devices. Please open it on your smartphone or tablet for the best experience.
          </p>
          <div className="mobile-only-footer">
            <p className="mobile-only-footer-text">
              Aries HRMS
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
