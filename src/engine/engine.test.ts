import { describe, expect, it } from 'vitest';
import { ARCHETYPES, getArchetype } from '../content/archetypes';
import { ACTIVITY_BY_ID } from '../content/activities';
import { NOUNS } from '../content/places';
import { SPECIES, getSpecies } from '../content/species';
import { BIOMES, CONTINENTS, getBiome } from '../content/world';
import { activityVariants, STRUCTURAL_CONFIGS } from './variants';
import { TIERS, type BiomeId, type QuestScript, type QuestStep, type Tier } from '../content/types';
import { fill, linesOf, validateScript } from './dialogue';
import { applyQuestOutcome } from './events';
import { createBaby, computeStage, nextBabySex, sanitizeName, MAX_BABIES } from './family';
import { activityCtx, buildQuest, pickTeachWord, selectActivities, type QuestContext, type RankedActivity } from './quests';
import { createRng } from './rng';
import { CORRUPT_KEY, loadGame, memoryStorage, SAVE_KEY, saveGame } from './save';
import { itemStatus, type AnswerRecord } from './skills';
import { clampSpeechSpeed, getFamily, newGameState, SPEECH_SPEED, withFamily, type ActorRef, type GameState } from './state';

// ---------------------------------------------------------------------------
// Aides de simulation
// ---------------------------------------------------------------------------

/** Joue un script en répondant juste du premier coup (ou avec une erreur avant si `aided`). */
function answersFor(script: QuestScript, aided = false): AnswerRecord[] {
  return script.steps.flatMap((s) => (s.kind === 'ask' || s.kind === 'tapAnchor' || s.kind === 'tapProps' || s.kind === 'seek' ? [{ items: s.items, correct: true, aided }] : []));
}

function ctx(state: GameState, speciesId: string, biomeId: BiomeId, actor: ActorRef, seed = 1): QuestContext {
  return { state, species: getSpecies(speciesId), biome: getBiome(biomeId), actor, rng: createRng(seed) };
}

function play(state: GameState, a: RankedActivity, actor: ActorRef, aided = false): GameState {
  const continentId = getBiome(a.script.biomeId).continentId;
  return applyQuestOutcome(state, { script: a.script, mechanic: a.archetype.mechanic, actor, answers: answersFor(a.script, aided), teach: a.teach, continentId }).state;
}

function withBabies(state: GameState, speciesId: string, n: 1 | 2): GameState {
  let fam = getFamily(state, speciesId);
  const r1 = createBaby(fam, 'girl', 'Mia', 'b1');
  if (!r1.ok) throw new Error(r1.error);
  fam = r1.family;
  if (n === 2) {
    const r2 = createBaby(fam, 'boy', 'Tom', 'b2');
    if (!r2.ok) throw new Error(r2.error);
    fam = r2.family;
  }
  return withFamily(state, fam);
}

/** Étapes brutes d'une activité, à un niveau donné (première variante sans souvenir). */
function rawSteps(activityId: string, c: QuestContext, tier: Tier): QuestStep[] | undefined {
  const act = ACTIVITY_BY_ID[activityId]!;
  const a = activityCtx(c);
  const choice = act.choices(a).find((x) => !x.endsWith('+memory'));
  return choice === undefined ? undefined : act.build(a, tier, choice);
}
const moves = (steps: QuestStep[] | undefined) => (steps ?? []).flatMap((x) => (x.kind === 'moveTo' ? [x.action] : []));

const lionFather: ActorRef = { speciesId: 'lion', kind: 'adult', role: 'father' };
const elephantMother: ActorRef = { speciesId: 'elephant', kind: 'adult', role: 'mother' };
const giraffeFather: ActorRef = { speciesId: 'giraffe', kind: 'adult', role: 'father' };
/** 2026-11-23 : premier décor de chaque famille (le lion n'habite plus la savane d'origine). */
const HOME: Record<string, string> = { lion: 'africa_baobab', elephant: 'africa_pond', giraffe: 'africa_waterhole' };

// ---------------------------------------------------------------------------

