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

/**
 * Correction de débit de chaque voix, pour que toutes parlent au débit du narrateur au même réglage
 * (2026-11-25 : « certaines voix sont trop accélérées… toutes les voix du jeu se règlent sur le même
 * réglage »). À paramètre de vitesse égal, Kokoro fait parler ses voix américaines bien plus vite.
 * Débit médian mesuré sur 600 phrases par voix (tools/tts/mesurer_debit.py), en syllabes par seconde :
 * narrateur 2,83 · maman 3,41 · bébé garçon 3,41 · bébé fille 2,59 · papa 2,40.
 * Valeur = débit du narrateur ÷ débit de la voix (appliquée à la lecture, hauteur conservée).
 */
export const VOICE_PACE: Readonly<Record<string, number>> = {
  bf_isabella: 1,
  af_bella: 0.83,
  'af_kore+5': 0.83,
  'bf_emma+5': 1.09,
  bm_daniel: 1.18,
};

/** Correction de débit d'un rôle (1 si la voix n'a pas été mesurée). */
export function paceOf(role: VoiceRole | undefined): number {
  return VOICE_PACE[VOICE_OF_ROLE[role ?? 'narrator']] ?? 1;
}

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
