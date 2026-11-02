<?php

namespace App\Services\Scraper;

final class UrlNormalizer
{
    /**
     * Canonical form used for cache keys and url_hash: lowercase scheme and
     * host, default port and fragment dropped, empty path becomes "/".
     */
    public static function normalize(string $url): string
    {
        $parts = parse_url(trim($url));
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return trim($url);
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower($parts['host']);
        $port = $parts['port'] ?? null;
        $defaultPort = $scheme === 'https' ? 443 : 80;

        $normalized = $scheme.'://';
        if (isset($parts['user'])) {
            $normalized .= $parts['user'].(isset($parts['pass']) ? ':'.$parts['pass'] : '').'@';
        }
        $normalized .= $host;
        if ($port !== null && $port !== $defaultPort) {
            $normalized .= ':'.$port;
        }
        $normalized .= ($parts['path'] ?? '') === '' ? '/' : $parts['path'];
        if (isset($parts['query']) && $parts['query'] !== '') {
            $normalized .= '?'.$parts['query'];
        }

        return $normalized;
    }

    /**
     * Resolve a redirect Location header against the URL that returned it.
     */
    public static function resolve(string $base, string $location): string
    {
        $location = trim($location);

        if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $location)) {
            return self::normalize($location);
        }

        $parts = parse_url($base);
        $origin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        if (str_starts_with($location, '//')) {
            return self::normalize($parts['scheme'].':'.$location);
        }

        if (str_starts_with($location, '/')) {
            return self::normalize($origin.$location);
        }

        if (str_starts_with($location, '?')) {
            return self::normalize($origin.($parts['path'] ?? '/').$location);
        }

        $directory = preg_replace('#/[^/]*$#', '/', $parts['path'] ?? '/');

        return self::normalize($origin.$directory.$location);
    }
}
