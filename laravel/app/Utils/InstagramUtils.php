<?php

namespace App\Utils;

/**
 * Instagram post and reel URLs.
 * Supports:
 * - https://www.instagram.com/p/CODE/
 * - https://www.instagram.com/reel/CODE/
 * - https://www.instagram.com/reels/CODE/
 * - https://instagram.com/tv/CODE/
 */
class InstagramUtils
{
    public static function extractShortcode(string $url): ?string
    {
        if (preg_match('#instagram\.com/(?:p|reel|reels|tv)/([A-Za-z0-9_-]+)#', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    public static function isValidUrl(string $url): bool
    {
        return (bool) preg_match(
            '#^https://(www\.)?instagram\.com/(p|reel|reels|tv)/[A-Za-z0-9_-]+#',
            $url
        );
    }

    public static function embedUrl(string $url): ?string
    {
        if (!preg_match('#instagram\.com/(p|reel|reels|tv)/([A-Za-z0-9_-]+)#', $url, $matches)) {
            return null;
        }

        $kind = $matches[1] === 'reels' ? 'reel' : $matches[1];

        return 'https://www.instagram.com/'.$kind.'/'.$matches[2].'/embed';
    }
}
