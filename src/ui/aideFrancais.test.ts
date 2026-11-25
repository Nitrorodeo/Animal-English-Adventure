import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { FR_AFTER_LISTENS, frenchUnlocked } from './DialogueBox';

/** 2026-11-25 : le français sous l'anglais, et le bouton FR seulement après 3 écoutes de l'anglais. */
describe('aide en français des questions', () => {
  const src = readFileSync(new URL('./DialogueBox.tsx', import.meta.url), 'utf8');

  it('le bouton FR apparaît à la 3e écoute (lecture automatique + 2 réécoutes), pas avant', () => {
    expect(FR_AFTER_LISTENS).toBe(3);
    expect(frenchUnlocked(1)).toBe(false); // lecture automatique seule
    expect(frenchUnlocked(2)).toBe(false);
    expect(frenchUnlocked(3)).toBe(true);
    expect(frenchUnlocked(5)).toBe(true);
  });

  it('le bouton FR attend les écoutes, comptées par 🔊 et 🐢, et repart à zéro à chaque phrase', () => {
    expect(src).toContain('{frenchHelp && frenchUnlocked(cur.listens) && (');
    expect(src).toContain('onClick={() => replay(false)} aria-label="Réécouter"');
    expect(src).toContain('onClick={() => replay(true)} aria-label="Plus lentement"');
    expect(src).toContain("const cur = heard.key === key ? heard : { key, listens: 1, showFr: false };");
  });

  it('le français s’affiche juste sous la phrase anglaise', () => {
    expect(src).toMatch(/<div className="dialogue-text">\s*<p className="en">\{line\?\.en\}<\/p>\s*\{frenchHelp && showFr && line && <p className="fr-line">/);
    expect(readFileSync(new URL('../styles.css', import.meta.url), 'utf8')).toContain('.dialogue-text { flex: 1; min-width: 0; display: flex; flex-direction: column;');
  });
});
