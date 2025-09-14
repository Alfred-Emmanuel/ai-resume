import React, { useState } from "react";
import { Resume } from "../../types";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import { apiService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface GenerationPreviewProps {
  resume: Resume;
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
  resume,
  jobId,
  onBack,
  onApproved,
}) => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const generateResume = async () => {
    if (!user) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const token = await user.getIdToken();
      const response = await apiService.generateResume(
        resume.id,
        jobId,
        { preview_only: true },
        token
      );

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!user) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const token = await user.getIdToken();
      const response = await apiService.generateCoverLetter(
        resume.id,
        jobId,
        { preview_only: true },
        token
      );

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
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
      <div className="space-y-4">
        {added.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-800 mb-2">Added:</h4>
            <ul className="space-y-1">
              {added.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-green-700 bg-green-50 p-2 rounded"
                >
                  + {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {removed.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-800 mb-2">Removed:</h4>
            <ul className="space-y-1">
              {removed.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-red-700 bg-red-50 p-2 rounded"
                >
                  - {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {modified.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Modified:
            </h4>
            <ul className="space-y-1">
              {modified.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-blue-700 bg-blue-50 p-2 rounded"
                >
                  ~ {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderHallucinationWarning = () => {
    if (!result?.metadata.hallucinationCheck.issues.length) return null;

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Content Review Required:</strong> The AI detected
              potential issues with the generated content:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {result.metadata.hallucinationCheck.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Resume/Cover Letter
          </h2>
          <Button onClick={onBack} variant="secondary" size="sm">
            Back
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Resume: {resume.filename}
          </h3>
          <p className="text-sm text-gray-600">
            Generate a tailored resume or cover letter for the selected job
            posting.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!result && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={generateResume}
                variant="primary"
                disabled={generating}
              >
                {generating ? <LoadingSpinner size="sm" /> : "Generate Resume"}
              </Button>
              <Button
                onClick={generateCoverLetter}
                variant="secondary"
                disabled={generating}
              >
                {generating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {renderHallucinationWarning()}

            <div className="flex gap-4">
              <Button
                onClick={() => setShowDiff(!showDiff)}
                variant="outline"
                size="sm"
              >
                {showDiff ? "Hide" : "Show"} Changes
              </Button>
              <Button onClick={handleApprove} variant="primary" size="sm">
                Approve & Use
              </Button>
              <Button
                onClick={() => setResult(null)}
                variant="secondary"
                size="sm"
              >
                Generate New
              </Button>
            </div>

            {showDiff && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Changes Made:
                </h4>
                {renderDiff()}
              </div>
            )}

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Generated Content:
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {result.generated_text}
                </pre>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Generation ID: {result.generation_id}</p>
              <p>Model: {result.metadata.model || "Unknown"}</p>
              <p>Processing Time: {result.metadata.processingTimeMs}ms</p>
              {result.metadata.tokensUsed && (
                <p>Tokens Used: {result.metadata.tokensUsed}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationPreview;

