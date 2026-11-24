// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { existsSync } from 'node:fs';
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../content/species';
import { getBiome } from '../content/world';
import { BRANCH_MAX_H, GIFTS, giftAllowed, giftOffer, giftsHere, moveGift, parseGifts, placeClasses, receiveGift } from './gifts';
import { migrate } from './save';
import { newGameState } from './state';

const PLAYABLE = SPECIES.filter((s) => s.playable);
const lion = SPECIES.find((s) => s.id === 'lion')!;
const savanna = getBiome(lion.allowedBiomes[0]!);
const today = '2026-11-24';

describe('cadeaux du soir : le catalogue', () => {
  it('chaque objet a son image et des données lisibles', () => {
    expect(GIFTS.length).toBe(78); // 70 dessins d'origine + 8 objets propres aux familles (2026-11-24)
    expect(new Set(GIFTS.map((g) => g.id)).size).toBe(GIFTS.length);
    for (const g of GIFTS) {
      expect(existsSync(resolve('public/assets/gifts', `${g.id}.webp`)), g.id).toBe(true);
      expect(g.h, g.id).toBeGreaterThan(0.05);
      expect(g.h, g.id).toBeLessThanOrEqual(1.5);
      expect(g.ratio, g.id).toBeGreaterThan(0.1);
      expect(g.en, g.id).toMatch(/^(a|an|some) |s$/);
      expect(g.colors.length, g.id).toBeGreaterThan(0);
      if (g.species) expect(PLAYABLE.some((s) => s.id === g.species), g.id).toBe(true);
    }
  });

  it('chaque objet a sa place quelque part, chaque décor en offre au moins trois', () => {
    const used = new Set<string>();
    for (const sp of PLAYABLE) {
      const family = new Set<string>();
      for (const b of sp.allowedBiomes) {
        const ok = GIFTS.filter((g) => giftAllowed(g, sp.id, getBiome(b)));
        expect(ok.length, `${sp.id} ${b}`).toBeGreaterThanOrEqual(3);
        ok.forEach((g) => (used.add(g.id), family.add(g.id)));
      }
      expect(family.size, sp.id).toBeGreaterThanOrEqual(11); // moins d'objets, mais tous des jouets ou liés à l'animal (toucan 11, lion 12)
    }
    expect(GIFTS.filter((g) => !g.use && !used.has(g.id)).map((g) => g.id)).toEqual([]);
  });

  it('chaque famille a au moins un objet à elle, vraiment lié à l’animal (2026-11-24)', () => {
    for (const sp of PLAYABLE) expect(GIFTS.filter((g) => g.species === sp.id && !g.use).length, sp.id).toBeGreaterThanOrEqual(1);
    const own = (id: string) => GIFTS.find((g) => g.id === id)!.species;
    expect([own('tug_rope'), own('hay'), own('bamboo'), own('birdhouse'), own('fish_bucket')]).toEqual(['lion', 'bison', 'giant_panda', 'owl', 'seal']);
  });

  it('seulement des jouets et des objets liés à l’animal : rien à porter ni à tenir, pas de coffre au trésor', () => {
    const offered = GIFTS.filter((g) => PLAYABLE.some((sp) => sp.allowedBiomes.some((b) => giftAllowed(g, sp.id, getBiome(b)))));
    expect(offered.length).toBe(39); // 30 jouets et objets gardés, le nichoir rendu à la chouette, 8 objets nouveaux
    for (const id of ['crown', 'cowboy_hat', 'glasses', 'sunglasses', 'slippers', 'flute', 'trumpet', 'guitar', 'book', 'teapot', 'treasure_chest', 'blanket', 'bench', 'tent', 'sun_umbrella', 'lantern'])
      expect(offered.some((g) => g.id === id), id).toBe(false);
    for (const id of ['ball', 'swing', 'kite', 'drum', 'teddy_bear', 'sandcastle', 'igloo', 'honey_pot', 'bucket', 'hammock', 'tug_rope', 'hay'])
      expect(offered.some((g) => g.id === id), id).toBe(true);
    // une couronne déjà reçue pendant les essais n'est plus posée par terre dans le décor
    const s = newGameState();
    const withCrown = { ...s, player: { ...s.player, gifts: [{ id: 'crown', speciesId: 'lion', spots: {} }] } };
    expect(giftsHere(withCrown, 'lion', savanna)).toEqual([]);
  });
});