describe('Monde libre (MON-01, MON-02)', () => {
  it('les 7 continents existent et chacun est sélectionnable sans prérequis', () => {
    expect(CONTINENTS).toHaveLength(7);
    const state = newGameState();
    for (const c of CONTINENTS) {
      const playable = SPECIES.filter((s) => s.continentId === c.id && s.playable);
      expect(playable.length, c.id).toBeGreaterThan(0);
      for (const s of playable) {
        const biome = s.allowedBiomes[0]!;
        const acts = selectActivities(ctx(state, s.id, biome, { speciesId: s.id, kind: 'adult', role: 'mother' }));
        expect(acts.length).toBeGreaterThan(0);
        expect(acts.some((a) => a.archetype.id === 'greeting'), `${s.id} doit pouvoir dire bonjour`).toBe(true);
      }
    }
  });

  it("commencer par l'Antarctique ne bloque rien : l'Afrique reste jouable ensuite", () => {
    let state = newGameState();
    const penguin: ActorRef = { speciesId: 'penguin', kind: 'adult', role: 'father' };
    const g = selectActivities(ctx(state, 'penguin', 'open_sea', penguin)).find((a) => a.archetype.id === 'greeting')!;
    state = play(state, g, penguin);
    // comme à l'écran : tant que la famille n'a pas trouvé d'eau ici, Papa a soif
    // 2026-11-23 : chaque famille a ses décors ; le point d'eau est celui de la girafe
    const acts = selectActivities({ ...ctx(state, 'giraffe', 'africa_waterhole', giraffeFather), need: 'thirsty' });
    expect(acts.map((a) => a.archetype.id)).toContain('find_water');
  });
});

describe('Progression indépendante du lieu (EDU-01, EDU-02)', () => {
  it("les acquis de salutation avec le lion servent avec l'éléphant (pas de leçon refaite)", () => {
    let state = newGameState();
    // deux contextes différents (père lion, mère lion) → expressions "supported"
    for (const role of ['father', 'mother'] as const) {
      const actor: ActorRef = { speciesId: 'lion', kind: 'adult', role };
      const g = { ...buildQuest(getArchetype('greeting'), ctx(state, 'lion', 'africa_baobab', actor))!, score: 0 };
      expect(g.script.tier).toBe('beginner');
      state = play(state, g, actor);
    }
    expect(itemStatus(state.player.items.hello)).toBe('supported');
    const ele = buildQuest(getArchetype('greeting'), ctx(state, 'elephant', 'africa_pond', elephantMother))!;
    expect(ele.script.tier).toBe('intermediate');
  });

  it("répéter 10 fois la même quête ne rend pas une expression autonome (EDU-03)", () => {
    let state = newGameState();
    for (let i = 0; i < 10; i++) {
      const g = buildQuest(getArchetype('greeting'), ctx(state, 'lion', 'africa_baobab', lionFather))!;
      state = play(state, { ...g, score: 0 }, lionFather);
    }
    expect(itemStatus(state.player.items.hello)).toBe('recognised');
    expect(state.player.items.hello!.seen).toBe(10);
  });

  it('une expression compte au plus une fois par quête', () => {
    const s = buildQuest(getArchetype('greeting'), ctx(newGameState(), 'lion', 'africa_baobab', lionFather))!.script;
    let state = newGameState();
    state = applyQuestOutcome(state, { script: s, mechanic: 'talk', actor: lionFather, answers: [...answersFor(s), ...answersFor(s)], continentId: 'africa' }).state;
    for (const p of Object.values(state.player.items)) expect(p.seen).toBe(1);
  });
});

