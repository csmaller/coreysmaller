import React from 'react';
import { Layout } from '../components/Layout';
import { VideoList } from '../components/video/VideoList';

export const Video: React.FC = () => {
  return (
    <Layout>
      <section className="container section first">
        <h1 className="display section-title">Video</h1>
        <p>Videos and other moving work.</p>
        <VideoList enablePlaylist={true} />
      </section>
    </Layout>
  );
};