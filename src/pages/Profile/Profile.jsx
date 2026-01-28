import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/data/userProfile.json");
        const data = await response.json();
        setUserProfile(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user profile:", error);
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const profileData = user || userProfile;

  if (isLoading || !profileData) {
    return (
      <div className="profile-container">
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="avatar-wrapper">
          <img
            src="https://i.pravatar.cc/300?img=12"
            alt="Profile"
            className="profile-avatar"
          />
          <div className="avatar-status"></div>
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{profileData.name}</h1>
          <p className="profile-designation">{profileData.designation}</p>
          <div className="profile-meta">
            <span className="meta-badge">{profileData.employeeCode}</span>
            <span className="meta-text">{profileData.yearsInAries} years</span>
          </div>
        </div>
        <div className="profile-quick-stats">
          <div className="stat-item">
            <span className="stat-label">Reporting To</span>
            <span className="stat-value">{profileData.reportingPerson}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Hourly Rate</span>
            <span className="stat-value">{profileData.hourlyRate}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Single Card Layout */}
      <div className="profile-content">
        {/* Personal Information Section */}
        <div className="content-section">
          <h2 className="section-title">Personal Information</h2>
          <div className="section-grid">
            <div className="info-item">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">{profileData.dateOfBirth}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender</span>
              <span className="info-value">{profileData.gender}</span>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Work Details Section */}
        <div className="content-section">
          <h2 className="section-title">Work Details</h2>
          <div className="section-grid">
            <div className="info-item">
              <span className="info-label">Company</span>
              <span className="info-value">{profileData.company}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Division</span>
              <span className="info-value">{profileData.division}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Sub Division</span>
              <span className="info-value">{profileData.subDivision}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Job Type</span>
              <span className="info-value">
                <span className="badge badge-blue">{profileData.jobType}</span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Job Category</span>
              <span className="info-value">
                <span className="badge badge-green">
                  {profileData.jobCategory}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Reporting Time</span>
              <span className="info-value">{profileData.reportingTime}</span>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Employment Timeline Section */}
        <div className="content-section">
          <h2 className="section-title">Employment Timeline</h2>
          <div className="section-grid">
            <div className="info-item">
              <span className="info-label">Date of Joining</span>
              <span className="info-value">{profileData.dateOfJoining}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Group Joining Date</span>
              <span className="info-value">{profileData.groupJoiningDate}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Years in Aries</span>
              <span className="info-value highlight">
                {profileData.yearsInAries} years
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Qualification Index</span>
              <span className="info-value highlight">
                {profileData.qualificationIndex}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Total Outside Experience</span>
              <span className="info-value">
                {profileData.outsideExperience.total} years
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Relevant Experience</span>
              <span className="info-value">
                {profileData.outsideExperience.relevant} years
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
