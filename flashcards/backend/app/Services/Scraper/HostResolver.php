<?php

namespace App\Services\Scraper;

interface HostResolver
{
    /**
     * Resolve a hostname to every IPv4 and IPv6 address it points to.
     *
     * @return list<string> An empty list when the host does not resolve.
     */
    public function resolve(string $host): array;
}
