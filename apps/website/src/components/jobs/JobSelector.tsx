import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import { apiService } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

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
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await apiService.getJobs(token);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setJobs(response.data);
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

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Select Job</h2>
            <Button onClick={onBack} variant="secondary" size="sm">
              Back
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Select Job</h2>
            <Button onClick={onBack} variant="secondary" size="sm">
              Back
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <div className="mt-4">
            <Button onClick={loadJobs} variant="primary" size="sm">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Select Job</h2>
            <Button onClick={onBack} variant="secondary" size="sm">
              Back
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No jobs found.</p>
            <p className="text-sm text-gray-500">
              Capture job postings using the browser extension to get started.
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
            Select Job ({jobs.length} found)
          </h2>
          <Button onClick={onBack} variant="secondary" size="sm">
            Back
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onJobSelected(job.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    {job.company && (
                      <span className="font-medium">{job.company}</span>
                    )}
                    {job.location && <span>{job.location}</span>}
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                  {job.description && (
                    <p className="text-sm text-gray-700 mb-2">
                      {truncateText(job.description)}
                    </p>
                  )}
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Original Posting →
                    </a>
                  )}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJobSelected(job.id);
                  }}
                  variant="primary"
                  size="sm"
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobSelector;

