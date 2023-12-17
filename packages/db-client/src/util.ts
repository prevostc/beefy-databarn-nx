export function strAddressToPgBytea(evmAddress: string) {
    // 0xABC -> // \xABC
    return "\\x" + evmAddress.slice(2);
}
