jest.mock('../siteEnv', () => ({
  siteOrigin: () => 'https://coreysmaller.com',
}));

import {
  generateBlogPostSchema,
  generateBreadcrumbSchema,
  generateCanonicalUrl,
  generateDescription,
  generateMusicSchema,
  generateOpenGraphTags,
  generatePersonSchema,
  generateRobotsTag,
  generateTitle,
  generateTwitterTags,
  generateVideoSchema,
  stripHtml,
  truncateDescription,
} from '../seo';

describe('seo utilities', () => {
  it('builds titles and truncated descriptions', () => {
    expect(generateTitle()).toBe('Corey Smaller - Musician, Writer, Creator');
    expect(generateTitle('Night ski')).toBe('Night ski | Corey Smaller');
    expect(truncateDescription('short')).toBe('short');

    const long = 'alpha beta gamma delta epsilon zeta eta theta iota kappa';
    const truncated = truncateDescription(long, 24);
    expect(truncated.endsWith('...')).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(27);
    expect(truncated.startsWith('alpha')).toBe(true);
  });

  it('strips html before writing a meta description', () => {
    expect(stripHtml('<p>Hello <strong>there</strong></p>')).toBe('Hello there');
    expect(generateDescription('<p>Full post</p>', '<p>Excerpt text</p>')).toBe('Excerpt text');
    expect(generateDescription('<p>Full post body</p>')).toBe('Full post body');
  });

  it('builds a canonical url from the site origin', () => {
    const url = generateCanonicalUrl('/blog/7');
    expect(url.endsWith('/blog/7')).toBe(true);
    expect(url.startsWith('http')).toBe(true);
  });

  it('builds open graph and twitter tags', () => {
    const metadata = {
      title: 'Night ski',
      description: 'A post',
      type: 'article' as const,
      url: 'https://coreysmaller.com/blog/7',
      image: 'https://coreysmaller.com/cover.jpg',
      author: 'Corey Smaller',
      publishedTime: '2024-01-01',
      modifiedTime: '2024-01-02',
      section: 'Writing',
      tags: ['ski', 'night'],
    };

    expect(generateOpenGraphTags(metadata)).toMatchObject({
      'og:title': 'Night ski',
      'og:type': 'article',
      'og:image': 'https://coreysmaller.com/cover.jpg',
      'article:author': 'Corey Smaller',
      'article:tag:0': 'ski',
      'article:tag:1': 'night',
    });

    expect(generateTwitterTags(metadata)['twitter:card']).toBe('summary_large_image');
    expect(generateTwitterTags({ title: 'Home', description: 'Site' })['twitter:card']).toBe('summary');
  });

  it('falls back to the current path for open graph urls', () => {
    const tags = generateOpenGraphTags({ title: 'Home', description: 'Site' });
    expect(tags['og:url']).toContain(window.location.pathname);
  });

  it('builds structured data and robots directives', () => {
    const post = generateBlogPostSchema({
      title: 'Night ski',
      description: 'A post',
      content: '<p>Body copy</p>',
      author: 'Corey Smaller',
      publishedDate: '2024-01-01',
      modifiedDate: '2024-01-02',
      url: 'https://coreysmaller.com/blog/7',
    }) as { articleBody: string; '@type': string };

    expect(post['@type']).toBe('BlogPosting');
    expect(post.articleBody).toBe('Body copy');

    expect(generateMusicSchema({ title: 'Song', artist: 'Corey' })).toMatchObject({
      '@type': 'MusicRecording',
      name: 'Song',
    });
    expect(generateVideoSchema({
      title: 'Clip',
      uploadDate: '2024-01-01',
      embedUrl: 'https://www.youtube.com/embed/abc',
    })).toMatchObject({ '@type': 'VideoObject' });
    expect(generatePersonSchema({
      name: 'Corey Smaller',
      url: 'https://coreysmaller.com',
    })).toMatchObject({ '@type': 'Person' });

    const crumbs = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://coreysmaller.com' },
      { name: 'Blog', url: 'https://coreysmaller.com/blog' },
    ]) as { itemListElement: Array<{ position: number }> };
    expect(crumbs.itemListElement.map((item) => item.position)).toEqual([1, 2]);

    expect(generateRobotsTag({})).toBe('index, follow');
    expect(generateRobotsTag({ index: false, follow: false, noarchive: true, nosnippet: true }))
      .toBe('noindex, nofollow, noarchive, nosnippet');
  });
});
