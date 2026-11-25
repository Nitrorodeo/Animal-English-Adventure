import { peekSpot } from '../game/peek';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { speech, type VoiceRole } from '../audio/speech';
import { babyVoice, DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { TREASURES } from '../content/adventures';
import { FAMILY_LINES, STAGE_NAMES } from '../content/dialogues';
import { PROPS, WEATHER_WORDS } from '../content/props';
import { NOUNS, PLACES } from '../content/places';
import { GROWTH_STAGES, type BiomeDef, type GrowthStage, type PlaceId, type QuestScript, type Sex, type Speaker, type SpeciesDef } from '../content/types';
import { ARCHETYPES, unlockedAt } from '../content/archetypes';
import { BEDTIME, BIGGER_NOW, BIRTHDAY, CHEESE, NAME_ERRORS, NEW_GAME_WISH, say, WEEK_WORD } from '../content/utterances';
import { weekWordAnchor } from '../content/weekWord';
import { weatherFx, weatherOfDay, withDayWeather } from '../engine/weather';
import { WeatherLayer } from './Weather';
import { RepeatMic } from './RepeatMic';
import { bedtimeLines, type BedtimeLine } from '../engine/bedtime';
import { cuddleLine, HOLD_MS } from '../engine/cuddles';
import { dayKey } from '../engine/stickers';
import { earnsGift, giftOffer, giftsHere, moveGift, receiveGift, type GiftDef } from '../engine/gifts';
import { GiftChoice, GiftItem, useScenePixels } from './Gifts';
import { ambientAt, giftLook, giftStart, groundAt, skyOf } from './giftLook';
import { fillLine, type Vars } from '../engine/dialogue';
import { applyQuestOutcome, type OutcomeEvents } from '../engine/events';
import { nextBabySex } from '../engine/family';
import { actorGames, buildQuest, findBaby, hashText, selectActivities, selectAdventures, type ActorGame, type AdventureOffer, type BuiltQuest, type QuestContext, type RankedActivity, type TeachChoice } from '../engine/quests';
import { nameOf, originalName, renameActor, withParentNames } from '../engine/names';
import { createRng } from '../engine/rng';
import type { AnswerRecord } from '../engine/skills';
import { actorId, gameDone, getFamily, withFamily, type ActorRef, type GameState } from '../engine/state';
import { Confetti } from './Confetti';
import { DialogueBox, Options } from './DialogueBox';
import { bubbleSide, nameInside, wornSlot } from './bubbleSide';
import { FamilyEvent, PhotoSnap } from './FamilyEvent';
import { LiveSprite } from './LiveSprite';
import { PropLayer, propPos } from './PropLayer';
import { Puppet } from './Puppet';
import { TreasureIcon } from './TreasureIcon';
import { rigFor } from '../game/rigs';
import { canFly, farAt, farthestY, horizonOf, nearSeat, perchAt, placeScale, puppetClip, SEAT_REACH, snapToLane, snapToSeats, walkMs, WALK_MS } from '../game/staging';
import { assetUrl, background, homePlacement, spriteFor, tappedAnchor, tapOrder, type Placement } from './scene';
import { useQuest, type Cast } from './useQuest';
import { acceptsDown, dragSpot, endsTrack, isDrag, withoutKey, type Spot } from './drag';
import { placeActor, spotKey } from '../engine/spots';
import { takePhoto, type Shot } from '../engine/photoAlbum';

interface Props {
  state: GameState;
  setState: (fn: (s: GameState) => GameState) => void;
  species: SpeciesDef;
  biome: BiomeDef;
  /** la famille change de lieu (fin d'une aventure, ou choix d'un autre lieu) */
  onPlace: (id: PlaceId) => void;
  /** lieu affiché à l'écran (bandeau du haut), y compris pendant une aventure qui voyage */
  onWhere?: (id: PlaceId) => void;
}

/** Ce qui se joue : une activité courte ou une aventure à plusieurs scènes. */
interface Running {
  script: QuestScript;
  title: string;
  icon: string;
  mechanic: string;
  teach?: TeachChoice;
  choice?: string;
  actor: ActorRef;
  key: number;
}

/** Nom affiché (les parents peuvent avoir été renommés par la famille : engine/names.ts). */
const actorName = nameOf;

/** Dessin d'un personnage (parent, ou bébé à son stade). */
function spriteOf(state: GameState, species: SpeciesDef, actor: ActorRef) {
  const baby = findBaby(state, actor);
  return actor.kind === 'adult' ? spriteFor(species.id, { role: actor.role }) : baby ? spriteFor(species.id, { sex: baby.sex, stage: baby.stage }) : undefined;
}

/** Sens où regarde le dessin d'origine (1 = droite) : celui d'un personnage jamais tourné par l'enfant. */
function naturalFacing(state: GameState, species: SpeciesDef, actor: ActorRef): 1 | -1 {
  return rigFor(spriteOf(state, species, actor)?.path.split('/').pop()?.replace(/\.\w+$/, ''))?.facing ?? 1;
}

function voiceOf(state: GameState, a: ActorRef): VoiceRole {
  return a.kind === 'adult' ? a.role : babyVoice(findBaby(state, a)?.sex ?? 'girl');
}

/** Personnage de la famille qui tient chaque rôle de la scène. */
function rolesOf(state: GameState, species: SpeciesDef, actor: ActorRef): Record<Speaker, ActorRef | null> {
  const babies = getFamily(state, species.id).babies.map((b): ActorRef => ({ speciesId: species.id, kind: 'baby', babyId: b.id }));
  const isBaby = actor.kind === 'baby';
  const other = isBaby ? babies.find((b) => b.kind === 'baby' && b.babyId !== actor.babyId) : babies[1];
  return {
    actor,
    father: { speciesId: species.id, kind: 'adult', role: 'father' },
    mother: { speciesId: species.id, kind: 'adult', role: 'mother' },
    baby: isBaby ? actor : (babies[0] ?? null),
    sibling: other ?? null,
    narrator: null,
  };
}

const SPEAKERS: readonly Speaker[] = ['actor', 'father', 'mother', 'baby', 'sibling', 'narrator'];

export function Habitat({ state, setState, species: baseSpecies, biome: baseBiome, onPlace, onWhere }: Props) {
  /** le décor avec sa météo du jour (pluie, neige, vent… selon le lieu : engine/weather.ts) ; ses jeux en parlent */
  const today = useMemo(() => dayKey(new Date()), []);
  const biome = useMemo(() => withDayWeather(baseBiome, today), [baseBiome, today]);
  /** mot de la semaine choisi par le parent : l'objet qui le montre brille jusqu'à ce qu'elle le touche */
  const weekAnchor = weekWordAnchor(biome, state.settings.weekWord);
  const [weekFound, setWeekFound] = useState(false);
  /** réaction de la famille à la météo du jour (frisson sous la pluie, la neige, le vent), et « Cheese! » au déclic */
  const [react, setReact] = useState<'weather-hello' | 'cheese' | null>(null);
  useEffect(() => {
    if (!react) return;
    const t = window.setTimeout(() => setReact(null), react === 'cheese' ? 900 : 2600);
    return () => window.clearTimeout(t);
  }, [react]);
  /** bougies du gâteau d'anniversaire déjà soufflées (carte « growing up ») */
  const [blown, setBlown] = useState<readonly number[]>([]);
  const family = getFamily(state, baseSpecies.id);
  /** l'espèce avec les noms choisis par la famille pour Papa et Maman : toutes les scènes les reprennent */
  const species = useMemo(() => withParentNames(baseSpecies, family.parentNames), [baseSpecies, family.parentNames]);
  /** la maman n'accueille la joueuse qu'une fois par visite */
  const greeted = useRef(false);
  const [menuFor, setMenuFor] = useState<ActorRef | null>(null);
  const [running, setRunning] = useState<Running | null>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** déclic de l'appareil photo 📷 (flash blanc) */
  const [flash, setFlash] = useState(0);
  /** moment « Well done! » : premier jeu réussi avec cet animal (grande coche verte) */
  const [firstDone, setFirstDone] = useState<{ icon: string; titleEn: string; titleFr: string; name: string; done: number; total: number } | null>(null);
  const [grow, setGrow] = useState<{ name: string; sex: Sex; to: GrowthStage; stage: string; stageFr: string; unlocks: { icon: string; en: string; fr: string }[]; birthOrder: 1 | 2; candles: number } | null>(null);
  const [wordBubble, setWordBubble] = useState<{ anchorId: string; text: string } | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  /** cadeau du soir à choisir (après la première activité de la journée), apporté par le personnage de l'activité */
  const [giftPick, setGiftPick] = useState<{ offer: GiftDef[]; today: string; from: ActorRef } | null>(null);
  /** objet glissé au doigt ; une fois posé, sa place va dans la partie */
  const [liveGift, setLiveGift] = useState<Readonly<Record<string, Spot>>>({});
  const liveGiftRef = useRef(liveGift);
  /** petite copie du décor en pixels : lumière, ciel et sol des cadeaux posés (lue avant tout retour anticipé) */
  const bgInfo = background(biome.background);
  const pixels = useScenePixels(bgInfo ? assetUrl(bgInfo) : undefined);
  /** objet qui vient d'arriver (il brille un moment) */
  const [freshGift, setFreshGift] = useState<string | null>(null);
  useEffect(() => {
    if (!freshGift) return;
    const t = window.setTimeout(() => setFreshGift(null), 4000);
    return () => window.clearTimeout(t);
  }, [freshGift]);
  /** rituel « Bonne nuit » : qui parle, puis toute la famille dort */
  const [night, setNight] = useState<{ line: BedtimeLine | null; asleep: boolean } | null>(null);
  const nightRun = useRef(0);
  // en quittant le décor : la scène du soir s'arrête et plus personne ne parle (audit du 2026-11-25)
  useEffect(
    () => () => {
      nightRun.current++;
      speech.stop();
    },
    [],
  );
  /** chatouilles / câlin en cours (appui long sur un personnage) */
  const [cuddle, setCuddle] = useState<{ id: string; n: number; icon: string } | null>(null);
  const cuddles = useRef(0);
  /**
   * animaux en train d'être glissés au doigt (un par doigt : deux doigts ne se mélangent plus, audit du 2026-11-25) ;
   * une fois posé, sa place va dans la partie (gardée le lendemain)
   */
  const [live, setLive] = useState<Readonly<Record<string, Spot>>>({});
  const liveRef = useRef(live);
  const spotOf = (a: ActorRef): Spot | undefined => {
    const s = live[actorId(a)] ?? state.player.spots[spotKey(biome.id, actorId(a))];
    // décor à percher : une place gardée d'avant est ramenée sur l'endroit le plus proche (rocher, branche, nid)
    if (s && biome.seats?.length && !biome.groundToo) {
      const { seat: _seat, ...on } = snapToSeats(biome.seats, homePlacement(a, family, biome.groundY).h, s.x, s.y);
      return { ...s, ...on };
    }
    // décor où le sol (ou la branche) reste libre avec quelques endroits en plus (nid du chêne, plateformes du toucan) :
    // une place gardée sur l'un d'eux y reste, à la taille de l'endroit
    if (s && biome.seats?.length && biome.groundToo) {
      const on = nearSeat(biome.seats, homePlacement(a, family, biome.groundY).h, s.x, s.y, 0.5);
      if (on) {
        const { seat: _seat, ...spot } = on;
        return { ...s, ...spot };
      }
    }
    // une place gardée d'avant (hors de la branche) est ramenée sur la branche
    if (s && biome.lane) return { ...s, ...snapToLane(biome.lane, { h: homePlacement(a, family, biome.groundY, biome.lane, biome).h }, s.x, s.y) };
    // au sol : la taille suit toujours la perspective du jour (2026-11-23 : une place gardée avec l'ancienne
    // perspective, trop petite au fond, reprend la bonne taille ; un bébé qui a grandi aussi).
    if (s) {
      const home = homePlacement(a, family, biome.groundY, biome.lane, biome);
      return { ...s, h: home.h * placeScale(biome, home.y)(home.y, perchAt(biome, s.x, s.y) ?? s.y) };
    }
    return s;
  };
  useEffect(() => {
    if (!cuddle) return;
    const t = window.setTimeout(() => setCuddle(null), 1800);
    return () => window.clearTimeout(t);
  }, [cuddle]);
  const onCuddle = (a: ActorRef) => {
    const n = cuddles.current++;
    const l = cuddleLine(a.kind === 'baby' ? 'baby' : 'adult', n);
    setCuddle({ id: actorId(a), n, icon: l.icon });
    void speech.speak(l.en, { role: voiceOf(state, a), slow: state.settings.slowVoice });
  };

  const actors: ActorRef[] = useMemo(
    () => [
      { speciesId: species.id, kind: 'adult', role: 'father' },
      { speciesId: species.id, kind: 'adult', role: 'mother' },
      ...family.babies.map((b): ActorRef => ({ speciesId: species.id, kind: 'baby', babyId: b.id })),
    ],
    [species.id, family.babies],
  );

  const ctxIn = useCallback(
    (st: GameState, actor: ActorRef): QuestContext => {
      const greeted = st.player.history.some((h) => h.speciesId === species.id);
      const memory = actor.kind === 'adult' ? getFamily(st, species.id).parentMemory[actor.role] : (findBaby(st, actor)?.questMemory ?? []);
      const need = greeted && !memory.some((m) => m.startsWith('found_water')) ? ('thirsty' as const) : null;
      return { state: st, species, biome, actor, rng: createRng(seed + st.player.activityCounter * 31 + hashText(actorId(actor))), need };
    },
    [species, biome, seed],
  );
  const ctxFor = useCallback((actor: ActorRef) => ctxIn(state, actor), [ctxIn, state]);
  // la bulle « ? » des bébés curieux se recalcule après coup (rendu de faible priorité) : pas au moment
  // où l'on pose un animal ou finit un jeu, là où chaque milliseconde se voit
  const calmState = useDeferredValue(state);

  const menu = useMemo(() => {
    if (!menuFor) return null;
    const ctx = ctxFor(menuFor);
    return { activities: selectActivities(ctx), adventures: selectAdventures(ctx), progress: actorGames(state, species, menuFor) };
  }, [menuFor, ctxFor, state, species]);

  const curious = useMemo(() => {
    const out = new Set<string>();
    for (const a of actors) if (a.kind === 'baby' && selectActivities(ctxIn(calmState, a)).some((x) => x.archetype.id === 'name_object')) out.add(actorId(a));
    return out;
  }, [actors, ctxIn, calmState]);

  useEffect(() => {
    // en arrivant, la maman accueille la joueuse par son prénom (s'il est donné), puis le lieu est annoncé
    const hello = !greeted.current && state.player.name !== DEFAULT_PLAYER_NAME;
    // puis Papa dit le temps qu'il fait quand ça se voit (pluie, neige, vent, brume, nuages), et le mot de la semaine
    // est annoncé si l'objet est dans ce décor
    const wx = weatherFx(biome.weather) ? WEATHER_WORDS[biome.weather] : null;
    const ww = weekAnchor ? biome.anchors.find((a) => a.id === weekAnchor) : undefined;
    const lines = [
      ...(hello ? [{ text: say.hello(state.player.name), opts: { role: 'mother' as const } }] : []),
      { text: say.biomeWelcome(biome) },
      ...(wx ? [{ text: wx.en, opts: { role: 'father' as const } }] : []),
      ...(ww ? [{ text: WEEK_WORD.intro.en }, { text: say.decorWord(NOUNS[ww.word], ww.word) }, { text: WEEK_WORD.find.en }] : []),
    ];
    const t = setTimeout(() => {
      greeted.current = true;
      if (wx) setReact('weather-hello');
      void speech.sequence(lines);
    }, 400);
    return () => clearTimeout(t);
    // l'accueil ne se répète pas quand la partie change pendant la visite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome]);

  // hors aventure, le bandeau montre le lieu de la famille ; pendant une aventure, QuestLayer le tient à jour
  useEffect(() => {
    if (!running) onWhere?.(biome.id);
  }, [running, biome.id, onWhere]);

  useEffect(() => {
    if (!firstDone) return;
    const t = setTimeout(() => setFirstDone(null), 4200);
    return () => clearTimeout(t);
  }, [firstDone]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const onQuestDone = useCallback(
    (answers: AnswerRecord[]) => {
      if (!running) return;
      const { script, actor } = running;
      const r = applyQuestOutcome(state, { script, mechanic: running.mechanic, actor, answers, teach: running.teach, continentId: biome.continentId, choice: running.choice });
      const events: OutcomeEvents = r.events;
      setState(() => r.state);
      setRunning(null);
      const today = dayKey(new Date());
      const end = script.endPlace ?? script.biomeId;
      // le cadeau du soir arrive dans la maison où l'on est (après un voyage, ce sera à la prochaine activité)
      // (cadeaux choisis selon le climat DESSINÉ du lieu : un jour de vent dans le grand froid reste un lieu froid)
      const offer = end === biome.id && earnsGift(script) ? giftOffer(r.state, species.id, baseBiome, today) : null;
      if (offer) setGiftPick({ offer, today, from: actor });
      if (end !== biome.id) onPlace(end);
      const growing = events.grew;
      const babyName = growing ? (family.babies.find((b) => b.id === growing.babyId)?.name ?? species.babyWord.en) : actorName(state, species, actor);
      if (growing) {
        const stage = STAGE_NAMES[growing.to]!;
        const unlocks = unlockedAt(growing.to).map((x) => ({ icon: x.icon, en: x.titleEn, fr: x.titleFr }));
        const baby = family.babies.find((b) => b.id === growing.babyId);
        const sex = baby?.sex ?? 'girl';
        // anniversaire : une bougie par stade franchi (1 à 3), qu'on souffle en les touchant
        const candles = Math.max(1, Math.min(3, GROWTH_STAGES.indexOf(growing.to)));
        setBlown([]);
        setGrow({ name: babyName, sex, to: growing.to, stage: stage.en, stageFr: stage.fr, unlocks, birthOrder: baby?.birthOrder === 2 ? 2 : 1, candles });
        void speech.sequence([{ text: say.growUp(babyName, growing.to) }, { text: BIGGER_NOW.en, opts: { role: babyVoice(sex) } }, { text: BIRTHDAY.blow.en }]);
      } else if (events.treasure) {
        const t = TREASURES[events.treasure];
        if (t) setToast(`${t.icon} ${say.treasure(t.nameEn)}`);
      } else if (events.retained) {
        setToast(`💡 ${fillLine(FAMILY_LINES.remembers, { babyName }).en} « ${events.retained} »`);
      } else if (events.taught) {
        setToast(`📚 ${fillLine(FAMILY_LINES.learned, { babyName }).en} « ${events.taught} »`);
      } else if (events.photos?.length) {
        setToast(`📷 ${events.photos.length === 1 ? 'Nouvelle photo dans l’album !' : `${events.photos.length} nouvelles photos dans l’album !`}`);
      }
      // premier jeu réussi avec cet animal : grande coche verte « Well done! » (pas pendant un bébé qui grandit,
      // un cadeau à choisir ou un voyage, qui ont déjà leur propre annonce)
      const calm = !growing && !offer && end === biome.id;
      const first = calm && events.firstGame ? ARCHETYPES.find((x) => x.id === events.firstGame) : undefined;
      if (first) {
        const games = actorGames(r.state, species, actor);
        setFirstDone({ icon: first.icon, titleEn: first.titleEn, titleFr: first.titleFr, name: actorName(r.state, species, actor), done: games.filter((g) => g.done).length, total: games.length });
      }
      // l'animal félicite la joueuse par son prénom (sauf pendant l'annonce d'un bébé qui grandit,
      // d'un cadeau, ou d'un nouveau lieu, qui est annoncé) ; sans prénom, un simple « Well done! » la première fois
      if (calm && state.player.name !== DEFAULT_PLAYER_NAME) void speech.speak(say.bravo(state.player.name), { role: voiceOf(state, actor) });
      else if (first) void speech.speak(FAMILY_LINES.wellDone.en, { role: voiceOf(state, actor) });
    },
    [running, setState, biome, baseBiome, state, species, family.babies, onPlace],
  );

  const tapAnchorFree = (place: BiomeDef, anchorId: string) => {
    const a = place.anchors.find((x) => x.id === anchorId);
    if (!a) return;
    const text = say.decorWord(NOUNS[a.word], a.word);
    setWordBubble({ anchorId, text });
    if (place.id === biome.id && anchorId === weekAnchor && !weekFound) {
      setWeekFound(true);
      setToast(`⭐ ${WEEK_WORD.found.en}`);
      void speech.sequence([{ text }, { text: WEEK_WORD.found.en }]);
    } else void speech.speak(text);
    setTimeout(() => setWordBubble((w) => (w?.anchorId === anchorId ? null : w)), 2200);
  };

  const startNight = () => {
    const run = ++nightRun.current;
    const lines = bedtimeLines(family, state.player.name);
    setMenuFor(null);
    setNight({ line: null, asleep: false });
    void (async () => {
      await pause(900); // le ciel s'assombrit
      for (const line of lines) {
        if (nightRun.current !== run) return;
        setNight({ line, asleep: false });
        await Promise.all([speech.speak(line.en, { role: line.role, slow: state.settings.slowVoice }), pause(1600)]);
      }
      if (nightRun.current === run) setNight({ line: null, asleep: true });
    })();
  };
  const wakeUp = () => {
    nightRun.current++;
    speech.stop();
    setNight(null);
    void speech.speak(BEDTIME.wake.en, { role: 'father', slow: state.settings.slowVoice });
  };
  const nightWho = (a: ActorRef) => (a.kind === 'adult' ? a.role : a.babyId);

  /** lance un jeu avec le personnage du menu (carte du menu, ou icône de la ligne de progression) */
  const launch = (a: BuiltQuest) => {
    if (!menuFor) return;
    setRunning({ script: a.script, title: a.archetype.titleEn, icon: a.archetype.icon, mechanic: a.archetype.mechanic, teach: a.teach, choice: a.choice, actor: menuFor, key: Date.now() });
    setMenuFor(null);
  };

  const canHaveBaby = species.familyReady && nextBabySex(family) !== 'none';
  const otherPlaces = species.allowedBiomes.filter((p) => p !== biome.id && PLACES[p]);

  if (running) {
    return (
      <div className="screen habitat-screen">
        <QuestLayer key={running.key} running={running} state={state} species={species} actors={actors} onDone={onQuestDone} onQuit={() => setRunning(null)} onWord={tapAnchorFree} wordBubble={wordBubble} onWhere={onWhere} />
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  // --- cadeaux du soir posés dans le décor : placés et mis à l'échelle comme le papa (leur taille = la sienne
  // à cet endroit × la hauteur logique de l'objet), accordés à la lumière du dessin
  const gifts = giftsHere(state, species.id, biome);
  const papa: ActorRef = { speciesId: species.id, kind: 'adult', role: 'father' };
  const papaHome = homePlacement(papa, family, biome.groundY, biome.lane, biome);
  const papaNatural = homePlacement(papa, family, biome.groundY).h;
  const dropGift = (pointer: { x: number; y: number }, grabDy: number): Spot => {
    const hz = horizonOf(biome.groundY, biome.horizonY);
    return dragSpot(papaHome, pointer, grabDy, placeScale(biome, papaHome.y), (x) => farthestY(papaHome.y, hz, biome.farY, x), (x, y) => perchAt(biome, x, y), biome.lane, biome.water, biome.seats && { list: biome.seats, naturalH: papaNatural, groundToo: biome.groundToo }, biome.floes);
  };
  /** place gardée → taille selon la perspective du jour (comme `spotOf` pour les animaux) */
  const fitGift = (s: { x: number; y: number }): Spot => {
    if (biome.seats?.length && !biome.groundToo) {
      const { seat: _seat, ...on } = snapToSeats(biome.seats, papaNatural, s.x, s.y);
      return on;
    }
    if (biome.seats?.length && biome.groundToo) {
      const on = nearSeat(biome.seats, papaNatural, s.x, s.y, 0.5);
      if (on) {
        const { seat: _seat, ...spot } = on;
        return spot;
      }
    }
    if (biome.lane) return snapToLane(biome.lane, { h: papaHome.h }, s.x, s.y);
    return { x: s.x, y: s.y, h: papaHome.h * placeScale(biome, papaHome.y)(papaHome.y, perchAt(biome, s.x, s.y) ?? s.y) };
  };
  const sky = pixels ? skyOf(pixels) : null;

  /** la scène telle qu'elle est à l'écran (animaux, sens, cadeaux, météo du jour), prête pour l'album */
  const makeShot = (st: GameState, extra: Partial<Shot> = {}): Shot => ({
      sp: species.id,
      p: biome.id,
      a: actors.map((a) => {
        const s = spotOf(a) ?? homePlacement(a, family, biome.groundY, biome.lane, biome);
        const b = findBaby(st, a);
        const f = spotOf(a)?.f ?? naturalFacing(st, species, a);
        return a.kind === 'adult' ? { who: a.role, x: s.x, y: s.y, h: s.h, f } : { who: 'baby' as const, birthOrder: b?.birthOrder ?? 1, x: s.x, y: s.y, h: s.h, f, stage: b?.stage, sex: b?.sex };
      }),
      g: gifts.map(({ def, spot }, i) => {
        const s = fitGift(spot ?? dropGift(giftStart(i, papaHome.y), 0));
        return { id: def.id, x: s.x, y: s.y, h: s.h };
      }),
      night: !!night,
      weather: biome.weather,
      ...extra,
  });
  /** 📷 : la photo part dans l'album de la famille ; un bébé (ou Papa) dit « Cheese! » */
  const snap = () => {
    const shot = makeShot(state);
    const now = Date.now();
    const tried = takePhoto(state, shot, now);
    if (!tried.ok) {
      // rien n'a bougé depuis la photo d'avant : on montre le flash quand même, sans doublon dans l'album
      if (tried.reason === 'same') {
        setFlash(now);
        setToast(state.settings.frenchHelp ? '📷 Déjà dans l’album · bouge un animal !' : '📷 Already in the album!');
      } else setToast(state.settings.frenchHelp ? '📷 Album plein : retire une photo dans l’album' : '📷 Album full!');
      return;
    }
    setFlash(now);
    setState((st) => {
      const r = takePhoto(st, shot, now);
      return r.ok ? r.state : st;
    });
    setToast(state.settings.frenchHelp ? '📷 Photo! · dans l’album' : '📷 Photo!');
    if (!night) {
      const cheeser = actors.find((a) => a.kind === 'baby') ?? actors[0]!;
      setReact('cheese');
      void speech.speak(CHEESE.en, { role: voiceOf(state, cheeser) });
    }
  };

  /** une bougie du gâteau soufflée : on compte ; toutes soufflées, la famille chante et la photo d'anniversaire part dans l'album */
  const blowCandle = (i: number) => {
    if (!grow || blown.includes(i)) return;
    const next = [...blown, i];
    setBlown(next);
    const count = BIRTHDAY.count[next.length - 1] ?? BIRTHDAY.count[2];
    if (next.length < grow.candles) {
      void speech.speak(count.en, { slow: state.settings.slowVoice });
      return;
    }
    const now = Date.now();
    const shot = makeShot(state, { birthday: grow.birthOrder, night: false });
    setState((st) => {
      const r = takePhoto(st, shot, now);
      return r.ok ? r.state : st;
    });
    setFlash(now);
    void speech.sequence([
      { text: count.en },
      { text: BIRTHDAY.sing.en, opts: { role: 'father' } },
      { text: BIRTHDAY.sing.en, opts: { role: 'mother' } },
      { text: BIRTHDAY.photo.en },
    ]);
  };
  const partyDone = !!grow && blown.length >= grow.candles;

  return (
    <div className="screen habitat-screen">
      <div className={`stage${night ? ' night bedtime' : ''}${react ? ` ${react} wx-${biome.weather}` : ''}`}>
        <SceneBackground place={biome} />
        <WeatherLayer weather={biome.weather} />
        {night && <BedtimeSky />}
        {tapOrder(biome.anchors).map((a) => (
          <button key={a.id} className={`anchor${a.id === weekAnchor && !weekFound && !night ? ' week-word' : ''}`} style={rectStyle(a.hit)} aria-label={a.word} onClick={() => tapAnchorFree(biome, a.id)} />
        ))}
        {wordBubble && <WordBubble place={biome} anchorId={wordBubble.anchorId} text={wordBubble.text} />}
        {gifts.map(({ def, spot }, i) => {
          const s = liveGift[def.id] ?? fitGift(spot ?? dropGift(giftStart(i, papaHome.y), 0));
          const look = pixels ? giftLook(ambientAt(pixels, s.x, s.y, s.h * def.h), sky!, s.h / papaHome.h, groundAt(pixels, s.x, s.y, s.h * def.h * def.ratio * 0.5625)) : null;
          return (
            <GiftItem
              key={def.id}
              def={def}
              spot={s}
              look={look}
              fresh={freshGift === def.id}
              onTap={night ? undefined : () => void speech.speak(say.gift(def.en), { slow: state.settings.slowVoice })}
              onDragTo={
                night
                  ? undefined
                  : (pointer, grabDy) => {
                      liveGiftRef.current = { ...liveGiftRef.current, [def.id]: dropGift(pointer, grabDy) };
                      setLiveGift(liveGiftRef.current);
                    }
              }
              onDragEnd={() => {
                const cur = liveGiftRef.current[def.id];
                if (!cur) return;
                liveGiftRef.current = withoutKey(liveGiftRef.current, def.id);
                setLiveGift(liveGiftRef.current);
                setState((st) => moveGift(st, def.id, species.id, biome.id, cur));
              }}
            />
          );
        })}
        {actors.map((a) => (
          <Character
            key={actorId(a)}
            actor={a}
            state={state}
            species={species}
            place={spotOf(a) ?? homePlacement(a, family, biome.groundY, biome.lane, biome)}
            baseH={biome.seats?.length && !biome.groundToo ? homePlacement(a, family, biome.groundY).h : homePlacement(a, family, biome.groundY, biome.lane, biome).h}
            face={spotOf(a)?.f}
            dim={!!night}
            paused={showFamily || !!grow || !!giftPick}
            onDragTo={
              night
                ? undefined
                : (pointer, grabDy) => {
                    const home = homePlacement(a, family, biome.groundY, biome.lane, biome);
                    const hz = horizonOf(biome.groundY, biome.horizonY);
                    const next = dragSpot(home, pointer, grabDy, placeScale(biome, home.y), (x) => farthestY(home.y, hz, biome.farY, x), (x, y) => perchAt(biome, x, y), biome.lane, biome.water, biome.seats && { list: biome.seats, naturalH: homePlacement(a, family, biome.groundY).h, groundToo: biome.groundToo }, biome.floes);
                    // il regarde vers où on l'emmène, et garde ce sens une fois posé
                    const prev: Spot = liveRef.current[actorId(a)] ?? spotOf(a) ?? { x: home.x, y: home.y, h: home.h };
                    const dx = next.x - prev.x;
                    const f = Math.abs(dx) >= 0.4 ? (dx < 0 ? -1 : 1) : prev.f;
                    liveRef.current = { ...liveRef.current, [actorId(a)]: f ? { ...next, f } : next };
                    setLive(liveRef.current);
                  }
            }
            onDragEnd={() => {
              const id = actorId(a);
              const cur = liveRef.current[id];
              if (!cur) return;
              liveRef.current = withoutKey(liveRef.current, id);
              setLive(liveRef.current);
              setState((st) => placeActor(st, biome.id, id, cur));
            }}
            question={!night && curious.has(actorId(a))}
            action={night?.asleep ? 'sleep' : undefined}
            speaking={!!night?.line && night.line.who === nightWho(a)}
            cuddle={cuddle?.id === actorId(a) ? cuddle : null}
            onHold={night ? undefined : () => onCuddle(a)}
            onTap={night ? undefined : () => {
              setMenuFor(a);
              const b = findBaby(state, a);
              const role = voiceOf(state, a);
              // un bébé dont le menu propose un jeu jamais fait le réclame (carte « ✨ New! »)
              const wish = !!b && selectActivities(ctxFor(a)).some((x) => x.wish);
              void speech.sequence([
                { text: b ? say.babyCall(b.name, b.stage) : say.actorCall(actorName(state, species, a)), opts: { role } },
                ...(wish ? [{ text: NEW_GAME_WISH.en, opts: { role } }] : []),
              ]);
            }}
          />
        ))}
        <button className={`photo-btn${night || biome.nightImage ? ' alone' : ''}`} onClick={snap} aria-label="Take a photo">
          📷
        </button>
        {flash > 0 && <div key={flash} className="photo-flash" aria-hidden />}
        {!night && !biome.nightImage && (
          <button className="night-btn" onClick={startNight} aria-label="Good night">
            🌙
          </button>
        )}
        {night && (
          <div className="bedtime-ui">
            {night.line && (
              <p key={night.line.who} className="night-caption">
                {night.line.en}
                {state.settings.frenchHelp && <small>{night.line.fr}</small>}
              </p>
            )}
            <button className="big wake-btn" onClick={wakeUp}>
              ☀️ <span>Good morning!</span>
            </button>
          </div>
        )}
        {canHaveBaby && !night && (
          <button className="family-btn pulse" onClick={() => setShowFamily(true)} aria-label="La famille">
            💞 <span>{family.babies.length === 0 ? 'Family' : 'Surprise!'}</span>
          </button>
        )}
        {otherPlaces.length > 0 && !night && (
          <div className="place-strip" aria-label="Autres lieux">
            {otherPlaces.map((p) => {
              const place = PLACES[p]!;
              const bg = background(place.background);
              const seen = state.player.placesVisited.includes(p);
              return (
                <button
                  key={p}
                  className="place-chip"
                  onClick={() => {
                    void speech.speak(say.placeName(place));
                    onPlace(p);
                  }}
                  aria-label={place.nameEn}
                >
                  <span className="place-thumb" style={bg ? { backgroundImage: `url("${assetUrl(bg)}")` } : { background: place.placeholderGradient }} />
                  <span className="place-name">{place.nameEn}</span>
                  {seen && <span className="place-seen">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {menuFor && menu && (
          <ActivityMenu
            key={actorId(menuFor)}
            name={actorName(state, species, menuFor)}
            original={originalName(menuFor)}
            onRename={(raw) => {
              const r = renameActor(state, menuFor, raw);
              if (!r.ok) return r.error;
              setState((st) => {
                const x = renameActor(st, menuFor, raw);
                return x.ok ? x.state : st;
              });
              return null;
            }}
            onPickGame={(g) => {
              const arch = ARCHETYPES.find((x) => x.id === g.id);
              const built = arch ? buildQuest(arch, ctxFor(menuFor)) : undefined;
              if (built) launch(built);
              else void speech.speak(say.cardTitle(g.titleEn));
            }}
            onGoTo={(p) => {
              const place = PLACES[p];
              setMenuFor(null);
              if (place) void speech.speak(say.placeName(place));
              onPlace(p);
            }}
            activities={menu.activities}
            adventures={menu.adventures}
            here={biome.id}
            frenchHelp={state.settings.frenchHelp}
            isDone={(id) => gameDone(state, menuFor, id)}
            progress={menu.progress}
            onClose={() => setMenuFor(null)}
            onTurn={() => {
              const a = menuFor;
              const home = homePlacement(a, family, biome.groundY, biome.lane, biome);
              const spot = spotOf(a) ?? { x: home.x, y: home.y, h: home.h };
              const now = spot.f ?? naturalFacing(state, species, a);
              setState((st) => placeActor(st, biome.id, actorId(a), { ...spot, f: now === 1 ? -1 : 1 }));
              setMenuFor(null);
            }}
            onPickActivity={launch}
            onPickAdventure={(o) => {
              setRunning({ script: o.script, title: o.adventure.titleEn, icon: o.adventure.icon, mechanic: 'adventure', choice: o.adventure.id, actor: menuFor, key: Date.now() });
              setMenuFor(null);
            }}
          />
        )}

        {showFamily && (
          <FamilyEvent
            species={species}
            family={family}
            frenchHelp={state.settings.frenchHelp}
            slowVoice={state.settings.slowVoice}
            onDone={(fam) => {
              if (fam) setState((s) => withFamily(s, fam));
              setShowFamily(false);
            }}
          />
        )}

        {toast && <div className="toast">{toast}</div>}
        {giftPick && !grow && (
          <GiftChoice
            offer={giftPick.offer}
            role={voiceOf(state, giftPick.from)}
            slow={state.settings.slowVoice}
            frenchHelp={state.settings.frenchHelp}
            onDone={(g) => {
              const at = dropGift(giftStart(gifts.length, papaHome.y), 0);
              setState((s) => receiveGift(s, g.id, species.id, biome.id, at, giftPick.today));
              setGiftPick(null);
              setFreshGift(g.id);
            }}
          />
        )}
        {firstDone && !grow && !giftPick && (
          <div className="first-done" onClick={() => setFirstDone(null)} role="status">
            <Confetti n={18} wide />
            <div className="first-done-card">
              <span className="first-done-check" aria-hidden="true">✓</span>
              <span className="first-done-icon" aria-hidden="true">{firstDone.icon}</span>
              <p className="en">{FAMILY_LINES.wellDone.en}</p>
              <p className="first-done-game">
                {firstDone.titleEn}
                {state.settings.frenchHelp && <span className="fr"> · {firstDone.titleFr}</span>}
              </p>
              <p className="gp-count">
                <span aria-hidden="true">✓</span> {firstDone.done} / {firstDone.total} games with {firstDone.name}
              </p>
            </div>
          </div>
        )}
        {grow && (
          <div className="grow-overlay" onClick={() => partyDone && setGrow(null)}>
            <Confetti n={26} wide />
            {partyDone && <Confetti key="party" n={30} wide />}
            <div className="grow-card">
              <PhotoSnap fr={state.settings.frenchHelp} />
              <GrowPortrait speciesId={species.id} sex={grow.sex} stage={grow.to} />
              <p className="en">{grow.name} is growing up!</p>
              <p>
                {grow.stage}
                {state.settings.frenchHelp && <span className="fr"> · {grow.stageFr}</span>}
              </p>
              <p className="en">“{BIGGER_NOW.en}”</p>
              <BirthdayCake candles={grow.candles} blown={blown} onBlow={blowCandle} title={fillLine(BIRTHDAY.title, { babyName: grow.name }).en} done={partyDone} fr={state.settings.frenchHelp} />
              {grow.unlocks.length > 0 && (
                <div className="grow-unlocks">
                  <p className="fr">Nouveaux jeux avec {grow.name} :</p>
                  {grow.unlocks.map((u) => (
                    <span key={u.en} className="grow-unlock">
                      {u.icon} {u.en}
                      {state.settings.frenchHelp && <small> · {u.fr}</small>}
                    </span>
                  ))}
                </div>
              )}
              {partyDone && <button className="big next">▶</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Gâteau d'anniversaire : une bougie par stade franchi ; on la souffle en la touchant (BIRTHDAY). */
function BirthdayCake({ candles, blown, onBlow, title, done, fr }: { candles: number; blown: readonly number[]; onBlow: (i: number) => void; title: string; done: boolean; fr: boolean }) {
  return (
    <div className={`bday${done ? ' done' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="bday-cake" aria-label="Birthday cake">
        <div className="bday-candles">
          {Array.from({ length: candles }, (_, i) => (
            <button key={i} className={`bday-candle${blown.includes(i) ? ' out' : ''}`} onClick={() => onBlow(i)} aria-label={`Candle ${i + 1}`}>
              <span className="bday-flame" aria-hidden="true" />
            </button>
          ))}
        </div>
        <span className="bday-layer" aria-hidden="true" />
      </div>
      <div className="bday-text">
        <p className="bday-title">🎂 {title}</p>
        <p className="bday-hint">
          {done ? `📷 ${BIRTHDAY.photo.en}` : `👆 ${BIRTHDAY.blow.en}`}
          {fr && <small> · {done ? BIRTHDAY.photo.fr : BIRTHDAY.blow.fr}</small>}
        </p>
      </div>
    </div>
  );
}

const pause = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Ciel du coucher : lune et étoiles qui scintillent (seulement pour « Bonne nuit », pas dans les scènes ; aussi sur les photos prises la nuit). */
export function BedtimeSky() {
  return (
    <div className="night-sky bedtime-sky" aria-hidden>
      <span className="bedtime-moon">🌙</span>
      {BEDTIME_STARS.map((st, i) => (
        <span key={i} className="bedtime-star" style={{ left: `${st.x}%`, top: `${st.y}%`, animationDelay: `${st.d}s`, fontSize: `${st.s}cqw` }}>✦</span>
      ))}
    </div>
  );
}
const BEDTIME_STARS = Array.from({ length: 16 }, (_, i) => ({ x: (i * 37 + 11) % 92 + 4, y: ((i * 53) % 34) + 4, d: (i % 5) * 0.4, s: 1.2 + (i % 3) * 0.5 }));

/** Le bébé à son nouveau stade, sur fond de rayons de soleil (carte « growing up »). */
function GrowPortrait({ speciesId, sex, stage }: { speciesId: string; sex: Sex; stage: GrowthStage }) {
  const sprite = spriteFor(speciesId, { sex, stage });
  if (!sprite) return null;
  return (
    <div className="grow-portrait">
      <span className="grow-rays" aria-hidden />
      <LiveSprite key={sprite.path} className="grow-baby" sprite={sprite} clip="talk" />
    </div>
  );
}

const rectStyle = (r: { x: number; y: number; w: number; h: number }) => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });

function SceneBackground({ place }: { place: BiomeDef }) {
  const bg = background(place.background);
  return bg ? (
    <img className="stage-bg" src={assetUrl(bg)} alt="" draggable={false} />
  ) : (
    <>
      <div className="stage-bg" style={{ background: place.placeholderGradient }} />
      <span className="provisional">Décor provisoire · {place.nameFr}</span>
    </>
  );
}

function WordBubble({ place, anchorId, text }: { place: BiomeDef; anchorId: string; text: string }) {
  const a = place.anchors.find((x) => x.id === anchorId);
  if (!a) return null;
  return (
    <span className="word-bubble" style={{ left: `${a.hit.x + a.hit.w / 2}%`, top: `${a.hit.y}%` }}>
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------

interface CharacterProps {
  actor: ActorRef;
  state: GameState;
  species: SpeciesDef;
  place: Placement;
  question?: boolean;
  action?: string;
  speaking?: boolean;
  hidden?: boolean;
  /** caché mais qui dépasse de sa cachette, de ce côté (1 = à droite, -1 = à gauche) */
  peek?: 1 | -1;
  found?: boolean;
  onTap?: () => void;
  /** émojis des habits portés (jeu « Too hot! ») */
  wearing?: string[];
  /** on attend qu'elle touche un personnage (« Simon says! ») */
  wanted?: boolean;
  /** bonne réponse montrée après deux erreurs */
  glow?: boolean;
  /** réaction à un appui long (chatouilles, câlin) */
  cuddle?: { n: number; icon: string } | null;
  onHold?: () => void;
  /** glisser au doigt : `pointer` = doigt en % de la scène, `grabDy` = écart doigt → pieds à la prise */
  onDragTo?: (pointer: { x: number; y: number }, grabDy: number) => void;
  /** animal posé (doigt levé après un glisser) */
  onDragEnd?: () => void;
  /** hauteur à sa place habituelle : ailleurs il est agrandi ou réduit (perspective) sans changer de taille réelle */
  baseH?: number;
  /** sens où il regarde au repos (choisi par l'enfant) ; absent = sens du dessin */
  face?: 1 | -1;
  /** nuit : dessin assombri */
  dim?: boolean;
  /** caché sous un calque plein écran (famille, « grandit », autocollant) : l'animation s'arrête */
  paused?: boolean;
}

function Character({ actor, state, species, place, question, action, speaking, hidden, peek, found, onTap, wearing, wanted, glow, cuddle, onHold, onDragTo, onDragEnd, baseH, face, dim, paused }: CharacterProps) {
  const sprite = spriteOf(state, species, actor);
  const name = actorName(state, species, actor);
  const rig = rigFor(sprite?.path.split('/').pop()?.replace(/\.\w+$/, ''));
  const [puppetOk, setPuppetOk] = useState<boolean | null>(null);
  // marche : le personnage change de place → il marche le temps du trajet, tourné vers où il va
  const natural: 1 | -1 = rig?.facing ?? 1;
  const rest: 1 | -1 = face ?? natural;
  // durée du trajet selon la distance (vitesse de marche constante), calculée au rendu où la place change
  const track = useRef({ x: place.x, y: place.y, ms: WALK_MS });
  if (track.current.x !== place.x || track.current.y !== place.y) {
    track.current = { x: place.x, y: place.y, ms: walkMs(place.x - track.current.x, place.y - track.current.y) };
  }
  const prev = useRef({ x: place.x, y: place.y });
  const [walk, setWalk] = useState<{ dir: 1 | -1 } | null>(null);
  const lastDir = useRef<1 | -1>(rest);
  useEffect(() => {
    const dx = place.x - prev.current.x, dy = place.y - prev.current.y;
    prev.current = { x: place.x, y: place.y };
    if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return;
    // un tout petit écart de côté ne le fait pas se retourner (pas de clignotement gauche/droite)
    if (Math.abs(dx) >= 0.4) lastDir.current = dx < 0 ? -1 : 1;
    setWalk({ dir: lastDir.current });
    const t = window.setTimeout(() => setWalk(null), track.current.ms);
    return () => window.clearTimeout(t);
  }, [place.x, place.y]);
  useEffect(() => {
    if (!walk) lastDir.current = rest;
  }, [rest, walk]);
  const flies = canFly(species.mobility, actor.kind === 'baby' ? getFamily(state, actor.speciesId).babies.find((b) => b.id === actor.babyId)?.stage : undefined);
  const clip = puppetClip({ walking: !!walk, action, speaking, flies });
  const facing: 1 | -1 = walk ? walk.dir : action ? lastDir.current : rest;
  const puppet = !!rig && !!sprite && puppetOk !== false && !hidden;
  // appui long : chatouilles / câlin ; le simple toucher garde son effet (menu)
  const hold = useRef<{ timer: number; fired: boolean } | null>(null);
  const cancelHold = () => {
    if (hold.current) window.clearTimeout(hold.current.timer);
    if (hold.current && !hold.current.fired) hold.current = null;
  };
  useEffect(() => () => cancelHold(), []);
  // glisser au doigt : un petit tremblement reste un toucher (menu), au-delà l'animal suit le doigt
  const drag = useRef<{ pointerId: number; sx: number; sy: number; grabDy: number; on: boolean; rect: DOMRect } | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  // un doigt ou une souris envoient 120 à 240 mouvements par seconde : on n'en garde qu'un par image
  const pendingMove = useRef<{ x: number; y: number; grabDy: number } | null>(null);
  const moveRaf = useRef(0);
  const flushMove = () => {
    if (moveRaf.current) cancelAnimationFrame(moveRaf.current);
    moveRaf.current = 0;
    const m = pendingMove.current;
    pendingMove.current = null;
    if (m) onDragTo?.({ x: m.x, y: m.y }, m.grabDy);
  };
  useEffect(() => () => cancelAnimationFrame(moveRaf.current), []);
  const toStage = (e: React.PointerEvent, rect: DOMRect) => ({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  const dragProps = onDragTo
    ? {
        onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
          const d = drag.current;
          if (!d || d.pointerId !== e.pointerId) return;
          if (!d.on) {
            if (!isDrag({ x: e.clientX - d.sx, y: e.clientY - d.sy })) return;
            d.on = true;
            dragged.current = true;
            if (hold.current) window.clearTimeout(hold.current.timer);
            hold.current = null;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            setDragging(true);
          }
          pendingMove.current = { ...toStage(e, d.rect), grabDy: d.grabDy };
          if (!moveRaf.current) moveRaf.current = requestAnimationFrame(flushMove);
        },
      }
    : {};
  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!onDragTo || !rect || !rect.height) return;
    drag.current = { pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, grabDy: place.y - toStage(e, rect).y, on: false, rect };
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!endsTrack(drag.current, e.pointerId)) return; // un autre doigt : ce glisser continue
    if (drag.current?.on) {
      flushMove(); // dernière position du doigt avant de poser
      setDragging(false);
      setWalk(null); // posé : il s'arrête net
      onDragEnd?.();
    }
    drag.current = null;
  };
  const holdProps = onHold
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
          if (!acceptsDown(drag.current)) return; // déjà tenu par un autre doigt
          dragged.current = false; // un glisser interrompu (geste du système) n'avale plus ce toucher
          startDrag(e);
          cancelHold();
          const h = { fired: false, timer: 0 };
          h.timer = window.setTimeout(() => {
            h.fired = true;
            onHold();
          }, HOLD_MS);
          hold.current = h;
        },
        onPointerLeave: cancelHold,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      }
    : {};
  const click = () => {
    if (dragged.current) {
      dragged.current = false;
      return; // l'animal vient d'être déplacé : pas de menu
    }
    if (hold.current?.fired) {
      hold.current = null;
      return; // l'appui long a déjà répondu
    }
    hold.current = null;
    onTap?.();
  };
  const base = baseH ?? place.h;
  return (
    <button
      className={`char${action ? ` act-${action}` : ''}${speaking ? ' speaking' : ''}${hidden ? ' hidden' : ''}${hidden && peek ? ` peek peek-${peek === 1 ? 'r' : 'l'}` : ''}${found ? ' found' : ''}${puppet && puppetOk ? ' puppeted' : ''}${puppet && walk ? ' walking' : ''}${flies && walk && !dragging ? ' flying' : ''}${wanted ? ' wanted' : ''}${glow ? ' glow' : ''}${cuddle ? (actor.kind === 'baby' ? ' tickled' : ' hugged') : ''}${onDragTo ? ' movable' : ''}${dragging ? ' dragging' : ''}${nameInside(place.y) ? ' low' : ''}`}
      style={{
        // déplacé par transform (calculé par la carte graphique, sans recalcul de mise en page) : marche fluide
        height: `${base}%`,
        transform: `translate(${place.x}cqw, ${(place.y * 9) / 16}cqw) translate(-50%, -100%) scale(${place.h / base})`,
        transitionDuration: `${track.current.ms}ms`,
        ['--trip' as string]: `${track.current.ms}ms`,
        zIndex: dragging ? 400 : Math.round(place.y),
        // tout petit au fond du décor : zone de prise agrandie (invisible) pour pouvoir le reprendre au doigt
        ['--grab' as string]: `${Math.round(Math.max(0, 0.45 / (place.h / base) - 1) * 50)}%`,
      }}
      onClick={click}
      disabled={!onTap && !onHold}
      aria-label={name}
      {...holdProps}
      {...dragProps}
      // fin du geste toujours écoutée, même si le glisser est retiré en cours (🌙 pendant qu'un doigt glisse)
      onPointerUp={(e) => {
        endDrag(e);
        cancelHold();
      }}
      onPointerCancel={(e) => {
        endDrag(e);
        cancelHold();
      }}
      onLostPointerCapture={endDrag}
    >
      {sprite ? (
        <img src={assetUrl(sprite)} alt="" draggable={false} style={!puppet && facing !== natural ? { transform: 'scaleX(-1)' } : undefined} />
      ) : (
        <span className="char-icon" style={{ fontSize: `${base * 0.3}cqw` }}>{species.icon}</span>
      )}
      {puppet && <Puppet rig={rig!} src={assetUrl(sprite!)} clip={clip} facing={facing} onReady={setPuppetOk} dim={dim} paused={paused} lifted={dragging} />}
      {question && <span className="q-bubble">?</span>}
      {wearing?.map((k) => (
        <span key={k} className={`worn worn-${wornSlot(k)}`}>
          {PROPS[k]?.emoji}
        </span>
      ))}
      <span className="char-name">{name}</span>
      {action === 'drink_trunk' && <span className="splash">💦</span>}
      {action === 'splash' && <span className="splash">💦</span>}
      {(action === 'rest' || action === 'sleep') && <span className="zzz">z z</span>}
      {action === 'eat' && <span className="splash">😋</span>}
      {action === 'roar' && <span className="splash">💥</span>}
      {action === 'dance' && <span className="splash">🎵</span>}
      {action === 'wave' && <span className="splash">👋</span>}
      {action === 'swim' && <span className="splash">🌊</span>}
      {cuddle && (
        <span key={cuddle.n} className="cuddle-pop" aria-hidden>
          <span>{cuddle.icon}</span>
          <span>💗</span>
          <span>💗</span>
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------

interface MenuProps {
  name: string;
  activities: RankedActivity[];
  adventures: AdventureOffer[];
  here: PlaceId;
  frenchHelp: boolean;
  onPickActivity: (a: RankedActivity) => void;
  onPickAdventure: (a: AdventureOffer) => void;
  /** ce jeu a-t-il déjà été réussi avec cet animal ? (carte verte avec une coche) */
  isDone: (archetypeId: string) => boolean;
  /** tous les jeux possibles avec cet animal, réussis ou non (ligne « ✓ 3 / 15 games with Leo ») */
  progress: ActorGame[];
  onClose: () => void;
  /** le personnage se retourne (regarde de l'autre côté) */
  onTurn?: () => void;
  /** icône de la ligne de progression touchée : le jeu se lance ici */
  onPickGame: (g: ActorGame) => void;
  /** aller dans un autre lieu (jeu qui ne se joue pas dans ce décor) */
  onGoTo: (p: PlaceId) => void;
  /** nouveau nom ; renvoie l'erreur à montrer, ou null si c'est fait */
  onRename: (raw: string) => string | null;
  /** nom d'origine d'un parent (bouton « ↺ ») */
  original?: string;
}

/** Changer le nom de l'animal (✏️ à côté du nom ; demande du parent, 2026-11-25). */
function RenameForm({ name, original, frenchHelp, onRename, onClose }: { name: string; original?: string; frenchHelp: boolean; onRename: (raw: string) => string | null; onClose: () => void }) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const submit = (raw: string) => {
    const err = onRename(raw);
    if (err) {
      setError(err);
      const msg = NAME_ERRORS[err];
      if (msg) void speech.speak(msg.en);
      return;
    }
    onClose();
  };
  return (
    <form
      className="name-form rename-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <input autoFocus value={value} maxLength={40} onChange={(e) => setValue(e.target.value)} aria-label="New name" placeholder="Nouveau nom" autoComplete="off" />
      <button className="big ok" type="submit" aria-label="OK">✓</button>
      {original && original !== name && (
        <button type="button" className="rename-reset" onClick={() => submit(original)}>
          ↺ {original}
          {frenchHelp && <small> nom d’origine</small>}
        </button>
      )}
      <button type="button" className="rename-cancel" onClick={onClose}>Annuler</button>
      {error && <p className="name-error">{NAME_ERRORS[error]?.fr ?? 'Ce nom ne peut pas être gardé.'}</p>}
    </form>
  );
}

/** Petite fenêtre volante au survol d'une icône de jeu : son nom (et le français si l'aide est active). */
export const GameTip = ({ en, fr }: { en: string; fr?: string }) => (
  <span className="gp-tip" aria-hidden="true">
    {en}
    {fr && <small>{fr}</small>}
  </span>
);

/** petite coche verte des cartes réussies */
const DoneCheck = () => <span className="done-check" role="img" aria-label="done">✓</span>;

function ActivityMenu({ name, activities, adventures, here, frenchHelp, onPickActivity, onPickAdventure, isDone, progress, onClose, onTurn, onPickGame, onGoTo, onRename, original }: MenuProps) {
  const doneCount = progress.filter((g) => g.done).length;
  const [renaming, setRenaming] = useState(false);
  /** jeu touché dans la ligne de progression qui se joue dans un autre lieu */
  const [away, setAway] = useState<ActorGame | null>(null);
  const tapGame = (g: ActorGame) => {
    if (g.places.includes(here)) return onPickGame(g);
    setAway(g);
    const p = PLACES[g.places[0]!];
    void speech.sequence([{ text: say.cardTitle(g.titleEn) }, ...(p ? [{ text: say.placeName(p) }] : [])]);
  };
  return (
    <div className="activity-menu" role="dialog" aria-label={`Jouer avec ${name}`}>
      <div className="picker-head">
        <h2>
          {name}
          {!renaming && (
            <button className="rename-btn" onClick={() => setRenaming(true)} aria-label="Change the name" title={frenchHelp ? 'Changer le nom' : undefined}>
              ✏️
            </button>
          )}
        </h2>
        {onTurn && (
          <button className="turn-btn" onClick={onTurn} aria-label="Turn around">
            <span aria-hidden="true">⇄</span> Turn around{frenchHelp && <small>Se retourner</small>}
          </button>
        )}
        <button className="round" onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      {renaming && <RenameForm name={name} original={original} frenchHelp={frenchHelp} onRename={onRename} onClose={() => setRenaming(false)} />}
      {progress.length > 0 && (
        <div className="games-progress">
          <span className={`gp-count${doneCount === progress.length ? ' all' : ''}`}>
            <span aria-hidden="true">✓</span> {doneCount} / {progress.length} games with {name}
            {frenchHelp && <span className="fr"> · jeux réussis avec {name}</span>}
          </span>
          <div className="gp-icons">
            {progress.map((g) => (
              <button
                key={g.id}
                className={`gp-icon${g.done ? ' done' : ''}`}
                aria-label={`${g.titleEn}${g.done ? ' — done' : ''}`}
                onClick={() => tapGame(g)}
              >
                <span aria-hidden="true">{g.icon}</span>
                {g.done && <span className="gp-check" aria-hidden="true">✓</span>}
                {!g.places.includes(here) && <span className="gp-away-dot" aria-hidden="true">➜</span>}
                <GameTip en={g.titleEn} fr={frenchHelp ? g.titleFr : undefined} />
              </button>
            ))}
          </div>
          {away && (
            <div className="gp-away" role="note">
              <span className="opt-icon" aria-hidden="true">{away.icon}</span>
              <span className="gp-away-txt">
                <b>{away.titleEn}</b>
                {frenchHelp && <span className="fr"> · ce jeu se joue ailleurs</span>}
              </span>
              {away.places.map((p) => (
                <button key={p} className="gp-go" onClick={() => onGoTo(p)}>
                  ➜ {PLACES[p]?.nameEn ?? p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {adventures.some((o) => o.adventure.start === here) && (
        <>
          <h3 className="menu-section">🗺️ Adventure here{frenchHelp && <span className="fr"> · Aventure ici</span>}</h3>
          <div className="activity-cards adventures">
            {adventures.filter((o) => o.adventure.start === here).map((o) => {
              const t = TREASURES[o.adventure.treasure];
              const away = o.adventure.start !== here ? PLACES[o.adventure.start] : undefined;
              return (
                <div className={`option adv${o.done ? ' done' : ''}`} key={o.adventure.id}>
                  {o.done > 0 && <DoneCheck />}
                  <button className="option-main activity" onClick={() => onPickAdventure(o)}>
                    <span className="opt-icon">{o.adventure.icon}</span>
                    <span className="opt-text">{o.adventure.titleEn}</span>
                    {frenchHelp && <span className="fr">{o.adventure.titleFr}</span>}
                    <span className="adv-meta">
                      {away && <span className="adv-away">➜ {away.nameEn}</span>}
                      {t && <span className={`adv-treasure${o.done ? ' got' : ''}`}>{o.done ? <TreasureIcon t={t} /> : '🎁'}</span>}
                    </span>
                  </button>
                  <button className="listen" aria-label="Écouter" onClick={() => void speech.speak(say.cardTitle(o.adventure.titleEn))}>🔊</button>
                </div>
              );
            })}
          </div>
        </>
      )}
      <h3 className="menu-section">🎲 Games{frenchHelp && <span className="fr"> · Jeux</span>}</h3>
      <div className="activity-cards">
        {activities.map((a) => (
          <div className={`option${isDone(a.archetype.id) ? ' played' : ''}${a.wish ? ' wish' : ''}`} key={a.archetype.id}>
            {isDone(a.archetype.id) && <DoneCheck />}
            {a.wish && <span className="wish-badge">✨ New!{frenchHelp && <small> Nouveau</small>}</span>}
            <button className="option-main activity" onClick={() => onPickActivity(a)}>
              <span className="opt-icon">{a.archetype.icon}</span>
              <span className="opt-text">{a.archetype.titleEn}</span>
              {frenchHelp && <span className="fr">{a.archetype.titleFr}</span>}
            </button>
            <button className="listen" aria-label="Écouter" onClick={() => void speech.speak(say.cardTitle(a.archetype.titleEn))}>🔊</button>
          </div>
        ))}
      </div>
      {/* rangée des aventures des autres décors retirée (2026-11-25, trop chargé pour 7 ans) : une aventure se trouve
          dans son propre décor, sous « Adventure here » */}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface QuestLayerProps {
  running: Running;
  state: GameState;
  species: SpeciesDef;
  actors: ActorRef[];
  onDone: (answers: AnswerRecord[]) => void;
  onQuit: () => void;
  onWord: (place: BiomeDef, anchorId: string) => void;
  wordBubble: { anchorId: string; text: string } | null;
  onWhere?: (id: PlaceId) => void;
}

function QuestLayer({ running, state, species, actors, onDone, onQuit, onWord, wordBubble, onWhere }: QuestLayerProps) {
  const { actor, script } = running;
  const family = getFamily(state, species.id);
  // distribution des rôles figée au début de la scène
  const [roles] = useState(() => rolesOf(state, species, actor));
  const cast: Cast = useMemo(() => {
    const c = {} as Cast;
    for (const sp of SPEAKERS) {
      const ref = roles[sp];
      c[sp] = sp === 'narrator' ? { name: '📖', role: 'narrator' } : ref ? { name: actorName(state, species, ref), role: voiceOf(state, ref) } : null;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);
  const vars = useCallback(
    (place: string): Vars => ({
      actorName: cast.actor?.name ?? '',
      playerName: state.player.name,
      babyName: cast.baby?.name ?? '',
      siblingName: cast.sibling?.name ?? '',
      placeName: PLACES[place]?.nameEn ?? '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cast],
  );
  const q = useQuest(script, vars, cast, state.settings.slowVoice, onDone);
  const { state: run, step } = q;
  const place = PLACES[run.place]!;
  useEffect(() => onWhere?.(run.place), [run.place, onWhere]);
  const idOf = (sp: Speaker) => (roles[sp] ? actorId(roles[sp]!) : null);

  const glow = step?.kind === 'ask' ? step.pointAt : q.reveal?.anchor;
  // la bulle ne cache jamais ce qu'on demande de regarder ou de toucher
  const side = useMemo(() => {
    const ground = run.props.filter((p) => !p.sky);
    const pts = ground.map((p) => ({ x: propPos(p, place).left, y: propPos(p, place).top }));
    const rect = (id?: string) => place.anchors.find((a) => a.id === id)?.hit;
    const targets = step?.kind === 'tapAnchor' ? [step.anchor] : step?.kind === 'seek' ? [step.hideAt] : [glow];
    const main = targets.map(rect).filter((r): r is NonNullable<typeof r> => !!r);
    if (step?.kind === 'tapProps') for (const p of ground.filter((x) => step.targets.includes(x.id))) main.push({ x: propPos(p, place).left - 3, y: propPos(p, place).top - 10, w: 6, h: 10 });
    return bubbleSide(pts, main);
  }, [run.props, place, step, glow]);
  const treasure = run.treasure ? TREASURES[run.treasure] : undefined;

  return (
    <div className={`stage${run.travels ? ' traveling' : ''}${run.night ? ' night' : ''}`}>
      <SceneBackground place={place} />
      {/* même météo du jour qu'à la maison ; un lieu traversé pendant une aventure garde son temps dessiné */}
      <WeatherLayer weather={run.place === script.biomeId ? weatherOfDay(place, dayKey(new Date())) : place.weather} />
      <div className="night-sky" aria-hidden />
      {run.photos.length > 0 && <div key={`flash${run.photos.length}`} className="photo-flash" aria-hidden />}
      {run.travels > 0 && <div key={run.travels} className="travel-fade" />}
      {run.travels > 0 && (
        <div key={`card${run.travels}`} className="travel-card" aria-hidden>
          🧭 <span>{place.nameEn}</span>
          {state.settings.frenchHelp && <small>{place.nameFr}</small>}
        </div>
      )}
      {tapOrder(place.anchors).map((a) => (
        <button
          key={`${place.id}:${a.id}`}
          className={`anchor${glow === a.id ? ' glow' : ''}${q.wantsAnchor ? ' wanted' : ''}`}
          style={rectStyle(a.hit)}
          aria-label={a.word}
          onClick={() => (q.wantsAnchor ? q.tapAnchor(step?.kind === 'tapAnchor' ? tappedAnchor(place, a.id, step.anchor) : a.id) : onWord(place, a.id))}
        />
      ))}
      {wordBubble && !q.wantsAnchor && <WordBubble place={place} anchorId={wordBubble.anchorId} text={wordBubble.text} />}
      <PropLayer place={place} props={run.props} tapped={run.tapped} reveal={q.reveal?.props} active={q.wantsProp} counting={step?.kind === 'tapProps' && !!step.count} onTap={q.tapProp} />
      {actors.map((a) => {
        const id = actorId(a);
        const home = homePlacement(a, family, place.groundY, place.lane, place);
        const mySpeakers = SPEAKERS.filter((sp) => idOf(sp) === id);
        const move = mySpeakers.map((sp) => run.moves[sp]).find(Boolean);
        const hiding = run.hiding && mySpeakers.includes(run.hiding.who) ? run.hiding : null;
        const anchorAt = (anchorId: string) => place.anchors.find((x) => x.id === anchorId);
        const target = hiding?.found ? anchorAt(hiding.at) : move ? anchorAt(move.anchor) : undefined;
        // caché : il dépasse à moitié du bord de sa cachette (cache-cache, game/peek.ts)
        const hideAt = hiding && !hiding.found ? anchorAt(hiding.at) : undefined;
        const peek = hideAt ? peekSpot(hideAt) : undefined;
        const toY = peek ? peek.y : target ? (target.stand?.y ?? target.hit.y + target.hit.h) : home.y;
        const natural = homePlacement(a, family, place.groundY).h;
        const toX = peek ? peek.x : target ? (target.stand?.x ?? target.hit.x + target.hit.w / 2) : home.x;
        // décor à percher : il va se poser sur l'endroit le plus proche de ce qu'il va voir (rocher, branche, nid)
        const seat = target && place.seats?.length ? (place.groundToo ? nearSeat(place.seats, natural, toX, toY, SEAT_REACH) : snapToSeats(place.seats, natural, toX, toY)) : undefined;
        const perched = seat ? (({ seat: _seat, ...on }: typeof seat) => ({ ...home, ...on }))(seat) : undefined;
        // même perspective que l'animal posé au doigt (taille au fond choisie sur le dessin du décor, places/depth.ts) ;
        // sur un rocher, la taille de son pied ; jamais plus petit qu'au fond du sol
        const sizeY = Math.max(perchAt(place, toX, toY) ?? toY, place.farY === undefined ? toY : Math.min(farAt(place.farY, toX), home.y));
        const pos = perched ?? (target || peek ? { ...home, x: toX, y: toY, h: place.lane ? home.h : home.h * placeScale(place, home.y)(home.y, sizeY) } : home);
        const acting = run.acting && mySpeakers.includes(run.acting.who) ? run.acting.action : undefined;
        const speaking = !!run.bubble && mySpeakers.includes(run.bubble.who) && !move;
        const worn = mySpeakers.flatMap((sp) => run.wearing[sp] ?? []);
        const glowing = !!q.reveal?.actor && mySpeakers.includes(q.reveal.actor);
        return <Character key={id} actor={a} state={state} species={species} place={pos} baseH={place.seats?.length && !place.groundToo ? natural : home.h} dim={!!run.night} action={acting ?? move?.action} speaking={speaking} hidden={!!hiding && !hiding.found} peek={peek?.side} face={peek?.side} found={!!hiding?.found} wearing={worn} wanted={q.wantsActor} glow={glowing} onTap={peek && hiding && q.wantsAnchor ? () => q.tapAnchor(hiding.at) : q.wantsActor ? () => q.tapActor(mySpeakers) : undefined} />;
      })}
      <div className="quest-title">
        {running.icon} {running.title}
        <span className="quest-progress">
          <span style={{ width: `${Math.round(((run.index + 1) / script.steps.length) * 100)}%` }} />
        </span>
      </div>
      <button className="quit" onClick={onQuit} aria-label="Arrêter l'activité">✕</button>
      {run.photos.length > 0 && (
        <div className="photo-strip" aria-label="Photos">
          {run.photos.map((anchorId, i) => {
            const a = place.anchors.find((x) => x.id === anchorId);
            const bg = background(place.background);
            if (!a) return null;
            return (
              <span key={`${anchorId}${i}`} className="polaroid small">
                <span className="polaroid-img" style={bg ? { backgroundImage: `url("${assetUrl(bg)}")`, backgroundPosition: `${a.hit.x + a.hit.w / 2}% ${a.hit.y + a.hit.h / 2}%` } : { background: place.placeholderGradient }} />
                <span className="polaroid-txt">{NOUNS[a.word]?.en ?? a.word}</span>
              </span>
            );
          })}
        </div>
      )}
      {treasure && (
        <div className="treasure-card" key={treasure.id}>
          <Confetti />
          <span className="treasure-icon"><TreasureIcon t={treasure} /></span>
          <span className="treasure-name">{treasure.nameEn}</span>
          {state.settings.frenchHelp && <span className="fr">{treasure.nameFr}</span>}
        </div>
      )}
      {q.finished && <Confetti n={30} wide />}
      {q.bubble && step && step.kind !== 'moveTo' && step.kind !== 'moveBack' && step.kind !== 'props' && (
        <DialogueBox speaker={cast[q.bubble.who]?.name ?? ''} line={q.bubble.line} frenchHelp={state.settings.frenchHelp} onReplay={q.replay} onBack={q.canBack ? q.back : undefined} mood={run.feedback} side={side} mic={state.settings.micRepeat ? <RepeatMic onReplay={() => q.replay(false)} /> : undefined}>
          {step.kind === 'ask' && run.feedback !== 'ok' && <Options options={step.options.map((o) => ({ ...o, line: q.filled(o.line) }))} biome={place} reveal={q.reveal?.option !== undefined} disabled={false} onChoose={q.choose} listen={step.listen} />}
          {step.kind === 'command' && run.feedback !== 'ok' && (
            <>
              <Options options={step.options.map((o) => ({ line: q.filled(o.line), icon: o.icon, correct: !!o.action }))} biome={place} reveal={false} disabled={false} onChoose={q.choose} done={run.tapped.map(Number)} />
              <p className="hint-tap">
                <span className="tap-count">{run.tapped.length} / {step.need}</span>
              </p>
            </>
          )}
          {(step.kind === 'tapAnchor' || step.kind === 'seek' || step.kind === 'tapActor') && run.feedback !== 'ok' && <p className="hint-tap">👆</p>}
          {step.kind === 'tapProps' && run.feedback !== 'ok' && (
            <p className="hint-tap">
              👆 {step.targets.length > 1 && <span className="tap-count">{run.tapped.length} / {step.targets.length}</span>}
            </p>
          )}
          {q.canAdvance && !q.finished && <button className="big next" onClick={q.advance} aria-label="Continuer">▶</button>}
          {q.finished && (
            <div className="celebrate">
              <span className="stars stars-pop" aria-label="Bravo !">
                {[0, 1, 2].map((i) => <span key={i} style={{ animationDelay: `${0.15 + i * 0.3}s` }}>⭐</span>)}
              </span>
              <button className="big next" onClick={q.finish} aria-label="Terminer">✓</button>
            </div>
          )}
        </DialogueBox>
      )}
    </div>
  );
}