describe('Cohérence habitat / espèce (QUE-01, QUE-02, QUE-04)', () => {
  it("find_water n'est jamais proposé sans point d'eau dans le décor", () => {
    const fw = getArchetype('find_water');
    const state = newGameState();
    let some = 0;
    for (const s of SPECIES) {
      for (const b of s.allowedBiomes) {
        const q = buildQuest(fw, ctx(state, s.id, b, { speciesId: s.id, kind: 'adult', role: 'father' }));
        if (!q) continue;
        some++;
        const place = getBiome(b);
        for (const st of q.script.steps) if (st.kind === 'moveTo') expect(place.anchors.find((a) => a.id === st.anchor)?.tags, `${s.id}@${b}`).toContain('water');
      }
    }
    expect(some).toBeGreaterThan(5);
    expect(buildQuest(fw, ctx(state, 'giraffe', 'africa_waterhole', giraffeFather))).toBeDefined();
    expect(buildQuest(fw, ctx(state, 'elephant', 'africa_pond', elephantMother))).toBeDefined();
    // 2026-11-23 : les décors du lion (baobab, savane sèche, canyon) n'ont pas d'eau dessinée : pas de quête d'eau inventée
    for (const b of ['africa_baobab', 'africa_desert', 'africa_canyon']) expect(buildQuest(fw, ctx(state, 'lion', b, lionFather)), b).toBeUndefined();
  });

  it("un lion n'est jamais placé sur la banquise : seule la conversation de repli reste", () => {
    const acts = selectActivities(ctx(newGameState(), 'lion', 'ice_coast', lionFather));
    expect(acts).toHaveLength(1);
    expect(acts[0]!.archetype.id).toBe('chat');
  });

  it("chaque espèce n'habite que des biomes de son continent", () => {
    for (const s of SPECIES) for (const b of s.allowedBiomes) expect(BIOMES[b]?.continentId, s.id).toBe(s.continentId);
  });

  it("le même modèle find_water donne deux scènes différentes pour la girafe et l'éléphant", () => {
    const state = newGameState();
    const gir = buildQuest(getArchetype('find_water'), ctx(state, 'giraffe', 'africa_waterhole', giraffeFather))!.script;
    const ele = buildQuest(getArchetype('find_water'), ctx(state, 'elephant', 'africa_pond', elephantMother))!.script;
    expect(gir.archetypeId).toBe(ele.archetypeId);
    expect(moves(gir.steps)).toContain('drink_splay');
    expect(moves(ele.steps)).toContain('drink_trunk');
    expect(linesOf(gir).map((l) => l.en)).not.toEqual(linesOf(ele).map((l) => l.en));
  });

  it('la girafe réutilise find_water avec sa propre façon de boire (pattes écartées)', () => {
    const c = ctx(newGameState(), 'giraffe', 'africa_waterhole', giraffeFather);
    for (const tier of TIERS) expect(moves(rawSteps('find_water', c, tier)), tier).toContain('drink_splay');
  });

  it("une espèce qui ne boit pas à un point d'eau n'obtient pas de quête find_water inventée", () => {
    const penguin: ActorRef = { speciesId: 'penguin', kind: 'adult', role: 'father' };
    expect(buildQuest(getArchetype('find_water'), ctx(newGameState(), 'penguin', 'ice_coast', penguin))).toBeUndefined();
  });

  it('les archétypes réservés aux bébés ne sont jamais proposés à un parent', () => {
    const state = withBabies(newGameState(), 'lion', 2);
    const acts = selectActivities(ctx(state, 'lion', 'africa_baobab', lionFather), 20);
    expect(acts.map((a) => a.archetype.id)).not.toContain('name_object');
  });
});

describe('Famille (FAM-01 à FAM-05)', () => {
  it('chaque espèce a un père et une mère nommés', () => {
    for (const s of SPECIES) {
      expect(s.father.name).toBeTruthy();
      expect(s.mother.name).toBeTruthy();
      expect(s.father.name).not.toBe(s.mother.name);
    }
  });

  it('premier bébé au choix, second du sexe opposé, troisième refusé', () => {
    let fam = getFamily(newGameState(), 'lion');
    expect(nextBabySex(fam)).toBeNull();
    const a = createBaby(fam, 'boy', 'Simba-Léo', 'b1');
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    fam = a.family;
    expect(nextBabySex(fam)).toBe('girl');
    expect(createBaby(fam, 'boy', 'Max', 'b2')).toEqual({ ok: false, error: 'sex_not_allowed' });
    expect(createBaby(fam, 'girl', 'simba-léo', 'b2')).toEqual({ ok: false, error: 'same_name' });
    const b = createBaby(fam, 'girl', 'Nala', 'b2');
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    fam = b.family;
    expect(fam.babies).toHaveLength(MAX_BABIES);
    expect(nextBabySex(fam)).toBe('none');
    expect(createBaby(fam, 'girl', 'Zoé', 'b3')).toEqual({ ok: false, error: 'family_complete' });
    expect(fam.babies.map((x) => x.sex).sort()).toEqual(['boy', 'girl']);
  });

  it('chaque bébé a sa propre mémoire', () => {
    let state = withBabies(newGameState(), 'lion', 2);
    const mia: ActorRef = { speciesId: 'lion', kind: 'baby', babyId: 'b1' };
    const q = buildQuest(getArchetype('name_object'), ctx(state, 'lion', 'africa_baobab', mia))!;
    state = play(state, { ...q, score: 0 }, mia);
    const [b1, b2] = getFamily(state, 'lion').babies;
    expect(Object.keys(b1!.taughtWords)).toHaveLength(1);
    expect(Object.keys(b2!.taughtWords)).toHaveLength(0);
  });
});

