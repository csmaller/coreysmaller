import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { blogService, type BlogVolume as Volume } from '../services/blog';
import type { BlogPost } from '../types';
import { WordCount } from '../components/blog/WordCount';

export const BlogVolume: React.FC = () => {
  const { slug = '' } = useParams();
  const [volume, setVolume] = useState<Volume | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    blogService.getVolume(slug)
      .then((response) => {
        if (active) setVolume(response.data);
      })
      .catch(() => {
        if (active) setError('That volume is not available.');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const chapters = (volume?.chapters || []) as BlogPost[];

  return (
    <Layout>
      <section className="container section first">
        <p><Link to="/blog">← Back To Words</Link></p>
        <h1 className="display section-title">
          {volume?.title || 'Volume'}
          {volume ? <span className="volume-mark">Volume</span> : null}
          {volume ? <WordCount count={volume.wordCount} /> : null}
        </h1>
        {volume?.description ? <p className="whitespace-pre-wrap">{volume.description}</p> : null}
        {error ? <p>{error}</p> : null}
        {!volume && !error ? <p className="mono-label">Loading</p> : null}
        <div className="rows">
          {chapters.map((chapter, index) => (
            <Link className="row" to={chapter.id == null ? '/blog' : `/blog/${chapter.id}`} key={chapter.id ?? chapter.title}>
              <span className="row-date">{String(index + 1).padStart(2, '0')}</span>
              {chapter.visibility === 'private' ? <span className="private-mark">Private</span> : null}
              <span className="row-title">{chapter.title}</span>
              <WordCount count={chapter.wordCount} />
              <span className="row-cta mono-label">Read →</span>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};
