/**
 * Chacun ses jeux (demande du parent, 2026-11-24) : Papa, Maman, la fille et le garçon ne reçoivent plus
 * le même menu de jeux. Rôle, personnalité, sexe et stade du bébé départagent les jeux.
 */
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../content/species';
import { getBiome } from '../content/world';
import type { BiomeId, GrowthStage, QuestScript } from '../content/types';
import { applyQuestOutcome } from './events';
import { createBaby } from './family';
import type { AnswerRecord } from './skills';
import { actorAffinity, buildQuest, hashText, selectActivities, type QuestContext } from './quests';
import { ARCHETYPES } from '../content/archetypes';
import { createRng } from './rng';
import { actorId, getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';

const FAMILIES = SPECIES.filter((s) => s.playable && s.familyReady);

function withBabies(speciesId: string, stage: GrowthStage): GameState {
  let fam = getFamily(newGameState(), speciesId);
  const a = createBaby(fam, 'girl', 'Mia', 'girl1');
  if (!a.ok) throw new Error(a.error);
  const b = createBaby(a.family, 'boy', 'Tom', 'boy1');
  if (!b.ok) throw new Error(b.error);
  fam = { ...b.family, babies: b.family.babies.map((x) => ({ ...x, stage })) };
  return withFamily(newGameState(), fam);
}

const menuOf = (st: GameState, speciesId: string, place: BiomeId, actor: ActorRef, seed: number) =>
  selectActivities({ state: st, species: FAMILIES.find((s) => s.id === speciesId)!, biome: getBiome(place), actor, rng: createRng(seed + hashText(JSON.stringify(actor))), need: null }).map((x) => x.archetype.id).join('|');

describe('chacun ses jeux', () => {
  it('le tirage de chaque personnage est distinct, même pour des prénoms de même longueur', () => {
    expect(hashText('lion:baby:girl1')).not.toBe(hashText('lion:baby:boy1'));
    expect(hashText('lion:father')).not.toBe(hashText('lion:mother'));
    expect(hashText('lion:father')).toBe(hashText('lion:father'));
  });

  it("Papa aime les jeux d'exploration, Maman les jeux d'observation et de soin", () => {
    const sp = FAMILIES.find((s) => s.id === 'lion')!;
    const st = withBabies('lion', 'young');
    const base = (role: 'father' | 'mother'): Omit<QuestContext, 'actor'> & { actor: ActorRef } => ({ state: st, species: sp, biome: getBiome(sp.allowedBiomes[0]!), actor: { speciesId: 'lion', kind: 'adult', role }, rng: createRng(1), need: null });
    const guide = ARCHETYPES.find((x) => x.id === 'follow_tracks')!;
    const feel = ARCHETYPES.find((x) => x.id === 'feelings')!;
    const point = (id: string, role: 'father' | 'mother') => {
      const c = base(role);
      const arch = ARCHETYPES.find((x) => x.id === id)!;
      const q = buildQuest(arch, c);
      return q ? actorAffinity(q, c) : null;
    };
    expect(guide.mechanic).toBe('guide');
    expect(feel.mechanic).toBe('social');
    // « What is happening? » est un jeu de Papa seulement ; « Good night! » est un jeu de Maman seulement
    expect(point('compare_objects', 'father')).toBeGreaterThan(0);
    expect(point('bedtime', 'mother')).toBeGreaterThan(0);
  });

  describe.each(FAMILIES.map((s) => [s.id, s.allowedBiomes[0] as BiomeId] as const))('menus des quatre personnages — %s', (speciesId, place) => {
    for (const stage of ['little', 'young'] as GrowthStage[]) {
      it(`stade ${stage} : les quatre menus ne sont pas identiques, et Papa ≠ Maman le plus souvent`, () => {
        const st = withBabies(speciesId, stage);
        const actors: ActorRef[] = [
          { speciesId, kind: 'adult', role: 'father' },
          { speciesId, kind: 'adult', role: 'mother' },
          { speciesId, kind: 'baby', babyId: 'girl1' },
          { speciesId, kind: 'baby', babyId: 'boy1' },
        ];
        let allSame = 0;
        let parentsDiffer = 0;
        const N = 12;
        for (let seed = 0; seed < N; seed++) {
          const m = actors.map((a) => menuOf(st, speciesId, place, a, seed));
          if (new Set(m).size === 1) allSame++;
          if (m[0] !== m[1]) parentsDiffer++;
        }
        expect(allSame).toBe(0);
        expect(parentsDiffer).toBeGreaterThanOrEqual(N / 2);
      });
    }
  });

  it('frère et sœur ne proposent presque jamais le même menu (toutes familles, trois stades)', () => {
    let same = 0;
    const where: string[] = [];
    for (const sp of FAMILIES)
      for (const stage of ['newborn', 'little', 'young'] as GrowthStage[]) {
        const base = withBabies(sp.id, stage);
        const fam = getFamily(base, sp.id);
        const st: GameState = { ...withFamily(base, { ...fam, memories: ['met_family'] }), player: { ...base.player, activityCounter: 1, history: [{ archetypeId: 'greeting', speciesId: sp.id, actorId: 'none', mechanic: 'talk', at: 0 }] } };
        const m = (['girl1', 'boy1'] as const).map((id) => menuOf(st, sp.id, sp.allowedBiomes[0] as BiomeId, { speciesId: sp.id, kind: 'baby', babyId: id }, 42).split('|').sort().join('|'));
        if (m[0] === m[1]) { same++; where.push(`${sp.id}/${stage}`); }
      }
    expect(same, where.join(', ')).toBeLessThanOrEqual(3);
  });

  /**
   * « Pas de répétition… pour pas que l'enfant s'ennuie » (parent, 2026-11-24) : chaque soir, une partie avec
   * un personnage. On joue 15 soirs de suite la première carte proposée, dans les décors de la famille, tour à tour.
   */
  const answersFor = (script: QuestScript): AnswerRecord[] =>
    script.steps.flatMap((s) => (s.kind === 'ask' || s.kind === 'tapAnchor' || s.kind === 'tapProps' || s.kind === 'seek' || s.kind === 'tapActor' ? [{ items: s.items, correct: true, aided: false }] : []));
  describe.each(FAMILIES.map((s) => [s.id] as const))('15 soirs de suite sans s’ennuyer — %s', (speciesId) => {
    const sp = FAMILIES.find((s) => s.id === speciesId)!;
    const who: [string, ActorRef, number][] = [
      ['Papa', { speciesId, kind: 'adult', role: 'father' }, 8],
      ['Maman', { speciesId, kind: 'adult', role: 'mother' }, 8],
      ['la fille', { speciesId, kind: 'baby', babyId: 'girl1' }, 6],
      ['le garçon', { speciesId, kind: 'baby', babyId: 'boy1' }, 6],
    ];
    it.each(who)('%s : jamais deux fois de suite le même jeu, et des jeux variés', (_n, actor, minDistinct) => {
      let st = withBabies(speciesId, 'newborn');
      const seq: string[] = [];
      for (let i = 0; i < 15; i++) {
        const place = sp.allowedBiomes[i % sp.allowedBiomes.length]!;
        const top = selectActivities({ state: st, species: sp, biome: getBiome(place), actor, rng: createRng(42 + st.player.activityCounter * 31 + hashText(actorId(actor))), need: null })[0]!;
        seq.push(top.archetype.id);
        st = applyQuestOutcome(st, { script: top.script, mechanic: top.archetype.mechanic, actor, answers: answersFor(top.script), teach: top.teach, continentId: getBiome(place).continentId }).state;
      }
      for (let i = 1; i < seq.length; i++) expect(seq[i], `${speciesId} soir ${i + 1} : ${seq.join(', ')}`).not.toBe(seq[i - 1]);
      expect(new Set(seq).size, seq.join(', ')).toBeGreaterThanOrEqual(minDistinct);
    });
  });
});
