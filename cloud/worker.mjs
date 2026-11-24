/**
 * Service de partie partagée (Cloudflare Workers + KV), demande du parent du 2026-11-21.
 * Le jeu en ligne y range UNE partie par famille, sous un code de famille tapé sur chaque appareil.
 *
 *   GET /v1/save   (en-tête x-family: <code>)  → 200 {savedAt, state} | 404 si aucune partie
 *   PUT /v1/save   (en-tête x-family: <code>)  corps {state} → 200 {savedAt}
 *
 * Cercle d'amis (2026-11-24) : un petit résumé par famille, sous un code de cercle, jamais la partie.
 *   GET    /v1/circle  (en-tête x-circle: <code>)  → 200 {members:[{id,name,stars,adventures,at}]} | 404 si aucun cercle
 *   PUT    /v1/circle  (x-circle) corps {id,name,stars,adventures} → 200 {members: n} (crée le cercle au premier envoi)
 *   DELETE /v1/circle?id=<id>  (x-circle) → 204 : la famille quitte le cercle
 *
 * - Le code n'est jamais stocké : la clé est son empreinte SHA-256.
 * - Seul le site du jeu (ALLOWED_ORIGINS) peut l'appeler depuis un navigateur.
 * - Le serveur date chaque version (son horloge) ; la version de la veille est gardée 60 jours
 *   (« day:… »), au cas où un appareil enverrait une mauvaise partie.
 * - Rien d'autre n'est gardé : ni adresse IP, ni compte, ni e-mail.
 *
 * Testé dans src/engine/cloudWorker.test.ts. Mise en ligne : cloud/LISEZ_MOI.md.
 */

// même règle que FAMILY_CODE_PATTERN (src/engine/cloud.ts) : code proposé ou choisi par la famille
const CODE = /^(?=.{4,40}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BYTES = 1_000_000;
const HISTORY_TTL = 60 * 24 * 3600;
// cercle d'amis : même règles que src/engine/circle.ts
const MEMBER_ID = /^[a-z0-9]{8,32}$/;
const MAX_MEMBERS = 12;
const MAX_CIRCLE_BYTES = 4_000;
const CIRCLE_TTL = 400 * 24 * 3600;

async function familyKey(code) {
  const data = new TextEncoder().encode(`aea-family:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const list = String(env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return origin && list.includes(origin) ? origin : null;
}

function reply(origin, status, body) {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Family, X-Circle';
    headers['Access-Control-Max-Age'] = '86400';
  }
  if (body === undefined) return new Response(null, { status, headers });
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
}

/** Partie plausible du jeu (le détail est revérifié par le jeu à la lecture). */
function plausibleState(s) {
  const obj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
  return obj(s) && typeof s.version === 'number' && obj(s.player) && obj(s.families);
}

const day = (ms) => new Date(ms).toISOString().slice(0, 10);

const count = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(Math.floor(v), 0), 99999) : 0);
const cleanName = (v) => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return t === '' ? null : t;
};

/** Cercle d'amis : un seul document par cercle ({members: {id: résumé}}), clé = empreinte du code. */
async function handleCircle(request, env, now, origin, url) {
  const code = (request.headers.get('X-Circle') ?? '').trim();
  if (!CODE.test(code)) return reply(origin, 400, { error: 'code' });
  const key = `circle:${await familyKey(`circle:${code}`)}`;
  const text = await env.SAVES.get(key);
  let doc = { members: {} };
  if (text !== null) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.members === 'object' && parsed.members !== null) doc = parsed;
    } catch {
      /* document illisible : on repart d'un cercle vide */
    }
  }
  const list = () => Object.entries(doc.members).map(([id, m]) => ({ id, ...m }));

  if (request.method === 'GET') return text === null ? reply(origin, 404, { error: 'none' }) : reply(origin, 200, { members: list() });

  if (request.method === 'PUT') {
    const body = await request.text();
    if (body.length > MAX_CIRCLE_BYTES) return reply(origin, 413, { error: 'size' });
    let m;
    try {
      m = JSON.parse(body);
    } catch {
      return reply(origin, 400, { error: 'json' });
    }
    const name = cleanName(m?.name);
    if (typeof m?.id !== 'string' || !MEMBER_ID.test(m.id) || name === null) return reply(origin, 400, { error: 'member' });
    if (!(m.id in doc.members) && Object.keys(doc.members).length >= MAX_MEMBERS) return reply(origin, 409, { error: 'full' });
    doc.members[m.id] = { name, stars: count(m.stars), adventures: count(m.adventures), at: now };
    await env.SAVES.put(key, JSON.stringify(doc), { expirationTtl: CIRCLE_TTL });
    return reply(origin, 200, { members: Object.keys(doc.members).length });
  }

  if (request.method === 'DELETE') {
    const id = url.searchParams.get('id') ?? '';
    if (!MEMBER_ID.test(id)) return reply(origin, 400, { error: 'member' });
    if (id in doc.members) {
      delete doc.members[id];
      await env.SAVES.put(key, JSON.stringify(doc), { expirationTtl: CIRCLE_TTL });
    }
    return reply(origin, 204);
  }

  return reply(origin, 405, { error: 'method' });
}

/** Traite une requête. `now` : horloge du serveur (injectée pour les tests). */
export async function handle(request, env, now) {
  const origin = allowedOrigin(request, env);
  if (!origin) return reply(null, 403, { error: 'origin' });

  const url = new URL(request.url);
  if (url.pathname !== '/v1/save' && url.pathname !== '/v1/circle') return reply(origin, 404, { error: 'path' });
  if (request.method === 'OPTIONS') return reply(origin, 204);
  if (url.pathname === '/v1/circle') return handleCircle(request, env, now, origin, url);

  const code = (request.headers.get('X-Family') ?? '').trim();
  if (!CODE.test(code)) return reply(origin, 400, { error: 'code' });
  const key = `save:${await familyKey(code)}`;

  if (request.method === 'GET') {
    const text = await env.SAVES.get(key);
    return text === null ? reply(origin, 404, { error: 'none' }) : reply(origin, 200, text);
  }

  if (request.method === 'PUT') {
    const declared = Number(request.headers.get('Content-Length') ?? '0');
    if (declared > MAX_BYTES) return reply(origin, 413, { error: 'size' });
    const body = await request.text();
    if (body.length > MAX_BYTES) return reply(origin, 413, { error: 'size' });
    let state;
    try {
      state = JSON.parse(body).state;
    } catch {
      return reply(origin, 400, { error: 'json' });
    }
    if (!plausibleState(state)) return reply(origin, 400, { error: 'state' });

    const previous = await env.SAVES.get(key);
    let prevAt = 0;
    if (previous !== null) {
      try {
        prevAt = Number(JSON.parse(previous).savedAt) || 0;
      } catch {
        prevAt = 0;
      }
      // une copie par jour de la version précédente
      if (day(prevAt) !== day(now)) {
        await env.SAVES.put(`day:${key.slice(5)}:${day(prevAt)}`, previous, { expirationTtl: HISTORY_TTL });
      }
    }
    const savedAt = Math.max(now, prevAt + 1);
    await env.SAVES.put(key, JSON.stringify({ savedAt, state }));
    return reply(origin, 200, { savedAt });
  }

  return reply(origin, 405, { error: 'method' });
}

export default {
  fetch(request, env) {
    return handle(request, env, Date.now());
  },
};
