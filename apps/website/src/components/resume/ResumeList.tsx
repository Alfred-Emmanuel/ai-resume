import React from "react";
import { Resume } from "../../types";
import { useResumeList } from "../../hooks/useResumeList";
import { apiService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import ResumeCard from "./ResumeCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import Button from "../ui/Button";

interface ResumeListProps {
  onBackToDashboard: () => void;
  onViewDetails?: (resume: Resume) => void;
  onDownload?: (resume: Resume) => void;
}

const ResumeList: React.FC<ResumeListProps> = ({
  onBackToDashboard,
  onViewDetails,
  onDownload,
}) => {
  const { resumes, loading, error, loadResumes, removeResume } =
    useResumeList();
  const { user } = useAuth();

  const handleDelete = async (resume: Resume) => {
    if (!user) return;
    const confirm = window.confirm(
      "Delete this resume? This cannot be undone."
    );
    if (!confirm) return;
    const token = await user.getIdToken();
    const resp = await apiService.deleteResume(resume.id, token);
    if (!(resp as any)?.error) {
      removeResume(resume.id);
    } else {
      alert((resp as any).error || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Resumes
            </h2>
            <Button onClick={onBackToDashboard} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
        <div className="p-6">
          <LoadingSpinner size="md" text="Loading resumes..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Resumes
            </h2>
            <Button onClick={onBackToDashboard} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onBackToDashboard} variant="primary" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Resumes
            </h2>
            <Button onClick={onBackToDashboard} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No resumes uploaded yet.</p>
            <Button onClick={onBackToDashboard} variant="primary" size="sm">
              Upload Your First Resume
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Your Resumes</h2>
          <div className="flex gap-2">
            <Button onClick={loadResumes} variant="secondary" size="sm">
              Refresh
            </Button>
            <Button onClick={onBackToDashboard} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {(resumes || []).map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onViewDetails={onViewDetails}
              onDownload={onDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeList;