describe('cadeaux du soir : cohérence avec le décor', () => {
  it('savane des lions : chaude, dehors ; le cerf-volant oui, la couronne (à porter), le coffre au trésor, le bonhomme de neige non', () => {
    const cl = placeClasses(savanna);
    expect(cl.has('warm') && cl.has('outdoor') && !cl.has('cold')).toBe(true);
    const ok = (id: string) => giftAllowed(GIFTS.find((g) => g.id === id)!, 'lion', savanna);
    expect(ok('sun_umbrella')).toBe(false); // ni jouet ni objet du lion
    expect(ok('treasure_chest')).toBe(false);
    expect(ok('ball')).toBe(true);
    expect(ok('tug_rope')).toBe(true); // la corde des lionceaux
    expect(ok('crown')).toBe(false); // se porte sur la tête : absurde posée par terre
    expect(ok('kite')).toBe(true);
    expect(ok('snowman')).toBe(false);
    expect(ok('igloo')).toBe(false); // objet des pingouins
  });

  it('pas de cerf-volant dans la grotte de glace, pas de grand objet sur une branche', () => {
    expect(placeClasses(getBiome('an_ice_cave')).has('outdoor')).toBe(false);
    for (const sp of PLAYABLE)
      for (const b of sp.allowedBiomes) {
        const biome = getBiome(b);
        const cl = placeClasses(biome);
        for (const g of GIFTS.filter((x) => giftAllowed(x, sp.id, biome))) {
          if (cl.has('perched')) expect(g.h, `${g.id} ${b}`).toBeLessThanOrEqual(BRANCH_MAX_H);
          if (g.where.includes('cold')) expect(cl.has('cold'), `${g.id} ${b}`).toBe(true);
          if (g.where.includes('warm')) expect(cl.has('cold'), `${g.id} ${b}`).toBe(false);
          if (g.where.includes('outdoor')) expect(b, g.id).not.toBe('an_ice_cave');
        }
      }
  });
});

