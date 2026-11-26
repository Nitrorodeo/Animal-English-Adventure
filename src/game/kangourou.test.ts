import { describe, expect, it } from 'vitest';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { HOP_CONTACT, HOP_LIFT, HOP_S, PAD_X, PAD_Y, clipPose, hopLift, hopPhase, hopPose, skinPoint, validateRig, type Pose } from './puppet';
import { RIGS } from './rigs';
import { HOP_GROUND_SHARE, canHop, hopTrip, puppetClip } from './staging';

/**
 * Les kangourous bondissent (2026-11-26, Westimmo : « faire sauter les kangourous pour donner un effet de
 * déplacement un peu plus réel comme on l'a fait pour les animaux à 4 pattes qui marchent, mais il faut vraiment
 * un rendu réel »).
 */
const KANGAROOS = ['kangaroo_father', 'kangaroo_mother', 'kangaroo_boy_companion', 'kangaroo_girl_companion', 'kangaroo_boy_young', 'kangaroo_girl_young', 'kangaroo_boy_little', 'kangaroo_girl_little'];

describe('le squelette des kangourous', () => {
  it('chaque kangourou debout a une hanche, une tête, une queue en deux parties et ses pattes arrière', () => {
    for (const k of KANGAROOS) {
      const rig = RIGS[k]!;
      expect(validateRig(rig), k).toEqual([]);
      const ids = rig.bones.map((b) => b.id);
      for (const need of ['body', 'head', 'tail', 'tailTip', 'feet']) expect(ids, k).toContain(need);
      // pas d'os « leg… » : ce n'est pas la marche à quatre pattes
      expect(ids.some((id) => id.startsWith('leg')), k).toBe(false);
      // les pieds sont en bas du dessin, la queue derrière (du côté opposé au regard)
      const feet = rig.bones.find((b) => b.id === 'feet')!;
      expect(feet.tip[1], k).toBeGreaterThan(rig.height * 0.85);
      const tail = rig.bones.find((b) => b.id === 'tailTip')!;
      expect(Math.sign(tail.tip[0] - rig.width / 2), k).toBe(-rig.facing);
      // la bouche est du côté où il regarde
      expect(Math.sign(rig.mouth[0] - rig.width / 2), k).toBe(rig.facing);
    }
  });

  it('les petits regardent vers la droite, comme sur leur dessin', () => {
    for (const k of ['kangaroo_boy_little', 'kangaroo_girl_little', 'kangaroo_boy_young', 'kangaroo_girl_young']) expect(RIGS[k]!.facing, k).toBe(1);
    expect(RIGS.kangaroo_mother!.facing).toBe(-1);
  });
});

describe('un vrai bond', () => {
  const kip = RIGS.kangaroo_father!;
  const H = kip.height;

  it('au sol 30 % du temps, sans s’élever ; en l’air, un arc qui monte puis redescend', () => {
    for (let p = 0; p < HOP_CONTACT; p += 0.02) expect(hopLift(kip, p)).toBe(0);
    const peak = hopLift(kip, HOP_CONTACT + (1 - HOP_CONTACT) / 2);
    expect(peak).toBeCloseTo(H * HOP_LIFT, 5);
    expect(hopLift(kip, 0.45)).toBeLessThan(peak);
    expect(hopLift(kip, 0.95)).toBeLessThan(hopLift(kip, 0.8));
    // il se pose doucement : l'élévation revient à 0 à la fin du bond
    expect(hopLift(kip, 0.9999)).toBeLessThan(H * 0.002);
    // la hauteur du bond reste dans la marge haute du canevas
    expect(HOP_LIFT).toBeLessThan(PAD_Y);
  });

  it('il se tasse au sol, s’étire en quittant le sol, penché en avant ; la tête reste presque droite', () => {
    const mid = hopPose(kip, HOP_CONTACT / 2);
    expect(mid.body!.sy!).toBeLessThan(0.95);
    const takeoff = hopPose(kip, HOP_CONTACT + 0.1);
    expect(takeoff.body!.sy!).toBeGreaterThan(1.02);
    for (let p = 0; p < 1; p += 0.05) {
      const pose = hopPose(kip, p);
      expect(Math.sign(pose.body!.rot!)).toBe(kip.facing);
      // la tête compense en grande partie l'inclinaison du corps
      expect(Math.abs(pose.body!.rot! + pose.head!.rot!)).toBeLessThan(Math.abs(pose.body!.rot!) * 0.5);
    }
  });

  it('en l’air, les pieds partent en arrière puis reviennent devant ; la queue se relève ; au sol elle s’abaisse', () => {
    const f = kip.facing;
    const early = hopPose(kip, HOP_CONTACT + 0.15), late = hopPose(kip, 0.92);
    expect(Math.sign(early.feet!.rot!)).toBe(f);
    expect(Math.sign(late.feet!.rot!)).toBe(-f);
    expect(early.feet2).toEqual(early.feet);
    expect(Math.sign(hopPose(kip, 0.65).tail!.rot!)).toBe(f);
    expect(Math.sign(hopPose(kip, HOP_CONTACT / 2).tail!.rot!)).toBe(-f);
  });

  it('aucun à-coup : la pose est continue au moment de quitter le sol, de se poser et d’un bond à l’autre', () => {
    const close = (a: Pose, b: Pose) => {
      for (const id of Object.keys(a)) {
        expect(Math.abs((a[id]!.rot ?? 0) - (b[id]!.rot ?? 0)), id).toBeLessThan(0.6);
        expect(Math.abs((a[id]!.sy ?? 1) - (b[id]!.sy ?? 1)), id).toBeLessThan(0.01);
      }
    };
    for (const at of [HOP_CONTACT, 1, 2]) close(hopPose(kip, at - 1e-4), hopPose(kip, at + 1e-4));
    expect(hopPhase(2.5)).toEqual(hopPhase(0.5));
  });

  it('les orteils ne s’enfoncent jamais dans le sol, et chaque kangourou reste dans le cadre du canevas', () => {
    for (const k of KANGAROOS) {
      const rig = RIGS[k]!;
      const toes = rig.bones.find((b) => b.id === 'feet')!.tip;
      // les parties visibles du dessin : articulations, bouche, et le haut des oreilles au-dessus de la tête
      // (les coins vides de l'image peuvent sortir du cadre quand il se penche : ils sont transparents)
      const hx = rig.bones.find((b) => b.id === 'head')!.tip[0];
      const visible = [
        ...rig.bones.flatMap((b) => [b.pivot, b.tip]),
        rig.mouth,
        ...[-0.15, 0, 0.15].map((d) => [Math.min(rig.width, Math.max(0, hx + d * rig.width)), rig.height * 0.03] as const),
      ];
      let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
      for (let p = 0; p < 1; p += 0.02) {
        const pose = clipPose(rig, 'hop', p * HOP_S);
        const lift = hopLift(rig, p);
        const toe = skinPoint(rig, pose, toes);
        expect(toe[1] - lift, `${k} à ${p.toFixed(2)}`).toBeLessThan(toes[1] + rig.height * 0.02);
        for (const v of visible) {
          const [x, y] = skinPoint(rig, pose, v);
          x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          y0 = Math.min(y0, y - lift); y1 = Math.max(y1, y - lift);
        }
      }
      expect(x0, k).toBeGreaterThan(-rig.width * PAD_X);
      expect(x1, k).toBeLessThan(rig.width * (1 + PAD_X));
      expect(y0, k).toBeGreaterThan(-rig.height * PAD_Y);
      expect(y1, k).toBeLessThan(rig.height * (1 + PAD_Y));
    }
  });
});

