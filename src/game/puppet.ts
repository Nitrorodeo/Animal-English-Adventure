/**
 * Marionnette déformable (« puppet warp ») : un seul dessin de personnage est posé sur un maillage
 * dont chaque sommet suit un ou plusieurs os. En tournant les os (pattes, tête, queue), le dessin se
 * plie sans trou ni découpe : le lion marche en bougeant les pattes, baisse la tête pour boire…
 *
 * Tout est pur et déterministe (testable sans écran) ; l'affichage WebGL est dans `ui/Puppet.tsx`.
 * Repère : pixels de l'image d'origine, x vers la droite, y vers le bas, angles en degrés
 * (positif = sens des aiguilles d'une montre à l'écran).
 */

export type Vec = readonly [number, number];

export interface BoneDef {
  id: string;
  /** os parent : il entraîne celui-ci (la tête suit le corps) ; absent = racine */
  parent?: string;
  /** articulation autour de laquelle l'os tourne */
  pivot: Vec;
  /** bout de l'os : le segment pivot → bout sert à répartir le dessin entre les os */
  tip: Vec;
  /** influence relative (défaut 1) : > 1 attire plus de dessin vers cet os */
  strength?: number;
  /** ordre de dessin : une couche plus haute passe devant (la tête qui se baisse passe devant les pattes) */
  layer?: number;
}

export interface RigDef {
  /** clé du sprite (ex. « lion_father ») */
  sprite: string;
  width: number;
  height: number;
  bones: readonly BoneDef[];
  /** bouche, en pixels de l'image : sert à placer les ronds dans l'eau quand il boit */
  mouth: Vec;
  /** sens où regarde le dessin : 1 = vers la droite, -1 = vers la gauche */
  facing: 1 | -1;
  /** rythme de marche (pas par seconde, défaut 1.25) */
  stepRate?: number;
  /** profondeur où la tête descend pour boire (fraction de la hauteur) ; 0,11 par défaut */
  drinkDip?: number;
}

export interface BonePose {
  rot?: number;
  dx?: number;
  dy?: number;
  sx?: number;
  sy?: number;
}
export type Pose = Readonly<Record<string, BonePose>>;

/** Matrice affine 2×3 : [a, b, c, d, e, f] → x' = a x + c y + e ; y' = b x + d y + f */
export type Mat = readonly [number, number, number, number, number, number];
export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

export function mul(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

export function apply(m: Mat, p: Vec): Vec {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}

/** Transformation locale d'un os : tourner / étirer autour de son pivot, puis déplacer. */
export function localMatrix(pivot: Vec, p: BonePose | undefined): Mat {
  if (!p) return IDENTITY;
  const r = ((p.rot ?? 0) * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const sx = p.sx ?? 1, sy = p.sy ?? 1;
  const [px, py] = pivot;
  // T(pivot + d) · R · S · T(-pivot)
  const a = cos * sx, b = sin * sx, c = -sin * sy, d = cos * sy;
  return [a, b, c, d, px + (p.dx ?? 0) - (a * px + c * py), py + (p.dy ?? 0) - (b * px + d * py)];
}

/** Matrices « monde » de tous les os (un parent est toujours déclaré avant ses enfants). */
export function worldMatrices(rig: RigDef, pose: Pose): Map<string, Mat> {
  const out = new Map<string, Mat>();
  for (const b of rig.bones) {
    const parent = b.parent ? out.get(b.parent) : IDENTITY;
    if (!parent) throw new Error(`Os ${b.id} : parent ${b.parent} inconnu ou déclaré après`);
    out.set(b.id, mul(parent, localMatrix(b.pivot, pose[b.id])));
  }
  return out;
}

export function segmentDistance(p: Vec, a: Vec, b: Vec): number {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2));
  const qx = a[0] + t * vx - p[0], qy = a[1] + t * vy - p[1];
  return Math.hypot(qx, qy);
}

/**
 * Poids de chaque os pour un point du dessin : l'os le plus proche domine, mais les zones de
 * jonction (épaule, cou) se partagent entre deux os, ce qui plie le dessin en douceur.
 */
export function weightsAt(rig: RigDef, p: Vec, power = 4): number[] {
  const scale = rig.height * 0.03;
  const raw = rig.bones.map((b) => (b.strength ?? 1) / Math.pow(segmentDistance(p, b.pivot, b.tip) + scale, power));
  const sum = raw.reduce((s, w) => s + w, 0);
  return raw.map((w) => w / sum);
}

export interface Mesh {
  cols: number;
  rows: number;
  /** positions de repos (x, y en pixels de l'image), à plat */
  rest: Float32Array;
  /** coordonnées de texture (u, v entre 0 et 1), à plat */
  uv: Float32Array;
  /** indices des triangles */
  indices: Uint16Array;
  /** poids : rest.length / 2 sommets × nombre d'os */
  weights: Float32Array;
  /** pour chaque sommet, les os qui comptent vraiment (poids > 0,5 %) */
  influences: number[][];
}

