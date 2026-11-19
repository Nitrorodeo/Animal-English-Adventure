/**
 * Mode hors-ligne côté page : enregistre le service worker (version construite seulement, il exige
 * https ou localhost), lui demande de télécharger tout le jeu, et suit l'avancement pour l'espace parents.
 */

export interface OfflineStatus {
  /** 'unsupported' : navigateur sans service worker, adresse non sécurisée (http://192…) ou serveur de développement */
  state: 'unsupported' | 'starting' | 'downloading' | 'ready' | 'partial';
  done: number;
  total: number;
  failed: number;
}

let status: OfflineStatus = { state: 'unsupported', done: 0, total: 0, failed: 0 };
const listeners = new Set<(s: OfflineStatus) => void>();

export function offlineStatus(): OfflineStatus {
  return status;
}

export function onOfflineStatus(fn: (s: OfflineStatus) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(s: OfflineStatus) {
  status = s;
  for (const fn of listeners) fn(s);
}

export interface ProgressMessage {
  type: 'offline-progress';
  done: number;
  total: number;
  failed: number;
  finished?: boolean;
}

/** État à afficher d'après un message d'avancement du service worker. */
export function statusFromProgress(m: ProgressMessage): OfflineStatus {
  const complete = m.total > 0 && m.done >= m.total;
  const state = complete ? 'ready' : m.finished ? 'partial' : 'downloading';
  return { state, done: m.done, total: m.total, failed: m.failed };
}

/** Texte de l'espace parents. */
export function offlineLabel(s: OfflineStatus): string {
  const pct = s.total ? Math.floor((100 * s.done) / s.total) : 0;
  switch (s.state) {
    case 'unsupported':
      return 'Hors-ligne indisponible ici : il faut la version construite, ouverte en https ou sur localhost.';
    case 'starting':
      return 'Préparation du mode hors-ligne…';
    case 'downloading':
      return `Téléchargement pour jouer sans internet : ${pct} % (${s.done} / ${s.total} fichiers).`;
    case 'ready':
      return '✅ Tout le jeu est sur cet appareil : il marche sans internet.';
    case 'partial':
      return `Hors-ligne incomplet : ${s.done} / ${s.total} fichiers (${s.failed} en échec). Rouvrir le jeu avec internet pour finir.`;
  }
}

export function registerOffline(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  set({ ...status, state: 'starting' });
  const sw = navigator.serviceWorker;
  sw.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'offline-progress') set(statusFromProgress(e.data as ProgressMessage));
  });
  window.addEventListener('load', () => {
    sw.register('./sw.js')
      .then(() => sw.ready)
      .then((reg) => {
        reg.active?.postMessage({ type: 'cache-all' });
        // évite que la tablette efface le cache quand elle manque de place
        void navigator.storage?.persist?.();
      })
      .catch(() => set({ ...status, state: 'unsupported' }));
  });
}
