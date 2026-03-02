/**
 * SEO Utilities
 * 
 * Helper functions for generating SEO-friendly content
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'music.song' | 'video.other';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Generate page title with site name
 */
export function generateTitle(pageTitle?: string): string {
  const siteName = 'Corey Smaller';
  if (!pageTitle) {
    return `${siteName} - Musician, Writer, Creator`;
  }
  return `${pageTitle} | ${siteName}`;
}

/**
 * Truncate text to specified length for meta descriptions
 */
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to cut at last complete word
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Generate meta description from content
 */
export function generateDescription(content: string, excerpt?: string): string {
  if (excerpt) {
    return truncateDescription(stripHtml(excerpt));
  }
  
  const plainText = stripHtml(content);
  return truncateDescription(plainText);
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://coreysmaller.com';
  return `${baseUrl}${path}`;
}

/**
 * Generate Open Graph metadata
 */
export function generateOpenGraphTags(metadata: SEOMetadata): Record<string, string> {
  const tags: Record<string, string> = {
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:type': metadata.type || 'website',
    'og:url': metadata.url || generateCanonicalUrl(window.location.pathname),
  };

  if (metadata.image) {
    tags['og:image'] = metadata.image;
    tags['og:image:alt'] = metadata.title;
  }

  if (metadata.type === 'article') {
    if (metadata.author) {
      tags['article:author'] = metadata.author;
    }
    if (metadata.publishedTime) {
      tags['article:published_time'] = metadata.publishedTime;
    }
    if (metadata.modifiedTime) {
      tags['article:modified_time'] = metadata.modifiedTime;
    }
    if (metadata.section) {
      tags['article:section'] = metadata.section;
    }
    if (metadata.tags) {
      metadata.tags.forEach((tag, index) => {
        tags[`article:tag:${index}`] = tag;
      });
    }
  }

  return tags;
}

/**
 * Generate Twitter Card metadata
 */
export function generateTwitterTags(metadata: SEOMetadata): Record<string, string> {
  const tags: Record<string, string> = {
    'twitter:card': metadata.image ? 'summary_large_image' : 'summary',
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
  };

  if (metadata.image) {
    tags['twitter:image'] = metadata.image;
  }

  return tags;
}

/**
 * Generate JSON-LD structured data for blog post
 */
export function generateBlogPostSchema(data: {
  title: string;
  description: string;
  content: string;
  author: string;
  publishedDate: string;
  modifiedDate: string;
  image?: string;
  url: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    articleBody: stripHtml(data.content),
    author: {
      '@type': 'Person',
      name: data.author,
      url: generateCanonicalUrl('/'),
    },
    publisher: {
      '@type': 'Person',
      name: data.author,
    },
    datePublished: data.publishedDate,
    dateModified: data.modifiedDate,
    image: data.image,
    url: data.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
  };
}

/**
 * Generate JSON-LD structured data for music
 */
export function generateMusicSchema(data: {
  title: string;
  description?: string;
  artist: string;
  genre?: string;
  audioUrl?: string;
  coverArt?: string;
  duration?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: data.title,
    description: data.description,
    byArtist: {
      '@type': 'Person',
      name: data.artist,
    },
    genre: data.genre,
    audio: data.audioUrl,
    image: data.coverArt,
    duration: data.duration,
  };
}

/**
 * Generate JSON-LD structured data for video
 */
export function generateVideoSchema(data: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate: string;
  duration?: string;
  embedUrl: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: data.title,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate: data.uploadDate,
    duration: data.duration,
    embedUrl: data.embedUrl,
  };
}

/**
 * Generate JSON-LD structured data for person/author
 */
export function generatePersonSchema(data: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  sameAs?: string[];
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    description: data.description,
    url: data.url,
    image: data.image,
    sameAs: data.sameAs,
  };
}

/**
 * Generate robots meta tag content
 */
export function generateRobotsTag(options: {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
}): string {
  const directives: string[] = [];
  
  directives.push(options.index !== false ? 'index' : 'noindex');
  directives.push(options.follow !== false ? 'follow' : 'nofollow');
  
  if (options.noarchive) directives.push('noarchive');
  if (options.nosnippet) directives.push('nosnippet');
  
  return directives.join(', ');
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
