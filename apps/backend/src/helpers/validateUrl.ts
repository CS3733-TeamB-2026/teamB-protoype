import dns from "node:dns/promises";

/** Returns true if the IPv4/IPv6 address is a loopback, private, or link-local address. */
function isPrivateIP(ip: string): boolean {
    const v4 = [
        /^127\./, // 127.0.0.0/8  loopback
        /^10\./, // 10.0.0.0/8   RFC-1918
        /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12 RFC-1918
        /^192\.168\./, // 192.168.0.0/16 RFC-1918
        /^169\.254\./, // 169.254.0.0/16 link-local / AWS metadata
        /^0\./, // 0.0.0.0/8
    ];
    if (v4.some((r) => r.test(ip))) return true;
    // IPv6 loopback, link-local (fe80::/10), unique-local (fc00::/7)
    if (ip === "::1") return true;
    if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true;
    if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
    return false;
}

/**
 * Validates that a URL is safe to fetch as a server-side proxy:
 * - scheme must be http or https
 * - all DNS-resolved addresses must be public (blocks SSRF)
 */
export async function assertPublicUrl(rawUrl: string): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error("Invalid URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Only http/https URLs are allowed");
    }
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    for (const { address } of addresses) {
        if (isPrivateIP(address))
            throw new Error("URL resolves to a private/internal address");
    }
}
