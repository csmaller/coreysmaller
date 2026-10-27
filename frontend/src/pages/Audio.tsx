import React from 'react';
import { Layout } from '../components/Layout';
import { AudioList } from '../components/audio';

export const Audio: React.FC = () => {
  return (
    <Layout>
      <section className="container section first">
        <h1 className="display section-title">Sounds</h1>
        <p>SoundCloud tracks and playlists.</p>
        <AudioList
          showFilters={true}
          showPlayer={true}
          enablePlaylist={true}
        />
      </section>
    </Layout>
  );
};