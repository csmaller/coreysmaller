import { contentAggregationService } from '../contentAggregation';
import { blogService } from '../blog';
import { musicService } from '../music';
import { videoService } from '../video';
import { audioService } from '../audio';

jest.mock('../blog', () => ({
  blogService: { getAllPosts: jest.fn() },
}));
jest.mock('../music', () => ({
  musicService: { getAllTracks: jest.fn() },
}));
jest.mock('../video', () => ({
  videoService: { getAllVideos: jest.fn() },
}));
jest.mock('../audio', () => ({
  audioService: { getAllAudio: jest.fn() },
}));

const blog = blogService.getAllPosts as jest.Mock;
const music = musicService.getAllTracks as jest.Mock;
const video = videoService.getAllVideos as jest.Mock;
const audio = audioService.getAllAudio as jest.Mock;

describe('contentAggregationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the newest items and survives a failed source', async () => {
    blog.mockRejectedValue(new Error('blog down'));
    music.mockResolvedValue({
      data: [
        { id: 1, title: 'Older', createdAt: '2024-01-01' },
        { id: 2, title: 'Newer', createdAt: '2024-03-01' },
        { id: 3, title: 'Middle', createdAt: '2024-02-01' },
      ],
      success: true,
    });
    video.mockResolvedValue({ data: [], success: true });
    audio.mockResolvedValue({ data: [], success: true });

    const recent = await contentAggregationService.getRecentContent(2);

    expect(recent.recentPosts).toEqual([]);
    expect(recent.featuredMusic.map((track) => track.title)).toEqual(['Newer', 'Middle']);
  });

  it('turns mixed content into previews sorted newest first', () => {
    const previews = contentAggregationService.convertToContentPreviews({
      recentPosts: [{
        id: 7,
        title: 'Volume one',
        type: 'volume',
        slug: 'field-notes',
        excerpt: 'Notes',
        createdAt: '2024-01-01',
        publishedAt: '2024-01-01',
      } as never],
      featuredMusic: [{
        id: 3,
        title: 'Night drive',
        genre: 'jazz',
        duration: 125,
        releaseDate: '2024-06-01',
        createdAt: '2024-06-01',
      } as never],
      latestVideos: [{
        id: 'v1',
        title: 'Clip',
        duration: 61,
        createdAt: '2024-05-01',
      } as never],
      latestAudio: [{
        id: 'a1',
        title: 'Voice memo',
        createdAt: '2024-04-01',
      } as never],
    });

    expect(previews.map((item) => item.title)).toEqual([
      'Night drive',
      'Clip',
      'Voice memo',
      'Volume one',
    ]);
    expect(previews[0].description).toBe('jazz • 2:05');
    expect(previews[1].description).toBe('1:01');
    expect(previews[2].description).toBe('Audio content');
    expect(previews[3].url).toBe('/blog/volume/field-notes');
  });

  it('strips html when a post has no excerpt', () => {
    const [preview] = contentAggregationService.convertToContentPreviews({
      recentPosts: [{
        id: 1,
        title: 'Long',
        content: `<p>${'word '.repeat(80)}</p>`,
        createdAt: '2024-01-01',
      } as never],
      featuredMusic: [],
      latestVideos: [],
      latestAudio: [],
    });

    expect(preview.description?.endsWith('...')).toBe(true);
    expect(preview.description).not.toContain('<p>');
  });

  it('counts each content type and treats a failed source as empty', async () => {
    blog.mockResolvedValue({ data: [], pagination: { total: 4, page: 1, limit: 1, totalPages: 4 }, success: true });
    music.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], success: true });
    video.mockRejectedValue(new Error('video down'));
    audio.mockResolvedValue({ data: [{ id: 'a1' }], success: true });

    const stats = await contentAggregationService.getContentStats();

    expect(stats).toEqual({
      totalPosts: 4,
      totalTracks: 2,
      totalVideos: 0,
      totalAudio: 1,
    });
  });
});
