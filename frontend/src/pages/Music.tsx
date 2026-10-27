import React from 'react';
import { Layout } from '../components/Layout';
import { MusicList } from '../components/music/MusicList';

export const Music: React.FC = () => {
  return (
    <Layout>
      <section className="container section first">
        <h1 className="display section-title">Music</h1>
        <p>Original compositions.</p>
        <MusicList />
      </section>
    </Layout>
  );
};