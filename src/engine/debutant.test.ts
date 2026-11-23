/**
 * Garde-fou du niveau débutant (ordre de production du parent, 2026-11-23) :
 * « PRIORITÉ ABSOLUE : NE PAS AUGMENTER LA DIFFICULTÉ » du débutant, testé et validé avec l'enfant.
 *
 * 1. Empreinte figée : chaque séquence débutant qui existait le 2026-11-23 (jeu × variante × espèce × décor
 *    × personnage, et chaque aventure) doit rester identique, mot pour mot. Une séquence peut disparaître
 *    (décor retiré d'une famille), jamais changer.
 * 2. Règles pour toutes les séquences, y compris les nouvelles : 2 réponses au plus, consignes pas plus
 *    longues que les plus longues déjà validées, mêmes sortes d'étapes et de jeux qu'avant.
 * 3. Les trois niveaux restent atteignables : débutant → intermédiaire → expert, et l'expert reste choisi
 *    par le réglage du parent (il n'est ni masqué, ni plafonné).
 *
 * Régénérer l'empreinte (seulement si le parent change lui-même le débutant) :
 *   DEBUTANT_BASELINE=write npx vitest run src/engine/debutant.test.ts
 */
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { createHash } from 'node:crypto';
// @ts-expect-error -- module Node sans types dans ce projet (les tests tournent sous Node)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACTIVITY_BY_ID } from '../content/activities';
import { ADVENTURES } from '../content/adventures';
import { archetypeFits, ARCHETYPES } from '../content/archetypes';
import { SPECIES } from '../content/species';
import type { ActivityCtx, ActorKind, GrowthStage, ParentRole, QuestStep, Sex, Tier } from '../content/types';
import { getBiome } from '../content/world';
import { finalizeSteps } from './script';
import { chooseTier } from './skills';
import { newGameState } from './state';

const BASELINE = new URL('./__baseline__/debutant.json', import.meta.url);
const STAGES: GrowthStage[] = ['newborn', 'little', 'young', 'companion'];

interface Who {
  key: string;
  kind: ActorKind;
  role?: ParentRole;
  sex?: Sex;
}
const WHO: Who[] = [
  { key: 'father', kind: 'adult', role: 'father' },
  { key: 'mother', kind: 'adult', role: 'mother' },
  { key: 'girl', kind: 'baby', sex: 'girl' },
  { key: 'boy', kind: 'baby', sex: 'boy' },
];

/** Forme stable d'une étape : l'ordre des réponses est tiré au sort, on le range. */
function stable(s: QuestStep): unknown {
  if (s.kind !== 'ask') return s;
  return { ...s, options: [...s.options].sort((a, b) => a.line.en.localeCompare(b.line.en)) };
}
const digest = (steps: QuestStep[]) => createHash('sha1').update(JSON.stringify(steps.map(stable))).digest('hex').slice(0, 16);

interface Built {
  key: string;
  mechanic: string;
  steps: QuestStep[];
}

/** Toutes les séquences débutant que le jeu peut produire aujourd'hui. */
function allBeginner(tier: Tier = 'beginner'): Built[] {
  const out: Built[] = [];
  for (const sp of SPECIES)
    for (const placeId of sp.allowedBiomes) {
      const place = getBiome(placeId);
      for (const w of WHO)
        for (const arch of ARCHETYPES) {
          const act = ACTIVITY_BY_ID[arch.id];
          if (!arch.implemented || !act) continue;
          if (arch.allowedBiomes.length && !arch.allowedBiomes.includes(placeId)) continue;
          if (arch.speciesIds?.length && !arch.speciesIds.includes(sp.id)) continue;
          if (!(w.kind === 'baby' ? STAGES.some((st) => archetypeFits(arch, 'baby', undefined, st)) : archetypeFits(arch, 'adult', w.role))) continue;
          const ctx: ActivityCtx = { species: sp, place, actorKind: w.kind, babies: ['girl', 'boy'], actorSex: w.sex, memories: [], ...(w.role ? { role: w.role } : {}) };
          for (const choice of act.choices(ctx)) {
            const raw = act.build(ctx, tier, choice);
            if (!raw) continue;
            out.push({ key: `${arch.id}|${choice}|${sp.id}|${placeId}|${w.key}`, mechanic: arch.mechanic, steps: finalizeSteps(raw, { tier, babies: 2, seed: 1 }) });
          }
        }
    }
  for (const adv of ADVENTURES)
    for (const spId of adv.species) {
      const sp = SPECIES.find((s) => s.id === spId);
      if (!sp || !sp.allowedBiomes.includes(adv.start)) continue;
      for (const babies of [0, 1, 2]) out.push({ key: `adventure|${adv.id}|${spId}|${babies}`, mechanic: 'adventure', steps: finalizeSteps(adv.steps(sp), { tier, babies, seed: 1 }) });
    }
  return out;
}

interface Baseline {
  date: string;
  /** consigne la plus longue (caractères) par sorte d'étape au débutant */
  maxLen: Record<string, number>;
  /** objets à toucher au plus dans une étape (on compte jusqu'à 3 au débutant) */
  maxTargets: number;
  kinds: string[];
  mechanics: string[];
  digests: Record<string, string>;
}

const PROMPTS = new Set(['ask', 'tapAnchor', 'tapProps', 'seek', 'tapActor', 'command']);
const promptOf = (s: QuestStep): string | undefined => ('line' in s && PROMPTS.has(s.kind) ? (s.line as { en: string }).en : undefined);

