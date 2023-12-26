import { getLoggerFor } from "@beefy-databarn/logger";
import axios from "axios";
import { entries } from "lodash";
import { Chain } from "./chain";
import { Hex } from "./types";

const logger = getLoggerFor("beefy-api", "token-list");

type ApiBeefyTokenResponse = Record<
    Chain,
    Record<
        string,
        {
            type: "erc20";
            id: string;
            symbol: string;
            name: string;
            chainId: Chain;
            oracle: "lps" | "tokens";
            oracleId: string;
            address: Hex;
            decimals: number;
        }
    >
>;

export interface BeefyToken {
    token_id: string;
    chain: Chain;
    symbol: string;
    decimals: number;
    address: Hex | "native";
    price_feed_key: string;
}

export async function fetchBeefyTokens(): Promise<BeefyToken[]> {
    logger.info("Fetching tokens from beefy api");
    const tokensResponse = await axios.get<ApiBeefyTokenResponse>("https://api.beefy.finance/tokens");
    const tokens = entries(tokensResponse.data).flatMap(([chain, kv]) => entries(kv).map(([id, v]) => ({ ...v, vault_key: `${chain}:${id}` })));
    logger.info(`Fetched ${tokens.length} tokens from beefy api`);

    // map to a simpler format
    return tokens.map(token => ({
        token_id: token.vault_key,
        chain: token.chainId as Chain,
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address,
        price_feed_key: token.oracleId,
    }));
}
