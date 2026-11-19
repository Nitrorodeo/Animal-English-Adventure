import { NUMBERS } from '../content/props';
import type { BiomeDef, Line, QuestScript, QuestStep, Speaker, TemplateVar } from '../content/types';

export const ALLOWED_VARS: readonly TemplateVar[] = ['actorName', 'playerName', 'babyName', 'siblingName', 'word', 'placeName'];
const VAR_RE = /\{(\w+)\}/g;

export type Vars = Partial<Record<TemplateVar, string>>;

/** Substitution limitée aux variables autorisées ; une variable inconnue reste visible (détectée par les tests). */
export function fill(text: string, vars: Vars): string {
  return text.replace(VAR_RE, (m, name: string) => {
    if (!(ALLOWED_VARS as readonly string[]).includes(name)) return m;
    const v = vars[name as TemplateVar];
    return v ?? m;
  });
}

export function fillLine(line: Line, vars: Vars): Line {
  return { en: fill(line.en, vars), fr: fill(line.fr, vars) };
}

/** Une phrase dite pendant une étape, par qui. Les cartes-réponses sont lues par le narrateur. */
export interface Utterance {
  who: Speaker;
  line: Line;
  /** préfixée de « Try again! » quand elle est dite */
  retry?: boolean;
}

export const WELL_DONE: Line = { en: 'Well done!', fr: 'Bravo !' };

/** Nombres dits pendant un comptage (« One! », « Two! »…). */
export const COUNT_WORDS: readonly Line[] = NUMBERS.slice(1).map((n) => ({ en: `${n.en}!`, fr: `${n.fr} !` }));

/**
 * Toutes les phrases qu'une étape peut faire dire, avec la voix qui les dit. Source unique
 * pour l'interface (lecture) et le catalogue des voix (enregistrement).
 */
export function stepUtterances(s: QuestStep): Utterance[] {
  switch (s.kind) {
    case 'say':
    case 'celebrate':
    case 'travel':
    case 'reward':
      return [{ who: s.speaker, line: s.line }];
    case 'act':
      return [{ who: s.speaker ?? s.who, line: s.line }];
    case 'ask':
      return [
        { who: s.speaker, line: s.line },
        { who: s.speaker, line: s.hint, retry: true },
        { who: s.speaker, line: s.onCorrect ?? WELL_DONE },
        // jeu d'écoute : les cartes ne sont pas lues
        ...(s.listen ? [] : s.options.map((o): Utterance => ({ who: 'narrator', line: o.line }))),
      ];
    case 'command':
      return [
        { who: s.speaker, line: s.line },
        { who: s.speaker, line: s.onCorrect ?? WELL_DONE },
        ...s.options.flatMap((o): Utterance[] => [
          { who: 'narrator', line: o.line },
          { who: o.who ?? 'actor', line: o.reply },
        ]),
      ];
    case 'tapAnchor':
      return [
        { who: s.speaker, line: s.line },
        { who: s.speaker, line: s.hint, retry: true },
        { who: s.speaker, line: s.onCorrect ?? WELL_DONE },
      ];
    case 'tapProps':
      return [
        { who: s.speaker, line: s.line },
        { who: s.speaker, line: s.hint, retry: true },
        { who: s.speaker, line: s.onCorrect ?? WELL_DONE },
        ...Object.values(s.wrong ?? {}).map((l): Utterance => ({ who: s.speaker, line: l })),
        ...(s.count ? COUNT_WORDS.slice(0, s.targets.length).map((l): Utterance => ({ who: s.speaker, line: l })) : []),
      ];
    case 'seek':
      return [
        { who: s.speaker, line: s.line },
        { who: s.speaker, line: s.hint, retry: true },
        { who: s.speaker, line: s.notHere },
        { who: s.hider, line: s.found },
      ];
    default:
      return [];
  }
}

export function linesOf(script: QuestScript): Line[] {
  return script.steps.flatMap((s) => stepUtterances(s).map((u) => u.line));
}

/**
 * Validation d'un script avant de le jouer (MOTEUR_DE_MISSIONS §3 et §11) :
 * texte EN + FR présents, variables autorisées, points du décor existants,
 * au moins une bonne réponse tactile par question (aucun micro nécessaire).
 */
export function validateScript(script: QuestScript, biome: BiomeDef): string[] {
  const errors: string[] = [];
  const anchors = new Set(biome.anchors.map((a) => a.id));
  for (const line of linesOf(script)) {
    if (!line.en.trim() || !line.fr.trim()) errors.push(`${script.id}: phrase sans texte EN ou FR`);
    for (const t of [line.en, line.fr]) {
      for (const m of t.matchAll(VAR_RE)) {
        if (!(ALLOWED_VARS as readonly string[]).includes(m[1]!)) errors.push(`${script.id}: variable interdite {${m[1]}}`);
      }
    }
  }
  if (script.steps.length === 0) errors.push(`${script.id}: aucune étape`);
  const last = script.steps[script.steps.length - 1];
  if (last && last.kind !== 'celebrate') errors.push(`${script.id}: doit se terminer par une célébration`);
  for (const s of script.steps) {
    if (s.kind === 'ask') {
      if (!s.options.some((o) => o.correct)) errors.push(`${script.id}: question sans bonne réponse`);
      if (s.options.length < 2) errors.push(`${script.id}: question avec moins de 2 réponses`);
      if (s.pointAt && !anchors.has(s.pointAt)) errors.push(`${script.id}: point montré absent (${s.pointAt})`);
      for (const o of s.options) if (o.anchorCrop && !anchors.has(o.anchorCrop)) errors.push(`${script.id}: carte absente (${o.anchorCrop})`);
    }
    if ((s.kind === 'tapAnchor' || s.kind === 'moveTo') && !anchors.has(s.anchor)) errors.push(`${script.id}: point du décor absent (${s.anchor})`);
  }
  return errors;
}
