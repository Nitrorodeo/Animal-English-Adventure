import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { SPECIES } from '../content/species';
import { CLOUD_MAX_BYTES } from './cloud';
import { ALBUM_MAX_PER_FAMILY, albumFamilies, deletePhoto, familyPhotos, parseAlbum, takePhoto, type Shot } from './photoAlbum';
import { migrate } from './save';
import { newGameState, type GameState } from './state';

/**
 * Demande du 2026-11-25 : « un album photo qu'elle peut choisir par animaux et y mettre autant de photos qu'elle veut.
 * Mais il faut vraiment que les photos ne tiennent aucune place, soit optimisées au maximum ».
 */

const shot = (over: Partial<Shot> = {}, dx = 0): Shot => ({
  sp: 'elephant',
  p: 'africa_acacia_plain',
  a: [
    { who: 'father', x: 52.34 + dx, y: 81.41, h: 42.66, f: 1 },
    { who: 'mother', x: 31.3, y: 78.4, h: 40.1, f: -1 },
    { who: 'baby', birthOrder: 1, x: 62.3, y: 85.4, h: 22.7, f: 1, stage: 'little', sex: 'girl' },
    { who: 'baby', birthOrder: 2, x: 72.3, y: 84.4, h: 20.7, f: -1, stage: 'newborn', sex: 'boy' },
  ],
  g: [
    { id: 'red_ball', x: 44.1, y: 83.2, h: 40.2 },
    { id: 'flower_pot', x: 14.1, y: 80.2, h: 38.2 },
    { id: 'kite', x: 84.1, y: 70.2, h: 30.2 },
  ],
  ...over,
});