/** Grille régulière posée sur l'image, chaque sommet lié aux os. */
export function buildMesh(rig: RigDef, cols = 28, rows = 36): Mesh {
  const n = (cols + 1) * (rows + 1);
  if (n > 65535) throw new Error('Maillage trop fin');
  const rest = new Float32Array(n * 2);
  const uv = new Float32Array(n * 2);
  const weights = new Float32Array(n * rig.bones.length);
  const influences: number[][] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      const u = i / cols, v = j / rows;
      const p: Vec = [u * rig.width, v * rig.height];
      rest[2 * k] = p[0]; rest[2 * k + 1] = p[1];
      uv[2 * k] = u; uv[2 * k + 1] = v;
      const w = weightsAt(rig, p);
      const keep: number[] = [];
      w.forEach((x, b) => { weights[k * rig.bones.length + b] = x; if (x > 0.005) keep.push(b); });
      influences.push(keep);
    }
  }
  // chaque case est dessinée dans la couche de l'os qui la tient le plus : les couches basses d'abord
  const nb = rig.bones.length;
  const cells: { layer: number; tri: number[] }[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
      const sum = new Array<number>(nb).fill(0);
      for (const v of [a, b, c, d]) for (let k = 0; k < nb; k++) sum[k]! += weights[v * nb + k]!;
      const main = sum.indexOf(Math.max(...sum));
      cells.push({ layer: rig.bones[main]!.layer ?? 0, tri: [a, b, c, b, d, c] });
    }
  }
  cells.sort((x, y) => x.layer - y.layer); // tri stable : l'ordre de la grille est gardé dans une couche
  const indices = new Uint16Array(cells.flatMap((x) => x.tri));
  return { cols, rows, rest, uv, indices, weights, influences };
}

/** Déforme le maillage selon la pose (mélange linéaire des os). Écrit dans `out` si fourni. */
export function skin(rig: RigDef, mesh: Mesh, pose: Pose, out = new Float32Array(mesh.rest.length)): Float32Array {
  const world = worldMatrices(rig, pose);
  const mats = rig.bones.map((b) => world.get(b.id)!);
  const nb = rig.bones.length;
  for (let k = 0; k < mesh.influences.length; k++) {
    const x = mesh.rest[2 * k]!, y = mesh.rest[2 * k + 1]!;
    let ox = 0, oy = 0, total = 0;
    for (const b of mesh.influences[k]!) {
      const w = mesh.weights[k * nb + b]!;
      const m = mats[b]!;
      ox += w * (m[0] * x + m[2] * y + m[4]);
      oy += w * (m[1] * x + m[3] * y + m[5]);
      total += w;
    }
    out[2 * k] = ox / total;
    out[2 * k + 1] = oy / total;
  }
  return out;
}

/** Position d'un point du dessin une fois la pose appliquée. */
export function skinPoint(rig: RigDef, pose: Pose, p: Vec): Vec {
  const world = worldMatrices(rig, pose);
  const w = weightsAt(rig, p);
  let x = 0, y = 0;
  rig.bones.forEach((b, i) => {
    const q = apply(world.get(b.id)!, p);
    x += w[i]! * q[0];
    y += w[i]! * q[1];
  });
  return [x, y];
}

// ---------------------------------------------------------------------------
// Animations : une animation est une fonction pure (temps en secondes → pose).

/** Marge du canevas autour du dessin (fraction de la largeur / hauteur), pour que la tête qui se penche ne soit pas coupée. */
export const PAD_X = 0.45;
export const PAD_Y = 0.15;

export type ClipName = 'idle' | 'talk' | 'walk' | 'drink';

const has = (rig: RigDef, id: string) => rig.bones.some((b) => b.id === id);

function idle(rig: RigDef, t: number): Record<string, BonePose> {
  const breath = Math.sin((t * 2 * Math.PI) / 3.2);
  const pose: Record<string, BonePose> = {
    body: { sy: 1 + 0.012 * breath, dy: -1.5 * breath },
    head: { rot: 1.5 * Math.sin((t * 2 * Math.PI) / 4.1) },
  };
  if (has(rig, 'tail')) pose.tail = { rot: 7 * Math.sin((t * 2 * Math.PI) / 2.6) };
  if (has(rig, 'tailTip')) pose.tailTip = { rot: 10 * Math.sin((t * 2 * Math.PI) / 2.6 - 0.9) };
  return pose;
}

