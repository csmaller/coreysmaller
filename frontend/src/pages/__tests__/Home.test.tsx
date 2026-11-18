import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../Home';

jest.mock('../../utils/seo', () => ({
  generateTitle: (title?: string) => title || 'Corey Smaller',
  generateCanonicalUrl: () => 'https://coreysmaller.com',
  generateOpenGraphTags: () => [],
  generateTwitterTags: () => [],
  generateRobotsTag: () => 'index,follow',
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: false,
    user: null,
    logout: jest.fn(),
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

const getRecentContent = jest.fn();
const getEpk = jest.fn();
const getHome = jest.fn();

jest.mock('../../services/home', () => ({
  homeService: {
    get: (...args: unknown[]) => getHome(...args),
  },
  defaultHomeCopy: {
    about: 'Corey Smaller plays music, skis, and writes about both. He grew up in Massachusetts, lived in Utah from 2006, and moved to Edwards, Colorado in 2026.',
    writing: 'The essays on this site are the outlet. He writes them the same way he writes lyrics: to find out what he actually thinks. The subjects are the music, the mountains, and a life spent between the two.',
  },
  homeParagraphs: (value: string) => value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
}));

jest.mock('../../services/epk', () => ({
  epkService: {
    get: (...args: unknown[]) => getEpk(...args),
    songListUrl: () => 'http://localhost:3000/api/epk/song-list',
  },
  emptyEpk: () => ({
    bio: '',
    contact: { email: '', phone: '', location: '', note: '' },
    images: [],
    songs: [],
    videos: [],
    audio: [],
  }),
}));

jest.mock('../../services/contentAggregation', () => ({
  contentAggregationService: {
    getRecentContent: (...args: unknown[]) => getRecentContent(...args),
  },
}));

const sample = {
  recentPosts: [
    {
      id: 7,
      title: 'Reflections at 50',
      content: 'A post',
      status: 'published',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
      publishedAt: new Date('2024-03-02'),
    },
  ],
  featuredMusic: [
    {
      id: 3,
      title: 'Lovers Eye',
      playCount: 0,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      releaseDate: new Date('2023-06-01'),
      coverArt: 'https://example.com/cover.jpg',
    },
  ],
  latestVideos: [
    {
      id: 4,
      title: 'Icefall',
      description: 'A climb',
      youtubeUrl: 'https://youtube.com/watch?v=abc',
      viewCount: 1,
      createdAt: new Date('2022-11-05'),
      updatedAt: new Date('2022-11-05'),
    },
  ],
  latestAudio: [],
};

function renderHome(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  beforeEach(() => {
    getRecentContent.mockReset();
    getEpk.mockReset();
    getHome.mockReset();
    getHome.mockResolvedValue({
      about: 'Corey Smaller plays music, skis, and writes about both. He grew up in Massachusetts, lived in Utah from 2006, and moved to Edwards, Colorado in 2026.',
      writing: 'The essays on this site are the outlet. He writes them the same way he writes lyrics: to find out what he actually thinks. The subjects are the music, the mountains, and a life spent between the two.',
    });
    getEpk.mockResolvedValue({
      bio: 'A short bio.',
      contact: { email: 'press@example.com', phone: '', location: 'Edwards, Colorado', note: '' },
      images: [],
      songs: [{ id: 'song-1', title: 'Field Recording' }],
      videos: [],
      audio: [],
    });
  });

  it('renders the poster hero, marquee, about, and footer from the redesign', async () => {
    getRecentContent.mockResolvedValue({
      recentPosts: [],
      featuredMusic: [],
      latestVideos: [],
      latestAudio: [],
    });

    renderHome();

    expect(screen.getByRole('heading', { level: 1, name: /corey smaller/i })).toBeInTheDocument();
    expect(document.querySelector('.hero-eyebrow')).not.toHaveTextContent('Salt Lake City');
    expect(screen.getByRole('link', { name: /^listen$/i })).toHaveAttribute('href', '/audio');
    const heroEpk = document.querySelector('.btn-row a[href="#epk"]');
    expect(heroEpk).toHaveTextContent('EPK');
    expect(heroEpk).toHaveClass('btn-primary');
    expect(heroEpk?.nextElementSibling).toHaveTextContent('Listen');
    expect(screen.getByRole('link', { name: /^watch$/i })).toHaveAttribute('href', '/video');
    expect(screen.getByRole('link', { name: /^read$/i })).toHaveAttribute('href', '/blog');
    expect(document.querySelector('.strip')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Music' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Skiing' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Writing' })).toBeInTheDocument();
    expect(screen.getByText(/moved to Edwards, Colorado in 2026/)).toBeInTheDocument();
    expect(screen.getByText(/essays on this site are the outlet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    const mailLink = screen.getByRole('link', { name: /coreysmaller@gmail.com/i });
    expect(mailLink).toHaveAttribute('href', 'mailto:coreysmaller@gmail.com');
    expect(mailLink.closest('footer')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Music' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Send a note' })).toHaveAttribute('href', '/contact');
    const loginLink = screen.getByRole('link', { name: 'Login' });
    expect(loginLink).toHaveAttribute('href', '/login#login');
    expect(loginLink.closest('footer')).not.toBeNull();
    expect(loginLink.compareDocumentPosition(screen.getByText(/© Corey Smaller/)) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(0);
    expect(screen.queryByText(/\[/)).not.toBeInTheDocument();

    expect(await screen.findByText('No audio yet.')).toBeInTheDocument();
    expect(screen.getByText('No video yet.')).toBeInTheDocument();
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });

  it('renders releases, videos, and posts from the api', async () => {
    getRecentContent.mockResolvedValue(sample);
    renderHome();

    expect(await screen.findByText('Lovers Eye')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(document.querySelector('.release-art img')).toHaveAttribute('src', 'https://example.com/cover.jpg');
    expect(screen.getByText('Icefall')).toBeInTheDocument();
    expect(screen.getByText('A climb')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reflections at 50/i })).toHaveAttribute('href', '/blog/7');
    expect(screen.queryByText('No audio yet.')).not.toBeInTheDocument();
  });

  it('scrolls to the press kit when the page is opened at #epk', async () => {
    const scroll = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scroll;
    getRecentContent.mockResolvedValue({
      recentPosts: [],
      featuredMusic: [],
      latestVideos: [],
      latestAudio: [],
    });

    renderHome('/#epk');

    expect(await screen.findByRole('heading', { name: 'Electronic Press Kit' })).toBeInTheDocument();
    expect(await screen.findByText('A short bio.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download song list' })).toHaveAttribute('href', 'http://localhost:3000/api/epk/song-list');
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('shows the saved about and writing blurbs', async () => {
    getHome.mockResolvedValue({
      about: 'First about paragraph.\n\nSecond about paragraph.',
      writing: 'A new writing blurb.',
    });
    getRecentContent.mockResolvedValue({
      recentPosts: [],
      featuredMusic: [],
      latestVideos: [],
      latestAudio: [],
    });

    renderHome();

    expect(await screen.findByText('First about paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second about paragraph.')).toBeInTheDocument();
    expect(screen.getByText('A new writing blurb.')).toBeInTheDocument();
  });
});
