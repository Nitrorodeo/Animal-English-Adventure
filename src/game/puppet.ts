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
  /** oiseaux : battements d'ailes par seconde en vol (défaut 3) */
  flapRate?: number;
  /** oiseau posé qui a un dessin à part pour voler : il respire seulement, sans secouer les ailes */
  flutter?: false;
  /** dessin en vol très différent du dessin posé (hibou de face, ailes grandes ouvertes) : il replie ses ailes en se posant */
  landFold?: true;
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

const MESHES = new WeakMap<RigDef, Mesh>();
/** Maillage d'un squelette, calculé une seule fois (il ne change jamais) : remonter un personnage ne coûte plus ~6 ms. */
export function meshFor(rig: RigDef): Mesh {
  let m = MESHES.get(rig);
  if (!m) MESHES.set(rig, (m = buildMesh(rig)));
  return m;
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

export type ClipName = 'idle' | 'talk' | 'walk' | 'drink' | 'fly' | 'hop' | 'land';

const has = (rig: RigDef, id: string) => rig.bones.some((b) => b.id === id);

function idle(rig: RigDef, t: number): Record<string, BonePose> {
  const breath = Math.sin((t * 2 * Math.PI) / 3.2);
  const pose: Record<string, BonePose> = {
    body: { sy: 1 + 0.012 * breath, dy: -1.5 * breath },
    head: { rot: 1.5 * Math.sin((t * 2 * Math.PI) / 4.1) },
  };
  if (has(rig, 'tail')) pose.tail = { rot: 7 * Math.sin((t * 2 * Math.PI) / 2.6) };
  if (has(rig, 'tailTip')) pose.tailTip = { rot: 10 * Math.sin((t * 2 * Math.PI) / 2.6 - 0.9) };
  // oiseau posé : les ailes respirent avec lui, et de temps en temps il les secoue (deux petits battements)
  for (const [w, tip] of WINGS) {
    const rest = wingRest(rig, w, tip);
    if (!rest) continue;
    const shake = rig.flutter === false ? 0 : 1;
    const up = 1.5 * (breath + 1) + shake * idleFlutter(t);
    pose[w] = { rot: -rest.out * up };
    pose[tip] = { rot: -rest.out * 0.6 * shake * idleFlutter(t - 0.06) };
  }
  return pose;
}

/** petit secouement d'ailes d'un oiseau posé (degrés d'élévation) : deux battements toutes les 6,5 s */
export function idleFlutter(t: number): number {
  const tau = t - Math.floor(t / IDLE_FLUTTER_EVERY) * IDLE_FLUTTER_EVERY - (IDLE_FLUTTER_EVERY - IDLE_FLUTTER_S);
  if (tau <= 0 || tau >= IDLE_FLUTTER_S) return 0;
  const env = Math.sin((Math.PI * tau) / IDLE_FLUTTER_S);
  return 16 * env * env * Math.sin((2 * Math.PI * 2 * tau) / IDLE_FLUTTER_S) ** 2;
}
export const IDLE_FLUTTER_EVERY = 6.5;
export const IDLE_FLUTTER_S = 0.7;

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

// ---------------------------------------------------------------------------
// Vol des oiseaux (2026-11-26, Westimmo : « qu'on les voit battre des ailes et que l'animation soit haut de
// gamme »). Chaque aile est articulée à l'épaule (`wing`, `wing2` pour l'aile du fond), avec son bout (`wingTip`).
// Le battement suit le vrai mouvement d'un oiseau :
// - abaissement puissant (55 % du battement), ailes grandes ouvertes ; l'air relève un peu le bout des ailes ;
// - remontée plus rapide, le bout de l'aile replié vers le bas (l'aile se plie pour moins freiner) ;
// - le corps monte pendant l'abaissement et redescend à la remontée ; la tête reste stable (comme un vrai
//   oiseau, elle compense les secousses du corps) ; les pattes sont repliées en arrière ; la queue gouverne.
// Les ailes visent la même élévation quelle que soit leur position sur le dessin (repliées le long du corps
// chez le hibou, entrouvertes chez le toucan) : on part de l'angle de l'aile au repos.
// La montée et la descente du trajet sont faites en CSS (`.flying`).

/** part du battement passée à abaisser les ailes */
export const FLAP_DOWN = 0.55;
/** élévation des ailes tout en haut et tout en bas (degrés au-dessus de l'horizontale, vers l'extérieur) */
export const WING_UP = 42;
export const WING_DOWN = -36;
/** les deux ailes : l'os de l'épaule et celui du bout */
export const WINGS = [['wing', 'wingTip'], ['wing2', 'wing2Tip']] as const;

/**
 * Aile au repos sur le dessin : son élévation (degrés au-dessus de l'horizontale, de l'épaule au bout de l'aile)
 * et le côté vers lequel elle s'ouvre (-1 à gauche, 1 à droite). `null` si le squelette n'a pas cette aile.
 */
export function wingRest(rig: RigDef, wing: string, tip: string): { elev: number; out: 1 | -1 } | null {
  const w = rig.bones.find((b) => b.id === wing);
  if (!w) return null;
  const end = (rig.bones.find((b) => b.id === tip) ?? w).tip;
  const dx = end[0] - w.pivot[0], dy = end[1] - w.pivot[1];
  const out = dx < 0 ? -1 : 1;
  return { elev: (Math.atan2(-dy, out * dx) * 180) / Math.PI, out };
}

/** où en est le battement : en train d'abaisser ou de remonter les ailes, et l'avancement `u` (0 → 1) */
export function flapPhase(p: number): { down: boolean; u: number } {
  const q = p - Math.floor(p);
  return q < FLAP_DOWN ? { down: true, u: q / FLAP_DOWN } : { down: false, u: (q - FLAP_DOWN) / (1 - FLAP_DOWN) };
}

/** élévation des ailes à l'instant `p` du battement (1 = un battement) : vitesse nulle en haut et en bas, sans à-coup */
export function wingElevation(p: number): number {
  const { down, u } = flapPhase(p);
  const mid = (WING_UP + WING_DOWN) / 2, amp = (WING_UP - WING_DOWN) / 2;
  return down ? mid + amp * Math.cos(Math.PI * u) : mid - amp * Math.cos(Math.PI * u);
}

/** une aile ne tourne pas de plus de WING_REACH degrés depuis son dessin (au-delà, le dessin se déchirerait) */
export const WING_REACH = 75;
/** aile repliée le long du corps (dessinée plus bas que FOLDED_BELOW degrés) : elle s'écarte du corps de FOLDED_REACH au plus */
export const FOLDED_BELOW = -45;
export const FOLDED_REACH = 40;
/** une aile ouverte ne descend pas de plus de WING_DROP degrés sous son dessin */
export const WING_DROP = 50;

/**
 * Élévation réellement donnée à une aile dessinée à l'élévation `rest` quand le battement vise `elev` : le même
 * battement, ramené dans ce que permet le dessin. Une aile repliée le long du corps (hibou) bat entre « presque
 * fermée » et « ouverte à l'horizontale » ; une aile déjà ouverte (toucan, jeune hibou) fait le grand battement.
 */
export function wingSpan(rest: number, elev: number): number {
  const folded = rest < FOLDED_BELOW;
  // une aile dessinée déjà levée (jeune hibou) monte encore un peu, et ne descend pas de plus de WING_DROP
  const hi = folded ? rest + FOLDED_REACH : Math.min(Math.max(WING_UP, rest + 15), rest + WING_REACH);
  const lo = folded ? rest + 3 : Math.max(WING_DOWN, rest - WING_DROP);
  return lo + ((elev - WING_DOWN) / (WING_UP - WING_DOWN)) * (hi - lo);
}

/** pli du bout de l'aile (degrés, + = relevé) : poussé vers le haut en abaissant, replié vers le bas en remontant */
export function wingBend(p: number): number {
  const { down, u } = flapPhase(p);
  return down ? 16 * Math.sin(Math.PI * u) : -30 * Math.sin(Math.PI * u);
}

/** position du corps (-0,5 = au plus bas quand les ailes sont en haut, 0,5 = au plus haut quand elles sont en bas) */
export function flapRise(p: number): number {
  const { down, u } = flapPhase(p);
  return (down ? 1 - Math.cos(Math.PI * u) : 1 + Math.cos(Math.PI * u)) / 2 - 0.5;
}

/** élévation des ailes repliées pour se poser (degrés : vers le bas, le long du corps) et pli de leur bout */
export const WING_FOLD = -30;
export const WING_FOLD_TIP = -100;

/**
 * Se poser (oiseau dont le dessin en vol est très différent du dessin posé) : ailes repliées le long du corps,
 * corps et tête droits, pattes tendues vers le sol. Il arrive ainsi au sol dans une pose proche de son dessin
 * posé, et le fondu entre les deux dessins est court et ne se voit pas.
 */
export function landPose(rig: RigDef): Record<string, BonePose> {
  const pose: Record<string, BonePose> = { body: { rot: 0 }, head: { rot: 0 }, tail: { rot: 0 }, feet: { rot: 0 }, feet2: { rot: 0 } };
  for (const [w, tip] of WINGS) {
    const rest = wingRest(rig, w, tip);
    if (!rest) continue;
    pose[w] = { rot: -rest.out * (WING_FOLD - rest.elev) };
    pose[tip] = { rot: -rest.out * WING_FOLD_TIP };
  }
  return pose;
}

/** Voler : battements d'ailes (oiseaux au squelette ailé), sinon corps qui se gonfle à chaque battement. */
export function flyPose(rig: RigDef, t: number): Record<string, BonePose> {
  const f = rig.facing;
  if (!has(rig, 'wing')) {
    const beat = Math.sin(t * 2 * Math.PI * 4.5);
    return {
      body: { rot: 9 * f, sx: 1 + 0.05 * beat, sy: 1 - 0.06 * beat, dy: -rig.height * 0.04 * (0.6 + 0.4 * beat) },
      head: { rot: -7 * f, dy: rig.height * 0.008 * beat },
      tail: { rot: 6 * Math.sin(t * 2 * Math.PI * 4.5 + 1) },
    };
  }
  const p = t * (rig.flapRate ?? 3);
  const rise = flapRise(p);
  const lift = -rig.height * 0.035 * rise;
  const pose: Record<string, BonePose> = {
    // penché vers l'avant, le corps monte à chaque abaissement des ailes et s'allonge un peu
    body: { rot: (9 + 2 * rise) * f, dy: lift, sy: 1 + 0.02 * rise, sx: 1 - 0.01 * rise },
    // la tête compense : elle reste droite et bouge beaucoup moins que le corps
    head: { rot: -(8 + 2 * rise) * f, dy: -lift * 0.6 },
    tail: { rot: 6 * Math.sin(2 * Math.PI * p + 1.2) * f },
  };
  for (const [w, tip] of WINGS) {
    const rest = wingRest(rig, w, tip);
    if (!rest) continue;
    pose[w] = { rot: -rest.out * (wingSpan(rest.elev, wingElevation(p)) - rest.elev) };
    pose[tip] = { rot: -rest.out * wingBend(p) };
  }
  // pattes repliées en arrière, sous le corps
  for (const id of ['feet', 'feet2']) pose[id] = { rot: 25 * f, dy: lift - rig.height * 0.02 };
  return pose;
}

// ---------------------------------------------------------------------------
// Saut du kangourou (2026-11-26, Westimmo : « faire sauter les kangourous pour donner un effet de déplacement
// un peu plus réel… il faut vraiment un rendu réel »). Un kangourou ne marche pas : il bondit, les deux pattes
// arrière ensemble. Chaque bond suit le vrai mouvement :
// - au sol (30 % du bond) : il amortit en se tassant, penché en avant, la queue qui s'abaisse ; puis il pousse ;
// - en l'air : le corps s'étire puis décrit un arc (parabole), les pieds partent en arrière puis reviennent
//   devant pour se poser, la queue se relève pour équilibrer, la tête reste presque droite (il regarde devant).
// L'élévation (`hopLift`) est faite à part du dessin : l'ombre reste au sol et pâlit quand il monte.

/** durée d'un bond par défaut (s) : un vrai kangourou bondit environ deux fois par seconde */
export const HOP_S = 0.56;
/** part du bond passée au sol */
export const HOP_CONTACT = 0.3;
/** hauteur du bond, en fraction de la hauteur du dessin (sous la marge haute du canevas, PAD_Y) */
export const HOP_LIFT = 0.12;

const smooth = (x: number) => x * x * (3 - 2 * x);

/** où en est le bond : au sol ou en l'air, et l'avancement `s` (0 → 1) dans cette partie */
export function hopPhase(phase: number): { air: boolean; s: number } {
  const p = phase - Math.floor(phase);
  return p < HOP_CONTACT ? { air: false, s: p / HOP_CONTACT } : { air: true, s: (p - HOP_CONTACT) / (1 - HOP_CONTACT) };
}

/** élévation du personnage (pixels de l'image) : nulle au sol, une parabole en l'air */
export function hopLift(rig: RigDef, phase: number): number {
  const { air, s } = hopPhase(phase);
  return air ? rig.height * HOP_LIFT * 4 * s * (1 - s) : 0;
}

/** os des pattes arrière (un kangourou de trois quarts en montre une ou deux) */
const FEET = ['feet', 'feet2'];

/** Pose d'un bond ; `phase` en bonds (1 = un bond complet), la partie entière est ignorée. */
export function hopPose(rig: RigDef, phase: number): Record<string, BonePose> {
  const f = rig.facing;
  const { air, s } = hopPhase(phase);
  // penché en avant : de plus en plus au sol (il pousse), il se redresse en l'air pour se poser
  const pitch = air ? 15 - 9 * smooth(s) : 6 + 9 * smooth(s);
  // tassé au milieu de l'appui, étiré juste après avoir quitté le sol
  const squash = air ? 0 : Math.sin(Math.PI * s);
  const stretch = air ? Math.sin(Math.PI * Math.min(1, s / 0.45)) : 0;
  const tail = (ph: number) => {
    const q = hopPhase(ph);
    return q.air ? 11 * Math.sin(Math.PI * q.s) : -7 * Math.sin(Math.PI * q.s);
  };
  // pieds : à plat au sol ; en l'air, en arrière (orteils vers le bas) puis devant pour se poser
  const foot: BonePose = air ? { rot: 13 * Math.sin(2 * Math.PI * s) * f, dy: -rig.height * 0.025 * Math.sin(Math.PI * s) } : {};
  const pose: Record<string, BonePose> = {
    body: { rot: pitch * f, sy: 1 - 0.07 * squash + 0.04 * stretch, sx: 1 + 0.03 * squash - 0.015 * stretch },
    head: { rot: -0.7 * pitch * f, dy: rig.height * 0.006 * squash },
    tail: { rot: tail(phase) * f },
    tailTip: { rot: tail(phase - 0.08) * 0.8 * f },
  };
  for (const id of FEET) pose[id] = foot;
  if (!rig.bones.some((b) => FEET.includes(b.id))) {
    // sans os de pattes (bébé assis) : seulement le corps qui se tasse et s'étire
    pose.body = { rot: pitch * 0.4 * f, sy: pose.body!.sy, sx: pose.body!.sx };
  }
  return pose;
}

function talk(rig: RigDef, t: number): Record<string, BonePose> {
  const base = idle(rig, t);
  return { ...base, head: { rot: 2.5 * Math.sin(t * 2 * Math.PI * 1.7), dy: -rig.height * 0.004 * Math.abs(Math.sin(t * 2 * Math.PI * 1.7)) } };
}

export function clipPose(rig: RigDef, clip: ClipName, t: number): Pose {
  const pose = clip === 'hop' ? hopPose(rig, t / HOP_S) : clip === 'fly' ? flyPose(rig, t) : clip === 'land' ? landPose(rig) : clip === 'walk' ? walkPose(rig, t) : clip === 'drink' ? drinkPose(rig, t) : clip === 'talk' ? talk(rig, t) : idle(rig, t);
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
