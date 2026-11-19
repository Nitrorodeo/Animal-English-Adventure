/**
 * Pilote Afrique (2026-11-19) : jeux propres aux décors, jeux différents selon Papa, Maman
 * ou les bébés, croissance des bébés qui ouvre de nouveaux jeux, nouvelles mécaniques
 * (ordres, empreintes dans l'ordre, nuit, habits portés, photos).
 */
import { describe, expect, it } from 'vitest';
import { archetypeFits, ARCHETYPES, getArchetype, unlockedAt } from '../content/archetypes';
import { command, L, prop, props, scene, skyProp, tap, tapProps } from '../content/activities/kit';
import { getSpecies, SPECIES } from '../content/species';
import { GROWTH_STAGES, type GrowthStage, type QuestScript, type QuestStep } from '../content/types';
import { getBiome } from '../content/world';
import { applyQuestOutcome } from './events';
import { createBaby, favouriteMechanics, growthPercent } from './family';
import { buildQuest, selectActivities, selectAdventures, type QuestContext } from './quests';
import { createRng } from './rng';
import { canAdvance, runAction, startRun, revealTarget, type RunResult } from './runner';
import { migrate } from './save';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';

const AFRICA_PLACES = ['savanna', 'africa_waterhole', 'africa_baobab', 'africa_desert', 'africa_canyon', 'africa_plains'];
const AFRICANS = SPECIES.filter((s) => s.continentId === 'africa');

function withBaby(speciesId: string, stage: GrowthStage, n: 1 | 2 = 1): GameState {
  let fam = getFamily(newGameState(), speciesId);
  const r1 = createBaby(fam, 'girl', 'Mia', 'b1');
  if (!r1.ok) throw new Error(r1.error);
  fam = r1.family;
  if (n === 2) {
    const r2 = createBaby(fam, 'boy', 'Tom', 'b2');
    if (!r2.ok) throw new Error(r2.error);
    fam = r2.family;
  }
  return withFamily(newGameState(), { ...fam, babies: fam.babies.map((b) => ({ ...b, stage })) });
}

const ctx = (state: GameState, speciesId: string, placeId: string, actor: ActorRef): QuestContext => ({ state, species: getSpecies(speciesId), biome: getBiome(placeId), actor, rng: createRng(3) });
const father = (speciesId: string): ActorRef => ({ speciesId, kind: 'adult', role: 'father' });
const mother = (speciesId: string): ActorRef => ({ speciesId, kind: 'adult', role: 'mother' });
const baby = (speciesId: string): ActorRef => ({ speciesId, kind: 'baby', babyId: 'b1' });

/** Jeux que ce personnage peut proposer ici (tous les jeux constructibles, pas seulement les 3 du menu). */
const offered = (state: GameState, speciesId: string, placeId: string, actor: ActorRef) =>
  new Set(ARCHETYPES.filter((a) => buildQuest(a, ctx(state, speciesId, placeId, actor))).map((a) => a.id));

const script = (steps: QuestStep[]): QuestScript => ({ id: 'test', archetypeId: 'test', speciesId: 'lion', biomeId: 'savanna', actorKind: 'adult', tier: 'beginner', steps });

