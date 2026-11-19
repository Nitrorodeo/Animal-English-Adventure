import { describe, expect, it } from 'vitest';
import { digest, parseRange, planPrecache, staleMedia, type BuiltFile } from './precache';

const files: BuiltFile[] = [
  { path: 'index.html', rev: 'a1' },
  { path: 'sw.js', rev: 'zz' },
  { path: 'assets/index-abc.js', rev: 'b2' },
  { path: 'assets/index-abc.js.map', rev: 'm' },
  { path: 'manifest.webmanifest', rev: 'c3' },
  { path: 'audio/voice/0123.mp3', rev: 'd4' },
  { path: 'assets/characters/lion_father.webp', rev: 'e5' },
  { path: 'assets/backgrounds/sa_wetland.webp', rev: 'f6' },
];

describe('hors-ligne — plan de mise en cache', () => {
  it('sépare le démarrage (page, code, manifeste) des médias, sans le service worker ni les .map', () => {
    const p = planPrecache(files);
    expect(p.shell.map(([f]) => f)).toEqual(['assets/index-abc.js', 'index.html', 'manifest.webmanifest']);
    expect(p.media.map(([f]) => f)).toEqual(['assets/backgrounds/sa_wetland.webp', 'assets/characters/lion_father.webp', 'audio/voice/0123.mp3']);
  });

  it('les images passent avant les voix', () => {
    const p = planPrecache(files);
    const firstAudio = p.media.findIndex(([f]) => f.startsWith('audio/'));
    expect(p.media.slice(0, firstAudio).every(([f]) => f.startsWith('assets/'))).toBe(true);
  });

  it('la version change si un seul fichier change, et pas si l’ordre change', () => {
    const v = planPrecache(files).version;
    expect(planPrecache([...files].reverse()).version).toBe(v);
    expect(planPrecache(files.map((f) => (f.path === 'assets/characters/lion_father.webp' ? { ...f, rev: 'new' } : f))).version).not.toBe(v);
    expect(digest(['a'])).toMatch(/^[0-9a-f]{8}$/);
  });

  it('ne retélécharge que les médias modifiés ou retirés', () => {
    const p = planPrecache(files);
    const cached = { 'audio/voice/0123.mp3': 'd4', 'assets/characters/lion_father.webp': 'OLD', 'audio/voice/gone.mp3': 'x' };
    expect(staleMedia(cached, p).sort()).toEqual(['assets/characters/lion_father.webp', 'audio/voice/gone.mp3']);
  });
});

describe('hors-ligne — lecture partielle de l’audio (Range)', () => {
  it('lit début-fin, début seul et fin seule', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
    expect(parseRange('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
    expect(parseRange('bytes=-200', 1000)).toEqual({ start: 800, end: 999 });
    expect(parseRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
  });
  it('refuse une plage invalide', () => {
    expect(parseRange(null, 1000)).toBeNull();
    expect(parseRange('bytes=-', 1000)).toBeNull();
    expect(parseRange('bytes=2000-', 1000)).toBeNull();
    expect(parseRange('items=0-1', 1000)).toBeNull();
  });
});
