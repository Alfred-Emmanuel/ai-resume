// Structured logging utility
export class Logger {
    static getCurrentLevel() {
        const envLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
        return this.LOG_LEVELS[envLevel] ?? this.LOG_LEVELS.info;
    }
    static shouldLog(level) {
        const currentLevel = this.getCurrentLevel();
        const messageLevel = this.LOG_LEVELS[level] ?? this.LOG_LEVELS.info;
        return messageLevel <= currentLevel;
    }
    static formatMessage(level, message, metadata) {
        const timestamp = new Date().toISOString();
        const logEntry = {
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
        }
        else {
            // Pretty print for development
            const metadataStr = metadata
                ? ` ${JSON.stringify(metadata, null, 2)}`
                : "";
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}`;
        }
    }
    static error(message, metadata) {
        if (this.shouldLog("error")) {
            console.error(this.formatMessage("error", message, metadata));
        }
    }
    static warn(message, metadata) {
        if (this.shouldLog("warn")) {
            console.warn(this.formatMessage("warn", message, metadata));
        }
    }
    static info(message, metadata) {
        if (this.shouldLog("info")) {
            console.info(this.formatMessage("info", message, metadata));
        }
    }
    static debug(message, metadata) {
        if (this.shouldLog("debug")) {
            console.debug(this.formatMessage("debug", message, metadata));
        }
    }
    // Specialized logging methods
    static logRequest(req, res, responseTime) {
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
    static logError(error, context) {
        this.error(error.message, {
            stack: error.stack,
            name: error.name,
            ...context,
        });
    }
    static logDatabaseOperation(operation, query, params) {
        this.debug(`Database operation: ${operation}`, {
            query: query?.substring(0, 100) + (query && query.length > 100 ? "..." : ""),
            paramCount: params?.length || 0,
        });
    }
    static logAuthEvent(event, userId, metadata) {
        this.info(`Auth event: ${event}`, {
            userId,
            ...metadata,
        });
    }
    static logFileOperation(operation, filename, metadata) {
        this.info(`File operation: ${operation}`, {
            filename,
            ...metadata,
        });
    }
    static logPerformance(operation, duration, metadata) {
        const level = duration > 1000 ? "warn" : "info";
        this[level](`Performance: ${operation}`, {
            duration: `${duration}ms`,
            ...metadata,
        });
    }
}
Logger.LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
