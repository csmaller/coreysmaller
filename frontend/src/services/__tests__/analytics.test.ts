import { analyticsService } from '../analytics';
import { apiService } from '../__mocks__/api';

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records a page view and reads the summary envelope', async () => {
    (apiService.get as jest.Mock).mockResolvedValue({
      data: { totalViews: 4, lastSevenDays: [], topPages: [], content: {}, recordedSince: null },
    });

    await analyticsService.recordPageView('/blog');
    const summary = await analyticsService.getSummary();

    expect(apiService.post).toHaveBeenCalledWith('/analytics/views', { path: '/blog' });
    expect(apiService.get).toHaveBeenCalledWith('/analytics');
    expect(summary.totalViews).toBe(4);
  });
});
