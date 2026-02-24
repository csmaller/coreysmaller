import { render, screen, waitFor } from '@testing-library/react';
import { VideoList } from '../VideoList';
import { videoService } from '../../../services/video';
import type { VideoContent } from '../../../types';

// Mock the video service
jest.mock('../../../services/video');
const mockVideoService = videoService as jest.Mocked<typeof videoService>;

// Mock video data
const mockVideos: VideoContent[] = [
  {
    id: 1,
    title: 'Test Video 1',
    description: 'A test video description',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: 180,
    viewCount: 100,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 2,
    title: 'Test Video 2',
    description: 'Another test video',
    youtubeUrl: 'https://www.youtube.com/watch?v=abc123',
    youtubeId: 'abc123',
    thumbnail: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
    duration: 240,
    viewCount: 50,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  }
];

describe('VideoList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockVideoService.getAllVideos.mockImplementation(() => new Promise(() => {}));
    
    render(<VideoList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders videos after loading', async () => {
    mockVideoService.getAllVideos.mockResolvedValue({
      data: mockVideos,
      success: true
    });
    
    render(<VideoList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
      expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    });
  });

  it('displays video count', async () => {
    mockVideoService.getAllVideos.mockResolvedValue({
      data: mockVideos,
      success: true
    });
    
    render(<VideoList />);
    
    await waitFor(() => {
      expect(screen.getByText('2 videos')).toBeInTheDocument();
    });
  });

  it('renders with provided videos prop', () => {
    render(<VideoList videos={mockVideos} />);
    
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    expect(screen.getByText('2 videos')).toBeInTheDocument();
  });

  it('handles empty video list', async () => {
    mockVideoService.getAllVideos.mockResolvedValue({
      data: [],
      success: true
    });
    
    render(<VideoList />);
    
    await waitFor(() => {
      expect(screen.getByText('No videos found.')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    mockVideoService.getAllVideos.mockRejectedValue(new Error('Failed to load'));
    
    render(<VideoList />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load videos')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('hides filters when showFilters is false', async () => {
    mockVideoService.getAllVideos.mockResolvedValue({
      data: mockVideos,
      success: true
    });
    
    render(<VideoList showFilters={false} />);
    
    await waitFor(() => {
      expect(screen.queryByLabelText('Search Videos')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Sort By')).not.toBeInTheDocument();
    });
  });

  it('displays video metadata correctly', async () => {
    mockVideoService.getAllVideos.mockResolvedValue({
      data: mockVideos,
      success: true
    });
    
    render(<VideoList />);
    
    await waitFor(() => {
      expect(screen.getByText('100 views')).toBeInTheDocument();
      expect(screen.getByText('50 views')).toBeInTheDocument();
      expect(screen.getByText('3:00')).toBeInTheDocument(); // 180 seconds
      expect(screen.getByText('4:00')).toBeInTheDocument(); // 240 seconds
    });
  });
});