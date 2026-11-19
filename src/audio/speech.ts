/**
 * Service audio, hors ligne et sans micro.
 *
 * 1. L'anglais est dit par des enregistrements Kokoro pré-générés (npm run voices), une voix par rôle
 *    (choix du parent du 2026-11-18, voir voiceKey.ts).
 * 2. Si une phrase n'a pas d'enregistrement (texte modifié sans relancer npm run voices), repli sur la
 *    synthèse vocale de l'appareil, sans déformation de hauteur. Le français reste sur la synthèse.
 * 3. Sans aucun son, le jeu reste jouable avec les sous-titres et les images.
 */
import manifest from '../content/voiceManifest.json';
import { clipKey, DEFAULT_PLAYER_NAME, normalizeNames, VOICE_OF_ROLE, type VoiceRole } from './voiceKey';

export type { VoiceRole };

export interface SpeakOptions {
  lang?: 'en' | 'fr';
  role?: VoiceRole;
  slow?: boolean;
  /** prénoms variables pas encore enregistrés dans la partie (bébé qu'on vient de nommer) */
  names?: readonly string[];
}

export interface AudioService {
  readonly available: boolean;
  speak(text: string, opts?: SpeakOptions): Promise<void>;
  stop(): void;
  setMuted(m: boolean): void;
  /**
   * Vitesse réglée par les parents, en part de la vitesse NATURELLE (1 = naturelle), sans changer
   * la hauteur. S'applique aussi à la phrase en train d'être dite.
   */
  setSpeed(speed: number): void;
  /** prénoms variables (joueuse, bébés) à reconnaître dans les phrases */
  setNames(names: readonly string[]): void;
}

const CLIPS: Readonly<Record<string, string>> = manifest.clips;

/**
 * Débit auquel les enregistrements ont été générés, en part du débit naturel de Kokoro.
 * DOIT rester égal à SPEED dans tools/tts/generate_voices.py (vérifié par voice.test.ts).
 */
export const RECORDED_SPEED = 0.8;

/** Vitesse de lecture d'un enregistrement pour obtenir la vitesse voulue (1 = naturelle). */
export function clipPlaybackRate(speed: number, slow: boolean): number {
  return (speed / RECORDED_SPEED) * (slow ? 0.75 : 1);
}

/** Chemin de l'enregistrement d'une phrase anglaise, ou undefined s'il n'existe pas. */
export function clipFor(text: string, role: VoiceRole | undefined, names: readonly string[], clips: Readonly<Record<string, string>> = CLIPS): string | undefined {
  const normalized = normalizeNames(text.trim(), [DEFAULT_PLAYER_NAME, ...names]);
  return clips[clipKey(VOICE_OF_ROLE[role ?? 'narrator'], normalized)];
}

function pickVoice(synth: SpeechSynthesis, lang: 'en' | 'fr'): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices();
  const prefs = lang === 'en' ? ['en-GB', 'en-US', 'en'] : ['fr-FR', 'fr'];
  for (const p of prefs) {
    const local = voices.find((v) => v.lang.replace('_', '-').startsWith(p) && v.localService);
    if (local) return local;
    const any = voices.find((v) => v.lang.replace('_', '-').startsWith(p));
    if (any) return any;
  }
  return undefined;
}

export function createSpeech(): AudioService {
  const hasWindow = typeof window !== 'undefined';
  const synth = hasWindow && 'speechSynthesis' in window ? window.speechSynthesis : undefined;
  const audio = hasWindow && typeof Audio !== 'undefined' ? new Audio() : undefined;
  let muted = false;
  let speed = RECORDED_SPEED;
  /** la phrase en cours est-elle en voix lente (🐢) ? */
  let currentSlow = false;
  let names: readonly string[] = [];
  /** termine la lecture en cours (enregistrement ou synthèse) */
  let finishCurrent: (() => void) | undefined;
  if (synth) synth.getVoices(); // déclenche le chargement des voix

  const stopAll = () => {
    synth?.cancel();
    audio?.pause();
    const f = finishCurrent;
    finishCurrent = undefined;
    f?.();
  };

  const synthesize = (text: string, lang: 'en' | 'fr', slow: boolean) => {
    if (!synth) return Promise.resolve();
    const u = new SpeechSynthesisUtterance(text.replace(/[…]/g, ', '));
    u.lang = lang === 'en' ? 'en-GB' : 'fr-FR';
    const v = pickVoice(synth, lang);
    if (v) u.voice = v;
    u.rate = speed * (slow ? 0.75 : 1); // 1 = débit naturel de la synthèse
    return new Promise<void>((resolve) => {
      finishCurrent = resolve;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      setTimeout(resolve, 1500 + text.length * 120); // garde-fou si onend ne vient jamais
      synth.speak(u);
    });
  };

  /** vitesse de lecture de l'enregistrement, hauteur conservée */
  const applyRate = () => {
    if (!audio) return;
    const r = clipPlaybackRate(speed, currentSlow);
    audio.preservesPitch = true;
    audio.defaultPlaybackRate = r;
    if (audio.playbackRate !== r) audio.playbackRate = r;
  };

  const playClip = (src: string, slow: boolean) =>
    new Promise<boolean>((resolve) => {
      if (!audio) return resolve(false);
      // Chaque lecture ne retire QUE ses propres écouteurs : une lecture interrompue qui échoue
      // en retard ne doit pas couper la suivante.
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('loadedmetadata', applyRate);
        audio.removeEventListener('playing', applyRate);
        if (finishCurrent === finish) finishCurrent = undefined;
        resolve(ok);
      };
      const onEnded = () => done(true);
      const onError = () => done(false);
      const finish = () => done(true);
      finishCurrent = finish;
      currentSlow = slow;
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      // Certains navigateurs remettent la vitesse à zéro au chargement : on la réapplique.
      audio.addEventListener('loadedmetadata', applyRate);
      audio.addEventListener('playing', applyRate);
      audio.src = `${import.meta.env.BASE_URL}${src}`;
      applyRate();
      audio.play().catch(() => done(false));
    });

  return {
    available: !!audio || !!synth,
    async speak(text, opts = {}) {
      stopAll();
      if (muted || !text.trim()) return;
      const lang = opts.lang ?? 'en';
      const slow = !!opts.slow;
      if (lang === 'en') {
        const src = clipFor(text, opts.role, opts.names ? [...names, ...opts.names] : names);
        if (src && (await playClip(src, slow))) return;
        if (!src && import.meta.env.DEV) console.warn(`[voix] pas d'enregistrement (${opts.role ?? 'narrator'}) : « ${text} » — lancer npm run voices`);
      }
      await synthesize(text, lang, slow);
    },
    stop: stopAll,
    setMuted(m) {
      muted = m;
      if (m) stopAll();
    },
    setSpeed(s) {
      const next = s > 0 && Number.isFinite(s) ? s : RECORDED_SPEED;
      if (next === speed) return;
      speed = next;
      applyRate(); // la phrase en cours change de vitesse tout de suite
    },
    setNames(n) {
      names = n;
    },
  };
}

export const speech = createSpeech();
