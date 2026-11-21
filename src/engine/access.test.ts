import { describe, expect, it } from 'vitest';
import { CSP, cspFor } from '../../tools/pwa/csp.mjs';
import { ACCESS_HASH, accessToken, hasAccess, isAccessCode, isStaticSite, normalizeCode } from './access';
import { sanitizeSpelling } from './nameVoice';
import source from './access.ts?raw';
import workflow from '../../.github/workflows/deploy.yml?raw';
import html from '../../index.html?raw';

// demande du parent (2026-11-21) : « je veux les deux noindex et le code »

describe("code d'accès de la version en ligne", () => {
  it('le bon code, sans tenir compte des majuscules ni des espaces autour', () => {
    for (const c of ['English', 'english', 'ENGLISH', '  English ', 'Énglish']) expect(isAccessCode(c), c).toBe(true);
  });

  it('les autres codes sont refusés', () => {
    for (const c of ['', 'Englis', 'Englishh', 'Anglais', 'eng lish', 'english1']) expect(isAccessCode(c), c).toBe(false);
  });

  it('le code n’est pas écrit en clair dans le jeu', () => {
    expect(source.toLowerCase()).not.toContain('english');
    expect(normalizeCode(' Hé  Ho ')).toBe('he ho');
  });

  it("l'appareil retient l'empreinte, pas le code", () => {
    expect(accessToken()).toBe(ACCESS_HASH.toString(16));
    expect(hasAccess(accessToken())).toBe(true);
    expect(hasAccess(null)).toBe(false);
    expect(hasAccess('English')).toBe(false);
  });

  it('seule la version en ligne est concernée', () => {
    expect(isStaticSite({ VITE_STATIC_SITE: '1' })).toBe(true);
    expect(isStaticSite({})).toBe(false);
    expect(isStaticSite({ VITE_STATIC_SITE: '0' })).toBe(false);
  });

  it('la publication construit bien la version en ligne', () => {
    expect(workflow).toMatch(/VITE_STATIC_SITE: '1'/);
  });
});

describe('pas de référencement, rien venu d’ailleurs', () => {
  it('la page demande aux moteurs de recherche de ne pas l’indexer', () => {
    expect(html).toMatch(/<meta name="robots" content="noindex, nofollow/);
  });

  it('politique de sécurité : uniquement les fichiers du jeu', () => {
    expect(CSP).toContain("default-src 'self'");
    expect(CSP).toContain("script-src 'self'");
    expect(CSP).toContain("object-src 'none'");
    expect(CSP).not.toMatch(/https?:|unsafe-eval|\*/);
  });

  it('en ligne : seul le service de partie partagée s’ajoute, pour les échanges seulement', () => {
    const c = cspFor('https://aea-saves.abc.workers.dev/v1');
    expect(c).toContain("connect-src 'self' https://aea-saves.abc.workers.dev;");
    expect(c.replace("connect-src 'self' https://aea-saves.abc.workers.dev", '')).not.toMatch(/https?:/);
    expect(cspFor(undefined)).toBe(CSP);
    expect(cspFor('pas une adresse')).toBe(CSP);
    expect(cspFor("https://x.dev' 'unsafe-eval")).toBe(CSP);
    expect(workflow).toMatch(/VITE_CLOUD_URL: \$\{\{ vars.CLOUD_URL \}\}/);
  });

  it('une prononciation écrite ne commence jamais par un tiret (argument du script de voix)', () => {
    expect(sanitizeSpelling('--out x')).toBe('out x');
    expect(sanitizeSpelling("-Ma-é-la-'")).toBe('Ma-é-la');
    expect(sanitizeSpelling('---')).toBeNull();
  });
});
