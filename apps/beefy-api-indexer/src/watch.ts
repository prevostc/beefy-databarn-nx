import { runAtLeastEvery } from "@beefy-databarn/async-tools";
import { fetchBeefyBoosts, fetchBeefyVaults } from "@beefy-databarn/beefy-api";
import { getDbClient, strAddressToPgBytea, type RawBeefyBoostBoostId, type RawBeefyVaultVaultId } from "@beefy-databarn/db-client";
import { getLoggerFor } from "@beefy-databarn/logger";
import { SamplingPeriod } from "@beefy-databarn/time";
import { chunk } from "lodash";

const logger = getLoggerFor("beefy-api-indexer", "watch");

export const watchBeefyApi = async (interval: SamplingPeriod) => {
    await runAtLeastEvery(
        async () => {
            await Promise.allSettled([doFetchBeefyVaults(), doFetchBeefyBoosts()]);
        },
        { interval, startImmediately: true },
    );
};

async function doFetchBeefyVaults() {
    logger.info({ msg: "Starting beefy api ingestion" });
    const db = await getDbClient({ appName: "beefy-api-indexer" });
    const vaults = await fetchBeefyVaults();
    logger.info({ msg: "Vaults", data: { vaultCount: vaults.length } });

    const inserts = chunk(
        vaults.map(vault => ({
            vault_id: vault.vault_id as RawBeefyVaultVaultId,
            chain: vault.chain,
            eol: vault.eol,
            eol_date: vault.eol_date,
            share_token_name: vault.share_token_name,
            share_token_decimals: vault.share_token_decimals,
            contract_address: strAddressToPgBytea(vault.contract_address),
            strategy_address: strAddressToPgBytea(vault.strategy_address),
            underlying_contract_address: strAddressToPgBytea(vault.underlying_contract_address),
            underlying_decimals: vault.underlying_decimals,
            underlying_price_feed_key: vault.underlying_price_feed_key,
            platform: vault.platform,
            strategy_type: vault.strategy_type,
            assets: vault.assets,
            bridged_version_addresses: vault.bridged_version_addresses,
        })),
        500,
    );

    for (const insert of inserts) {
        logger.trace({ msg: "Inserting", data: { insertCount: insert.length } });
        await db
            .insertInto("raw_beefy_vault")
            .values(insert)
            .onConflict(oc =>
                oc.column("vault_id").doUpdateSet({
                    eol: eb => eb.ref("excluded.eol"),
                    eol_date: eb => eb.ref("excluded.eol_date"),
                    share_token_name: eb => eb.ref("excluded.share_token_name"),
                    share_token_decimals: eb => eb.ref("excluded.share_token_decimals"),
                    contract_address: eb => eb.ref("excluded.contract_address"),
                    strategy_address: eb => eb.ref("excluded.strategy_address"),
                    underlying_contract_address: eb => eb.ref("excluded.underlying_contract_address"),
                    underlying_decimals: eb => eb.ref("excluded.underlying_decimals"),
                    underlying_price_feed_key: eb => eb.ref("excluded.underlying_price_feed_key"),
                    platform: eb => eb.ref("excluded.platform"),
                    strategy_type: eb => eb.ref("excluded.strategy_type"),
                    assets: eb => eb.ref("excluded.assets"),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    bridged_version_addresses: (eb: any) => eb.ref("excluded.bridged_version_addresses"),
                }),
            )
            .execute();

        logger.debug({ msg: "Inserted one vault batch", data: { insertCount: insert.length } });
    }

    logger.trace({ msg: "Deleting old vaults" });
    await db
        .deleteFrom("raw_beefy_vault")
        .where(
            "vault_id",
            "not in",
            vaults.map(v => v.vault_id as RawBeefyVaultVaultId),
        )
        .execute();

    logger.info({ msg: "beefy vault ingestion done" });
}

async function doFetchBeefyBoosts() {
    logger.info({ msg: "Starting beefy api ingestion" });
    const db = await getDbClient({ appName: "beefy-api-indexer" });
    const boosts = await fetchBeefyBoosts();
    logger.info({ msg: "Boosts", data: { boostCount: boosts.length } });

    const inserts = chunk(
        boosts.map(boost => ({
            boost_id: boost.boost_id as RawBeefyBoostBoostId,
            chain: boost.chain,
            vault_id: boost.vault_id,
            name: boost.name,
            contract_address: strAddressToPgBytea(boost.contract_address),
            eol: boost.eol,
            eol_date: boost.eol ? new Date() : null,
            reward_token_symbol: boost.reward_token_symbol,
            reward_token_decimals: boost.reward_token_decimals,
            reward_token_address: strAddressToPgBytea(boost.reward_token_address),
            reward_token_price_feed_key: boost.reward_token_price_feed_key,
        })),
        500,
    );

    for (const insert of inserts) {
        logger.trace({ msg: "Inserting", data: { insertCount: insert.length } });
        await db
            .insertInto("raw_beefy_boost")
            .values(insert)
            .onConflict(oc =>
                oc.column("boost_id").doUpdateSet({
                    chain: eb => eb.ref("excluded.chain"),
                    vault_id: eb => eb.ref("excluded.vault_id"),
                    name: eb => eb.ref("excluded.name"),
                    contract_address: eb => eb.ref("excluded.contract_address"),
                    eol: eb => eb.ref("excluded.eol"),
                    eol_date: eb => eb.ref("excluded.eol_date"),
                    reward_token_symbol: eb => eb.ref("excluded.reward_token_symbol"),
                    reward_token_decimals: eb => eb.ref("excluded.reward_token_decimals"),
                    reward_token_address: eb => eb.ref("excluded.reward_token_address"),
                    reward_token_price_feed_key: eb => eb.ref("excluded.reward_token_price_feed_key"),
                }),
            )
            .execute();

        logger.debug({ msg: "Inserted one boost batch", data: { insertCount: insert.length } });
    }

    logger.trace({ msg: "Deleting old boosts" });
    await db
        .deleteFrom("raw_beefy_boost")
        .where(
            "boost_id",
            "not in",
            boosts.map(b => b.boost_id as RawBeefyBoostBoostId),
        )
        .execute();

    logger.info({ msg: "beefy boost ingestion done" });
}
