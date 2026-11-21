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
import { BEDTIME, BIGGER_NOW, CUDDLES, NAME_ERRORS, NAME_SCREEN, SEX_CHOICE, SPEED_SAMPLE, STAGE_OPENERS, STICKER_OFFER, say } from '../content/utterances';
import { STICKERS } from '../engine/stickers';
import { CONTINENTS } from '../content/world';
import { DOLPHINS, dolphinOrder, SEA_FRIENDS, SEA_THINGS, TURTLE, WHALE, whaleCount, whaleYes, type DolphinId, type DolphinMove } from '../content/sea';
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
  /** le {name} de la clé est le prénom de la joueuse : la phrase peut être dite avec son prénom (tools/tts/name_voices.py) */
  player?: true;
}

export interface Catalog {
  entries: CatalogEntry[];
  /** phrases contenant un prénom sans variante parlée prévue (doit rester vide) */
  unsupported: string[];
}

/**
 * Marque provisoire du prénom de la joueuse : elle devient {name} dans la clé, mais la phrase est
 * notée « player » pour être aussi enregistrée avec son prénom (bébés exclus).
 */
export const PLAYER_TOKEN = '{player}';

const anyName = { playerName: PLAYER_TOKEN, babyName: NAME_TOKEN, siblingName: NAME_TOKEN };

/** Variables d'une scène pour le catalogue : prénoms variables → {name}, noms d'adultes littéraux. */
export function catalogVars(script: QuestScript, config: FamilyConfig): Vars {
  const sp = SPECIES.find((s) => s.id === script.speciesId);
  const actorName = config.actorKind === 'baby' || !sp ? NAME_TOKEN : config.role === 'mother' ? sp.mother.name : sp.father.name;
  return { ...anyName, actorName, placeName: PLACES[script.biomeId]?.nameEn ?? '' };
}

export function buildVoiceCatalog(): Catalog {
  const map = new Map<string, CatalogEntry>();
  const unsupported = new Set<string>();
  const playerKeys = new Set<string>();
  const add = (role: VoiceRole, raw: string) => {
    const text = raw.split(PLAYER_TOKEN).join(NAME_TOKEN);
    const normalized = normalizeNames(text, []);
    const voice = VOICE_OF_ROLE[role];
    const key = clipKey(voice, normalized);
    if (raw.includes(PLAYER_TOKEN)) playerKeys.add(key);
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
  add('narrator', say.title(PLAYER_TOKEN));
  // écran du prénom, arrivée dans un lieu, bravo de fin d'aventure (src/ui/NameSetup.tsx, Habitat.tsx)
  for (const l of Object.values(NAME_SCREEN)) add('narrator', l.en);
  add('mother', say.hello(PLAYER_TOKEN));
  for (const r of ['father', 'mother', 'girl', 'boy'] as const) add(r, say.bravo(PLAYER_TOKEN));
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

  // --- Album souvenir, autocollant du jour, bonne nuit --------------------
  add('narrator', say.albumBorn(NAME_TOKEN));
  add('narrator', STICKER_OFFER.en);
  for (const st of STICKERS) add('narrator', say.sticker(st.en));
  add('mother', fill(BEDTIME.mother.en, anyName));
  for (const r of ['girl', 'boy'] as const) add(r, BEDTIME.baby.en);
  add('father', BEDTIME.father.en);
  add('father', BEDTIME.wake.en);
  for (const r of ['girl', 'boy'] as const) for (const l of CUDDLES.baby) add(r, l.en);
  for (const r of ['father', 'mother'] as const) for (const l of CUDDLES.parent) add(r, l.en);

  // jeux bonus de la mer (src/engine/sea.ts) : chaque animal parle avec sa voix
  for (const f of SEA_FRIENDS) add(f.voice, f.hello.en);
  for (const l of Object.values(WHALE)) add('father', l.en);
  for (let n = 1; n <= 5; n++) add('father', whaleYes(n).en), add('father', whaleCount(n).en);
  for (const l of Object.values(TURTLE)) add('mother', l.en);
  for (const t of SEA_THINGS) for (const l of [t.find, t.yes, t.oops]) add('mother', l.en);
  add('girl', DOLPHINS.intro.en);
  add('girl', DOLPHINS.end.en);
  for (const d of ['big', 'little'] as DolphinId[]) {
    add('narrator', DOLPHINS.hint[d].en);
    add(DOLPHINS.voice[d], DOLPHINS.notMe[d].en);
    for (const m of ['jump', 'swim', 'splash'] as DolphinMove[]) add('narrator', dolphinOrder(d, m).en), add(DOLPHINS.voice[d], DOLPHINS.reply[m].en);
  }

  const entries = [...map.values()].map((e) => (playerKeys.has(e.key) && e.key.split(NAME_TOKEN).length === 2 ? { ...e, player: true as const } : e));
  return { entries, unsupported: [...unsupported] };
}
