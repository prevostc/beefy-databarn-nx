import * as dotenv from "dotenv";
dotenv.config();

export const NODE_ENV: "development" | "production" =
  process.env["NODE_ENV"] == "production" ? "production" : "development";

// make sure we have set the TZ
const timezone = process.env.TZ;
if (timezone !== "UTC") {
  throw new Error("Please set TZ=UTC in your .env file or command line");
}

// logs
export const LOG_LEVEL: string = process.env["LOG_LEVEL"] || "info";

// database
export const DB_HOST: string = process.env["DB_HOST"] || "localhost";
export const DB_PORT: number = parseInt(process.env["DB_PORT"] || "5432");
export const DB_NAME: string = process.env["DB_NAME"] || "beefy";
export const DB_USER: string = process.env["DB_USER"] || "beefy";
export const DB_PASS: string = process.env["DB_PASS"] || "beefy";
export const DB_MIGRATION_SCHEMA: string = process.env["DB_MIGRATION_SCHEMA"] || "public";
export const DB_MIGRATION_FILE_PATTERN: string = process.env["DB_MIGRATION_FILE_PATTERN"] || "infra/db-migrate/src/sql/*.sql";
