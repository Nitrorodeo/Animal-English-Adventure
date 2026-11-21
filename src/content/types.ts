// Types partagés des contenus. Les contenus (content/) ne dépendent jamais du moteur (engine/) ni de l'UI.

export type ContinentId =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'north_america'
  | 'south_america'
  | 'oceania'
  | 'antarctica';

/** Identifiant d'un lieu (un décor). Les lieux sont décrits dans content/places/*.json. */
export type PlaceId = string;
/** Ancien nom des lieux (V1), gardé pour la compatibilité. */
export type BiomeId = PlaceId;

/** Météo montrée par l'image du lieu. */
export type Weather = 'sunny' | 'hot' | 'cloudy' | 'rainy' | 'windy' | 'snowy' | 'misty' | 'cold';
export const WEATHERS: readonly Weather[] = ['sunny', 'hot', 'cloudy', 'rainy', 'windy', 'snowy', 'misty', 'cold'];

/** Ce qu'on peut faire avec un objet du décor. */
export type AnchorTag = 'water' | 'sea' | 'hide' | 'climb' | 'path' | 'sky' | 'plant';

export type Tier = 'beginner' | 'intermediate' | 'expert';
export const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'expert'];

export type Sex = 'boy' | 'girl';
export type ParentRole = 'father' | 'mother';
export type GrowthStage = 'newborn' | 'little' | 'young' | 'companion';
export const GROWTH_STAGES: readonly GrowthStage[] = ['newborn', 'little', 'young', 'companion'];

/** Phrase validée : texte anglais + traduction française de contrôle. */
export interface Line {
  en: string;
  fr: string;
}

/** Variables autorisées dans les phrases (liste fermée, cf. MOTEUR_DE_MISSIONS §3). */
export type TemplateVar = 'actorName' | 'playerName' | 'babyName' | 'siblingName' | 'word' | 'placeName';

export interface Rect {
  /** pourcentages de la scène (0–100) */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Point interactif d'un décor (arbre, point d'eau…). */
export interface Anchor {
  id: string;
  /** mot anglais enseigné quand on touche/nomme ce point */
  word: string;
  wordFr: string;
  /** zone cliquable dans le décor */
  hit: Rect;
  /** zone recadrée pour la carte-image (même repère) ; défaut : hit */
  crop?: Rect;
  /** pictogramme de secours si aucune image */
  icon: string;
  /** endroit où un personnage se place pour interagir */
  stand?: { x: number; y: number };
  tags?: AnchorTag[];
  /** question oui/non vraie ou fausse de façon évidente dans l'image */
  check?: { q: Line; yes: boolean };
}

/** Emplacement (en % du décor) où le jeu pose un petit objet. */
export interface Spot {
  x: number;
  y: number;
}

export interface BiomeDef {
  id: BiomeId;
  continentId: ContinentId;
  nameEn: string;
  nameFr: string;
  /** clé de assetManifest.backgrounds ; absent = décor provisoire */
  background?: string;
  /** dégradé CSS du décor provisoire */
  placeholderGradient: string;
  anchors: Anchor[];
  weather: Weather;
  /** hauteur (%) du sol sous les pieds de la famille, à droite du décor */
  groundY: number;
  /** ligne d'horizon mesurée sur le dessin (%) : perspective des animaux posés au doigt (voir places/depth.ts) */
  horizonY?: number;
  /** sol le plus au fond où l'on peut poser un animal (%) */
  farY?: number | [number, number][];
  /** dessus de gros rochers du décor où l'on peut poser un animal ; `base` = pied du rocher */
  perches?: (Rect & { base: number })[];
  /** 8 emplacements pour les petits objets des jeux */
  spots: Spot[];
}

/** Un lieu = un décor ; même structure que les biomes de la V1. */
export type PlaceDef = BiomeDef;

export interface ContinentDef {
  id: ContinentId;
  nameEn: string;
  nameFr: string;
  /** zone cliquable sur la mappemonde (% de l'image), ellipse */
  mapHit: Rect;
  /** position de l'étiquette */
  label: { x: number; y: number };
  biomes: BiomeId[];
}

export type DietTag =
  | 'carnivore'
  | 'herbivore'
  | 'omnivore'
  | 'bamboo'
  | 'insectivore'
  | 'frugivore'
  | 'eucalyptus'
  | 'aquatic_invertebrates'
  | 'fish'
  | 'fish_marine';

