import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminHome } from '../AdminHome';

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

const getHome = jest.fn();
const saveHome = jest.fn();

jest.mock('../../services/home', () => ({
  homeService: {
    get: (...args: unknown[]) => getHome(...args),
    save: (...args: unknown[]) => saveHome(...args),
  },
  defaultHomeCopy: {
    about: 'About default',
    writing: 'Writing default',
  },
}));

describe('AdminHome', () => {
  beforeEach(() => {
    getHome.mockReset();
    saveHome.mockReset();
    getHome.mockResolvedValue({
      about: 'The about blurb.',
      writing: 'The writing blurb.',
    });
  });

  it('loads the about and writing blurbs and saves edits', async () => {
    const user = userEvent.setup();
    saveHome.mockResolvedValue({
      about: 'The about blurb.',
      writing: 'A revised writing blurb.',
    });

    render(
      <MemoryRouter>
        <AdminHome />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText('Writing')).toHaveValue('The writing blurb.');
    expect(screen.getByLabelText('About')).toHaveValue('The about blurb.');

    await user.clear(screen.getByLabelText('Writing'));
    await user.type(screen.getByLabelText('Writing'), 'A revised writing blurb.');
    await user.click(screen.getByRole('button', { name: 'Save home page' }));

    expect(saveHome).toHaveBeenCalledWith({
      about: 'The about blurb.',
      writing: 'A revised writing blurb.',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Home page saved.');
  });
});
