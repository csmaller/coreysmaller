import React from 'react';
import { Layout } from '../components/Layout';
import { BlogList } from '../components/blog';

export const Blog: React.FC = () => {
  return (
    <Layout>
      <section className="container section first">
        <h1 className="display section-title">Words</h1>
        <BlogList />
      </section>
    </Layout>
  );
};