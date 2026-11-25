import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { isFamilyCode, normalizeFamilyCode } from '../engine/cloud';
import {
  albumCount,
  CIRCLE_ALBUM_DELAY_MS,
  CIRCLE_ALBUM_SENT_KEY,
  CIRCLE_DELAY_MS,
  circleAlbumBody,
  circleBody,
  friendsList,
  markSeen,
  newCircleCode,
  newFriendIds,
  newMemberId,
  parseCircle,
  parseFriendAlbum,
  publishable,
  readCircleMeta,
  summaryKey,
  summaryOf,
  textPrint,
  writeCircleMeta,
  type CircleMeta,
  type Friend,
} from '../engine/circle';
import type { AlbumRec } from '../engine/photoAlbum';
import type { StorageLike } from '../engine/save';
import type { GameState } from '../engine/state';
import { CLOUD_URL } from './useCloudSync';

/** Vérifie s'il y a du neuf chez les amis pendant qu'on joue. */
const PULL_EVERY_MS = 60_000;

export type CircleStatus = 'off' | 'syncing' | 'ok' | 'offline' | 'full';
export type CircleResult = { ok: true } | { ok: false; reason: 'code' | 'none' | 'offline' | 'name' | 'full' | 'taken' };

export interface CircleInfo {
  /** le cercle est disponible (version en ligne) */
  available: boolean;
  code: string | null;
  status: CircleStatus;
  friends: Friend[];
  /** identifiants des amis dont la carte est nouvelle */
  fresh: string[];
  /** prénom et chiffres de cette famille, tels que les amis les voient */
  me: { name: string; stars: number; adventures: number } | null;
  /** code proposé pour un nouveau cercle (le parent peut le changer) */
  propose(): string;
  /** crée le cercle sous ce code (choisi ou proposé) ; refusé si un cercle l'utilise déjà */
  create(typed: string): Promise<CircleResult>;
  join(typed: string): Promise<CircleResult>;
  leave(): Promise<void>;
  /** l'écran des amis a été ouvert : les cartes ne sont plus « nouvelles » */
  see(): void;
  /** l'album 📷 d'un ami du cercle (lecture seule) ; 'none' : pas encore de photo partagée */
  friendAlbum(id: string): Promise<AlbumRec | 'none' | 'offline'>;
}

/**
 * Faut-il republier la carte de cette famille ? Oui si le dernier résumé n'est pas parti (envoi raté), ou si la
 * liste reçue du service ne la contient pas. Jamais quand le cercle est plein.
 */
export function needsRepublish(sent: string | null, current: string, members: readonly { id: string }[] | null, myId: string, status: CircleStatus): boolean {
  if (status === 'full') return false;
  if (sent !== current) return true;
  return members !== null && !members.some((f) => f.id === myId);
}

const freshMeta = (): CircleMeta => ({ code: null, id: newMemberId(Math.random), seen: [] });

