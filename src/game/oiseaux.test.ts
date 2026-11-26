import { describe, expect, it } from 'vitest';
import {
  FLAP_DOWN, IDLE_FLUTTER_EVERY, IDLE_FLUTTER_S, PAD_X, PAD_Y, WINGS, WING_DOWN, WING_UP,
  clipPose, flapRise, flyPose, idleFlutter, skinPoint, validateRig, wingBend, wingElevation, wingRest,
} from './puppet';
import { RIGS } from './rigs';
import { canFly, puppetClip } from './staging';

/**
 * Les oiseaux battent des ailes (2026-11-26, Westimmo : « qu'on les voit battre des ailes et que l'animation
 * soit haut de gamme »).
 */
const STAGES = ['father', 'mother', 'boy_companion', 'girl_companion', 'boy_young', 'girl_young', 'boy_little', 'girl_little'];
const BIRDS = ['owl', 'toucan'].flatMap((sp) => STAGES.map((s) => `${sp}_${s}`));

describe('le squelette des oiseaux', () => {
  it('chaque hibou et chaque toucan a un corps, une tête, des pattes et deux ailes articulées', () => {
    for (const k of BIRDS) {
      const rig = RIGS[k]!;
      expect(rig, k).toBeDefined();
      expect(validateRig(rig), k).toEqual([]);
      const ids = rig.bones.map((b) => b.id);
      for (const need of ['body', 'head', 'feet', 'wing', 'wingTip', 'wing2', 'wing2Tip']) expect(ids, k).toContain(need);
      // la bouche (le bec) est du côté où il regarde
      expect(Math.sign(rig.mouth[0] - rig.width / 2), k).toBe(rig.facing);
      // les deux ailes s'ouvrent de part et d'autre du corps
      expect(wingRest(rig, 'wing', 'wingTip')!.out, k).toBe(-wingRest(rig, 'wing2', 'wing2Tip')!.out);
      // les petits battent des ailes plus vite que les adultes
      expect(rig.flapRate, k).toBeGreaterThan(2);
    }
    expect(RIGS.owl_girl_little!.flapRate!).toBeGreaterThan(RIGS.owl_father!.flapRate!);
    expect(RIGS.toucan_boy_little!.flapRate!).toBeGreaterThan(RIGS.toucan_father!.flapRate!);
  });

  it('le nouveau-né ne vole pas encore ; les autres oiseaux volent', () => {
    expect(canFly('fly', 'newborn')).toBe(false);
    expect(canFly('fly', 'little')).toBe(true);
    expect(canFly('fly')).toBe(true);
    expect(canFly('walk')).toBe(false);
  });
});

