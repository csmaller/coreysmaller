import React from 'react';
import { ContentCard } from './ContentCard';
import type { ContentPreview } from '../services/contentAggregation';

interface RecentContentProps {
  contentPreviews: ContentPreview[];
  loading?: boolean;
}

export const RecentContent: React.FC<RecentContentProps> = ({ 
  contentPreviews, 
  loading = false 
}) => {
  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Recent Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (contentPreviews.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Recent Content
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No content available yet. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Recent Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentPreviews.slice(0, 6).map((content) => (
            <ContentCard 
              key={`${content.contentType}-${content.id}`} 
              content={content}
            />
          ))}
        </div>
        
        {contentPreviews.length > 6 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Showing 6 of {contentPreviews.length} recent items
            </p>
          </div>
        )}
      </div>
    </section>
  );
};