export type Ability = 'run' | 'jump' | 'climb' | 'swim' | 'fly' | 'dig' | 'roar' | 'hop';
export const ABILITIES: readonly Ability[] = ['run', 'jump', 'climb', 'swim', 'fly', 'dig', 'roar', 'hop'];

export type Mobility = 'walk' | 'climb' | 'fly' | 'swim' | 'jump' | 'walk_swim';

export interface SpeciesDef {
  id: string;
  nameEn: string;
  nameFr: string;
  continentId: ContinentId;
  allowedBiomes: BiomeId[];
  diet: DietTag;
  mobility: Mobility;
  /** pictogramme provisoire */
  icon: string;
  /** espèce jouable dans le prototype */
  playable: boolean;
  /** famille complète (parents + bébés) disponible */
  familyReady: boolean;
  father: { name: string; personality: string };
  mother: { name: string; personality: string };
  /** mots du bébé : "cub", "calf"… */
  babyWord: { en: string; fr: string };
  /** nourriture habituelle (clés de PROPS, kind 'food') : jamais d'aliment incohérent */
  foods: string[];
  /** ce que l'animal sait faire (jeu « What can you do? ») */
  can: Ability[];
  /** aliments que l'animal ne mange pas (mauvaises réponses du jeu de nourriture) */
  notFoods: string[];
  /** ce que l'animal ne sait clairement pas faire */
  cannot: Ability[];
  /** façon de boire (pour find_water) */
  drinkStyle?: 'lap' | 'trunk' | 'splay' | 'sip' | 'none';
}

export interface SkillDef {
  id: string;
  band: 1 | 2 | 3;
  titleEn: string;
  titleFr: string;
  softPrerequisites: string[];
  /** expressions/mots ciblés (ids d'items) */
  items: string[];
}

export type Mechanic =
  | 'talk'
  | 'guide'
  | 'fetch'
  | 'teach'
  | 'count'
  | 'identify'
  | 'locate'
  | 'social'
  | 'build'
  | 'sort'
  | 'compare'
  | 'observe'
  | 'tell'
  | 'plan'
  | 'puzzle';

export type ActorKind = 'adult' | 'baby';
/** Qui peut proposer un jeu : le papa, la maman ou un bébé. */
export type ActorRole = ParentRole | 'baby';

export interface QuestArchetype {
  id: string;
  titleEn: string;
  titleFr: string;
  icon: string;
  skillIds: string[];
  mechanic: Mechanic;
  requiredAnchors: string[];
  /** biomes autorisés ; vide = tous */
  allowedBiomes: BiomeId[];
  actorKinds: ActorKind[];
  /** au moins un bébé requis dans la famille (ex. aider un frère/une sœur : 2) */
  minBabies?: number;
  /** nombre minimum de points interactifs dans le décor (ex. enseigner un mot : 3) */
  minAnchorCount?: number;
  /** l'archétype a du contenu jouable dans ce prototype */
  implemented: boolean;
  /** qui propose ce jeu (défaut : tous ceux de actorKinds). Papa guide, Maman prend soin, les bébés jouent. */
  roles?: ActorRole[];
  /** stade de croissance minimal d'un bébé pour proposer ce jeu (les parents ne sont pas concernés) */
  minStage?: GrowthStage;
}

// ---------- Scripts de quête (interprétés par le QuestRunner) ----------

export type Speaker = 'actor' | 'father' | 'mother' | 'baby' | 'sibling' | 'narrator';
export type Emotion = 'happy' | 'curious' | 'thirsty' | 'proud' | 'love' | 'calm';

export interface ResponseOption {
  line: Line;
  icon?: string;
  /** carte-image : recadrage du point interactif correspondant dans le décor */
  anchorCrop?: string;
  correct: boolean;
}

/** Animation jouée par un personnage. */
export type ActAction = 'jump' | 'run' | 'climb' | 'swim' | 'fly' | 'dig' | 'hop' | 'eat' | 'sleep' | 'dance' | 'wave' | 'roar' | 'splash';
export const ACT_ACTIONS: readonly ActAction[] = ['jump', 'run', 'climb', 'swim', 'fly', 'dig', 'hop', 'eat', 'sleep', 'dance', 'wave', 'roar', 'splash'];

export type MoveAction = 'drink_lap' | 'drink_trunk' | 'drink_splay' | 'drink_sip' | 'rest' | 'sniff' | 'walk' | 'eat' | 'hide';

