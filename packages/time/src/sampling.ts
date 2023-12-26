export type SamplingPeriod =
    | "1sec"
    | "10sec"
    | "15sec"
    | "30sec"
    | "1min"
    | "5min"
    | "15min"
    | "30min"
    | "1hour"
    | "2hour"
    | "4hour"
    | "1day"
    | "3days"
    | "1week"
    | "1month"
    | "3months"
    | "1year"
    | "100year";
export const allSamplingPeriods: SamplingPeriod[] = [
    "1sec",
    "10sec",
    "15sec",
    "30sec",
    "1min",
    "5min",
    "15min",
    "30min",
    "1hour",
    "2hour",
    "4hour",
    "1day",
    "3days",
    "1week",
    "1month",
    "3months",
    "1year",
    "100year",
];
const samplingPeriodMs: { [period in SamplingPeriod]: number } = {
    "1sec": 1000,
    "10sec": 10 * 1000,
    "15sec": 15 * 1000,
    "30sec": 30 * 1000,
    "1min": 1 * 60 * 1000,
    "5min": 5 * 60 * 1000,
    "15min": 15 * 60 * 1000,
    "30min": 30 * 60 * 1000,
    "1hour": 60 * 60 * 1000,
    "2hour": 2 * 60 * 60 * 1000,
    "4hour": 4 * 60 * 60 * 1000,
    "1day": 24 * 60 * 60 * 1000,
    "3days": 3 * 24 * 60 * 60 * 1000,
    "1week": 7 * 24 * 60 * 60 * 1000,
    "1month": 30 * 24 * 60 * 60 * 1000,
    "3months": 3 * 30 * 24 * 60 * 60 * 1000,
    "1year": 365 * 24 * 60 * 60 * 1000,
    "100year": 100 * 365 * 24 * 60 * 60 * 1000,
};

export function samplingPeriodToMs(period: SamplingPeriod) {
    return samplingPeriodMs[period];
}
