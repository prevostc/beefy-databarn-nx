import { fetchBeefyVaults } from "@beefy-databarn/beefy-api";
import { getDbClient, strAddressToPgBytea, type RawBeefyVaultId } from "@beefy-databarn/db-client";
import { getLoggerFor } from "@beefy-databarn/logger";
import { SamplingPeriod } from "@beefy-databarn/time";
import { chunk } from "lodash";

const logger = getLoggerFor("beefy-api-indexer", "watch");

export const watchBeefyApi = async (interval: SamplingPeriod) => {
    logger.info({ msg: "Starting", data: { interval } });

    const db = await getDbClient({ appName: "beefy-api-indexer" });
    const vaults = await fetchBeefyVaults();
    logger.info({ msg: "Vaults", data: { vaultCount: vaults } });

    const inserts = chunk(
        vaults.map(vault => ({
            id: vault.id as RawBeefyVaultId,
            eol_date: vault.eol ? new Date() : null,
            chain: vault.chain,
            contract_address: strAddressToPgBytea(vault.contractAddress),
            strategy_address: strAddressToPgBytea(vault.strategyAddress),
            platform_id: vault.platformId,
            last_harvest: vault.lastHarvest ? new Date(vault.lastHarvest) : null,
            price_per_full_share: vault.pricePerFullShare.toString(),
        })),
        500,
    );

    for (const insert of inserts) {
        logger.trace({ msg: "Inserting", data: { insertCount: insert.length } });
        await db
            .insertInto("raw_beefy_vault")
            .values(insert)
            .onConflict(oc =>
                oc.column("id").doUpdateSet({
                    eol_date: eb => eb.ref("excluded.eol_date"),
                    strategy_address: eb => eb.ref("excluded.strategy_address"),
                    last_harvest: eb => eb.ref("excluded.last_harvest"),
                    price_per_full_share: eb => eb.ref("excluded.price_per_full_share"),
                }),
            )
            .execute();
        logger.info({ msg: "Inserted", data: { insertCount: insert.length } });
    }
};
