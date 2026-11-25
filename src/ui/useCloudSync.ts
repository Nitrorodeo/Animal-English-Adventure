import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CLOUD_DELAY_MS,
  cloudUrl,
  decidePull,
  parseRemote,
  pushBody,
  readCloudMeta,
  writeCloudMeta,
  type CloudMeta,
} from '../engine/cloud';
import type { StorageLike } from '../engine/save';
import type { GameState } from '../engine/state';

/** Adresse du service de partie partagée (version en ligne seulement, voir engine/cloud.ts). */
export const CLOUD_URL = cloudUrl(import.meta.env);
/** Vérifie s'il y a du neuf venant d'un autre appareil pendant qu'on joue. */
const PULL_EVERY_MS = 60_000;

export type CloudStatus = 'off' | 'syncing' | 'ok' | 'offline';
export interface CloudInfo {
  code: string | null;
  status: CloudStatus;
}

/**
 * Partie partagée : au démarrage, au retour sur le jeu et toutes les minutes, on regarde la partie de la
 * famille ; au plus une fois par minute pendant le jeu, et dès qu'on quitte le jeu, on envoie celle de cet appareil. Sans réseau,
 * rien ne bloque : l'envoi se refait au retour de la connexion.
 */
export function useCloudSync(state: GameState, setState: (s: GameState) => void, storage: StorageLike): CloudInfo {
  const meta = useRef<CloudMeta | null>(null);
  if (meta.current === null && CLOUD_URL) meta.current = readCloudMeta(storage);
  const code = CLOUD_URL ? (meta.current?.code ?? null) : null;

  const [status, setStatus] = useState<CloudStatus>(code ? 'syncing' : 'off');
  const latest = useRef(state);
  latest.current = state;
  /** dernière version identique à celle du serveur (reçue ou envoyée) */
  const clean = useRef(state);
  /** le premier échange a eu lieu : on peut envoyer sans risquer d'écraser la partie d'un autre appareil */
  const ready = useRef(false);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const remember = useCallback(
    (patch: Partial<CloudMeta>) => {
      if (!meta.current) return;
      meta.current = { ...meta.current, ...patch };
      writeCloudMeta(storage, meta.current);
    },
    [storage],
  );

  const push = useCallback(
    async (keepalive = false) => {
      if (!CLOUD_URL || !code) return;
      const sent = latest.current;
      const body = pushBody(sent);
      if (!body) return;
      try {
        const r = await fetch(`${CLOUD_URL}/v1/save`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Family': code },
          body,
          keepalive,
          cache: 'no-store',
        });
        if (!r.ok) throw new Error(String(r.status));
        const { savedAt } = (await r.json()) as { savedAt: number };
        const unchanged = latest.current === sent;
        if (unchanged) clean.current = sent;
        remember({ syncedAt: savedAt, dirty: !unchanged });
        setStatus('ok');
      } catch {
        setStatus('offline');
      }
    },
    [code, remember],
  );

  const pull = useCallback(async () => {
    if (!CLOUD_URL || !code || busy.current) return;
    busy.current = true;
    try {
      const r = await fetch(`${CLOUD_URL}/v1/save`, { headers: { 'X-Family': code }, cache: 'no-store' });
      if (r.status !== 200 && r.status !== 404) throw new Error(String(r.status));
      const text = r.status === 200 ? await r.text() : null;
      const remote = parseRemote(text);
      // partie d'une version plus récente du jeu : on ne l'écrase pas (la page se mettra à jour)
      if (text !== null && remote === null) {
        setStatus('ok');
        return;
      }
      const decision = decidePull(meta.current!, remote, latest.current);
      ready.current = true;
      if (decision === 'adopt' && remote) {
        clean.current = remote.state;
        remember({ syncedAt: remote.savedAt, dirty: false });
        setState(remote.state);
        setStatus('ok');
      } else if (decision === 'push') {
        await push();
      } else {
        setStatus('ok');
      }
    } catch {
      setStatus('offline');
    } finally {
      busy.current = false;
    }
  }, [code, push, remember, setState]);

  // changements de la partie : un seul envoi par minute au plus. Le minuteur n'est pas relancé à chaque
  // changement, sinon une enfant qui joue sans pause n'enverrait jamais rien.
  useEffect(() => {
    if (!code || state === clean.current) return;
    if (!meta.current?.dirty) remember({ dirty: true });
    if (!ready.current || timer.current !== undefined) return;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void push();
    }, CLOUD_DELAY_MS);
  }, [state, code, push, remember]);

  useEffect(() => {
    if (!code) return;
    void pull();
    const flush = () => {
      if (ready.current && meta.current?.dirty) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
        void push(true);
      }
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? flush() : void pull());
    const onOnline = () => void pull();
    const every = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pull();
    }, PULL_EVERY_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(every);
      window.clearTimeout(timer.current);
      timer.current = undefined;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('online', onOnline);
    };
  }, [code, pull, push]);

  return { code, status };
}
