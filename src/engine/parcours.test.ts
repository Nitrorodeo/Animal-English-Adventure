/**
 * Parcours complet, de bout en bout, sans micro (critères NAV-01, NAV-02, NAV-03, FAM-01 à FAM-04) :
 * nouvelle partie → Afrique → famille de lions → bébé → aventure jouée par le lecteur de scènes jusqu'au trésor
 * → sauvegarde → rechargement → Antarctique → manchot → bonjour, sans perdre ce qui était acquis.
 */
import { describe, expect, it } from 'vitest';
import { getSpecies, speciesOfContinent } from '../content/species';
import type { BiomeId, QuestScript } from '../content/types';
import { CONTINENTS, getBiome } from '../content/world';
import { applyQuestOutcome } from './events';
import { createBaby } from './family';
import { selectActivities, selectAdventures, type QuestContext } from './quests';
import { createRng } from './rng';
import { canAdvance, isFinished, runAction, startRun, type RunResult } from './runner';
import { loadGame, memoryStorage, saveGame } from './save';
import { getFamily, newGameState, withFamily, type ActorRef, type GameState } from './state';

/** Joue le script comme un enfant qui touche la bonne réponse (après une erreur si `mistakes`). */
function playScript(script: QuestScript, mistakes = 0) {
  let r: RunResult = startRun(script);
  for (let guard = 0; guard < 500 && !isFinished(script, r.state); guard++) {
    const step = script.steps[r.state.index]!;
    const act = (a: Parameters<typeof runAction>[2]) => (r = runAction(script, r.state, a));
    if (step.kind === 'ask') {
      const bad = step.options.findIndex((o) => !o.correct);
      if (mistakes && bad >= 0) act({ type: 'choose', option: bad });
      act({ type: 'choose', option: step.options.findIndex((o) => o.correct) });
    } else if (step.kind === 'tapAnchor' || step.kind === 'seek') {
      act({ type: 'tapAnchor', anchor: step.kind === 'seek' ? step.hideAt : step.anchor });
    } else if (step.kind === 'tapProps') {
      for (const t of step.targets) act({ type: 'tapProp', prop: t });
    } else if (step.kind === 'tapActor') {
      act({ type: 'tapActor', who: ['actor', step.target] });
    } else if (step.kind === 'command') {
      step.options.forEach((o, i) => {
        if (o.action && r.state.feedback !== 'ok') act({ type: 'choose', option: i });
      });
    }
    expect(canAdvance(script, r.state), `${script.id} bloqué à l'étape ${r.state.index} (${step.kind})`).toBe(true);
    act({ type: 'advance' });
  }
  expect(isFinished(script, r.state), `${script.id} jamais terminé`).toBe(true);
  return r.state;
}

function ctx(state: GameState, speciesId: string, biomeId: BiomeId, actor: ActorRef): QuestContext {
  return { state, species: getSpecies(speciesId), biome: getBiome(biomeId), actor, rng: createRng(7) };
}

describe('parcours complet de la joueuse', () => {
  it('chaque continent propose au moins une espèce, et chaque espèce au moins une activité dans chacun de ses lieux', () => {
    for (const c of CONTINENTS) {
      const species = speciesOfContinent(c.id);
      expect(species.length, c.id).toBeGreaterThan(0);
      for (const sp of species)
        for (const b of sp.allowedBiomes) {
          const father: ActorRef = { speciesId: sp.id, kind: 'adult', role: 'father' };
          expect(selectActivities(ctx(newGameState(), sp.id, b as BiomeId, father)).length, `${sp.id} @ ${b}`).toBeGreaterThan(0);
        }
    }
  });

  it('Afrique → lions → bébé → aventure jusqu au trésor → sauvegarde → Antarctique sans rien perdre', () => {
    const storage = memoryStorage();
    let state = newGameState();

    // 1. famille de lions : papa et maman, un bébé fille, puis un garçon, pas de troisième
    const lion = getSpecies('lion');
    let fam = getFamily(state, 'lion');
    const girl = createBaby(fam, 'girl', 'Kiara', 'b-girl');
    expect(girl.ok).toBe(true);
    if (!girl.ok) return;
    fam = girl.family;
    const boy = createBaby(fam, 'girl', 'Kion', 'b-boy');
    expect(boy.ok, 'le deuxième bébé est forcément de l autre sexe').toBe(false);
    const boy2 = createBaby(fam, 'boy', 'Kion', 'b-boy');
    expect(boy2.ok).toBe(true);
    if (!boy2.ok) return;
    fam = boy2.family;
    expect(createBaby(fam, 'girl', 'Nala', 'b-3').ok, 'pas de troisième bébé').toBe(false);
    state = withFamily(state, fam);

    // 2. aventure du lieu de départ, jouée en entier par le lecteur de scènes (avec une erreur à chaque question)
    const start = lion.allowedBiomes[0] as BiomeId;
    const mother: ActorRef = { speciesId: 'lion', kind: 'adult', role: 'mother' };
    const offers = selectAdventures(ctx(state, 'lion', start, mother));
    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0]!;
    const run = playScript(offer.script, 1);
    expect(run.answers.length).toBeGreaterThan(0);
    expect(run.answers.every((a) => a.correct)).toBe(true);

    const out = applyQuestOutcome(state, { script: offer.script, mechanic: 'adventure', actor: mother, answers: run.answers, continentId: 'africa', choice: offer.adventure.id });
    state = out.state;
    expect(out.events.treasure, 'trésor gagné').toBe(offer.adventure.treasure);
    expect(state.player.treasures).toContain(offer.adventure.treasure);
    expect(state.player.visitedContinents).toContain('africa');
    const learned = Object.keys(state.player.items);
    expect(learned.length).toBeGreaterThan(0);

    // 3. on quitte, on revient : tout est retrouvé
    expect(saveGame(storage, state)).toBe(true);
    const reloaded = loadGame(storage);
    expect(reloaded.status).toBe('loaded');
    state = reloaded.state;
    expect(getFamily(state, 'lion').babies.map((b) => b.name)).toEqual(['Kiara', 'Kion']);
    expect(state.player.treasures).toContain(offer.adventure.treasure);

    // 4. autre continent, autre espèce : on dit bonjour, l'acquis d'Afrique est gardé
    const penguin = getSpecies('penguin');
    const pFather: ActorRef = { speciesId: 'penguin', kind: 'adult', role: 'father' };
    const acts = selectActivities(ctx(state, 'penguin', penguin.allowedBiomes[0] as BiomeId, pFather));
    expect(acts.length).toBeGreaterThan(0);
    const hello = acts.find((a) => a.archetype.id === 'greeting') ?? acts[0]!;
    const run2 = playScript(hello.script);
    state = applyQuestOutcome(state, { script: hello.script, mechanic: hello.archetype.mechanic, actor: pFather, answers: run2.answers, teach: hello.teach, continentId: 'antarctica' }).state;
    expect(state.player.visitedContinents).toEqual(expect.arrayContaining(['africa', 'antarctica']));
    for (const item of learned) expect(state.player.items[item], `acquis gardé : ${item}`).toBeDefined();
    expect(getFamily(state, 'lion').babies).toHaveLength(2);
  });
});
