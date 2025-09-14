import React, { useState, useEffect } from "react";

interface Job {
  id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  created_at: string;
}

interface JobSelectorProps {
  onJobSelected: (jobId: string) => void;
  onBack: () => void;
}

const JobSelector: React.FC<JobSelectorProps> = ({ onJobSelected, onBack }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await chrome.identity.getAuthToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("http://localhost:3001/api/v1/jobs/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to load jobs");
      } else {
        setJobs(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
        <div style={{ fontSize: 14, marginBottom: 8 }}>Loading jobs...</div>
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
          <h3 style={{ margin: 0, fontSize: 16 }}>Select Job</h3>
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
          onClick={loadJobs}
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

  if (jobs.length === 0) {
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
          <h3 style={{ margin: 0, fontSize: 16 }}>Select Job</h3>
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
          <div style={{ marginBottom: "8px" }}>No jobs found.</div>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            Capture job postings to get started.
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
          Select Job ({jobs.length} found)
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
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "8px",
              marginBottom: "8px",
              cursor: "pointer",
              backgroundColor: "#f9fafb",
            }}
            onClick={() => onJobSelected(job.id)}
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
                {job.title}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "2px",
                }}
              >
                {job.company && (
                  <span style={{ fontWeight: "500" }}>{job.company}</span>
                )}
                {job.company && job.location && <span> • </span>}
                {job.location && <span>{job.location}</span>}
                <span> • {formatDate(job.created_at)}</span>
              </div>
              {job.description && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  {truncateText(job.description)}
                </div>
              )}
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "10px",
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View Original →
                </a>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJobSelected(job.id);
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobSelector;

