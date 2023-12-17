import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "@beefy-databarn/config";
import { getLoggerFor } from "@beefy-databarn/logger";
import { Client as PgClient } from "pg";
import pgf from "pg-format";
import { ConnectionTimeoutError, isConnectionTimeoutError, withTimeout } from "./async";

const logger = getLoggerFor("db-client", "db-query");

type DbClient = {
    connect: PgClient["connect"];
    query: PgClient["query"];
    end: PgClient["end"];
    on: PgClient["on"];
};

let sharedClient: DbClient | null = null;
const appNameCounters: Record<string, number> = {};
export async function init_db_client({ appName = "beefy", freshClient = false }: { appName?: string; freshClient?: boolean }) {
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

export async function db_transaction<TRes>(
    fn: (client: DbClient) => Promise<TRes>,
    {
        appName,
        connectTimeoutMs = 10_000,
        queryTimeoutMs = 10_000,
        logInfos,
    }: { appName: string; connectTimeoutMs?: number; queryTimeoutMs?: number },
) {
    const pgClient = await getDbClient({ appName, freshClient: true });
    try {
        await withTimeout(() => pgClient.connect(), connectTimeoutMs, mergeLogsInfos(logInfos, { msg: "connect", data: { connectTimeoutMs } }));
        try {
            await pgClient.query("BEGIN");
            const res = await withTimeout(() => fn(pgClient), queryTimeoutMs, mergeLogsInfos(logInfos, { msg: "query", data: { queryTimeoutMs } }));
            await pgClient.query("COMMIT");
            return res;
        } catch (error) {
            await pgClient.query("ROLLBACK");
            throw error;
        }
    } finally {
        await pgClient.end();
    }
}

export async function db_query<RowType>(sql: string, params: unknown[] = [], client: DbClient | null = null): Promise<RowType[]> {
    logger.trace({ msg: "Executing query", data: { sql, params } });
    let useClient: DbClient | null = client;
    if (useClient === null) {
        const pool = await init_db_client({ freshClient: false });
        useClient = pool;
    }
    const sql_w_params = pgf(sql, ...params);
    //console.log(sql_w_params);
    try {
        const res = await useClient.query(sql_w_params);
        const rows = res?.rows || null;
        logger.trace({ msg: "Query end", data: { sql, params, total: res?.rowCount } });
        return rows;
    } catch (error) {
        // if the query ended because of a connection timeout, we wrap it in a custom error
        // so that we can handle it upper in the stack and retry the query/transaction
        if (isConnectionTimeoutError(error)) {
            throw new ConnectionTimeoutError("Query timeout", error);
        }
        logger.error({ msg: "Query error", data: { sql, params, error } });
        throw error;
    }
}

export async function db_query_one<RowType>(sql: string, params: unknown[] = [], client: DbClient | null = null): Promise<RowType | null> {
    const rows = await db_query<RowType>(sql, params, client);
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}
