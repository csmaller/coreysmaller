import {
  createSafeHtml,
  escapeHtml,
  isValidEmail,
  isValidSoundCloudUrl,
  isValidUrl,
  isValidYouTubeUrl,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
} from '../security';

describe('security utilities', () => {
  it('strips scripts and keeps allowed markup', () => {
    const clean = sanitizeHtml('<p>Hello</p><script>alert(1)</script><a href="https://example.com">link</a>');

    expect(clean).toContain('<p>Hello</p>');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).not.toContain('script');
    expect(createSafeHtml('<em>ok</em>').__html).toContain('<em>ok</em>');
  });

  it('accepts http, https, and relative urls', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true);
    expect(isValidUrl('/blog/1')).toBe(true);
    expect(isValidUrl('  https://example.com  ')).toBe(true);
  });

  it('rejects dangerous and unparseable urls', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('data:text/html,hi')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('https://')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('returns an empty string for unsafe urls', () => {
    expect(sanitizeUrl(' javascript:alert(1) ')).toBe('');
    expect(sanitizeUrl('https://example.com/a')).toBe('https://example.com/a');
  });

  it('escapes html special characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#x27;s&lt;&#x2F;a&gt;'
    );
  });

  it('validates email addresses', () => {
    expect(isValidEmail('corey@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('removes control characters and keeps newlines', () => {
    expect(sanitizeText('a\u0000b\nc\t')).toBe('ab\nc\t');
    expect(sanitizeText('')).toBe('');
  });

  it('recognizes youtube and soundcloud urls', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://example.com/watch')).toBe(false);
    expect(isValidSoundCloudUrl('https://soundcloud.com/artist/track')).toBe(true);
    expect(isValidSoundCloudUrl('https://soundcloud.com/artist')).toBe(false);
  });
});
