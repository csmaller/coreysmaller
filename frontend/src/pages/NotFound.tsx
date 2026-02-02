import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SEO } from '../components/SEO';

export const NotFound: React.FC = () => {
  return (
    <>
      <SEO
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist. Return to Corey Smaller's homepage to explore available content."
        url="https://coreysmaller.com/404"
      />
      <Layout>
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            {/* 404 Illustration */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
              <div className="text-6xl mb-4">🎵</div>
            </div>
            
            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Looks like this page hit a wrong note. The content you're looking for doesn't exist or may have been moved.
            </p>
            
            {/* Navigation Options */}
            <div className="space-y-4">
              <Link
                to="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Return Home
              </Link>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
                <Link
                  to="/blog"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Browse Blog Posts
                </Link>
                <span className="hidden sm:inline text-gray-400">•</span>
                <Link
                  to="/music"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Listen to Music
                </Link>
                <span className="hidden sm:inline text-gray-400">•</span>
                <Link
                  to="/video"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Watch Videos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};