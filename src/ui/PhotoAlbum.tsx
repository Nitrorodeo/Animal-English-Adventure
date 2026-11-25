import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { speech } from '../audio/speech';
import { FAMILY_LINES, STAGE_NAMES } from '../content/dialogues';
import { photoStory, quizQuestion, quizTargets, actorKey, QUIZ_START } from '../content/photoTalk';
import { NOUNS, PLACES } from '../content/places';
import { getSpecies, SPECIES } from '../content/species';
import { GROWTH_STAGES, type Line } from '../content/types';
import { say } from '../content/utterances';
import { giftDef } from '../engine/gifts';
import { ALBUM_MAX_PER_FAMILY, albumFamilies, birthdayPhoto, deletePhoto, familyPhotos, PHOTO_STICKERS, PHOTO_STICKERS_MAX, stickOnPhoto, unstickPhoto, type Photo, type SnapActor } from '../engine/photoAlbum';
import { getFamily, type Baby, type GameState } from '../engine/state';
import { stickerDef } from '../engine/stickers';
import { rigFor } from '../game/rigs';
import { Confetti } from './Confetti';
import { giftUrl } from './Gifts';
import { BedtimeSky } from './Habitat';
import { assetUrl, background, spriteFor } from './scene';
import { WeatherLayer } from './Weather';

/** Dessin d'un animal tel qu'il était sur la photo (un bébé garde l'âge qu'il avait ce jour-là). */
function snapSprite(speciesId: string, a: SnapActor) {
  if (a.who !== 'baby') return spriteFor(speciesId, { role: a.who });
  return a.sex && a.stage ? spriteFor(speciesId, { sex: a.sex, stage: a.stage }) : undefined;
}

/** position d'un appui en % de l'élément touché */
const pctOf = (e: ReactMouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
};

/**
 * Une photo redessinée : le décor, la météo du jour (figée), puis les cadeaux et les animaux à leur place, dans leur
 * sens, et les autocollants collés dessus. Aucune image n'est stockée (engine/photoAlbum.ts) : ce sont les dessins
 * du jeu, déjà sur l'appareil. Dans la vue en grand, on peut toucher un animal (« Who is in the photo? »), la photo
 * (coller un autocollant) ou un autocollant (le retirer).
 */
export function PhotoScene({
  photo,
  className = '',
  onTapActor,
  onTapScene,
  onTapSticker,
}: {
  photo: Photo;
  className?: string;
  onTapActor?: (key: string) => void;
  onTapScene?: (x: number, y: number) => void;
  onTapSticker?: (index: number) => void;
}) {
  const place = PLACES[photo.p];
  const sp = SPECIES.find((s) => s.id === photo.sp);
  const bg = place ? background(place.background) : undefined;
  return (
    <div className={`photo-scene${photo.night ? ' night' : ''}${onTapScene ? ' sticking' : ''} ${className}`} onClick={onTapScene ? (e) => { const p = pctOf(e); onTapScene(p.x, p.y); } : undefined}>
      {bg ? <img className="ps-bg" src={assetUrl(bg)} alt="" draggable={false} loading="lazy" /> : <div className="ps-bg" style={{ background: place?.placeholderGradient ?? '#9ccf7a' }} />}
      {/* prise pendant « Good night » : le même ciel que le décor (bleu nuit, lune, étoiles), pas un décor de jour assombri */}
      {photo.night && <BedtimeSky />}
      {photo.g.map((g, i) => {
        const def = giftDef(g.id);
        if (!def) return null;
        return (
          <span key={`${g.id}${i}`} className="ps-gift" style={{ height: `${g.h * def.h}%`, aspectRatio: String(def.ratio), transform: `translate(${g.x}cqw, ${(g.y * 9) / 16}cqw) translate(-50%, -100%)`, zIndex: Math.round(g.y) }}>
            <img src={giftUrl(g.id)} alt="" draggable={false} loading="lazy" />
          </span>
        );
      })}
      {photo.a.map((a) => {
        const sprite = snapSprite(photo.sp, a);
        const natural = rigFor(sprite?.path.split('/').pop()?.replace(/\.\w+$/, ''))?.facing ?? 1;
        const key = actorKey(a);
        return (
          <span
            key={key}
            className={`ps-char${onTapActor ? ' tappable' : ''}`}
            style={{ height: `${a.h}%`, transform: `translate(${a.x}cqw, ${(a.y * 9) / 16}cqw) translate(-50%, -100%)`, zIndex: Math.round(a.y) }}
            onClick={onTapActor ? (e) => { e.stopPropagation(); onTapActor(key); } : undefined}
          >
            {sprite ? (
              <img src={assetUrl(sprite)} alt="" draggable={false} loading="lazy" style={a.f !== natural ? { transform: 'scaleX(-1)' } : undefined} />
            ) : (
              <span className="ps-icon">{sp?.icon}</span>
            )}
          </span>
        );
      })}
      {/* la pluie, la neige ou le vent du jour de la photo, figés au moment du déclic */}
      <WeatherLayer weather={photo.weather} still />
      {photo.birthday && <span className="ps-bday" aria-label="Birthday photo">🎂</span>}
      {photo.stickers.map((s, i) => (
        <span
          key={`${s.id}${i}`}
          className={`ps-sticker${onTapSticker ? ' tappable' : ''}`}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
          onClick={onTapSticker ? (e) => { e.stopPropagation(); onTapSticker(i); } : undefined}
        >
          {s.icon}
        </span>
      ))}
    </div>
  );
}

