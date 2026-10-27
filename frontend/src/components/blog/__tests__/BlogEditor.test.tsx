import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogEditor } from '../BlogEditor';
import { blogService } from '../../../services/blog';
import type { BlogPost } from '../../../types';

jest.mock('../RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Content"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

jest.mock('../../../services/blog', () => ({
  blogService: {
    createPost: jest.fn(),
    updatePost: jest.fn(),
  },
}));

const mockBlogService = blogService as jest.Mocked<typeof blogService>;

const existingPost: BlogPost = {
  id: 4,
  title: 'Old title',
  content: 'Old body',
  excerpt: 'Short',
  status: 'published',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('BlogEditor', () => {
  beforeEach(() => {
    mockBlogService.createPost.mockReset();
    mockBlogService.updatePost.mockReset();
  });

  it('builds the excerpt from the start of the post and hides the excerpt field', async () => {
    const user = userEvent.setup();
    mockBlogService.createPost.mockResolvedValue({
      data: { ...existingPost, id: 8, status: 'draft' },
      success: true,
    });
    const words = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');

    render(<BlogEditor />);

    expect(screen.queryByLabelText(/excerpt/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'A title' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: `<p>${words}</p>` } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const saved = mockBlogService.createPost.mock.calls[0][0];
    expect(saved.excerpt!.length).toBeLessThanOrEqual(250);
    expect(saved.excerpt!.endsWith('...')).toBe(true);
    expect(saved.excerpt!.startsWith('word0')).toBe(true);
  });

  it('saves the status selected in the dropdown', async () => {
    const user = userEvent.setup();
    mockBlogService.updatePost.mockResolvedValue({
      data: { ...existingPost, status: 'draft' },
      success: true,
    });

    render(<BlogEditor post={existingPost} />);

    await user.selectOptions(screen.getByLabelText('Status'), 'draft');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockBlogService.updatePost).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ status: 'draft' })
    );
  });

  it('saves a private post for logged-in readers', async () => {
    const user = userEvent.setup();
    mockBlogService.createPost.mockResolvedValue({
      data: { ...existingPost, id: 9, visibility: 'private' },
      success: true,
    });

    render(<BlogEditor />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Members only' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '<p>Hidden from the public site</p>' } });
    await user.selectOptions(screen.getByLabelText('Visibility'), 'private');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockBlogService.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'private', title: 'Members only' })
    );
  });
});
