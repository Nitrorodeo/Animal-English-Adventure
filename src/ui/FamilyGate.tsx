import { useState, type FormEvent, type ReactNode } from 'react';
import {
  easyToGuess,
  EASY_CODE_WARNING,
  isFamilyCode,
  joinReplacesProgress,
  newFamilyCode,
  normalizeFamilyCode,
  parseRemote,
  readCloudMeta,
  writeCloudMeta,
  type RemoteSave,
} from '../engine/cloud';
import { loadGame, saveGame, type StorageLike } from '../engine/save';
import { CLOUD_URL } from './useCloudSync';

function storage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

type Step =
  | { kind: 'choose' }
  | { kind: 'created'; code: string }
  | { kind: 'own'; error: string | null; busy: boolean }
  | { kind: 'join'; error: string | null; busy: boolean }
  | { kind: 'replace'; code: string; remote: RemoteSave; localName: string };

async function fetchFamily(code: string): Promise<RemoteSave | null | 'error'> {
  try {
    const r = await fetch(`${CLOUD_URL}/v1/save`, { headers: { 'X-Family': code }, cache: 'no-store' });
    if (r.status === 404) return null;
    if (r.status !== 200) return 'error';
    return parseRemote(await r.text()) ?? 'error';
  } catch {
    return 'error';
  }
}

/** Le partage doit-il encore être réglé sur cet appareil ? (version en ligne, une seule fois) */
export function familyGateNeeded(): boolean {
  const st = storage();
  return CLOUD_URL !== null && st !== null && readCloudMeta(st) === null;
}

/** Oublie le réglage du partage sur cet appareil et revient à l'écran du code de famille. */
export function resetFamilyChoice(): void {
  try {
    window.localStorage.removeItem('aea.cloud');
  } catch {
    /* rien */
  }
  window.location.reload();
}

/**
 * Version en ligne : une fois par appareil, après le code du jeu, on crée ou on tape le code de famille
 * qui partage la partie entre le téléphone, la tablette et l'ordinateur (engine/cloud.ts).
 */