describe('Prénoms sûrs', () => {
  it.each([
    ['  Léa  ', 'Léa'],
    ['Zoé-Anne', 'Zoé-Anne'],
    ["N'Golo", "N'Golo"],
    ['Mia🦁', 'Mia'],
    ['<b>Max</b>', 'bMaxb'],
    ['Ana   Lou', 'Ana Lou'],
    ['小明', '小明'],
    ['--Léo--', 'Léo'],
    ['Inès’', 'Inès'],
  ])('%s → %s', (raw, expected) => {
    expect(sanitizeName(raw)).toEqual({ ok: true, name: expected });
  });

  it('refuse vide, emojis seuls et trop long', () => {
    expect(sanitizeName('   ')).toEqual({ ok: false, error: 'empty' });
    expect(sanitizeName('🦁🦁')).toEqual({ ok: false, error: 'empty' });
    expect(sanitizeName('A'.repeat(19))).toEqual({ ok: false, error: 'too_long' });
    expect(sanitizeName('A'.repeat(18)).ok).toBe(true);
  });
});

describe('Croissance par apprentissage (FAM-06, EDU-03)', () => {
  it('répéter la même activité ne fait pas grandir le bébé', () => {
    let state = withBabies(newGameState(), 'lion', 1);
    const mia: ActorRef = { speciesId: 'lion', kind: 'baby', babyId: 'b1' };
    for (let i = 0; i < 40; i++) {
      const q = buildQuest(getArchetype('name_object'), ctx(state, 'lion', 'africa_baobab', mia, i))!;
      state = play(state, { ...q, score: 0 }, mia);
    }
    const baby = getFamily(state, 'lion').babies[0]!;
    expect(baby.retainedWords.length).toBeGreaterThanOrEqual(3);
    expect(baby.stage).toBe('newborn'); // une seule sorte d'aventure
  });

  it('enseigner, réviser plus tard et vivre plusieurs aventures fait grandir, sans jamais reculer', () => {
    let state = withBabies(newGameState(), 'lion', 1);
    const mia: ActorRef = { speciesId: 'lion', kind: 'baby', babyId: 'b1' };
    const stages: string[] = [];
    for (let i = 0; i < 30; i++) {
      const acts = selectActivities(ctx(state, 'lion', 'africa_baobab', mia, i));
      state = play(state, acts[0]!, mia);
      stages.push(getFamily(state, 'lion').babies[0]!.stage);
    }
    expect(stages).toContain('little');
    const order = ['newborn', 'little', 'young', 'companion'];
    for (let i = 1; i < stages.length; i++) expect(order.indexOf(stages[i]!)).toBeGreaterThanOrEqual(order.indexOf(stages[i - 1]!));
  });

  it('un stade atteint ne recule jamais', () => {
    let state = withBabies(newGameState(), 'lion', 1);
    const baby = { ...getFamily(state, 'lion').babies[0]!, stage: 'young' as const };
    expect(computeStage(baby)).toBe('young');
  });

  it("révision espacée : le mot enseigné n'est révisé qu'après d'autres activités", () => {
    const state = withBabies(newGameState(), 'lion', 1);
    const baby = { ...getFamily(state, 'lion').babies[0]!, taughtWords: { tree: 5 } };
    const savanna = getBiome('savanna');
    expect(pickTeachWord(baby, savanna, 6, createRng(1))!.mode).toBe('new');
    expect(pickTeachWord(baby, savanna, 7, createRng(1))).toEqual({ mode: 'retest', anchorId: 'acacia', word: 'tree' });
  });
});

