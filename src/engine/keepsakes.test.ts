import { describe, expect, it } from 'vitest';
import { clipFor } from '../audio/speech';
import { BEDTIME, say, STICKER_OFFER } from '../content/utterances';
import { CONTINENTS } from '../content/world';
import { familyAlbum } from './album';
import { bedtimeLines } from './bedtime';
import { createBaby } from './family';
import { migrate } from './save';
import { getFamily, newGameState, withFamily, type GameState } from './state';
import { dayKey, MAX_STICKERS, placeSticker, stickerOffer, STICKERS } from './stickers';

function lionFamily(): GameState {
  let s = newGameState();
  let fam = getFamily(s, 'lion');
  const a = createBaby(fam, 'girl', 'Kiara', 'b1');
  if (!a.ok) throw new Error('naissance');
  fam = a.family;
  const b = createBaby(fam, 'boy', 'Kovu', 'b2');
  if (!b.ok) throw new Error('naissance');
  fam = { ...b.family, babies: b.family.babies.map((x) => (x.id === 'b1' ? { ...x, stage: 'young' as const } : x)) };
  s = withFamily(s, fam);
  return s;
}

describe('album souvenir', () => {
  it('vide sans bébé', () => {
    expect(familyAlbum(newGameState())).toEqual([]);
  });

  it('une photo de naissance, puis une par stade atteint, l’aîné d’abord', () => {
    const photos = familyAlbum(lionFamily());
    expect(photos.map((p) => `${p.babyName}:${p.stage}:${p.kind}`)).toEqual(['Kiara:newborn:born', 'Kiara:little:grew', 'Kiara:young:grew', 'Kovu:newborn:born']);
    expect(new Set(photos.map((p) => p.key)).size).toBe(photos.length);
  });

  it('les légendes dites à voix haute sont enregistrées', () => {
    expect(clipFor(say.albumBorn('Kiara'), 'narrator', ['Kiara'])).toBeDefined();
    expect(clipFor(say.growUp('Kiara', 'young'), 'narrator', ['Kiara'])).toBeDefined();
  });
});

describe('autocollant du jour', () => {
  const today = '2026-11-19';

  it('trois autocollants différents, une seule fois par jour', () => {
    const s = newGameState();
    const offer = stickerOffer(s, today)!;
    expect(offer).toHaveLength(3);
    expect(new Set(offer.map((o) => o.id)).size).toBe(3);
    expect(stickerOffer(s, today)!.map((o) => o.id)).toEqual(offer.map((o) => o.id)); // stable
    const after = placeSticker(s, offer[0]!.id, 'africa', today);
    expect(after.player.stickers).toHaveLength(1);
    expect(after.player.stickerDay).toBe(today);
    expect(stickerOffer(after, today)).toBeNull();
    expect(placeSticker(after, offer[1]!.id, 'africa', today)).toBe(after);
    expect(stickerOffer(after, '2026-11-20')).toHaveLength(3);
  });

  it('collé à l’intérieur du continent où l’enfant jouait', () => {
    let s = newGameState();
    for (let d = 1; d <= 28; d++) {
      const day = `2026-12-${String(d).padStart(2, '0')}`;
      const c = CONTINENTS[d % CONTINENTS.length]!;
      s = placeSticker(s, stickerOffer(s, day)![0]!.id, c.id, day);
      const st = s.player.stickers.at(-1)!;
      expect(st.continentId).toBe(c.id);
      expect(st.x).toBeGreaterThanOrEqual(c.mapHit.x);
      expect(st.x).toBeLessThanOrEqual(c.mapHit.x + c.mapHit.w);
      expect(st.y).toBeGreaterThanOrEqual(c.mapHit.y);
      expect(st.y).toBeLessThanOrEqual(c.mapHit.y + c.mapHit.h);
    }
  });

  it('ne repropose pas les derniers choisis et garde au plus 40 autocollants', () => {
    let s = newGameState();
    for (let d = 0; d < MAX_STICKERS + 5; d++) {
      const day = `day-${d}`;
      const offer = stickerOffer(s, day)!;
      const recent = s.player.stickers.slice(-3).map((x) => x.id);
      expect(offer.some((o) => recent.includes(o.id))).toBe(false);
      s = placeSticker(s, offer[0]!.id, 'asia', day);
    }
    expect(s.player.stickers).toHaveLength(MAX_STICKERS);
  });

  it('clé du jour à l’heure de l’appareil', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('les anciennes sauvegardes reçoivent une carte vide ; les autocollants abîmés sont écartés', () => {
    const old = JSON.parse(JSON.stringify(newGameState())) as Record<string, any>;
    delete old.player.stickers;
    delete old.player.stickerDay;
    expect(migrate(old)!.player.stickers).toEqual([]);
    expect(migrate(old)!.player.stickerDay).toBeNull();
    old.player.stickers = [{ id: 'star', continentId: 'asia', x: 70, y: 20 }, { id: 'star' }, 'x'];
    old.player.stickerDay = '2026-11-19';
    expect(migrate(old)!.player.stickers).toEqual([{ id: 'star', continentId: 'asia', x: 70, y: 20 }]);
    expect(migrate(old)!.player.stickerDay).toBe('2026-11-19');
  });

  it('chaque autocollant et l’annonce ont leur enregistrement', () => {
    expect(clipFor(STICKER_OFFER.en, 'narrator', [])).toBeDefined();
    for (const st of STICKERS) expect(clipFor(say.sticker(st.en), 'narrator', []), st.id).toBeDefined();
  });
});

describe('bonne nuit', () => {
  it('maman, puis chaque bébé avec sa voix, puis papa', () => {
    const s = lionFamily();
    const lines = bedtimeLines(getFamily(s, 'lion'), 'Ava');
    expect(lines.map((l) => `${l.who}:${l.role}`)).toEqual(['mother:mother', 'b1:girl', 'b2:boy', 'father:father']);
    expect(lines[0]!.en).toBe('Good night, Ava!');
    expect(bedtimeLines(getFamily(newGameState(), 'lion'), 'Ava').map((l) => l.who)).toEqual(['mother', 'father']);
  });

  it('toutes les phrases sont enregistrées, prénom compris', () => {
    for (const l of bedtimeLines(getFamily(lionFamily(), 'lion'), 'Ava')) expect(clipFor(l.en, l.role, ['Ava', 'Kiara', 'Kovu']), l.en).toBeDefined();
    expect(clipFor(BEDTIME.wake.en, 'father', [])).toBeDefined();
  });
});
