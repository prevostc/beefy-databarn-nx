import { fetchBeefyVaults } from "@beefy-databarn/beefy-api";
import { getLoggerFor } from "@beefy-databarn/logger";
import { SamplingPeriod } from "@beefy-databarn/time";

const logger = getLoggerFor("beefy-api-indexer", "watch");

export const watchBeefyApi = async (interval: SamplingPeriod) => {
    logger.info({ msg: "Starting", data: { interval } });

    const vaults = await fetchBeefyVaults();
    logger.info({ msg: "Vaults", data: { vaultCount: vaults } });
    logger.trace({ msg: "Vaults", data: { vaults } });
};
