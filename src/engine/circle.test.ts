import { describe, expect, it } from 'vitest';
import { handle, type KvLike } from '../../cloud/worker.mjs';
import {
  circleBody,
  cleanName,
  friendsList,
  markSeen,
  newCircleCode,
  newFriendIds,
  newMemberId,
  parseCircle,
  publishable,
  readCircleMeta,
  summaryKey,
  summaryOf,
  writeCircleMeta,
  type CircleMeta,
  type Friend,
} from './circle';
import { isFamilyCode, normalizeFamilyCode } from './cloud';
import { migrate } from './save';
import { createRng } from './rng';
import { memoryStorage } from './save';
import { newGameState, type GameState } from './state';

// demande du parent (2026-11-24) : voir la progression de ses amis, sans concurrence ; un petit tableau par enfant

const item = (unaided: number, aided: number, contexts: string[]) => ({ seen: 5, correctUnaided: unaided, correctAided: aided, contexts });

const played = (name = 'Nina'): GameState => {
  const s = newGameState();
  return {
    ...s,
    player: {
      ...s.player,
      name,
      items: { a: item(3, 0, ['x', 'y']), b: item(0, 2, ['x', 'y']), c: item(1, 0, ['x']), d: item(0, 0, []) },
      adventuresDone: { lion_day: 2, owl_night: 1, bad: -4 },
    },
  };
};

const f = (id: string, name: string, stars = 0, adventures = 0): Friend => ({ id, name, stars, adventures });

describe('le petit tableau de bord d’un enfant', () => {
  it('compte les étoiles du passeport (1 reconnu, 2 avec aide, 3 seul) et les aventures terminées', () => {
    // a : seul (3) ; b : avec aide (2) ; c : reconnu (1) ; d : jamais réussi (0)
    expect(summaryOf(played())).toEqual({ name: 'Nina', stars: 6, adventures: 3 });
  });

  it('une partie vide donne zéro, sans erreur', () => {
    expect(summaryOf(newGameState())).toEqual({ name: 'Explorer', stars: 0, adventures: 0 });
  });

  it('n’est publié qu’une fois le prénom donné', () => {
    expect(publishable(summaryOf(newGameState()))).toBe(false);
    expect(publishable({ name: '  ', stars: 0, adventures: 0 })).toBe(false);
    expect(publishable(summaryOf(played()))).toBe(true);
  });

  it('ne contient que le prénom et deux nombres : aucune partie, aucun autre champ', () => {
    const body = JSON.parse(circleBody('abcdefgh12345678', summaryOf(played())));
    expect(Object.keys(body).sort()).toEqual(['adventures', 'id', 'name', 'stars']);
  });

  it('la clé de comparaison change dès qu’un chiffre ou le prénom change', () => {
    const a = summaryOf(played());
    expect(summaryKey(a)).toBe(summaryKey({ ...a }));
    expect(summaryKey(a)).not.toBe(summaryKey({ ...a, stars: a.stars + 1 }));
    expect(summaryKey(a)).not.toBe(summaryKey({ ...a, name: 'Lila' }));
  });
});

describe('code du cercle', () => {
  it('le code proposé est valide, reconnaissable (amis-…) et varie', () => {
    const rng = createRng(11);
    const a = newCircleCode(rng.next);
    expect(a).toMatch(/^amis-[a-z]+-[a-z]+-\d{4}$/);
    expect(isFamilyCode(a)).toBe(true);
    expect(newCircleCode(rng.next)).not.toBe(a);
  });

  it('un code choisi à la main est nettoyé comme celui de la famille', () => {
    expect(normalizeFamilyCode('  Amis Léa & Tom 2026 ')).toBe('amis-lea-tom-2026');
    expect(isFamilyCode(normalizeFamilyCode('amis léa tom'))).toBe(true);
    expect(isFamilyCode(normalizeFamilyCode('ab'))).toBe(false);
  });
});

describe('identifiant et mémoire de l’appareil', () => {
  it('l’identifiant tiré est valide et varie', () => {
    const rng = createRng(7);
    const a = newMemberId(rng.next);
    expect(a).toMatch(/^[a-z0-9]{16}$/);
    expect(newMemberId(rng.next)).not.toBe(a);
  });

  it('retient et relit le cercle ; rien ou du faux donne null', () => {
    const st = memoryStorage();
    expect(readCircleMeta(st)).toBeNull();
    const meta: CircleMeta = { code: 'lion-cercle-4271', id: 'abcdefgh12345678', seen: ['zzzzzzzz'] };
    writeCircleMeta(st, meta);
    expect(readCircleMeta(st)).toEqual(meta);
    st.setItem('aea.circle', 'pas du json');
    expect(readCircleMeta(st)).toBeNull();
    st.setItem('aea.circle', JSON.stringify({ code: 'x', id: 'court' }));
    expect(readCircleMeta(st)).toBeNull();
  });

  it('un code illisible revient à « aucun cercle » sans perdre l’identifiant', () => {
    const st = memoryStorage({ 'aea.circle': JSON.stringify({ code: '../mal', id: 'abcdefgh12345678', seen: [] }) });
    expect(readCircleMeta(st)).toEqual({ code: null, id: 'abcdefgh12345678', seen: [] });
  });
});

