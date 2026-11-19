/**
 * Catalogue de TOUTES les phrases anglaises que le jeu peut prononcer, avec la voix qui les dit.
 * Sert à générer les enregistrements (npm run voices) et, dans les tests, à vérifier qu'aucune
 * phrase du jeu n'a été oubliée.
 *
 * V2 : les phrases des scènes viennent de `stepUtterances` (la même fonction que l'interface),
 * appliquée à toutes les variantes jouables (activités et aventures × espèces × familles × niveaux).
 */
import { ADVENTURES, TREASURES } from '../content/adventures';
import { ARCHETYPES } from '../content/archetypes';
import { chatScript, FAMILY_LINES, STAGE_NAMES } from '../content/dialogues';
import { itemLabel } from '../content/items';
import { NOUNS, PLACES } from '../content/places';
import { SPECIES } from '../content/species';
import { BIGGER_NOW, NAME_ERRORS, SEX_CHOICE, SPEED_SAMPLE, STAGE_OPENERS, say } from '../content/utterances';
import { CONTINENTS } from '../content/world';
import type { QuestScript } from '../content/types';
import { fill, stepUtterances, type Vars } from '../engine/dialogue';
import { activityVariants, adventureVariants, FAMILY_CONFIGS, voiceOfSpeaker, type FamilyConfig } from '../engine/variants';
import { scriptItems } from '../engine/skills';
import { clipKey, NAME_TOKEN, normalizeNames, spokenForm, VOICE_OF_ROLE, type VoiceRole } from './voiceKey';

export interface CatalogEntry {
  /** identifiant de voix Kokoro */
  voice: string;
  /** texte tel que le jeu le demande, prénoms variables remplacés par {name} */
  key: string;
  /** texte réellement prononcé (sans prénom variable) */
  spoken: string;
}

export interface Catalog {
  entries: CatalogEntry[];
  /** phrases contenant un prénom sans variante parlée prévue (doit rester vide) */
  unsupported: string[];
}

const anyName = { playerName: NAME_TOKEN, babyName: NAME_TOKEN, siblingName: NAME_TOKEN };

/** Variables d'une scène pour le catalogue : prénoms variables → {name}, noms d'adultes littéraux. */
export function catalogVars(script: QuestScript, config: FamilyConfig): Vars {
  const sp = SPECIES.find((s) => s.id === script.speciesId);
  const actorName = config.actorKind === 'baby' || !sp ? NAME_TOKEN : config.role === 'mother' ? sp.mother.name : sp.father.name;
  return { ...anyName, actorName, placeName: PLACES[script.biomeId]?.nameEn ?? '' };
}

export function buildVoiceCatalog(): Catalog {
  const map = new Map<string, CatalogEntry>();
  const unsupported = new Set<string>();
  const add = (role: VoiceRole, text: string) => {
    const normalized = normalizeNames(text, []);
    const voice = VOICE_OF_ROLE[role];
    const key = clipKey(voice, normalized);
    if (map.has(key)) return;
    const spoken = spokenForm(normalized);
    if (spoken === null) {
      unsupported.add(normalized);
      return;
    }
    if (spoken.trim()) map.set(key, { voice, key, spoken });
  };
  const items = new Set<string>();

  // --- Scènes : toutes les variantes jouables --------------------------------
  const addScript = (script: QuestScript, config: FamilyConfig) => {
    const vars = catalogVars(script, config);
    for (const s of script.steps) {
      for (const u of stepUtterances(s)) {
        const role = voiceOfSpeaker(u.who, config);
        if (!role) continue;
        const text = fill(u.line.en, vars);
        add(role, u.retry ? say.tryAgain(text) : text);
      }
    }
    for (const i of scriptItems(script)) items.add(i);
  };
  for (const v of adventureVariants(FAMILY_CONFIGS)) addScript(v.script, v.config);
  for (const v of activityVariants(FAMILY_CONFIGS)) addScript(v.script, v.config);
  for (const sp of SPECIES) {
    for (const config of FAMILY_CONFIGS) {
      const chat = chatScript(sp.id, sp.allowedBiomes[0]!, config.actorKind);
      addScript(chat, config);
      const name = config.actorKind === 'baby' ? NAME_TOKEN : config.role === 'mother' ? sp.mother.name : sp.father.name;
      add(config.role, say.actorCall(name));
    }
    for (const r of ['girl', 'boy'] as const) add(r, say.actorCall(sp.babyWord.en)); // bébé introuvable : repli sur « cub », « calf »…
    for (const r of ['girl', 'boy'] as const) for (const st of Object.keys(STAGE_OPENERS)) add(r, say.babyCall(NAME_TOKEN, st));
    add('narrator', say.speciesPick(sp));
  }

  // --- Scène de famille, bulles et annonces (toutes les voix) -------------
  for (const role of Object.keys(VOICE_OF_ROLE) as VoiceRole[]) {
    for (const l of Object.values(FAMILY_LINES)) add(role, fill(l.en, anyName));
  }

  // --- Interface (narrateur) ----------------------------------------------
  add('narrator', say.title(NAME_TOKEN));
  for (const p of Object.values(PLACES)) {
    add('narrator', say.biomeWelcome(p));
    add('narrator', say.placeName(p));
    for (const anchor of p.anchors) add('narrator', say.decorWord(NOUNS[anchor.word], anchor.word));
  }
  for (const c of CONTINENTS) {
    add('narrator', say.continent(c.nameEn));
    add('narrator', say.continentPrompt(c.nameEn));
  }
  for (const stageId of Object.keys(STAGE_NAMES)) add('narrator', say.growUp(NAME_TOKEN, stageId));
  for (const i of items) add('narrator', itemLabel(i).en);
  for (const a of ARCHETYPES) if (a.implemented) add('narrator', say.cardTitle(a.titleEn));
  for (const a of ADVENTURES) add('narrator', say.cardTitle(a.titleEn));
  for (const t of Object.values(TREASURES)) add('narrator', say.treasure(t.nameEn));
  add('narrator', 'Chat');
  for (const r of ['girl', 'boy'] as const) add(r, BIGGER_NOW.en);
  add(SPEED_SAMPLE.role, SPEED_SAMPLE.text); // bouton « Écouter » du réglage de vitesse
  for (const s of Object.values(SEX_CHOICE)) add('narrator', s);
  for (const e of Object.values(NAME_ERRORS)) add('narrator', e.en);

  return { entries: [...map.values()], unsupported: [...unsupported] };
}
