import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { FileUploadState } from "../types";
import { MESSAGES } from "../constants";

export const useFileUpload = () => {
  const { user } = useAuth();
  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    message: "",
  });

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        message: "User not authenticated",
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      uploading: true,
      message: "",
      error: undefined,
    }));

    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await apiService.uploadResume(file, token);

      if (response.error) {
        setState((prev) => ({
          ...prev,
          uploading: false,
          message: response.error || MESSAGES.UPLOAD_ERROR,
          error: response.error,
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        uploading: false,
        message: `${MESSAGES.UPLOAD_SUCCESS} ID: ${response.data?.resume_id}`,
      }));
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : MESSAGES.UPLOAD_ERROR;
      setState((prev) => ({
        ...prev,
        uploading: false,
        message: errorMessage,
        error: errorMessage,
      }));
      return false;
    }
  };

  const clearMessage = () => {
    setState((prev) => ({
      ...prev,
      message: "",
      error: undefined,
    }));
  };

  return {
    ...state,
    uploadFile,
    clearMessage,
  };
};