export type ColorId = 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'pink' | 'purple' | 'white';

/** Petit objet posé dans le décor pendant un jeu (sur un des 8 emplacements du lieu). */
export interface PropPlacement {
  /** identifiant unique dans le script (cible des tapProps) */
  id: string;
  /** clé de PROPS */
  prop: string;
  /** indice dans place.spots */
  spot: number;
  color?: ColorId;
  size?: 'big' | 'small';
  /** posé dans le ciel (étoiles, lune) : `spot` est alors un indice de SKY_SPOTS */
  sky?: boolean;
}

/** Conditions d'apparition d'une étape (filtrées à l'assemblage du script). */
export interface StepGate {
  /** l'étape n'est jouée qu'à partir de ce niveau */
  minTier?: Tier;
  /** l'étape n'est jouée que jusqu'à ce niveau */
  maxTier?: Tier;
  /** il faut un bébé ('baby') ou deux ('sibling') dans la famille */
  needs?: 'baby' | 'sibling';
}

export type QuestStep = StepGate &
  (
    | { kind: 'say'; speaker: Speaker; line: Line; emotion?: Emotion }
    | {
        kind: 'ask';
        speaker: Speaker;
        line: Line;
        options: ResponseOption[];
        hint: Line;
        /** réaction après bonne réponse */
        onCorrect?: Line;
        items: string[];
        emotion?: Emotion;
        /** point du décor montré par le personnage pendant la question */
        pointAt?: string;
        /** ordre des réponses conservé (sinon mélangé de façon reproductible) */
        keepOrder?: boolean;
        /** jeu d'écoute : les cartes ne montrent qu'une image et ne sont pas lues à voix haute */
        listen?: boolean;
      }
    | {
        kind: 'tapAnchor';
        speaker: Speaker;
        line: Line;
        anchor: string;
        hint: Line;
        items: string[];
        /** réaction après bonne réponse (défaut : « Well done! ») */
        onCorrect?: Line;
        /** prendre une photo de ce point du décor (flash, rangée dans l'album) */
        photo?: boolean;
      }
    | { kind: 'moveTo'; anchor: string; action: MoveAction; who?: Speaker }
    | { kind: 'moveBack'; who?: Speaker }
    /** pose (ou retire, si la liste est vide) les petits objets du jeu */
    | { kind: 'props'; show: PropPlacement[] }
    | {
        kind: 'tapProps';
        speaker: Speaker;
        line: Line;
        /** objets à toucher, dans n'importe quel ordre */
        targets: string[];
        /** compter à voix haute à chaque objet touché (« One! », « Two! »…) */
        count?: boolean;
        hint: Line;
        items: string[];
        onCorrect?: Line;
        /** réaction propre à un mauvais objet (ex. « I don't eat fish! ») */
        wrong?: Record<string, Line>;
        /** les objets doivent être touchés dans l'ordre de `targets` (marches, empreintes) */
        ordered?: boolean;
        /** les habits touchés sont portés par ce personnage */
        wear?: Speaker;
      }
    | {
        kind: 'command';
        speaker: Speaker;
        line: Line;
        /** ordres que la joueuse donne en touchant une carte (« Jump! ») */
        options: CommandOption[];
        /** nombre d'ordres différents à donner */
        need: number;
        items: string[];
        onCorrect?: Line;
      }
    | {
        kind: 'tapActor';
        /** qui donne l'ordre (« Mummy, dance! ») */
        speaker: Speaker;
        line: Line;
        /** membre de la famille à toucher */
        target: Speaker;
        /** ce qu'il fait une fois touché */
        action: ActAction;
        /** réponse du personnage touché (bonne réponse) */
        reply: Line;
        /** dit par un autre personnage touché (« Not me! ») */
        notMe: Line;
        hint: Line;
        items: string[];
      }
    /** passage au jour ou à la nuit (le décor s'assombrit) */
    | { kind: 'scene'; night: boolean }
    | {
        kind: 'seek';
        speaker: Speaker;
        /** qui se cache */
        hider: Speaker;
        line: Line;
        /** cachette (objet du décor marqué 'hide') */
        hideAt: string;
        hint: Line;
        notHere: Line;
        found: Line;
        items: string[];
      }
    /** changer de lieu (même continent), avec un fondu */
    | { kind: 'travel'; to: PlaceId; line: Line; speaker: Speaker }
    | { kind: 'act'; who: Speaker; action: ActAction; line: Line; speaker?: Speaker }
    /** trésor gagné, rangé dans le passeport */
    | { kind: 'reward'; treasure: string; line: Line; speaker: Speaker }
    | { kind: 'celebrate'; line: Line; speaker: Speaker }
  );

