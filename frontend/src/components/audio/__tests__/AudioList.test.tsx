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
      expect(screen.getByText('Test Track 1')).toBeInTheDocument();
      expect(screen.getByText('Test Track 2')).toBeInTheDocument();
    });
  });

  it('renders with provided audio prop', () => {
    render(<AudioList audio={mockAudioContent} />);
    
    expect(screen.getByText('Test Track 1')).toBeInTheDocument();
    expect(screen.getByText('Test Track 2')).toBeInTheDocument();
  });

  it('filters audio by search query', async () => {
    const user = userEvent.setup();
    render(<AudioList audio={mockAudioContent} />);
    
    const searchInput = screen.getByLabelText('Search Audio');
    await user.type(searchInput, 'Track 1');
    
    expect(screen.getByText('Test Track 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Track 2')).not.toBeInTheDocument();
  });

  it('sorts audio by different criteria', async () => {
    const user = userEvent.setup();
    render(<AudioList audio={mockAudioContent} />);
    
    const sortSelect = screen.getByLabelText('Sort By');
    await user.selectOptions(sortSelect, 'title');
    
    const audioTitles = screen.getAllByText(/Test Track/);
    expect(audioTitles[0]).toHaveTextContent('Test Track 1');
    expect(audioTitles[1]).toHaveTextContent('Test Track 2');
  });

  it('plays audio when play button is clicked', async () => {
    const user = userEvent.setup();
    mockedAudioService.incrementPlayCount.mockResolvedValue({
      data: {
        ...mockAudioContent[0],
        playCount: 11
      },
      success: true
    });
    
    render(<AudioList audio={mockAudioContent} showPlayer={true} />);
    
    // Find the play button for the first track specifically
    const playButton = screen.getByLabelText('Play Test Track 1');
    await user.click(playButton);
    
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    expect(screen.getByText('Playing: Test Track 1')).toBeInTheDocument();
    expect(mockedAudioService.incrementPlayCount).toHaveBeenCalledWith(1);
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

  it('does not show player when showPlayer is false', async () => {
    const user = userEvent.setup();
    mockedAudioService.incrementPlayCount.mockResolvedValue({
      data: {
        ...mockAudioContent[0],
        playCount: 11
      },
      success: true
    });
    
    render(<AudioList audio={mockAudioContent} showPlayer={false} />);
    
    const playButtons = screen.getAllByLabelText(/Play/);
    await user.click(playButtons[0]);
    
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument();
  });
});