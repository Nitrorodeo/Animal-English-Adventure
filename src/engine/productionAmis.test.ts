import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { CLOUD_DELAY_MS, easyToGuess, newFamilyCode } from './cloud';
import { newCircleCode } from './circle';
import { createRng } from './rng';

/** Les 3 corrections avant d'ouvrir le jeu aux amis (2026-11-25). */
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('quota du service gratuit', () => {
  it('la partie part au plus une fois par minute ; 3 enfants qui jouent 1 h restent loin des 1 000 écritures', () => {
    expect(CLOUD_DELAY_MS).toBeGreaterThanOrEqual(60_000);
    const parHeure = 3_600_000 / CLOUD_DELAY_MS;
    // partie (1/min) + carte du cercle (au plus autant) + album (au plus 2/min), pour 3 enfants
    expect(3 * parHeure * 4).toBeLessThan(1_000);
  });

  it('le minuteur n’est pas relancé à chaque changement ; quitter le jeu envoie tout de suite', () => {
    const hook = read('../ui/useCloudSync.ts');
    expect(hook).toContain('if (!ready.current || timer.current !== undefined) return;');
    expect(hook).toContain("window.addEventListener('pagehide', flush);");
    expect(hook).toMatch(/visibilityState === 'hidden' \? flush\(\)/);
  });
});

describe('codes faciles à deviner', () => {
  it('prévient pour un code court ou presque sans chiffres, jamais pour un code proposé', () => {
    for (const c of ['lion2026', 'famille-dupont', 'lion-mango', 'amis-de-lea-12']) expect(easyToGuess(c), c).toBe(true);
    for (const c of ['lion-mango-4271', 'famille-dupont-7391']) expect(easyToGuess(c), c).toBe(false);
    const rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      expect(easyToGuess(newFamilyCode(rng.next))).toBe(false);
      expect(easyToGuess(newCircleCode(rng.next))).toBe(false);
    }
  });

  it('avertissement affiché là où le parent choisit un code, sans bloquer', () => {
    for (const ui of [read('../ui/FamilyGate.tsx'), read('../ui/CircleSettings.tsx')]) {
      expect(ui).toContain('easyToGuess(normalizeFamilyCode(typed))');
      expect(ui).toContain('{EASY_CODE_WARNING}');
    }
  });
});

describe('dépôt public', () => {
  it('le suivi du projet ne contient plus le prénom de la joueuse', () => {
    expect(read('../../docs/ETAT_DU_PROJET.md')).not.toMatch(/l[ée]ana/i);
  });
});
