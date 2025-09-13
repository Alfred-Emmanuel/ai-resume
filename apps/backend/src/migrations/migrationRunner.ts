// Database migration runner

import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../config/database.js";
import { Logger } from "../utils/logger.js";

export class MigrationRunner {
  private static readonly MIGRATIONS_TABLE = "migrations";
  private static readonly MIGRATIONS_DIR = join(
    process.cwd(),
    "src",
    "migrations"
  );

  static async runMigrations(): Promise<void> {
    try {
      Logger.info("Starting database migrations...");

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get list of migration files
      const migrationFiles = this.getMigrationFiles();

      // Get already applied migrations
      const appliedMigrations = await this.getAppliedMigrations();

      // Run pending migrations
      for (const file of migrationFiles) {
        if (!appliedMigrations.includes(file)) {
          await this.runMigration(file);
        }
      }

      Logger.info("Database migrations completed successfully");
    } catch (error) {
      Logger.error("Migration failed:", error);
      throw error;
    }
  }

  private static async createMigrationsTable(): Promise<void> {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${this.MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  }

  private static getMigrationFiles(): string[] {
    // In a real implementation, you'd read from the filesystem
    // For now, we'll return the known migration files
    return ["001_initial_schema.sql"];
  }

  private static async getAppliedMigrations(): Promise<string[]> {
    const result = await db.query(
      `SELECT filename FROM ${this.MIGRATIONS_TABLE}`
    );
    return result.rows.map((row) => row.filename);
  }

  private static async runMigration(filename: string): Promise<void> {
    try {
      Logger.info(`Running migration: ${filename}`);

      // Read migration file
      const migrationPath = join(this.MIGRATIONS_DIR, filename);
      const migrationSQL = readFileSync(migrationPath, "utf8");

      // Execute migration
      await db.query(migrationSQL);

      // Record migration as applied
      await db.query(
        `INSERT INTO ${this.MIGRATIONS_TABLE} (filename) VALUES ($1)`,
        [filename]
      );

      Logger.info(`Migration ${filename} applied successfully`);
    } catch (error) {
      Logger.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  static async rollbackMigration(filename: string): Promise<void> {
    try {
      Logger.info(`Rolling back migration: ${filename}`);

      // Remove migration record
      await db.query(
        `DELETE FROM ${this.MIGRATIONS_TABLE} WHERE filename = $1`,
        [filename]
      );

      Logger.info(`Migration ${filename} rolled back successfully`);
    } catch (error) {
      Logger.error(`Rollback of ${filename} failed:`, error);
      throw error;
    }
  }

  static async getMigrationStatus(): Promise<{
    applied: string[];
    pending: string[];
  }> {
    const applied = await this.getAppliedMigrations();
    const all = this.getMigrationFiles();
    const pending = all.filter((file) => !applied.includes(file));

    return { applied, pending };
  }
}
