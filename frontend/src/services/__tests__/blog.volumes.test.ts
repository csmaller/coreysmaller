import { blogService } from '../blog';
import { apiService } from '../__mocks__/api';

describe('blogService volumes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the volume list, read, update, and reorder endpoints', async () => {
    const volume = { title: 'Field Notes', slug: 'field-notes', chapters: [] };
    (apiService.get as jest.Mock).mockResolvedValue({ data: [volume], success: true });
    (apiService.put as jest.Mock).mockResolvedValue({ data: volume, success: true });

    await blogService.listVolumes();
    await blogService.getVolume('field notes');
    await blogService.updateVolume('Field Notes', 'Road Notes', 'A description');
    await blogService.reorderVolume('Road Notes', [2, 1]);

    expect(apiService.get).toHaveBeenNthCalledWith(1, '/blog/volumes');
    expect(apiService.get).toHaveBeenNthCalledWith(2, '/blog/volumes/field%20notes');
    expect(apiService.put).toHaveBeenNthCalledWith(1, '/blog/volumes', {
      volume: 'Field Notes',
      title: 'Road Notes',
      description: 'A description',
    });
    expect(apiService.put).toHaveBeenNthCalledWith(2, '/blog/volumes/order', {
      volume: 'Road Notes',
      ids: [2, 1],
    });
  });
});
