import { getLoggerFor } from "@beefy-databarn/logger";
import { get, isString } from "lodash";

const logger = getLoggerFor("async-tools", "connection");

export class ConnectionTimeoutError extends Error {
    constructor(
        message: string,
        public readonly previousError?: unknown,
    ) {
        super(message);
    }
}

export function withTimeout<TRes>(fn: () => Promise<TRes>, timeoutMs: number) {
    return new Promise<TRes>((resolve, reject) => {
        const timeout = setTimeout(() => {
            logger.info({ msg: "Timeout", data: { timeoutMs } });
            reject(new ConnectionTimeoutError(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs);
        fn()
            .then(res => {
                clearTimeout(timeout);
                resolve(res);
            })
            .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

export function isConnectionTimeoutError(err: unknown) {
    if (err instanceof ConnectionTimeoutError) {
        return true;
    }
    const msg = get(err, "message", "");
    if (isString(msg) && msg.toLocaleLowerCase().includes("connection terminated")) {
        return true;
    }
    return false;
}
