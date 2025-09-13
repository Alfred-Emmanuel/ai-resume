import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/auth/AuthModal";
import { Dashboard } from "../components/Dashboard";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </main>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <>
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Resume App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Tailor your resume to any job in seconds. Get past ATS systems and
            land more interviews.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Get Started
            </button>

            <div className="text-sm text-gray-500">
              <p>✓ Upload your resume in PDF or DOCX</p>
              <p>✓ AI-powered tailoring to job descriptions</p>
              <p>✓ ATS-friendly formatting</p>
              <p>✓ Download in PDF or DOCX</p>
            </div>
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  );
}
