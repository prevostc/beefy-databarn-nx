/*
 
 Type size study
 
 Numbers
 
 select pg_column_size('115792089237316195423570985008687907853269984665640564039457584007913129639935'::numeric(78,0)) as zero_scale_size,
 pg_column_size('115792089237316195423570985008687907853269984665640564039457584007913129639935'::numeric(156,78)) as full_scale_size,
 pg_column_size('1157920892373161954235709850086879078.53269984665640564039457584007913129639935'::numeric(156,78)) as full_scale_size_with_decimals,
 pg_column_size('879078.53'::numeric(156,78)) as less_nums_size,
 pg_column_size('115792089237316195423570985008687907853269984665640564039457584007913129639935'::numeric) as default_scale_size,
 pg_column_size('\xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'::bytea) as bytea_addr_size,
 (select typlen from pg_type where oid = 'bigint'::regtype::oid) as bigint_addr_size,
 (select typlen from pg_type where oid = 'int'::regtype::oid) as int_addr_size,
 octet_length('\xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'::bytea) as bytea_addr_size,
 pg_column_size(1.0::double precision) as double_precision_size
 ;
 
 -[ RECORD 1 ]-----------------+---
 zero_scale_size               | 46
 full_scale_size               | 48
 full_scale_size_with_decimals | 50
 less_nums_size                | 14 <-- not a big price to pay for the extra precision
 default_scale_size            | 46
 bytea_addr_size               | 36
 bigint_addr_size              | 8
 int_addr_size                 | 4
 bytea_addr_size               | 32
 double_precision_size         | 8  <-- we'll use this for display
 */
create domain evm_decimal_256 as numeric(156, 78) CHECK (
    VALUE is NULL
    OR nullif(VALUE, 'NaN') is not null
);
/**
 * evm_address: 
 *  It's a bit more difficult to use but half the size using bytea instead of string
 *  also, there is no case weirdness with bytea
 * 
 select 
 octet_length('\x2BdfBd329984Cf0DC9027734681A16f542cF3bB4'::bytea) as bytea_addr_size, 
 octet_length('0x2BdfBd329984Cf0DC9027734681A16f542cF3bB4') as str_addr_size,
 (select typlen from pg_type where oid = 'bigint'::regtype::oid) as bigint_addr_size,
 (select typlen from pg_type where oid = 'int'::regtype::oid) as int_addr_size
 ;
 -[ RECORD 1 ]----+---
 bytea_addr_size  | 20 <-- we'll use this for storage
 str_addr_size    | 42
 bigint_addr_size | 8
 int_addr_size    | 4  <-- and this for indexing / relations
 */
create domain evm_address as bytea CHECK (
    VALUE is NULL
    OR octet_length(VALUE) = 20
);
create domain evm_transaction_hash as bytea CHECK (
    VALUE is NULL
    OR octet_length(VALUE) = 32
);