import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ElectronicPressKit } from '../components/epk/ElectronicPressKit';
import { SEO } from '../components/SEO';
import { contentAggregationService } from '../services/contentAggregation';
import type { RecentContent } from '../services/contentAggregation';
import { blogEntryHref } from '../utils/blogHref';
import { WordCount } from '../components/blog/WordCount';
import { defaultHomeCopy, homeParagraphs, homeService, type HomeCopy } from '../services/home';

const emptyContent: RecentContent = {
  recentPosts: [],
  featuredMusic: [],
  latestVideos: [],
  latestAudio: [],
};

function yearOf(value?: Date | string) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return String(date.getFullYear());
}

function labelDate(value?: Date | string) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const Home: React.FC = () => {
  const location = useLocation();
  const [content, setContent] = useState<RecentContent>(emptyContent);
  const [loading, setLoading] = useState(true);
  const [copy, setCopy] = useState<HomeCopy>(defaultHomeCopy);

  useEffect(() => {
    if (location.hash !== '#epk') return;
    const node = document.getElementById('epk');
    if (!node || typeof node.scrollIntoView !== 'function') return;
    const reduce = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [location.hash]);

  useEffect(() => {
    let active = true;
    homeService.get()
      .then((next) => {
        if (active) setCopy(next);
      })
      .catch(() => {
        if (active) setCopy(defaultHomeCopy);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const recentContent = await contentAggregationService.getRecentContent(3);
        if (active) setContent(recentContent);
      } catch (error) {
        console.error('Error loading home page content:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const releases = [
    ...content.featuredMusic.map((track) => ({
      id: `music-${track.id}`,
      title: track.title,
      year: yearOf(track.releaseDate || track.createdAt),
      image: track.coverArt,
      href: '/audio',
    })),
    ...content.latestAudio.map((item) => ({
      id: `audio-${item.id}`,
      title: item.title,
      year: yearOf(item.createdAt),
      image: item.artwork,
      href: '/audio',
    })),
  ];

  return (
    <>
      <SEO
        title="Corey Smaller - Personal Website, Blog, Music & Creative Content"
        description="Corey Smaller is a musician, skier, and writer in Edwards, Colorado. Blog posts, original music, and video."
        keywords={['Corey Smaller', 'musician', 'skier', 'writer', 'Edwards', 'Colorado', 'blog', 'music', 'video']}
        url="https://coreysmaller.com"
        type="website"
      />
      <Layout>
        <section className="container hero" id="top">
          <div className="hero-eyebrow mono-label">
            <span>Musician</span>
            <span className="accent">/</span>
            <span>Writer</span>
          </div>
          <h1 className="display hero-title">
            Corey
            <br />
            Smaller<span className="accent">.</span>
          </h1>
          <div className="hero-foot">
            <p className="hero-tagline">Blog posts, original music, and video.</p>
            <div className="btn-row">
              <a className="btn btn-primary" href="#epk">EPK</a>
              <Link className="btn btn-ghost" to="/audio">Listen</Link>
              <Link className="btn btn-ghost" to="/video">Watch</Link>
              <Link className="btn btn-ghost" to="/blog">Read</Link>
            </div>
          </div>
        </section>

        <div className="strip" aria-hidden="true">
          <div className="strip-track">
            <span>Loud &nbsp;/&nbsp; Live &nbsp;/&nbsp; Unpolished &nbsp;/&nbsp; Honest &nbsp;/&nbsp;</span>
            <span>Loud &nbsp;/&nbsp; Live &nbsp;/&nbsp; Unpolished &nbsp;/&nbsp; Honest &nbsp;/&nbsp;</span>
          </div>
        </div>

        <section className="container section first" id="audio" aria-busy={loading}>
          <div className="section-head">
            <h2 className="display section-title">Sounds</h2>
            <span className="mono-label section-index">01 / <Link to="/audio">All audio &rarr;</Link></span>
          </div>
          {loading ? <p className="mono-label">Loading</p> : null}
          {!loading && releases.length === 0 ? <p>No audio yet.</p> : null}
          <div className="grid">
            {releases.map((release, index) => (
              <Link className="release" to={release.href} key={release.id}>
                <div className="release-art" aria-hidden="true">
                  {release.image ? <img src={release.image} alt="" /> : String(index + 1).padStart(2, '0')}
                </div>
                <div className="release-meta">
                  <span className="release-title">{release.title}</span>
                  <span className="release-year">{release.year}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="container section" id="video">
          <div className="section-head">
            <h2 className="display section-title">Sights</h2>
            <span className="mono-label section-index">02 / <Link to="/video">All video &rarr;</Link></span>
          </div>
          {!loading && content.latestVideos.length === 0 ? <p>No video yet.</p> : null}
          <div className="rows">
            {content.latestVideos.map((video) => (
              <Link className="row" to="/video" key={video.id}>
                <span className="row-date">{labelDate(video.createdAt)}</span>
                <span className="row-title">{video.title}</span>
                <span className="row-desc">{video.description || 'Video'}</span>
                <span className="row-cta mono-label">Watch &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container section" id="blog">
          <div className="section-head">
            <h2 className="display section-title">Words</h2>
            <span className="mono-label section-index">03 / <Link to="/blog">All posts &rarr;</Link></span>
          </div>
          {!loading && content.recentPosts.length === 0 ? <p>No posts yet.</p> : null}
          <div className="grid">
            {content.recentPosts.map((post) => (
              <Link
                className="post"
                to={blogEntryHref(post)}
                key={post.type === 'volume' ? `volume-${post.slug || post.volumeSlug}` : post.id}
              >
                <span className="post-date mono-label">{labelDate(post.publishedAt || post.createdAt)}</span>
                {post.visibility === 'private' ? <span className="private-mark">Private</span> : null}
                <span className="post-title">
                  {post.title}
                  {post.type === 'volume' ? <span className="volume-mark">Volume</span> : null}
                </span>
                <WordCount count={post.wordCount} />
                <span className="mono-label">Read &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container section about" id="about">
          <h2 className="display section-title">
            About<span className="accent">.</span>
          </h2>
          <div className="about-copy">
            {homeParagraphs(copy.about).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="container section" aria-labelledby="about-writing">
          <div className="section-head">
            <h2 id="about-writing" className="display section-title">Writing</h2>
            <span className="mono-label section-index">04 / <Link to="/blog">Read &rarr;</Link></span>
          </div>
          <div className="about-copy">
            {homeParagraphs(copy.writing).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <ElectronicPressKit />
      </Layout>
    </>
  );
};
