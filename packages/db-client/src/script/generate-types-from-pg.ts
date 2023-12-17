import { runMain } from "@beefy-databarn/async-tools";
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "@beefy-databarn/config";
import { getLoggerFor } from "@beefy-databarn/logger";
import { recase } from "@kristiandupont/recase";
import { Config as KanelConfig, generateIndexFile, processDatabase } from "kanel";
import { defaultGetZodIdentifierMetadata, defaultGetZodSchemaMetadata, defaultZodTypeMap, makeGenerateZodSchemas } from "kanel-zod";
import { join } from "path";
import { tryParse } from "tagged-comment-parser";

const logger = getLoggerFor("db-client", "generate-types-from-pg");
const toPascalCase = recase("snake", "pascal");
const outputPath = __dirname + "/../generated";

const generateZodSchemas = makeGenerateZodSchemas({
    getZodSchemaMetadata: defaultGetZodSchemaMetadata,
    getZodIdentifierMetadata: defaultGetZodIdentifierMetadata,
    zodTypeMap: {
        ...defaultZodTypeMap,
        "pg_catalog.tsvector": "z.set(z.string())",
        "pg_catalog.bytea": "z.string()",
        "public.evm_address": "z.string().refine((v) => v.length === 20, { message: 'EVM address must be 20 bytes long' })",
    },
    castToSchema: true,
});

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

    // Add a comment about the entity that the type represents above each type.
    getMetadata: (details, generateFor) => {
        const { comment: strippedComment } = tryParse(details.comment);
        const isAgentNoun = ["initializer", "mutator"].includes(generateFor as string);

        const relationComment = isAgentNoun
            ? `Represents the ${generateFor} for the ${details.kind} ${details.schemaName}.${details.name}`
            : `Represents the ${details.kind} ${details.schemaName}.${details.name}`;

        const suffix = isAgentNoun ? `_${generateFor}` : "";

        return {
            name: toPascalCase(details.name + suffix),
            comment: [relationComment, ...(strippedComment ? [strippedComment] : [])],
            path: join(outputPath, toPascalCase(details.name)),
        };
    },

    // Add a comment that says what the type of the column/attribute is in the database.
    getPropertyMetadata: (property, _details, generateFor) => {
        const { comment: strippedComment } = tryParse(property.comment);

        return {
            name: property.name,
            comment: [
                `Database type: ${property.expandedType}`,
                ...(generateFor === "initializer" && property.defaultValue ? [`Default value: ${property.defaultValue}`] : []),
                ...(strippedComment ? [strippedComment] : []),
            ],
        };
    },

    // This implementation will generate flavored instead of branded types.
    // See: https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/
    generateIdentifierType: (c, d) => {
        // Id columns are already prefixed with the table name, so we don't need to add it here
        const name = toPascalCase(c.name);

        return {
            declarationType: "typeDeclaration",
            name,
            exportAs: "named",
            typeDefinition: [`number & { __flavor?: '${name}' }`],
            comment: [`Identifier type for ${d.name}`],
        };
    },

    // Generate an index file with exports of everything
    preRenderHooks: [generateZodSchemas, generateIndexFile],

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
