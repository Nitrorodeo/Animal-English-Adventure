import type { ActorKind, ActorRole, GrowthStage, ParentRole, QuestArchetype } from './types';
import { GROWTH_STAGES } from './types';
import { SPECIES_ARCHETYPES } from './activities/species/archetypes';

type A = Omit<QuestArchetype, 'allowedBiomes' | 'implemented' | 'actorKinds'> & Partial<Pick<QuestArchetype, 'allowedBiomes' | 'implemented' | 'actorKinds'>>;
const a = (x: A): QuestArchetype => ({ allowedBiomes: [], implemented: false, actorKinds: ['adult', 'baby'], ...x });
const ALL: ActorRole[] = ['father', 'mother', 'baby'];

/** 21 archétypes (data/quest_archetypes.json). `implemented` = contenu jouable dans ce prototype. */
export const ARCHETYPES: readonly QuestArchetype[] = [
  a({ id: 'greeting', titleEn: 'Say hello', titleFr: 'Dire bonjour', icon: '👋', skillIds: ['1.1', '2.1'], mechanic: 'talk', requiredAnchors: [], implemented: true }),
  a({ roles: ALL, minStage: 'little', id: 'find_water', titleEn: 'Find water', titleFr: "Trouver de l'eau", icon: '💧', skillIds: ['1.7', '2.3', '3.2'], mechanic: 'guide', requiredAnchors: ['waterhole'], implemented: true }),
  a({ roles: ['baby'], id: 'name_object', titleEn: 'Teach me a word', titleFr: 'Apprends-moi un mot', icon: '🔎', skillIds: ['env', '2.6'], mechanic: 'teach', requiredAnchors: [], actorKinds: ['baby'], minAnchorCount: 3, implemented: true }),
  a({ roles: ['mother', 'baby'], id: 'find_object', titleEn: 'Where is it?', titleFr: 'Où est-ce ?', icon: '🔍', skillIds: ['2.3', 'env'], mechanic: 'locate', requiredAnchors: [], implemented: true }),
  a({ id: 'find_food', titleEn: 'Find food', titleFr: 'Trouver à manger', icon: '🍃', skillIds: ['1.6', '2.4'], mechanic: 'fetch', requiredAnchors: [], implemented: true }),
  a({ roles: ['mother', 'baby'], minStage: 'little', id: 'count_objects', titleEn: 'Let’s count', titleFr: 'Compter', icon: '🔢', skillIds: ['1.3'], mechanic: 'count', requiredAnchors: [], implemented: true }),
  a({ roles: ['mother', 'baby'], minStage: 'little', id: 'identify_colors', titleEn: 'Find the colour', titleFr: 'Trouver la couleur', icon: '🎨', skillIds: ['1.2'], mechanic: 'identify', requiredAnchors: [], implemented: true }),
  a({ id: 'follow_tracks', titleEn: 'Follow the footprints', titleFr: 'Suivre les empreintes', icon: '🐾', skillIds: ['2.3', '2.6', '3.2'], mechanic: 'guide', requiredAnchors: [], roles: ['father'], allowedBiomes: ['africa_plains', 'africa_acacia_plain', 'africa_green_meadow', 'na_prairie', 'na_bison_prairie', 'europe_forest', 'an_snowfield', 'na_redwoods', 'na_redwood_trail'], implemented: true }),
  a({ roles: ['father', 'baby'], minStage: 'little', id: 'hide_and_seek', titleEn: 'Hide and seek', titleFr: 'Cache-cache', icon: '🙈', skillIds: ['2.3', '2.6'], mechanic: 'locate', requiredAnchors: [], implemented: true }),
  a({ id: 'find_family', titleEn: 'Find my family', titleFr: 'Retrouver sa famille', icon: '👪', skillIds: ['1.1', '2.1', '2.6'], mechanic: 'social', requiredAnchors: [] }),
  a({ roles: ['mother', 'baby'], id: 'family_presentation', titleEn: 'Meet my family', titleFr: 'Présenter la famille', icon: '🏡', skillIds: ['1.1', '2.1'], mechanic: 'talk', requiredAnchors: [], implemented: true }),
  a({ id: 'build_shelter', titleEn: 'Build a shelter', titleFr: 'Construire un abri', icon: '🛖', skillIds: ['2.5', '3.2'], mechanic: 'build', requiredAnchors: [] }),
  a({ id: 'prepare_food', titleEn: 'Make a meal', titleFr: 'Préparer un repas', icon: '🥗', skillIds: ['1.6', '2.4'], mechanic: 'sort', requiredAnchors: [] }),
  a({ roles: ['mother'], id: 'weather_check', titleEn: 'What’s the weather?', titleFr: 'Quel temps fait-il ?', icon: '🌤️', skillIds: ['1.7', '2.7'], mechanic: 'identify', requiredAnchors: [], implemented: true }),
  a({ roles: ['father', 'baby'], minStage: 'young', id: 'animal_abilities', titleEn: 'What can you do?', titleFr: 'Que sais-tu faire ?', icon: '🤸', skillIds: ['1.5', '2.2'], mechanic: 'compare', requiredAnchors: [], implemented: true }),
  a({ roles: ['father'], id: 'describe_actions', titleEn: 'What is happening?', titleFr: 'Que se passe-t-il ?', icon: '👀', skillIds: ['3.1'], mechanic: 'observe', requiredAnchors: [], implemented: true }),
  a({ roles: ['father'], id: 'compare_objects', titleEn: 'Big or small?', titleFr: 'Comparer', icon: '⚖️', skillIds: ['1.4', '3.4'], mechanic: 'compare', requiredAnchors: [], implemented: true }),
  a({ roles: ['mother', 'baby'], minStage: 'companion', id: 'remember_yesterday', titleEn: 'Remember our adventure', titleFr: 'Se souvenir', icon: '💭', skillIds: ['3.5'], mechanic: 'tell', requiredAnchors: [], implemented: true }),
  a({ id: 'plan_expedition', titleEn: 'Plan a trip', titleFr: 'Préparer une expédition', icon: '🗺️', skillIds: ['3.6'], mechanic: 'plan', requiredAnchors: [] }),
  a({ roles: ['baby'], minStage: 'young', id: 'help_sibling', titleEn: 'Help my brother or sister', titleFr: 'Aider un frère ou une sœur', icon: '🤝', skillIds: ['2.1', '2.6'], mechanic: 'social', requiredAnchors: [], actorKinds: ['baby'], minBabies: 2, implemented: true }),
  // --- Jeux pour rire, partout (2026-11-20) ---
  a({ roles: ALL, id: 'family_orders', titleEn: 'Simon says!', titleFr: 'Jacques a dit !', icon: '👂', skillIds: ['1.5', '2.1'], mechanic: 'plan', requiredAnchors: [], implemented: true }),
  a({ roles: ALL, id: 'yes_or_no', titleEn: 'Yes or no?', titleFr: 'Oui ou non ?', icon: '🤪', skillIds: ['2.2', '1.6'], mechanic: 'talk', requiredAnchors: [], implemented: true }),
  // --- Pilote Afrique : jeux propres aux décors et aux personnages (2026-11-19) ---
  a({ id: 'who_in_water', titleEn: 'Who lives in the water?', titleFr: "Qui vit dans l'eau ?", icon: '🦆', skillIds: ['env', '2.3'], mechanic: 'identify', requiredAnchors: [], allowedBiomes: ['africa_waterhole', 'africa_pond', 'europe_lake', 'sa_waterfall', 'sa_wetland', 'sa_river', 'oc_fern_forest', 'oc_gorge', 'na_lake', 'asia_garden', 'asia_bamboo'], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'windy_baobab', titleEn: 'Catch the leaves!', titleFr: 'Attrape les feuilles !', icon: '🍃', skillIds: ['2.3', '1.3'], mechanic: 'identify', requiredAnchors: ['baobab'], allowedBiomes: ['africa_baobab'], roles: ['father', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'baobab_nest', titleEn: "The bird's nest", titleFr: "Le nid de l'oiseau", icon: '🪺', skillIds: ['1.3', 'env'], mechanic: 'count', requiredAnchors: ['baobab'], allowedBiomes: ['africa_baobab'], roles: ['mother'], implemented: true }),
  a({ id: 'sun_and_shade', titleEn: 'Too hot!', titleFr: 'Trop chaud !', icon: '🥵', skillIds: ['1.7', '2.7'], mechanic: 'sort', requiredAnchors: [], allowedBiomes: ['africa_desert', 'africa_acacia_plain', 'oc_outback', 'oc_gorge', 'oc_gum_woodland'], roles: ['mother'], implemented: true }),
  a({ id: 'echo_canyon', titleEn: 'The echo', titleFr: "L'écho", icon: '🗣️', skillIds: ['1.1', '1.4'], mechanic: 'puzzle', requiredAnchors: [], allowedBiomes: ['africa_canyon', 'oc_gorge', 'asia_mountain', 'asia_snow_den', 'europe_alps', 'an_ice_cave', 'na_bear_den', 'na_bison_alpine', 'na_bison_canyon', 'sa_andes'], roles: ['father', 'baby'], minStage: 'young', implemented: true }),
  a({ id: 'climb_rock', titleEn: 'Up and down', titleFr: 'En haut, en bas', icon: '🧗', skillIds: ['2.3', '1.4'], mechanic: 'build', requiredAnchors: [], allowedBiomes: ['africa_canyon', 'africa_desert', 'africa_forest', 'asia_mountain', 'asia_arch', 'asia_snow_den', 'oc_gorge', 'oc_outback', 'oc_eucalyptus', 'oc_rocky_cove', 'oc_gum_woodland', 'na_redwoods', 'na_redwood_trail', 'na_beaver_pond', 'na_lake'], roles: ['father', 'baby'], minStage: 'young', implemented: true }),
  a({ id: 'race', titleEn: "Let's race!", titleFr: 'La course', icon: '🏁', skillIds: ['1.5', '3.4'], mechanic: 'compare', requiredAnchors: [], allowedBiomes: ['africa_plains', 'africa_acacia_plain', 'africa_green_meadow', 'africa_canyon', 'na_prairie', 'na_desert', 'na_bison_canyon', 'oc_outback', 'oc_eucalyptus', 'asia_mountain', 'asia_arch', 'europe_forest', 'sa_jungle', 'na_redwood_trail', 'oc_gum_woodland'], roles: ['father', 'baby'], minStage: 'young', implemented: true }),
  a({ id: 'simon_says', titleEn: 'You are the boss!', titleFr: 'Tu es le chef !', icon: '🫡', skillIds: ['1.5', '2.2'], mechanic: 'plan', requiredAnchors: [], roles: ['father'], implemented: true }),
  a({ id: 'bedtime', titleEn: 'Good night!', titleFr: 'Bonne nuit !', icon: '🌙', skillIds: ['1.3', '2.7'], mechanic: 'observe', requiredAnchors: [], roles: ['mother'], implemented: true }),
  a({ id: 'feelings', titleEn: 'How do I feel?', titleFr: 'Comment je me sens ?', icon: '😊', skillIds: ['2.1', '2.6'], mechanic: 'social', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'photo', titleEn: 'Take a photo', titleFr: 'Prendre une photo', icon: '📷', skillIds: ['env', '2.3'], mechanic: 'plan', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  // --- Jeux signatures des autres continents (2026-11-21) ---
  a({ id: 'lanterns', titleEn: 'The lanterns', titleFr: 'Les lanternes', icon: '🏮', skillIds: ['1.3', '2.3'], mechanic: 'count', requiredAnchors: ['lantern'], allowedBiomes: ['asia_garden', 'asia_pagoda'], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'pick_apples', titleEn: 'Pick the apples', titleFr: 'Ramasser les pommes', icon: '🍎', skillIds: ['1.3', '1.2'], mechanic: 'count', requiredAnchors: ['appletree'], allowedBiomes: ['europe_farm'], roles: ['father', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'maple_leaves', titleEn: 'Autumn leaves', titleFr: "Les feuilles d'automne", icon: '🍁', skillIds: ['1.3', '1.2', '2.7'], mechanic: 'count', requiredAnchors: [], allowedBiomes: ['na_lake', 'na_beaver_pond', 'na_beaver_falls'], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'butterflies', titleEn: 'The butterflies', titleFr: 'Les papillons', icon: '🦋', skillIds: ['1.2', '1.3'], mechanic: 'identify', requiredAnchors: [], allowedBiomes: ['sa_jungle', 'africa_forest', 'sa_waterfall', 'sa_canopy_branch', 'sa_canopy_treehouse', 'sa_canopy_sunrise', 'sa_sloth_canopy', 'sa_sloth_roots', 'sa_sloth_refuge'], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'beach_shells', titleEn: 'Shells on the beach', titleFr: 'Les coquillages', icon: '🐚', skillIds: ['1.3', '1.2'], mechanic: 'count', requiredAnchors: [], allowedBiomes: ['oc_beach', 'oc_rocky_cove', 'europe_coast', 'na_coast'], roles: ['mother', 'baby'], minStage: 'little', implemented: true }),
  a({ id: 'snowflakes', titleEn: 'Catch the snowflakes!', titleFr: 'Attrape les flocons !', icon: '❄️', skillIds: ['1.3', '1.7', '2.7'], mechanic: 'sort', requiredAnchors: [], allowedBiomes: ['an_snowfield', 'ice_coast', 'an_aurora', 'open_sea', 'na_bear_den'], roles: ['father', 'baby'], minStage: 'little', implemented: true }),
  // la tanière enneigée, propre à la panthère des neiges (2026-11-21)
  a({ id: 'sunrise_den', titleEn: 'Good morning, sun!', titleFr: 'Bonjour, soleil !', icon: '🌄', skillIds: ['3.3', '1.3', '2.3'], mechanic: 'observe', requiredAnchors: ['cave'], allowedBiomes: ['asia_snow_den'], speciesIds: ['snow_leopard'], roles: ['father', 'mother', 'baby'], minStage: 'little', implemented: true }),
  // --- Révisions du graphe pédagogique (2026-11-21), partout : un peu de tout ce qu'on a appris ---
  a({ id: 'quiz_beginner', titleEn: 'Quiz time!', titleFr: 'Le grand quiz', icon: '🏆', skillIds: ['1.8'], mechanic: 'puzzle', requiredAnchors: [], roles: ['mother', 'baby'], minStage: 'young', implemented: true }),
  a({ id: 'quiz_intermediate', titleEn: 'Super quiz!', titleFr: 'Le super quiz', icon: '🏅', skillIds: ['2.8'], mechanic: 'puzzle', requiredAnchors: [], roles: ['father', 'baby'], minStage: 'companion', implemented: true }),
  a({ id: 'solve_mystery', titleEn: 'Who is it?', titleFr: "L'énigme : qui est-ce ?", icon: '🕵️', skillIds: ['2.8', '3.7', '3.8'], mechanic: 'puzzle', requiredAnchors: [], roles: ['father', 'baby'], minStage: 'young', implemented: true }),
  // jeux propres à chaque espèce (src/content/activities/species/)
  ...SPECIES_ARCHETYPES,
];

/**
 * Ce jeu peut-il être proposé par ce personnage ? (rôle : papa, maman ou bébé ; stade du bébé).
 * Papa propose les jeux d'action et d'exploration, Maman les jeux de soin et d'observation, les
 * bébés des jeux qui s'ouvrent à mesure qu'ils grandissent.
 */
export function archetypeFits(arch: QuestArchetype, kind: ActorKind, role?: ParentRole, stage?: GrowthStage): boolean {
  if (!arch.actorKinds.includes(kind)) return false;
  const who: ActorRole = kind === 'baby' ? 'baby' : (role ?? 'father');
  if (arch.roles && !arch.roles.includes(who)) return false;
  if (kind === 'baby' && arch.minStage && stage !== undefined && GROWTH_STAGES.indexOf(stage) < GROWTH_STAGES.indexOf(arch.minStage)) return false;
  return true;
}

/** Jeux qu'un bébé débloque en atteignant ce stade (pour la carte « Je suis plus grand ! »). */
export const unlockedAt = (stage: GrowthStage): QuestArchetype[] =>
  ARCHETYPES.filter((x) => x.implemented && x.minStage === stage && x.actorKinds.includes('baby') && (!x.roles || x.roles.includes('baby')));

/** Nom d'une sorte de jeu (goûts des bébés, passeport). */
export const MECHANIC_LABELS: Readonly<Record<string, { icon: string; en: string; fr: string }>> = {
  talk: { icon: '💬', en: 'talking', fr: 'discuter' },
  guide: { icon: '🧭', en: 'exploring', fr: 'explorer' },
  fetch: { icon: '🍃', en: 'finding food', fr: 'chercher à manger' },
  teach: { icon: '📚', en: 'new words', fr: 'apprendre des mots' },
  count: { icon: '🔢', en: 'counting', fr: 'compter' },
  identify: { icon: '🎨', en: 'finding things', fr: 'reconnaître' },
  locate: { icon: '🙈', en: 'hide and seek', fr: 'chercher, cacher' },
  social: { icon: '🤗', en: 'feelings', fr: 'les émotions' },
  build: { icon: '🧗', en: 'climbing', fr: 'grimper' },
  sort: { icon: '🥵', en: 'hot and cold', fr: 'chaud et froid' },
  compare: { icon: '🏁', en: 'racing', fr: 'les courses' },
  observe: { icon: '🌙', en: 'looking', fr: 'observer' },
  tell: { icon: '💭', en: 'stories', fr: 'les souvenirs' },
  plan: { icon: '📷', en: 'playing games', fr: 'les jeux' },
  puzzle: { icon: '🗣️', en: 'riddles', fr: 'les énigmes' },
};

export function getArchetype(id: string): QuestArchetype {
  const x = ARCHETYPES.find((q) => q.id === id);
  if (!x) throw new Error(`Archétype inconnu : ${id}`);
  return x;
}
