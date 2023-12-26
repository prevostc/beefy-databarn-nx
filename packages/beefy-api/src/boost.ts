import { getLoggerFor } from "@beefy-databarn/logger";
import axios from "axios";
import { Chain } from "./chain";
import { Hex } from "./types";

const logger = getLoggerFor("beefy-api", "boost-list");

interface ApiBeefyBoostResponse {
    id: string;
    poolId: string;
    name: string;
    assets?: string[];
    tokenAddress?: string;
    earnedToken: string;
    earnedTokenDecimals: number;
    earnedTokenAddress: string;
    earnContractAddress: string;
    earnedOracle: string;
    earnedOracleId: string;
    partnership: boolean;
    status: string;
    isMooStaked: boolean;
    partners: string[];
    chain: string;
    periodFinish: number;
    tagIcon?: string;
    tagText?: string;
    campaign?: string;
    fixedStatus?: boolean;
}

export interface BeefyBoost {
    boost_id: string;
    chain: Chain;

    vault_id: string;
    name: string;
    contract_address: string;

    // end of life
    eol: boolean;
    eol_date: Date | null;

    reward_token_symbol: string;
    reward_token_decimals: number;
    reward_token_address: string;
    reward_token_price_feed_key: string;
}

export async function fetchBeefyBoosts() {
    logger.info("Fetching boosts from beefy api");
    const boostResponse = await axios.get<ApiBeefyBoostResponse[]>("https://api.beefy.finance/boosts");
    const boosts = boostResponse.data;
    logger.info(`Fetched ${boosts.length} boosts from beefy api`);

    // map to a simpler format
    return boosts.map(boost => ({
        boost_id: boost.id,
        chain: boost.chain as Chain,

        vault_id: boost.poolId,
        name: boost.name,
        contract_address: boost.earnContractAddress as Hex,

        reward_token_decimals: boost.earnedTokenDecimals,
        reward_token_symbol: boost.earnedToken,
        reward_token_address: boost.earnedTokenAddress as Hex,
        reward_token_price_feed_key: boost.earnedOracleId,

        eol: boost.status === "closed",
    }));
}
