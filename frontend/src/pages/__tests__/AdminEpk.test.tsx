import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminEpk } from '../AdminEpk';

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

const getEpk = jest.fn();
const saveSongs = jest.fn();

jest.mock('../../services/epk', () => ({
  epkService: {
    get: (...args: unknown[]) => getEpk(...args),
    saveProfile: jest.fn(),
    saveSongs: (...args: unknown[]) => saveSongs(...args),
    uploadImages: jest.fn(),
    makeMain: jest.fn(),
    deleteImage: jest.fn(),
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

describe('AdminEpk', () => {
  beforeEach(() => {
    getEpk.mockReset();
    saveSongs.mockReset();
    getEpk.mockResolvedValue({
      bio: 'Press bio',
      contact: { email: 'press@example.com', phone: '555-0100', location: 'Edwards', note: 'Bookings' },
      images: [{ id: 'img-1', url: 'https://example.com/me.jpg', alt: 'Corey Smaller', isMain: true }],
      songs: [
        { id: 'song-1', title: 'Lovers Eye', artist: 'Corey Smaller' },
        { id: 'song-2', title: 'Wagon Wheel', artist: 'Old Crow Medicine Show' },
      ],
      videos: [],
      audio: [],
    });
  });

  it('loads the editable bio, photos, song list, and contact fields', async () => {
    render(
      <MemoryRouter>
        <AdminEpk />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Press bio')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('press@example.com');
    expect(screen.getByLabelText('Phone')).toHaveValue('555-0100');
    expect(screen.getByLabelText('Location')).toHaveValue('Edwards');
    expect(screen.getByLabelText('Upload photos')).toBeInTheDocument();
    expect(screen.getByText('Add another photo')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Corey Smaller' })).toHaveAttribute('src', 'https://example.com/me.jpg');
    expect(screen.getByDisplayValue('Lovers Eye')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save song list' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Lovers Eye' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeDisabled();
  });

  it('deletes the checked songs', async () => {
    const user = userEvent.setup();
    saveSongs.mockResolvedValue({
      bio: 'Press bio',
      contact: { email: 'press@example.com', phone: '555-0100', location: 'Edwards', note: 'Bookings' },
      images: [],
      songs: [{ id: 'song-2', title: 'Wagon Wheel', artist: 'Old Crow Medicine Show' }],
      videos: [],
      audio: [],
    });

    render(
      <MemoryRouter>
        <AdminEpk />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('checkbox', { name: 'Select Lovers Eye' }));
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    expect(saveSongs).toHaveBeenCalledWith([
      { title: 'Wagon Wheel', artist: 'Old Crow Medicine Show' },
    ]);
    expect(await screen.findByRole('status')).toHaveTextContent('Selected songs deleted.');
    expect(screen.queryByDisplayValue('Lovers Eye')).not.toBeInTheDocument();
  });
});
