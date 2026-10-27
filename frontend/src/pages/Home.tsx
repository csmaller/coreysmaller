import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SEO } from '../components/SEO';
import { contentAggregationService } from '../services/contentAggregation';
import type { RecentContent } from '../services/contentAggregation';

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
  const [content, setContent] = useState<RecentContent>(emptyContent);
  const [loading, setLoading] = useState(true);

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
              <Link className="btn btn-primary" to="/audio">Listen now</Link>
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
            <h2 className="display section-title">Video</h2>
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
              <Link className="post" to={`/blog/${post.id}`} key={post.id}>
                <span className="post-date mono-label">{labelDate(post.publishedAt || post.createdAt)}</span>
                {post.visibility === 'private' ? <span className="private-mark">Private</span> : null}
                <span className="post-title">{post.title}</span>
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
            <p>
              Corey Smaller plays music, skis, and writes about both. He grew up in Massachusetts, lived in Utah from 2006, and moved to Edwards, Colorado in 2026.
            </p>
          </div>
        </section>

        <section className="container section" aria-labelledby="about-music">
          <div className="section-head">
            <h2 id="about-music" className="display section-title">Music</h2>
            <span className="mono-label section-index">04 / <Link to="/audio">Listen &rarr;</Link></span>
          </div>
          <div className="about-copy">
            <p>
              He has been playing out for more than twenty-five years. It started on drums in his parents&apos; basement, along to Kiss records. He plays guitar and sings now: on solo acoustic nights and with Rage Against the Supremes, the Salt Lake City party band he has been in for more than fifteen years.
            </p>
            <p>
              The band keeps three rules: the song has to be rowdy, danceable, or a sing-along. The songs he writes for himself happen at home, usually in front of the computer when he can find the time.
            </p>
          </div>
        </section>

        <section className="container section" aria-labelledby="about-skiing">
          <div className="section-head">
            <h2 id="about-skiing" className="display section-title">Skiing</h2>
            <span className="mono-label section-index">05</span>
          </div>
          <div className="about-copy">
            <p>
              The ski life started in the East, including a house at Loon. After a few trips west he moved to Utah in 2006 and lived in Park City. In 2026 he moved to Edwards, Colorado. He skis the Wasatch, and when the resorts stack up he goes into the backcountry.
            </p>
            <p>
              Winters have also meant Canada, Big Sky, Jackson Hole, and a week of glacier skiing out of Revelstoke at the Icefall.
            </p>
          </div>
        </section>

        <section className="container section" aria-labelledby="about-writing">
          <div className="section-head">
            <h2 id="about-writing" className="display section-title">Writing</h2>
            <span className="mono-label section-index">06 / <Link to="/blog">Read &rarr;</Link></span>
          </div>
          <div className="about-copy">
            <p>
              The essays on this site are the outlet. He writes them the same way he writes lyrics: to find out what he actually thinks. The subjects are the music, the mountains, and a life spent between the two.
            </p>
          </div>
        </section>
      </Layout>
    </>
  );
};