describe('Sélection et anti-répétition (QUE-03)', () => {
  it('100 sélections simulées : jamais incompatible, 1 à 3 propositions', () => {
    let state = withBabies(newGameState(), 'lion', 2);
    state = withBabies(state, 'elephant', 1);
    const rng = createRng(42);
    const actors: ActorRef[] = [lionFather, { speciesId: 'lion', kind: 'adult', role: 'mother' }, { speciesId: 'lion', kind: 'baby', babyId: 'b1' }, { speciesId: 'lion', kind: 'baby', babyId: 'b2' }, elephantMother, { speciesId: 'elephant', kind: 'baby', babyId: 'b1' }];
    for (let i = 0; i < 100; i++) {
      const actor = rng.pick(actors);
      const home = HOME[actor.speciesId]!;
      const acts = selectActivities(ctx(state, actor.speciesId, home, actor, i));
      expect(acts.length).toBeGreaterThanOrEqual(1);
      expect(acts.length).toBeLessThanOrEqual(3);
      expect(new Set(acts.map((a) => a.archetype.id)).size).toBe(acts.length);
      for (const a of acts) {
        expect(a.script.speciesId).toBe(actor.speciesId);
        expect(a.archetype.actorKinds).toContain(actor.kind);
        expect(validateScript(a.script, getBiome(home))).toEqual([]);
      }
      state = play(state, rng.pick(acts), actor, rng.next() < 0.3);
    }
    expect(state.player.history.length).toBeLessThanOrEqual(10);
  });

  it("en jouant toujours la première proposition, la même mécanique ne revient pas 3 fois de suite", () => {
    let state = withBabies(newGameState(), 'lion', 1);
    const mia: ActorRef = { speciesId: 'lion', kind: 'baby', babyId: 'b1' };
    const mechanics: string[] = [];
    for (let i = 0; i < 20; i++) {
      const top = selectActivities(ctx(state, 'lion', 'africa_baobab', mia, i))[0]!;
      mechanics.push(top.archetype.mechanic);
      state = play(state, top, mia);
    }
    for (let i = 2; i < mechanics.length; i++) expect(mechanics[i] === mechanics[i - 1] && mechanics[i] === mechanics[i - 2]).toBe(false);
  });

  it('un besoin de soif met la quête eau en avant (une fois les présentations faites)', () => {
    let state = newGameState();
    state = play(state, { ...buildQuest(getArchetype('greeting'), ctx(state, 'elephant', 'africa_pond', elephantMother))!, score: 0 }, elephantMother);
    const c = { ...ctx(state, 'elephant', 'africa_pond', elephantMother), need: 'thirsty' as const };
    expect(selectActivities(c)[0]!.archetype.id).toBe('find_water');
  });

  it('un bébé à qui il manque des mots pour grandir propose en premier d’apprendre un mot', () => {
    const state = withBabies(newGameState(), 'lion', 1);
    const mia: ActorRef = { speciesId: 'lion', kind: 'baby', babyId: 'b1' };
    const greeted = play(state, { ...buildQuest(getArchetype('greeting'), ctx(state, 'lion', 'africa_baobab', mia))!, score: 0 }, mia);
    const top = selectActivities(ctx(greeted, 'lion', 'africa_baobab', mia, 3)).map((a) => a.archetype.id);
    expect(top).toContain('name_object');
  });
});

describe('Validation de tous les contenus (MOTEUR §11)', () => {
  const lionAndElephant = SPECIES.filter((sp) => sp.id === 'lion' || sp.id === 'elephant' || sp.id === 'giraffe');
  const allScripts = [...activityVariants(STRUCTURAL_CONFIGS, lionAndElephant)].map((v) => v.script);

  it('il y a des scripts pour l’éléphant et la girafe dans les 3 niveaux', () => {
    expect(allScripts.length).toBeGreaterThan(40);
    for (const sp of ['elephant', 'giraffe']) for (const t of TIERS) expect(allScripts.some((s) => s.speciesId === sp && s.tier === t && s.archetypeId === 'find_water'), `${sp} ${t}`).toBe(true);
  });

  it('chaque script est valide (EN + FR, variables autorisées, points du décor existants, ≥1 bonne réponse tactile)', () => {
    for (const s of allScripts) expect(validateScript(s, getBiome(s.biomeId)), s.id).toEqual([]);
  });

  it('aucune variable ne reste visible une fois remplie', () => {
    const vars = { actorName: 'Leo', playerName: 'Chloé', babyName: 'Mia', siblingName: 'Tom', word: 'tree', placeName: 'the savanna' };
    for (const s of allScripts) for (const l of linesOf(s)) expect(fill(l.en, vars)).not.toMatch(/[{}]/);
  });

  it('tous les mots enseignables du décor ont un groupe nominal validé', () => {
    const savanna = getBiome('africa_baobab');
    const mia: ActorRef = { speciesId: 'lion', kind: 'baby', babyId: 'b1' };
    const taught = selectActivities(ctx(withBabies(newGameState(), 'lion', 1), 'lion', 'africa_baobab', mia), 20).find((a) => a.archetype.id === 'name_object');
    expect(taught?.teach).toBeDefined();
    expect(NOUNS[taught!.teach!.word]).toBeDefined();
    expect(savanna.anchors.filter((a) => NOUNS[a.word]).length).toBeGreaterThanOrEqual(3);
  });

  it("chaque archétype implémenté a du contenu, les autres ne sont jamais proposés", () => {
    const state = newGameState();
    for (const a of ARCHETYPES.filter((x) => !x.implemented)) expect(buildQuest(a, ctx(state, 'lion', 'africa_baobab', lionFather))).toBeUndefined();
    for (const a of ARCHETYPES.filter((x) => x.implemented)) expect(ACTIVITY_BY_ID[a.id], a.id).toBeDefined();
  });
}, 30000);