describe('se déplacer en bondissant', () => {
  it('le kangourou bondit au lieu de marcher ; le nouveau-né assis ne bondit pas, les autres animaux marchent', () => {
    expect(canHop('jump')).toBe(true);
    expect(canHop('jump', 'little')).toBe(true);
    expect(canHop('jump', 'newborn')).toBe(false);
    expect(canHop('walk')).toBe(false);
    expect(puppetClip({ walking: true, hops: true })).toBe('hop');
    expect(puppetClip({ walking: false, action: 'walk', hops: true })).toBe('hop');
    expect(puppetClip({ walking: true })).toBe('walk');
    expect(puppetClip({ walking: true, flies: true })).toBe('fly');
  });

  it('un nombre entier de bonds par trajet : il se pose pile à l’arrivée', () => {
    expect(hopTrip(450).count).toBe(1);
    expect(hopTrip(2600).count).toBe(5);
    for (const ms of [450, 900, 1600, 2600]) {
      const { count, hopS } = hopTrip(ms);
      expect(count * hopS * 1000).toBeCloseTo(ms, 6);
      // un bond dure entre 0,4 et 0,8 seconde, comme un vrai kangourou
      expect(hopS).toBeGreaterThan(0.4);
      expect(hopS).toBeLessThan(0.8);
    }
  });

  it('il avance peu pendant l’appui au sol et surtout en l’air (courbe CSS linear())', () => {
    const { easing } = hopTrip(1600);
    expect(easing.startsWith('linear(0 0%, ')).toBe(true);
    expect(easing.endsWith('1 100%)')).toBe(true);
    const pts = easing.slice(7, -1).split(', ').map((s) => s.split(' ').map((x) => parseFloat(x)));
    // trois bonds : 1 + 2 × 3 points, avance et temps toujours croissants
    expect(pts).toHaveLength(7);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]![0]!).toBeGreaterThan(pts[i - 1]![0]!);
      expect(pts[i]![1]!).toBeGreaterThan(pts[i - 1]![1]!);
    }
    // premier appui : 30 % du bond, 10 % de son avancée
    expect(pts[1]![1]! / 100).toBeCloseTo(HOP_CONTACT / 3, 3);
    expect(pts[1]![0]!).toBeCloseTo(HOP_GROUND_SHARE / 3, 3);
  });

  it('le décor fait bondir le kangourou : rythme du trajet, avancée en bonds, nouveau départ à chaque trajet', () => {
    const src: string = readFileSync(new URL('../ui/Habitat.tsx', import.meta.url), 'utf8');
    expect(src).toContain('const hops = canHop(species.mobility, stage);');
    expect(src).toContain('const clip = puppetClip({ walking: !!walk, action, speaking, flies, hops });');
    expect(src).toContain('transitionTimingFunction: hops && walk && !dragging ? hopTrip(track.current.ms).easing : undefined,');
    expect(src).toContain('hopS: hopTrip(track.current.ms).hopS, hopKey: track.current.trip');
    const puppet: string = readFileSync(new URL('../ui/Puppet.tsx', import.meta.url), 'utf8');
    // l'élévation déplace le dessin, pas l'ombre (qui pâlit en l'air)
    expect(puppet).toContain('gl.uniform2f(uShift, 0, -lift);');
    expect(puppet).toContain('(1 - 0.5 * Math.min(1, lift / (rig.height * HOP_LIFT)))');
  });
});
