import { DB_MIGRATION_FILE_PATTERN, DB_MIGRATION_TABLE, DB_NAME } from "@beefy-databarn/config";
import { getDbClient, sql } from "@beefy-databarn/db-client";
import { getLoggerFor } from "@beefy-databarn/logger";
import { isNumber } from "lodash";

const logger = getLoggerFor("db-migrate", "run-migrations");

export async function migrate(target: number | "max" = "max") {
    const Postgrator = (await import("postgrator")).default;

    logger.info("Starting...");
    const db = await getDbClient({ appName: "db-migrate" });

    try {
        logger.debug("Connecting to database...");

        // Create postgrator instance
        const postgrator = new Postgrator({
            migrationPattern: DB_MIGRATION_FILE_PATTERN,
            driver: "pg",
            database: DB_NAME,
            schemaTable: DB_MIGRATION_TABLE,
            execQuery: query => sql`${sql.raw(query)}`.execute(db),
            validateChecksums: true,
        });

        // migrate to max version
        const targetVersion = isNumber(target) ? `${target}` : "max";
        logger.debug({ msg: "Running migrations", data: { targetVersion } });
        const appliedMigrations = await postgrator.migrate(targetVersion);
        logger.debug("Migration done.");
        logger.trace("Applied migrations: %o", appliedMigrations);
    } catch (error) {
        logger.error("Migration failed: %o", error);
        logger.trace(error);
    }
}
