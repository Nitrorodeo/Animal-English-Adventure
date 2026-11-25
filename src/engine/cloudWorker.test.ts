import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { albumCount, CIRCLE_ALBUM_MAX_BYTES, circleAlbumBody, friendAlbumState, parseFriendAlbum, textPrint } from './circle';
import { familyPhotos, stickOnPhoto, takePhoto } from './photoAlbum';
import { newGameState, type GameState } from './state';
import { handle, type CloudEnv } from '../../cloud/worker.mjs';

/** Le service (cloud/worker.mjs) avec un faux stockage KV en mémoire. */

const ORIGIN = 'https://nitrorodeo.github.io';
function kv() {
  const m = new Map<string, string>();
  return {
    m,
    env: {
      ALLOWED_ORIGINS: ORIGIN,
      SAVES: {
        get: async (k: string) => m.get(k) ?? null,
        put: async (k: string, v: string) => void m.set(k, v),
        delete: async (k: string) => void m.delete(k),
      },
    },
  };
}
function req(path: string, method: string, headers: Record<string, string>, body?: string, origin: string | null = ORIGIN): Request {
  return new Request(`https://aea.example${path}`, { method, headers: { ...(origin ? { Origin: origin } : {}), ...headers }, body });
}
const CIRCLE = 'les-copains-42';
const join = (env: CloudEnv, id: string, name: string) => handle(req('/v1/circle', 'PUT', { 'X-Circle': CIRCLE }, JSON.stringify({ id, name, stars: 3, adventures: 1 })), env, 1000);

function withPhotos(): GameState {
  const shot = { sp: 'lion', p: 'savanna_waterhole' as never, a: [{ who: 'father' as const, x: 30, y: 70, h: 40, f: 1 as const }], g: [] };
  let s = newGameState();
  const r = takePhoto(s, shot, 1_000);
  if (!r.ok) throw new Error('photo');
  s = r.state;
  return stickOnPhoto(s, familyPhotos(s, 'lion')[0]!.id, 'heart', 50, 50);
}

describe('service : partie et cercle (les règles de base)', () => {
  it('refuse un site inconnu et un code mal formé', async () => {
    const { env } = kv();
    expect((await handle(req('/v1/save', 'GET', { 'X-Family': 'abcd-1234' }, undefined, 'https://autre.site'), env, 0)).status).toBe(403);
    expect((await handle(req('/v1/save', 'GET', { 'X-Family': 'a' }), env, 0)).status).toBe(400);
    expect((await handle(req('/v1/nope', 'GET', {}), env, 0)).status).toBe(404);
  });

  it('range et rend une partie ; garde la copie de la veille', async () => {
    const { env, m } = kv();
    const state = newGameState();
    const put = (now: number) => handle(req('/v1/save', 'PUT', { 'X-Family': 'abcd-1234' }, JSON.stringify({ state })), env, now);
    expect((await put(1000)).status).toBe(200);
    const got = await handle(req('/v1/save', 'GET', { 'X-Family': 'abcd-1234' }), env, 2000);
    expect(JSON.parse(await got.text()).savedAt).toBe(1000);
    await put(1000 + 86_400_000);
    expect([...m.keys()].some((k) => k.startsWith('day:'))).toBe(true);
    // le code n'est jamais stocké en clair
    expect([...m.keys()].join()).not.toContain('abcd-1234');
  });

  it('cercle : au plus 12 enfants, un prénom propre', async () => {
    const { env } = kv();
    for (let i = 0; i < 12; i++) expect((await join(env, `member${String(i).padStart(4, '0')}`, `Kid ${i}`)).status).toBe(200);
    expect((await join(env, 'member9999', 'Late')).status).toBe(409);
    expect((await join(env, 'bad', 'Kid')).status).toBe(400);
  });
});

