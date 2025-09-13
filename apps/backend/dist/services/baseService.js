// Base service class with common functionality
import { db } from "../config/database.js";
import { Logger } from "../utils/logger.js";
import { DatabaseError, NotFoundError } from "../utils/errors.js";
export class BaseService {
    async executeQuery(query, params = [], operation = "database operation") {
        try {
            Logger.debug(`Executing ${operation}`, { query, params });
            const result = await db.query(query, params);
            Logger.debug(`${operation} completed`, { rowCount: result.rowCount });
            return result.rows;
        }
        catch (error) {
            Logger.error(`${operation} failed:`, error);
            throw new DatabaseError(`${operation} failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async executeQuerySingle(query, params = [], operation = "database operation") {
        const results = await this.executeQuery(query, params, operation);
        return results.length > 0 ? results[0] : null;
    }
    async executeQueryRequired(query, params = [], operation = "database operation", resourceName = "Resource") {
        const result = await this.executeQuerySingle(query, params, operation);
        if (!result) {
            throw new NotFoundError(resourceName);
        }
        return result;
    }
    async executeInsert(query, params = [], operation = "insert operation") {
        const results = await this.executeQuery(query, params, operation);
        if (results.length === 0) {
            throw new DatabaseError(`${operation} failed: No result returned`);
        }
        return results[0];
    }
    async executeUpdate(query, params = [], operation = "update operation") {
        try {
            Logger.debug(`Executing ${operation}`, { query, params });
            const result = await db.query(query, params);
            Logger.debug(`${operation} completed`, { rowCount: result.rowCount });
            return result.rowCount || 0;
        }
        catch (error) {
            Logger.error(`${operation} failed:`, error);
            throw new DatabaseError(`${operation} failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async executeDelete(query, params = [], operation = "delete operation") {
        const rowCount = await this.executeUpdate(query, params, operation);
        return rowCount > 0;
    }
    validateRequired(value, fieldName) {
        if (value === null || value === undefined) {
            throw new Error(`${fieldName} is required`);
        }
        return value;
    }
    validateUuid(uuid, fieldName = "ID") {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
            throw new Error(`${fieldName} must be a valid UUID`);
        }
    }
}
