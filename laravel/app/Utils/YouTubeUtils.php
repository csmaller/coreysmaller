<?php

namespace App\Utils;

/**
 * YouTubeUtils
 * 
 * Utility class for YouTube URL validation and video ID extraction.
 * Supports multiple YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * 
 * Requirements: 11.1, 11.2, 11.7
 */
class YouTubeUtils
{
    /**
     * Extract video ID from various YouTube URL formats
     * 
     * @param string $url
     * @return string|null Returns video ID if found, null otherwise
     */
    public static function extractVideoId(string $url): ?string
    {
        // Pattern 1: https://www.youtube.com/watch?v=VIDEO_ID
        if (preg_match('/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }
        
        // Pattern 2: https://youtu.be/VIDEO_ID
        if (preg_match('/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }
        
        // Pattern 3: https://www.youtube.com/embed/VIDEO_ID
        if (preg_match('/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }

        // Pattern 4: https://www.youtube.com/shorts/VIDEO_ID
        if (preg_match('/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Validate if a URL is a valid YouTube URL
     * 
     * @param string $url
     * @return bool Returns true if URL is a valid YouTube URL
     */
    public static function isValidUrl(string $url): bool
    {
        // Check if URL matches any of the supported YouTube URL patterns
        $patterns = [
            '/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/',
            '/^https:\/\/youtu\.be\/[a-zA-Z0-9_-]{11}/',
            '/^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/',
            '/^https:\/\/www\.youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url)) {
                return true;
            }
        }
        
        return false;
    }
}
