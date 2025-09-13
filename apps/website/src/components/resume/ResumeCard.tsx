import React from "react";
import { Resume } from "../../types";
import { formatDate, getFileTypeFromKey } from "../../utils";
import Button from "../ui/Button";

interface ResumeCardProps {
  resume: Resume;
  onViewDetails?: (resume: Resume) => void;
  onDownload?: (resume: Resume) => void;
  onDelete?: (resume: Resume) => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onViewDetails,
  onDownload,
  onDelete,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {getFileTypeFromKey(resume.file_key)}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Resume {resume.id.slice(0, 8)}...
              </h3>
              <p className="text-sm text-gray-600">
                Uploaded: {formatDate(resume.created_at)}
              </p>
              {resume.canonical_json && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Parsed
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(resume)}
              variant="primary"
              size="sm"
            >
              View Details
            </Button>
          )}
          {onDownload && (
            <Button
              onClick={() => onDownload(resume)}
              variant="secondary"
              size="sm"
            >
              Download
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(resume)}
              variant="secondary"
              size="sm"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeCard;
