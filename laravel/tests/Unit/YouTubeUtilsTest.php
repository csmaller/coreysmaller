<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Utils\YouTubeUtils;

/**
 * YouTubeUtilsTest
 * 
 * Unit tests for YouTube URL validation and video ID extraction.
 */
class YouTubeUtilsTest extends TestCase
{
    /**
     * Test extractVideoId with youtube.com/watch?v= format
     */
    public function test_extract_video_id_from_watch_url(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $videoId = YouTubeUtils::extractVideoId($url);
        
        $this->assertEquals('dQw4w9WgXcQ', $videoId);
    }

    /**
     * Test extractVideoId with youtu.be format
     */
    public function test_extract_video_id_from_short_url(): void
    {
        $url = 'https://youtu.be/jNQXAC9IVRw';
        $videoId = YouTubeUtils::extractVideoId($url);
        
        $this->assertEquals('jNQXAC9IVRw', $videoId);
    }

    /**
     * Test extractVideoId with youtube.com/embed format
     */
    public function test_extract_video_id_from_embed_url(): void
    {
        $url = 'https://www.youtube.com/embed/M7lc1UVf-VE';
        $videoId = YouTubeUtils::extractVideoId($url);
        
        $this->assertEquals('M7lc1UVf-VE', $videoId);
    }

    public function test_extract_video_id_from_shorts_url(): void
    {
        $url = 'https://www.youtube.com/shorts/bChAwT1SaEg';
        $videoId = YouTubeUtils::extractVideoId($url);

        $this->assertEquals('bChAwT1SaEg', $videoId);
    }

    public function test_is_valid_url_with_shorts_format(): void
    {
        $url = 'https://www.youtube.com/shorts/bChAwT1SaEg';

        $this->assertTrue(YouTubeUtils::isValidUrl($url));
    }

    /**
     * Test extractVideoId returns null for invalid URL
     */
    public function test_extract_video_id_returns_null_for_invalid_url(): void
    {
        $url = 'https://example.com/video';
        $videoId = YouTubeUtils::extractVideoId($url);
        
        $this->assertNull($videoId);
    }

    /**
     * Test isValidUrl with youtube.com/watch?v= format
     */
    public function test_is_valid_url_with_watch_format(): void
    {
        $url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $isValid = YouTubeUtils::isValidUrl($url);
        
        $this->assertTrue($isValid);
    }

    /**
     * Test isValidUrl with youtu.be format
     */
    public function test_is_valid_url_with_short_format(): void
    {
        $url = 'https://youtu.be/jNQXAC9IVRw';
        $isValid = YouTubeUtils::isValidUrl($url);
        
        $this->assertTrue($isValid);
    }

    /**
     * Test isValidUrl with youtube.com/embed format
     */
    public function test_is_valid_url_with_embed_format(): void
    {
        $url = 'https://www.youtube.com/embed/M7lc1UVf-VE';
        $isValid = YouTubeUtils::isValidUrl($url);
        
        $this->assertTrue($isValid);
    }

    /**
     * Test isValidUrl returns false for invalid URL
     */
    public function test_is_valid_url_returns_false_for_invalid_url(): void
    {
        $url = 'https://example.com/video';
        $isValid = YouTubeUtils::isValidUrl($url);
        
        $this->assertFalse($isValid);
    }

    /**
     * Test isValidUrl returns false for non-HTTPS URL
     */
    public function test_is_valid_url_returns_false_for_non_https(): void
    {
        $url = 'http://www.youtube.com/watch?v=dQw4w9WgXcQ';
        $isValid = YouTubeUtils::isValidUrl($url);
        
        $this->assertFalse($isValid);
    }

    /**
     * Test isValidUrl returns false for URL with invalid video ID length
     */
    public function test_is_valid_url_returns_false_for_invalid_video_id_length(): void
    {
        $url = 'https://www.youtube.com/watch?v=short';
        $isValid = YouTubeUtils::isValidUrl($url);
        
        $this->assertFalse($isValid);
    }
}
