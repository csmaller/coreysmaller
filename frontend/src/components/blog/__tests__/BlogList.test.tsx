import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlogList } from '../BlogList';
import type { BlogPost, PaginatedResponse } from '../../../types';

let viewerRole: string | null = null;

jest.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: viewerRole != null,
    user: viewerRole ? { id: 1, email: 'a@example.com', role: viewerRole } : null,
    logout: jest.fn(),
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

// Mock the entire blog service module
jest.mock('../../../services/blog', () => ({
  blogService: {
    getAllPosts: jest.fn(),
    getPostById: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    migrateMarkdownFiles: jest.fn(),
  }
}));

// Import the mocked service
import { blogService } from '../../../services/blog';
const mockBlogService = blogService as jest.Mocked<typeof blogService>;

// Mock data
const mockPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Test Post 1',
    content: 'This is test content for post 1',
    excerpt: 'Test excerpt 1',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    publishedAt: new Date('2024-01-01'),
    tags: ['test', 'blog']
  },
  {
    id: 2,
    title: 'Test Post 2',
    content: 'This is test content for post 2',
    status: 'draft',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    tags: ['draft']
  }
];

const mockResponse: PaginatedResponse<BlogPost> = {
  data: mockPosts,
  success: true,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1
  }
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('BlogList', () => {
  beforeEach(() => {
    viewerRole = null;
    jest.clearAllMocks();
  });

  it('renders blog posts successfully', async () => {
    mockBlogService.getAllPosts.mockResolvedValue(mockResponse);

    renderWithRouter(<BlogList />);

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });

    // Check that the service was called
    expect(mockBlogService.getAllPosts).toHaveBeenCalledWith(1, 10, false);
  });

  it('shows loading state initially', () => {
    mockBlogService.getAllPosts.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<BlogList />);

    // Should show loading skeletons
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state when loading fails', async () => {
    mockBlogService.getAllPosts.mockRejectedValue(new Error('Failed to load'));

    renderWithRouter(<BlogList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load blog posts. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no posts exist', async () => {
    const emptyResponse: PaginatedResponse<BlogPost> = {
      ...mockResponse,
      data: [],
      pagination: { ...mockResponse.pagination, total: 0 }
    };
    mockBlogService.getAllPosts.mockResolvedValue(emptyResponse);

    renderWithRouter(<BlogList />);

    await waitFor(() => {
      expect(screen.getByText('No blog posts found')).toBeInTheDocument();
    });
  });

  it('renders admin actions when showAdminActions is true', async () => {
    mockBlogService.getAllPosts.mockResolvedValue(mockResponse);

    renderWithRouter(<BlogList showAdminActions={true} />);

    await waitFor(() => {
      expect(screen.getAllByText('Edit')).toHaveLength(2);
      expect(screen.getAllByText('Delete')).toHaveLength(2);
    });
  });

  it('displays post status badges correctly', async () => {
    mockBlogService.getAllPosts.mockResolvedValue(mockResponse);

    renderWithRouter(<BlogList />);

    await waitFor(() => {
      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  it('shows page controls at the top and the bottom', async () => {
    mockBlogService.getAllPosts.mockResolvedValue({
      ...mockResponse,
      pagination: { ...mockResponse.pagination, total: 20, totalPages: 2 },
    });

    renderWithRouter(<BlogList />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Next' })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: 'Previous' })).toHaveLength(2);
    });
  });

  it('lists a volume as one title', async () => {
    mockBlogService.getAllPosts.mockResolvedValue({
      ...mockResponse,
      data: [{
        id: 9,
        type: 'volume',
        title: 'Relationships',
        content: '',
        slug: 'relationships',
        chapterCount: 2,
        status: 'published',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        publishedAt: new Date('2024-02-01'),
      }],
    });

    renderWithRouter(<BlogList />);

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: 'Relationships' })[0]).toHaveAttribute(
        'href',
        '/blog/volume/relationships'
      );
    });
    expect(screen.getByText('2 chapters')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('shows character counts to admins and hides them from guests', async () => {
    mockBlogService.getAllPosts.mockResolvedValue({
      ...mockResponse,
      data: [{
        ...mockPosts[0],
        wordCount: 1280,
      }],
    });

    viewerRole = 'guest';
    const { unmount } = renderWithRouter(<BlogList />);
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });
    expect(screen.queryByText('1,280 words')).not.toBeInTheDocument();
    unmount();

    viewerRole = 'admin';
    renderWithRouter(<BlogList />);
    expect(await screen.findByText('1,280 words')).toBeInTheDocument();
  });

  it('displays post tags', async () => {
    mockBlogService.getAllPosts.mockResolvedValue(mockResponse);

    renderWithRouter(<BlogList />);

    await waitFor(() => {
      expect(screen.getByText('#test')).toBeInTheDocument();
      expect(screen.getByText('#blog')).toBeInTheDocument();
      expect(screen.getByText('#draft')).toBeInTheDocument();
    });
  });
});