describe('les amis à l’écran', () => {
  it('lit la réponse du service et ignore ce qui est invalide', () => {
    const text = JSON.stringify({
      members: [
        { id: 'aaaaaaaa11', name: 'Lila', stars: 12, adventures: 4 },
        { id: 'court', name: 'Mauvais id', stars: 1, adventures: 1 },
        { id: 'bbbbbbbb22', name: '   ', stars: 1, adventures: 1 },
        { id: 'cccccccc33', name: 'Tom<script>', stars: -5, adventures: 'beaucoup' },
        'pas un objet',
      ],
    });
    expect(parseCircle(text)).toEqual([f('aaaaaaaa11', 'Lila', 12, 4), f('cccccccc33', 'Tomscript', 0, 0)]);
  });

  it('une réponse illisible ou absente donne une liste vide', () => {
    expect(parseCircle(null)).toEqual([]);
    expect(parseCircle('pas du json')).toEqual([]);
    expect(parseCircle('{"members":3}')).toEqual([]);
  });

  it('coupe les prénoms trop longs et les caractères de commande', () => {
    expect(cleanName('A'.repeat(50))).toHaveLength(20);
    expect(cleanName('Ma\n\tya')).toBe('Ma ya');
    expect(cleanName('')).toBeNull();
    expect(cleanName(42)).toBeNull();
  });

  it('ordre alphabétique, jamais par étoiles, et sans moi : aucun classement', () => {
    const list = friendsList([f('mmmmmmmm', 'Zoé', 99, 99), f('aaaaaaaa', 'Élise', 0, 0), f('bbbbbbbb', 'Adam', 50, 2), f('me000000', 'Nina', 3, 3)], 'me000000');
    expect(list.map((x) => x.name)).toEqual(['Adam', 'Élise', 'Zoé']);
  });

  it('chaque nouvel enfant reçoit sa carte « nouveau » une seule fois', () => {
    const friends = [f('aaaaaaaa', 'Adam'), f('bbbbbbbb', 'Lila')];
    const meta: CircleMeta = { code: 'cercle-amis-1234', id: 'me000000', seen: ['aaaaaaaa'] };
    expect(newFriendIds(friends, meta.seen)).toEqual(['bbbbbbbb']);
    const after = markSeen(meta, friends);
    expect(after.seen.sort()).toEqual(['aaaaaaaa', 'bbbbbbbb']);
    expect(newFriendIds(friends, after.seen)).toEqual([]);
    expect(markSeen(after, friends)).toBe(after);
  });
});

