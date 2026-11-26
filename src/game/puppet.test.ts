import { describe, expect, it } from 'vitest';
import { PAD_X, PAD_Y, blendPose, buildMesh, clipPose, meshFor, drinkPose, localMatrix, apply, skin, skinPoint, validateRig, walkPose, weightsAt, type Pose } from './puppet';
// @ts-expect-error -- module Node disponible dans Vitest, sans les types Node dans le projet
import { readFileSync } from 'node:fs';
import { FLY_SPRITES, RIGS } from './rigs';
import assetManifest from '../content/assetManifest.json';

const leo = RIGS.lion_father!;

describe('marionnette déformable', () => {
  it('chaque squelette est valide', () => {
    for (const rig of Object.values(RIGS)) expect(validateRig(rig)).toEqual([]);
  });

  it('chaque squelette correspond à une image de personnage existante, de la bonne taille', () => {
    const manifest = assetManifest as { characters: Record<string, { width: number; height: number }> };
    // dessin « en vol » d'un oiseau : il n'est pas au manifeste (ce n'est pas un personnage à part), on lit sa taille dans le fichier
    const flying = new Set(Object.values(FLY_SPRITES));
    for (const rig of Object.values(RIGS)) {
      if (flying.has(rig.sprite)) {
        const f = readFileSync(`public/assets/characters/${rig.sprite}.webp`);
        expect(f.toString('ascii', 12, 16), rig.sprite).toBe('VP8X');
        expect([f.readUIntLE(24, 3) + 1, f.readUIntLE(27, 3) + 1], rig.sprite).toEqual([rig.width, rig.height]);
        continue;
      }
      const info = manifest.characters[rig.sprite];
      expect(info, rig.sprite).toBeTruthy();
      const w = info!.width, h = info!.height;
      if (w && h) expect([w, h]).toEqual([rig.width, rig.height]);
    }
  });

  it('pose neutre : le dessin ne bouge pas', () => {
    const mesh = buildMesh(leo, 10, 12);
    const out = skin(leo, mesh, {});
    out.forEach((v, i) => expect(v).toBeCloseTo(mesh.rest[i]!, 3));
  });

  it('les poids se partagent à 100 % et chaque partie suit son os', () => {
    const w = weightsAt(leo, [232, 690]);
    expect(w.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 6);
    const ids = leo.bones.map((b) => b.id);
    const best = (p: readonly [number, number]) => ids[weightsAt(leo, p).indexOf(Math.max(...weightsAt(leo, p)))];
    expect(best([232, 690])).toBe('legFL'); // patte avant gauche
    expect(best([390, 680])).toBe('legFR');
    expect(best([60, 670])).toBe('legBL');
    expect(best([370, 200])).toBe('head'); // museau
    expect(best([60, 320])).toBe('tailTip'); // touffe de la queue
  });

  it('tourner un os autour de son pivot ne déplace pas le pivot', () => {
    const m = localMatrix([100, 200], { rot: 30 });
    const p = apply(m, [100, 200]);
    expect(p[0]).toBeCloseTo(100, 6);
    expect(p[1]).toBeCloseTo(200, 6);
  });

  it('bouger une patte ne bouge pas la tête ; pencher le corps entraîne la tête', () => {
    const paw = [232, 700] as const, nose = [395, 200] as const;
    const legOnly: Pose = { legFL: { rot: 20 } };
    expect(skinPoint(leo, legOnly, paw)[0]).toBeLessThan(paw[0] - 30);
    expect(skinPoint(leo, legOnly, nose)[0]).toBeCloseTo(nose[0], 0);
    const lean: Pose = { body: { rot: 10 } };
    expect(skinPoint(leo, lean, nose)[1]).toBeGreaterThan(nose[1] + 20);
  });

  it('marcher : les pattes en diagonale bougent ensemble, opposées aux deux autres', () => {
    const p = walkPose(leo, 0.2);
    expect(Math.sign(p.legFL!.rot!)).toBe(-Math.sign(p.legFR!.rot!));
    expect(Math.sign(p.legBL!.rot!)).toBe(Math.sign(p.legFR!.rot!));
    // sur un pas complet, chaque patte va devant et derrière
    const rots = Array.from({ length: 20 }, (_, i) => walkPose(leo, i / 20 / 1.25).legFL!.rot!);
    expect(Math.max(...rots)).toBeGreaterThan(8);
    expect(Math.min(...rots)).toBeLessThan(-8);
  });

  it('boire : la bouche descend vers le sol et avance, les pattes restent au sol', () => {
    const before = skinPoint(leo, clipPose(leo, 'idle', 0), leo.mouth);
    const after = skinPoint(leo, clipPose(leo, 'drink', 2), leo.mouth);
    expect(after[1] - before[1]).toBeGreaterThan(leo.height * PAD_Y);
    expect(after[0]).toBeGreaterThan(before[0]);
    const paw = skinPoint(leo, drinkPose(leo, 2), [232, 712]);
    expect(Math.abs(paw[1] - 712)).toBeLessThan(6);
  });

  it('le fondu passe d’une pose à l’autre sans saut', () => {
    const a = clipPose(leo, 'idle', 0), b = clipPose(leo, 'drink', 2);
    expect(blendPose(a, b, 0).head!.rot).toBeCloseTo(a.head!.rot ?? 0, 6);
    expect(blendPose(a, b, 1).head!.rot).toBeCloseTo(b.head!.rot ?? 0, 6);
    const mid = blendPose(a, b, 0.5).head!.rot!;
    expect(mid).toBeGreaterThan(Math.min(a.head!.rot ?? 0, b.head!.rot!));
    expect(mid).toBeLessThan(Math.max(a.head!.rot ?? 0, b.head!.rot!));
  });

  it('le dessin déformé reste dans le cadre élargi du canevas', () => {
    const mesh = buildMesh(leo);
    for (const clip of ['walk', 'drink', 'talk', 'idle'] as const) {
      for (let t = 0; t < 3; t += 0.1) {
        const out = skin(leo, mesh, clipPose(leo, clip, t));
        for (let i = 0; i < out.length; i += 2) {
          expect(out[i]!).toBeGreaterThan(-leo.width * PAD_X);
          expect(out[i]!).toBeLessThan(leo.width * (1 + PAD_X));
          expect(out[i + 1]!).toBeGreaterThan(-leo.height * PAD_Y);
          expect(out[i + 1]!).toBeLessThan(leo.height * (1 + PAD_Y));
        }
      }
    }
  });

  it('tous les personnages du jeu ont leur squelette', () => {
    const chars = Object.keys((assetManifest as { characters: Record<string, unknown> }).characters);
    expect(chars.length).toBeGreaterThan(100);
    for (const c of chars) expect(RIGS[c], c).toBeDefined();
  });

  it('chaque personnage reste dans le cadre du canevas, quelle que soit l’animation', () => {
    for (const rig of Object.values(RIGS)) {
      const mesh = buildMesh(rig, 14, 18);
      let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
      // le vol des oiseaux est contrôlé dans oiseaux.test.ts : une aile levée emporte les coins vides de l'image
      // hors du cadre, sans conséquence ; on y vérifie les plumes elles-mêmes
      const clips = ['walk', 'drink', 'talk', 'idle'] as const;
      for (const clip of clips) {
        for (let t = 0; t < 2.5; t += 0.15) {
          const out = skin(rig, mesh, clipPose(rig, clip, t));
          for (let i = 0; i < out.length; i += 2) {
            x0 = Math.min(x0, out[i]!); x1 = Math.max(x1, out[i]!);
            y0 = Math.min(y0, out[i + 1]!); y1 = Math.max(y1, out[i + 1]!);
          }
        }
      }
      expect(x0, rig.sprite).toBeGreaterThan(-rig.width * PAD_X);
      expect(x1, rig.sprite).toBeLessThan(rig.width * (1 + PAD_X));
      expect(y0, rig.sprite).toBeGreaterThan(-rig.height * PAD_Y);
      expect(y1, rig.sprite).toBeLessThan(rig.height * (1 + PAD_Y));
    }
  });

  it('marcher sans os de patte : le personnage se dandine et sautille', () => {
    const owl = RIGS.owl_father!;
    expect(owl.bones.some((b) => b.id.startsWith('leg'))).toBe(false);
    const a = clipPose(owl, 'walk', 0.1), b = clipPose(owl, 'walk', 0.3);
    expect(Math.sign(a.body!.rot!)).not.toBe(Math.sign(clipPose(owl, 'walk', 0.5).body!.rot!));
    expect(b.body!.dy!).toBeLessThan(0);
    // un parent debout de profil garde ses quatre pattes
    expect(RIGS.bison_father!.bones.filter((x) => x.id.startsWith('leg'))).toHaveLength(4);
  });
});