function measure(built: Built[]): Baseline {
  const maxLen: Record<string, number> = {};
  const kinds = new Set<string>();
  const mechanics = new Set<string>();
  const digests: Record<string, string> = {};
  let maxTargets = 0;
  for (const b of built) {
    mechanics.add(b.mechanic);
    digests[b.key] = digest(b.steps);
    for (const s of b.steps) {
      kinds.add(s.kind);
      if (s.kind === 'tapProps') maxTargets = Math.max(maxTargets, s.targets.length);
      const p = promptOf(s);
      if (p) maxLen[s.kind] = Math.max(maxLen[s.kind] ?? 0, p.length);
    }
  }
  return { date: new Date().toISOString().slice(0, 10), maxLen, maxTargets, kinds: [...kinds].sort(), mechanics: [...mechanics].sort(), digests };
}

describe('niveau débutant : jamais plus difficile', () => {
  const built = allBeginner();

  if ((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.DEBUTANT_BASELINE === 'write') {
    it('écrit l’empreinte du débutant', () => {
      writeFileSync(BASELINE, JSON.stringify(measure(built), null, 0) + '\n');
      expect(existsSync(BASELINE)).toBe(true);
    });
    return;
  }

  const base = JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline;

  it('chaque séquence débutant déjà validée est restée identique, mot pour mot', () => {
    const changed: string[] = [];
    let kept = 0;
    for (const b of built) {
      const was = base.digests[b.key];
      if (!was) continue;
      kept++;
      if (was !== digest(b.steps)) changed.push(b.key);
    }
    expect(changed, `séquences débutant modifiées :\n${changed.slice(0, 30).join('\n')}`).toEqual([]);
    expect(kept, 'presque toutes les séquences validées sont encore jouées').toBeGreaterThan(Object.keys(base.digests).length * 0.5);
  });

  it('au débutant : 2 réponses au plus, consignes pas plus longues, mêmes sortes d’étapes et de jeux', () => {
    const bad: string[] = [];
    for (const b of built) {
      if (!base.mechanics.includes(b.mechanic)) bad.push(`${b.key} : jeu « ${b.mechanic} » inconnu du débutant`);
      for (const s of b.steps) {
        if (!base.kinds.includes(s.kind)) bad.push(`${b.key} : étape « ${s.kind} » inconnue du débutant`);
        if (s.kind === 'ask' && s.options.length > 2) bad.push(`${b.key} : ${s.options.length} réponses`);
        if (s.kind === 'tapProps' && s.targets.length > base.maxTargets) bad.push(`${b.key} : ${s.targets.length} objets à toucher`);
        const p = promptOf(s);
        if (p && p.length > (base.maxLen[s.kind] ?? 0)) bad.push(`${b.key} : consigne trop longue (${p.length} > ${base.maxLen[s.kind]}) « ${p} »`);
      }
    }
    expect(bad.slice(0, 40)).toEqual([]);
  });
});

describe('les trois niveaux restent atteignables', () => {
  const lion = SPECIES.find((s) => s.id === 'lion')!;
  const ctx: ActivityCtx = { species: lion, place: getBiome(lion.allowedBiomes[0]!), actorKind: 'adult', babies: [], memories: [], role: 'father' };
  const act = ACTIVITY_BY_ID.greeting!;
  const choice = act.choices(ctx)[0]!;
  const scriptFor = (tier: Tier) => {
    const raw = act.build(ctx, tier, choice);
    return raw ? { id: 'g', archetypeId: 'greeting', speciesId: 'lion', biomeId: ctx.place.id, actorKind: 'adult' as const, tier, steps: finalizeSteps(raw, { tier, babies: 0, seed: 1 }), endPlace: ctx.place.id } : undefined;
  };

  it('nouvelle joueuse : débutant ; acquis consolidés : intermédiaire puis expert', () => {
    const player = newGameState().player;
    expect(chooseTier(player, scriptFor)).toBe('beginner');
    const supported = (tier: Tier) => Object.fromEntries(scriptFor(tier)!.steps.flatMap((s) => ('items' in s ? (s.items as string[]) : [])).map((i) => [i, { seen: 3, correctUnaided: 2, correctAided: 0, contexts: ['a', 'b'] }]));
    const p1 = { ...player, items: { ...supported('beginner') } } as typeof player;
    expect(['intermediate', 'expert']).toContain(chooseTier(p1, scriptFor));
    const p2 = { ...player, items: { ...supported('beginner'), ...supported('intermediate'), ...supported('expert') } } as typeof player;
    expect(chooseTier(p2, scriptFor)).toBe('expert');
  });

  it('le réglage du parent garde l’accès à chacun des trois niveaux', () => {
    const player = newGameState().player;
    for (const t of ['beginner', 'intermediate', 'expert'] as const) expect(chooseTier(player, scriptFor, t)).toBe(t);
  });

  it('chaque famille a des séquences expert différentes de ses séquences débutant', () => {
    for (const sp of SPECIES) {
      const b = allBeginnerFor(sp.id, 'beginner');
      const e = allBeginnerFor(sp.id, 'expert');
      const differs = [...e.entries()].filter(([k, d]) => b.get(k) !== undefined && b.get(k) !== d).length;
      expect(differs, `${sp.id} : l'expert change quelque chose`).toBeGreaterThan(0);
    }
  });
});

const cache = new Map<Tier, Built[]>();
function allBeginnerFor(speciesId: string, tier: Tier): Map<string, string> {
  if (!cache.has(tier)) cache.set(tier, allBeginner(tier));
  return new Map(cache.get(tier)!.filter((b) => b.key.split('|').includes(speciesId)).map((b) => [b.key, digest(b.steps)]));
}
