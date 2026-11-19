/**
 * Rituel « Bonne nuit » : qui parle, dans quel ordre, avec quelle voix. Maman d'abord, puis chaque
 * bébé (l'aîné d'abord), puis papa ; ensuite toute la famille dort jusqu'à « Good morning! ».
 */
import type { VoiceRole } from '../audio/voiceKey';
import { babyVoice } from '../audio/voiceKey';
import { BEDTIME } from '../content/utterances';
import { fillLine } from './dialogue';
import type { FamilyState } from './state';

export interface BedtimeLine {
  /** 'father' | 'mother' ou l'identifiant du bébé */
  who: string;
  role: VoiceRole;
  en: string;
  fr: string;
}

export function bedtimeLines(family: FamilyState, playerName: string): BedtimeLine[] {
  const babies = [...family.babies].sort((a, b) => a.birthOrder - b.birthOrder);
  return [
    { who: 'mother', role: 'mother', ...fillLine(BEDTIME.mother, { playerName }) },
    ...babies.map((b): BedtimeLine => ({ who: b.id, role: babyVoice(b.sex), ...BEDTIME.baby })),
    { who: 'father', role: 'father', ...BEDTIME.father },
  ];
}
