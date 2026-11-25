/**
 * Clé d'un enregistrement audio. Partagée par le jeu (lecture) et par le catalogue (génération),
 * pour qu'une phrase dite en jeu retrouve toujours son fichier.
 *
 * Les prénoms choisis en jeu (joueuse, bébés) ne peuvent pas être enregistrés à l'avance :
 * ils restent écrits dans la bulle, mais la voix dit une variante sans prénom, rédigée à la main.
 */
export type VoiceRole = 'father' | 'mother' | 'girl' | 'boy' | 'narrator';

/**
 * Choix du parent du 2026-11-18 (voix Kokoro). Les réponses à toucher utilisent le narrateur.
 * « +5 » : voix rajeunie de 5 demi-tons (hauteur et timbre), Kokoro n'ayant pas de voix d'enfant.
 * Bébés : Emma pour une fille, Kore pour un garçon (Lily, jugée trop âgée, a été écartée).
 */
export const VOICE_OF_ROLE: Readonly<Record<VoiceRole, string>> = {
  narrator: 'bf_isabella',
  father: 'bm_daniel',
  mother: 'af_bella',
  girl: 'bf_emma+5',
  boy: 'af_kore+5',
};

/** Voix d'un bébé selon son sexe. */
export function babyVoice(sex: 'girl' | 'boy'): VoiceRole {
  return sex;
}

export const NAME_TOKEN = '{name}';

/** Prénom par défaut de la joueuse tant que le parent n'en a pas saisi. */
export const DEFAULT_PLAYER_NAME = 'Explorer';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Remplace chaque prénom variable par {name} (mot entier, sensible à la casse). */
export function normalizeNames(text: string, names: readonly string[]): string {
  let out = text;
  const sorted = [...new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2))].sort((a, b) => b.length - a.length);
  for (const n of sorted) out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(n)}(?![\\p{L}\\p{N}])`, 'gu'), NAME_TOKEN);
  return out;
}

/** Découpe en phrases après . ! ? (les points de suspension ne coupent pas). */
export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
}

/**
 * Variantes parlées des phrases contenant un prénom (toutes rédigées à la main).
 * Chaîne vide = la phrase n'est pas dite (le texte reste affiché).
 */
const NAME_RULES: readonly [RegExp, string][] = [
  [/^(.+), \{name\}([!?.])$/, '$1$2'], // « Thank you, Mia! » → « Thank you! »
  [/^Hello \{name\}!$/, 'Hello!'],
  [/^I'm \{name\}!$/, ''], // le bébé dit son prénom : affiché seulement
  [/^(.*?)\s*I'm \{name\}\.$/, '$1'], // « Hello… I'm Max. » (parent renommé) → « Hello… »
  [/^I'm \{name\}, (.+)$/, "I'm $1"], // « I'm Max, the dad! » → « I'm the dad! »
  [/^\{name\}!$/, ''],
  [/^My name is \{name\}\.$/, 'My name is…'], // réponse de la joueuse : elle complète elle-même
  [/^My name is \{name\}!$/, 'Thank you for my name!'], // le bébé qui vient d'être nommé
  [/^\{name\} (.+)$/, 'Your baby $1'], // « Mia learned a new word! » → « Your baby learned… »
];

/** Texte réellement prononcé pour une phrase normalisée ; null si un prénom reste sans variante prévue. */
export function spokenForm(normalized: string): string | null {
  if (!normalized.includes(NAME_TOKEN)) return normalized;
  const out: string[] = [];
  for (const sentence of splitSentences(normalized)) {
    if (!sentence.includes(NAME_TOKEN)) {
      out.push(sentence);
      continue;
    }
    const rule = NAME_RULES.find(([re]) => re.test(sentence));
    if (!rule) return null;
    const spoken = sentence.replace(rule[0], rule[1]);
    if (spoken.includes(NAME_TOKEN)) return null;
    if (spoken) out.push(spoken);
  }
  return out.join(' ');
}

export function clipKey(voice: string, normalized: string): string {
  return `${voice}|${normalized}`;
}
