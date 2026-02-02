import React from 'react';
import { AudioList } from '../components/audio';

export const Audio: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Audio Content
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Discover my audio content hosted on SoundCloud. From individual tracks to complete playlists, 
            explore the sounds and stories that inspire my creative journey.
          </p>
        </div>

        {/* Audio List */}
        <AudioList 
          showFilters={true}
          showPlayer={true}
          enablePlaylist={true}
        />
      </div>
    </div>
  );
};