import React, { useState, useEffect } from "react";

interface Resume {
  id: string;
  filename: string;
  canonical_json?: any;
  created_at: string;
}

interface ResumeSelectorProps {
  onResumeSelected: (resumeId: string) => void;
  onBack: () => void;
}

const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  onResumeSelected,
  onBack,
}) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await chrome.identity.getAuthToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("http://localhost:3001/api/v1/resumes/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load resumes");
      } else {
        setResumes(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getResumeStatus = (resume: Resume) => {
    if (!resume.canonical_json) {
      return { status: "Processing", color: "#f59e0b" };
    }
    return { status: "Ready", color: "#10b981" };
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
        <div style={{ fontSize: 14, marginBottom: 8 }}>Loading resumes...</div>
        <button
          onClick={onBack}
          style={{
            padding: "4px 8px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    );
  }

  if (error) {
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
          <h3 style={{ margin: 0, fontSize: 16 }}>Select Resume</h3>
          <button
            onClick={onBack}
            style={{
              padding: "4px 8px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
        <div
          style={{
            backgroundColor: "#fef2f2",
            borderLeft: "4px solid #ef4444",
            padding: "8px",
            marginBottom: "8px",
            fontSize: "12px",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
        <button
          onClick={loadResumes}
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (resumes.length === 0) {
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
          <h3 style={{ margin: 0, fontSize: 16 }}>Select Resume</h3>
          <button
            onClick={onBack}
            style={{
              padding: "4px 8px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          <div style={{ marginBottom: "8px" }}>No resumes found.</div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            Upload resumes on the website to get started.
          </div>
        </div>
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
        <h3 style={{ margin: 0, fontSize: 16 }}>
          Select Resume ({resumes.length} found)
        </h3>
        <button
          onClick={onBack}
          style={{
            padding: "4px 8px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>

      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {resumes.map((resume) => {
          const { status, color } = getResumeStatus(resume);
          return (
            <div
              key={resume.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "8px",
                marginBottom: "8px",
                cursor: resume.canonical_json ? "pointer" : "not-allowed",
                backgroundColor: resume.canonical_json ? "#f9fafb" : "#f3f4f6",
                opacity: resume.canonical_json ? 1 : 0.6,
              }}
              onClick={() =>
                resume.canonical_json && onResumeSelected(resume.id)
              }
            >
              <div style={{ marginBottom: "4px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "14px",
                    color: "#111827",
                    marginBottom: "2px",
                  }}
                >
                  {resume.filename}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  <span>Created: {formatDate(resume.created_at)}</span>
                </div>
                <div
                  style={{ fontSize: "11px", color: color, fontWeight: "500" }}
                >
                  Status: {status}
                </div>
              </div>
              {resume.canonical_json && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResumeSelected(resume.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "4px 8px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Select
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResumeSelector;

