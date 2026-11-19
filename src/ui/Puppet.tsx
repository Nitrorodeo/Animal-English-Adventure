import { useEffect, useMemo, useRef } from 'react';
import { PAD_X, PAD_Y, blendPose, buildMesh, clipPose, drinkPose, easeInOut, skin, skinPoint, type ClipName, type Pose, type RigDef } from '../game/puppet';

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
}

const BLEND_S = 0.35;

const VS = `
attribute vec2 aPos; attribute vec2 aUv; uniform vec2 uSize; varying vec2 vUv;
void main() {
  vec2 full = uSize * (1.0 + 2.0 * vec2(${PAD_X.toFixed(3)}, ${PAD_Y.toFixed(3)}));
  vec2 p = (aPos + uSize * vec2(${PAD_X.toFixed(3)}, ${PAD_Y.toFixed(3)})) / full;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  vUv = aUv;
}`;
const FS = `
precision mediump float; uniform sampler2D uTex; varying vec2 vUv;
void main() { gl_FragColor = texture2D(uTex, vUv); }`;

export function Puppet({ rig, src, clip, facing, onReady, frozenAt }: Props) {
  const frozen = useRef(frozenAt);
  frozen.current = frozenAt;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anim = useRef<{ clip: ClipName; since: number; from: Pose | null; last: Pose }>({ clip, since: performance.now(), from: null, last: {} });
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  // changement d'animation : fondu depuis la pose affichée
  useEffect(() => {
    const a = anim.current;
    if (a.clip === clip) return;
    a.from = a.last;
    a.clip = clip;
    a.since = performance.now();
  }, [clip]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl2 = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: true });
    const gl = (gl2 ?? canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })) as WebGLRenderingContext | null;
    if (!gl) {
      readyRef.current(false);
      return;
    }
    let raf = 0;
    let disposed = false;
    let tex: WebGLTexture | null = null;
    const mesh = buildMesh(rig);
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
      const frame = (now: number) => {
        if (disposed) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        const a = anim.current;
        const t = frozen.current ?? (now - a.since) / 1000;
        let pose = clipPose(rig, a.clip, Math.max(0, t));
        if (a.from && t < BLEND_S) pose = blendPose(a.from, pose, easeInOut(Math.max(0, t) / BLEND_S));
        else a.from = null;
        a.last = pose;
        skin(rig, mesh, pose, deformed);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, deformed);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        if (first) {
          first = false;
          readyRef.current(true);
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }).catch((e: unknown) => {
      console.warn('[puppet] image', e);
      readyRef.current(false);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      // on libère les ressources mais pas le contexte : React (mode strict) peut remonter le même canevas
      gl.deleteTexture(tex);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(idx);
      gl.deleteProgram(prog);
    };
  }, [rig, src]);

  // bouche une fois la tête baissée : là où naissent les ronds dans l'eau
  const mouth = useMemo(() => skinPoint(rig, drinkPose(rig, 2), rig.mouth), [rig]);
  const flip = facing !== rig.facing;
  return (
    <span className="puppet" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
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