describe('albums des amis', () => {
  it('un enfant du cercle publie son album ; les amis le lisent avec le code du cercle', async () => {
    const { env, m } = kv();
    await join(env, 'mia0000001', 'Mia');
    await join(env, 'zoe0000002', 'Zoe');
    const s = withPhotos();
    const body = circleAlbumBody('mia0000001', s.player.album)!;
    const put = await handle(req('/v1/circle/album', 'PUT', { 'X-Circle': CIRCLE }, body), env, 2000);
    expect(put.status).toBe(200);
    const got = await handle(req('/v1/circle/album?id=mia0000001', 'GET', { 'X-Circle': CIRCLE }), env, 3000);
    expect(got.status).toBe(200);
    const album = parseFriendAlbum(await got.text());
    expect(albumCount(album)).toBe(1);
    // l'album de l'amie se montre comme une partie « vitrine », autocollant compris
    const shown = familyPhotos(friendAlbumState(album, s.settings), 'lion');
    expect(shown[0]!.stickers.map((k) => k.id)).toEqual(['heart']);
    // sans le bon code de cercle : rien
    expect((await handle(req('/v1/circle/album?id=mia0000001', 'GET', { 'X-Circle': 'autre-cercle' }), env, 3000)).status).toBe(404);
    // rien de la partie n'est envoyé : seulement l'album
    expect(Object.keys(JSON.parse(body))).toEqual(['id', 'album']);
    expect([...m.keys()].filter((k) => k.startsWith('calbum:'))).toHaveLength(1);
  });

  it('une famille hors du cercle ne peut pas y déposer d’album ; un album abîmé est refusé', async () => {
    const { env } = kv();
    await join(env, 'mia0000001', 'Mia');
    const put = (b: string) => handle(req('/v1/circle/album', 'PUT', { 'X-Circle': CIRCLE }, b), env, 2000);
    expect((await put(JSON.stringify({ id: 'stranger01', album: {} }))).status).toBe(403);
    expect((await put(JSON.stringify({ id: 'mia0000001', album: [] }))).status).toBe(400);
    expect((await put(JSON.stringify({ id: 'mia0000001', album: { lion: 'x' } }))).status).toBe(400);
    expect((await put('pas du json')).status).toBe(400);
    expect((await put('x'.repeat(CIRCLE_ALBUM_MAX_BYTES + 1))).status).toBe(413);
  });

  it('quitter le cercle retire aussi l’album partagé', async () => {
    const { env, m } = kv();
    await join(env, 'mia0000001', 'Mia');
    await handle(req('/v1/circle/album', 'PUT', { 'X-Circle': CIRCLE }, circleAlbumBody('mia0000001', withPhotos().player.album)!), env, 2000);
    const del = await handle(req('/v1/circle?id=mia0000001', 'DELETE', { 'X-Circle': CIRCLE }), env, 3000);
    expect(del.status).toBe(204);
    expect([...m.keys()].filter((k) => k.startsWith('calbum:'))).toHaveLength(0);
    expect((await handle(req('/v1/circle/album?id=mia0000001', 'GET', { 'X-Circle': CIRCLE }), env, 3000)).status).toBe(404);
  });

  it('dans le jeu : bouton 📷 sur la carte d’un ami, album en lecture seule ; envoi seulement quand l’album change', () => {
    const friends: string = readFileSync(new URL('../ui/Friends.tsx', import.meta.url), 'utf8');
    const album: string = readFileSync(new URL('../ui/PhotoAlbum.tsx', import.meta.url), 'utf8');
    const hook: string = readFileSync(new URL('../ui/useCircle.ts', import.meta.url), 'utf8');
    expect(friends).toContain('onPhotos={() => void openAlbum(f.id, f.name)}');
    expect(friends).toMatch(/<PhotoAlbum state=\{friendAlbumState\(viewing\.album, settings\)\} setState=\{\(\) => undefined\} owner=/);
    // l'ami ne peut ni coller d'autocollant ni retirer de photo
    expect(album).toContain('{!readOnly && <button className={`round album-tool${mode === \'stick\'');
    expect(album).toContain('{readOnly ? null : confirm ? (');
    // l'empreinte gardée évite de renvoyer un album inchangé à chaque lancement (le service gratuit compte les écritures)
    expect(hook).toContain('if (last === mark) return;');
    expect(hook).toContain('CIRCLE_ALBUM_DELAY_MS');
  });

  it('empreinte : change avec l’album, stable sinon ; texte abîmé = album vide', () => {
    const a = JSON.stringify(withPhotos().player.album);
    expect(textPrint(a)).toBe(textPrint(String(a)));
    expect(textPrint(a)).not.toBe(textPrint(a.replace('he', 'st')));
    expect(parseFriendAlbum('{')).toEqual({});
    expect(parseFriendAlbum(null)).toEqual({});
    expect(circleAlbumBody('mia0000001', undefined)).toBe('{"id":"mia0000001","album":{}}');
  });
});
