import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminBlog } from '../AdminBlog';
import { blogService } from '../../services/blog';
import type { BlogPost } from '../../types';

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    user: { id: 1, email: 'corey@example.com', role: 'admin' },
    logout: jest.fn(),
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

jest.mock('../../components/blog/BlogEditor', () => ({
  BlogEditor: ({ post }: { post?: BlogPost }) => <div>Editing {post?.title}</div>,
}));

jest.mock('../../services/blog', () => ({
  blogService: {
    getAllPosts: jest.fn(),
    getPostById: jest.fn(),
    deletePost: jest.fn(),
    listVolumes: jest.fn().mockResolvedValue({ data: [], success: true }),
  },
}));

const mockBlogService = blogService as jest.Mocked<typeof blogService>;

const post: BlogPost = {
  id: 7,
  title: 'Night ski',
  content: '<p>Body</p>',
  status: 'published',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('AdminBlog edit route', () => {
  it('opens the editor for the post in the url', async () => {
    mockBlogService.getAllPosts.mockResolvedValue({
      data: [],
      success: true,
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
    mockBlogService.getPostById.mockResolvedValue({
      data: post,
      success: true,
    });

    render(
      <MemoryRouter initialEntries={['/admin/blog/7']}>
        <Routes>
          <Route path="/admin/blog/:id" element={<AdminBlog />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Editing Night ski')).toBeInTheDocument();
    expect(mockBlogService.getPostById).toHaveBeenCalledWith('7');
  });
});
