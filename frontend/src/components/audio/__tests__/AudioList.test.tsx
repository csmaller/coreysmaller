import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioList } from '../AudioList';
import type { AudioContent } from '../../../types';

// Mock the entire services module
jest.mock('../../../services/audio', () => ({
  audioService: {
    getAllAudio: jest.fn(),
    incrementPlayCount: jest.fn(),
  }
}));

// Mock the AudioPlayer component
jest.mock('../AudioPlayer', () => ({
  AudioPlayer: ({ audio, onClose }: { audio: AudioContent; onClose: () => void }) => (
    <div data-testid="audio-player">
      <span>Playing: {audio.title}</span>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

// Import the mocked service after mocking
import { audioService } from '../../../services/audio';
const mockedAudioService = audioService as jest.Mocked<typeof audioService>;

const mockAudioContent: AudioContent[] = [
  {
    id: 1,
    title: 'Test Track 1',
    description: 'A test track',
    soundcloudUrl: 'https://soundcloud.com/test/track1',
    soundcloudId: 'track1',
    artwork: 'https://example.com/artwork1.jpg',
    duration: 180,
    playCount: 10,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 2,
    title: 'Test Track 2',
    description: 'Another test track',
    soundcloudUrl: 'https://soundcloud.com/test/track2',
    soundcloudId: 'track2',
    artwork: undefined,
    duration: 240,
    playCount: 5,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

describe('AudioList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedAudioService.getAllAudio.mockImplementation(() => new Promise(() => {}));
    
    render(<AudioList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders audio content after loading', async () => {
    mockedAudioService.getAllAudio.mockResolvedValue({
      data: mockAudioContent,
      success: true
    });
    
    render(<AudioList />);
    
    await waitFor(() => {
      expect(screen.getByTitle('Test Track 1')).toBeInTheDocument();
      expect(screen.getByTitle('Test Track 2')).toBeInTheDocument();
    });
  });

  it('renders with provided audio prop', () => {
    render(<AudioList audio={mockAudioContent} />);
    
    expect(screen.getByTitle('Test Track 1')).toBeInTheDocument();
    expect(screen.getByTitle('Test Track 2')).toBeInTheDocument();
  });

  it('filters audio by search query', async () => {
    const user = userEvent.setup();
    render(<AudioList audio={mockAudioContent} />);
    
    const searchInput = screen.getByLabelText('Search Audio');
    await user.type(searchInput, 'Track 1');
    
    expect(screen.getByTitle('Test Track 1')).toBeInTheDocument();
    expect(screen.queryByTitle('Test Track 2')).not.toBeInTheDocument();
  });

  it('sorts audio by different criteria', async () => {
    const user = userEvent.setup();
    render(<AudioList audio={mockAudioContent} />);
    
    const sortSelect = screen.getByLabelText('Sort By');
    await user.selectOptions(sortSelect, 'title');
    
    const audioTitles = screen.getAllByTitle(/Test Track/);
    expect(audioTitles[0]).toHaveAttribute('title', 'Test Track 1');
    expect(audioTitles[1]).toHaveAttribute('title', 'Test Track 2');
    expect(audioTitles[0]).toHaveAttribute('height', '80');
    expect(audioTitles[1]).toHaveAttribute('height', '80');
  });

  it('renders each track as an 80 pixel SoundCloud widget', () => {
    render(<AudioList audio={mockAudioContent} />);

    const widget = screen.getByTitle('Test Track 1');
    expect(widget.tagName).toBe('IFRAME');
    expect(widget).toHaveAttribute('height', '80');
    expect(widget).toHaveAttribute('src', expect.stringContaining('https://w.soundcloud.com/player/'));
    expect(widget).toHaveAttribute('src', expect.stringContaining('visual=false'));
  });

  it('handles error state', async () => {
    mockedAudioService.getAllAudio.mockRejectedValue(new Error('Failed to load'));
    
    render(<AudioList />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load audio content')).toBeInTheDocument();
    });
  });

  it('displays correct audio count', () => {
    render(<AudioList audio={mockAudioContent} />);
    
    expect(screen.getByText('2 tracks')).toBeInTheDocument();
  });

  it('shows no content message when empty', () => {
    render(<AudioList audio={[]} />);
    
    expect(screen.getByText('No audio content found.')).toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    render(<AudioList audio={mockAudioContent} showFilters={false} />);
    
    expect(screen.queryByLabelText('Search Audio')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Sort By')).not.toBeInTheDocument();
  });

});