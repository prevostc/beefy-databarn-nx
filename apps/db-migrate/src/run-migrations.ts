import { DB_HOST, DB_MIGRATION_FILE_PATTERN, DB_MIGRATION_TABLE, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "@beefy-databarn/config";
import { getLoggerFor } from "@beefy-databarn/logger";
import pg from "pg";

const logger = getLoggerFor("db-migrate", "run-migrations");

export async function migrate() {
    const Postgrator = (await import("postgrator")).default;

    logger.info("Starting...");
    const client = new pg.Client({
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASS,
    });

    try {
        logger.debug("Connecting to database...");
        // Establish a database connection
        await client.connect();

        // Create postgrator instance
        const postgrator = new Postgrator({
            migrationPattern: DB_MIGRATION_FILE_PATTERN,
            driver: "pg",
            database: DB_NAME,
            schemaTable: DB_MIGRATION_TABLE,
            execQuery: query => client.query(query),
            validateChecksums: true,
        });

        // migrate to max version
        logger.debug("Running migrations...");
        const appliedMigrations = await postgrator.migrate("max");
        logger.debug("Migration done.");
        logger.trace("Applied migrations: %o", appliedMigrations);
    } catch (error) {
        logger.error("Migration failed: %o", error);
        logger.trace(error);
    }

    // Once done migrating, close your connection.
    await client.end();
}

migrate()
    .then(() => process.exit(0))
    .catch(e => {
        logger.error(e);
        process.exit(1);
    });