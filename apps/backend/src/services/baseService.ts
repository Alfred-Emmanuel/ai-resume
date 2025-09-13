// Base service class with common functionality

import { db } from "../config/database.js";
import { Logger } from "../utils/logger.js";
import { DatabaseError, NotFoundError } from "../utils/errors.js";

export abstract class BaseService {
  protected async executeQuery<T>(
    query: string,
    params: any[] = [],
    operation: string = "database operation"
  ): Promise<T[]> {
    try {
      Logger.debug(`Executing ${operation}`, { query, params });
      const result = await db.query(query, params);
      Logger.debug(`${operation} completed`, { rowCount: result.rowCount });
      return result.rows;
    } catch (error) {
      Logger.error(`${operation} failed:`, error);
      throw new DatabaseError(
        `${operation} failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  protected async executeQuerySingle<T>(
    query: string,
    params: any[] = [],
    operation: string = "database operation"
  ): Promise<T | null> {
    const results = await this.executeQuery<T>(query, params, operation);
    return results.length > 0 ? results[0] : null;
  }

  protected async executeQueryRequired<T>(
    query: string,
    params: any[] = [],
    operation: string = "database operation",
    resourceName: string = "Resource"
  ): Promise<T> {
    const result = await this.executeQuerySingle<T>(query, params, operation);
    if (!result) {
      throw new NotFoundError(resourceName);
    }
    return result;
  }

  protected async executeInsert<T>(
    query: string,
    params: any[] = [],
    operation: string = "insert operation"
  ): Promise<T> {
    const results = await this.executeQuery<T>(query, params, operation);
    if (results.length === 0) {
      throw new DatabaseError(`${operation} failed: No result returned`);
    }
    return results[0];
  }

  protected async executeUpdate(
    query: string,
    params: any[] = [],
    operation: string = "update operation"
  ): Promise<number> {
    try {
      Logger.debug(`Executing ${operation}`, { query, params });
      const result = await db.query(query, params);
      Logger.debug(`${operation} completed`, { rowCount: result.rowCount });
      return result.rowCount || 0;
    } catch (error) {
      Logger.error(`${operation} failed:`, error);
      throw new DatabaseError(
        `${operation} failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  protected async executeDelete(
    query: string,
    params: any[] = [],
    operation: string = "delete operation"
  ): Promise<boolean> {
    const rowCount = await this.executeUpdate(query, params, operation);
    return rowCount > 0;
  }

  protected validateRequired<T>(
    value: T | null | undefined,
    fieldName: string
  ): T {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} is required`);
    }
    return value;
  }

  protected validateUuid(uuid: string, fieldName: string = "ID"): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new Error(`${fieldName} must be a valid UUID`);
    }
  }
}
