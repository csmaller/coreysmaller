import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';

// Mock the services
jest.mock('../../../services/blog', () => ({
  blogService: {
    getAllPosts: jest.fn(),
    getMigrationStatus: jest.fn(),
    migrateMarkdownFiles: jest.fn(),
  }
}));

jest.mock('../../../services/music', () => ({
  musicService: {
    getAllTracks: jest.fn(),
  }
}));

jest.mock('../../../services/video', () => ({
  videoService: {
    getAllVideos: jest.fn(),
  }
}));

jest.mock('../../../services/audio', () => ({
  audioService: {
    getAllAudio: jest.fn(),
  }
}));

// Import the mocked services
import { blogService } from '../../../services/blog';
import { musicService } from '../../../services/music';
import { videoService } from '../../../services/video';
import { audioService } from '../../../services/audio';

const mockedBlogService = blogService as jest.Mocked<typeof blogService>;
const mockedMusicService = musicService as jest.Mocked<typeof musicService>;
const mockedVideoService = videoService as jest.Mocked<typeof videoService>;
const mockedAudioService = audioService as jest.Mocked<typeof audioService>;

describe('AdminDashboard', () => {
  const mockProps = {
    onCreatePost: jest.fn(),
    onManagePosts: jest.fn(),
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockedBlogService.getAllPosts.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
      success: true,
      message: 'Success'
    });
    
    mockedMusicService.getAllTracks.mockResolvedValue({
      data: [],
      success: true
    });
    mockedVideoService.getAllVideos.mockResolvedValue({
      data: [],
      success: true
    });
    mockedAudioService.getAllAudio.mockResolvedValue({
      data: [],
      success: true
    });
  });

  it('renders loading state initially', () => {
    // Make the promises never resolve to keep loading state
    mockedBlogService.getAllPosts.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<AdminDashboard {...mockProps} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    renderWithRouter(<AdminDashboard {...mockProps} />);
    
    // Wait for content to load
    expect(await screen.findByText('Blog Posts')).toBeInTheDocument();
    expect(screen.getByText('Music Tracks')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Audio Tracks')).toBeInTheDocument();
  });

  it('displays correct statistics', async () => {
    mockedBlogService.getAllPosts.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 5, totalPages: 1 },
      success: true,
      message: 'Success'
    });
    
    mockedMusicService.getAllTracks.mockResolvedValue({
      data: [
        { id: 1, title: 'Track 1' } as any,
        { id: 2, title: 'Track 2' } as any,
      ],
      success: true
    });
    
    renderWithRouter(<AdminDashboard {...mockProps} />);
    
    // Wait for statistics to load
    expect(await screen.findByText('5')).toBeInTheDocument(); // Blog posts count
    expect(screen.getByText('2')).toBeInTheDocument(); // Music tracks count
  });

  it('renders management cards', async () => {
    renderWithRouter(<AdminDashboard {...mockProps} />);
    
    expect(await screen.findByText('Blog Management')).toBeInTheDocument();
    expect(screen.getByText('Music Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Video Content')).toBeInTheDocument();
    expect(screen.getByText('Audio Content')).toBeInTheDocument();
    expect(screen.getByText('Migration Tools')).toBeInTheDocument();
    expect(screen.getByText('Site Analytics')).toBeInTheDocument();
  });

  it('calls onCreatePost when create button is clicked', async () => {
    renderWithRouter(<AdminDashboard {...mockProps} />);
    
    const createButton = await screen.findByText('Create New Post');
    createButton.click();
    
    expect(mockProps.onCreatePost).toHaveBeenCalled();
  });

  it('calls onManagePosts when manage button is clicked', async () => {
    renderWithRouter(<AdminDashboard {...mockProps} />);
    
    const manageButton = await screen.findByText('Manage Posts');
    manageButton.click();
    
    expect(mockProps.onManagePosts).toHaveBeenCalled();
  });
});