<?php

namespace App\Services\Scraper;

class DnsHostResolver implements HostResolver
{
    public function resolve(string $host): array
    {
        $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];

        // gethostbynamel() also reads /etc/hosts, which DNS queries skip.
        // Every address from either source gets checked by UrlGuard.
        $ips = @gethostbynamel($host) ?: [];
        foreach ($records as $record) {
            $ip = $record['ip'] ?? $record['ipv6'] ?? null;
            if (is_string($ip)) {
                $ips[] = $ip;
            }
        }

        return array_values(array_unique($ips));
    }
}
