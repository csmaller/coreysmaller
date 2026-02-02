import React from 'react';
import { MusicList } from '../components/music/MusicList';

export const Music: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Music Portfolio
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore my original compositions and musical creations. Each track represents 
            a unique journey through sound and emotion.
          </p>
        </div>

        {/* Music List */}
        <MusicList />
      </div>
    </div>
  );
};