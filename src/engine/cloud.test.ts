import { describe, expect, it } from 'vitest';
import { handle, type KvLike } from '../../cloud/worker.mjs';
import {
  cloudUrl,
  decidePull,
  isFamilyCode,
  newFamilyCode,
  normalizeFamilyCode,
  parseRemote,
  pushBody,
  readCloudMeta,
  writeCloudMeta,
  type CloudMeta,
} from './cloud';
import { createRng } from './rng';
import { memoryStorage } from './save';
import { newGameState } from './state';

// demande du parent (2026-11-21) : « pouvoir s'y connecter du PC, de la tablette, du téléphone »

const played = () => {
  const s = newGameState();
  return { ...s, onboarded: true, player: { ...s.player, name: 'Nina', activityCounter: 3 } };
};

describe('code de famille', () => {
  it('deux mots du jeu et quatre chiffres, toujours valides', () => {
    const rng = createRng(7);
    const codes = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const c = newFamilyCode(() => rng.next());
      expect(isFamilyCode(c), c).toBe(true);
      codes.add(c);
    }
    expect(codes.size).toBeGreaterThan(490);
    expect(newFamilyCode(() => 0.999999)).toMatch(/^[a-z]+-[a-z]+-9999$/);
  });

  it('tapé à la main : majuscules, espaces et accents acceptés', () => {
    expect(normalizeFamilyCode('  Lion Mango 4271 ')).toBe('lion-mango-4271');
    expect(normalizeFamilyCode('LION_mangó--4271')).toBe('lion-mango-4271');
    expect(isFamilyCode(normalizeFamilyCode('lion mango 42'))).toBe(false);
    expect(isFamilyCode('lion-mango-4271')).toBe(true);
  });
});

describe('ce que l’appareil retient', () => {
  it('relu tel quel, et rien d’inventé quand c’est illisible', () => {
    const st = memoryStorage();
    expect(readCloudMeta(st)).toBeNull();
    const m: CloudMeta = { code: 'lion-mango-4271', syncedAt: 12, dirty: true };
    writeCloudMeta(st, m);
    expect(readCloudMeta(st)).toEqual(m);
    writeCloudMeta(st, { code: null, syncedAt: 0, dirty: false });
    expect(readCloudMeta(st)).toEqual({ code: null, syncedAt: 0, dirty: false });
    st.setItem('aea.cloud', '{"code":"pas un code"}');
    expect(readCloudMeta(st)).toBeNull();
    st.setItem('aea.cloud', '{oups');
    expect(readCloudMeta(st)).toBeNull();
  });
});

describe('qui a la partie la plus récente', () => {
  const remote = (savedAt: number) => ({ savedAt, state: played() });
  const meta = (syncedAt: number, dirty: boolean): CloudMeta => ({ code: 'lion-mango-4271', syncedAt, dirty });

  it('rien au serveur : premier appareil, on envoie', () => {
    expect(decidePull(meta(0, false), null)).toBe('push');
  });
  it('un autre appareil a joué depuis : on reprend sa partie', () => {
    expect(decidePull(meta(100, false), remote(200))).toBe('adopt');
  });
  it('rien de neuf : on ne touche à rien', () => {
    expect(decidePull(meta(200, false), remote(200))).toBe('none');
  });
  it('cet appareil a joué sans réseau : sa partie part au serveur', () => {
    expect(decidePull(meta(100, true), remote(200))).toBe('push');
    expect(decidePull(meta(200, true), remote(200))).toBe('push');
  });
});

describe('échanges avec le serveur', () => {
  it('réponse lue et vérifiée', () => {
    const r = parseRemote(JSON.stringify({ savedAt: 5, state: played() }));
    expect(r?.savedAt).toBe(5);
    expect(r?.state.player.name).toBe('Nina');
    expect(parseRemote(JSON.stringify({ savedAt: 5, state: { ...played(), version: 999 } }))).toBeNull();
    expect(parseRemote('{"savedAt":"x"}')).toBeNull();
    expect(parseRemote('pas du json')).toBeNull();
    expect(parseRemote(null)).toBeNull();
  });

  it('corps envoyé : la partie, et rien d’autre', () => {
    expect(JSON.parse(pushBody(played())!)).toEqual({ state: played() });
  });

  it('adresse du service réglée à la construction', () => {
    expect(cloudUrl({ VITE_CLOUD_URL: 'https://aea-saves.x.workers.dev/' })).toBe('https://aea-saves.x.workers.dev');
    expect(cloudUrl({})).toBeNull();
    expect(cloudUrl({ VITE_CLOUD_URL: '' })).toBeNull();
    expect(cloudUrl({ VITE_CLOUD_URL: 'javascript:alert(1)' })).toBeNull();
    expect(cloudUrl({ VITE_CLOUD_URL: 'https://x.dev/chemin' })).toBeNull();
  });
});

