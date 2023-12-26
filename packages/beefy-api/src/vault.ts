import { getLoggerFor } from "@beefy-databarn/logger";
import axios from "axios";
import { Chain } from "./chain";
import { Hex } from "./types";

const logger = getLoggerFor("beefy-api", "vault-list");

interface ApiBeefyVaultResponse {
    id: string;
    name: string;
    type: string;
    token: string;
    tokenAddress?: Hex;
    tokenDecimals: number;
    tokenProviderId?: Hex;
    earnedToken?: Hex;
    earnedTokenAddress: Hex;
    earnContractAddress: Hex;
    oracle: string;
    oracleId: string;
    status: "active" | "eol";
    platformId: string;
    assets: string[];
    risks?: string[];
    strategyTypeId: string;
    buyTokenUrl?: string;
    network: Chain;
    createdAt: number;
    isGovVault: boolean;
    chain: Chain;
    strategy: Hex;
    lastHarvest: number;
    pricePerFullShare: string;
    retireReason?: string;
    addLiquidityUrl?: string;
    removeLiquidityUrl?: string;
    zaps?: {
        strategyId: string;
        ammId?: string;
    }[];
    depositFee?: number;
    migrationIds?: string[];
    showWarning?: boolean;
    warning?: string;
    refund?: boolean;
    refundContractAddress?: Hex;
    bridged?: {
        optimism: Hex;
    };
    eolDate?: number;
}

export interface BeefyVault {
    vault_id: string;
    chain: Chain;
    eol: boolean;
    eol_date: Date | null;
    share_token_name: string;
    share_token_decimals: number;
    contract_address: Hex;
    strategy_address: Hex;
    underlying_contract_address: Hex;
    underlying_decimals: number;
    underlying_price_feed_key: string;
    platform: string;
    strategy_type: string | null;
    assets: string[];
    bridged_version_addresses: Partial<Record<Chain, Hex>>;
}

export interface BeefyVaultStats {
    vault_id: string;
    chain: Chain;
    eol: boolean;
    price_per_full_share: bigint;
    last_harvest: Date | null;
}

export async function fetchBeefyVaults() {
    logger.info("Fetching vaults from beefy api");
    const vaultResponse = await axios.get<ApiBeefyVaultResponse[]>("https://api.beefy.finance/vaults");
    const rawVaults = vaultResponse.data;
    logger.info(`Fetched ${rawVaults.length} vaults from beefy api`);

    // map to a simpler format
    return rawVaults.map(
        (vault): BeefyVault => ({
            vault_id: vault.id,
            eol: vault.status === "eol",
            chain: vault.chain,
            contract_address: vault.earnContractAddress as Hex,
            strategy_address: vault.strategy as Hex,
            platform: vault.platformId,
            strategy_type: vault.strategyTypeId || null,
            assets: vault.assets,
            share_token_name: vault.token,
            share_token_decimals: vault.tokenDecimals,
            underlying_contract_address: vault.earnedTokenAddress,
            underlying_decimals: vault.tokenDecimals,
            underlying_price_feed_key: vault.oracleId,
            eol_date: vault.eolDate ? new Date(vault.eolDate * 1000) : null,
            bridged_version_addresses: vault.bridged
                ? {
                      optimism: vault.bridged.optimism as Hex,
                  }
                : {},
        }),
    );
}

export async function fetchBeefyVaultStats() {
    logger.info("Fetching vault stats from beefy api");
    const vaultResponse = await axios.get<ApiBeefyVaultResponse[]>("https://api.beefy.finance/vaults");
    const rawVaults = vaultResponse.data;
    logger.info(`Fetched ${rawVaults.length} vaults from beefy api`);

    // map to a simpler format
    return rawVaults.map(
        (vault): BeefyVaultStats => ({
            vault_id: vault.id,
            eol: vault.status === "eol",
            chain: vault.chain,
            price_per_full_share: parseBigInt(vault.pricePerFullShare),
            last_harvest: vault.lastHarvest ? new Date(vault.lastHarvest * 1000) : null,
        }),
    );
}

function parseBigInt(bigintStr: string): bigint {
    try {
        return BigInt(bigintStr);
    } catch (err) {
        logger.trace({ msg: "Failed to parse big int straight away", data: { bigintStr } });
    }
    return BigInt(parseFloat(bigintStr));
}