describe('Sauvegarde locale (SAV-01, SAV-02)', () => {
  it('sauvegarde puis restauration à l’identique', () => {
    const storage = memoryStorage();
    let state = withBabies(newGameState(), 'lion', 2);
    const g = selectActivities(ctx(state, 'lion', 'africa_baobab', lionFather))[0]!;
    state = play(state, g, lionFather);
    expect(saveGame(storage, state)).toBe(true);
    const back = loadGame(storage);
    expect(back.status).toBe('loaded');
    expect(back.state).toEqual(state);
  });

  it('sauvegarde illisible : copie de secours et nouvelle partie', () => {
    const storage = memoryStorage({ [SAVE_KEY]: '{oops' });
    const r = loadGame(storage);
    expect(r.status).toBe('corrupt');
    expect(storage.data[CORRUPT_KEY]).toBe('{oops');
    expect(r.state.player.activityCounter).toBe(0);
  });

  it('ancienne sauvegarde sans réglages : migration avec valeurs par défaut', () => {
    const old = { version: 0, player: { name: 'Chloé', items: {}, history: [] }, families: {} };
    const r = loadGame(memoryStorage({ [SAVE_KEY]: JSON.stringify(old) }));
    expect(r.status).toBe('migrated');
    expect(r.state.player.name).toBe('Chloé');
    expect(r.state.settings.frenchHelp).toBe(true);
  });

  it('vitesse des voix : 80 % par défaut (100 % = naturelle), conservée, corrigée si absurde', () => {
    expect(newGameState().settings.speechSpeed).toBe(0.8);
    const state = { ...newGameState(), settings: { ...newGameState().settings, speechSpeed: 1.25 } };
    const storage = memoryStorage();
    saveGame(storage, state);
    expect(loadGame(storage).state.settings.speechSpeed).toBe(1.25);
    const load = (settings: Record<string, unknown>) => loadGame(memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...newGameState(), settings }) })).state.settings;
    expect(load({ speechSpeed: 5 }).speechSpeed).toBe(SPEECH_SPEED.max);
    expect(load({ speechSpeed: 0 }).speechSpeed).toBe(SPEECH_SPEED.min);
    expect(load({ speechSpeed: 'vite' }).speechSpeed).toBe(0.8);
    expect(load({ speechSpeed: null }).speechSpeed).toBe(0.8);
    // l'essai de la veille (1 = vitesse des enregistrements) est abandonné : retour au défaut
    expect(load({ voiceSpeed: 1 })).toEqual(newGameState().settings);
    expect(clampSpeechSpeed(0.8700001)).toBe(0.85);
  });

  it('sauvegarde d’une version future refusée sans être écrasée', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ version: 99, player: {}, families: {} }) });
    expect(loadGame(storage).status).toBe('corrupt');
    expect(storage.data[SAVE_KEY]).toBeDefined();
  });

  it('aucun compte, aucun réseau, aucun micro : l’état ne contient que le jeu', () => {
    const keys = Object.keys(newGameState()).sort();
    expect(keys).toEqual(['families', 'onboarded', 'player', 'settings', 'version']);
  });
});
