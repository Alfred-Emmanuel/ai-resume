import { Pool } from "pg";
import { DATABASE } from "../constants/index.js";
import { MigrationRunner } from "../migrations/migrationRunner.js";
import { Logger } from "../utils/logger.js";
const pool = new Pool({
    connectionString: DATABASE.CONNECTION_STRING,
    ssl: DATABASE.SSL ? { rejectUnauthorized: false } : false,
});
export const db = pool;
// Initialize database with migrations
export const initializeDatabase = async () => {
    try {
        Logger.info("Initializing database...");
        // Run migrations instead of direct table creation
        await MigrationRunner.runMigrations();
        Logger.info("Database initialized successfully");
    }
    catch (error) {
        Logger.error("Database initialization failed:", error);
        throw error;
    }
};