describe('vol du hibou', () => {
  it('le corps bat des ailes (monte et descend vite), penché vers où il va, et seulement avec les os du squelette', () => {
    const owl = RIGS.owl_father!;
    expect(owl).toBeDefined();
    const ys = Array.from({ length: 24 }, (_, i) => clipPose(owl, 'fly', i / 24).body!.dy!);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(owl.height * 0.025); // battements visibles
    expect(Math.sign(clipPose(owl, 'fly', 0).body!.rot!)).toBe(owl.facing); // penché en avant
    expect(Object.keys(clipPose(owl, 'fly', 0.3)).every((id) => owl.bones.some((b) => b.id === id))).toBe(true);
  });

  it('le maillage est calculé une fois par squelette (remonter un personnage ne le recalcule pas)', () => {
    const m = meshFor(leo);
    expect(meshFor(leo)).toBe(m);
    const fresh = buildMesh(leo);
    expect(Array.from(m.rest)).toEqual(Array.from(fresh.rest));
    expect(Array.from(m.indices)).toEqual(Array.from(fresh.indices));
    // la déformation écrit ailleurs : le maillage partagé reste intact
    skin(leo, m, clipPose(leo, 'walk', 0.4));
    expect(Array.from(m.rest)).toEqual(Array.from(fresh.rest));
  });
});