describe('service en ligne : cercle d’amis (cloud/worker.mjs)', () => {
  const SITE = 'https://nitrorodeo.github.io';
  const fakeKv = () => {
    const data = new Map<string, string>();
    const kv: KvLike & { data: Map<string, string> } = {
      data,
      get: async (k) => data.get(k) ?? null,
      put: async (k, v) => void data.set(k, v),
      delete: async (k) => void data.delete(k),
    };
    return kv;
  };
  const env = (kv = fakeKv()) => ({ SAVES: kv, ALLOWED_ORIGINS: SITE });
  const req = (method: string, opts: { code?: string; body?: string; origin?: string | null; query?: string } = {}) => {
    const headers: Record<string, string> = {};
    if (opts.origin !== null) headers.Origin = opts.origin ?? SITE;
    if (opts.code !== undefined) headers['X-Circle'] = opts.code;
    return new Request(`https://aea-saves.test/v1/circle${opts.query ?? ''}`, { method, headers, body: opts.body });
  };
  const CODE = 'cercle-amis-4271';
  const T0 = Date.UTC(2026, 10, 24, 9);
  const mine = { id: 'aaaaaaaa11', name: 'Nina', stars: 6, adventures: 3 };
  const put = (e: ReturnType<typeof env>, m: object, now = T0, code = CODE) => handle(req('PUT', { code, body: JSON.stringify(m) }), e, now);

  it('un cercle inconnu n’existe pas ; le premier envoi le crée', async () => {
    const e = env();
    expect((await handle(req('GET', { code: CODE }), e, T0)).status).toBe(404);
    const r = await put(e, mine);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ members: 1 });
    const get = await handle(req('GET', { code: CODE }), e, T0 + 1);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({ members: [{ id: 'aaaaaaaa11', name: 'Nina', stars: 6, adventures: 3, at: T0 }] });
  });

  it('chaque nouvel enfant s’ajoute ; renvoyer met à jour sans doublon', async () => {
    const e = env();
    await put(e, mine);
    await put(e, { id: 'bbbbbbbb22', name: 'Lila', stars: 1, adventures: 0 }, T0 + 1000);
    await put(e, { ...mine, stars: 9 }, T0 + 2000);
    const body = (await (await handle(req('GET', { code: CODE }), e, T0 + 3000)).json()) as { members: Array<{ id: string; stars: number }> };
    expect(body.members).toHaveLength(2);
    expect(body.members.find((m) => m.id === 'aaaaaaaa11')?.stars).toBe(9);
  });

  it('deux cercles sont séparés', async () => {
    const e = env();
    await put(e, mine);
    expect((await handle(req('GET', { code: 'autre-cercle-9999' }), e, T0)).status).toBe(404);
  });

  it('ne stocke que le prénom et les nombres, même si on envoie davantage', async () => {
    const kv = fakeKv();
    const e = env(kv);
    await put(e, { ...mine, state: { secret: 1 }, email: 'a@b.fr', stars: -3, adventures: 1e9 });
    const stored = [...kv.data.values()].join('');
    expect(stored).not.toContain('secret');
    expect(stored).not.toContain('a@b.fr');
    expect(JSON.parse([...kv.data.values()][0]!).members.aaaaaaaa11).toEqual({ name: 'Nina', stars: 0, adventures: 99999, at: T0 });
  });

  it('quitter le cercle retire la carte', async () => {
    const e = env();
    await put(e, mine);
    await put(e, { id: 'bbbbbbbb22', name: 'Lila', stars: 1, adventures: 0 });
    expect((await handle(req('DELETE', { code: CODE, query: '?id=aaaaaaaa11' }), e, T0)).status).toBe(204);
    const body = (await (await handle(req('GET', { code: CODE }), e, T0)).json()) as { members: Array<{ id: string }> };
    expect(body.members.map((m) => m.id)).toEqual(['bbbbbbbb22']);
  });

  it('refuse les mauvaises demandes', async () => {
    const e = env();
    expect((await handle(req('GET', { code: 'abc' }), e, T0)).status).toBe(400);
    expect((await handle(req('GET', { code: CODE, origin: 'https://ailleurs.example' }), e, T0)).status).toBe(403);
    expect((await put(e, { id: 'court', name: 'Nina' })).status).toBe(400);
    expect((await put(e, { id: 'aaaaaaaa11', name: '   ' })).status).toBe(400);
    expect((await handle(req('PUT', { code: CODE, body: 'pas du json' }), e, T0)).status).toBe(400);
    expect((await handle(req('PUT', { code: CODE, body: 'x'.repeat(5000) }), e, T0)).status).toBe(413);
    expect((await handle(req('DELETE', { code: CODE, query: '?id=court' }), e, T0)).status).toBe(400);
    expect((await handle(req('POST', { code: CODE }), e, T0)).status).toBe(405);
  });

  it('un cercle est limité à 12 enfants', async () => {
    const e = env();
    for (let i = 0; i < 12; i++) expect((await put(e, { id: `member${String(i).padStart(4, '0')}`, name: `Enfant ${i}` })).status).toBe(200);
    expect((await put(e, { id: 'member9999', name: 'Treizième' })).status).toBe(409);
    expect((await put(e, { id: 'member0003', name: 'Déjà là' })).status).toBe(200);
  });

  it('la pré-requête du navigateur autorise le cercle', async () => {
    const r = await handle(req('OPTIONS'), env(), T0);
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Headers')).toContain('X-Circle');
    expect(r.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });
});

describe('le cercle reste dans la partie (définitif)', () => {
  it('le code et l’identifiant survivent à la sauvegarde et à la partie partagée', () => {
    const st = { ...newGameState(), circle: { code: 'amis-lea-tom-2026', id: 'abcd1234efgh5678' } };
    const back = migrate(JSON.parse(JSON.stringify(st)));
    expect(back!.circle).toEqual({ code: 'amis-lea-tom-2026', id: 'abcd1234efgh5678' });
  });
  it('une ancienne partie sans cercle reste sans cercle', () => {
    const back = migrate(JSON.parse(JSON.stringify(newGameState())));
    expect(back).not.toBeNull();
    expect('circle' in back!).toBe(false);
  });
  it('un cercle abîmé est ignoré sans casser la partie', () => {
    for (const bad of [{ code: 'a', id: 'abcd1234efgh5678' }, { code: 'amis-lea', id: 'X!' }, 'amis-lea', null]) {
      const back = migrate({ ...JSON.parse(JSON.stringify(newGameState())), circle: bad });
      expect(back).not.toBeNull();
      expect(back!.circle).toBeUndefined();
    }
  });
});