type Mode = 'story' | 'quiz' | 'stick';

/**
 * Espace perso de la joueuse : l'album 📷, rangé par animal (demande du parent, 2026-11-25). Toucher une photo
 * l'ouvre en grand et le jeu la raconte en anglais ; on peut y jouer à « Who is in the photo? », y coller des
 * autocollants, ou la retirer. Chaque bébé a aussi son livre 📖 : une page par stade, et les mots appris.
 */
export function PhotoAlbum({ state, setState, current, onClose }: { state: GameState; setState: (fn: (s: GameState) => GameState) => void; current?: string; onClose: () => void }) {
  const fr = state.settings.frenchHelp;
  const slow = state.settings.slowVoice;
  const families = useMemo(() => {
    const counts = new Map(albumFamilies(state).map((f) => [f.speciesId, f.count]));
    // dans l'ordre du jeu (continents) : les animaux qui ont des photos, ou des bébés (leur livre)
    return SPECIES.filter((s) => counts.has(s.id) || getFamily(state, s.id).babies.length > 0).map((s) => ({ sp: s, count: counts.get(s.id) ?? 0 }));
  }, [state]);
  const [pick, setPick] = useState<string | undefined>(() => (current && families.some((f) => f.sp.id === current) ? current : families[0]?.sp.id));
  const shown = pick && families.some((f) => f.sp.id === pick) ? pick : families[0]?.sp.id;
  const photos = useMemo(() => (shown ? familyPhotos(state, shown) : []), [state, shown]);
  const babies = shown ? getFamily(state, shown).babies : [];
  const [open, setOpen] = useState<number | null>(null);
  const [book, setBook] = useState<Baby | null>(null);
  const [confirm, setConfirm] = useState(false);
  const big = open !== null ? photos[open] : undefined;
  useEffect(() => setConfirm(false), [open]);
  // la photo ouverte vient d'être retirée (ou n'existe plus) : retour à la grille
  useEffect(() => {
    if (open !== null && !photos[open]) setOpen(photos.length ? Math.min(open, photos.length - 1) : null);
  }, [open, photos]);

  // --- la photo en grand : récit, jeu, autocollants -----------------------------------------------------------
  const [mode, setMode] = useState<Mode>('story');
  const [caption, setCaption] = useState<Line | null>(null);
  const [quiz, setQuiz] = useState<{ round: number; score: number; won: boolean } | null>(null);
  const [glue, setGlue] = useState<string>(PHOTO_STICKERS[0]);
  const talk = useRef(0);
  const stopTalk = () => {
    talk.current++;
    speech.stop();
    setCaption(null);
  };
  /** le jeu raconte la photo, phrase par phrase, avec la légende écrite */
  const tell = async (p: Photo) => {
    const run = ++talk.current;
    speech.stop();
    for (const l of photoStory(p)) {
      if (talk.current !== run) return;
      setCaption(l);
      await speech.speak(l.en, { slow });
    }
    if (talk.current === run) setCaption(null);
  };
  const bigId = big?.id;
  useEffect(() => {
    setMode('story');
    setQuiz(null);
    if (big) void tell(big);
    else stopTalk();
    // une nouvelle photo ouverte est racontée ; l'album qui change (autocollant) ne la relance pas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bigId]);
  useEffect(() => () => stopTalk(), []);

  const ask = (p: Photo, round: number, intro = false) => {
    const q = quizQuestion(p, round);
    if (!q) return;
    talk.current++;
    setCaption(q.ask);
    void speech.sequence([...(intro ? [{ text: QUIZ_START.en, opts: { slow } }] : []), { text: q.ask.en, opts: { slow } }]);
  };
  const startQuiz = (p: Photo) => {
    setMode('quiz');
    setQuiz({ round: 0, score: 0, won: false });
    ask(p, 0, true);
  };
  const tapActor = (p: Photo, key: string) => {
    if (!quiz || quiz.won) return;
    const q = quizQuestion(p, quiz.round);
    if (!q) return;
    if (key !== q.key) {
      setCaption(FAMILY_LINES.tryAgain);
      void speech.sequence([{ text: FAMILY_LINES.tryAgain.en, opts: { slow } }, { text: q.ask.en, opts: { slow } }]);
      return;
    }
    const score = quiz.score + 1;
    if (score >= QUIZ_WINS) {
      setQuiz({ round: quiz.round + 1, score, won: true });
      setCaption(FAMILY_LINES.wellDone);
      void speech.sequence([{ text: q.yes.en, opts: { slow } }, { text: FAMILY_LINES.wellDone.en, opts: { slow } }]);
      return;
    }
    setQuiz({ round: quiz.round + 1, score, won: false });
    setCaption(q.yes);
    const next = quizQuestion(p, quiz.round + 1);
    void speech.sequence([{ text: q.yes.en, opts: { slow } }, ...(next ? [{ text: next.ask.en, opts: { slow } }] : [])]);
    if (next) window.setTimeout(() => setCaption((c) => (c === q.yes ? next.ask : c)), 1600);
  };
  const stick = (p: Photo, x: number, y: number) => {
    if (p.stickers.length >= PHOTO_STICKERS_MAX) {
      setCaption({ en: `${PHOTO_STICKERS_MAX} stickers!`, fr: `${PHOTO_STICKERS_MAX} autocollants au plus : touche-en un pour le retirer.` });
      return;
    }
    const def = stickerDef(glue);
    setState((s) => stickOnPhoto(s, p.id, glue, x, y));
    if (def) void speech.speak(say.sticker(def.en), { slow });
  };

  return (
    <div className="screen panel-screen">
      <div className="panel album-panel">
        <div className="picker-head">
          <h2>📷 My photos {fr && <small>· Mes photos</small>}</h2>
          <button className="round" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {families.length === 0 ? (
          <p className="album-empty">
            <span className="album-empty-icon" aria-hidden="true">📷</span>
            Take photos of your animals!
            {fr && <small>Touche 📷 dans le décor d’un animal pour le prendre en photo.</small>}
          </p>
        ) : (
          <>
            <div className="album-tabs" role="tablist" aria-label="Animals">
              {families.map(({ sp, count }) => {
                const art = spriteFor(sp.id, { role: 'father' });
                return (
                  <button
                    key={sp.id}
                    role="tab"
                    aria-selected={sp.id === shown}
                    className={`album-tab${sp.id === shown ? ' on' : ''}`}
                    onClick={() => {
                      setPick(sp.id);
                      setOpen(null);
                      void speech.speak(say.speciesPick(sp));
                    }}
                  >
                    {art ? <img src={assetUrl(art)} alt="" draggable={false} /> : <span aria-hidden="true">{sp.icon}</span>}
                    <span className="album-tab-name">{sp.nameEn}</span>
                    {count > 0 && <span className="album-tab-count">{count}</span>}
                  </button>
                );
              })}
            </div>
            {shown && babies.length > 0 && (
              <div className="album-books">
                {babies.map((b) => {
                  const art = spriteFor(shown, { sex: b.sex, stage: b.stage });
                  return (
                    <button key={b.id} className="album-book-btn" onClick={() => { setBook(b); void speech.speak(say.albumBorn(b.name), { slow }); }} aria-label={`${b.name}'s book`}>
                      <span aria-hidden="true">📖</span>
                      {art && <img src={assetUrl(art)} alt="" draggable={false} />}
                      <span>{b.name}</span>
                      {fr && <small>· son livre</small>}
                    </button>
                  );
                })}
              </div>
            )}
            {photos.length === 0 && (
              <p className="album-empty small">
                Take photos of your animals!
                {fr && <small>Touche 📷 dans le décor pour prendre ta première photo de cette famille.</small>}
              </p>
            )}
            <div className="album-grid">
              {photos.map((p, i) => (
                <button key={p.id} className="album-thumb" onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}, ${PLACES[p.p]?.nameEn ?? ''}`}>
                  <PhotoScene photo={p} />
                </button>
              ))}
            </div>
            {shown && photos.length >= ALBUM_MAX_PER_FAMILY && (
              <p className="album-full">{fr ? `Album plein pour ${getSpecies(shown).nameFr} (${ALBUM_MAX_PER_FAMILY} photos) : retire une photo pour en prendre une nouvelle.` : `${ALBUM_MAX_PER_FAMILY} photos!`}</p>
            )}
          </>
        )}
      </div>

      {big && open !== null && (
        <div className="album-view" role="dialog" aria-label="Photo">
          <div className="album-view-frame">
            <PhotoScene
              photo={big}
              className="big"
              onTapActor={mode === 'quiz' ? (k) => tapActor(big, k) : undefined}
              onTapScene={mode === 'stick' ? (x, y) => stick(big, x, y) : undefined}
              onTapSticker={mode === 'stick' ? (i) => setState((s) => unstickPhoto(s, big.id, i)) : undefined}
            />
            {quiz?.won && <Confetti n={24} wide />}
            {caption ? (
              <span className="album-caption" key={caption.en}>
                {caption.en}
                {fr && <small>{caption.fr}</small>}
              </span>
            ) : (
              <span className="album-view-place">{PLACES[big.p]?.nameEn}</span>
            )}
          </div>
          {mode === 'stick' && (
            <div className="album-stickers" role="radiogroup" aria-label="Stickers">
              {PHOTO_STICKERS.map((id) => {
                const def = stickerDef(id);
                if (!def) return null;
                return (
                  <button key={id} role="radio" aria-checked={glue === id} className={`album-sticker${glue === id ? ' on' : ''}`} onClick={() => { setGlue(id); void speech.speak(say.sticker(def.en), { slow }); }} aria-label={def.en}>
                    {def.icon}
                  </button>
                );
              })}
              <span className="album-stickers-hint">
                👆 {big.stickers.length} / {PHOTO_STICKERS_MAX}
                {fr && <small> · touche la photo pour coller, touche un autocollant pour le retirer</small>}
              </span>
            </div>
          )}
          {mode === 'quiz' && quiz && (
            <p className="album-quiz-score" aria-live="polite">
              {Array.from({ length: QUIZ_WINS }, (_, i) => (
                <span key={i} className={i < quiz.score ? 'on' : ''}>⭐</span>
              ))}
            </p>
          )}
          <div className="album-view-bar">
            <button className="round album-nav" onClick={() => setOpen(open - 1)} disabled={open === 0} aria-label="Previous">‹</button>
            <button className={`round album-tool${mode === 'story' && caption ? ' on' : ''}`} onClick={() => { setMode('story'); setQuiz(null); void tell(big); }} aria-label="Tell me about the photo">🔊</button>
            {quizTargets(big).length > 0 && (
              <button className={`round album-tool${mode === 'quiz' ? ' on' : ''}`} onClick={() => startQuiz(big)} aria-label="Who is in the photo?">❓</button>
            )}
            <button className={`round album-tool${mode === 'stick' ? ' on' : ''}`} onClick={() => { stopTalk(); setQuiz(null); setMode(mode === 'stick' ? 'story' : 'stick'); }} aria-label="Stickers">✨</button>
            {confirm ? (
              <span className="album-confirm">
                {fr ? 'Retirer cette photo ?' : 'Remove it?'}
                <button
                  className="album-yes"
                  onClick={() => {
                    setState((s) => deletePhoto(s, big.id));
                    setConfirm(false);
                  }}
                >
                  ✓ {fr ? 'Oui' : 'Yes'}
                </button>
                <button className="album-no" onClick={() => setConfirm(false)}>✕ {fr ? 'Non' : 'No'}</button>
              </span>
            ) : (
              <button className="album-del" onClick={() => setConfirm(true)} aria-label="Remove the photo">🗑️</button>
            )}
            <button className="round album-nav" onClick={() => setOpen(open + 1)} disabled={open >= photos.length - 1} aria-label="Next">›</button>
            <button className="round album-close" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          </div>
        </div>
      )}

      {book && shown && <BabyBook state={state} speciesId={shown} baby={book} onClose={() => { speech.stop(); setBook(null); }} />}
    </div>
  );
}

/** « Who is in the photo? » : trois bonnes réponses et c'est gagné */
export const QUIZ_WINS = 3;

/**
 * Livre du bébé 📖 : une page par stade déjà atteint (son portrait à cet âge, et la photo de son anniversaire s'il y
 * en a une), puis une page des mots qu'elle lui a appris. Toucher une page la fait lire.
 */
function BabyBook({ state, speciesId, baby, onClose }: { state: GameState; speciesId: string; baby: Baby; onClose: () => void }) {
  const fr = state.settings.frenchHelp;
  const slow = state.settings.slowVoice;
  const stages = GROWTH_STAGES.slice(0, GROWTH_STAGES.indexOf(baby.stage) + 1);
  const words = Object.keys(baby.taughtWords).filter((w) => NOUNS[w]);
  const pages = stages.length + 1;
  const [page, setPage] = useState(0);
  const stage = stages[page];
  const read = (p: number) => {
    const st = stages[p];
    if (st) void speech.speak(st === 'newborn' ? say.albumBorn(baby.name) : say.growUp(baby.name, st), { slow });
  };
  const go = (p: number) => {
    setPage(p);
    read(p);
  };
  const party = stage ? birthdayPhoto(state, speciesId, baby.birthOrder, stage) : undefined;
  const art = stage ? spriteFor(speciesId, { sex: baby.sex, stage }) : undefined;
  return (
    <div className="album-view baby-book" role="dialog" aria-label={`${baby.name}'s book`}>
      <div className="book-page">
        <p className="book-head">📖 {baby.name}</p>
        {stage ? (
          <div className="book-stage" onClick={() => read(page)}>
            <div className="book-portrait">{art && <img src={assetUrl(art)} alt="" draggable={false} />}</div>
            <p className="en">{STAGE_NAMES[stage]?.en}</p>
            {fr && <p className="fr">{STAGE_NAMES[stage]?.fr}</p>}
            {party ? (
              <div className="book-photo">
                <PhotoScene photo={party} />
                <span>🎂 Happy birthday!</span>
              </div>
            ) : (
              stage !== 'newborn' && <p className="book-nophoto">🎂</p>
            )}
          </div>
        ) : (
          <div className="book-words">
            <p className="en">📚 Words</p>
            {fr && <p className="fr">Les mots que tu lui as appris</p>}
            {words.length === 0 ? (
              <p className="book-nophoto">{fr ? 'Apprends-lui des mots dans les jeux ⭐' : '⭐'}</p>
            ) : (
              <div className="book-word-list">
                {words.map((w) => (
                  <button key={w} className={`book-word${baby.retainedWords.includes(w) ? ' kept' : ''}`} onClick={() => void speech.speak(say.decorWord(NOUNS[w], w), { slow })}>
                    {baby.retainedWords.includes(w) && <span aria-label="remembered">⭐ </span>}
                    {NOUNS[w]!.en}
                    {fr && <small> · {NOUNS[w]!.fr}</small>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="book-num">{page + 1} / {pages}</p>
      </div>
      <div className="album-view-bar">
        <button className="round album-nav" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous">‹</button>
        <button className="round album-nav" onClick={() => go(page + 1)} disabled={page >= pages - 1} aria-label="Next">›</button>
        <button className="round album-close" onClick={onClose} aria-label="Fermer">✕</button>
      </div>
    </div>
  );
}
