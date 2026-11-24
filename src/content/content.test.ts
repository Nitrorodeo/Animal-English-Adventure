/**
 * Validation du contenu V2 : chaque activité et chaque aventure, pour chaque espèce, chaque lieu,
 * chaque famille possible et chaque niveau, doit produire un script cohérent (objets à l'écran,
 * personnages présents, voyage dans les habitats de l'espèce, voix sans prénom non prévu).
 */
import { describe, expect, it } from 'vitest';
import { normalizeNames, spokenForm, NAME_TOKEN } from '../audio/voiceKey';
import { ALLOWED_VARS, fill, stepUtterances } from '../engine/dialogue';
import { walkSteps } from '../engine/script';
import { scriptItems } from '../engine/skills';
import { activityVariants, adventureVariants, STRUCTURAL_CONFIGS, voiceOfSpeaker, type Variant } from '../engine/variants';
import { ACTIVITIES } from './activities';
import { ADVENTURES, TREASURES } from './adventures';
import { itemInfo } from './items';
import { PLACES } from './places';
import { SPECIES } from './species';
import type { Ability } from './types';

const ABILITIES: readonly string[] = ['run', 'jump', 'climb', 'swim', 'fly', 'dig', 'roar', 'hop'] satisfies Ability[];
const VAR_RE = /\{(\w+)\}/g;

function check(v: Variant): string[] {
  const { script, config, species } = v;
  const errors = walkSteps(script, { babies: config.babies.length, actorKind: config.actorKind, allowedPlaces: species.allowedBiomes });
  const actorName = config.actorKind === 'baby' ? NAME_TOKEN : config.role === 'mother' ? species.mother.name : species.father.name;
  const vars = { actorName, playerName: NAME_TOKEN, babyName: NAME_TOKEN, siblingName: NAME_TOKEN, placeName: PLACES[script.biomeId]?.nameEn ?? '' };
  script.steps.forEach((s, i) => {
    if (s.kind === 'act' && ABILITIES.includes(s.action) && s.action !== 'dance') {
      // une capacité montrée par un personnage de l'espèce doit être réelle (pas de lion qui vole)
      if (!species.can.includes(s.action as Ability)) errors.push(`${script.id} #${i}: ${species.id} ne sait pas ${s.action}`);
    }
    for (const u of stepUtterances(s)) {
      if (!voiceOfSpeaker(u.who, config) && !u.ifPresent) errors.push(`${script.id} #${i}: voix absente (${u.who})`);
      for (const t of [u.line.en, u.line.fr]) {
        if (!t.trim()) errors.push(`${script.id} #${i}: phrase vide`);
        for (const m of t.matchAll(VAR_RE)) if (!(ALLOWED_VARS as readonly string[]).includes(m[1]!)) errors.push(`${script.id} #${i}: variable interdite ${m[0]}`);
      }
      const spoken = spokenForm(normalizeNames(fill(u.line.en, vars), []));
      if (spoken === null) errors.push(`${script.id} #${i}: prénom sans variante parlée « ${u.line.en} »`);
    }
  });
  return errors;
}

describe('aventures V2', () => {
  it('chaque aventure a un trésor connu, des espèces du continent et un départ dans leur habitat', () => {
    for (const a of ADVENTURES) {
      expect(TREASURES[a.treasure], a.id).toBeDefined();
      expect(PLACES[a.start]?.continentId, a.id).toBe(a.continentId);
      for (const id of a.species) {
        const sp = SPECIES.find((s) => s.id === id);
        expect(sp, `${a.id}: ${id}`).toBeDefined();
        expect(sp!.continentId, `${a.id}: ${id}`).toBe(a.continentId);
        expect(sp!.allowedBiomes, `${a.id}: ${id}`).toContain(a.start);
      }
    }
  });

  it('identifiants d’aventures et de trésors uniques', () => {
    expect(new Set(ADVENTURES.map((a) => a.id)).size).toBe(ADVENTURES.length);
    expect(new Set(ADVENTURES.map((a) => a.treasure)).size).toBe(ADVENTURES.length);
  });

  it('toutes les variantes d’aventures sont valides', () => {
    const errors: string[] = [];
    let n = 0;
    for (const v of adventureVariants(STRUCTURAL_CONFIGS)) {
      n++;
      errors.push(...check(v));
    }
    expect(n).toBeGreaterThan(0);
    expect(errors.slice(0, 30)).toEqual([]);
  });

  it('l’Afrique propose au moins 4 aventures à chaque espèce sauf la girafe (3)', () => {
    for (const sp of SPECIES.filter((s) => s.continentId === 'africa')) {
      const n = ADVENTURES.filter((a) => a.species.includes(sp.id)).length;
      expect(n, sp.id).toBeGreaterThanOrEqual(sp.id === 'giraffe' ? 3 : 4);
    }
  });
});

