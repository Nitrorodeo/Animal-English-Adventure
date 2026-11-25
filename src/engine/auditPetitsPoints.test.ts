import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { resumeIsReopen, RESUME_CHECK_MS, shouldReloadForUpdate } from '../pwa/offline';
import { partyFor } from '../ui/Habitat';
import { needsRepublish } from '../ui/useCircle';
import { decidePull, type CloudMeta } from './cloud';
import { newGameState, type GameState } from './state';

/** Petits points restants de l'audit du 2026-11-25. */
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('fête des bébés', () => {
  it('chaque bébé qui grandit a sa propre carte, avec son nom et son sexe', () => {
    const a = partyFor({ name: 'Mia', sex: 'girl', birthOrder: 1 }, 'little', 'cub');
    const b = partyFor({ name: 'Leo', sex: 'boy', birthOrder: 2 }, 'young', 'cub');
    expect([a.name, a.sex, a.birthOrder]).toEqual(['Mia', 'girl', 1]);
    expect([b.name, b.sex, b.birthOrder]).toEqual(['Leo', 'boy', 2]);
    expect(b.candles).toBeGreaterThanOrEqual(a.candles);
    expect(partyFor(undefined, 'little', 'cub').name).toBe('cub');
  });

  it('les fêtes attendent leur tour, et l’accueil du nouveau lieu ne coupe pas la fête', () => {
    const src = read('../ui/Habitat.tsx');
    expect(src).toContain('[growing, ...(events.grewOthers ?? [])]');
    expect(src).toContain('parties.current.shift()');
    expect(src).toContain('onClick={() => partyDone && closeParty()}');
    expect(src).toMatch(/if \(growing\) quietArrival\.current = true;/);
    expect(src).toMatch(/if \(quietArrival\.current\) \{\s*\/\/[^\n]*\n\s*quietArrival\.current = false;\s*return;/);
  });

  it('la fin d’un jeu ne remplace pas une partie arrivée entre-temps', () => {
    const src = read('../ui/Habitat.tsx');
    expect(src).toContain('setState((s) => (s === state ? r.state : applyQuestOutcome(s, outcome).state))');
    expect(src).not.toContain('setState(() => r.state)');
  });

  it('bulle de mot et messages identiques', () => {
    const src = read('../ui/Habitat.tsx');
    expect(src).toContain('window.clearTimeout(wordTimer.current);');
    expect(src).toContain('}, [toast, toastN, setToast]);');
  });
});

describe('écrans', () => {
  it('le retour depuis la mer ramène au lieu d’avant', () => {
    expect(read('../ui/App.tsx')).toMatch(/screen\.kind === 'sea'/);
  });
  it('carte du monde : souris relâchée hors de la fenêtre, geste annulé', () => {
    const src = read('../ui/WorldMap.tsx');
    expect(src).toContain('e.buttons === 0');
    expect(src).toContain('onPointerCancel');
  });
});

describe('mise à jour de la tablette restée ouverte', () => {
  it('un retour après une longue pause compte comme une réouverture', () => {
    expect(resumeIsReopen(null, 10 * RESUME_CHECK_MS)).toBe(false);
    expect(resumeIsReopen(0, RESUME_CHECK_MS - 1)).toBe(false);
    expect(resumeIsReopen(0, RESUME_CHECK_MS)).toBe(true);
    // la nouvelle version trouvée juste après ce retour recharge la page une fois
    expect(shouldReloadForUpdate(true, false, 2000)).toBe(true);
    expect(shouldReloadForUpdate(true, true, 2000)).toBe(false);
  });
  it('le service de mise à jour est relancé au retour', () => {
    const src = read('../pwa/offline.ts');
    expect(src).toContain('registration?.update()');
    expect(src).toContain('performance.now() - openedAt');
  });
  it('les médias en cache sont relus par paquets', () => {
    const src = read('../../tools/pwa/sw-template.js');
    expect(src).toMatch(/keys\.slice\(i, i \+ 32\)/);
    expect(src).not.toMatch(/for \(const req of await cache\.keys\(\)\)/);
  });
});

describe('cercle d’amis : la carte finit toujours par arriver', () => {
  it('envoi raté ou carte absente : nouvel envoi ; cercle plein : non', () => {
    expect(needsRepublish('a', 'a', [{ id: 'moi' }], 'moi', 'ok')).toBe(false);
    expect(needsRepublish('a', 'b', [{ id: 'moi' }], 'moi', 'offline')).toBe(true);
    expect(needsRepublish(null, 'a', null, 'moi', 'ok')).toBe(true);
    expect(needsRepublish('a', 'a', [{ id: 'ami' }], 'moi', 'ok')).toBe(true);
    expect(needsRepublish('a', 'a', null, 'moi', 'ok')).toBe(false);
    expect(needsRepublish('a', 'b', [], 'moi', 'full')).toBe(false);
  });
  it('vérifié chaque minute', () => {
    expect(read('../ui/useCircle.ts')).toContain("if (document.visibilityState === 'visible') void catchUp();");
  });
});

describe('deux appareils qui ont joué chacun de leur côté', () => {
  const meta = (syncedAt: number, dirty: boolean): CloudMeta => ({ code: 'lion-mango-4271', syncedAt, dirty });
  const played = (n: number): GameState => {
    const s = newGameState();
    return { ...s, player: { ...s.player, activityCounter: n } };
  };
  it('la partie la plus avancée l’emporte', () => {
    expect(decidePull(meta(100, true), { savedAt: 200, state: played(40) }, played(10))).toBe('adopt');
    expect(decidePull(meta(100, true), { savedAt: 200, state: played(10) }, played(40))).toBe('push');
    expect(decidePull(meta(100, true), { savedAt: 200, state: played(10) }, played(10))).toBe('push');
  });
  it('le serveur n’a pas changé : ce qu’elle vient de faire ici part, même si c’est moins', () => {
    expect(decidePull(meta(200, true), { savedAt: 200, state: played(40) }, played(10))).toBe('push');
  });
});
