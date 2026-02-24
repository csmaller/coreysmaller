import { render, screen, waitFor } from '@testing-library/react';
import { MusicList } from '../MusicList';
import { musicService } from '../../../services/music';
import type { MusicTrack } from '../../../types';

// Mock the music service
jest.mock('../../../services/music');
const mockMusicService = musicService as jest.Mocked<typeof musicService>;

// Mock the MusicPlayer component to avoid audio-related issues in tests
jest.mock('../MusicPlayer', () => ({
  MusicPlayer: ({ track, onClose }: { track: any; onClose: () => void }) => (
    <div data-testid="music-player">
      <span>Playing: {track.title}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const mockTracks: MusicTrack[] = [
  {
    id: 1,
    title: 'Test Song 1',
    description: 'A test song',
    audioUrl: 'https://example.com/song1.mp3',
    coverArt: 'https://example.com/cover1.jpg',
    genre: 'rock',
    duration: 180,
    playCount: 5,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    releaseDate: new Date('2023-01-01'),
  },
  {
    id: 2,
    title: 'Test Song 2',
    description: 'Another test song',
    audioUrl: 'https://example.com/song2.mp3',
    genre: 'pop',
    duration: 210,
    playCount: 10,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
  },
];

describe('MusicList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockMusicService.getAllTracks.mockImplementation(() => new Promise(() => {}));
    
    render(<MusicList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders tracks when loaded', async () => {
    mockMusicService.getAllTracks.mockResolvedValue({
      data: mockTracks,
      success: true
    });
    
    render(<MusicList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.getByText('Test Song 2')).toBeInTheDocument();
    });
  });

  it('renders tracks when provided as props', () => {
    render(<MusicList tracks={mockTracks} />);
    
    expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    expect(screen.getByText('Test Song 2')).toBeInTheDocument();
  });

  it('displays genre filters', async () => {
    mockMusicService.getAllTracks.mockResolvedValue({
      data: mockTracks,
      success: true
    });
    
    render(<MusicList />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Genre')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Genres')).toBeInTheDocument();
    });
  });

  it('displays sort options', async () => {
    mockMusicService.getAllTracks.mockResolvedValue({
      data: mockTracks,
      success: true
    });
    
    render(<MusicList />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
    });
  });

  it('shows track count', async () => {
    mockMusicService.getAllTracks.mockResolvedValue({
      data: mockTracks,
      success: true
    });
    
    render(<MusicList />);
    
    await waitFor(() => {
      expect(screen.getByText('2 tracks')).toBeInTheDocument();
    });
  });

  it('handles empty track list', async () => {
    mockMusicService.getAllTracks.mockResolvedValue({
      data: [],
      success: true
    });
    
    render(<MusicList />);
    
    await waitFor(() => {
      expect(screen.getByText('No tracks found.')).toBeInTheDocument();
    });
  });

  it('handles loading error', async () => {
    mockMusicService.getAllTracks.mockRejectedValue(new Error('Failed to load'));
    
    render(<MusicList />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load music tracks')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('hides filters when showFilters is false', () => {
    render(<MusicList tracks={mockTracks} showFilters={false} />);
    
    expect(screen.queryByLabelText('Genre')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Sort By')).not.toBeInTheDocument();
  });
});