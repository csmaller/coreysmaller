import React from 'react';
import { Layout } from '../components/Layout';
import { MusicList } from '../components/music/MusicList';

export const Music: React.FC = () => {
  return (
    <Layout>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Music Portfolio
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore my original compositions and musical creations. Each track represents 
          a unique journey through sound and emotion.
        </p>
      </div>
      <MusicList />
    </Layout>
  );
};