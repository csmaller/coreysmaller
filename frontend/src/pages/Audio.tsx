import React from 'react';
import { Layout } from '../components/Layout';
import { AudioList } from '../components/audio';

export const Audio: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Audio Content
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Discover my audio content hosted on SoundCloud. From individual tracks to complete playlists, 
          explore the sounds and stories that inspire my creative journey.
        </p>
      </div>
      <AudioList 
        showFilters={true}
        showPlayer={true}
        enablePlaylist={true}
      />
    </Layout>
  );
};