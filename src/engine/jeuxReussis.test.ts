import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { clipFor } from '../audio/clips';
import { ARCHETYPES } from '../content/archetypes';
import { say } from '../content/utterances';
import { SPECIES, getSpecies } from '../content/species';
import { getBiome } from '../content/world';
import type { QuestScript } from '../content/types';
import { applyQuestOutcome } from './events';
import { actorGames, buildQuest, selectActivities, selectAdventures, type QuestContext } from './quests';
import { createRng } from './rng';
import { migrate } from './save';
import type { AnswerRecord } from './skills';
import { gameDone, gameKey, newGameState, type ActorRef, type GameState } from './state';

/** Cartes des jeux réussies, en vert avec une coche (« qu'elle sache où elle en est dans chaque animal », 2026-11-25). */

const father: ActorRef = { speciesId: 'lion', kind: 'adult', role: 'father' };
const mother: ActorRef = { speciesId: 'lion', kind: 'adult', role: 'mother' };
const ctx = (state: GameState, actor: ActorRef): QuestContext => ({ state, species: getSpecies('lion'), biome: getBiome('africa_baobab'), actor, rng: createRng(1) });
const answers = (script: QuestScript): AnswerRecord[] =>
  script.steps.flatMap((s) => (s.kind === 'ask' || s.kind === 'tapAnchor' || s.kind === 'tapProps' || s.kind === 'seek' ? [{ items: s.items, correct: true, aided: false }] : []));
const finish = (state: GameState, script: QuestScript, mechanic: string, actor: ActorRef) =>
  applyQuestOutcome(state, { script, mechanic, actor, answers: answers(script), continentId: 'africa' }).state;

describe('jeux réussis avec chaque animal', () => {
  it('un jeu terminé est retenu pour CET animal seulement', () => {
    const s0 = newGameState();
    const game = selectActivities(ctx(s0, father))[0]!;
    expect(gameDone(s0, father, game.archetype.id)).toBe(false);
    const s1 = finish(s0, game.script, game.archetype.mechanic, father);
    expect(gameDone(s1, father, game.archetype.id)).toBe(true);
    expect(gameDone(s1, mother, game.archetype.id)).toBe(false); // Maman n'a pas encore joué à ce jeu
    expect(s1.player.gamesDone[gameKey(father, game.archetype.id)]).toBe(1);
    const s2 = finish(s1, game.script, game.archetype.mechanic, father);
    expect(s2.player.gamesDone[gameKey(father, game.archetype.id)]).toBe(2);
  });

  it('reste retenu au-delà des 10 derniers jeux de l’historique', () => {
    let s = newGameState();
    const first = selectActivities(ctx(s, father))[0]!;
    s = finish(s, first.script, first.archetype.mechanic, father);
    for (let i = 0; i < 12; i++) {
      const other = selectActivities(ctx(s, mother))[0]!;
      s = finish(s, other.script, other.archetype.mechanic, mother);
    }
    expect(s.player.history.some((h) => h.actorId === 'lion:father')).toBe(false);
    expect(gameDone(s, father, first.archetype.id)).toBe(true);
  });

  it('une aventure garde son propre compteur (pas compté comme un jeu)', () => {
    const s0 = newGameState();
    const adv = selectAdventures(ctx(s0, father))[0];
    expect(adv).toBeDefined();
    const s1 = finish(s0, adv!.script, 'adventure', father);
    expect(s1.player.adventuresDone[adv!.adventure.id]).toBe(1);
    expect(s1.player.gamesDone).toEqual({});
  });

  it('sauvegarde : relu tel quel, absent = rien de fait, valeurs abîmées écartées', () => {
    const base = newGameState();
    const saved = { ...base, player: { ...base.player, gamesDone: { 'lion:father|greeting': 2, bad: 'x', nan: null } } };
    expect(migrate(JSON.parse(JSON.stringify(saved)))!.player.gamesDone).toEqual({ 'lion:father|greeting': 2 });
    const { gamesDone: _gone, ...old } = base.player;
    expect(migrate({ ...base, player: old })!.player.gamesDone).toEqual({});
  });
});

