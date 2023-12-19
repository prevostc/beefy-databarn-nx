import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "@beefy-databarn/config";
import { getLoggerFor } from "@beefy-databarn/logger";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./generated";

const logger = getLoggerFor("db-client", "client");

let db: Kysely<Database>;
export async function getDbClient({ appName = "beefy" }: { appName?: string }) {
    if (!db) {
        const dialect = new PostgresDialect({
            pool: new Pool({
                host: DB_HOST,
                port: DB_PORT,
                database: DB_NAME,
                user: DB_USER,
                password: DB_PASS,
                application_name: appName,
                max: 10,
            }),
        });

        db = new Kysely<Database>({
            dialect,
            log: event => {
                if (event.level === "query") {
                    // logger.trace({ msg: "Query", event });
                } else if (event.level === "error") {
                    logger.error({ msg: "Query Error", event });
                }
            },
        });
    }

    return db;
}
