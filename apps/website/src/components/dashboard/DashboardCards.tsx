import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useResumeList } from "../../hooks/useResumeList";
import FileUpload from "../ui/FileUpload";
import Button from "../ui/Button";

interface DashboardCardsProps {
  onShowResumes: () => void;
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ onShowResumes }) => {
  const { user, sendVerificationEmail } = useAuth();
  const { uploading, message, uploadFile, clearMessage } = useFileUpload();
  const { resumes } = useResumeList();

  const handleFileSelect = async (file: File) => {
    const success = await uploadFile(file);
    if (success) {
      // File uploaded successfully, the useResumeList hook will automatically refresh
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail();
      alert("Verification email sent! Check your inbox.");
    } catch (error) {
      console.error("Failed to send verification email:", error);
      alert("Failed to send verification email. Please try again.");
    }
  };

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to AI Resume App
        </h2>

        {user && !user.emailVerified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 mb-2">
              Please verify your email address to access all features.
            </p>
            <Button
              onClick={handleSendVerification}
              variant="secondary"
              size="sm"
            >
              Send Verification Email
            </Button>
          </div>
        )}

        <p className="text-gray-600 mb-8">
          Upload your resume and start tailoring it to any job posting.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Resume Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Resume
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload your resume in PDF or DOCX format (max 10MB)
            </p>

            <FileUpload
              onFileSelect={handleFileSelect}
              disabled={uploading}
              loading={uploading}
              className="mt-4"
            />

            {message && (
              <div
                className={`mt-3 text-sm ${
                  message.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* View Resumes Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              View Resumes
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage your uploaded resumes ({resumes.length} uploaded)
            </p>
            <Button
              onClick={onShowResumes}
              variant="success"
              size="sm"
              className="mt-4"
            >
              View All
            </Button>
          </div>

          {/* Generate Resume Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Generate Resume
            </h3>
            <p className="text-gray-600 text-sm">
              Tailor your resume to a specific job
            </p>
            <Button variant="secondary" size="sm" className="mt-4">
              Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
