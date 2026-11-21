/**
 * Service de partie partagée (Cloudflare Workers + KV), demande du parent du 2026-11-21.
 * Le jeu en ligne y range UNE partie par famille, sous un code de famille tapé sur chaque appareil.
 *
 *   GET /v1/save   (en-tête x-family: <code>)  → 200 {savedAt, state} | 404 si aucune partie
 *   PUT /v1/save   (en-tête x-family: <code>)  corps {state} → 200 {savedAt}
 *
 * - Le code n'est jamais stocké : la clé est son empreinte SHA-256.
 * - Seul le site du jeu (ALLOWED_ORIGINS) peut l'appeler depuis un navigateur.
 * - Le serveur date chaque version (son horloge) ; la version de la veille est gardée 60 jours
 *   (« day:… »), au cas où un appareil enverrait une mauvaise partie.
 * - Rien d'autre n'est gardé : ni adresse IP, ni compte, ni e-mail.
 *
 * Testé dans src/engine/cloudWorker.test.ts. Mise en ligne : cloud/LISEZ_MOI.md.
 */

const CODE = /^[a-z]{2,12}-[a-z]{2,12}-\d{4}$/;
const MAX_BYTES = 1_000_000;
const HISTORY_TTL = 60 * 24 * 3600;

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
    headers['Access-Control-Allow-Methods'] = 'GET, PUT, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Family';
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

/** Traite une requête. `now` : horloge du serveur (injectée pour les tests). */
export async function handle(request, env, now) {
  const origin = allowedOrigin(request, env);
  if (!origin) return reply(null, 403, { error: 'origin' });

  const url = new URL(request.url);
  if (url.pathname !== '/v1/save') return reply(origin, 404, { error: 'path' });
  if (request.method === 'OPTIONS') return reply(origin, 204);

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
