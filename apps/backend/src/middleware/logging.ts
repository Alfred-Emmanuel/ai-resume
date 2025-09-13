// Logging middleware

import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger.js";

export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log request
  Logger.info(`Incoming request: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip || req.socket.remoteAddress,
    contentType: req.get("Content-Type"),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    Logger.logRequest(req, res, responseTime);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const errorLoggingMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Logger.logError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip || req.socket.remoteAddress,
  });

  next(error);
};
