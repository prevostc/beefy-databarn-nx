import { DB_MIGRATION_FILE_PATTERN, DB_MIGRATION_TABLE, DB_NAME } from "@beefy-databarn/config";
import { getDbClient } from "@beefy-databarn/db-client";
import { getLoggerFor } from "@beefy-databarn/logger";
import { isNumber } from "lodash";

const logger = getLoggerFor("db-migrate", "run-migrations");

export async function migrate(target: number | "max" = "max") {
    const Postgrator = (await import("postgrator")).default;

    logger.info("Starting...");
    const client = await getDbClient({ appName: "db-migrate" });

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
        const targetVersion = isNumber(target) ? `${target}` : "max";
        logger.debug({ msg: "Running migrations", data: { targetVersion } });
        postgrator.migrate;
        const appliedMigrations = await postgrator.migrate(targetVersion);
        logger.debug("Migration done.");
        logger.trace("Applied migrations: %o", appliedMigrations);
    } catch (error) {
        logger.error("Migration failed: %o", error);
        logger.trace(error);
    }

    // Once done migrating, close your connection.
    await client.end();
}
