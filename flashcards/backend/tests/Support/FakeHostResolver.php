<?php

namespace Tests\Support;

use App\Services\Scraper\HostResolver;

/**
 * Resolves hostnames from a fixed map so tests never touch real DNS.
 */
class FakeHostResolver implements HostResolver
{
    /**
     * @param  array<string, list<string>>  $hosts
     */
    public function __construct(private array $hosts = []) {}

    public function resolve(string $host): array
    {
        return $this->hosts[$host] ?? [];
    }
}