async function call(code: string, method: 'GET' | 'PUT' | 'DELETE', opts: { body?: string; id?: string; keepalive?: boolean } = {}): Promise<Response> {
  const query = opts.id ? `?id=${encodeURIComponent(opts.id)}` : '';
  return fetch(`${CLOUD_URL}/v1/circle${query}`, {
    method,
    headers: { 'X-Circle': code, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    body: opts.body,
    keepalive: opts.keepalive,
    cache: 'no-store',
  });
}

/**
 * Cercle d'amis (engine/circle.ts) : on publie le petit résumé de cette famille (prénom, étoiles, aventures) et on
 * lit celui des amis. Sans réseau ou sans cercle, rien ne bloque et rien ne s'affiche.
 */
export function useCircle(state: GameState, setState: Dispatch<SetStateAction<GameState>>, storage: StorageLike): CircleInfo {
  const available = CLOUD_URL !== null;
  // Le code et l'identifiant vivent dans la partie (state.circle) : ils restent définitivement, même si le navigateur est
  // vidé, et suivent la partie partagée. Le stockage local ne garde que les cartes déjà vues (et une copie, pour migrer).
  const [meta, setMeta] = useState<CircleMeta>(() => {
    const base = (available ? readCircleMeta(storage) : null) ?? freshMeta();
    return state.circle ? { ...base, code: state.circle.code, id: state.circle.id } : base;
  });
  const [members, setMembersList] = useState<Friend[]>([]);
  /** dernière liste reçue du service (null : pas encore reçue) */
  const membersRef = useRef<Friend[] | null>(null);
  const setMembers = useCallback((list: Friend[]) => {
    membersRef.current = list;
    setMembersList(list);
  }, []);
  const [status, setStatusValue] = useState<CircleStatus>(meta.code ? 'syncing' : 'off');
  const statusRef = useRef(status);
  const setStatus = useCallback((next: CircleStatus | ((old: CircleStatus) => CircleStatus)) => {
    setStatusValue((old) => {
      const v = typeof next === 'function' ? next(old) : next;
      statusRef.current = v;
      return v;
    });
  }, []);
  const metaRef = useRef(meta);
  metaRef.current = meta;
  const summary = summaryOf(state);
  const key = summaryKey(summary);
  const latest = useRef(summary);
  latest.current = summary;
  /** dernier résumé reçu par le service */
  const sent = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // album 📷 partagé avec les amis : envoyé seulement quand il a changé (empreinte gardée sur l'appareil)
  const album = state.player.album;
  const albumPrint = useMemo(() => textPrint(JSON.stringify(album ?? {})), [album]);
  const albumLatest = useRef({ album, print: albumPrint });
  albumLatest.current = { album, print: albumPrint };
  const albumTimer = useRef<number | undefined>(undefined);

  const update = useCallback(
    (next: CircleMeta) => {
      metaRef.current = next;
      setMeta(next);
      writeCircleMeta(storage, next);
      setState((s) => {
        const cur = s.circle;
        if (next.code) return cur && cur.code === next.code && cur.id === next.id ? s : { ...s, circle: { code: next.code, id: next.id } };
        if (!cur) return s;
        const { circle: _left, ...rest } = s;
        return rest;
      });
    },
    [storage, setState],
  );

  // la partie et la copie locale restent d'accord : un cercle venu de la partie partagée est adopté ; un ancien cercle
  // gardé seulement dans le navigateur est inscrit dans la partie (une seule fois)
  useEffect(() => {
    if (!available) return;
    const c = state.circle;
    const m = metaRef.current;
    if (c) {
      if (m.code !== c.code || m.id !== c.id) update({ ...m, code: c.code, id: c.id });
    } else if (m.code) update(m);
  }, [available, state.circle, update]);

  const push = useCallback(async (keepalive = false): Promise<'ok' | 'full' | 'offline' | 'skipped'> => {
    const m = metaRef.current;
    const s = latest.current;
    if (!available || !m.code || !publishable(s)) return 'skipped';
    try {
      const r = await call(m.code, 'PUT', { body: circleBody(m.id, s), keepalive });
      if (r.status === 409) return 'full';
      if (!r.ok) throw new Error(String(r.status));
      sent.current = summaryKey(s);
      return 'ok';
    } catch {
      return 'offline';
    }
  }, [available]);

  const pushAlbum = useCallback(async (): Promise<void> => {
    const m = metaRef.current;
    if (!available || !m.code) return;
    const { album: a, print } = albumLatest.current;
    const mark = `${m.code}:${print}`;
    let last: string | null = null;
    try {
      last = storage.getItem(CIRCLE_ALBUM_SENT_KEY);
    } catch {
      last = null;
    }
    if (last === mark) return;
    // rien encore à montrer, et rien déjà montré dans ce cercle : pas d'envoi
    if ((!a || albumCount(a) === 0) && !last?.startsWith(`${m.code}:`)) return;
    const body = circleAlbumBody(m.id, a);
    if (!body) return;
    try {
      const r = await fetch(`${CLOUD_URL}/v1/circle/album`, { method: 'PUT', headers: { 'X-Circle': m.code, 'Content-Type': 'application/json' }, body, cache: 'no-store' });
      if (r.ok) storage.setItem(CIRCLE_ALBUM_SENT_KEY, mark);
    } catch {
      /* sans réseau : nouvel essai au prochain changement, au retour sur le jeu ou au prochain lancement */
    }
  }, [available, storage]);

  const pull = useCallback(async () => {
    const m = metaRef.current;
    if (!available || !m.code) return;
    try {
      const r = await call(m.code, 'GET');
      if (r.status === 404) {
        setMembers([]);
        setStatus('ok');
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      setMembers(parseCircle(await r.text()));
      setStatus((old) => (old === 'full' ? old : 'ok'));
    } catch {
      setStatus('offline');
    }
  }, [available, setMembers, setStatus]);

  /**
   * Chaque minute : un envoi raté (réseau coupé) est refait, et une carte absente de la liste du service (effacée par
   * l'envoi simultané d'une autre famille) est republiée. Au plus un envoi par minute (audit du 2026-11-25).
   */
  const catchUp = useCallback(async () => {
    const m = metaRef.current;
    const s = latest.current;
    if (!available || !m.code) return;
    if (needsRepublish(sent.current, summaryKey(s), membersRef.current, m.id, statusRef.current) && publishable(s)) {
      const r = await push();
      if (r === 'full') setStatus('full');
    }
    await pull();
  }, [available, push, pull, setStatus]);

  // le résumé a changé : envoi groupé quelques secondes plus tard
  useEffect(() => {
    if (!meta.code || sent.current === key) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void push().then((r) => {
        if (r === 'full') setStatus('full');
        else if (r === 'offline') setStatus('offline');
        else if (r === 'ok') void pull();
      });
    }, sent.current === null ? 300 : CIRCLE_DELAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [key, meta.code, push, pull, setStatus]);

  // l'album a changé (photo, autocollant) : un seul envoi après un moment de calme, une fois dans le cercle
  useEffect(() => {
    if (!meta.code || status !== 'ok') return;
    window.clearTimeout(albumTimer.current);
    albumTimer.current = window.setTimeout(() => void pushAlbum(), CIRCLE_ALBUM_DELAY_MS);
    return () => window.clearTimeout(albumTimer.current);
  }, [albumPrint, meta.code, status, pushAlbum]);

  // au démarrage, au retour sur le jeu et chaque minute : regarder les amis
  useEffect(() => {
    if (!meta.code) return;
    void pull();
    const flush = () => {
      if (sent.current !== summaryKey(latest.current)) void push(true);
      void pushAlbum();
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? flush() : void pull());
    const every = window.setInterval(() => {
      if (document.visibilityState === 'visible') void catchUp();
    }, PULL_EVERY_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(every);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [meta.code, pull, push, pushAlbum, catchUp]);

  const enter = useCallback(
    async (code: string): Promise<CircleResult> => {
      const previous = metaRef.current;
      update({ ...previous, code });
      sent.current = null;
      setStatus('syncing');
      const r = await push();
      if (r === 'full') {
        update({ ...previous, code: null });
        setStatus('off');
        return { ok: false, reason: 'full' };
      }
      if (r === 'offline') {
        update({ ...previous, code: null });
        setStatus('off');
        return { ok: false, reason: 'offline' };
      }
      await pull();
      return { ok: true };
    },
    [pull, push, update, setStatus],
  );

  const propose = useCallback(() => newCircleCode(Math.random), []);

  const create = useCallback(
    async (typed: string): Promise<CircleResult> => {
      if (!available) return { ok: false, reason: 'offline' };
      const code = normalizeFamilyCode(typed);
      if (!isFamilyCode(code)) return { ok: false, reason: 'code' };
      if (!publishable(latest.current)) return { ok: false, reason: 'name' };
      try {
        // un code déjà utilisé appartient à d'autres enfants : on ne s'y glisse pas par erreur
        const r = await call(code, 'GET');
        if (r.status === 200) return { ok: false, reason: 'taken' };
        if (r.status !== 404) return { ok: false, reason: 'offline' };
      } catch {
        return { ok: false, reason: 'offline' };
      }
      return enter(code);
    },
    [available, enter],
  );

  const join = useCallback(
    async (typed: string): Promise<CircleResult> => {
      if (!available) return { ok: false, reason: 'offline' };
      const code = normalizeFamilyCode(typed);
      if (!isFamilyCode(code)) return { ok: false, reason: 'code' };
      if (!publishable(latest.current)) return { ok: false, reason: 'name' };
      try {
        const r = await call(code, 'GET');
        if (r.status === 404) return { ok: false, reason: 'none' };
        if (!r.ok) return { ok: false, reason: 'offline' };
      } catch {
        return { ok: false, reason: 'offline' };
      }
      return enter(code);
    },
    [available, enter],
  );

  const leave = useCallback(async () => {
    const m = metaRef.current;
    window.clearTimeout(timer.current);
    if (available && m.code) {
      try {
        await call(m.code, 'DELETE', { id: m.id });
      } catch {
        /* sans réseau : la carte restera chez les amis jusqu'à ce qu'ils la voient disparaître avec le temps */
      }
    }
    sent.current = null;
    window.clearTimeout(albumTimer.current);
    try {
      storage.removeItem(CIRCLE_ALBUM_SENT_KEY);
    } catch {
      /* rien à oublier */
    }
    update({ code: null, id: m.id, seen: [] });
    setMembers([]);
    setStatus('off');
  }, [available, update, storage, setMembers, setStatus]);

  const friendAlbum = useCallback(
    async (id: string): Promise<AlbumRec | 'none' | 'offline'> => {
      const m = metaRef.current;
      if (!available || !m.code) return 'offline';
      try {
        const r = await fetch(`${CLOUD_URL}/v1/circle/album?id=${encodeURIComponent(id)}`, { headers: { 'X-Circle': m.code }, cache: 'no-store' });
        if (r.status === 404) return 'none';
        if (!r.ok) return 'offline';
        const a = parseFriendAlbum(await r.text());
        return albumCount(a) > 0 ? a : 'none';
      } catch {
        return 'offline';
      }
    },
    [available],
  );

  const see = useCallback(() => {
    const m = metaRef.current;
    const next = markSeen(m, friendsList(members, m.id));
    if (next !== m) update(next);
  }, [members, update]);

  const friends = friendsList(members, meta.id);
  return {
    available,
    code: available ? meta.code : null,
    status,
    friends,
    fresh: newFriendIds(friends, meta.seen),
    me: meta.code && publishable(summary) ? summary : null,
    propose,
    create,
    join,
    leave,
    see,
    friendAlbum,
  };
}
