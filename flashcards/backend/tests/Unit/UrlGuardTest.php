<?php

namespace Tests\Unit;

use App\Exceptions\BlockedUrlException;
use App\Services\Scraper\UrlGuard;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Tests\Support\FakeHostResolver;

class UrlGuardTest extends TestCase
{
    private UrlGuard $guard;

    protected function setUp(): void
    {
        $this->guard = new UrlGuard(new FakeHostResolver([
            'example.com' => ['93.184.215.14', '2606:2800:21f:cb07:6820:80da:af6b:8b2c'],
            'rebind.example' => ['93.184.215.14', '10.0.0.5'],
            'v6-loopback.example' => ['::1'],
        ]));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function blockedUrls(): array
    {
        return [
            'loopback' => ['http://127.0.0.1'],
            'loopback range' => ['http://127.8.9.10/admin'],
            'private 10.x' => ['http://10.0.0.1/'],
            'private 172.16.x' => ['http://172.16.5.4/'],
            'private 192.168.x' => ['http://192.168.1.1/'],
            'cloud metadata' => ['http://169.254.169.254/latest/meta-data/'],
            'unspecified' => ['http://0.0.0.0/'],
            'carrier NAT' => ['http://100.64.0.1/'],
            'ipv6 loopback' => ['http://[::1]/'],
            'ipv6 unique local' => ['http://[fd00::1]/'],
            'ipv6 link local' => ['http://[fe80::1]/'],
            'ipv4-mapped ipv6 loopback' => ['http://[::ffff:127.0.0.1]/'],
            'nat64 metadata' => ['http://[64:ff9b::a9fe:a9fe]/'],
            'decimal ip' => ['http://2130706433/'],
            'hex ip' => ['http://0x7f.0.0.1/'],
            'short ip' => ['http://127.1/'],
            'file scheme' => ['file:///etc/passwd'],
            'ftp scheme' => ['ftp://example.com/file.txt'],
            'gopher scheme' => ['gopher://example.com/'],
            'odd port' => ['http://example.com:8080/'],
            'credentials' => ['http://user:pass@example.com/'],
            'unresolvable host' => ['http://nowhere.invalid/'],
            'hostname to private ip' => ['http://rebind.example/'],
            'hostname to ipv6 loopback' => ['http://v6-loopback.example/'],
            'not a url' => ['not a url'],
        ];
    }

    #[DataProvider('blockedUrls')]
    public function test_blocks_unsafe_urls(string $url): void
    {
        $this->expectException(BlockedUrlException::class);

        $this->guard->check($url);
    }

    public function test_allows_a_public_hostname(): void
    {
        $guarded = $this->guard->check('https://example.com/some/page?x=1');

        $this->assertSame('example.com', $guarded->host);
        $this->assertSame(443, $guarded->port);
        $this->assertSame('93.184.215.14', $guarded->ips[0]);
        $this->assertSame('example.com:443:93.184.215.14', $guarded->curlResolveEntry());
    }

    public function test_allows_explicit_standard_ports_and_public_ip_literals(): void
    {
        $this->assertSame(80, $this->guard->check('http://example.com:80/')->port);
        $this->assertSame(443, $this->guard->check('https://example.com:443/')->port);
        $this->assertNull($this->guard->check('http://93.184.215.14/')->curlResolveEntry());
        $this->assertSame('2606:4700::1111', $this->guard->check('https://[2606:4700::1111]/')->host);
    }

    public function test_public_ip_classification(): void
    {
        $this->assertTrue(UrlGuard::isPublicIp('8.8.8.8'));
        $this->assertTrue(UrlGuard::isPublicIp('2a02:ec80:300:ed1a::1'));
        $this->assertTrue(UrlGuard::isPublicIp('::ffff:8.8.8.8'));
        $this->assertFalse(UrlGuard::isPublicIp('172.31.255.255'));
        $this->assertFalse(UrlGuard::isPublicIp('255.255.255.255'));
        $this->assertFalse(UrlGuard::isPublicIp('2001:db8::1'));
        $this->assertFalse(UrlGuard::isPublicIp('2002:7f00:1::'));
        $this->assertFalse(UrlGuard::isPublicIp('ff02::1'));
        $this->assertFalse(UrlGuard::isPublicIp('garbage'));
    }
}
