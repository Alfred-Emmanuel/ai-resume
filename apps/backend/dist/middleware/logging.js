// Logging middleware
import { Logger } from "../utils/logger.js";
export const requestLoggingMiddleware = (req, res, next) => {
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
    res.end = function (chunk, encoding) {
        const responseTime = Date.now() - startTime;
        Logger.logRequest(req, res, responseTime);
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
export const errorLoggingMiddleware = (error, req, res, next) => {
    Logger.logError(error, {
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        ip: req.ip || req.socket.remoteAddress,
    });
    next(error);
};
