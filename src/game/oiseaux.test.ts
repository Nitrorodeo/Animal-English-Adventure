import { describe, expect, it } from 'vitest';
import {
  FLAP_DOWN, IDLE_FLUTTER_EVERY, IDLE_FLUTTER_S, PAD_X, PAD_Y, WINGS, WING_DOWN, WING_UP,
  clipPose, landPose, flapRise, flyPose, idleFlutter, skinPoint, validateRig, wingBend, wingElevation, wingRest,
} from './puppet';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { existsSync, readFileSync } from 'node:fs';
import { FLY_SPRITES, RIGS, flyFrame, flyRigFor } from './rigs';
import { canFly, LANDING_MS, LAND_LEAD_MS, landingAt, puppetClip } from './staging';

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

  it('Tico vole avec son dessin aux ailes déployées : ses deux ailes s’écartent du corps, et la queue ne bat pas avec l’aile', () => {
    const rig = flyRigFor('toucan_father')!;
    expect(rig.sprite).toBe('toucan_father_fly');
    expect([rig.width, rig.height]).toEqual([564, 417]);
    for (const [w, tip] of WINGS) {
      const rest = wingRest(rig, w, tip)!;
      // aile ouverte presque à l'horizontale, loin du corps
      expect(Math.abs(rest.elev), w).toBeLessThan(20);
      const end = rig.bones.find((b) => b.id === tip)!.tip;
      expect(Math.abs(end[0] - rig.width / 2), w).toBeGreaterThan(rig.width * 0.4);
    }
    // la queue garde son propre os : elle suit le corps qui se penche, mais pas l'aile qui bat
    const tail = rig.bones.find((b) => b.id === 'tail')!;
    for (const p of [0, 0.3, FLAP_DOWN, 0.8]) {
      const pose = flyPose(rig, p / rig.flapRate!);
      const still = { ...pose, wing: {}, wingTip: {}, wing2: {}, wing2Tip: {} };
      for (const pt of [tail.pivot, tail.tip]) {
        const a = skinPoint(rig, pose, pt), b = skinPoint(rig, still, pt);
        expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `à ${p}`).toBeLessThan(rig.height * 0.01);
      }
    }
  });

  it('un oiseau qui a un dessin en vol garde son dessin naturel une fois posé', () => {
    for (const [rest, fly] of Object.entries(FLY_SPRITES)) {
      expect(existsSync(`public/assets/characters/${fly}.webp`), fly).toBe(true);
      expect(validateRig(RIGS[fly]!), fly).toEqual([]);
      expect(RIGS[fly]!.facing, fly).toBe(RIGS[rest]!.facing);
      // posé, il respire seulement : il ne secoue pas les ailes de son dessin naturel
      const still = RIGS[rest]!;
      for (let t = 0; t < 2 * IDLE_FLUTTER_EVERY; t += 0.05) {
        expect(Math.abs(clipPose(still, 'idle', t).wing!.rot!), `${rest} à ${t.toFixed(2)}`).toBeLessThan(3.1);
      }
    }
    // Tico posé : l'ancien dessin (une aile ouverte, l'autre contre la queue)
    expect([RIGS.toucan_father!.width, RIGS.toucan_father!.height]).toEqual([498, 417]);
    // les toucans et les hiboux (sauf les nouveau-nés, qui ne volent pas) ont leur dessin en vol
    expect(Object.keys(FLY_SPRITES)).toHaveLength(16);
    expect(flyRigFor('owl_father')?.sprite).toBe('owl_father_fly');
    expect(flyRigFor('owl_boy_newborn')).toBeUndefined();
    // les autres animaux n'en ont pas
    expect(flyRigFor('lion_father')).toBeUndefined();
  });

  it('au décollage, le dessin en vol se pose pile sur le dessin posé : même corps, même taille, sans saut', () => {
    for (const rest of Object.keys(FLY_SPRITES)) {
      const a = RIGS[rest]!, b = flyRigFor(rest)!;
      const f = flyFrame(a, b);
      // un point du dessin en vol, ramené dans le cadre du dessin posé (pixels du dessin posé)
      const onRest = ([x, y]: readonly [number, number]): [number, number] => [(f.x + (x / b.width) * f.w) * a.width, (f.y + (y / b.height) * f.h) * a.height];
      const bone = (r: typeof a, id: string) => r.bones.find((x) => x.id === id)!;
      const [px, py] = onRest(bone(b, 'body').pivot);
      expect(Math.hypot(px - bone(a, 'body').pivot[0], py - bone(a, 'body').pivot[1]), rest).toBeLessThan(0.5);
      // le bout de la tête arrive à la même hauteur, à quelques pixels près
      expect(Math.abs(onRest(bone(b, 'head').tip)[1] - bone(a, 'head').tip[1]), rest).toBeLessThan(a.height * 0.03);
      // même échelle dans les deux sens : le dessin n'est ni écrasé ni étiré
      expect((f.w * a.width) / b.width).toBeCloseTo((f.h * a.height) / b.height, 6);
    }
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
    for (const k of [...BIRDS, ...Object.values(FLY_SPRITES)]) {
      const rig = RIGS[k]!;
      // articulations, bec, et le contour des ailes : de part et d'autre de chaque os d'aile, sur 30 % de sa longueur
      const feathers = rig.bones.filter((b) => b.id.startsWith('wing')).flatMap((b) => {
        const dx = b.tip[0] - b.pivot[0], dy = b.tip[1] - b.pivot[1];
        return [1, -1].map((s) => [b.tip[0] - s * 0.3 * dy, b.tip[1] + s * 0.3 * dx] as [number, number]);
      });
      const visible = [...rig.bones.flatMap((b) => [b.pivot, b.tip]), rig.mouth, ...feathers];
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

describe('le décollage et l’atterrissage', () => {
  const css = readFileSync('src/styles.css', 'utf-8');
  const rule = (sel: string) => {
    const m = css.match(new RegExp(sel.replace(/\./g, '\\.') + '\\s*\\{([^}]*)\\}'));
    expect(m, sel).toBeTruthy();
    return m![1];
  };
  const secs = (s: string): number[] => [...s.matchAll(/([\d.]+)s/g)].map((m) => Number(m[1]));

  it('le dessin posé reste plein dessous : seul le dessin en vol change d’opacité (aucun creux pendant le fondu)', () => {
    expect(rule('.puppet.under')).toMatch(/transition:\s*none/);
    // au décollage, il ne disparaît qu’une fois recouvert par le dessin en vol
    const [inS = NaN] = secs(rule('.puppet.over'));
    const [, hideDelay = NaN] = secs(rule('.puppet.under.off'));
    expect(hideDelay).toBeGreaterThanOrEqual(inS);
  });

  it('à l’atterrissage, l’oiseau en vol reste animé jusqu’à la fin de son effacement (pas d’image figée)', () => {
    const [dur = NaN, delay = 0] = secs(rule('.puppet.over.off'));
    expect((dur + delay) * 1000).toBeLessThanOrEqual(LANDING_MS);
    expect(dur).toBeGreaterThan(0.2); // il se pose doucement, pas d’un coup
  });
});

describe('Oscar se pose les ailes repliées (2026-11-26 : « Chez les hiboux il y a un gros lag, quand le hibou arrête de voler »)', () => {
  const rig = RIGS.owl_father_fly!;

  it('seul Oscar replie ses ailes pour se poser, en essai ; les toucans gardent leur atterrissage validé', () => {
    expect(rig.landFold).toBe(true);
    expect(flyRigFor('owl_mother')?.landFold).toBeUndefined();
    expect(flyRigFor('toucan_father')?.landFold).toBeUndefined();
  });

  it('ailes repliées le long du corps : le bout des ailes descend sous l’épaule et se rapproche du corps, sans dépasser sous les pattes', () => {
    const pose = clipPose(rig, 'land', 0);
    expect(pose).toEqual(clipPose(rig, 'land', 5)); // pose tenue, sans mouvement parasite
    const bone = (id: string) => rig.bones.find((b) => b.id === id)!;
    const feetY = Math.max(bone('feet').tip[1], bone('feet2').tip[1]);
    const body = bone('body').pivot[0];
    for (const [w, tip] of [['wing', 'wingTip'], ['wing2', 'wing2Tip']] as const) {
      const shoulder = skinPoint(rig, pose, bone(w).pivot);
      const end = skinPoint(rig, pose, bone(tip).tip);
      expect(end[1], w).toBeGreaterThan(shoulder[1] + 40);
      expect(end[1], w).toBeLessThan(feetY + 10);
      // repliée : bien plus près du corps que l’aile grande ouverte du dessin
      expect(Math.abs(end[0] - body), w).toBeLessThan(Math.abs(bone(tip).tip[0] - body) * 0.75);
    }
    // corps et tête droits
    expect(landPose(rig).body!.rot).toBe(0);
    expect(landPose(rig).head!.rot).toBe(0);
  });

  it('il commence à replier ses ailes peu avant de toucher le sol, après avoir un peu volé', () => {
    expect(landingAt(1600)).toBe(1600 - LAND_LEAD_MS);
    expect(landingAt(400)).toBeCloseTo(240, 6); // vol court : il bat d’abord des ailes
    for (const ms of [300, 800, 2500]) expect(landingAt(ms)).toBeLessThan(ms);
  });

  it('arrivé au sol les ailes déjà repliées, le passage à son dessin posé est bref', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const m = css.match(/\.puppet\.over\.quick\.off\s*\{([^}]*)\}/);
    expect(m).toBeTruthy();
    const [dur = NaN, delay = 0] = [...m![1]!.matchAll(/([\d.]+)s/g)].map((x) => Number(x[1]));
    expect(dur + delay).toBeLessThanOrEqual(0.2);
    expect((dur + delay) * 1000).toBeLessThanOrEqual(LANDING_MS);
  });
});
