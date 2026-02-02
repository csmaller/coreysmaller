import React from 'react';
import { VideoList } from '../components/video/VideoList';

export const Video: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Video Gallery
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Watch my latest videos, tutorials, and creative content. Each video 
            showcases different aspects of my work and interests.
          </p>
        </div>

        {/* Video List with Playlist Support */}
        <VideoList enablePlaylist={true} />
      </div>
    </div>
  );
};