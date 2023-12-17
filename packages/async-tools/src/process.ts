import { getLoggerFor } from "@beefy-databarn/logger";

const logger = getLoggerFor("async-tools", "process");

type ExitCallback = () => Promise<void>;
const exitCallbacks: ExitCallback[] = [];

let called = false;
async function exitHandler() {
    if (called) {
        return;
    }
    called = true;
    try {
        await Promise.allSettled(exitCallbacks.map(cb => cb()));
        logger.info("All exit handlers done. Bye.");
        process.exit(0);
    } catch (e) {
        logger.error(`Exit handlers didn't work properly`);
        logger.error(e);
        process.exit(1);
    }
}

process.on("SIGTERM", exitHandler);
process.on("SIGINT", exitHandler);

export async function runMain(main: () => Promise<void>, onExit?: () => void) {
    try {
        await main();
        if (onExit) {
            onExit();
        }
        await exitHandler();
        logger.info("Done");
        process.exit(0);
    } catch (e) {
        logger.error("ERROR");
        logger.error(e);
        if (onExit) {
            onExit();
        }
        await exitHandler();
        process.exit(1);
    }
}
