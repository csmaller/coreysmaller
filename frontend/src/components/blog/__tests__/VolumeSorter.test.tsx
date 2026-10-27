import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolumeSorter } from '../VolumeSorter';
import { blogService } from '../../../services/blog';

jest.mock('../../../services/blog', () => ({
  blogService: {
    listVolumes: jest.fn(),
    updateVolume: jest.fn(),
    reorderVolume: jest.fn(),
  },
}));

const mockBlogService = blogService as jest.Mocked<typeof blogService>;

const relationships = {
  title: 'Relationships',
  slug: 'relationships',
  description: 'Stories about people',
  wordCount: 3000,
  chapters: [
    { id: 4, title: 'Chapters 1-4', chapterOrder: 1, status: 'published', wordCount: 1200 },
    { id: 5, title: 'Chapters 5-8', chapterOrder: 2, status: 'draft', wordCount: 1800 },
  ],
};

describe('VolumeSorter', () => {
  beforeEach(() => {
    mockBlogService.listVolumes.mockResolvedValue({
      data: [relationships],
      success: true,
    });
  });

  it('opens a volume editor with draggable chapters', async () => {
    const user = userEvent.setup();
    const onEditChapter = jest.fn();
    const onDeleteChapter = jest.fn();

    render(
      <VolumeSorter onEditChapter={onEditChapter} onDeleteChapter={onDeleteChapter} />
    );

    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText('Title')).toHaveValue('Relationships');
    expect(screen.getByLabelText('Description')).toHaveValue('Stories about people');
    expect(screen.getByText('Chapters 1-4')).toBeInTheDocument();
    expect(screen.getByText('Chapters 5-8')).toBeInTheDocument();
    expect(screen.getAllByText('3,000 words').length).toBeGreaterThan(0);
    expect(screen.getByText('1,200 words')).toBeInTheDocument();
    expect(screen.getByText('1,800 words')).toBeInTheDocument();

    const chapterButtons = screen.getAllByRole('button', { name: 'Edit' });
    await user.click(chapterButtons[0]);
    expect(onEditChapter).toHaveBeenCalledWith(expect.objectContaining({ id: 4, title: 'Chapters 1-4' }));

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(onDeleteChapter).toHaveBeenCalledWith(expect.objectContaining({ id: 5, title: 'Chapters 5-8' }));
  });

  it('saves the volume title and description', async () => {
    const user = userEvent.setup();
    mockBlogService.updateVolume.mockResolvedValue({
      data: { ...relationships, title: 'Relationships II', description: 'A long story' },
      success: true,
    });

    render(<VolumeSorter />);

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Relationships II' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A long story' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockBlogService.updateVolume).toHaveBeenCalledWith(
        'Relationships',
        'Relationships II',
        'A long story'
      );
    });
    expect(screen.getByLabelText('Title')).toHaveValue('Relationships II');
  });
});
