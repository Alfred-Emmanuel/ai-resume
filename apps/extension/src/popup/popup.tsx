import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthForm } from "../components/auth/AuthForm";

export function Popup() {
  const { user, loading, logout } = useAuth();
  const [status, setStatus] = useState<string>("");
  const [jobText, setJobText] = useState<string>("");

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

      {jobText && (
        <button
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Generate Resume
        </button>
      )}
    </div>
  );
}