describe('menu des jeux', () => {
  const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
  const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

  it('les cartes réussies passent en vert avec une coche (jeux, aventures ici et ailleurs)', () => {
    expect(src).toContain("isDone={(id) => gameDone(state, menuFor, id)}");
    expect(src).toContain("className={`option${isDone(a.archetype.id) ? ' played' : ''}`}");
    expect(src.match(/<DoneCheck \/>/g)).toHaveLength(3);
    expect(css).toMatch(/\.option\.played \.option-main, \.option\.adv\.done \.option-main \{ border-color: #3fae5f;/);
    expect(css).toContain('.done-check {');
  });
});

describe('ligne de progression de chaque animal (« ✓ 3 / 15 games with Leo »)', () => {
  const lion = getSpecies('lion');

  it('liste tous les jeux possibles avec cet animal, sans doublon, aucun encore fait au début', () => {
    const s0 = newGameState();
    const games = actorGames(s0, lion, father);
    expect(games.length).toBeGreaterThanOrEqual(10);
    expect(new Set(games.map((g) => g.id)).size).toBe(games.length);
    expect(games.every((g) => !g.done && g.icon && g.titleEn && g.titleFr)).toBe(true);
    // chaque jeu de la liste peut vraiment être proposé avec ce personnage, dans l'un de ses lieux
    for (const g of games) {
      const arch = ARCHETYPES.find((a) => a.id === g.id)!;
      expect(lion.allowedBiomes.some((b) => buildQuest(arch, { ...ctx(s0, father), biome: getBiome(b) })), g.id).toBe(true);
    }
    // Papa et Maman n'ont pas les mêmes jeux
    expect(actorGames(s0, lion, mother).map((g) => g.id)).not.toEqual(games.map((g) => g.id));
  });

  it('tous les jeux proposés dans le menu figurent dans la ligne', () => {
    const s0 = newGameState();
    const ids = new Set(actorGames(s0, lion, father).map((g) => g.id));
    for (const b of lion.allowedBiomes) {
      for (const a of selectActivities({ ...ctx(s0, father), biome: getBiome(b) }, 99)) expect(ids.has(a.archetype.id)).toBe(true);
    }
  });

  it('un jeu réussi se coche dans la ligne, pour cet animal seulement ; le compte suit', () => {
    const s0 = newGameState();
    const game = selectActivities(ctx(s0, father))[0]!;
    const s1 = finish(s0, game.script, game.archetype.mechanic, father);
    const games = actorGames(s1, lion, father);
    expect(games.filter((g) => g.done).map((g) => g.id)).toEqual([game.archetype.id]);
    expect(actorGames(s1, lion, mother).some((g) => g.done)).toBe(false);
    expect(games.length).toBe(actorGames(s0, lion, father).length); // la liste ne bouge pas d'un jeu à l'autre
  });

  it('chaque espèce a des jeux avec Papa et Maman, et chaque titre est enregistré (🔊 en touchant l’icône)', () => {
    const s0 = newGameState();
    for (const sp of SPECIES) {
      for (const role of ['father', 'mother'] as const) {
        const games = actorGames(s0, sp, { speciesId: sp.id, kind: 'adult', role });
        expect(games.length, `${sp.id}/${role}`).toBeGreaterThan(5);
        for (const g of games) expect(clipFor(say.cardTitle(g.titleEn), undefined, []), g.titleEn).toBeDefined();
      }
    }
  });

  it('le menu affiche la ligne et ses icônes cochées', () => {
    const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(src).toContain('progress: actorGames(state, species, menuFor)');
    expect(src).toContain('progress={menu.progress}');
    expect(src).toContain('{doneCount} / {progress.length} games with {name}');
    expect(src).toContain("className={`gp-icon${g.done ? ' done' : ''}`}");
    for (const rule of ['.games-progress {', '.gp-count {', '.gp-icon {', '.gp-icon.done {', '.gp-check {']) expect(css).toContain(rule);
  });
});
