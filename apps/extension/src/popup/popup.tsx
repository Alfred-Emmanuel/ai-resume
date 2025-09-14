import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthForm } from "../components/auth/AuthForm";
import ResumeSelector from "../components/resume/ResumeSelector";
import JobSelector from "../components/jobs/JobSelector";
import GenerationPreview from "../components/generation/GenerationPreview";

export function Popup() {
  const { user, loading, logout } = useAuth();
  const [status, setStatus] = useState<string>("");
  const [jobText, setJobText] = useState<string>("");
  const [currentView, setCurrentView] = useState<
    "main" | "resume-selector" | "job-selector" | "generation-preview"
  >("main");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const capture = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: "CAPTURE_JOB" }, (response) => {
        if (response?.ok) {
          setStatus("Captured");
          setJobText(response.text || "");
        } else {
          setStatus("Nothing captured");
        }
      });
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGenerateResume = () => {
    setCurrentView("resume-selector");
  };

  const handleResumeSelected = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setCurrentView("job-selector");
  };

  const handleJobSelected = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentView("generation-preview");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
    setSelectedResumeId(null);
    setSelectedJobId(null);
  };

  const handleBackToResumeSelector = () => {
    setCurrentView("resume-selector");
    setSelectedJobId(null);
  };

  const handleBackToJobSelector = () => {
    setCurrentView("job-selector");
  };

  const handleApprovedGeneration = (generatedText: string) => {
    console.log("Approved generation:", generatedText);
    setStatus("Generation approved!");
    handleBackToMain();
  };

  if (loading) {
    return (
      <div
        style={{
          width: 320,
          padding: 12,
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ width: 320, fontFamily: "sans-serif" }}>
        <AuthForm />
      </div>
    );
  }

  // Render different views based on current state
  if (currentView === "resume-selector") {
    return (
      <ResumeSelector
        onResumeSelected={handleResumeSelected}
        onBack={handleBackToMain}
      />
    );
  }

  if (currentView === "job-selector") {
    return (
      <JobSelector
        onJobSelected={handleJobSelected}
        onBack={handleBackToResumeSelector}
      />
    );
  }

  if (
    currentView === "generation-preview" &&
    selectedResumeId &&
    selectedJobId
  ) {
    return (
      <GenerationPreview
        resumeId={selectedResumeId}
        jobId={selectedJobId}
        onBack={handleBackToJobSelector}
        onApproved={handleApprovedGeneration}
      />
    );
  }

  // Main view
  return (
    <div style={{ width: 320, padding: 12, fontFamily: "sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>AI Resume Assistant</h3>
        <button
          onClick={handleLogout}
          style={{
            padding: "4px 8px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        Welcome, {user.email}
      </div>

      <button
        onClick={capture}
        style={{
          width: "100%",
          padding: "8px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        Capture Job Description
      </button>

      <button
        onClick={handleGenerateResume}
        style={{
          width: "100%",
          padding: "8px",
          backgroundColor: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        Generate Resume/Cover Letter
      </button>

      <div style={{ marginTop: 8, color: "#555", fontSize: 12 }}>{status}</div>

      {jobText && (
        <textarea
          style={{
            width: "100%",
            height: 120,
            marginTop: 8,
            fontSize: 12,
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "vertical",
          }}
          value={jobText}
          readOnly
        />
      )}
    </div>
  );
}