/** Ordre donné à un personnage (jeu « Jacques a dit »). */
export interface CommandOption {
  /** ordre, lu par le narrateur quand la carte est touchée */
  line: Line;
  icon: string;
  /** réponse du personnage */
  reply: Line;
  /** animation jouée ; absente = le personnage ne sait pas le faire (réponse drôle, pas d'erreur) */
  action?: ActAction;
  /** qui obéit (défaut : 'actor') */
  who?: Speaker;
}

/** Étape d'un type donné (aide au typage). */
export type StepOf<K extends QuestStep['kind']> = Extract<QuestStep, { kind: K }>;

export interface QuestScript {
  /** identifiant unique : archetype + espèce + rôle + tier */
  id: string;
  archetypeId: string;
  speciesId: string;
  biomeId: BiomeId;
  actorKind: ActorKind;
  tier: Tier;
  steps: QuestStep[];
  /** souvenir enregistré à la fin (bébé / famille) */
  memoryEvent?: string;
  /** lieu où se termine le script (après des étapes travel) ; défaut : biomeId */
  endPlace?: PlaceId;
  /** aventure à plusieurs scènes */
  adventureId?: string;
}

// ---------- Aventures (histoires à plusieurs scènes, propres à un continent) ----------

export interface AdventureDef {
  id: string;
  continentId: ContinentId;
  titleEn: string;
  titleFr: string;
  icon: string;
  /** lieu de départ */
  start: PlaceId;
  /** espèces qui peuvent la vivre (chaque lieu traversé doit être un de leurs habitats) */
  species: string[];
  skillIds: string[];
  /** étapes, communes à tous les niveaux (filtrées par minTier / maxTier / needs) ;
   *  fonction de l'espèce pour les scènes qui en dépendent (nourriture, façon de boire…) */
  steps: (species: SpeciesDef) => QuestStep[];
  /** trésor final */
  treasure: string;
  /** ordre conseillé dans le continent (simple suggestion, rien n'est verrouillé) */
  order: number;
}

export interface TreasureDef {
  id: string;
  nameEn: string;
  nameFr: string;
  icon: string;
}

/** Petit objet des jeux (nourriture, objets à compter, objets colorés, habits). */
export interface PropDef {
  id: string;
  /** mot anglais au singulier */
  word: string;
  /** pluriel anglais */
  plural: string;
  wordFr: string;
  pluralFr: string;
  /** groupe nominal de réponse (« A mango », « Bamboo ») */
  noun: Line;
  emoji?: string;
  /** forme dessinée en SVG, colorée par `color` */
  shape?: PropShape;
  kind: 'food' | 'thing' | 'clothes';
  /** genre du mot français (accord des couleurs) */
  fem?: boolean;
  /** nourriture : forme « I eat … » (fr : « je mange … », frNo : « je ne mange pas … ») */
  eat?: { en: string; fr: string; frNo: string };
  /** habit : forme « I need … » */
  need?: Line;
}

export type PropShape = 'flower' | 'pebble' | 'feather' | 'leaf' | 'butterfly' | 'fish' | 'shell';

// ---------- Activités génériques (assemblées pour n'importe quel lieu compatible) ----------

export interface ActivityCtx {
  species: SpeciesDef;
  place: PlaceDef;
  actorKind: ActorKind;
  /** sexe des bébés de la famille, dans l'ordre de naissance */
  babies: Sex[];
  /** sexe du bébé qui joue (si actorKind = 'baby') */
  actorSex?: Sex;
  /** souvenirs (famille + personnage) */
  memories: string[];
  /** parent joué (si actorKind = 'adult') */
  role?: ParentRole;
}

/**
 * Activité générique : `choices` énumère toutes les variantes possibles dans ce contexte
 * (vide = impossible ici), `build` construit les étapes d'une variante. Fonctions PURES :
 * le catalogue des voix les parcourt toutes pour enregistrer chaque phrase.
 */
export interface ActivityDef {
  id: string;
  choices(ctx: ActivityCtx): string[];
  build(ctx: ActivityCtx, tier: Tier, choice: string): QuestStep[] | undefined;
  memoryEvent?(ctx: ActivityCtx, choice: string): string | undefined;
}

