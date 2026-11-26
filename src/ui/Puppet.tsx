import { useEffect, useMemo, useRef } from 'react';
import type { Frame } from '../game/rigs';
import { HOP_LIFT, HOP_S, PAD_X, PAD_Y, blendPose, clipPose, meshFor, drinkPose, easeInOut, hopLift, skin, skinPoint, type ClipName, type Pose, type RigDef } from '../game/puppet';

/**
 * Affiche un personnage animé : son dessin est posé sur le maillage déformable (`game/puppet.ts`)
 * et redessiné à chaque image en WebGL. `onReady(false)` si le navigateur n'a pas WebGL :
 * l'appelant garde alors l'image fixe.
 */
interface Props {
  rig: RigDef;
  src: string;
  clip: ClipName;
  /** sens où le personnage regarde à l'écran (1 = droite) */
  facing: 1 | -1;
  onReady: (ok: boolean) => void;
  /** atelier de réglage : temps figé (secondes) au lieu de l'horloge */
  frozenAt?: number;
  /** caché sous un calque plein écran : on arrête de redessiner */
  paused?: boolean;
  /** nuit : dessin assombri (fait ici plutôt que par un filtre CSS, recalculé à chaque image) */
  dim?: boolean;
  /** soulevé au doigt : ombre plus loin et plus marquée */
  lifted?: boolean;
  /** kangourou : durée d'un bond (s), choisie pour qu'il se pose pile à l'arrivée */
  hopS?: number;
  /** kangourou : change à chaque nouveau trajet (les bonds repartent du sol, en même temps que le déplacement) */
  hopKey?: string | number;
  /** dessin en vol d'un oiseau : sa place dans le cadre du dessin posé (sinon il occupe tout le cadre) */
  frame?: Frame;
  /** effacé par un fondu (oiseau : le dessin posé pendant le vol, le dessin en vol une fois posé) */
  off?: boolean;
  /** oiseau à deux dessins : `under` = le dessin posé (dessous), `over` = le dessin en vol, qui se fond par-dessus */
  layer?: 'under' | 'over' | 'under quick' | 'over quick';
}

const BLEND_S = 0.35;
/** au repos (respiration lente), 30 images par seconde suffisent */
const IDLE_FRAME_MS = 32;
/** densité de pixels plafonnée : net sur tablette, 44 % de pixels en moins qu'à 2 */
const MAX_DPR = 1.5;
/** ombre portée dessinée sous le personnage (même rendu que l'ancien `filter: drop-shadow`, sans son coût) */
const SHADOW = { dy: 0.035, alpha: 0.33, liftDy: 0.08, liftAlpha: 0.4 };

const VS = `
attribute vec2 aPos; attribute vec2 aUv; uniform vec2 uSize; uniform vec2 uShift; varying vec2 vUv;
void main() {
  vec2 full = uSize * (1.0 + 2.0 * vec2(${PAD_X.toFixed(3)}, ${PAD_Y.toFixed(3)}));
  vec2 p = (aPos + uShift + uSize * vec2(${PAD_X.toFixed(3)}, ${PAD_Y.toFixed(3)})) / full;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  vUv = aUv;
}`;
const FS = `
precision mediump float; uniform sampler2D uTex; uniform float uShadow; uniform float uBright; uniform float uSat; varying vec2 vUv;
void main() {
  if (uShadow > 0.0) {
    // silhouette floue : niveau de détail plus grossier de la texture (mipmaps en WebGL 2)
    gl_FragColor = vec4(0.0, 0.0, 0.0, texture2D(uTex, vUv, 3.0).a * uShadow);
    return;
  }
  vec4 c = texture2D(uTex, vUv);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  c.rgb = mix(vec3(l), c.rgb, uSat) * uBright;
  gl_FragColor = c;
}`;

