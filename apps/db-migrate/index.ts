import { getLoggerFor } from "@beefy-databarn/logger";
import yargs from "yargs";
import { migrate } from "./src/run-migrations";

const logger = getLoggerFor("db-migrate", "main");

async function main() {
    const cmd = await yargs.scriptName("db-migrate").usage("$0 [args]").number("target").alias("t", "target").help().argv;

    await migrate(cmd.target === undefined ? "max" : cmd.target);
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        logger.error(e);
        process.exit(1);
    });
