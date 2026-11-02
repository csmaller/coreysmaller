<?php

namespace Tests;

use App\Services\Scraper\HostResolver;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeHostResolver;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // No real network: unfaked HTTP calls fail and DNS answers come
        // from a fixed map.
        Http::preventStrayRequests();
        $this->app->instance(HostResolver::class, new FakeHostResolver([
            'example.com' => ['93.184.215.14'],
            'en.wikipedia.org' => ['185.15.59.224', '2a02:ec80:300:ed1a::1'],
            'rebind.example' => ['93.184.215.14', '10.0.0.5'],
            'internal.example' => ['192.168.1.10'],
        ]));
    }
}
