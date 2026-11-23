/**
 * La tanière enneigée de la panthère des neiges (2026-11-21) : 3e décor de la panthère, à elle seule,
 * avec son jeu signature (la nuit dans la grotte, puis le lever du soleil), ses sujets photo, et
 * rien de posé dans le bassin ni dans la cascade.
 */
import { describe, expect, it } from 'vitest';
import { photoSubjects } from '../content/activities/africa';
import { sunriseDen } from '../content/activities/world';
import { getArchetype } from '../content/archetypes';
import { NOUNS, PLACES } from '../content/places';
import { inWater, PLACE_DEPTH } from '../content/places/depth';
import { getSpecies, SPECIES } from '../content/species';
import { TIERS, type ActivityCtx, type QuestStep } from '../content/types';
import { getBiome } from '../content/world';
import { perchAt } from '../game/staging';
import { walkSteps } from './script';
import { activityVariants, STRUCTURAL_CONFIGS } from './variants';

const DEN = 'asia_snow_den';
const leopard = getSpecies('snow_leopard');
const place = PLACES[DEN]!;
const ctxOf = (actorKind: 'adult' | 'baby'): ActivityCtx => ({ species: leopard, place, actorKind, babies: ['girl', 'boy'], memories: [], ...(actorKind === 'adult' ? { role: 'father' as const } : { actorSex: 'girl' as const }) });
const variants = () => [...activityVariants(STRUCTURAL_CONFIGS, [leopard])].filter((v) => v.script.biomeId === DEN);

describe('la tanière enneigée de la panthère des neiges', () => {
  it('le décor existe, avec son image, sa profondeur et son eau mesurées', () => {
    expect(place.continentId).toBe('asia');
    expect(place.background).toBe(DEN);
    expect(place.nameEn).toBe('the snowy cave');
    expect(PLACE_DEPTH[DEN]?.water?.length).toBeGreaterThan(0);
    expect(place.spots).toHaveLength(8);
    // ses mots : la grotte et les drapeaux sont nommables
    for (const w of ['cave', 'flag', 'icicle', 'snow', 'waterfall', 'pond']) expect(NOUNS[w], w).toBeDefined();
  });

  it('c’est le 3e décor de la panthère, et il n’est à aucune autre espèce', () => {
    expect(leopard.allowedBiomes).toEqual([DEN, 'asia_snow_cave', 'asia_arch']);
    for (const sp of SPECIES) if (sp.id !== 'snow_leopard') expect(sp.allowedBiomes, sp.id).not.toContain(DEN);
  });

  it('aucun emplacement ni point d’arrivée dans le bassin ou la cascade ; la famille est sur la terre', () => {
    for (const s of place.spots) expect(inWater(place.water, s.x, s.y), `spot (${s.x}, ${s.y})`).toBe(false);
    for (const a of place.anchors) if (a.stand) expect(inWater(place.water, a.stand.x, a.stand.y), `stand ${a.id}`).toBe(false);
    // le bassin et la cascade sont bien de l'eau ; le grand rocher plat est un perchoir
    expect(inWater(place.water, 75, 63)).toBe(true);
    expect(inWater(place.water, 80, 50)).toBe(true);
    expect(perchAt(place, 38, 52)).toBe(62);
  });

  it('aucun objet d’aucun jeu n’est posé dans l’eau', () => {
    let n = 0;
    for (const v of variants())
      for (const s of v.script.steps)
        if (s.kind === 'props')
          for (const p of s.show) {
            if (p.sky) continue;
            const spot = place.spots[p.spot]!;
            expect(inWater(place.water, spot.x, spot.y), `${v.script.id}: ${p.id}`).toBe(false);
            n++;
          }
    expect(n).toBeGreaterThan(20);
  });

  it('il a son jeu à lui, l’écho, le rocher à escalader, et des sujets photo propres', () => {
    const offered = new Set(variants().map((v) => v.script.archetypeId));
    for (const id of ['sunrise_den', 'echo_canyon', 'climb_rock', 'photo', 'hide_and_seek', 'find_water']) expect(offered, id).toContain(id);
    // le jeu signature n'existe que là, et seulement pour la panthère
    expect(getArchetype('sunrise_den').allowedBiomes).toEqual([DEN]);
    expect(getArchetype('sunrise_den').speciesIds).toEqual(['snow_leopard']);
    // la panthère ne nage pas : pas de « Qui vit dans l'eau ? » ni de flocons sous un ciel clair
    expect(offered).not.toContain('who_in_water');
    expect(offered).not.toContain('snowflakes');
    const subjects = photoSubjects({ species: leopard, place: getBiome(DEN) } as Parameters<typeof photoSubjects>[0]);
    expect(subjects.length).toBeGreaterThanOrEqual(2);
    expect(subjects).toEqual(expect.arrayContaining(['cave', 'waterfall', 'flag']));
  });

  it('le jeu signature se construit aux 3 niveaux, de plus en plus riche, sans erreur', () => {
    const lengths: number[] = [];
    for (const kind of ['adult', 'baby'] as const) {
      const c = ctxOf(kind);
      expect(sunriseDen.choices(c)).toEqual(['sunrise']);
      for (const tier of TIERS) {
        const steps = sunriseDen.build(c, tier, 'sunrise') as QuestStep[];
        expect(steps, tier).toBeTruthy();
        if (kind === 'adult') lengths.push(steps.filter((s) => (!s.minTier || TIERS.indexOf(s.minTier) <= TIERS.indexOf(tier)) && (!s.maxTier || TIERS.indexOf(s.maxTier) >= TIERS.indexOf(tier))).length);
      }
    }
    expect(lengths[0]).toBeLessThan(lengths[1]!);
    expect(lengths[1]).toBeLessThan(lengths[2]!);
    const scripts = variants().filter((v) => v.script.archetypeId === 'sunrise_den');
    expect(new Set(scripts.map((v) => v.script.tier))).toEqual(new Set(TIERS));
    for (const v of scripts) {
      expect(walkSteps(v.script, { babies: v.config.babies.length, actorKind: v.config.actorKind, allowedPlaces: leopard.allowedBiomes }), v.script.id).toEqual([]);
      const text = JSON.stringify(v.script.steps);
      // cohérence : elle dort dans sa grotte, mange de la viande, boit sans nager
      expect(text, v.script.id).toMatch(/"anchor":"cave"/);
      expect(text, v.script.id).not.toMatch(/"action":"swim"/);
      if (v.script.tier !== 'beginner') expect(text, v.script.id).toMatch(/"prop":"meat"/);
      if (v.script.tier === 'expert') expect(text, v.script.id).toMatch(/"action":"drink_lap"/);
    }
  });
});
