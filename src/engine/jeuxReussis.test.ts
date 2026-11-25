import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { getSpecies } from '../content/species';
import { getBiome } from '../content/world';
import type { QuestScript } from '../content/types';
import { applyQuestOutcome } from './events';
import { selectActivities, selectAdventures, type QuestContext } from './quests';
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
