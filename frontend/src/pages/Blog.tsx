import React from 'react';
import { Layout } from '../components/Layout';
import { BlogList } from '../components/blog';

export const Blog: React.FC = () => {
  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
        </div>
        <BlogList />
      </div>
    </Layout>
  );
};