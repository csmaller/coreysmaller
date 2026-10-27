export function blogEntryHref(post: {
  type?: string | null;
  id?: number | string | null;
  slug?: string | null;
  volumeSlug?: string | null;
}): string {
  const volumeSlug = post.type === 'volume' ? (post.slug || post.volumeSlug) : null;
  if (volumeSlug) return `/blog/volume/${volumeSlug}`;

  if (post.id === undefined || post.id === null || post.id === '') {
    const slug = post.volumeSlug || post.slug;
    return slug ? `/blog/volume/${slug}` : '/blog';
  }

  return `/blog/${post.id}`;
}