describe('cadeaux du soir : un par jour', () => {
  it('trois paquets différents, stables, avec un objet propre à la famille', () => {
    const s = newGameState();
    const offer = giftOffer(s, 'lion', savanna, today)!;
    expect(offer).toHaveLength(3);
    expect(new Set(offer.map((g) => g.id)).size).toBe(3);
    expect(giftOffer(s, 'lion', savanna, today)!.map((g) => g.id)).toEqual(offer.map((g) => g.id));
    expect(offer.filter((g) => g.species === 'lion')).toHaveLength(1);
    expect(offer.every((g) => giftAllowed(g, 'lion', savanna))).toBe(true);
  });

  it('reçu : posé dans le décor, plus de paquets ce jour-là, jamais redonné', () => {
    let s = newGameState();
    const g = giftOffer(s, 'lion', savanna, today)![0]!;
    s = receiveGift(s, g.id, 'lion', savanna.id, { x: 40.123, y: 82 }, today);
    expect(s.player.giftDay).toBe(today);
    expect(s.player.gifts).toEqual([{ id: g.id, speciesId: 'lion', spots: { [savanna.id]: { x: 40.12, y: 82 } } }]);
    expect(giftOffer(s, 'lion', savanna, today)).toBeNull();
    expect(receiveGift(s, 'ball', 'lion', savanna.id, { x: 1, y: 1 }, today)).toBe(s);
    // les jours suivants, jamais le même objet pour la famille
    const ids = new Set([g.id]);
    for (let d = 25; d <= 30; d++) {
      const day = `2026-11-${d}`;
      const next = giftOffer(s, 'lion', savanna, day)!;
      expect(next.some((x) => ids.has(x.id))).toBe(false);
      s = receiveGift(s, next[0]!.id, 'lion', savanna.id, { x: 50, y: 80 }, day);
      ids.add(next[0]!.id);
    }
    expect(s.player.gifts).toHaveLength(7);
  });

  it('plus rien à offrir dans ce décor : pas de paquets', () => {
    let s = newGameState();
    let n = 0;
    for (let d = 0; d < 200; d++) {
      const offer = giftOffer(s, 'lion', savanna, `day-${d}`);
      if (!offer) break;
      s = receiveGift(s, offer[0]!.id, 'lion', savanna.id, { x: 50, y: 80 }, `day-${d}`);
      n++;
    }
    expect(n).toBe(GIFTS.filter((g) => giftAllowed(g, 'lion', savanna)).length);
    expect(giftOffer(s, 'lion', savanna, 'encore')).toBeNull();
  });

  it('déplacé au doigt : la place est gardée décor par décor ; il suit la famille là où il a du sens', () => {
    let s = receiveGift(newGameState(), 'kite', 'lion', savanna.id, { x: 30, y: 80 }, today);
    s = moveGift(s, 'kite', 'lion', savanna.id, { x: 61, y: 70 });
    expect(giftsHere(s, 'lion', savanna)).toEqual([{ def: GIFTS.find((g) => g.id === 'kite'), spot: { x: 61, y: 70 } }]);
    const other = getBiome(lion.allowedBiomes[1]!);
    expect(giftsHere(s, 'lion', other)[0]!.spot).toBeUndefined(); // place par défaut, choisie par la scène
    expect(giftsHere(s, 'giraffe', savanna)).toEqual([]);
    expect(moveGift(s, 'ball', 'lion', savanna.id, { x: 1, y: 1 })).toBe(s);
  });

  it('sauvegarde : les anciennes parties commencent sans cadeau ; les objets abîmés sont écartés', () => {
    const old = JSON.parse(JSON.stringify(newGameState())) as Record<string, any>;
    delete old.player.gifts;
    delete old.player.giftDay;
    expect(migrate(old)!.player.gifts).toEqual([]);
    expect(migrate(old)!.player.giftDay).toBeNull();
    old.player.gifts = [
      { id: 'kite', speciesId: 'lion', spots: { savanna: { x: 20, y: 80 }, bad: { x: 'a' } } },
      { id: 'kite', speciesId: 'lion', spots: {} },
      { id: 'inconnu', speciesId: 'lion' },
      'x',
    ];
    old.player.giftDay = today;
    expect(migrate(old)!.player.gifts).toEqual([{ id: 'kite', speciesId: 'lion', spots: { savanna: { x: 20, y: 80 } } }]);
    expect(migrate(old)!.player.giftDay).toBe(today);
    expect(parseGifts(null)).toEqual([]);
    // la couronne reçue pendant l'essai du 2026-11-24 est reprise, et l'enfant rouvre des paquets aujourd'hui
    old.player.gifts = [{ id: 'crown', speciesId: 'lion', spots: {} }, { id: 'kite', speciesId: 'lion', spots: {} }];
    expect(migrate(old)!.player.gifts.map((g) => g.id)).toEqual(['kite']);
    expect(migrate(old)!.player.giftDay).toBeNull();
    // de même le coffre au trésor du lion (essai du 2026-11-24)
    old.player.giftDay = today;
    old.player.gifts = [{ id: 'treasure_chest', speciesId: 'lion', spots: {} }];
    expect(migrate(old)!.player.gifts).toEqual([]);
    expect(migrate(old)!.player.giftDay).toBeNull();
  });
});
