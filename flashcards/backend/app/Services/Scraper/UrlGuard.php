<?php

namespace App\Services\Scraper;

use App\Exceptions\BlockedUrlException;

/**
 * Stops server-side request forgery: only http(s) URLs on ports 80/443 whose
 * host resolves exclusively to public IP addresses are allowed.
 */
class UrlGuard
{
    private const ALLOWED_PORTS = [80, 443];

    /**
     * Non-public IPv4 ranges (RFC 6890 special-purpose registry and friends).
     */
    private const BLOCKED_V4 = [
        '0.0.0.0/8',          // "this" network
        '10.0.0.0/8',         // private
        '100.64.0.0/10',      // carrier-grade NAT
        '127.0.0.0/8',        // loopback
        '169.254.0.0/16',     // link-local, includes cloud metadata 169.254.169.254
        '172.16.0.0/12',      // private
        '192.0.0.0/24',       // IETF protocol assignments
        '192.0.2.0/24',       // documentation
        '192.88.99.0/24',     // 6to4 relay anycast
        '192.168.0.0/16',     // private
        '198.18.0.0/15',      // benchmarking
        '198.51.100.0/24',    // documentation
        '203.0.113.0/24',     // documentation
        '224.0.0.0/4',        // multicast
        '240.0.0.0/4',        // reserved, includes broadcast
    ];

    /**
     * Non-public ranges inside IPv6 global unicast (2000::/3). Everything
     * outside 2000::/3 is rejected anyway, except the IPv4-embedding forms
     * handled in embeddedIpv4().
     */
    private const BLOCKED_V6 = [
        '2001::/23',          // IETF protocol assignments, includes Teredo
        '2001:db8::/32',      // documentation
        '3fff::/20',          // documentation
    ];

    public function __construct(private readonly HostResolver $resolver) {}

    /**
     * @throws BlockedUrlException
     */
    public function check(string $url): GuardedUrl
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            throw new BlockedUrlException('That URL could not be understood.');
        }

        $scheme = strtolower($parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new BlockedUrlException('Only http:// and https:// URLs are supported.');
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            throw new BlockedUrlException('URLs with embedded usernames or passwords are not allowed.');
        }

        $port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);
        if (! in_array($port, self::ALLOWED_PORTS, true)) {
            throw new BlockedUrlException('Only the standard web ports 80 and 443 are allowed.');
        }

        $host = strtolower(rtrim($parts['host'], '.'));
        $literal = trim($host, '[]');

        if (filter_var($literal, FILTER_VALIDATE_IP)) {
            $ips = [$literal];
        } elseif ($this->looksLikeObfuscatedIpv4($host)) {
            // Forms such as 2130706433, 0x7f.1 or 127.1 are read as IPs by
            // some resolvers, so refuse them instead of guessing.
            throw new BlockedUrlException('That address points to a private or reserved network.');
        } else {
            $ips = $this->resolver->resolve($host);
            if ($ips === []) {
                throw new BlockedUrlException("The host \"{$host}\" could not be resolved.");
            }
        }

        foreach ($ips as $ip) {
            if (! self::isPublicIp($ip)) {
                throw new BlockedUrlException('That address points to a private or reserved network.');
            }
        }

        return new GuardedUrl($url, $scheme, $literal, $port, array_values($ips));
    }

    public static function isPublicIp(string $ip): bool
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return ! self::inAnyRange($ip, self::BLOCKED_V4);
        }

        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return false;
        }

        $embedded = self::embeddedIpv4($ip);
        if ($embedded !== null) {
            return self::isPublicIp($embedded);
        }

        return self::inRange($ip, '2000::/3') && ! self::inAnyRange($ip, self::BLOCKED_V6);
    }

    /**
     * The IPv4 address inside IPv4-mapped (::ffff:0:0/96), NAT64
     * (64:ff9b::/96) and 6to4 (2002::/16) addresses, or null.
     */
    private static function embeddedIpv4(string $ip): ?string
    {
        $bytes = inet_pton($ip);

        if (self::inRange($ip, '::ffff:0:0/96') || self::inRange($ip, '64:ff9b::/96')) {
            return inet_ntop(substr($bytes, 12, 4));
        }

        if (self::inRange($ip, '2002::/16')) {
            return inet_ntop(substr($bytes, 2, 4));
        }

        return null;
    }

    /**
     * @param  list<string>  $cidrs
     */
    private static function inAnyRange(string $ip, array $cidrs): bool
    {
        foreach ($cidrs as $cidr) {
            if (self::inRange($ip, $cidr)) {
                return true;
            }
        }

        return false;
    }

    private static function inRange(string $ip, string $cidr): bool
    {
        [$subnet, $bits] = explode('/', $cidr);
        $ipBytes = inet_pton($ip);
        $subnetBytes = inet_pton($subnet);

        if ($ipBytes === false || $subnetBytes === false || strlen($ipBytes) !== strlen($subnetBytes)) {
            return false;
        }

        $bits = (int) $bits;
        $wholeBytes = intdiv($bits, 8);
        if (substr($ipBytes, 0, $wholeBytes) !== substr($subnetBytes, 0, $wholeBytes)) {
            return false;
        }

        $remainder = $bits % 8;
        if ($remainder === 0) {
            return true;
        }

        $mask = (0xFF << (8 - $remainder)) & 0xFF;

        return (ord($ipBytes[$wholeBytes]) & $mask) === (ord($subnetBytes[$wholeBytes]) & $mask);
    }

    private function looksLikeObfuscatedIpv4(string $host): bool
    {
        // Real hostnames always have a top-level label with a letter in it.
        return (bool) preg_match('/^(0x[0-9a-f]*|[0-9]+)(\.(0x[0-9a-f]*|[0-9]*))*$/i', $host);
    }
}
