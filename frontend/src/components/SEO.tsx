import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  generateTitle,
  generateCanonicalUrl,
  generateOpenGraphTags,
  generateTwitterTags,
  generateRobotsTag,
  type SEOMetadata,
} from '../utils/seo';

interface SEOProps extends SEOMetadata {
  children?: React.ReactNode;
  structuredData?: object | object[];
  noindex?: boolean;
  nofollow?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  children,
  structuredData,
  noindex = false,
  nofollow = false,
}) => {
  const pageTitle = generateTitle(title);
  const canonicalUrl = url || generateCanonicalUrl(window.location.pathname);
  
  const metadata: SEOMetadata = {
    title: pageTitle,
    description,
    keywords,
    image,
    url: canonicalUrl,
    type,
    author,
    publishedTime,
    modifiedTime,
    section,
    tags,
  };

  const ogTags = generateOpenGraphTags(metadata);
  const twitterTags = generateTwitterTags(metadata);
  const robotsContent = generateRobotsTag({ 
    index: !noindex, 
    follow: !nofollow 
  });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      {Object.entries(ogTags).map(([property, content]) => (
        <meta key={property} property={property} content={content} />
      ))}

      {/* Twitter Card Tags */}
      {Object.entries(twitterTags).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData]
          )}
        </script>
      )}

      {/* Additional custom tags */}
      {children}
    </Helmet>
  );
};
