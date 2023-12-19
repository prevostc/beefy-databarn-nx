import { runMain } from "@beefy-databarn/async-tools";
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "@beefy-databarn/config";
import { getLoggerFor } from "@beefy-databarn/logger";
import { PgType } from "extract-pg-schema";
import { Config as KanelConfig, generateIndexFile, processDatabase } from "kanel";
import { makeKyselyHook } from "kanel-kysely";

const logger = getLoggerFor("db-client", "generate-types-from-pg");
const outputPath = __dirname + "/../generated";

const combineFilters =
    (...filters: Array<(pgtype: PgType) => boolean>) =>
    (t: PgType) =>
        filters.every(f => f(t));

const migrationTypeFilter = (pgtype: PgType) => {
    if (pgtype.schemaName === "public" && pgtype.name === "schemaversion") {
        return false;
    }
    return true;
};

/** @type {import('../src/Config').default} */
const kanelConfig: KanelConfig = {
    connection: {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME,
        application_name: "kanel",
        port: DB_PORT,
    },

    outputPath,
    resolveViews: true,
    preDeleteOutputFolder: true,
    typeFilter: combineFilters(migrationTypeFilter),
    enumStyle: "type",

    // Generate an index file with exports of everything
    preRenderHooks: [makeKyselyHook(), generateIndexFile],

    customTypeMap: {
        // A text search vector could be stored as a set of strings. See Film.ts for an example.
        "pg_catalog.tsvector": "Set<string>",
        "pg_catalog.bytea": "string",
        // Columns with the following types would probably just be strings in TypeScript.
        "pg_catalog.bpchar": "string",
        "public.citext": "string",
    },
};

async function run() {
    logger.info({ msg: "Generating types from database" });
    await processDatabase(kanelConfig);
    logger.info({ msg: "Done generating types from database" });
}

runMain(run);
