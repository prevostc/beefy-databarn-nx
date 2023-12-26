export function strAddressToPgBytea(evmAddress: `0x${string}`) {
    // 0xABC -> // \xABC
    return "\\x" + evmAddress.slice(2);
}
