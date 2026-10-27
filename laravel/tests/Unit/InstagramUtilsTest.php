<?php

namespace Tests\Unit;

use App\Utils\InstagramUtils;
use PHPUnit\Framework\TestCase;

class InstagramUtilsTest extends TestCase
{
    public function test_reel_url_is_valid_and_embeds(): void
    {
        $url = 'https://www.instagram.com/reel/CxyzAbcd123/?igsh=abc';

        $this->assertTrue(InstagramUtils::isValidUrl($url));
        $this->assertSame('CxyzAbcd123', InstagramUtils::extractShortcode($url));
        $this->assertSame(
            'https://www.instagram.com/reel/CxyzAbcd123/embed',
            InstagramUtils::embedUrl($url)
        );
    }

    public function test_post_url_without_www_embeds(): void
    {
        $url = 'https://instagram.com/p/AbCdEfGhIjK/';

        $this->assertTrue(InstagramUtils::isValidUrl($url));
        $this->assertSame(
            'https://www.instagram.com/p/AbCdEfGhIjK/embed',
            InstagramUtils::embedUrl($url)
        );
    }

    public function test_profile_url_is_rejected(): void
    {
        $this->assertFalse(InstagramUtils::isValidUrl('https://www.instagram.com/coreysmaller/'));
        $this->assertNull(InstagramUtils::extractShortcode('https://www.instagram.com/coreysmaller/'));
    }
}
