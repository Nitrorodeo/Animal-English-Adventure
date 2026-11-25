import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { clipFor } from '../audio/clips';
import { ARCHETYPES } from '../content/archetypes';
import { PLACES } from '../content/places';
import { SPECIES, getSpecies } from '../content/species';
import { NEW_GAME_WISH, say } from '../content/utterances';
import { getBiome } from '../content/world';
import type { QuestScript } from '../content/types';
import { fill, stepUtterances } from './dialogue';
import { applyQuestOutcome } from './events';
import { createBaby } from './family';
import { nameOf, originalName, renameActor, withParentNames } from './names';
import { actorGames, buildQuest, familyProgress, metSpecies, selectActivities, type QuestContext } from './quests';
import { createRng } from './rng';
import { migrate } from './save';
import type { AnswerRecord } from './skills';
import { activityVariants, STRUCTURAL_CONFIGS, voiceOfSpeaker } from './variants';
import { gameKey, getFamily, newGameState, variableNames, withFamily, type ActorRef, type GameState } from './state';

/**
 * Demande du 2026-11-25 : « Toutes tes idées sont super bonnes, mets-les en place. Il faut aussi qu'on puisse
 * changer le nom des animaux si besoin, facilement. »
 */

const lion = getSpecies('lion');
const father: ActorRef = { speciesId: 'lion', kind: 'adult', role: 'father' };
const mother: ActorRef = { speciesId: 'lion', kind: 'adult', role: 'mother' };

function withBabies(): { state: GameState; mia: ActorRef; tom: ActorRef } {
  const fam = getFamily(newGameState(), 'lion');
  const a = createBaby(fam, 'girl', 'Mia', 'lion-b1');
  if (!a.ok) throw new Error(a.error);
  const b = createBaby(a.family, 'boy', 'Tom', 'lion-b2');
  if (!b.ok) throw new Error(b.error);
  return { state: withFamily(newGameState(), b.family), mia: { speciesId: 'lion', kind: 'baby', babyId: 'lion-b1' }, tom: { speciesId: 'lion', kind: 'baby', babyId: 'lion-b2' } };
}

const ctx = (state: GameState, actor: ActorRef, biome = 'africa_baobab'): QuestContext => ({ state, species: lion, biome: getBiome(biome), actor, rng: createRng(7) });
const answers = (script: QuestScript): AnswerRecord[] =>
  script.steps.flatMap((s) => (s.kind === 'ask' || s.kind === 'tapAnchor' || s.kind === 'tapProps' || s.kind === 'seek' ? [{ items: s.items, correct: true, aided: false }] : []));