export function Puppet({ rig, src, clip, facing, onReady, frozenAt, paused = false, dim = false, lifted = false, hopS = HOP_S, hopKey, frame, off = false, layer }: Props) {
  const frozen = useRef(frozenAt);
  frozen.current = frozenAt;
  const look = useRef({ paused, dim, lifted });
  look.current = { paused, dim, lifted };
  /** relance la boucle d'animation (après une pause ou un changement d'aspect) */
  const wake = useRef<() => void>(() => {});
  const ctx = useRef<WebGLRenderingContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // bonds : `phase` compte les bonds faits (avance au rythme `hopS`), `lift` = élévation affichée
  const anim = useRef<{ clip: ClipName; since: number; from: Pose | null; last: Pose; phase: number; at: number; lift: number; liftFrom: number }>({ clip, since: performance.now(), from: null, last: {}, phase: 0, at: performance.now(), lift: 0, liftFrom: 0 });
  const hopRate = useRef(hopS);
  hopRate.current = hopS;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  // changement d'animation (ou nouveau trajet en bondissant) : fondu depuis la pose affichée
  const lastHopKey = useRef(hopKey);
  useEffect(() => {
    const a = anim.current;
    const newTrip = clip === 'hop' && a.clip === 'hop' && lastHopKey.current !== hopKey;
    lastHopKey.current = hopKey;
    if (a.clip === clip && !newTrip) return;
    a.from = a.last;
    a.liftFrom = a.lift;
    a.clip = clip;
    a.phase = 0;
    a.since = performance.now();
    wake.current();
  }, [clip, hopKey]);
  useEffect(() => wake.current(), [paused, dim, lifted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // pas d'anticrénelage : les bords viennent de la transparence du dessin, pas des triangles
    const opts = { premultipliedAlpha: true, alpha: true, antialias: false };
    const gl2 = canvas.getContext('webgl2', opts);
    const gl = (gl2 ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null;
    if (!gl) {
      readyRef.current(false);
      return;
    }
    let raf = 0;
    let disposed = false;
    let tex: WebGLTexture | null = null;
    ctx.current = gl;
    const mesh = meshFor(rig);
    const deformed = new Float32Array(mesh.rest.length);

    const shader = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[puppet] shaders', gl.getProgramInfoLog(prog));
      readyRef.current(false);
      return;
    }
    gl.useProgram(prog);
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.rest, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uv, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(prog, 'aUv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    const idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.uniform2f(gl.getUniformLocation(prog, 'uSize'), rig.width, rig.height);
    const uShift = gl.getUniformLocation(prog, 'uShift');
    const uShadow = gl.getUniformLocation(prog, 'uShadow');
    const uBright = gl.getUniformLocation(prog, 'uBright');
    const uSat = gl.getUniformLocation(prog, 'uSat');
    // taille affichée suivie par un observateur : pas de lecture de mise en page à chaque image
    const size = { w: canvas.clientWidth, h: canvas.clientHeight };
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(([e]) => {
      if (!e) return;
      size.w = e.contentRect.width;
      size.h = e.contentRect.height;
      wake.current();
    });
    ro?.observe(canvas);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const img = new Image();
    img.src = src;
    img.decode().then(() => {
      if (disposed) return;
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (gl2) {
        gl.generateMipmap(gl.TEXTURE_2D); // WebGL 2 : réduction nette du grand dessin
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      let first = true;
      let lastDraw = -Infinity;
      const frame = (now: number) => {
        raf = 0;
        if (disposed) return;
        const a = anim.current;
        const lk = look.current;
        if (lk.paused && !first) return; // relancée par wake() à la fin de la pause
        if (frozen.current === undefined && a.clip === 'idle' && !a.from && now - lastDraw < IDLE_FRAME_MS) {
          raf = requestAnimationFrame(frame);
          return;
        }
        lastDraw = now;
        if (!ro) {
          size.w = canvas.clientWidth;
          size.h = canvas.clientHeight;
        }
        const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.round(size.w * dpr)), h = Math.max(1, Math.round(size.h * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        const t = frozen.current ?? (now - a.since) / 1000;
        let clipT = Math.max(0, t);
        if (a.clip === 'hop') {
          // les bonds avancent à leur rythme (qui dépend de la longueur du trajet), pas à l'horloge
          a.phase = frozen.current !== undefined ? frozen.current / HOP_S : a.phase + Math.min(0.1, Math.max(0, now - a.at) / 1000) / hopRate.current;
          clipT = a.phase * HOP_S;
        }
        a.at = now;
        let pose = clipPose(rig, a.clip, clipT);
        let lift = a.clip === 'hop' ? hopLift(rig, a.phase) : 0;
        if (a.from && t < BLEND_S) {
          const k = easeInOut(Math.max(0, t) / BLEND_S);
          pose = blendPose(a.from, pose, k);
          lift = a.liftFrom + (lift - a.liftFrom) * k;
        } else a.from = null;
        a.last = pose;
        a.lift = lift;
        skin(rig, mesh, pose, deformed);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, deformed);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // 1) l'ombre, décalée vers le bas ; 2) le dessin par-dessus
        gl.uniform2f(uShift, 0, rig.height * (lk.lifted ? SHADOW.liftDy : SHADOW.dy));
        // en plein bond, l'ombre reste au sol et pâlit
        gl.uniform1f(uShadow, (lk.lifted ? SHADOW.liftAlpha : SHADOW.alpha) * (1 - 0.5 * Math.min(1, lift / (rig.height * HOP_LIFT))));
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.uniform2f(uShift, 0, -lift);
        gl.uniform1f(uShadow, 0);
        gl.uniform1f(uBright, lk.dim ? 0.75 : lk.lifted ? 1.04 : 1);
        gl.uniform1f(uSat, lk.dim ? 0.85 : 1);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        if (first) {
          first = false;
          readyRef.current(true);
        }
        raf = requestAnimationFrame(frame);
      };
      wake.current = () => {
        if (!disposed && !raf) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }).catch((e: unknown) => {
      console.warn('[puppet] image', e);
      readyRef.current(false);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      wake.current = () => {};
      ro?.disconnect();
      // on libère les ressources mais pas le contexte : React (mode strict) peut remonter le même canevas
      gl.deleteTexture(tex);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(idx);
      gl.deleteProgram(prog);
    };
  }, [rig, src]);
  // démonté pour de bon : on rend le contexte WebGL au navigateur (sinon ils s'accumulent jusqu'au
  // ramasse-miettes : « Too many active WebGL contexts » sur tablette). Pas en développement :
  // le mode strict de React remonte le même canevas.
  useEffect(() => () => {
    if (!import.meta.env.DEV) ctx.current?.getExtension('WEBGL_lose_context')?.loseContext();
  }, []);

  // bouche une fois la tête baissée : là où naissent les ronds dans l'eau
  const mouth = useMemo(() => skinPoint(rig, drinkPose(rig, 2), rig.mouth), [rig]);
  const flip = facing !== rig.facing;
  // le cadre du dessin en vol se retourne avec lui : sa place est symétrique dans le cadre du dessin posé
  const box = frame && { left: `${(flip ? 1 - frame.x - frame.w : frame.x) * 100}%`, top: `${frame.y * 100}%`, width: `${frame.w * 100}%`, height: `${frame.h * 100}%`, right: 'auto', bottom: 'auto' };
  return (
    <span className={`puppet${layer ? ` ${layer}` : ''}${off ? ' off' : ''}`} style={{ ...box, transform: flip ? 'scaleX(-1)' : undefined }}>
      <canvas
        ref={canvasRef}
        style={{ left: `${-PAD_X * 100}%`, top: `${-PAD_Y * 100}%`, width: `${(1 + 2 * PAD_X) * 100}%`, height: `${(1 + 2 * PAD_Y) * 100}%` }}
      />
      {clip === 'drink' && (
        <span className="ripples" style={{ left: `${(mouth[0] / rig.width) * 100}%`, top: `${(mouth[1] / rig.height) * 100 + 3}%` }}>
          <i />
          <i />
          <i />
        </span>
      )}
    </span>
  );
}
