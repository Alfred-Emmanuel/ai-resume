import React, { useState } from "react";

interface GenerationPreviewProps {
  resumeId: string;
  jobId: string;
  onBack: () => void;
  onApproved?: (generatedText: string) => void;
}

interface GenerationResult {
  generation_id: string;
  generated_text: string;
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  metadata: {
    tokensUsed?: number;
    model?: string;
    processingTimeMs: number;
    hallucinationCheck: {
      passed: boolean;
      issues: string[];
    };
  };
  status: "completed" | "failed";
  message: string;
}

const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  resumeId,
  jobId,
  onBack,
  onApproved,
}) => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [generationType, setGenerationType] = useState<
    "resume" | "coverletter"
  >("resume");

  const generateContent = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Get auth token
      const token = await chrome.identity.getAuthToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const endpoint =
        generationType === "resume"
          ? "/generate/resume"
          : "/generate/coverletter";
      const response = await fetch(`http://localhost:3001/api/v1${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_id: resumeId,
          job_id: jobId,
          options: { preview_only: true },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Generation failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = () => {
    if (result && onApproved) {
      onApproved(result.generated_text);
    }
  };

  const renderDiff = () => {
    if (!result?.diff) return null;

    const { added, removed, modified } = result.diff;

    return (
      <div style={{ fontSize: "12px", marginTop: "8px" }}>
        {added.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontWeight: "bold",
                color: "#16a34a",
                marginBottom: "4px",
              }}
            >
              Added:
            </div>
            {added.map((item, index) => (
              <div
                key={index}
                style={{
                  color: "#16a34a",
                  backgroundColor: "#f0fdf4",
                  padding: "4px",
                  marginBottom: "2px",
                  borderRadius: "4px",
                }}
              >
                + {item}
              </div>
            ))}
          </div>
        )}

        {removed.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontWeight: "bold",
                color: "#dc2626",
                marginBottom: "4px",
              }}
            >
              Removed:
            </div>
            {removed.map((item, index) => (
              <div
                key={index}
                style={{
                  color: "#dc2626",
                  backgroundColor: "#fef2f2",
                  padding: "4px",
                  marginBottom: "2px",
                  borderRadius: "4px",
                }}
              >
                - {item}
              </div>
            ))}
          </div>
        )}

        {modified.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontWeight: "bold",
                color: "#2563eb",
                marginBottom: "4px",
              }}
            >
              Modified:
            </div>
            {modified.map((item, index) => (
              <div
                key={index}
                style={{
                  color: "#2563eb",
                  backgroundColor: "#eff6ff",
                  padding: "4px",
                  marginBottom: "2px",
                  borderRadius: "4px",
                }}
              >
                ~ {item}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHallucinationWarning = () => {
    if (!result?.metadata.hallucinationCheck.issues.length) return null;

    return (
      <div
        style={{
          backgroundColor: "#fef3c7",
          borderLeft: "4px solid #f59e0b",
          padding: "8px",
          marginBottom: "8px",
          fontSize: "12px",
        }}
      >
        <div
          style={{ color: "#92400e", fontWeight: "bold", marginBottom: "4px" }}
        >
          Content Review Required:
        </div>
        <ul style={{ color: "#92400e", margin: 0, paddingLeft: "16px" }}>
          {result.metadata.hallucinationCheck.issues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
      </div>
    );
  };

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
        <h3 style={{ margin: 0, fontSize: 16 }}>Generate Content</h3>
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

      {error && (
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
      )}

      {!result && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ marginBottom: "8px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Generate:
            </label>
            <select
              value={generationType}
              onChange={(e) =>
                setGenerationType(e.target.value as "resume" | "coverletter")
              }
              style={{
                width: "100%",
                padding: "4px",
                fontSize: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="resume">Resume</option>
              <option value="coverletter">Cover Letter</option>
            </select>
          </div>
          <button
            onClick={generateContent}
            disabled={generating}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: generating ? "#9ca3af" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating
              ? "Generating..."
              : `Generate ${
                  generationType === "resume" ? "Resume" : "Cover Letter"
                }`}
          </button>
        </div>
      )}

      {result && (
        <div>
          {renderHallucinationWarning()}

          <div style={{ marginBottom: "8px" }}>
            <button
              onClick={() => setShowDiff(!showDiff)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                marginRight: "4px",
              }}
            >
              {showDiff ? "Hide" : "Show"} Changes
            </button>
            <button
              onClick={handleApprove}
              style={{
                padding: "4px 8px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                marginRight: "4px",
              }}
            >
              Approve
            </button>
            <button
              onClick={() => setResult(null)}
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
              New
            </button>
          </div>

          {showDiff && (
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "8px",
                borderRadius: "4px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}
              >
                Changes Made:
              </div>
              {renderDiff()}
            </div>
          )}

          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              Generated Content:
            </div>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "8px",
                borderRadius: "4px",
                maxHeight: "200px",
                overflow: "auto",
                fontSize: "11px",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.generated_text}
            </div>
          </div>

          <div style={{ fontSize: "10px", color: "#6b7280" }}>
            <div>ID: {result.generation_id}</div>
            <div>Model: {result.metadata.model || "Unknown"}</div>
            <div>Time: {result.metadata.processingTimeMs}ms</div>
            {result.metadata.tokensUsed && (
              <div>Tokens: {result.metadata.tokensUsed}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationPreview;

