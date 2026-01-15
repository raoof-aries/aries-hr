import React from "react";
import "./Profile.css";

export default function Profile() {
  // Sample profile data - in a real app, this would come from an API
  const profileData = {
    name: "Abdul Raoof",
    employeeCode: "AG00005985",
    dateOfBirth: "21-Oct-1998",
    gender: "Male",
    dateOfJoining: "08-Jan-2024",
    groupJoiningDate: "08-Jan-2024",
    yearsInAries: "2.02",
    outsideExperience: {
      total: "2.7",
      relevant: "0",
    },
    qualificationIndex: "9.72",
    company: "Aries e-Solutions Private Limited",
    division: "E-solutions",
    subDivision: "E-solutions",
    jobType: "Permanent",
    jobCategory: "Productive",
    reportingPerson: "Basil Varghese",
    designation: "Jr. Front end Developer",
    hourlyRate: "525.00 INR",
    reportingTime: "08:00:00 AM",
    monitoring: "",
  };

  const profileFields = [
    { label: "Employee Code", value: profileData.employeeCode },
    { label: "Date of Birth", value: profileData.dateOfBirth },
    { label: "Gender", value: profileData.gender },
    { label: "Date of Joining", value: profileData.dateOfJoining },
    { label: "Group Joining Date", value: profileData.groupJoiningDate },
    {
      label: "Years in Aries",
      value: profileData.yearsInAries,
      highlight: true,
    },
    {
      label: "Outside Experience",
      value: `Total Exp : ${profileData.outsideExperience.total}, Relevant Exp : ${profileData.outsideExperience.relevant}`,
    },
    {
      label: "Qualification Index",
      value: profileData.qualificationIndex,
      hasInfo: true,
    },
    { label: "Company", value: profileData.company },
    { label: "Division", value: profileData.division },
    { label: "SubDivision", value: profileData.subDivision },
    { label: "Job Type", value: profileData.jobType },
    {
      label: "Job Category",
      value: profileData.jobCategory,
      highlight: true,
    },
    {
      label: "Reporting Person",
      value: profileData.reportingPerson,
      highlight: true,
    },
    { label: "Designation", value: profileData.designation },
    { label: "Hourly Rate", value: profileData.hourlyRate },
    { label: "Reporting Time", value: profileData.reportingTime },
    { label: "Monitoring", value: profileData.monitoring || "-" },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-name">{profileData.name}</h1>
      </div>

      <div className="profile-details">
        {profileFields.map((field, index) => (
          <div
            key={field.label}
            className={`profile-row ${index % 2 === 0 ? "even" : "odd"}`}
          >
            <div className="profile-label">
              {field.label}
              {field.hasInfo && (
                <svg
                  className="profile-info-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4M12 8h.01"></path>
                </svg>
              )}
            </div>
            <div
              className={`profile-value ${
                field.highlight ? "highlight" : ""
              }`}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
