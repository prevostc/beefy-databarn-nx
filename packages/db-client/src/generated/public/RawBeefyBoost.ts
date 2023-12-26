// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type default as ChainEnum } from './ChainEnum';
import { type default as EvmAddress } from './EvmAddress';
import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';

/** Identifier type for public.raw_beefy_boost */
export type RawBeefyBoostBoostId = string & { __brand: 'RawBeefyBoostBoostId' };

/** Represents the table public.raw_beefy_boost */
export default interface RawBeefyBoostTable {
  boost_id: ColumnType<RawBeefyBoostBoostId, RawBeefyBoostBoostId, RawBeefyBoostBoostId>;

  chain: ColumnType<ChainEnum, ChainEnum, ChainEnum>;

  vault_id: ColumnType<string, string, string>;

  name: ColumnType<string, string, string>;

  contract_address: ColumnType<EvmAddress, EvmAddress, EvmAddress>;

  eol: ColumnType<boolean, boolean, boolean>;

  eol_date: ColumnType<Date | null, Date | string | null, Date | string | null>;

  reward_token_symbol: ColumnType<string, string, string>;

  reward_token_decimals: ColumnType<number, number, number>;

  reward_token_address: ColumnType<EvmAddress, EvmAddress, EvmAddress>;

  reward_token_price_feed_key: ColumnType<string, string, string>;
}

export type RawBeefyBoost = Selectable<RawBeefyBoostTable>;

export type NewRawBeefyBoost = Insertable<RawBeefyBoostTable>;

export type RawBeefyBoostUpdate = Updateable<RawBeefyBoostTable>;