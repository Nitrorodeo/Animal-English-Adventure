/**
 * Table des enregistrements (1,5 Mo, ≈ 20 000 phrases). Chargée à part par speech.ts (`import()`), pour que
 * l'écran titre s'affiche sans attendre ce fichier (audit du 2026-11-25 : programme de 2,7 Mo d'un seul bloc).
 */
import manifest from '../content/voiceManifest.json';
import { clipKey, DEFAULT_PLAYER_NAME, normalizeNames, VOICE_OF_ROLE, type VoiceRole } from './voiceKey';

const CLIPS: Readonly<Record<string, string>> = manifest.clips;

/** Chemin de l'enregistrement d'une phrase anglaise, ou undefined s'il n'existe pas. */
export function clipFor(text: string, role: VoiceRole | undefined, names: readonly string[], clips: Readonly<Record<string, string>> = CLIPS): string | undefined {
  const normalized = normalizeNames(text.trim(), [DEFAULT_PLAYER_NAME, ...names]);
  return clips[clipKey(VOICE_OF_ROLE[role ?? 'narrator'], normalized)];
}
