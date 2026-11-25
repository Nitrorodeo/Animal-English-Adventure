import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';

/** 2026-11-25 : « je dois pouvoir changer le mot de passe pour la team dans le compte de ma fille et le donner aux autres copains ». */
describe('changer le code du cercle d’amis', () => {
  const hook = readFileSync(new URL('./useCircle.ts', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('./CircleSettings.tsx', import.meta.url), 'utf8');
  const change = hook.slice(hook.indexOf('const change = useCallback('), hook.indexOf('const leave = useCallback('));

  it('la carte entre d’abord sous le nouveau code, puis quitte l’ancien (jamais l’inverse)', () => {
    const enter = change.indexOf("how === 'create' ? await create(typed) : await join(typed)");
    const del = change.indexOf("await call(old.code, 'DELETE', { id: old.id })");
    expect(enter).toBeGreaterThan(0);
    expect(del).toBeGreaterThan(enter);
    expect(change).toContain('if (r.ok && old.code)');
  });

  it('en cas d’échec (code pris, pas de réseau, cercle plein), elle reste dans son cercle actuel', () => {
    expect(hook).not.toContain('update({ ...previous, code: null });');
    expect(hook.match(/update\(previous\);/g)).toHaveLength(2);
    // un code déjà utilisé par un autre cercle reste refusé à la création
    expect(hook).toContain("if (r.status === 200) return { ok: false, reason: 'taken' };");
  });

  it('l’espace parents propose « Changer le code du cercle… » : créer un nouveau code ou rejoindre celui d’un ami', () => {
    expect(ui).toContain('Changer le code du cercle…');
    expect(ui).toContain("void run(() => circle.change(typed, 'create'));");
    expect(ui).toContain("onClick={() => void run(() => circle.change(typed, 'join'))}");
    expect(ui).toContain('{EASY_CODE_WARNING}');
  });
});