describe('service en ligne (cloud/worker.mjs)', () => {
  const SITE = 'https://nitrorodeo.github.io';
  const fakeKv = () => {
    const data = new Map<string, string>();
    const kv: KvLike & { data: Map<string, string> } = {
      data,
      get: async (k) => data.get(k) ?? null,
      put: async (k, v) => void data.set(k, v),
    };
    return kv;
  };
  const env = (kv = fakeKv()) => ({ SAVES: kv, ALLOWED_ORIGINS: `${SITE}, http://localhost:4173` });
  const req = (method: string, opts: { code?: string; body?: string; origin?: string | null; path?: string } = {}) => {
    const headers: Record<string, string> = {};
    if (opts.origin !== null) headers.Origin = opts.origin ?? SITE;
    if (opts.code !== undefined) headers['X-Family'] = opts.code;
    return new Request(`https://aea-saves.test${opts.path ?? '/v1/save'}`, { method, headers, body: opts.body });
  };
  const DAY = 24 * 3600 * 1000;
  const T0 = Date.UTC(2026, 10, 21, 9);

  it('envoyer puis relire la partie de la famille', async () => {
    const e = env();
    expect((await handle(req('GET', { code: 'lion-mango-4271' }), e, T0)).status).toBe(404);
    const put = await handle(req('PUT', { code: 'lion-mango-4271', body: pushBody(played())! }), e, T0);
    expect(put.status).toBe(200);
    expect(await put.json()).toEqual({ savedAt: T0 });
    const get = await handle(req('GET', { code: 'lion-mango-4271' }), e, T0 + 1);
    expect(get.status).toBe(200);
    expect(get.headers.get('Access-Control-Allow-Origin')).toBe(SITE);
    const r = parseRemote(await get.text());
    expect(r).toEqual({ savedAt: T0, state: played() });
    // une autre famille ne voit rien
    expect((await handle(req('GET', { code: 'lion-mango-4272' }), e, T0)).status).toBe(404);
  });

  it('le code n’est jamais stocké en clair', async () => {
    const kv = fakeKv();
    await handle(req('PUT', { code: 'lion-mango-4271', body: pushBody(played())! }), env(kv), T0);
    for (const k of kv.data.keys()) expect(k).not.toContain('lion');
    expect([...kv.data.keys()][0]).toMatch(/^save:[0-9a-f]{64}$/);
  });

  it('chaque version est plus récente que la précédente, et celle de la veille est gardée', async () => {
    const kv = fakeKv();
    const e = env(kv);
    const a = await (await handle(req('PUT', { code: 'lion-mango-4271', body: pushBody(played())! }), e, T0)).json();
    const b = await (await handle(req('PUT', { code: 'lion-mango-4271', body: pushBody(played())! }), e, T0 - 5000)).json();
    expect(b.savedAt).toBeGreaterThan(a.savedAt);
    expect([...kv.data.keys()].filter((k) => k.startsWith('day:'))).toHaveLength(0);
    await handle(req('PUT', { code: 'lion-mango-4271', body: pushBody(played())! }), e, T0 + DAY);
    const days = [...kv.data.keys()].filter((k) => k.startsWith('day:'));
    expect(days).toHaveLength(1);
    expect(days[0]).toMatch(/:2026-11-21$/);
  });

  it('refuse les autres sites, les mauvais codes et les envois bizarres', async () => {
    const e = env();
    expect((await handle(req('GET', { code: 'lion-mango-4271', origin: 'https://ailleurs.example' }), e, T0)).status).toBe(403);
    expect((await handle(req('GET', { code: 'lion-mango-4271', origin: null }), e, T0)).status).toBe(403);
    expect((await handle(req('GET', { code: 'lion' }), e, T0)).status).toBe(400);
    expect((await handle(req('GET', { code: '../x-y-1234' }), e, T0)).status).toBe(400);
    expect((await handle(req('PUT', { code: 'lion-mango-4271', body: 'pas du json' }), e, T0)).status).toBe(400);
    expect((await handle(req('PUT', { code: 'lion-mango-4271', body: '{"state":{"version":2}}' }), e, T0)).status).toBe(400);
    expect((await handle(req('PUT', { code: 'lion-mango-4271', body: 'x'.repeat(1_000_001) }), e, T0)).status).toBe(413);
    expect((await handle(req('DELETE', { code: 'lion-mango-4271' }), e, T0)).status).toBe(405);
    expect((await handle(req('GET', { code: 'lion-mango-4271', path: '/autre' }), e, T0)).status).toBe(404);
  });

  it('autorise le navigateur du site à demander (pré-requête)', async () => {
    const r = await handle(req('OPTIONS'), env(), T0);
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Headers')).toContain('X-Family');
    expect(r.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });
});
