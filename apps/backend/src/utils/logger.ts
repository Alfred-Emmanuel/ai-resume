// Structured logging utility

import { LogEntry, LogLevel } from "../types/index.js";

export class Logger {
  private static readonly LOG_LEVELS: Record<string, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  private static getCurrentLevel(): number {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
    return this.LOG_LEVELS[envLevel] ?? this.LOG_LEVELS.info;
  }

  private static shouldLog(level: string): boolean {
    const currentLevel = this.getCurrentLevel();
    const messageLevel = this.LOG_LEVELS[level] ?? this.LOG_LEVELS.info;
    return messageLevel <= currentLevel;
  }

  private static formatMessage(
    level: string,
    message: string,
    metadata?: any
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata: {
        ...metadata,
        service: "ai-resume-backend",
        environment: process.env.NODE_ENV || "development",
      },
    };

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(logEntry);
    } else {
      // Pretty print for development
      const metadataStr = metadata
        ? ` ${JSON.stringify(metadata, null, 2)}`
        : "";
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}`;
    }
  }

  static error(message: string, metadata?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, metadata));
    }
  }

  static warn(message: string, metadata?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, metadata));
    }
  }

  static info(message: string, metadata?: any): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, metadata));
    }
  }

  static debug(message: string, metadata?: any): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, metadata));
    }
  }

  // Specialized logging methods
  static logRequest(req: any, res: any, responseTime?: number): void {
    const metadata = {
      method: req.method,
      url: req.url,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
    };

    const level = res.statusCode >= 400 ? "warn" : "info";
    this[level](`${req.method} ${req.url}`, metadata);
  }

  static logError(error: Error, context?: any): void {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  static logDatabaseOperation(
    operation: string,
    query?: string,
    params?: any[]
  ): void {
    this.debug(`Database operation: ${operation}`, {
      query:
        query?.substring(0, 100) + (query && query.length > 100 ? "..." : ""),
      paramCount: params?.length || 0,
    });
  }

  static logAuthEvent(event: string, userId?: string, metadata?: any): void {
    this.info(`Auth event: ${event}`, {
      userId,
      ...metadata,
    });
  }

  static logFileOperation(
    operation: string,
    filename?: string,
    metadata?: any
  ): void {
    this.info(`File operation: ${operation}`, {
      filename,
      ...metadata,
    });
  }

  static logPerformance(
    operation: string,
    duration: number,
    metadata?: any
  ): void {
    const level = duration > 1000 ? "warn" : "info";
    this[level](`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }
}