export function FamilyGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => !familyGateNeeded());
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [typed, setTyped] = useState('');

  if (open) return <>{children}</>;
  const st = storage()!;

  const create = async () => {
    let code = newFamilyCode(Math.random);
    // code déjà pris (presque impossible) : on en tire un autre
    for (let i = 0; i < 3 && (await fetchFamily(code)) !== null; i++) code = newFamilyCode(Math.random);
    setStep({ kind: 'created', code });
  };

  const startNew = (code: string) => {
    // la partie de cet appareil devient celle de la famille
    writeCloudMeta(st, { code, syncedAt: 0, dirty: true });
    setOpen(true);
  };

  const adopt = (code: string, remote: RemoteSave) => {
    saveGame(st, remote.state);
    writeCloudMeta(st, { code, syncedAt: remote.savedAt, dirty: false });
    setOpen(true);
  };

  const join = async (e: FormEvent) => {
    e.preventDefault();
    const code = normalizeFamilyCode(typed);
    if (!isFamilyCode(code)) {
      setStep({ kind: 'join', busy: false, error: 'Le code fait au moins 4 lettres ou chiffres, par exemple « lion-mango-4271 ».' });
      return;
    }
    setStep({ kind: 'join', busy: true, error: null });
    const remote = await fetchFamily(code);
    if (remote === 'error') {
      setStep({ kind: 'join', busy: false, error: 'Pas de connexion au serveur. Vérifie internet puis réessaie.' });
      return;
    }
    if (remote === null) {
      setStep({ kind: 'join', busy: false, error: 'Aucune partie avec ce code. Vérifie les mots et les chiffres.' });
      return;
    }
    const local = loadGame(st);
    if (joinReplacesProgress(local.status === 'new' ? null : local.state, remote)) {
      setStep({ kind: 'replace', code, remote, localName: local.state.player.name });
      return;
    }
    adopt(code, remote);
  };

  const chooseOwn = async (e: FormEvent) => {
    e.preventDefault();
    const code = normalizeFamilyCode(typed);
    if (!isFamilyCode(code)) {
      setStep({ kind: 'own', busy: false, error: 'Au moins 4 lettres ou chiffres, par exemple « famille-lion ».' });
      return;
    }
    setStep({ kind: 'own', busy: true, error: null });
    const remote = await fetchFamily(code);
    if (remote === 'error') {
      setStep({ kind: 'own', busy: false, error: 'Pas de connexion au serveur. Vérifie internet puis réessaie.' });
      return;
    }
    if (remote !== null) {
      setStep({ kind: 'own', busy: false, error: "Ce code a déjà une partie. Si c'est le vôtre, revenez en arrière et prenez « J'ai déjà un code »." });
      return;
    }
    setStep({ kind: 'created', code });
  };

  const solo = () => {
    writeCloudMeta(st, { code: null, syncedAt: 0, dirty: false });
    setOpen(true);
  };

  return (
    <div className="screen access-screen">
      <div className="access-card family-card">
        <h1>Partie partagée</h1>
        {step.kind === 'choose' && (
          <>
            <p className="access-hint">La même partie sur le téléphone, la tablette et l'ordinateur.</p>
            <button className="big ok" onClick={() => void create()}>
              Première fois : créer un code
            </button>
            <button
              className="big"
              onClick={() => {
                setTyped('');
                setStep({ kind: 'join', error: null, busy: false });
              }}
            >
              J'ai déjà un code
            </button>
            <button className="link" onClick={solo}>
              Jouer seulement sur cet appareil
            </button>
          </>
        )}
        {step.kind === 'created' && (
          <>
            <p className="access-hint">Voici le code de votre famille :</p>
            <p className="family-code">{step.code}</p>
            <p className="note">Notez-le. Sur un autre appareil : ouvrir le jeu, taper le code du jeu, puis « J'ai déjà un code » et ce code. Il reste visible dans l'espace parents ⚙️.</p>
            <button className="big ok" onClick={() => startNew(step.code)}>
              C'est noté ▶
            </button>
            <button
              className="link"
              onClick={() => {
                setTyped('');
                setStep({ kind: 'own', error: null, busy: false });
              }}
            >
              Je préfère choisir mon code
            </button>
          </>
        )}
        {step.kind === 'own' && (
          <form className="family-form" onSubmit={(e) => void chooseOwn(e)}>
            <p className="access-hint">Choisissez votre code de famille</p>
            <input
              className="access-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="famille-lion"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Code de famille choisi"
              aria-invalid={step.error !== null}
              autoFocus
            />
            <p className="note">Lettres et chiffres, au moins 4. Les espaces deviennent des tirets.</p>
            {isFamilyCode(normalizeFamilyCode(typed)) && easyToGuess(normalizeFamilyCode(typed)) && (
              <p className="note code-easy" role="status">
                {EASY_CODE_WARNING}
              </p>
            )}
            {step.error && (
              <p className="access-wrong" role="alert">
                {step.error}
              </p>
            )}
            <button className="big ok" type="submit" disabled={step.busy || !typed.trim()}>
              {step.busy ? '⏳' : 'OK'}
            </button>
            <button type="button" className="link" onClick={() => setStep({ kind: 'choose' })}>
              ← Retour
            </button>
          </form>
        )}
        {step.kind === 'join' && (
          <form className="family-form" onSubmit={(e) => void join(e)}>
            <p className="access-hint">Code de famille</p>
            <input
              className="access-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="lion-mango-4271"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Code de famille"
              aria-invalid={step.error !== null}
              autoFocus
            />
            {step.error && (
              <p className="access-wrong" role="alert">
                {step.error}
              </p>
            )}
            <button className="big ok" type="submit" disabled={step.busy || !typed.trim()}>
              {step.busy ? '⏳' : 'OK'}
            </button>
            <button type="button" className="link" onClick={() => setStep({ kind: 'choose' })}>
              ← Retour
            </button>
          </form>
        )}
        {step.kind === 'replace' && (
          <>
            <p className="access-hint">
              Cet appareil a déjà une partie ({step.localName}). Elle sera remplacée par celle de la famille ({step.remote.state.player.name}).
            </p>
            <button className="big ok" onClick={() => adopt(step.code, step.remote)}>
              Prendre la partie de la famille
            </button>
            <button className="link" onClick={() => setStep({ kind: 'join', error: null, busy: false })}>
              ← Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