function take(state: GameState, s: Shot, now: number): GameState {
  const r = takePhoto(state, s, now);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

describe('album photo 📷 : une photo = la scène, pas une image', () => {
  it('le déclic range la scène dans l’album de la famille, et la redonne telle quelle (bébés à leur âge du jour)', () => {
    const s = take(newGameState(), shot(), 1_000);
    const [p] = familyPhotos(s, 'elephant');
    expect(p).toBeDefined();
    expect(p!.p).toBe('africa_acacia_plain');
    expect(p!.a[0]).toEqual({ who: 'father', x: 52.3, y: 81.4, h: 42.7, f: 1 });
    expect(p!.a[2]).toMatchObject({ who: 'baby', birthOrder: 1, stage: 'little', sex: 'girl' });
    expect(p!.a[3]).toMatchObject({ who: 'baby', birthOrder: 2, stage: 'newborn', sex: 'boy', f: -1 });
    expect(p!.g.map((g) => g.id)).toEqual(['red_ball', 'flower_pot', 'kite']);
    expect(p!.night).toBe(false);
  });

  it('une photo chargée (4 animaux, 3 cadeaux) pèse moins de 300 octets (une vraie image : 20 à 200 Ko)', () => {
    const s = take(newGameState(), shot(), 1_795_593_050_008);
    expect(JSON.stringify(s.player.album).length).toBeLessThan(300);
  });

  it('100 photos pour CHAQUE animal du jeu tiennent largement dans la partie en ligne (1 Mo)', () => {
    let s = newGameState();
    for (const sp of SPECIES) for (let i = 0; i < ALBUM_MAX_PER_FAMILY; i++) s = take(s, shot({ sp: sp.id }, i / 10), 1_795_593_050_008 + i);
    const albumBytes = JSON.stringify(s.player.album).length;
    expect(albumBytes).toBeLessThan(CLOUD_MAX_BYTES * 0.6);
    expect(JSON.stringify(migrate(JSON.parse(JSON.stringify(s)))).length).toBeLessThan(CLOUD_MAX_BYTES * 0.7);
  });

  it('rangée par animal, la plus récente d’abord ; chaque famille a son compteur', () => {
    let s = take(newGameState(), shot(), 1_000);
    s = take(s, shot({}, 5), 2_000);
    s = take(s, shot({ sp: 'lion', p: 'africa_baobab' }), 3_000);
    expect(familyPhotos(s, 'elephant').map((p) => p.t)).toEqual([2_000, 1_000]);
    expect(familyPhotos(s, 'lion')).toHaveLength(1);
    expect(albumFamilies(s)).toEqual(expect.arrayContaining([{ speciesId: 'elephant', count: 2 }, { speciesId: 'lion', count: 1 }]));
  });

  it('dix appuis sans rien bouger ne font qu’une photo ; un animal déplacé en refait une', () => {
    let s = take(newGameState(), shot(), 1_000);
    const again = takePhoto(s, shot(), 1_500);
    expect(again).toEqual({ ok: false, reason: 'same' });
    s = take(s, shot({}, 3), 2_000);
    expect(familyPhotos(s, 'elephant')).toHaveLength(2);
    // la nuit, la même scène est une autre photo
    expect(takePhoto(s, shot({ night: true }, 3), 3_000).ok).toBe(true);
  });

  it('au plus 100 photos par famille ; les autres familles continuent', () => {
    let s = newGameState();
    for (let i = 0; i < ALBUM_MAX_PER_FAMILY; i++) s = take(s, shot({}, i / 10), 1_000 + i);
    expect(takePhoto(s, shot({}, 99), 9_999)).toEqual({ ok: false, reason: 'full' });
    expect(takePhoto(s, shot({ sp: 'lion' }), 9_999).ok).toBe(true);
    // une photo retirée laisse la place à une nouvelle
    s = deletePhoto(s, familyPhotos(s, 'elephant')[0]!.id);
    expect(familyPhotos(s, 'elephant')).toHaveLength(ALBUM_MAX_PER_FAMILY - 1);
    expect(takePhoto(s, shot({}, 99), 9_999).ok).toBe(true);
  });

  it('deux déclics dans la même milliseconde gardent deux photos distinctes', () => {
    let s = take(newGameState(), shot(), 1_000);
    s = take(s, shot({}, 1), 1_000);
    const ids = familyPhotos(s, 'elephant').map((p) => p.id);
    expect(new Set(ids).size).toBe(2);
    expect(familyPhotos(deletePhoto(s, ids[0]!), 'elephant').map((p) => p.id)).toEqual([ids[1]]);
  });

  it('l’album suit la partie (sauvegarde relue) ; une photo abîmée est écartée, pas l’album entier', () => {
    const s = take(newGameState(), shot(), 1_000);
    const back = migrate(JSON.parse(JSON.stringify(s)))!;
    expect(familyPhotos(back, 'elephant')).toEqual(familyPhotos(s, 'elephant'));
    const album = parseAlbum({
      elephant: [{ t: 5, p: 'africa_pond', a: [['f', 10, 80, 30, 1], ['x', 1, 1, 1, 1], ['b1', 20, 80, 10, 1, 9, 'g']] }, { t: 'bad' }, 'junk'],
      lion: 'junk',
    });
    expect(Object.keys(album)).toEqual(['elephant']);
    expect(album.elephant).toEqual([{ t: 5, p: 'africa_pond', a: [['f', 10, 80, 30, 1], ['b1', 20, 80, 10, 1]] }]);
    expect(parseAlbum([1, 2])).toEqual({});
    expect(migrate(JSON.parse(JSON.stringify(newGameState())))!.player.album).toBeUndefined();
  });
});

describe('album photo : interface', () => {
  const habitat: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
  const app: string = readFileSync(new URL('../ui/App.tsx', import.meta.url), 'utf8');
  const album: string = readFileSync(new URL('../ui/PhotoAlbum.tsx', import.meta.url), 'utf8');
  const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

  it('📷 dans chaque décor, avec le flash', () => {
    expect(habitat).toContain('className={`photo-btn');
    expect(habitat).toContain('onClick={snap} aria-label="Take a photo"');
    expect(habitat).toContain('<div key={flash} className="photo-flash" aria-hidden />');
  });

  it('le bouton 📷 reste discret : plus petit que la lune, à demi transparent (demande du 2026-11-25)', () => {
    const rule = (sel: string) => css.slice(css.indexOf(`${sel} {`), css.indexOf('}', css.indexOf(`${sel} {`)));
    const width = (sel: string) => Number(/width: ([\d.]+)cqw/.exec(rule(sel))![1]);
    expect(width('.photo-btn')).toBeLessThan(width('.night-btn') * 0.7);
    expect(rule('.photo-btn')).toMatch(/opacity: 0\.[5-8]/);
    expect(rule('.photo-btn')).not.toContain('#d93d80');
  });

  it('une photo prise la nuit montre la vraie nuit du décor (ciel bleu nuit, lune, étoiles), pas un décor de jour assombri', () => {
    expect(album).toContain('{photo.night && <BedtimeSky />}');
    expect(habitat).toContain('export function BedtimeSky()');
    expect(css).toContain('.photo-scene .night-sky { opacity: 1;');
    expect(css).not.toContain('.photo-scene.night .ps-bg');
  });

  it('la photo en grand s’affiche d’un coup, en pleine lumière, avec ses boutons dans l’écran', () => {
    const view = css.slice(css.indexOf('.album-view {'), css.indexOf('}', css.indexOf('.album-view {')));
    expect(view).not.toContain('animation');
    expect(css).toContain('width: min(94vw, calc((100dvh - 200px) * 16 / 9));');
  });

  it('un bouton de la barre du haut ouvre l’espace perso : l’album, rangé par animal', () => {
    expect(app).toContain("open({ kind: 'album'");
    expect(app).toContain('<PhotoAlbum state={state} setState={setState}');
    expect(album).toContain('className={`album-tab');
    expect(album).toContain('deletePhoto(s, big.id)');
    for (const rule of ['.photo-btn {', '.photo-scene {', '.album-grid {', '.album-view {', '.topbar .tb-album {']) expect(css).toContain(rule);
  });
});