describe('Papa, Maman et les bébés ne proposent pas les mêmes jeux', () => {
  it('dans chaque décor d’Afrique, Papa et Maman ont des jeux à eux', () => {
    const state = withBaby('lion', 'companion', 2);
    for (const sp of AFRICANS) {
      for (const p of sp.allowedBiomes) {
        const f = offered(state, sp.id, p, father(sp.id));
        const m = offered(state, sp.id, p, mother(sp.id));
        expect([...f].some((id) => !m.has(id)), `${sp.id}@${p} : Papa`).toBe(true);
        expect([...m].some((id) => !f.has(id)), `${sp.id}@${p} : Maman`).toBe(true);
        expect(f.has('bedtime'), `${sp.id}@${p}`).toBe(false);
        expect(m.has('simon_says'), `${sp.id}@${p}`).toBe(false);
      }
    }
  });

  it('un nouveau-né ne propose que des jeux simples ; il en débloque en grandissant', () => {
    const seen: Record<string, Set<string>> = {};
    for (const stage of GROWTH_STAGES) seen[stage] = offered(withBaby('lion', stage, 2), 'lion', 'africa_plains', baby('lion'));
    expect(seen.newborn!.has('feelings')).toBe(false);
    expect(seen.newborn!.has('race')).toBe(false);
    expect(seen.little!.has('feelings')).toBe(true);
    expect(seen.little!.has('race')).toBe(false);
    expect(seen.young!.has('race')).toBe(true);
    // jamais un jeu perdu en grandissant
    for (let i = 1; i < GROWTH_STAGES.length; i++) for (const id of seen[GROWTH_STAGES[i - 1]!]!) expect(seen[GROWTH_STAGES[i]!]!.has(id), `${id} à ${GROWTH_STAGES[i]}`).toBe(true);
    expect(seen.companion!.size).toBeGreaterThan(seen.newborn!.size + 3);
  });

  it('la carte « je suis plus grand » annonce des jeux à chaque stade', () => {
    for (const st of ['little', 'young', 'companion'] as const) expect(unlockedAt(st).length, st).toBeGreaterThan(0);
    expect(unlockedAt('little').map((a) => a.id)).toContain('feelings');
    expect(archetypeFits(getArchetype('race'), 'baby', undefined, 'little')).toBe(false);
    expect(archetypeFits(getArchetype('race'), 'baby', undefined, 'young')).toBe(true);
  });
});

describe('jeux propres aux décors', () => {
  const state = withBaby('lion', 'companion');
  it('chaque décor d’Afrique a au moins un jeu qu’on ne trouve que là (ou presque)', () => {
    for (const p of AFRICA_PLACES) {
      const all = new Set([...offered(state, 'lion', p, father('lion')), ...offered(state, 'lion', p, mother('lion')), ...offered(state, 'lion', p, baby('lion'))]);
      const local = [...all].filter((id) => getArchetype(id).allowedBiomes.length > 0 && getArchetype(id).allowedBiomes.length < AFRICA_PLACES.length);
      expect(local.length, p).toBeGreaterThan(0);
    }
  });

  it('dans le menu, le jeu propre au lieu passe devant les jeux de tout le continent', () => {
    const st = withFamily(state, { ...getFamily(state, 'lion'), memories: ['met_family'] });
    const menu = (p: string, a: ActorRef) => selectActivities(ctx(st, 'lion', p, a)).map((x) => x.archetype.id);
    expect(menu('africa_waterhole', mother('lion'))).toContain('who_in_water');
    expect(menu('africa_baobab', mother('lion'))).toContain('baobab_nest');
    expect(menu('africa_canyon', father('lion'))).toContain('echo_canyon');
  });

  it('chaque lieu d’Afrique a son aventure, proposée en premier quand on y est', () => {
    for (const sp of AFRICANS) {
      for (const p of sp.allowedBiomes) {
        const advs = selectAdventures(ctx(withBaby(sp.id, 'little', 2), sp.id, p, father(sp.id)));
        expect(advs[0]?.adventure.start, `${sp.id}@${p}`).toBe(p);
      }
    }
  });

  it('au baobab, Papa a un jeu à lui (« Catch the leaves! »), quelle que soit l’espèce', () => {
    for (const sp of AFRICANS) {
      const st = withBaby(sp.id, 'companion');
      const fam = withFamily(st, { ...getFamily(st, sp.id), memories: ['met_family'] });
      expect(offered(fam, sp.id, 'africa_baobab', father(sp.id)).has('windy_baobab'), sp.id).toBe(true);
      expect(selectActivities(ctx(fam, sp.id, 'africa_baobab', father(sp.id))).map((x) => x.archetype.id), sp.id).toContain('windy_baobab');
      expect(offered(fam, sp.id, 'africa_baobab', mother(sp.id)).has('windy_baobab'), sp.id).toBe(false);
    }
  });

  it('le nid seulement au baobab, l’écho seulement au canyon, les animaux de l’eau seulement près de l’eau', () => {
    for (const p of AFRICA_PLACES) {
      expect(offered(state, 'lion', p, mother('lion')).has('baobab_nest'), p).toBe(p === 'africa_baobab');
      expect(offered(state, 'lion', p, father('lion')).has('echo_canyon'), p).toBe(p === 'africa_canyon');
      expect(offered(state, 'lion', p, mother('lion')).has('who_in_water'), p).toBe(p === 'africa_waterhole' || p === 'savanna');
    }
  });

  it('seul un animal qui sait grimper monte sur le rocher', () => {
    expect(offered(state, 'lion', 'africa_canyon', father('lion')).has('climb_rock')).toBe(true);
    const ele = withBaby('elephant', 'companion');
    expect(offered(ele, 'elephant', 'africa_canyon', father('elephant')).has('climb_rock')).toBe(false);
    const gir = withBaby('giraffe', 'companion');
    expect(offered(gir, 'giraffe', 'africa_desert', father('giraffe')).has('climb_rock')).toBe(false);
  });

  it('les jeux d’Afrique ne sont jamais proposés sur un autre continent', () => {
    const panda = withBaby('giant_panda', 'companion');
    const sp = getSpecies('giant_panda');
    for (const p of sp.allowedBiomes) for (const id of ['simon_says', 'bedtime', 'photo', 'feelings']) expect(offered(panda, 'giant_panda', p, mother('giant_panda')).has(id) || offered(panda, 'giant_panda', p, father('giant_panda')).has(id), `${id}@${p}`).toBe(false);
  });
});

