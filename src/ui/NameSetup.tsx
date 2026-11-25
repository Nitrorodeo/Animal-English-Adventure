import { useEffect, useRef, useState } from 'react';
import { clipPlaybackRate, speech } from '../audio/speech';
import { DEFAULT_PLAYER_NAME, paceOf } from '../audio/voiceKey';
import { NAME_ERRORS, NAME_SCREEN } from '../content/utterances';
import { sanitizeName } from '../engine/family';
import { sanitizeSpelling, type NamePron, type NamePronMode } from '../engine/nameVoice';
import { fetchNamePreview } from './useNameVoices';

interface Props {
  initialName: string;
  initialPron: NamePron | null;
  /** vitesse des voix réglée par les parents, pour les essais d'écoute */
  speechSpeed: number;
  onDone: (name: string, pron: NamePron) => void;
  /** dans l'Espace parents : sans grand titre, avec un bouton Annuler */
  onCancel?: () => void;
}

const CARDS: readonly { mode: NamePronMode; icon: string; label: string }[] = [
  { mode: 'fr', icon: '🇫🇷', label: 'À la française' },
  { mode: 'en', icon: '🇬🇧', label: 'À l’anglaise' },
  { mode: 'spelled', icon: '✏️', label: 'Comme je l’écris' },
];

type Previews = Partial<Record<NamePronMode, string>>;

/**
 * Prénom de la joueuse, puis sa prononciation choisie à l'oreille : les animaux l'appelleront
 * par son prénom (src/engine/nameVoice.ts). Aucun verrou : l'enfant et le parent le remplissent ensemble.
 */
