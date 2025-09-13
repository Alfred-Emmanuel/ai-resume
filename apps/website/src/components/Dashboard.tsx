import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Resume } from "../types";
import Navigation from "./layout/Navigation";
import DashboardCards from "./dashboard/DashboardCards";
import ResumeList from "./resume/ResumeList";
import ResumeDetails from "./resume/ResumeDetails";

export const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [showResumes, setShowResumes] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleViewDetails = (resume: Resume) => {
    console.log("View details for resume:", resume.id);
    setSelectedResume(resume);
  };

  const handleDownload = (resume: Resume) => {
    console.log("Download resume:", resume.id);
    // TODO: Implement download functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {selectedResume ? (
            <ResumeDetails
              resume={selectedResume}
              onBack={() => setSelectedResume(null)}
            />
          ) : !showResumes ? (
            <DashboardCards onShowResumes={() => setShowResumes(true)} />
          ) : (
            <ResumeList
              onBackToDashboard={() => setShowResumes(false)}
              onViewDetails={handleViewDetails}
              onDownload={handleDownload}
            />
          )}
        </div>
      </main>
    </div>
  );
};
