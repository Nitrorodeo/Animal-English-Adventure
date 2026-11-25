import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';

/**
 * Les animaux se déplacent au doigt aussi pendant un jeu (2026-11-25 : « le personnage était devant la réponse…
 * on ne pouvait pas déplacer les panthères des neiges pour répondre à la question »). Vérifié aussi dans le
 * navigateur : pendant « Catch the leaves! », les trois lions sont déplaçables et le jeu continue.
 */
describe('déplacer les animaux pendant un jeu', () => {
  const src = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
  const quest = src.slice(src.indexOf('function QuestLayer('));

  it('chaque animal de la scène de jeu reçoit le geste de glisser (sauf caché pour cache-cache)', () => {
    expect(quest).toContain('const movable = !hideAt;');
    expect(quest).toContain('onDragTo={onDragTo}');
    // même calcul de place et de perspective que dans le décor libre
    expect(quest).toContain('const next = dragSpot(home, pointer, grabDy, placeScale(place, home.y)');
    expect(quest).toContain('place={mine ? { ...pos, ...mine } : pos}');
  });

  it('un animal qu’on ne peut pas toucher reste attrapable, et le glisser démarre sans appui long', () => {
    expect(src).toContain('disabled={!onTap && !onHold && !onDragTo}');
    expect(src).not.toContain('disabled={!onTap && !onHold}\n');
    expect(src).toMatch(/\.\.\.\(onHold\s*\? \{\}\s*: \{\s*onPointerDown:/);
  });

  it('la place choisie au doigt ne dure que le temps du jeu, à cet endroit de la scène', () => {
    expect(quest).toContain("const holdKey = `${run.place}|${id}|${move?.anchor ?? ''}|${hiding?.found ? hiding.at : ''}`;");
    expect(quest).not.toMatch(/placeActor\(/);
  });
});
