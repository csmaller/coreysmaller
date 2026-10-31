import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogPost } from '../BlogPost';
import type { BlogPost as BlogPostType } from '../../../types';

jest.mock('../../../utils/seo', () => ({
  generateDescription: () => 'A post',
  generateCanonicalUrl: (path: string) => `https://coreysmaller.com${path}`,
  generateBlogPostSchema: () => ({}),
  generateBreadcrumbSchema: () => ({}),
}));

jest.mock('../../SEO', () => ({
  SEO: () => null,
}));

let role = 'admin';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    user: { id: 1, email: 'corey@example.com', role },
    logout: jest.fn(),
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

const post: BlogPostType = {
  id: 7,
  title: 'Night ski',
  content: '<p>Body</p>',
  excerpt: 'Short',
  status: 'published',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  publishedAt: new Date('2024-01-01'),
  wordCount: 42,
};

describe('BlogPost edit', () => {
  beforeEach(() => {
    role = 'admin';
  });

  it('opens the admin editor for the published post', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/blog/7']}>
        <Routes>
          <Route path="/blog/:id" element={<BlogPost post={post} />} />
          <Route path="/admin/blog/:id" element={<div>Admin editor</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Admin editor')).toBeInTheDocument();
  });

  it('hides edit and delete from a guest', () => {
    role = 'guest';

    render(
      <MemoryRouter initialEntries={['/blog/7']}>
        <Routes>
          <Route path="/blog/:id" element={<BlogPost post={post} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByText('42 words')).not.toBeInTheDocument();
  });

  it('puts Previous on the left and Next on the right', () => {
    render(
      <MemoryRouter initialEntries={['/blog/7']}>
        <Routes>
          <Route path="/blog/:id" element={<BlogPost post={{
            ...post,
            previous: { title: 'Older', href: '/blog/6' },
            next: { title: 'Newer', href: '/blog/8' },
          }} />} />
        </Routes>
      </MemoryRouter>
    );

    const previous = screen.getByRole('link', { name: '← Previous' });
    const next = screen.getByRole('link', { name: 'Next →' });
    expect(previous).toHaveAttribute('href', '/blog/6');
    expect(previous).toHaveClass('post-turn-prev');
    expect(next).toHaveAttribute('href', '/blog/8');
    expect(next).toHaveClass('post-turn-next');
    expect(previous.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('42 words')).toBeInTheDocument();
  });

  it('scrolls to the top when opening the next post', async () => {
    const user = userEvent.setup();
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/blog/7']}>
        <Routes>
          <Route path="/blog/:id" element={<BlogPost post={{
            ...post,
            next: { title: 'Newer', href: '/blog/8' },
          }} />} />
        </Routes>
      </MemoryRouter>
    );

    scrollTo.mockClear();
    await user.click(screen.getByRole('link', { name: 'Next →' }));

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });
});
