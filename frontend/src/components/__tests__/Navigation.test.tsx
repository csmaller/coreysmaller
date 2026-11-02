import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';

const logout = jest.fn();
let authenticated = false;

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    isAuthenticated: authenticated,
    user: authenticated ? { id: 1, email: 'corey@example.com', role: 'admin' } : null,
    logout,
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

function renderNav(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navigation />
    </MemoryRouter>
  );
}

describe('Navigation', () => {
  beforeEach(() => {
    authenticated = false;
    logout.mockReset();
  });

  it('renders the poster logo and public sections', () => {
    renderNav();

    expect(screen.getByRole('link', { name: /c\. smaller/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Sounds' })).toHaveAttribute('href', '/audio');
    expect(screen.queryByRole('link', { name: 'Music' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sights' })).toHaveAttribute('href', '/video');
    expect(screen.getByRole('link', { name: 'Words' })).toHaveAttribute('href', '/blog');
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'coreysmaller@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:coreysmaller@gmail.com'
    );
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('marks the current section', () => {
    renderNav('/blog');
    expect(screen.getByRole('link', { name: 'Words' })).toHaveClass('is-active');
  });

  it('shows the dashboard and logout for a signed-in admin', async () => {
    authenticated = true;
    const user = userEvent.setup();
    renderNav();

    expect(screen.getByTestId('dashboard-link')).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(logout).toHaveBeenCalled();
  });
});
