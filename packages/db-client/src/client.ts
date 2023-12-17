import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "@beefy-databarn/config";
import { getLoggerFor } from "@beefy-databarn/logger";
import { Client as PgClient } from "pg";

const logger = getLoggerFor("db-client", "client");

type DbClient = {
    connect: PgClient["connect"];
    query: PgClient["query"];
    end: PgClient["end"];
    on: PgClient["on"];
};

let sharedClient: DbClient | null = null;
const appNameCounters: Record<string, number> = {};
export async function getDbClient({ appName = "beefy", freshClient = false }: { appName?: string; freshClient?: boolean }) {
    if (!appNameCounters[appName]) {
        appNameCounters[appName] = 0;
    }

    const config = {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASS,
    };

    if (freshClient) {
        appNameCounters[appName] += 1;
        const appNameToUse = appName + ":fresh:" + appNameCounters[appName];
        logger.trace({ msg: "Instantiating new unique pg client", data: { appNameToUse } });
        return new PgClient({ ...config, application_name: appNameToUse });
    }

    if (sharedClient === null) {
        appNameCounters[appName] += 1;
        const appNameToUse = appName + ":common:" + appNameCounters[appName];
        logger.trace({ msg: "Instantiating new shared pg client", data: { appNameToUse } });
        sharedClient = new PgClient({ ...config, application_name: appNameToUse });
        sharedClient.on("error", (err: unknown) => {
            logger.error({ msg: "Postgres client error", data: { err, appNameToUse } });
            logger.trace(err);
        });
    }
    return sharedClient;
}
