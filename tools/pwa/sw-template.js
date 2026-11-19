/* Service worker d'Animal English Adventure — généré par tools/pwa/build_sw.ts (ne pas modifier dist/sw.js).
 * Jeu utilisable sans internet : la page et le code sont mis en cache à l'installation, puis tous les
 * dessins et toutes les voix sont téléchargés en arrière-plan (dessins d'abord). Les fichiers modifiés
 * par une nouvelle version sont seuls retéléchargés. */
/* eslint-disable */
const PLAN = __PLAN__;
const parseRange = __PARSE_RANGE__;
const staleMedia = __STALE_MEDIA__;

const SHELL = 'aea-shell-' + PLAN.version;
const MEDIA = 'aea-media';
const BASE = new URL('./', self.location).href;
const REV_HEADER = 'X-AEA-Rev';
const abs = (p) => BASE + p;
const MEDIA_REV = new Map(PLAN.media.map(([p, r]) => [abs(p), r]));
const SHELL_SET = new Set(PLAN.shell.map(([p]) => abs(p)));

/** révision de chaque média en cache (gardée dans un en-tête de la réponse) */
async function cachedRevs(cache) {
  const revs = {};
  for (const req of await cache.keys()) {
    const r = await cache.match(req);
    revs[req.url.slice(BASE.length)] = (r && r.headers.get(REV_HEADER)) || '';
  }
  return revs;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PLAN.shell.map(([p]) => new Request(abs(p), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith('aea-shell-') && k !== SHELL) await caches.delete(k);
      const cache = await caches.open(MEDIA);
      for (const p of staleMedia(await cachedRevs(cache), PLAN)) await cache.delete(abs(p));
      await self.clients.claim();
    })(),
  );
});

/** réponse 206 tirée d'une réponse complète en cache (lecture audio par morceaux) */
async function partial(request, full) {
  const range = parseRange(request.headers.get('Range'), Number(full.headers.get('Content-Length')) || (await full.clone().blob()).size);
  if (!range) return full;
  const blob = await full.blob();
  const body = blob.slice(range.start, range.end + 1);
  return new Response(body, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${range.start}-${range.end}/${blob.size}`,
      'Content-Length': String(body.size),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function storeMedia(url, response) {
  const headers = new Headers(response.headers);
  headers.set(REV_HEADER, MEDIA_REV.get(url));
  const body = await response.blob();
  headers.set('Content-Length', String(body.size));
  await (await caches.open(MEDIA)).put(url, new Response(body, { status: 200, headers }));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return;
  const url = req.url.split('#')[0].split('?')[0];

  // page : réseau d'abord (nouvelle version), sinon la page en cache
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(async () => (await caches.match(abs('index.html'), { cacheName: SHELL })) || Response.error()));
    return;
  }

  event.respondWith(
    (async () => {
      const hit = (SHELL_SET.has(url) && (await caches.match(url, { cacheName: SHELL }))) || (MEDIA_REV.has(url) && (await caches.match(url, { cacheName: MEDIA })));
      if (hit) return req.headers.has('Range') ? partial(req, hit) : hit;
      if (MEDIA_REV.has(url)) {
        // pas encore en cache : on le récupère en entier, on le garde, et on sert la plage demandée
        const full = await fetch(url, { cache: 'reload' });
        if (full.ok && full.status === 200) {
          await storeMedia(url, full.clone());
          return req.headers.has('Range') ? partial(req, full) : full;
        }
        return full;
      }
      return fetch(req);
    })(),
  );
});

/* ---- téléchargement de tout le jeu en arrière-plan, avec avancement envoyé à la page ---- */
let running = null;
async function broadcast(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}
async function cacheAll() {
  const cache = await caches.open(MEDIA);
  const revs = await cachedRevs(cache);
  const todo = PLAN.media.filter(([p, r]) => revs[p] !== r);
  const total = PLAN.media.length;
  let done = total - todo.length;
  let failed = 0;
  await broadcast({ type: 'offline-progress', done, total, failed });
  let i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const [p] = todo[i++];
      try {
        const res = await fetch(abs(p), { cache: 'reload' });
        if (!res.ok) throw new Error(String(res.status));
        await storeMedia(abs(p), res);
        done++;
      } catch {
        failed++;
      }
      if ((done + failed) % 25 === 0 || done + failed === total) await broadcast({ type: 'offline-progress', done, total, failed });
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  await broadcast({ type: 'offline-progress', done, total, failed, finished: true });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'cache-all') {
    if (!running) running = cacheAll().finally(() => (running = null));
    event.waitUntil(running);
  }
});
