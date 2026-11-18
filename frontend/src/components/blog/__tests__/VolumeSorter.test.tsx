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
    expect(await screen.findByRole('status')).toHaveTextContent('Volume saved.');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByLabelText('Title')).toHaveValue('Relationships II');
  });

  it('shows an error toast when the volume cannot be saved', async () => {
    const user = userEvent.setup();
    mockBlogService.updateVolume.mockRejectedValue(new Error('Volume not found'));

    render(<VolumeSorter />);

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Volume not found');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('checks a volume for the home page', async () => {
    const user = userEvent.setup();
    const onPlaceHome = jest.fn();

    render(
      <VolumeSorter
        homeSelection={[]}
        onPlaceHome={onPlaceHome}
      />
    );

    await user.click(await screen.findByRole('checkbox', { name: 'Show Relationships on the home page' }));

    expect(onPlaceHome).toHaveBeenCalledWith('volume', 'relationships', 1);
  });
});
