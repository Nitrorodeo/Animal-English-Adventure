import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { speech, type VoiceRole } from '../audio/speech';
import { babyVoice, DEFAULT_PLAYER_NAME } from '../audio/voiceKey';
import { TREASURES } from '../content/adventures';
import { FAMILY_LINES, STAGE_NAMES } from '../content/dialogues';
import { PROPS } from '../content/props';
import { NOUNS, PLACES } from '../content/places';
import type { BiomeDef, GrowthStage, PlaceId, QuestScript, Sex, Speaker, SpeciesDef } from '../content/types';
import { unlockedAt } from '../content/archetypes';
import { BEDTIME, BIGGER_NOW, say, STICKER_OFFER } from '../content/utterances';
import { bedtimeLines, type BedtimeLine } from '../engine/bedtime';
import { cuddleLine, HOLD_MS } from '../engine/cuddles';
import { dayKey, placeSticker, stickerOffer, type StickerDef } from '../engine/stickers';
import { fillLine, type Vars } from '../engine/dialogue';
import { applyQuestOutcome, type OutcomeEvents } from '../engine/events';
import { nextBabySex } from '../engine/family';
import { findBaby, selectActivities, selectAdventures, type AdventureOffer, type QuestContext, type RankedActivity, type TeachChoice } from '../engine/quests';
import { createRng } from '../engine/rng';
import type { AnswerRecord } from '../engine/skills';
import { actorId, getFamily, withFamily, type ActorRef, type GameState } from '../engine/state';
import { Confetti } from './Confetti';
import { DialogueBox, Options } from './DialogueBox';
import { bubbleSide, nameInside, wornSlot } from './bubbleSide';
import { FamilyEvent, PhotoSnap } from './FamilyEvent';
import { LiveSprite } from './LiveSprite';
import { PropLayer, propPos } from './PropLayer';
import { Puppet } from './Puppet';
import { TreasureIcon } from './TreasureIcon';
import { rigFor } from '../game/rigs';
import { canFly, depthScale, farthestY, horizonOf, nearSeat, perchAt, placeScale, puppetClip, SEAT_REACH, snapToLane, snapToSeats, walkMs, WALK_MS } from '../game/staging';
import { assetUrl, background, homePlacement, spriteFor, tappedAnchor, tapOrder, type Placement } from './scene';
import { useQuest, type Cast } from './useQuest';
import { dragSpot, isDrag, type Spot } from './drag';
import { placeActor, spotKey } from '../engine/spots';

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

function actorName(state: GameState, species: SpeciesDef, a: ActorRef): string {
  if (a.kind === 'adult') return a.role === 'father' ? species.father.name : species.mother.name;
  return findBaby(state, a)?.name ?? species.babyWord.en;
}

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

