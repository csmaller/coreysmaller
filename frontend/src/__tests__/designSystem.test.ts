import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

describe('poster design tokens', () => {
  const poster = readFileSync(resolve(root, 'src/gig-poster.css'), 'utf8');
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const manifest = readFileSync(resolve(root, 'public/manifest.json'), 'utf8');

  it('keeps the redesign tokens', () => {
    expect(poster).toContain('--bg: #0a0a0b');
    expect(poster).toContain('--accent: #ff4a1c');
    expect(poster).toContain('--font-display: "Anton"');
    expect(poster).toContain('--font-mono: "Space Mono"');
    expect(poster).toContain('--font-body: "Archivo"');
    expect(poster).not.toContain('#2563eb');
  });

  it('loads the poster fonts and dark theme color', () => {
    expect(html).toContain('family=Anton');
    expect(html).toContain('family=Archivo');
    expect(html).toContain('family=Space+Mono');
    expect(html).toContain('content="#0a0a0b"');
    expect(manifest).toContain('"theme_color": "#0a0a0b"');
  });
});
