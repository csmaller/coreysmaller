<?php

namespace App\Utils;

/**
 * SoundCloudUtils
 * 
 * Utility class for SoundCloud URL validation and track ID extraction.
 * Supports SoundCloud URL format:
 * - https://soundcloud.com/artist/track
 * 
 * Requirements: 11.4, 11.5, 11.8
 */
class SoundCloudUtils
{
    /**
     * Extract track ID from SoundCloud URL
     * 
     * The track ID is the combination of artist/track from the URL path.
     * For example: https://soundcloud.com/artist-name/track-name
     * Returns: "artist-name/track-name"
     * 
     * @param string $url
     * @return string|null Returns track ID if found, null otherwise
     */
    public static function extractTrackId(string $url): ?string
    {
        // Pattern: https://soundcloud.com/artist/track
        // Extract the artist/track portion after soundcloud.com/
        if (preg_match('/^https:\/\/soundcloud\.com\/([^\/]+\/[^\/\?#]+)/', $url, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Validate if a URL is a valid SoundCloud URL
     * 
     * @param string $url
     * @return bool Returns true if URL is a valid SoundCloud URL
     */
    public static function isValidUrl(string $url): bool
    {
        // Check if URL matches the SoundCloud URL pattern
        // Must be https://soundcloud.com/artist/track format
        return preg_match('/^https:\/\/soundcloud\.com\/[^\/]+\/[^\/\?#]+/', $url) === 1;
    }
}
