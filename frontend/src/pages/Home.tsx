import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { SEO } from '../components/SEO';
import { HeroSection } from '../components/HeroSection';
import { RecentContent } from '../components/RecentContent';
import { contentAggregationService } from '../services/contentAggregation';
import type { ContentPreview } from '../services/contentAggregation';

export const Home: React.FC = () => {
  const [contentPreviews, setContentPreviews] = useState<ContentPreview[]>([]);
  const [contentStats, setContentStats] = useState({
    totalPosts: 0,
    totalTracks: 0,
    totalVideos: 0,
    totalAudio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomePageContent();
  }, []);

  const loadHomePageContent = async () => {
    try {
      setLoading(true);
      
      // Load recent content and stats in parallel
      const [recentContent, stats] = await Promise.all([
        contentAggregationService.getRecentContent(6),
        contentAggregationService.getContentStats()
      ]);

      // Convert to content previews for unified display
      const previews = contentAggregationService.convertToContentPreviews(recentContent);
      
      setContentPreviews(previews);
      setContentStats(stats);
    } catch (error) {
      console.error('Error loading home page content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate structured data for the home page
  const homePageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Corey Smaller',
    url: 'https://coreysmaller.com',
    description: 'Personal website featuring blog posts, original music compositions, video content, and creative projects',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://coreysmaller.com'
    },
    sameAs: [
      // Add social media profiles when available
    ],
    knowsAbout: [
      'Music Composition',
      'Content Creation',
      'Blog Writing',
      'Creative Projects'
    ]
  };

  return (
    <>
      <SEO
        title="Corey Smaller - Personal Website, Blog, Music & Creative Content"
        description="Welcome to Corey Smaller's personal website featuring blog posts, original music compositions, video content, and creative projects. Explore my digital portfolio and latest work."
        keywords={['Corey Smaller', 'personal website', 'blog', 'music', 'creative content', 'portfolio', 'original music', 'compositions']}
        url="https://coreysmaller.com"
        type="website"
        structuredData={homePageStructuredData}
      />
      <Layout>
        <div className="space-y-0">
          {/* Hero Section */}
          <HeroSection contentStats={contentStats} />
          
          {/* Recent Content Section */}
          <RecentContent 
            contentPreviews={contentPreviews} 
            loading={loading}
          />
        </div>
      </Layout>
    </>
  );
};