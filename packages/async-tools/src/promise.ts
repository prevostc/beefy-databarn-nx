import { SamplingPeriod, samplingPeriodToMs } from "@beefy-databarn/time";

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runAtLeastEvery<T>(
    fn: () => Promise<T>,
    { interval, startImmediately }: { interval: SamplingPeriod; startImmediately: boolean },
): Promise<AbortSignal> {
    const signal = new AbortController().signal;
    let lastRun = startImmediately ? 0 : Date.now();
    const intervalMs = samplingPeriodToMs(interval);
    while (!signal.aborted) {
        const now = Date.now();
        const diff = now - lastRun;
        if (diff < intervalMs) {
            await sleep(intervalMs - diff);
        }
        lastRun = Date.now();
        await fn();
    }
    return signal;
}