describe('changer le nom des animaux', () => {
  it('un bébé change de nom ; frère et sœur ne portent pas le même prénom', () => {
    const { state, mia, tom } = withBabies();
    const r = renameActor(state, mia, '  Luna  ');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(nameOf(r.state, lion, mia)).toBe('Luna');
    expect(nameOf(r.state, lion, tom)).toBe('Tom');
    expect(renameActor(r.state, mia, 'tom')).toEqual({ ok: false, error: 'same_name' });
    expect(renameActor(r.state, mia, 'Luna').ok).toBe(true); // garder son propre nom n'est pas une erreur
    expect(variableNames(r.state)).toContain('Luna');
  });

  it('mêmes garde-fous qu’à la naissance : nom vide ou trop long refusé, rien ne change', () => {
    const { state, mia } = withBabies();
    expect(renameActor(state, mia, '   ')).toEqual({ ok: false, error: 'empty' });
    expect(renameActor(state, mia, 'A'.repeat(30))).toEqual({ ok: false, error: 'too_long' });
    expect(renameActor(state, father, '<<<>>>')).toEqual({ ok: false, error: 'empty' });
    expect(renameActor(state, { speciesId: 'lion', kind: 'baby', babyId: 'nobody' }, 'Zoe')).toEqual({ ok: false, error: 'unknown' });
  });

  it('Papa change de nom ; « ↺ » lui rend celui du jeu et rien n’est gardé', () => {
    const s0 = newGameState();
    const r = renameActor(s0, father, 'Max');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(nameOf(r.state, lion, father)).toBe('Max');
    expect(nameOf(r.state, lion, mother)).toBe(lion.mother.name);
    expect(variableNames(r.state)).toContain('Max'); // la voix dit la variante sans prénom
    expect(withParentNames(lion, getFamily(r.state, 'lion').parentNames).father.name).toBe('Max');
    expect(originalName(father)).toBe(lion.father.name);
    expect(originalName({ speciesId: 'lion', kind: 'baby', babyId: 'x' })).toBeUndefined();
    const back = renameActor(r.state, father, lion.father.name);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(getFamily(back.state, 'lion').parentNames).toBeUndefined();
    expect(withParentNames(lion, undefined)).toBe(lion);
  });

  it('les noms choisis passent dans les scènes : jamais l’ancien nom, et « Max » là où le papa est nommé', () => {
    const renamed = withParentNames(lion, { father: 'Max', mother: 'Lily' });
    const { state, mia } = withBabies();
    const r = renameActor(state, father, 'Max');
    if (!r.ok) throw new Error(r.error);
    const lines: string[] = [];
    for (const actor of [father, mother, mia]) {
      // les scènes reçoivent le nom du personnage par {actorName} (Habitat : nameOf), le reste par l'espèce renommée
      const vars = { actorName: nameOf(r.state, renamed, actor), playerName: 'Ava', babyName: 'Mia', siblingName: 'Tom', placeName: 'Africa' };
      for (const a of ARCHETYPES) {
        const q = buildQuest(a, { ...ctx(r.state, actor), species: renamed });
        if (q) for (const st of q.script.steps) for (const u of stepUtterances(st)) lines.push(fill(u.line.en, vars));
      }
    }
    const all = lines.join(' ');
    expect(all).toContain('Max');
    expect(all).not.toContain(lion.father.name);
  });

  it('les noms des parents sont gardés dans la partie, relus avec les mêmes garde-fous', () => {
    const r = renameActor(newGameState(), mother, 'Lily');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const back = migrate(JSON.parse(JSON.stringify(r.state)));
    expect(back && getFamily(back, 'lion').parentNames).toEqual({ mother: 'Lily' });
    const bad = JSON.parse(JSON.stringify(r.state));
    bad.families.lion.parentNames = { father: '<<<', mother: 42 };
    expect(getFamily(migrate(bad)!, 'lion').parentNames).toBeUndefined();
  });

  it('voix : avec Papa et Maman renommés, chaque phrase des jeux d’Afrique reste enregistrée', () => {
    const africa = SPECIES.filter((sp) => sp.continentId === 'africa');
    const missing = new Set<string>();
    const names = ['Ava', 'Mia', 'Tom', 'Max', 'Lily'];
    for (const v of activityVariants(STRUCTURAL_CONFIGS, africa)) {
      if (v.config.actorKind !== 'adult') continue;
      const rename = (t: string) => t.split(v.species.father.name).join('Max').split(v.species.mother.name).join('Lily');
      const vars = { actorName: v.config.role === 'mother' ? 'Lily' : 'Max', playerName: 'Ava', babyName: 'Mia', siblingName: 'Tom', placeName: PLACES[v.script.biomeId]?.nameEn ?? '' };
      for (const step of v.script.steps) {
        for (const u of stepUtterances(step)) {
          const role = voiceOfSpeaker(u.who, v.config);
          if (!role) continue;
          const text = rename(fill(u.line.en, vars));
          const spoken = u.retry ? say.tryAgain(text) : text;
          if (!clipFor(spoken, role, names)) missing.add(`${role}|${spoken}`);
        }
      }
    }
    expect([...missing].slice(0, 20)).toEqual([]);
    for (const role of ['father', 'mother'] as const) expect(clipFor(say.actorCall('Max'), role, names)).toBeDefined();
  }, 60000);

  it('le menu a un bouton ✏️, un champ, ✓, ↺ et Annuler', () => {
    const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('aria-label="Change the name"');
    expect(src).toContain('<RenameForm');
    expect(src).toContain('renameActor(st, menuFor, raw)');
    expect(src).toContain('↺ {original}');
    expect(src).toContain('withParentNames(baseSpecies, family.parentNames)');
  });
});

describe('icônes de progression jouables', () => {
  it('chaque jeu dit dans quels lieux il se joue ; il se construit bien là, et seulement là', () => {
    const s0 = newGameState();
    for (const actor of [father, mother]) {
      for (const g of actorGames(s0, lion, actor)) {
        expect(g.places.length).toBeGreaterThan(0);
        const arch = ARCHETYPES.find((a) => a.id === g.id)!;
        for (const b of lion.allowedBiomes) expect(!!buildQuest(arch, ctx(s0, actor, b)), `${g.id}@${b}`).toBe(g.places.includes(b));
      }
    }
  });

  it('une icône lance le jeu ici, ou propose d’aller dans le bon lieu', () => {
    const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('onClick={() => tapGame(g)}');
    expect(src).toContain('if (g.places.includes(here)) return onPickGame(g);');
    expect(src).toContain('onClick={() => onGoTo(p)}');
  });
});

