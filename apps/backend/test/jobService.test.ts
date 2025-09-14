import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  jobService,
  CreateJobData,
  JobCaptureData,
} from "../src/services/job.js";
import { db } from "../src/config/database.js";
import { v4 as uuidv4 } from "uuid";

describe("Job Service", () => {
  const testUserId = uuidv4();
  const testJobData: CreateJobData = {
    title: "Senior Software Engineer",
    company: "Tech Corp",
    location: "San Francisco, CA",
    description:
      "Looking for a senior software engineer with React and Node.js experience.",
    url: "https://example.com/job/123",
  };

  const testCaptureData: JobCaptureData = {
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    source: "linkedin",
    rawText:
      "We are looking for a full-stack developer with experience in React, Node.js, and cloud technologies.",
    url: "https://linkedin.com/jobs/456",
  };

  beforeEach(async () => {
    // Clean up any existing test data
    await db.query("DELETE FROM jobs WHERE user_id = $1", [testUserId]);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await db.query("DELETE FROM jobs WHERE user_id = $1", [testUserId]);
  });

  describe("createJob", () => {
    it("should create a job successfully", async () => {
      const job = await jobService.createJob(testUserId, testJobData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.user_id).toBe(testUserId);
      expect(job.title).toBe(testJobData.title);
      expect(job.company).toBe(testJobData.company);
      expect(job.location).toBe(testJobData.location);
      expect(job.description).toBe(testJobData.description);
      expect(job.url).toBe(testJobData.url);
      expect(job.created_at).toBeDefined();
      expect(job.updated_at).toBeDefined();
    });

    it("should create a job with minimal data", async () => {
      const minimalJobData: CreateJobData = {
        title: "Software Engineer",
      };

      const job = await jobService.createJob(testUserId, minimalJobData);

      expect(job).toBeDefined();
      expect(job.title).toBe(minimalJobData.title);
      expect(job.company).toBeNull();
      expect(job.location).toBeNull();
      expect(job.description).toBeNull();
      expect(job.url).toBeNull();
    });

    it("should throw error for invalid user ID", async () => {
      await expect(
        jobService.createJob("invalid-uuid", testJobData)
      ).rejects.toThrow("User ID must be a valid UUID");
    });

    it("should throw error for missing title", async () => {
      const invalidJobData = { ...testJobData, title: "" };

      await expect(
        jobService.createJob(testUserId, invalidJobData)
      ).rejects.toThrow("Job title is required");
    });
  });

  describe("captureJob", () => {
    it("should capture a job successfully", async () => {
      const job = await jobService.captureJob(testUserId, testCaptureData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.user_id).toBe(testUserId);
      expect(job.title).toBe(testCaptureData.title);
      expect(job.company).toBe(testCaptureData.company);
      expect(job.location).toBe(testCaptureData.location);
      expect(job.description).toBe(testCaptureData.rawText);
      expect(job.url).toBe(testCaptureData.url);
    });

    it("should use description if provided instead of rawText", async () => {
      const captureDataWithDescription = {
        ...testCaptureData,
        description: "Custom description",
      };

      const job = await jobService.captureJob(
        testUserId,
        captureDataWithDescription
      );

      expect(job.description).toBe("Custom description");
    });

    it("should throw error for missing title", async () => {
      const invalidCaptureData = { ...testCaptureData, title: "" };

      await expect(
        jobService.captureJob(testUserId, invalidCaptureData)
      ).rejects.toThrow("Job title is required");
    });

    it("should throw error for missing rawText", async () => {
      const invalidCaptureData = { ...testCaptureData, rawText: "" };

      await expect(
        jobService.captureJob(testUserId, invalidCaptureData)
      ).rejects.toThrow("Job description is required");
    });
  });

  describe("getJobById", () => {
    it("should get a job by ID", async () => {
      const createdJob = await jobService.createJob(testUserId, testJobData);
      const retrievedJob = await jobService.getJobById(
        createdJob.id,
        testUserId
      );

      expect(retrievedJob).toBeDefined();
      expect(retrievedJob.id).toBe(createdJob.id);
      expect(retrievedJob.title).toBe(testJobData.title);
    });

    it("should throw error for non-existent job", async () => {
      const nonExistentId = uuidv4();

      await expect(
        jobService.getJobById(nonExistentId, testUserId)
      ).rejects.toThrow("Job not found");
    });

    it("should throw error for job belonging to different user", async () => {
      const otherUserId = uuidv4();
      const createdJob = await jobService.createJob(testUserId, testJobData);

      await expect(
        jobService.getJobById(createdJob.id, otherUserId)
      ).rejects.toThrow("Job not found");
    });
  });

  describe("getJobsByUserId", () => {
    it("should get jobs for user", async () => {
      // Create multiple jobs
      await jobService.createJob(testUserId, testJobData);
      await jobService.createJob(testUserId, {
        ...testJobData,
        title: "Another Job",
      });

      const jobs = await jobService.getJobsByUserId(testUserId);

      expect(jobs).toHaveLength(2);
      expect(jobs[0].user_id).toBe(testUserId);
      expect(jobs[1].user_id).toBe(testUserId);
    });

    it("should return empty array for user with no jobs", async () => {
      const jobs = await jobService.getJobsByUserId(testUserId);
      expect(jobs).toHaveLength(0);
    });

    it("should respect limit and offset", async () => {
      // Create 5 jobs
      for (let i = 0; i < 5; i++) {
        await jobService.createJob(testUserId, {
          ...testJobData,
          title: `Job ${i}`,
        });
      }

      const jobs = await jobService.getJobsByUserId(testUserId, 2, 1);
      expect(jobs).toHaveLength(2);
    });
  });

  describe("updateJob", () => {
    it("should update a job successfully", async () => {
      const createdJob = await jobService.createJob(testUserId, testJobData);

      const updateData = {
        title: "Updated Title",
        company: "Updated Company",
      };

      const updatedJob = await jobService.updateJob(
        createdJob.id,
        testUserId,
        updateData
      );

      expect(updatedJob.title).toBe(updateData.title);
      expect(updatedJob.company).toBe(updateData.company);
      expect(updatedJob.location).toBe(testJobData.location); // Should remain unchanged
    });

    it("should throw error for non-existent job", async () => {
      const nonExistentId = uuidv4();

      await expect(
        jobService.updateJob(nonExistentId, testUserId, { title: "New Title" })
      ).rejects.toThrow("Job not found");
    });
  });

  describe("deleteJob", () => {
    it("should delete a job successfully", async () => {
      const createdJob = await jobService.createJob(testUserId, testJobData);

      const deleted = await jobService.deleteJob(createdJob.id, testUserId);
      expect(deleted).toBe(true);

      // Verify job is deleted
      await expect(
        jobService.getJobById(createdJob.id, testUserId)
      ).rejects.toThrow("Job not found");
    });

    it("should return false for non-existent job", async () => {
      const nonExistentId = uuidv4();

      const deleted = await jobService.deleteJob(nonExistentId, testUserId);
      expect(deleted).toBe(false);
    });
  });

  describe("getJobCount", () => {
    it("should return correct job count", async () => {
      // Initially should be 0
      let count = await jobService.getJobCount(testUserId);
      expect(count).toBe(0);

      // Create 3 jobs
      await jobService.createJob(testUserId, testJobData);
      await jobService.createJob(testUserId, {
        ...testJobData,
        title: "Job 2",
      });
      await jobService.createJob(testUserId, {
        ...testJobData,
        title: "Job 3",
      });

      count = await jobService.getJobCount(testUserId);
      expect(count).toBe(3);
    });
  });

  describe("searchJobs", () => {
    it("should search jobs by title", async () => {
      await jobService.createJob(testUserId, {
        ...testJobData,
        title: "React Developer",
      });
      await jobService.createJob(testUserId, {
        ...testJobData,
        title: "Python Developer",
      });

      const results = await jobService.searchJobs(testUserId, "React");
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe("React Developer");
    });

    it("should search jobs by company", async () => {
      await jobService.createJob(testUserId, {
        ...testJobData,
        company: "Google",
      });
      await jobService.createJob(testUserId, {
        ...testJobData,
        company: "Microsoft",
      });

      const results = await jobService.searchJobs(testUserId, "Google");
      expect(results).toHaveLength(1);
      expect(results[0].company).toBe("Google");
    });

    it("should return empty array for no matches", async () => {
      await jobService.createJob(testUserId, testJobData);

      const results = await jobService.searchJobs(testUserId, "NonExistent");
      expect(results).toHaveLength(0);
    });
  });
});
