// Error handling utilities

import { AppError } from "../types/index.js";
import { HTTP_STATUS } from "../constants/index.js";

export class CustomError extends Error implements AppError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  public readonly errors: any[];

  constructor(errors: any[], message: string = "Validation failed") {
    super(message, HTTP_STATUS.BAD_REQUEST);
    this.errors = errors;
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = "Authentication failed") {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = "Access denied") {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = "Database operation failed") {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export class StorageError extends CustomError {
  constructor(message: string = "Storage operation failed") {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

// Error handler middleware
export const errorHandler = (error: Error, req: any, res: any, next: any) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = "Internal server error";

  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === "ValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Validation failed";
  } else if (error.name === "CastError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid ID format";
  }

  // Log error for debugging
  console.error("Error:", {
    message: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
