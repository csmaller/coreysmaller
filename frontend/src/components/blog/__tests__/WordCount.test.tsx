import { render, screen } from '@testing-library/react';
import { WordCount, formatWordCount } from '../WordCount';

let role: string | null = 'admin';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: role ? { id: 1, email: 'corey@example.com', role } : null,
  }),
}));

describe('WordCount', () => {
  beforeEach(() => {
    role = 'admin';
  });

  it('formats singular and grouped counts', () => {
    expect(formatWordCount(1)).toBe('1 word');
    expect(formatWordCount(1200)).toBe('1,200 words');
  });

  it('shows the count to an admin', () => {
    render(<WordCount count={1200} />);
    expect(screen.getByText('1,200 words')).toBeInTheDocument();
  });

  it('hides the count from other readers and when it is missing', () => {
    role = 'guest';
    const { rerender } = render(<WordCount count={12} />);
    expect(screen.queryByText(/words/)).not.toBeInTheDocument();

    role = 'admin';
    rerender(<WordCount count={null} />);
    expect(screen.queryByText(/word/)).not.toBeInTheDocument();

    rerender(<WordCount />);
    expect(screen.queryByText(/word/)).not.toBeInTheDocument();
  });
});
