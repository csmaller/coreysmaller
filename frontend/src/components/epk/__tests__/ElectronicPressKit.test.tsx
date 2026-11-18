import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElectronicPressKit } from '../ElectronicPressKit';

let role: string | null = null;

jest.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    user: role ? { id: 1, email: 'corey@example.com', role } : null,
    isAuthenticated: Boolean(role),
    logout: jest.fn(),
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }),
}));

const getEpk = jest.fn();
const saveSongs = jest.fn();

jest.mock('../../../services/epk', () => ({
  epkService: {
    get: (...args: unknown[]) => getEpk(...args),
    songListUrl: () => 'http://localhost:3000/api/epk/song-list',
    saveSongs: (...args: unknown[]) => saveSongs(...args),
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

const kit = {
  bio: '',
  contact: { email: '', phone: '', location: '', note: '' },
  images: [],
  songs: [
    { id: 'song-1', title: '420 Blues', artist: 'Jeffrey Foucault' },
    { id: 'song-2', title: 'Wagon Wheel', artist: 'Old Crow Medicine Show' },
  ],
  videos: [],
  audio: [],
};

describe('ElectronicPressKit songs', () => {
  beforeEach(() => {
    role = null;
    getEpk.mockReset();
    saveSongs.mockReset();
    getEpk.mockResolvedValue(kit);
  });

  it('leaves the song list as text for visitors', async () => {
    render(<ElectronicPressKit />);

    expect(await screen.findByText('420 Blues — Jeffrey Foucault')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '420 Blues — Jeffrey Foucault' })).not.toBeInTheDocument();
  });

  it('lets an admin open a song and save the edit', async () => {
    role = 'admin';
    const user = userEvent.setup();
    saveSongs.mockResolvedValue({
      ...kit,
      songs: [
        { id: 'song-1', title: 'Althea', artist: 'Grateful Dead' },
        kit.songs[1],
      ],
    });

    render(<ElectronicPressKit />);

    await user.click(await screen.findByRole('button', { name: '420 Blues — Jeffrey Foucault' }));
    const title = screen.getByRole('textbox', { name: 'Song title' });
    await user.clear(title);
    await user.type(title, 'Althea');
    const artist = screen.getByRole('textbox', { name: 'Artist' });
    await user.clear(artist);
    await user.type(artist, 'Grateful Dead');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveSongs).toHaveBeenCalledWith([
      { title: 'Althea', artist: 'Grateful Dead' },
      { title: 'Wagon Wheel', artist: 'Old Crow Medicine Show' },
    ]);
    expect(await screen.findByRole('status')).toHaveTextContent('Song saved.');
    expect(screen.getByRole('button', { name: 'Althea — Grateful Dead' })).toBeInTheDocument();
  });
});
