import { v4 as uuidv4 } from "uuid";
import * as Minio from "minio";

export interface StorageService {
  uploadFile(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string>;
  getFileUrl(fileKey: string): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
}

export class MinIOStorageService implements StorageService {
  private client: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET_NAME || "ai-resume-files";

    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    });
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const fileKey = `resumes/${uuidv4()}-${filename}`;

    try {
      // Ensure bucket exists
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName, "us-east-1");
      }

      // Upload file
      await this.client.putObject(this.bucketName, fileKey, file, file.length, {
        "Content-Type": contentType,
      });

      return fileKey;
    } catch (error) {
      console.error("MinIO upload error:", error);
      throw new Error("Failed to upload file");
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
    try {
      // Generate presigned URL valid for 1 hour
      const url = await this.client.presignedGetObject(
        this.bucketName,
        fileKey,
        3600
      );
      return url;
    } catch (error) {
      console.error("MinIO URL generation error:", error);
      throw new Error("Failed to generate file URL");
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, fileKey);
    } catch (error) {
      console.error("MinIO delete error:", error);
      throw new Error("Failed to delete file");
    }
  }
}

// Factory function to create storage service based on environment
export const createStorageService = (): StorageService => {
  const storageType = process.env.STORAGE_TYPE || "minio";

  switch (storageType) {
    case "minio":
      return new MinIOStorageService();
    case "s3":
      // TODO: Implement S3StorageService
      throw new Error("S3 storage not implemented yet");
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
};