describe('nouvelles mécaniques du lecteur de scènes', () => {
  const act = (s: QuestScript, r: RunResult, a: Parameters<typeof runAction>[2]) => runAction(s, r.state, a);

  it('« Tu es le chef » : un ordre impossible fait rire sans compter, les autres comptent', () => {
    const s = script([
      command('actor', 'Tell me!', 'Dis-moi !', [
        { line: L('Fly!', 'Vole !'), icon: '🪽', reply: L("I can't fly!", 'Je ne sais pas voler !') },
        { line: L('Jump!', 'Saute !'), icon: '🦘', reply: L("I'm jumping!", 'Je saute !'), action: 'jump' },
        { line: L('Run!', 'Cours !'), icon: '🏃', reply: L("I'm running!", 'Je cours !'), action: 'run' },
      ], 2, ['jump', 'run']),
    ]);
    let r = startRun(s);
    r = act(s, r, { type: 'choose', option: 0 });
    expect(r.state.tapped).toEqual([]);
    expect(r.state.wrong).toBe(0);
    expect(r.say.map((u) => u.line.en)).toEqual(['Fly!', "I can't fly!"]);
    r = act(s, r, { type: 'choose', option: 1 });
    expect(r.state.acting?.action).toBe('jump');
    expect(canAdvance(s, r.state)).toBe(false);
    r = act(s, r, { type: 'choose', option: 1 }); // même ordre deux fois : ne compte qu'une fois
    expect(r.state.tapped).toHaveLength(1);
    r = act(s, r, { type: 'choose', option: 2 });
    expect(r.state.feedback).toBe('ok');
    expect(canAdvance(s, r.state)).toBe(true);
  });

  it('empreintes dans l’ordre : un pas de travers donne l’indice, l’aide montre la suivante', () => {
    const s = script([props([prop('a', 'footprint', 0), prop('b', 'footprint', 1), prop('c', 'footprint', 2)]), tapProps('actor', 'Follow!', 'Suis !', ['a', 'b', 'c'], ['Start on the left!', 'Commence à gauche !'], ['footprints'], { ordered: true })]);
    let r = act(s, startRun(s), { type: 'advance' });
    r = act(s, r, { type: 'tapProp', prop: 'b' });
    expect(r.state.tapped).toEqual([]);
    expect(r.state.feedback).toBe('try');
    r = act(s, r, { type: 'tapProp', prop: 'c' });
    expect(revealTarget(s, r.state)?.props).toEqual(['a']);
    for (const p of ['a', 'b', 'c']) r = act(s, r, { type: 'tapProp', prop: p });
    expect(r.state.feedback).toBe('ok');
  });

  it('la nuit tombe puis le jour revient ; les étoiles vont dans le ciel', () => {
    const s = script([scene(true), props([skyProp('s1', 'star', 0)]), scene(false)]);
    let r = startRun(s);
    expect(r.state.night).toBe(true);
    r = act(s, r, { type: 'advance' });
    expect(r.state.props[0]?.sky).toBe(true);
    r = act(s, r, { type: 'advance' });
    expect(r.state.night).toBe(false);
  });

  it('les habits touchés sont portés par le personnage ; la photo est rangée', () => {
    const s = script([props([prop('hat', 'hat', 0), prop('coat', 'coat', 2)]), tapProps('actor', 'Hat!', 'Chapeau !', ['hat'], ['Hat!', 'Chapeau !'], ['hat'], { wear: 'actor' }), tap('actor', 'Photo!', 'Photo !', 'acacia', ['Tree!', 'Arbre !'], ['photo'], { photo: true })]);
    let r = act(s, startRun(s), { type: 'advance' });
    r = act(s, r, { type: 'tapProp', prop: 'hat' });
    expect(r.state.wearing.actor).toEqual(['hat']);
    r = act(s, r, { type: 'advance' });
    r = act(s, r, { type: 'tapAnchor', anchor: 'acacia' });
    expect(r.state.photos).toEqual(['acacia']);
    expect(r.state.wearing.actor).toEqual(['hat']); // toujours porté
  });
});