/** Pattes avant et arrière opposées en diagonale ; la patte qui avance se lève. */
export function walkPose(rig: RigDef, t: number): Record<string, BonePose> {
  const w = 2 * Math.PI * (rig.stepRate ?? 1.25);
  const amp = 13, lift = rig.height * 0.025;
  const leg = (phase: number): BonePose => {
    const a = w * t + phase;
    // tourner dans le sens négatif fait avancer la patte (dessin tourné vers la droite)
    return { rot: -amp * Math.sin(a) * rig.facing, dy: -lift * Math.max(0, Math.cos(a)) };
  };
  const bob = Math.abs(Math.sin(w * t));
  if (!rig.bones.some((b) => b.id.startsWith('leg'))) {
    // sans os de patte (assis, de face, bébés) : il se dandine et sautille
    return {
      body: { rot: 4 * Math.sin(w * t), dy: -rig.height * 0.035 * bob, sy: 1 + 0.025 * bob },
      head: { rot: -2 * Math.sin(w * t), dy: -rig.height * 0.01 * bob },
      tail: { rot: 9 * Math.sin(w * t + 1) },
      tailTip: { rot: 12 * Math.sin(w * t) },
    };
  }
  return {
    body: { dy: -rig.height * 0.012 * bob },
    head: { rot: 2 * Math.sin(2 * w * t), dy: -rig.height * 0.01 * bob },
    legFL: leg(0),
    legBR: leg(0.25),
    legFR: leg(Math.PI),
    legBL: leg(Math.PI + 0.25),
    tail: { rot: 9 * Math.sin(w * t + 1) },
    tailTip: { rot: 12 * Math.sin(w * t) },
  };
}

/**
 * Boire : le corps s'incline vers l'avant (les pattes avant restent au sol et se plient), la tête
 * descend jusqu'à l'eau, puis lape (petits coups de tête).
 * `t` compte depuis le début ; la descente dure 0,9 s.
 */
export function drinkPose(rig: RigDef, t: number): Record<string, BonePose> {
  const down = easeInOut(Math.min(1, t / 0.9));
  const lap = t > 0.9 ? Math.sin((t - 0.9) * 2 * Math.PI * 2.4) : 0;
  const f = rig.facing;
  // sans os de patte, le corps porte les pieds : il ne s'incline presque pas, la tête fait le geste
  const legs = rig.bones.some((b) => b.id.startsWith('leg'));
  const dip = rig.drinkDip ?? 0.11;
  const tilt = dip >= 0.11 ? 18 : 12;
  return {
    body: legs ? { rot: 7 * f * down, dy: rig.height * 0.02 * down } : { rot: 2 * f * down },
    head: { rot: (tilt + 3 * lap) * f * down, dx: rig.width * 0.02 * f * down, dy: rig.height * (dip + 0.008 * lap) * down },
    tail: { rot: 6 * Math.sin(t * 2 * Math.PI / 2.4) },
    tailTip: { rot: 9 * Math.sin(t * 2 * Math.PI / 2.4 - 0.8) },
  };
}

function talk(rig: RigDef, t: number): Record<string, BonePose> {
  const base = idle(rig, t);
  return { ...base, head: { rot: 2.5 * Math.sin(t * 2 * Math.PI * 1.7), dy: -rig.height * 0.004 * Math.abs(Math.sin(t * 2 * Math.PI * 1.7)) } };
}

export function clipPose(rig: RigDef, clip: ClipName, t: number): Pose {
  const pose = clip === 'walk' ? walkPose(rig, t) : clip === 'drink' ? drinkPose(rig, t) : clip === 'talk' ? talk(rig, t) : idle(rig, t);
  // on ne garde que les os qui existent dans ce squelette
  return Object.fromEntries(Object.entries(pose).filter(([id]) => has(rig, id)));
}

export function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/** Fondu entre deux poses (k = 0 → a, k = 1 → b) : passage en douceur d'une animation à l'autre. */
export function blendPose(a: Pose, b: Pose, k: number): Pose {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  const lerp = (x: number | undefined, y: number | undefined, def: number) => (x ?? def) + ((y ?? def) - (x ?? def)) * k;
  const out: Record<string, BonePose> = {};
  for (const id of ids) {
    const p = a[id] ?? {}, q = b[id] ?? {};
    out[id] = { rot: lerp(p.rot, q.rot, 0), dx: lerp(p.dx, q.dx, 0), dy: lerp(p.dy, q.dy, 0), sx: lerp(p.sx, q.sx, 1), sy: lerp(p.sy, q.sy, 1) };
  }
  return out;
}

/** Contrôle d'un squelette : parents déclarés avant, os dans l'image, pas de doublon. */
export function validateRig(rig: RigDef): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const inside = (p: Vec) => p[0] >= 0 && p[0] <= rig.width && p[1] >= 0 && p[1] <= rig.height;
  for (const b of rig.bones) {
    if (seen.has(b.id)) errors.push(`${rig.sprite} : os ${b.id} en double`);
    if (b.parent && !seen.has(b.parent)) errors.push(`${rig.sprite} : parent ${b.parent} de ${b.id} absent ou déclaré après`);
    if (!inside(b.pivot) || !inside(b.tip)) errors.push(`${rig.sprite} : os ${b.id} hors de l'image`);
    seen.add(b.id);
  }
  for (const need of ['body', 'head']) if (!seen.has(need)) errors.push(`${rig.sprite} : os ${need} manquant`);
  if (!inside(rig.mouth)) errors.push(`${rig.sprite} : bouche hors de l'image`);
  return errors;
}
