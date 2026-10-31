<?php

namespace Tests\Unit;

use App\Utils\SoundCloudUtils;
use PHPUnit\Framework\TestCase;

class SoundCloudUtilsTest extends TestCase
{
    public function test_extract_track_id_from_track_url(): void
    {
        $trackId = SoundCloudUtils::extractTrackId('https://soundcloud.com/artist-name/track-name');

        $this->assertSame('artist-name/track-name', $trackId);
    }

    public function test_extract_track_id_ignores_query_string(): void
    {
        $trackId = SoundCloudUtils::extractTrackId('https://soundcloud.com/artist-name/track-name?si=abc');

        $this->assertSame('artist-name/track-name', $trackId);
    }

    public function test_extract_track_id_returns_null_for_profile_url(): void
    {
        $this->assertNull(SoundCloudUtils::extractTrackId('https://soundcloud.com/artist-name'));
    }

    public function test_extract_track_id_returns_null_for_non_https(): void
    {
        $this->assertNull(SoundCloudUtils::extractTrackId('http://soundcloud.com/artist-name/track-name'));
    }

    public function test_is_valid_url_accepts_track_url(): void
    {
        $this->assertTrue(SoundCloudUtils::isValidUrl('https://soundcloud.com/artist-name/track-name'));
    }

    public function test_is_valid_url_accepts_query_string(): void
    {
        $this->assertTrue(SoundCloudUtils::isValidUrl('https://soundcloud.com/artist-name/track-name?si=abc'));
    }

    public function test_is_valid_url_rejects_profile_playlist_and_other_hosts(): void
    {
        $this->assertFalse(SoundCloudUtils::isValidUrl('https://soundcloud.com/artist-name'));
        $this->assertFalse(SoundCloudUtils::isValidUrl('https://soundcloud.com/artist-name/sets/playlist'));
        $this->assertFalse(SoundCloudUtils::isValidUrl('https://example.com/artist-name/track-name'));
        $this->assertFalse(SoundCloudUtils::isValidUrl('http://soundcloud.com/artist-name/track-name'));
    }
}
