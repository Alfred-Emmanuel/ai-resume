import React, { useState, useEffect } from "react";
import { Resume } from "../../types";
import Button from "../ui/Button";
import { apiService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import JobSelector from "../jobs/JobSelector";
import GenerationPreview from "../generation/GenerationPreview";

interface ResumeDetailsProps {
  resume: Resume;
  onBack: () => void;
}

interface RawSections {
  full_text?: string;
}

const ResumeDetails: React.FC<ResumeDetailsProps> = ({ resume, onBack }) => {
  const { user } = useAuth();
  const [sections, setSections] = useState<RawSections>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [showGenerationPreview, setShowGenerationPreview] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize sections from canonical_json
    if (resume.canonical_json) {
      setSections(resume.canonical_json as RawSections);
    }
  }, [resume.canonical_json]);

  const handleSectionChange = (
    sectionKey: keyof RawSections,
    value: string
  ) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await apiService.updateResumeSections(
        resume.id,
        sections,
        token
      );

      if (response.error) {
        setMessage({ type: "error", text: response.error });
      } else {
        setMessage({
          type: "success",
          text: "Resume sections updated successfully!",
        });
        setEditing(false);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save changes",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateResume = () => {
    setShowJobSelector(true);
  };

  const handleJobSelected = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowJobSelector(false);
    setShowGenerationPreview(true);
  };

  const handleBackFromJobSelector = () => {
    setShowJobSelector(false);
  };

  const handleBackFromGeneration = () => {
    setShowGenerationPreview(false);
    setSelectedJobId(null);
  };

  const handleApprovedGeneration = (generatedText: string) => {
    // TODO: Implement saving the approved generated text
    console.log("Approved generation:", generatedText);
    setShowGenerationPreview(false);
    setSelectedJobId(null);
    setMessage({
      type: "success",
      text: "Generated content has been approved and saved!",
    });
  };

  const rawText = (resume.canonical_json as any)?.full_text as
    | string
    | undefined;

  const renderFormatted = (text: string) => {
    const SECTION_HEADERS = [
      "summary",
      "experience",
      "work experience",
      "professional experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "languages",
      "interests",
      "achievements",
      "key achievements",
      "awards",
      "publications",
    ];

    const autoLink = (line: string) => {
      const urlRegex = /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)/gi;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = urlRegex.exec(line)) !== null) {
        const [full] = match;
        const start = match.index;
        if (start > lastIndex) parts.push(line.slice(lastIndex, start));
        const href = full.startsWith("http") ? full : `https://${full}`;
        parts.push(
          <a
            key={`${href}-${start}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline break-all"
          >
            {full}
          </a>
        );
        lastIndex = start + full.length;
      }
      if (lastIndex < line.length) parts.push(line.slice(lastIndex));
      return parts.length ? parts : line;
    };

    const isHeader = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      const lower = trimmed.toLowerCase();
      if (SECTION_HEADERS.includes(lower)) return true;
      const alpha = trimmed.replace(/[^A-Za-z]/g, "");
      const uppercaseRatio = alpha
        ? alpha.replace(/[^A-Z]/g, "").length / alpha.length
        : 0;
      return uppercaseRatio > 0.7 || /:\s*$/.test(trimmed);
    };

    const isBullet = (line: string) => /^[\-\u2022\*]\s+/.test(line.trim());

    const paragraphs = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split(/\n{2,}/)
      .map((p) => p.split("\n"));

    return (
      <div className="space-y-5">
        {paragraphs.map((lines, idx) => {
          const first = lines[0] || "";
          const header = isHeader(first);
          const bodyLines = header ? lines.slice(1) : lines;
          return (
            <div key={idx} className="space-y-1">
              {header && (
                <div className="font-semibold text-gray-900 tracking-wide">
                  {autoLink(first)}
                </div>
              )}
              {bodyLines.map((ln, i) => (
                <div key={i} className="text-gray-700 text-sm leading-6">
                  {isBullet(ln) ? (
                    <span>
                      <span className="mr-2">•</span>
                      {autoLink(ln.replace(/^[\-\u2022\*]\s+/, ""))}
                    </span>
                  ) : (
                    <span>{autoLink(ln)}</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  if (showJobSelector) {
    return (
      <JobSelector
        onJobSelected={handleJobSelected}
        onBack={handleBackFromJobSelector}
      />
    );
  }

  if (showGenerationPreview && selectedJobId) {
    return (
      <GenerationPreview
        resume={resume}
        jobId={selectedJobId}
        onBack={handleBackFromGeneration}
        onApproved={handleApprovedGeneration}
      />
    );
  }

  if (!resume.canonical_json) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Resume Details
            </h2>
            <Button onClick={onBack} variant="secondary" size="sm">
              Back to Resumes
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">
              This resume has not been processed yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Resume Details - {resume.filename}
          </h2>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  onClick={handleSave}
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Raw Text"}
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleGenerateResume}
                  variant="primary"
                  size="sm"
                >
                  Generate Resume
                </Button>
                <Button
                  onClick={() => setEditing(true)}
                  variant="secondary"
                  size="sm"
                >
                  Edit Raw Text
                </Button>
              </>
            )}
            <Button onClick={onBack} variant="secondary" size="sm">
              Back to Resumes
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`px-6 py-3 ${
            message.type === "success"
              ? "bg-green-50 border-l-4 border-green-400"
              : "bg-red-50 border-l-4 border-red-400"
          }`}
        >
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Raw Text</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {editing ? (
              <textarea
                value={sections.full_text || ""}
                onChange={(e) =>
                  handleSectionChange("full_text", e.target.value)
                }
                className="w-full h-96 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
                placeholder="Paste or edit the full raw text here..."
              />
            ) : (
              <div className="max-h-[32rem] overflow-auto break-words">
                {renderFormatted(
                  (sections.full_text || rawText || "").trim() ||
                    "No text extracted."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDetails;
