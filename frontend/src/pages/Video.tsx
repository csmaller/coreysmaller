import React from 'react';
import { Layout } from '../components/Layout';
import { VideoList } from '../components/video/VideoList';

export const Video: React.FC = () => {
  return (
    <Layout>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Video Gallery
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Watch my latest videos, tutorials, and creative content. Each video 
          showcases different aspects of my work and interests.
        </p>
      </div>
      <VideoList enablePlaylist={true} />
    </Layout>
  );
};