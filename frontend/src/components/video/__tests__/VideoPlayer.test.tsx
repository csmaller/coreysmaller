import { render, screen } from '@testing-library/react';
import { VideoPlayer } from '../VideoPlayer';
import type { VideoContent } from '../../../types';

const video: VideoContent = {
  id: 1,
  title: 'Miss You',
  youtubeUrl: 'https://www.youtube.com/watch?v=f02GfloCijk&list=RDf02GfloCijk',
  youtubeId: 'f02GfloCijk',
  viewCount: 3,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('VideoPlayer', () => {
  it('embeds the video without requiring a YouTube login', () => {
    render(<VideoPlayer video={video} onClose={() => {}} />);

    const frame = screen.getByTitle('Miss You');
    expect(frame).toHaveAttribute(
      'src',
      `https://www.youtube.com/embed/f02GfloCijk?rel=0&origin=${encodeURIComponent(window.location.origin)}`
    );
    expect(frame.getAttribute('src')).not.toContain('autoplay');
    expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  });

  it('embeds a YouTube Short from its shorts link', () => {
    render(
      <VideoPlayer
        video={{ ...video, title: 'Vienna', youtubeUrl: 'https://www.youtube.com/shorts/bChAwT1SaEg' }}
        onClose={() => {}}
      />
    );

    expect(screen.getByTitle('Vienna').getAttribute('src')).toContain(
      'https://www.youtube.com/embed/bChAwT1SaEg?'
    );
  });

  it('embeds an Instagram reel', () => {
    render(
      <VideoPlayer
        video={{ ...video, title: 'Reel', youtubeUrl: 'https://www.instagram.com/reel/CxyzAbcd123/' }}
        onClose={() => {}}
      />
    );

    expect(screen.getByTitle('Reel')).toHaveAttribute(
      'src',
      'https://www.instagram.com/reel/CxyzAbcd123/embed'
    );
  });
});
