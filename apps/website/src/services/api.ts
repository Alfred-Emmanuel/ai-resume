// API service layer for backend communication

import { API_BASE_URL } from "../constants";
import { Resume, UploadResponse, ApiResponse } from "../types";

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;
      if (response.status !== 204) {
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // Fallback for non-JSON (e.g., HTML error pages / empty bodies)
          const text = await response.text();
          data = text;
        }
      }

      if (!response.ok) {
        const errorMessage =
          (data &&
            typeof data === "object" &&
            "error" in data &&
            (data as any).error) ||
          (typeof data === "string" && data) ||
          "Request failed";
        return { error: errorMessage };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  // Resume endpoints
  async uploadResume(
    file: File,
    token: string
  ): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(`${this.baseUrl}/resumes/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || "Upload failed",
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async getResumes(token: string): Promise<ApiResponse<Resume[]>> {
    return this.authenticatedRequest<Resume[]>("/resumes/", token);
  }

  async getResume(id: string, token: string): Promise<ApiResponse<Resume>> {
    return this.authenticatedRequest<Resume>(`/resumes/${id}`, token);
  }

  async deleteResume(id: string, token: string): Promise<ApiResponse<void>> {
    return this.authenticatedRequest<void>(`/resumes/${id}`, token, {
      method: "DELETE",
    });
  }

  async updateResumeSections(
    id: string,
    sections: any,
    token: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.authenticatedRequest<{ success: boolean }>(
      `/resumes/${id}/sections`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({ sections }),
      }
    );
  }

  // Auth endpoints
  async verifyToken(idToken: string): Promise<ApiResponse<any>> {
    return this.request("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  }

  async getHealth(): Promise<ApiResponse<{ ok: boolean; service: string }>> {
    return this.request("/auth/health");
  }

  // PDF Parser endpoints
  async uploadResumeToPDFParser(
    file: File,
    token: string
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(`${this.baseUrl}/pdf-parser/upload-resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || "PDF parsing failed",
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "PDF parsing failed",
      };
    }
  }

  async getPDFParserHealth(): Promise<ApiResponse<any>> {
    return this.request("/pdf-parser/health");
  }

  async getPDFParserStatus(): Promise<ApiResponse<any>> {
    return this.request("/pdf-parser/status");
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