describe('un vrai battement d’ailes', () => {
  it('les ailes montent tout en haut puis descendent tout en bas, sans à-coup', () => {
    expect(wingElevation(0)).toBeCloseTo(WING_UP, 6);
    expect(wingElevation(FLAP_DOWN)).toBeCloseTo(WING_DOWN, 6);
    // continuité au bas du battement, au retour en haut et d'un battement à l'autre
    for (const at of [FLAP_DOWN, 1, 2]) {
      expect(Math.abs(wingElevation(at - 1e-4) - wingElevation(at + 1e-4))).toBeLessThan(0.05);
      expect(Math.abs(wingBend(at - 1e-4) - wingBend(at + 1e-4))).toBeLessThan(0.05);
      expect(Math.abs(flapRise(at - 1e-4) - flapRise(at + 1e-4))).toBeLessThan(0.01);
    }
    // l'abaissement (le coup puissant) dure plus longtemps que la remontée
    expect(FLAP_DOWN).toBeGreaterThan(0.5);
  });

  it('le bout de l’aile se relève en abaissant et se replie en remontant ; le corps monte quand les ailes descendent', () => {
    expect(wingBend(FLAP_DOWN / 2)).toBeGreaterThan(10);
    expect(wingBend(FLAP_DOWN + (1 - FLAP_DOWN) / 2)).toBeLessThan(-20);
    expect(flapRise(0)).toBeCloseTo(-0.5, 6);
    expect(flapRise(FLAP_DOWN)).toBeCloseTo(0.5, 6);
  });

  it('les deux ailes battent ensemble, en miroir : tout en haut au début, tout en bas après l’abaissement', () => {
    for (const k of BIRDS) {
      const rig = RIGS[k]!;
      const elev = (p: number, w: 'wing' | 'wing2') => {
        const rest = wingRest(rig, w, `${w}Tip`)!;
        // élévation obtenue = élévation au repos + rotation vers l'extérieur
        return rest.elev - rest.out * flyPose(rig, p / rig.flapRate!)[w]!.rot!;
      };
      for (const w of ['wing', 'wing2'] as const) {
        expect(elev(0, w), `${k} ${w}`).toBeGreaterThan(elev(FLAP_DOWN / 2, w));
        expect(elev(FLAP_DOWN / 2, w), `${k} ${w}`).toBeGreaterThan(elev(FLAP_DOWN, w));
        expect(elev(FLAP_DOWN, w), `${k} ${w}`).toBeLessThan(elev(0.8, w));
        // une vraie amplitude : au moins 35° entre le haut et le bas
        expect(elev(0, w) - elev(FLAP_DOWN, w), `${k} ${w}`).toBeGreaterThan(35);
      }
    }
  });

  it('un hibou aux ailes repliées les écarte du corps sans se tordre (rotation limitée)', () => {
    for (const k of ['owl_father', 'owl_mother', 'owl_boy_companion', 'owl_girl_little']) {
      const rig = RIGS[k]!;
      for (let p = 0; p < 1; p += 0.05) {
        const pose = flyPose(rig, p / rig.flapRate!);
        for (const [w] of WINGS) expect(Math.abs(pose[w]!.rot!), `${k} ${w} à ${p.toFixed(2)}`).toBeLessThanOrEqual(41);
      }
    }
  });

  it('la tête reste stable : elle bouge bien moins que le corps, et compense son inclinaison', () => {
    for (const k of BIRDS) {
      const rig = RIGS[k]!;
      for (let p = 0; p < 1; p += 0.1) {
        const pose = flyPose(rig, p / rig.flapRate!);
        expect(Math.abs(pose.head!.dy!), k).toBeLessThan(Math.abs(pose.body!.dy!) + 1e-9);
        expect(Math.abs(pose.body!.rot! + pose.head!.rot!), k).toBeLessThan(2.1);
      }
    }
  });

  it('chaque oiseau reste dans le cadre du canevas pendant tout le battement', () => {
    for (const k of BIRDS) {
      const rig = RIGS[k]!;
      const visible = [...rig.bones.flatMap((b) => [b.pivot, b.tip]), rig.mouth];
      let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
      for (let p = 0; p < 1; p += 0.02) {
        const pose = clipPose(rig, 'fly', p / rig.flapRate!);
        for (const v of visible) {
          const [x, y] = skinPoint(rig, pose, v);
          x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
      }
      expect(x0, k).toBeGreaterThan(-rig.width * PAD_X);
      expect(x1, k).toBeLessThan(rig.width * (1 + PAD_X));
      expect(y0, k).toBeGreaterThan(-rig.height * PAD_Y);
      expect(y1, k).toBeLessThan(rig.height * (1 + PAD_Y));
    }
  });
});

describe('l’oiseau posé', () => {
  it('de temps en temps, il secoue les ailes : deux petits battements, puis plus rien', () => {
    expect(idleFlutter(0)).toBe(0);
    expect(idleFlutter(IDLE_FLUTTER_EVERY - IDLE_FLUTTER_S - 0.01)).toBe(0);
    let max = 0;
    for (let t = IDLE_FLUTTER_EVERY - IDLE_FLUTTER_S; t < IDLE_FLUTTER_EVERY; t += 0.01) max = Math.max(max, idleFlutter(t));
    expect(max).toBeGreaterThan(8);
    expect(max).toBeLessThanOrEqual(16);
    // le même secouement revient toutes les 6,5 s
    expect(idleFlutter(2 * IDLE_FLUTTER_EVERY - 0.3)).toBeCloseTo(idleFlutter(IDLE_FLUTTER_EVERY - 0.3), 6);
  });

  it('posé, ses ailes ne bougent presque pas (le hibou respire)', () => {
    const rig = RIGS.owl_father!;
    for (let t = 0; t < 5; t += 0.25) {
      const pose = clipPose(rig, 'idle', t);
      expect(Math.abs(pose.wing!.rot!)).toBeLessThan(4);
    }
  });
});

describe('voler pendant un jeu', () => {
  it('l’oiseau bat des ailes quand il se déplace ou quand un jeu lui demande de voler', () => {
    expect(puppetClip({ walking: true, flies: true })).toBe('fly');
    expect(puppetClip({ walking: false, action: 'fly', flies: true })).toBe('fly');
    // un animal qui ne vole pas ne bat pas des ailes
    expect(puppetClip({ walking: false, action: 'fly' })).not.toBe('fly');
  });
});
