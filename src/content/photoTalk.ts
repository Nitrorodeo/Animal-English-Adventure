/**
 * L'album qui parle anglais (idées validées le 2026-11-25) :
 * - « Tell me about your photo » : la photo ouverte en grand est racontée (qui est là, où, quel temps) ;
 * - « Who is in the photo? » : le jeu demande où est Papa, Maman ou le bébé, et on le touche sur la photo ;
 * - « Cheese! » au déclic, et la fête d'anniversaire d'un bébé qui grandit.
 *
 * Tout est construit à partir de la photo elle-même, avec des phrases fixes : chacune est enregistrée
 * (src/audio/voiceCatalog.ts). Les bébés sont appelés « the baby » à voix haute, leur prénom ne pouvant pas
 * être enregistré à l'avance.
 */
import { giftDef } from '../engine/gifts';
import type { Photo } from '../engine/photoAlbum';
import { PLACES } from './places';
import { WEATHER_WORDS } from './props';
import { say } from './utterances';
import type { Line } from './types';

const L = (en: string, fr: string): Line => ({ en, fr });

/** Qui est sur la photo : Papa, Maman, et 0, 1 ou 2 bébés. */
export function whoLine(father: boolean, mother: boolean, babies: number): Line | null {
  const kids = babies >= 2 ? L('the two babies', 'les deux bébés') : babies === 1 ? L('the baby', 'le bébé') : null;
  const names = [father && L('Daddy', 'papa'), mother && L('Mummy', 'maman'), kids].filter((x): x is Line => !!x);
  if (!names.length) return null;
  const join = (parts: string[], and: string) => (parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} ${and} ${parts[parts.length - 1]}`);
  const plural = names.length > 1 || babies >= 2;
  const en = `${plural ? 'Here are' : 'Here is'} ${join(names.map((n) => n.en), 'and')}!`;
  const fr = `Voici ${join(names.map((n) => n.fr), 'et')} !`;
  return L(en, fr);
}

/** Toutes les phrases « qui est là » possibles (catalogue des voix). */
export function allWhoLines(): Line[] {
  const out: Line[] = [];
  for (const f of [false, true]) for (const m of [false, true]) for (const b of [0, 1, 2]) {
    const l = whoLine(f, m, b);
    if (l) out.push(l);
  }
  return out;
}

export const NIGHT_TIME = L("It's night time!", 'C’est la nuit !');
export const HAPPY_BIRTHDAY = L('Happy birthday!', 'Joyeux anniversaire !');

/** Le récit d'une photo, phrase par phrase (dit par le narrateur). */
export function photoStory(photo: Photo): Line[] {
  const out: Line[] = [];
  if (photo.birthday) out.push(HAPPY_BIRTHDAY);
  const babies = photo.a.filter((a) => a.who === 'baby').length;
  const who = whoLine(photo.a.some((a) => a.who === 'father'), photo.a.some((a) => a.who === 'mother'), babies);
  if (who) out.push(who);
  const place = PLACES[photo.p];
  if (place) out.push(L(say.placeName(place), place.nameFr));
  if (photo.night) out.push(NIGHT_TIME);
  else {
    const w = WEATHER_WORDS[photo.weather ?? place?.weather ?? 'sunny'];
    out.push(L(w.en, w.fr));
  }
  for (const g of photo.g.slice(0, 2)) {
    const def = giftDef(g.id);
    if (def) out.push(L(say.gift(def.en), def.fr));
  }
  return out;
}

// --- « Who is in the photo? » ------------------------------------------------------------------------------------

export interface QuizTarget {
  /** « father », « mother », « b1 », « b2 » */
  key: string;
  ask: Line;
  yes: Line;
}

const Q = {
  father: { ask: L('Where is Daddy?', 'Où est papa ?'), yes: L('Yes! Here is Daddy!', 'Oui ! Voilà papa !') },
  mother: { ask: L('Where is Mummy?', 'Où est maman ?'), yes: L('Yes! Here is Mummy!', 'Oui ! Voilà maman !') },
  baby: { ask: L('Where is the baby?', 'Où est le bébé ?'), yes: L('Yes! Here is the baby!', 'Oui ! Voilà le bébé !') },
  girl: { ask: L('Where is the baby girl?', 'Où est la petite fille ?'), yes: L('Yes! Here is the baby girl!', 'Oui ! Voilà la petite fille !') },
  boy: { ask: L('Where is the baby boy?', 'Où est le petit garçon ?'), yes: L('Yes! Here is the baby boy!', 'Oui ! Voilà le petit garçon !') },
} as const;

/** toutes les phrases du jeu « Who is in the photo? » (catalogue des voix) */
export const QUIZ_LINES: readonly Line[] = Object.values(Q).flatMap((q) => [q.ask, q.yes]);
export const QUIZ_START = L('Who is in the photo?', 'Qui est sur la photo ?');

/** clé d'un animal de la photo */
export const actorKey = (a: Photo['a'][number]): string => (a.who === 'baby' ? `b${a.birthOrder ?? 1}` : a.who);

/**
 * Qui peut-on chercher sur cette photo : Papa, Maman, et les bébés. Deux bébés se distinguent par « baby girl » et
 * « baby boy » ; s'ils ne se distinguent pas (même sexe, âge inconnu), on ne les demande pas.
 */
export function quizTargets(photo: Photo): QuizTarget[] {
  const out: QuizTarget[] = [];
  const babies = photo.a.filter((a) => a.who === 'baby');
  for (const a of photo.a) {
    if (a.who === 'father' || a.who === 'mother') out.push({ key: a.who, ...Q[a.who] });
    else if (babies.length === 1) out.push({ key: actorKey(a), ...Q.baby });
    else if (a.sex && babies.filter((b) => b.sex === a.sex).length === 1) out.push({ key: actorKey(a), ...Q[a.sex] });
  }
  return out;
}

/** Question n° `round` sur cette photo : on fait le tour de la famille, dans un ordre propre à chaque photo. */
export function quizQuestion(photo: Photo, round: number): QuizTarget | undefined {
  const all = quizTargets(photo);
  if (!all.length) return undefined;
  return all[(round + (photo.t % all.length)) % all.length];
}
