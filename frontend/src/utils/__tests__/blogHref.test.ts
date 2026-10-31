import { blogEntryHref } from '../blogHref';

describe('blogEntryHref', () => {
  it('links a volume title to the volume page', () => {
    expect(blogEntryHref({ type: 'volume', slug: 'field-notes' })).toBe('/blog/volume/field-notes');
    expect(blogEntryHref({ type: 'volume', volumeSlug: 'road-notes' })).toBe('/blog/volume/road-notes');
  });

  it('links a chapter to its post and falls back to the blog index', () => {
    expect(blogEntryHref({ id: 7 })).toBe('/blog/7');
    expect(blogEntryHref({ id: '', slug: 'field-notes' })).toBe('/blog/volume/field-notes');
    expect(blogEntryHref({})).toBe('/blog');
  });
});