describe('album photo, goûts et croissance', () => {
  it('une photo réussie va dans l’album ; le bébé aime les jeux qu’il refait', () => {
    let state = withBaby('lion', 'little');
    const s: QuestScript = { ...script([tap('actor', 'Photo!', 'Photo !', 'acacia', ['Tree!', 'Arbre !'], ['photo'], { photo: true })]), actorKind: 'baby' };
    const out = applyQuestOutcome(state, { script: s, mechanic: 'plan', actor: baby('lion'), answers: [{ items: ['photo'], correct: true, aided: false }], continentId: 'africa' });
    expect(out.state.player.photos).toEqual(['savanna:acacia']);
    expect(out.events.photos).toEqual(['savanna:acacia']);
    state = applyQuestOutcome(out.state, { script: s, mechanic: 'plan', actor: baby('lion'), answers: [], continentId: 'africa' }).state;
    expect(state.player.photos).toEqual(['savanna:acacia']); // pas de doublon
    const b = getFamily(state, 'lion').babies[0]!;
    expect(b.likes?.plan).toBe(2);
    expect(favouriteMechanics(b)).toEqual(['plan']);
  });

  it('la barre de croissance part de 0 et vaut 1 au dernier stade', () => {
    const b = getFamily(withBaby('lion', 'newborn'), 'lion').babies[0]!;
    expect(growthPercent(b)).toBe(0);
    expect(growthPercent({ ...b, seenItems: ['a', 'b', 'c'] })).toBeGreaterThan(0);
    expect(growthPercent({ ...b, stage: 'companion' })).toBe(1);
  });

  it('une ancienne sauvegarde sans album ni goûts se charge', () => {
    const old = JSON.parse(JSON.stringify(withBaby('lion', 'little'))) as Record<string, unknown> & { player: Record<string, unknown> };
    delete old.player.photos;
    const st = migrate(old)!;
    expect(st.player.photos).toEqual([]);
    expect(favouriteMechanics({ ...getFamily(st, 'lion').babies[0]!, likes: undefined })).toEqual([]);
  });
});
