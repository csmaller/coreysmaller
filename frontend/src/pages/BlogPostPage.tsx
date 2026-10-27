import React from 'react';
import { Layout } from '../components/Layout';
import { BlogPost } from '../components/blog';

export const BlogPostPage: React.FC = () => {
  return (
    <Layout>
      <section className="container section first">
        <BlogPost />
      </section>
    </Layout>
  );
};