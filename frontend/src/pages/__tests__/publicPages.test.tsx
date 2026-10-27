import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Blog } from '../Blog';
import { Music } from '../Music';
import { Video } from '../Video';
import { Audio } from '../Audio';
import { NotFound } from '../NotFound';
import { Login } from '../Login';

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

jest.mock('../../services/blog', () => ({
  blogService: {
    getAllPosts: jest.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      success: true,
    }),
  },
}));

jest.mock('../../services/music', () => ({
  musicService: {
    getAllTracks: jest.fn().mockResolvedValue({ data: [], success: true }),
    incrementPlayCount: jest.fn(),
  },
}));

jest.mock('../../services/video', () => ({
  videoService: {
    getAllVideos: jest.fn().mockResolvedValue({ data: [], success: true }),
  },
}));

jest.mock('../../services/audio', () => ({
  audioService: {
    getAllAudio: jest.fn().mockResolvedValue({ data: [], success: true }),
  },
}));

function renderPage(element: ReactElement) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('public pages use the poster shell', () => {
  it('renders the blog index', async () => {
    renderPage(<Blog />);
    expect(screen.getByRole('heading', { name: 'Words' })).toBeInTheDocument();
    expect(await screen.findByText(/no blog posts found/i)).toBeInTheDocument();
    screen.getAllByRole('link', { name: 'Login' }).forEach((link) => {
      expect(link).toHaveAttribute('href', '/login');
    });
  });

  it('renders the music index', async () => {
    renderPage(<Music />);
    expect(screen.getByRole('heading', { name: 'Music' })).toBeInTheDocument();
    expect(screen.getByText('Original compositions.')).toBeInTheDocument();
  });

  it('renders the video index', () => {
    renderPage(<Video />);
    expect(screen.getByRole('heading', { name: 'Sights' })).toBeInTheDocument();
    expect(screen.getByText('Videos and other moving work.')).toBeInTheDocument();
  });

  it('renders the audio index', () => {
    renderPage(<Audio />);
    expect(screen.getByRole('heading', { name: 'Sounds' })).toBeInTheDocument();
    expect(screen.getByText('SoundCloud tracks and playlists.')).toBeInTheDocument();
  });

  it('renders a 404 without the old illustration', () => {
    renderPage(<NotFound />);
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
    expect(screen.queryByText('🎵')).not.toBeInTheDocument();
  });

  it('renders the admin login form', () => {
    renderPage(<Login />);
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
