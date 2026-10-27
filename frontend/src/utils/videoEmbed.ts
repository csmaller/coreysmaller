export type VideoProvider = 'youtube' | 'instagram';

export interface VideoEmbed {
  provider: VideoProvider;
  id: string;
  src: string;
}

const YOUTUBE_ID = '[a-zA-Z0-9_-]{11}';

export function videoEmbed(url: string): VideoEmbed | null {
  const trimmed = url.trim();

  if (/instagram\.com/.test(trimmed)) {
    const match = trimmed.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      return null;
    }
    const kind = match[1] === 'reels' ? 'reel' : match[1];
    return {
      provider: 'instagram',
      id: match[2],
      src: `https://www.instagram.com/${kind}/${match[2]}/embed`,
    };
  }

  if (!/youtube\.com|youtu\.be/.test(trimmed)) {
    return null;
  }

  const id =
    trimmed.match(new RegExp(`youtube\\.com/shorts/(${YOUTUBE_ID})`))?.[1] ||
    trimmed.match(new RegExp(`[?&]v=(${YOUTUBE_ID})`))?.[1] ||
    trimmed.match(new RegExp(`youtu\\.be/(${YOUTUBE_ID})`))?.[1] ||
    trimmed.match(new RegExp(`youtube\\.com/embed/(${YOUTUBE_ID})`))?.[1];

  if (!id) {
    return null;
  }

  return {
    provider: 'youtube',
    id,
    src: youtubePlayerSrc(id),
  };
}

function youtubePlayerSrc(id: string): string {
  const params = new URLSearchParams({ rel: '0' });
  if (typeof window !== 'undefined' && window.location?.origin) {
    params.set('origin', window.location.origin);
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
