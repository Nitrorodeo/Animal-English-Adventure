import { useEffect, useRef, useState } from 'react';
import { speech } from '../audio/speech';
import { MIC } from '../content/utterances';

/** durée de l'enregistrement : le temps de dire une courte phrase */
export const MIC_RECORD_MS = 3000;

/** L'appareil sait-il enregistrer le micro ? (sinon, l'option est grisée chez les parents et le bouton n'apparaît pas) */
export function micAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

/**
 * « Répète après moi » 🎤 (option des parents, 2026-11-25) : « Your turn! Say it! », trois secondes de micro, puis
 * « Listen! It's you! » et sa propre voix, puis la phrase du jeu à nouveau pour comparer.
 * Rien n'est analysé, envoyé ni gardé : l'enregistrement vit dans la mémoire du navigateur le temps de la réécoute,
 * puis il est effacé. Pas de note, pas de « faux » : c'est un miroir, pas une évaluation.
 * Le jeu le recrée à chaque nouvelle réplique (`key`) : si l'enfant passe à la question suivante pendant
 * l'enregistrement, la suite s'arrête au lieu de couvrir la nouvelle question (audit du 2026-11-25).
 */
export function RepeatMic({ onReplay }: { onReplay: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'rec' | 'play' | 'error'>('idle');
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  if (!micAvailable()) return null;

  const run = async () => {
    if (phase !== 'idle') return;
    let stream: MediaStream | null = null;
    let url: string | null = null;
    try {
      speech.stop();
      await speech.speak(MIC.turn.en);
      if (!alive.current) return;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) return;
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
      setPhase('rec');
      rec.start();
      await new Promise((r) => window.setTimeout(r, MIC_RECORD_MS));
      rec.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
      if (!alive.current) return;
      setPhase('play');
      url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
      await speech.speak(MIC.listen.en);
      if (!alive.current) return;
      const audio = new Audio(url);
      await new Promise<void>((r) => {
        audio.onended = () => r();
        audio.onerror = () => r();
        void audio.play().catch(() => r());
      });
      if (alive.current) onReplay();
      if (alive.current) setPhase('idle');
    } catch {
      // micro refusé ou absent : le bouton le montre un instant, le jeu continue sans
      if (alive.current) {
        setPhase('error');
        window.setTimeout(() => alive.current && setPhase('idle'), 2000);
      }
    } finally {
      stream?.getTracks().forEach((t) => t.stop());
      if (url) URL.revokeObjectURL(url);
    }
  };

  return (
    <button className={`round mic-btn${phase !== 'idle' ? ` ${phase}` : ''}`} onClick={() => void run()} aria-label="Repeat after me" disabled={phase === 'rec' || phase === 'play'}>
      {phase === 'error' ? '🚫' : phase === 'play' ? '👂' : '🎤'}
    </button>
  );
}
