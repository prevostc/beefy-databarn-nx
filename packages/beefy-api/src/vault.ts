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
}

export interface BeefyVault {
    id: string;
    eol: boolean;
    chain: Chain;
    contractAddress: Hex;
    strategyAddress: Hex;
    platformId: string;
    lastHarvest: Date;
    strategyTypeId: string | null;
    pricePerFullShare: bigint;
    _raw: ApiBeefyVaultResponse;
}

export async function fetchBeefyVaults() {
    logger.info("Fetching vaults from beefy api");
    const vaultResponse = await axios.get<ApiBeefyVaultResponse[]>("https://api.beefy.finance/vaults");
    const rawVaults = vaultResponse.data;
    logger.info(`Fetched ${rawVaults.length} vaults from beefy api`);

    // map to a simpler format
    return rawVaults.map(vault => ({
        id: vault.id,
        eol: vault.status === "eol",
        chain: vault.chain,
        contractAddress: vault.earnContractAddress as Hex,
        strategyAddress: vault.strategy as Hex,
        platformId: vault.platformId,
        lastHarvest: new Date(vault.lastHarvest * 1000),
        strategyTypeId: vault.strategyTypeId || null,
        pricePerFullShare: BigInt(vault.pricePerFullShare),
        _raw: vault,
    }));
}