export function NameSetup({ initialName, initialPron, speechSpeed, onDone, onCancel }: Props) {
  const [step, setStep] = useState<'type' | 'pron'>('type');
  const [raw, setRaw] = useState(initialName === DEFAULT_PLAYER_NAME ? '' : initialName);
  const [name, setName] = useState('');
  const [error, setError] = useState<keyof typeof NAME_ERRORS | null>(null);
  const [mode, setMode] = useState<NamePronMode>(initialPron?.mode ?? 'fr');
  const [spelling, setSpelling] = useState(initialPron?.spelling ?? '');
  const [previews, setPreviews] = useState<Previews>({});
  const [spelledFor, setSpelledFor] = useState('');
  const [loading, setLoading] = useState<NamePronMode | 'all' | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void speech.speak(step === 'type' ? NAME_SCREEN.ask.en : NAME_SCREEN.listen.en);
  }, [step]);

  // les deux prononciations automatiques sont préparées dès qu'on arrive au choix
  useEffect(() => {
    if (step !== 'pron' || !name) return;
    let live = true;
    setLoading('all');
    void fetchNamePreview(name, null).then((p) => {
      if (!live) return;
      setLoading(null);
      if (p) setPreviews((old) => ({ ...old, fr: p.fr, en: p.en }));
      else setUnavailable(true);
    });
    return () => {
      live = false;
    };
  }, [step, name]);

  useEffect(() => () => audio.current?.pause(), []);

  const play = (url: string | undefined) => {
    if (!url) return;
    speech.stop();
    const a = audio.current ?? (audio.current = new Audio());
    a.src = url;
    a.preservesPitch = true;
    a.playbackRate = a.defaultPlaybackRate = clipPlaybackRate(speechSpeed, false, paceOf('mother')); // aperçu dit par la maman (PREVIEW_VOICE)
    void a.play().catch(() => undefined);
  };

  const cleanSpelling = sanitizeSpelling(spelling);

  const listen = async (m: NamePronMode) => {
    setMode(m);
    if (m !== 'spelled') return play(previews[m]);
    if (!cleanSpelling) return;
    if (previews.spelled && spelledFor === cleanSpelling) return play(previews.spelled);
    setLoading('spelled');
    const p = await fetchNamePreview(name, cleanSpelling);
    setLoading(null);
    if (!p?.spelled) return setUnavailable(true);
    setPreviews((old) => ({ ...old, spelled: p.spelled }));
    setSpelledFor(cleanSpelling);
    play(p.spelled);
  };

  const next = () => {
    const r = sanitizeName(raw);
    if (!r.ok) {
      setError(r.error);
      void speech.speak(NAME_ERRORS[r.error]!.en);
      return;
    }
    setError(null);
    if (r.name !== name) setPreviews({});
    setName(r.name);
    setStep('pron');
  };

  const finish = () => {
    const pron: NamePron = mode === 'spelled' && cleanSpelling ? { mode, spelling: cleanSpelling } : { mode: mode === 'spelled' ? 'fr' : mode };
    audio.current?.pause();
    onDone(name, pron);
  };

  if (step === 'type') {
    return (
      <div className={`name-setup${onCancel ? ' compact' : ''}`}>
        <button className="name-ask" onClick={() => void speech.speak(NAME_SCREEN.ask.en)}>
          <span className="name-ask-en">{NAME_SCREEN.ask.en} 🔊</span>
          <small>{NAME_SCREEN.ask.fr}</small>
        </button>
        <form
          className="name-row"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <input className="name-input" value={raw} onChange={(e) => setRaw(e.target.value)} maxLength={40} autoFocus autoComplete="off" autoCapitalize="words" spellCheck={false} aria-label="Prénom" placeholder="Prénom" />
          <button type="submit" className="big ok" aria-label="Valider">✓</button>
        </form>
        {error && <p className="name-error">{NAME_ERRORS[error]!.fr}</p>}
        {onCancel && <button className="link" onClick={onCancel}>Annuler</button>}
      </div>
    );
  }

  return (
    <div className={`name-setup${onCancel ? ' compact' : ''}`}>
      <button className="name-ask" onClick={() => void speech.speak(NAME_SCREEN.listen.en)}>
        <span className="name-ask-en">{NAME_SCREEN.listen.en} 🔊</span>
        <small>{NAME_SCREEN.listen.fr} Touche chaque carte pour écouter « Hello, {name}! », puis garde la bonne.</small>
      </button>
      <div className="pron-cards">
        {CARDS.map((c) => {
          const ready = c.mode === 'spelled' ? !!cleanSpelling : !!previews[c.mode];
          const busy = loading === c.mode || (loading === 'all' && c.mode !== 'spelled');
          return (
            <div key={c.mode} className={`pron-card${mode === c.mode ? ' on' : ''}`}>
              <button className="pron-listen" onClick={() => void listen(c.mode)} disabled={!ready && c.mode !== 'spelled'} aria-pressed={mode === c.mode}>
                <span className="pron-icon">{c.icon}</span>
                <span className="pron-label">{c.label}</span>
                <span className="pron-play">{busy ? '⏳' : mode === c.mode ? '✓ 🔊' : '🔊'}</span>
              </button>
              {c.mode === 'spelled' && (
                <input
                  className="pron-spelling"
                  value={spelling}
                  onChange={(e) => setSpelling(e.target.value)}
                  onFocus={() => setMode('spelled')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void listen('spelled');
                  }}
                  maxLength={40}
                  placeholder="ex. Ma-é-la"
                  aria-label="Prénom écrit comme il se prononce"
                />
              )}
            </div>
          );
        })}
      </div>
      {unavailable && (
        <p className="note">
          Les essais d'écoute ont besoin de l'ordinateur qui fait tourner le jeu (moteur de voix installé). En attendant, les animaux disent « Hello! » sans le prénom ; le choix est gardé et servira dès que l'ordinateur sera là.
        </p>
      )}
      <div className="name-row">
        <button className="link" onClick={() => setStep('type')}>← Changer le prénom</button>
        <button className="big ok" onClick={finish} disabled={mode === 'spelled' && !cleanSpelling}>
          ▶ {onCancel ? 'Enregistrer' : 'C’est parti !'}
        </button>
      </div>
      {onCancel && <button className="link" onClick={onCancel}>Annuler</button>}
    </div>
  );
}