describe('moment « Well done! » et progression de la famille', () => {
  it('firstGame : seulement la première réussite d’un jeu avec cet animal', () => {
    const s0 = newGameState();
    const game = selectActivities(ctx(s0, father))[0]!;
    const run = (s: GameState) => applyQuestOutcome(s, { script: game.script, mechanic: game.archetype.mechanic, actor: father, answers: answers(game.script), continentId: 'africa' });
    const first = run(s0);
    expect(first.events.firstGame).toBe(game.archetype.id);
    expect(run(first.state).events.firstGame).toBeUndefined();
  });

  it('familyProgress additionne Papa, Maman et les bébés ; metSpecies liste les animaux rencontrés', () => {
    const { state, mia } = withBabies();
    const total = [father, mother, mia, { speciesId: 'lion', kind: 'baby', babyId: 'lion-b2' } as ActorRef].reduce((n, a) => n + actorGames(state, lion, a).length, 0);
    expect(familyProgress(state, lion)).toEqual({ done: 0, total });
    const g = actorGames(state, lion, mia)[0]!;
    const s1 = { ...state, player: { ...state.player, gamesDone: { [gameKey(mia, g.id)]: 1 } } };
    expect(familyProgress(s1, lion).done).toBe(1);
    expect(metSpecies(newGameState())).toEqual([]);
    expect(metSpecies(s1).map((s) => s.id)).toEqual(['lion']);
  });

  it('l’écran montre la grande coche, l’anneau vert et « My animals »', () => {
    const hab: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    const app: string = readFileSync(new URL('../ui/App.tsx', import.meta.url), 'utf8');
    const pass: string = readFileSync(new URL('../ui/Passport.tsx', import.meta.url), 'utf8');
    const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    expect(hab).toContain('{firstDone && !grow && !giftPick && (');
    expect(hab).toContain('const calm = !growing && !offer && end === biome.id;');
    expect(app).toContain('familyProgress(calm, s)');
    expect(app).toContain('state={state}');
    expect(pass).toContain("'My animals'");
    for (const rule of ['.first-done {', '.first-done-check {', '.hop-ring {', '.hop-ring-done {', '.animal-card {', '.gp-away {', '.wish-badge {', '.rename-btn {']) expect(css).toContain(rule);
  });
});

describe('les bébés réclament un jeu nouveau', () => {
  it('quand un jeu jamais fait existe ici, le menu du bébé en propose toujours un', () => {
    const { state, mia } = withBabies();
    const here = ARCHETYPES.filter((a) => a.id !== 'name_object' && buildQuest(a, ctx(state, mia)));
    expect(here.length).toBeGreaterThan(2);
    for (const keep of here) {
      const gamesDone: Record<string, number> = {};
      for (const a of ARCHETYPES) if (a.id !== keep.id) gamesDone[gameKey(mia, a.id)] = 1;
      const s = { ...state, player: { ...state.player, gamesDone } };
      const menu = selectActivities(ctx(s, mia));
      expect(menu.some((q) => q.archetype.id === keep.id), keep.id).toBe(true);
      for (const q of menu) if (q.wish) expect(q.archetype.id).toBe(keep.id);
      expect(menu.length).toBeLessThanOrEqual(3);
    }
  });

  it('un bébé qui n’a encore rien fait n’a pas de carte ✨ (tout est nouveau)', () => {
    const { state, mia } = withBabies();
    expect(selectActivities(ctx(state, mia)).some((q) => q.wish)).toBe(false);
  });

  it('le bébé le dit à voix haute (phrase enregistrée pour les deux voix) ; la carte porte « ✨ New! »', () => {
    expect(clipFor(NEW_GAME_WISH.en, 'girl', [])).toBeDefined();
    expect(clipFor(NEW_GAME_WISH.en, 'boy', [])).toBeDefined();
    const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('✨ New!');
    expect(src).toContain('{ text: NEW_GAME_WISH.en, opts: { role } }');
  });
});

describe('menu d’un animal allégé (demande du 2026-11-25 : « trop chargé, trop d’informations »)', () => {
  const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
  const css: string = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

  it('au survol d’une icône de jeu, une petite fenêtre volante donne son nom', () => {
    expect(src).toContain('<GameTip en={g.titleEn} fr={frenchHelp ? g.titleFr : undefined} />');
    const passport: string = readFileSync(new URL('../ui/Passport.tsx', import.meta.url), 'utf8');
    expect(passport).toContain('className="gp-tip"');
    for (const rule of ['.gp-tip {', '.gp-tip::before {', '.gp-icon:hover .gp-tip { opacity: 1; visibility: visible; }']) expect(css).toContain(rule);
    // plus d'infobulle native du navigateur en double
    expect(src).not.toContain('title={frenchHelp ? `${g.titleEn} · ${g.titleFr}` : g.titleEn}');
  });

  it('la section « Adventures in other places » n’est plus affichée', () => {
    expect(src).not.toContain('Adventures in other places');
    expect(src).not.toContain('className="adv-elsewhere"');
    expect(src).toContain('🗺️ Adventure here');
  });
});
