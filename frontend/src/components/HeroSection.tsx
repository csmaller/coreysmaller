import React from 'react';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  contentStats: {
    totalPosts: number;
    totalTracks: number;
    totalVideos: number;
    totalAudio: number;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({ contentStats }) => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Corey Smaller's
            </span>{' '}
            Digital Space
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Explore my personal blog, original music compositions, video content, and creative projects. 
            A digital portfolio showcasing thoughts, sounds, and stories.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                {contentStats.totalPosts}
              </div>
              <div className="text-sm text-gray-600">Blog Posts</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                {contentStats.totalTracks}
              </div>
              <div className="text-sm text-gray-600">Music Tracks</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
              <div className="text-2xl md:text-3xl font-bold text-red-600 mb-1">
                {contentStats.totalVideos}
              </div>
              <div className="text-sm text-gray-600">Videos</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {contentStats.totalAudio}
              </div>
              <div className="text-sm text-gray-600">Audio Content</div>
            </div>
          </div>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/blog"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Read Latest Posts
            </Link>
            <Link
              to="/music"
              className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 border border-gray-200 shadow-lg hover:shadow-xl"
            >
              Listen to Music
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-32 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-200/30 rounded-full blur-xl"></div>
      </div>
    </section>
  );
};