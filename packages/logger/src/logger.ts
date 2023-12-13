import { LOG_LEVEL, NODE_ENV } from "@beefy-databarn/config";
import { Logger, pino } from "pino";

const validLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"];
const defaultLevel = "info";
const level = LOG_LEVEL && validLevels.includes(LOG_LEVEL) ? LOG_LEVEL : defaultLevel;

const rootLogger = pino(
    {
        level: level,
        formatters: {
            bindings() {
                //return { pid: bindings.pid, hostname: bindings.hostname };
                return {};
            },
        },
    },
    pino.destination({
        dest: 1, // stdout
        // disable buffering to avoid doing OOMs on development when too many logs are emitted
        sync: NODE_ENV !== "production",
    }),
);

export function getLoggerFor(module: string, file: string): Logger {
    return rootLogger.child({ module, file });
}
