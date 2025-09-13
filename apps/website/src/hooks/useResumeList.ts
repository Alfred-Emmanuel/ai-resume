import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { ResumeListState, Resume } from "../types";
import { MESSAGES } from "../constants";

export const useResumeList = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ResumeListState>({
    resumes: [],
    loading: false,
  });

  const loadResumes = async (): Promise<boolean> => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        error: "User not authenticated",
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await apiService.getResumes(token);

      if (response.error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        resumes: Array.isArray((response.data as any)?.data)
          ? (response.data as any).data
          : [],
      }));
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load resumes";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  const addResume = (resume: Resume) => {
    setState((prev) => ({
      ...prev,
      resumes: [resume, ...prev.resumes],
    }));
  };

  const removeResume = (resumeId: string) => {
    setState((prev) => ({
      ...prev,
      resumes: prev.resumes.filter((resume) => resume.id !== resumeId),
    }));
  };

  // Load resumes when user changes
  useEffect(() => {
    if (user) {
      loadResumes();
    } else {
      setState({
        resumes: [],
        loading: false,
      });
    }
  }, [user]);

  return {
    ...state,
    loadResumes,
    addResume,
    removeResume,
  };
};
