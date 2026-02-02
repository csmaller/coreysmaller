import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'music.song' | 'video.other';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  structuredData?: object;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Corey Smaller - Personal Website',
  description = 'Personal website of Corey Smaller featuring blog posts, music portfolio, and creative content.',
  keywords = 'Corey Smaller, blog, music, portfolio, personal website',
  image = '/default-og-image.jpg',
  url = window.location.href,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Corey Smaller',
  structuredData
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Convert keywords to string if it's an array
    const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywordsString);
    updateMetaTag('author', author);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Corey Smaller', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Article-specific tags
    if (type === 'article' && publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
      updateMetaTag('article:author', author, true);
    }

    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, true);
    }

    // Structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [title, description, keywords, image, url, type, publishedTime, modifiedTime, author, structuredData]);

  return null;
};

// Helper function to generate structured data for different content types
export const generateStructuredData = {
  website: (name: string, url: string, description: string) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    author: {
      '@type': 'Person',
      name: 'Corey Smaller'
    }
  }),

  article: (title: string, description: string, url: string, publishedTime: string, modifiedTime?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: 'Corey Smaller'
    },
    publisher: {
      '@type': 'Person',
      name: 'Corey Smaller'
    }
  }),

  musicRecording: (name: string, description: string, url: string, duration?: number) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name,
    description,
    url,
    duration: duration ? `PT${duration}S` : undefined,
    byArtist: {
      '@type': 'Person',
      name: 'Corey Smaller'
    }
  }),

  videoObject: (name: string, description: string, url: string, thumbnailUrl?: string, duration?: number) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    contentUrl: url,
    thumbnailUrl,
    duration: duration ? `PT${duration}S` : undefined,
    creator: {
      '@type': 'Person',
      name: 'Corey Smaller'
    }
  })
};