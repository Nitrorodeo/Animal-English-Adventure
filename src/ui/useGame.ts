import { useCallback, useEffect, useRef, useState } from 'react';
import { speech } from '../audio/speech';
import { isStaticSite } from '../engine/access';
import { BACKUP_DELAY_MS, BACKUP_PATH, hasProgress, parseBackup, shouldRestore } from '../engine/backup';
import { loadGame, memoryStorage, resetGame, saveGame, type LoadStatus, type StorageLike } from '../engine/save';
import { newGameState, variableNames, type GameState } from '../engine/state';
import { useNameVoices } from './useNameVoices';
import { useCloudSync } from './useCloudSync';

function browserStorage(): StorageLike {
  try {
    const t = '__aea_test__';
    window.localStorage.setItem(t, t);
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return memoryStorage(); // navigation privée : on joue sans sauvegarde durable
  }
}

/** Copie de la partie sur l'ordinateur qui sert le jeu (voir engine/backup.ts) : échoue en silence sans lui. */
const backupUrl = () => `${import.meta.env.BASE_URL}${BACKUP_PATH}`;
/** version en ligne : pas d'ordinateur derrière, la partie n'est envoyée nulle part */
const PC_SERVER = !isStaticSite(import.meta.env);

async function fetchBackup(): Promise<GameState | null> {
  if (!PC_SERVER) return null;
  try {
    const r = await fetch(backupUrl(), { cache: 'no-store' });
    return r.status === 200 ? parseBackup(await r.text()) : null;
  } catch {
    return null;
  }
}

function sendBackup(method: 'PUT' | 'DELETE', state?: GameState): void {
  if (!PC_SERVER) return;
  try {
    void fetch(backupUrl(), { method, keepalive: true, headers: { 'Content-Type': 'application/json' }, body: state ? JSON.stringify(state) : undefined }).catch(() => undefined);
  } catch {
    /* pas de serveur : rien à faire */
  }
}

export function useGame() {
  const storage = useRef<StorageLike>(null as unknown as StorageLike);
  if (!storage.current) storage.current = browserStorage();
  const [boot] = useState(() => loadGame(storage.current));
  const [state, setState] = useState<GameState>(boot.state);
  const [restored, setRestored] = useState(false);
  const loadStatus: LoadStatus = boot.status;
  const playing = useRef(false);
  const pending = useRef<number | undefined>(undefined);
  // au rendu : les effets des enfants parlent avant ceux du parent
  speech.setNames(variableNames(state));
  speech.setSpeed(state.settings.speechSpeed);

  useEffect(() => {
    if (state !== boot.state) playing.current = true;
    saveGame(storage.current, state);
    if (!hasProgress(state)) return;
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(() => sendBackup('PUT', state), BACKUP_DELAY_MS);
  }, [state, boot.state]);

  // appareil sans partie (nouvelle adresse du jeu, navigateur vidé…) : on reprend la copie du PC
  useEffect(() => {
    if (boot.status !== 'new' && boot.status !== 'corrupt') return;
    let live = true;
    void fetchBackup().then((b) => {
      if (live && shouldRestore(boot.status, playing.current, b)) {
        playing.current = true;
        setState(b);
        setRestored(true);
      }
    });
    return () => {
      live = false;
    };
  }, [boot.status]);

  useEffect(() => {
    speech.setMuted(state.settings.muted);
  }, [state.settings.muted]);

  const reset = useCallback(() => {
    window.clearTimeout(pending.current);
    resetGame(storage.current);
    sendBackup('DELETE');
    setRestored(false);
    setState(newGameState());
  }, []);

  // phrases dites avec le prénom de la joueuse, préparées par l'ordinateur (engine/nameVoice.ts)
  const nameVoice = useNameVoices(state.player.name, state.player.namePron);

  // version en ligne : même partie sur tous les appareils de la famille (engine/cloud.ts)
  const cloud = useCloudSync(state, setState, storage.current);

  return { state, setState, loadStatus, restored, reset, nameVoice, cloud };
}
