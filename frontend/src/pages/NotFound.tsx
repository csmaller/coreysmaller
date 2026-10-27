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
        <section className="container section first">
          <h1 className="display section-title">404</h1>
          <p>That page is not here.</p>
          <div className="btn-row">
            <Link className="btn btn-primary" to="/">Return home</Link>
            <Link className="btn btn-ghost" to="/blog">Words</Link>
            <Link className="btn btn-ghost" to="/audio">Sounds</Link>
            <Link className="btn btn-ghost" to="/video">Sights</Link>
          </div>
        </section>
      </Layout>
    </>
  );
};