import { getLoggerFor } from "@beefy-databarn/logger";
import { migrate } from "./src/run-migrations";

const logger = getLoggerFor("db-migrate", "main");

migrate()
    .then(() => process.exit(0))
    .catch(e => {
        logger.error(e);
        process.exit(1);
    });
