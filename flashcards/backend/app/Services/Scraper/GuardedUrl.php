<?php

namespace App\Services\Scraper;

/**
 * A URL that passed UrlGuard, together with the public IPs its host resolved
 * to. The scraper pins the connection to these IPs so a second DNS lookup
 * cannot swap in a private address (DNS rebinding).
 */
final readonly class GuardedUrl
{
    /**
     * @param  list<string>  $ips
     */
    public function __construct(
        public string $url,
        public string $scheme,
        public string $host,
        public int $port,
        public array $ips,
    ) {}

    /**
     * Entry for CURLOPT_RESOLVE, e.g. "example.com:443:93.184.215.14", or
     * null when the host is already an IP literal.
     */
    public function curlResolveEntry(): ?string
    {
        if (filter_var($this->host, FILTER_VALIDATE_IP)) {
            return null;
        }

        $ip = $this->ips[0];

        return sprintf('%s:%d:%s', $this->host, $this->port, str_contains($ip, ':') ? "[{$ip}]" : $ip);
    }
}