export function Habitat({ state, setState, species, biome, onPlace, onWhere }: Props) {
  const family = getFamily(state, species.id);
  /** la maman n'accueille la joueuse qu'une fois par visite */
  const greeted = useRef(false);
  const [menuFor, setMenuFor] = useState<ActorRef | null>(null);
  const [running, setRunning] = useState<Running | null>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [grow, setGrow] = useState<{ name: string; sex: Sex; to: GrowthStage; stage: string; stageFr: string; unlocks: { icon: string; en: string; fr: string }[] } | null>(null);
  const [wordBubble, setWordBubble] = useState<{ anchorId: string; text: string } | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  /** autocollant du jour à choisir (après la première activité de la journée) */
  const [stickerPick, setStickerPick] = useState<{ offer: StickerDef[]; today: string } | null>(null);
  /** rituel « Bonne nuit » : qui parle, puis toute la famille dort */
  const [night, setNight] = useState<{ line: BedtimeLine | null; asleep: boolean } | null>(null);
  const nightRun = useRef(0);
  useEffect(() => () => void nightRun.current++, []);
  /** chatouilles / câlin en cours (appui long sur un personnage) */
  const [cuddle, setCuddle] = useState<{ id: string; n: number; icon: string } | null>(null);
  const cuddles = useRef(0);
  /** animal en train d'être glissé au doigt ; une fois posé, sa place va dans la partie (gardée le lendemain) */
  const [live, setLive] = useState<{ id: string; spot: Spot } | null>(null);
  const liveRef = useRef(live);
  const spotOf = (a: ActorRef): Spot | undefined => {
    const s = live?.id === actorId(a) ? live.spot : state.player.spots[spotKey(biome.id, actorId(a))];
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
      return { state: st, species, biome, actor, rng: createRng(seed + st.player.activityCounter * 31 + actorId(actor).length), need };
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
    return { activities: selectActivities(ctx), adventures: selectAdventures(ctx) };
  }, [menuFor, ctxFor]);

  const curious = useMemo(() => {
    const out = new Set<string>();
    for (const a of actors) if (a.kind === 'baby' && selectActivities(ctxIn(calmState, a)).some((x) => x.archetype.id === 'name_object')) out.add(actorId(a));
    return out;
  }, [actors, ctxIn, calmState]);

  useEffect(() => {
    // en arrivant, la maman accueille la joueuse par son prénom (s'il est donné), puis le lieu est annoncé
    const hello = !greeted.current && state.player.name !== DEFAULT_PLAYER_NAME;
    const lines = [...(hello ? [{ text: say.hello(state.player.name), opts: { role: 'mother' as const } }] : []), { text: say.biomeWelcome(biome) }];
    const t = setTimeout(() => {
      greeted.current = true;
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
      const offer = stickerOffer(r.state, today);
      if (offer) setStickerPick({ offer, today });
      const end = script.endPlace ?? script.biomeId;
      if (end !== biome.id) onPlace(end);
      const growing = events.grew;
      const babyName = growing ? (family.babies.find((b) => b.id === growing.babyId)?.name ?? species.babyWord.en) : actorName(state, species, actor);
      if (growing) {
        const stage = STAGE_NAMES[growing.to]!;
        const unlocks = unlockedAt(growing.to).map((x) => ({ icon: x.icon, en: x.titleEn, fr: x.titleFr }));
        const sex = family.babies.find((b) => b.id === growing.babyId)?.sex ?? 'girl';
        setGrow({ name: babyName, sex, to: growing.to, stage: stage.en, stageFr: stage.fr, unlocks });
        void speech.speak(say.growUp(babyName, growing.to)).then(() => speech.speak(BIGGER_NOW.en, { role: babyVoice(sex) }));
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
      // l'animal félicite la joueuse par son prénom (sauf pendant l'annonce d'un bébé qui grandit,
      // d'un autocollant, ou d'un nouveau lieu, qui est annoncé)
      if (!growing && !offer && end === biome.id && state.player.name !== DEFAULT_PLAYER_NAME) void speech.speak(say.bravo(state.player.name), { role: voiceOf(state, actor) });
    },
    [running, setState, biome, state, species, family.babies, onPlace],
  );

  const tapAnchorFree = (place: BiomeDef, anchorId: string) => {
    const a = place.anchors.find((x) => x.id === anchorId);
    if (!a) return;
    const text = say.decorWord(NOUNS[a.word], a.word);
    setWordBubble({ anchorId, text });
    void speech.speak(text);
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

  return (
    <div className="screen habitat-screen">
      <div className={`stage${night ? ' night bedtime' : ''}`}>
        <SceneBackground place={biome} />
        {night && <BedtimeSky />}
        {tapOrder(biome.anchors).map((a) => (
          <button key={a.id} className="anchor" style={rectStyle(a.hit)} aria-label={a.word} onClick={() => tapAnchorFree(biome, a.id)} />
        ))}
        {wordBubble && <WordBubble place={biome} anchorId={wordBubble.anchorId} text={wordBubble.text} />}
        {actors.map((a) => (
          <Character
            key={actorId(a)}
            actor={a}
            state={state}
            species={species}
            place={spotOf(a) ?? homePlacement(a, family, biome.groundY, biome.lane, biome)}
            baseH={biome.seats?.length && !biome.groundToo ? homePlacement(a, family, biome.groundY).h : homePlacement(a, family, biome.groundY, biome.lane).h}
            face={spotOf(a)?.f}
            dim={!!night}
            paused={showFamily || !!grow || !!stickerPick}
            onDragTo={
              night
                ? undefined
                : (pointer, grabDy) => {
                    const home = homePlacement(a, family, biome.groundY, biome.lane, biome);
                    const hz = horizonOf(biome.groundY, biome.horizonY);
                    const next = dragSpot(home, pointer, grabDy, placeScale(biome, home.y), (x) => farthestY(home.y, hz, biome.farY, x), (x, y) => perchAt(biome, x, y), biome.lane, biome.water, biome.seats && { list: biome.seats, naturalH: homePlacement(a, family, biome.groundY).h, groundToo: biome.groundToo });
                    // il regarde vers où on l'emmène, et garde ce sens une fois posé
                    const prev: Spot = (liveRef.current?.id === actorId(a) ? liveRef.current.spot : undefined) ?? spotOf(a) ?? { x: home.x, y: home.y, h: home.h };
                    const dx = next.x - prev.x;
                    const f = Math.abs(dx) >= 0.4 ? (dx < 0 ? -1 : 1) : prev.f;
                    liveRef.current = { id: actorId(a), spot: f ? { ...next, f } : next };
                    setLive(liveRef.current);
                  }
            }
            onDragEnd={() => {
              const cur = liveRef.current;
              liveRef.current = null;
              setLive(null);
              if (cur?.id === actorId(a)) setState((st) => placeActor(st, biome.id, cur.id, cur.spot));
            }}
            question={!night && curious.has(actorId(a))}
            action={night?.asleep ? 'sleep' : undefined}
            speaking={!!night?.line && night.line.who === nightWho(a)}
            cuddle={cuddle?.id === actorId(a) ? cuddle : null}
            onHold={night ? undefined : () => onCuddle(a)}
            onTap={night ? undefined : () => {
              setMenuFor(a);
              const b = findBaby(state, a);
              void speech.speak(b ? say.babyCall(b.name, b.stage) : say.actorCall(actorName(state, species, a)), { role: voiceOf(state, a) });
            }}
          />
        ))}
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
            name={actorName(state, species, menuFor)}
            activities={menu.activities}
            adventures={menu.adventures}
            here={biome.id}
            frenchHelp={state.settings.frenchHelp}
            onClose={() => setMenuFor(null)}
            onTurn={() => {
              const a = menuFor;
              const home = homePlacement(a, family, biome.groundY, biome.lane, biome);
              const spot = spotOf(a) ?? { x: home.x, y: home.y, h: home.h };
              const now = spot.f ?? naturalFacing(state, species, a);
              setState((st) => placeActor(st, biome.id, actorId(a), { ...spot, f: now === 1 ? -1 : 1 }));
              setMenuFor(null);
            }}
            onPickActivity={(a) => {
              setRunning({ script: a.script, title: a.archetype.titleEn, icon: a.archetype.icon, mechanic: a.archetype.mechanic, teach: a.teach, choice: a.choice, actor: menuFor, key: Date.now() });
              setMenuFor(null);
            }}
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
        {stickerPick && !grow && (
          <StickerChoice
            offer={stickerPick.offer}
            frenchHelp={state.settings.frenchHelp}
            onPick={(st) => {
              void speech.speak(say.sticker(st.en));
              setState((s) => placeSticker(s, st.id, biome.continentId, stickerPick.today));
              setStickerPick(null);
              setToast(`${st.icon} ➜ 🗺️`);
            }}
          />
        )}
        {grow && (
          <div className="grow-overlay" onClick={() => setGrow(null)}>
            <Confetti n={26} wide />
            <div className="grow-card">
              <PhotoSnap fr={state.settings.frenchHelp} />
              <GrowPortrait speciesId={species.id} sex={grow.sex} stage={grow.to} />
              <p className="en">{grow.name} is growing up!</p>
              <p>
                {grow.stage}
                {state.settings.frenchHelp && <span className="fr"> · {grow.stageFr}</span>}
              </p>
              <p className="en">“{BIGGER_NOW.en}”</p>
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
              <button className="big next">▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const pause = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Ciel du coucher : lune et étoiles qui scintillent (seulement pour « Bonne nuit », pas dans les scènes). */
function BedtimeSky() {
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

/** Autocollant du jour : trois grands autocollants, un toucher suffit. */
function StickerChoice({ offer, frenchHelp, onPick }: { offer: StickerDef[]; frenchHelp: boolean; onPick: (s: StickerDef) => void }) {
  useEffect(() => {
    const t = setTimeout(() => void speech.speak(STICKER_OFFER.en), 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="grow-overlay sticker-overlay">
      <div className="grow-card sticker-card">
        <p className="en">🎁 {STICKER_OFFER.en}</p>
        {frenchHelp && <p className="fr">{STICKER_OFFER.fr} Il ira sur la carte du monde.</p>}
        <div className="sticker-row">
          {offer.map((st, i) => (
            <button key={st.id} className="sticker-pick" style={{ animationDelay: `${0.2 + i * 0.15}s` }} onClick={() => onPick(st)} aria-label={st.en}>
              <span>{st.icon}</span>
              <small>{st.en}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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

function Character({ actor, state, species, place, question, action, speaking, hidden, found, onTap, wearing, wanted, glow, cuddle, onHold, onDragTo, onDragEnd, baseH, face, dim, paused }: CharacterProps) {
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
  const drag = useRef<{ sx: number; sy: number; grabDy: number; on: boolean; rect: DOMRect } | null>(null);
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
          if (!d) return;
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
    drag.current = { sx: e.clientX, sy: e.clientY, grabDy: place.y - toStage(e, rect).y, on: false, rect };
  };
  const endDrag = () => {
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
          startDrag(e);
          cancelHold();
          const h = { fired: false, timer: 0 };
          h.timer = window.setTimeout(() => {
            h.fired = true;
            onHold();
          }, HOLD_MS);
          hold.current = h;
        },
        onPointerUp: () => {
          endDrag();
          cancelHold();
        },
        onPointerLeave: cancelHold,
        onPointerCancel: () => {
          endDrag();
          cancelHold();
        },
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
      className={`char${action ? ` act-${action}` : ''}${speaking ? ' speaking' : ''}${hidden ? ' hidden' : ''}${found ? ' found' : ''}${puppet && puppetOk ? ' puppeted' : ''}${puppet && walk ? ' walking' : ''}${flies && walk && !dragging ? ' flying' : ''}${wanted ? ' wanted' : ''}${glow ? ' glow' : ''}${cuddle ? (actor.kind === 'baby' ? ' tickled' : ' hugged') : ''}${onDragTo ? ' movable' : ''}${dragging ? ' dragging' : ''}${nameInside(place.y) ? ' low' : ''}`}
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
  onClose: () => void;
  /** le personnage se retourne (regarde de l'autre côté) */
  onTurn?: () => void;
}

function ActivityMenu({ name, activities, adventures, here, frenchHelp, onPickActivity, onPickAdventure, onClose, onTurn }: MenuProps) {
  return (
    <div className="activity-menu" role="dialog" aria-label={`Jouer avec ${name}`}>
      <div className="picker-head">
        <h2>{name}</h2>
        {onTurn && (
          <button className="turn-btn" onClick={onTurn} aria-label="Turn around">
            <span aria-hidden="true">⇄</span> Turn around{frenchHelp && <small>Se retourner</small>}
          </button>
        )}
        <button className="round" onClick={onClose} aria-label="Fermer">✕</button>
      </div>
      {adventures.some((o) => o.adventure.start === here) && (
        <>
          <h3 className="menu-section">🗺️ Adventure here{frenchHelp && <span className="fr"> · Aventure ici</span>}</h3>
          <div className="activity-cards adventures">
            {adventures.filter((o) => o.adventure.start === here).map((o) => {
              const t = TREASURES[o.adventure.treasure];
              const away = o.adventure.start !== here ? PLACES[o.adventure.start] : undefined;
              return (
                <div className={`option adv${o.done ? ' done' : ''}`} key={o.adventure.id}>
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
          <div className="option" key={a.archetype.id}>
            <button className="option-main activity" onClick={() => onPickActivity(a)}>
              <span className="opt-icon">{a.archetype.icon}</span>
              <span className="opt-text">{a.archetype.titleEn}</span>
              {frenchHelp && <span className="fr">{a.archetype.titleFr}</span>}
            </button>
            <button className="listen" aria-label="Écouter" onClick={() => void speech.speak(say.cardTitle(a.archetype.titleEn))}>🔊</button>
          </div>
        ))}
      </div>
      {adventures.some((o) => o.adventure.start !== here) && (
        <>
          <h3 className="menu-section small">🧭 Adventures in other places{frenchHelp && <span className="fr"> · Aventures ailleurs</span>}</h3>
          <div className="adv-elsewhere">
            {adventures.filter((o) => o.adventure.start !== here).map((o) => {
              const t = TREASURES[o.adventure.treasure];
              const place = PLACES[o.adventure.start];
              return (
                <button key={o.adventure.id} className={`adv-chip${o.done ? ' done' : ''}`} onClick={() => onPickAdventure(o)} aria-label={`${o.adventure.titleEn}, ${place?.nameEn ?? ''}`}>
                  <span className="opt-icon">{o.adventure.icon}</span>
                  <span className="chip-txt">
                    <span className="opt-text">{o.adventure.titleEn}</span>
                    <span className="adv-away">➜ {place?.nameEn}</span>
                  </span>
                  {t && <span className={`adv-treasure${o.done ? ' got' : ''}`}>{o.done ? <TreasureIcon t={t} /> : '🎁'}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
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
        const toY = target ? (target.stand?.y ?? target.hit.y + target.hit.h) : home.y;
        const natural = homePlacement(a, family, place.groundY).h;
        const toX = target ? (target.stand?.x ?? target.hit.x + target.hit.w / 2) : home.x;
        // décor à percher : il va se poser sur l'endroit le plus proche de ce qu'il va voir (rocher, branche, nid)
        const seat = target && place.seats?.length ? (place.groundToo ? nearSeat(place.seats, natural, toX, toY, SEAT_REACH) : snapToSeats(place.seats, natural, toX, toY)) : undefined;
        const perched = seat ? (({ seat: _seat, ...on }: typeof seat) => ({ ...home, ...on }))(seat) : undefined;
        const pos = perched ?? (target ? { ...home, x: toX, y: toY, h: place.lane ? home.h : home.h * depthScale(home.y, toY) } : home);
        const acting = run.acting && mySpeakers.includes(run.acting.who) ? run.acting.action : undefined;
        const speaking = !!run.bubble && mySpeakers.includes(run.bubble.who) && !move;
        const worn = mySpeakers.flatMap((sp) => run.wearing[sp] ?? []);
        const glowing = !!q.reveal?.actor && mySpeakers.includes(q.reveal.actor);
        return <Character key={id} actor={a} state={state} species={species} place={pos} baseH={place.seats?.length && !place.groundToo ? natural : home.h} dim={!!run.night} action={acting ?? move?.action} speaking={speaking} hidden={!!hiding && !hiding.found} found={!!hiding?.found} wearing={worn} wanted={q.wantsActor} glow={glowing} onTap={q.wantsActor ? () => q.tapActor(mySpeakers) : undefined} />;
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
        <DialogueBox speaker={cast[q.bubble.who]?.name ?? ''} line={q.bubble.line} frenchHelp={state.settings.frenchHelp} onReplay={q.replay} onBack={q.canBack ? q.back : undefined} mood={run.feedback} side={side}>
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
