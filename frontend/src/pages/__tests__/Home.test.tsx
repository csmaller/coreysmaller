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

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home', () => {
  beforeEach(() => {
    getRecentContent.mockReset();
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
    expect(screen.getByRole('link', { name: /listen now/i })).toHaveAttribute('href', '/audio');
    expect(screen.getByRole('link', { name: /^watch$/i })).toHaveAttribute('href', '/video');
    expect(screen.getByRole('link', { name: /^read$/i })).toHaveAttribute('href', '/blog');
    expect(document.querySelector('.strip')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Music' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Skiing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Writing' })).toBeInTheDocument();
    expect(screen.getByText(/Salt Lake City party band he has been in for more than fifteen years/)).toBeInTheDocument();
    expect(screen.getByText(/usually in front of the computer when he can find the time/)).toBeInTheDocument();
    expect(screen.getByText(/moved to Edwards, Colorado in 2026/)).toBeInTheDocument();
    expect(screen.getByText(/essays on this site are the outlet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    const mailLinks = screen.getAllByRole('link', { name: /coreysmaller@gmail.com/i });
    expect(mailLinks).toHaveLength(2);
    mailLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'mailto:coreysmaller@gmail.com');
    });
    expect(screen.queryByRole('link', { name: 'Music' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument();
    screen.getAllByRole('link', { name: 'Login' }).forEach((link) => {
      expect(link).toHaveAttribute('href', '/login');
    });
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
});
