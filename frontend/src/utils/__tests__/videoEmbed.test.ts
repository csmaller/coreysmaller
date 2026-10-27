import { videoEmbed } from '../videoEmbed';

describe('videoEmbed', () => {
  it('accepts a YouTube Short and uses the regular player', () => {
    const embed = videoEmbed('https://www.youtube.com/shorts/bChAwT1SaEg');
    expect(embed?.id).toBe('bChAwT1SaEg');
    expect(embed?.src.startsWith('https://www.youtube.com/embed/bChAwT1SaEg?')).toBe(true);
    expect(embed?.src).not.toContain('autoplay');
  });

  it('accepts an Instagram post', () => {
    expect(videoEmbed('https://www.instagram.com/p/AbCdEfGhIjK/')?.src).toBe(
      'https://www.instagram.com/p/AbCdEfGhIjK/embed'
    );
  });

  it('rejects a plain Instagram profile', () => {
    expect(videoEmbed('https://www.instagram.com/coreysmaller/')).toBeNull();
  });
});