describe('couverture V2', () => {
  it('chaque espèce vit au moins 3 aventures de son continent', () => {
    for (const sp of SPECIES) {
      const n = ADVENTURES.filter((a) => a.continentId === sp.continentId && a.species.includes(sp.id)).length;
      expect(n, sp.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('chaque continent a ses propres aventures (au moins 3)', () => {
    for (const c of new Set(SPECIES.map((s) => s.continentId))) expect(ADVENTURES.filter((a) => a.continentId === c).length, c).toBeGreaterThanOrEqual(3);
  });

  it('chaque expression travaillée a un texte et une icône (passeport, espace parents)', () => {
    const missing = new Set<string>();
    for (const gen of [adventureVariants(STRUCTURAL_CONFIGS), activityVariants(STRUCTURAL_CONFIGS)])
      for (const v of gen) for (const id of scriptItems(v.script)) if (!itemInfo(id)) missing.add(id);
    expect([...missing]).toEqual([]);
  });
});

describe('activités V2', () => {
  it('toutes les variantes d’activités sont valides', () => {
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const v of activityVariants(STRUCTURAL_CONFIGS)) {
      seen.add(v.script.archetypeId);
      errors.push(...check(v));
      if (errors.length > 30) break;
    }
    expect(errors.slice(0, 30)).toEqual([]);
    // chaque activité est jouable quelque part
    // 2026-11-23 : « pick_apples » exige un pommier ; seule la ferme d'Europe en avait un, et elle n'est plus
    // un décor d'aucune famille. Le jeu reste dans le code (retour arrière) mais n'est plus proposé.
    const RETIRED_ACTIVITIES = ['pick_apples'];
    for (const a of ACTIVITIES.filter((x) => !RETIRED_ACTIVITIES.includes(x.id))) expect(seen, a.id).toContain(a.id);
  });

  it('chaque espèce a au moins 6 activités jouables dans chacun de ses lieux', () => {
    const per = new Map<string, Set<string>>();
    for (const v of activityVariants(STRUCTURAL_CONFIGS.filter((c) => c.babies.length === 2))) {
      const k = `${v.species.id}@${v.script.biomeId}`;
      if (!per.has(k)) per.set(k, new Set());
      per.get(k)!.add(v.script.archetypeId);
    }
    const poor = [...per].filter(([, s]) => s.size < 6).map(([k, s]) => `${k}: ${[...s].join(',')}`);
    expect(poor).toEqual([]);
  });
  it('chaque lieu a au moins un point où un animal peut se placer (stand), dans la scène', () => {
    for (const p of Object.values(PLACES)) {
      const stands = p.anchors.filter((a) => a.stand);
      expect(stands.length, p.id).toBeGreaterThan(0);
      for (const a of stands) {
        expect(a.stand!.x, `${p.id}.${a.id}`).toBeGreaterThanOrEqual(0);
        expect(a.stand!.x, `${p.id}.${a.id}`).toBeLessThanOrEqual(100);
        expect(a.stand!.y, `${p.id}.${a.id}`).toBeLessThanOrEqual(100);
      }
    }
  });
  it('le toucan vit dans la canopée : trois branches, jamais au sol, et ses aventures y commencent', () => {
    const toucan = SPECIES.find((s) => s.id === 'toucan')!;
    expect([...toucan.allowedBiomes].sort()).toEqual(['sa_canopy_branch', 'sa_canopy_sunrise', 'sa_canopy_treehouse']);
    for (const id of toucan.allowedBiomes) {
      const p = PLACES[id as keyof typeof PLACES]!;
      expect(p.continentId, id).toBe('south_america');
      expect(p.anchors.some((a) => a.stand), id).toBe(true);
      expect(p.spots.length, id).toBe(8);
    }
    const mine = ADVENTURES.filter((a) => a.species.includes('toucan'));
    expect(mine.length).toBeGreaterThanOrEqual(3);
    for (const a of mine) expect(toucan.allowedBiomes, a.id).toContain(a.start);
    // aucune aventure au sol ne garde le toucan
    for (const a of ADVENTURES.filter((x) => x.continentId === 'south_america' && !x.id.includes('canopy'))) expect(a.species, a.id).not.toContain('toucan');
  });
  it('la clairière ensoleillée (ex-étang) est sèche : aucun point d’eau, un chemin où se tenir', () => {
    const anchors = PLACES.sa_wetland!.anchors;
    expect(anchors.some((a) => a.tags?.includes('water'))).toBe(false);
    expect(anchors.find((a) => a.id === 'path')?.stand).toBeDefined();
  });
});
