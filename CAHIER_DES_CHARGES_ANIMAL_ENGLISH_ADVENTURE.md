# ANIMAL ENGLISH ADVENTURE — CAHIER DES CHARGES COMPLET

Dossier de transmission à Claude Code. Les sections ci-dessous sont également disponibles en fichiers séparés dans l’archive.


---

# INSTRUCTIONS PERMANENTES

# CLAUDE CODE — DIRECTIVES PERMANENTES DU PROJET

Projet : **Animal English Adventure** — jeu d'aventure éducatif en anglais pour une enfant de 7 ans.

## Source de vérité et ordre de lecture
1. `docs/CAHIER_DES_CHARGES.md` : décisions produit validées et périmètre.
2. `docs/PROGRESSION_PEDAGOGIQUE.md` : 24 domaines de compétences et prérequis.
3. `docs/MOTEUR_DE_MISSIONS.md` : moteur de quêtes, compatibilité et dialogue.
4. `docs/FAMILLES_ET_CROISSANCE.md` : parents, naissance, bébés et mémoire.
5. `docs/DIRECTION_ARTISTIQUE.md` : direction graphique et ressources.
6. `docs/CRITERES_ACCEPTATION.md` : tests et livrables obligatoires.
7. `data/*.json` : données initiales, exemples à étendre et valider.

## Décisions NON NÉGOCIABLES
- **Monde libre, pas un parcours géographique linéaire.** La joueuse choisit son continent, son espèce et son animal. Un domaine d'apprentissage comme `1.1` peut être travaillé avec n'importe quel animal compatible : il ne correspond PAS à un continent donné.
- **Progression d'anglais indépendante du lieu.** Le graphe pédagogique conseille les acquis à travailler, sans forcer « Afrique 1.1 puis Océanie 1.2 » ni imposer de refaire une leçon après un déplacement.
- **Quêtes cohérentes avec l'habitat et l'espèce.** Le moteur assemble objectif pédagogique + biome + acteur + besoin + souvenirs + template vérifié. Aucune situation absurde ou incohérente (panda mangeant du poisson comme nourriture habituelle, point d'eau de savane en Antarctique, etc.).
- **Chaque espèce principale a un père et une mère interactifs.** Une courte scène familiale tendre mène à l'arrivée d'un premier bébé, fille ou garçon choisi par la joueuse, puis d'un second bébé de l'autre sexe, au maximum deux. Elle nomme chaque bébé librement avec garde-fous de sécurité. Les bébés questionnent la joueuse et apprennent de ses réponses.
- **Les bébés grandissent en QUATRE stades**, par apprentissage et expériences partagées, pas par connexion quotidienne ni simple temps écoulé. Chacun possède sa propre mémoire et personnalité. Frère et sœur interagissent entre eux et avec les parents.
- **Dialogues dynamiques CONTRÔLÉS** au lancement : bibliothèques de phrases, modèles et embranchements validés. Aucune dépendance à une IA générative pour jouer. IA libre et reconnaissance vocale seulement en évolution ultérieure, après validation parentale et garde-fous.
- L'application est utilisable **sans micro, sans compte, sans internet après chargement/caching des ressources du prototype** ; système de réponse tactile accessible.
- **La langue parlée du jeu est l'anglais**, avec aide française explicite facultative. Ne jamais exiger de lecture autonome à 7 ans.
- **Respect de l'enfant :** aucune publicité, collecte personnelle non nécessaire, chat externe, classement public, pénalité humiliante ou obligation quotidienne.
- **Visuels :** ne pas copier de personnages connus ; ne pas exploiter des images de recherche comme assets commerciaux sans licence. Lire `docs/DIRECTION_ARTISTIQUE.md`.
- **Aucune modification de code sans test.** Favoriser code typé, données structurées, fonctions déterministes testables, et compte rendu des limites.

## Règles de développement
- Inspecter d'abord le dépôt. S'il contient déjà du code, le respecter : ne pas effacer ni reconstruire une architecture validée sans preuve de problème concret.
- S'il est vide, initialiser une application React + TypeScript + Vite et un moteur de scènes Phaser compatible, en modules indépendants. Confirmer les versions supportées via docs officielles disponibles.
- Séparer `content` (données pédagogiques, biome, quêtes, dialogues) de `engine` (sélection, progression, événements, sauvegardes), `game` (scènes) et `ui` (menus parents/enfants).
- Développer par **tranches verticales jouables**, pas en construisant d'abord toutes les cartes, tous les bébés ou une énorme arborescence de fichiers vides.
- Garder une liste de suivi `docs/ETAT_DU_PROJET.md` (réalisé / en cours / bloqué / tests passés / prochain jalon) ; actualiser à chaque livraison.
- Si une question secondaire manque, choisir un défaut raisonnable documenté ; ne pas interrompre une première livraison compilable.
- Ne pas prendre pour validée une idée encore discutée : le **voyage accompagné d'animaux entre continents** est une **option à décider**, PAS une fonctionnalité approuvée.

## Mission immédiate
Lire `START_CLAUDE_CODE.md`, puis démarrer la **Phase 0** et la **Phase 1** du plan. Produire une version locale lançable montrant une carte interactive des 7 continents et un système de choix continent → espèce → personnage ; au moins une interaction pédagogique de salutations adaptée au lieu et à l'animal. Construire une première tranche approfondie en Afrique avec une famille de lions, puis montrer le même modèle de mission avec une autre espèce et un autre biome pour prouver la réutilisabilité. Ne pas déclarer tout le jeu achevé.


---

# CAHIER DES CHARGES PRODUIT

# CAHIER DES CHARGES PRODUIT — ANIMAL ENGLISH ADVENTURE
Version 3.0 — décisions actées, 18 novembre 2026

## 1. Vision et proposition de valeur
Un jeu d'aventure et d'exploration géographique, chaleureux, ludique et durable, conçu pour qu'une enfant de 7 ans découvre l'anglais en vivant avec des familles d'animaux. La joueuse voyage librement dans un monde illustré ; elle choisit le continent, l'habitat, l'espèce et l'animal, puis écoute, joue, parle, apprend et enseigne à des bébés animaux qui grandissent avec elle.

**L'anglais est un moyen d'agir dans le monde**, et non un quiz scolaire plaqué sur des images. Exemples : un éléphanteau a soif -> on trouve un point d'eau -> on discute de `water`, `thirsty`, `drink`, `hot`, `where`; un bébé manchot cherche ses parents sur la banquise -> `cold`, `ice`, `snow`, `left`, `right`, `mother`, `father`.

**Public :** enfant d'environ 7 ans, débutante en anglais, parent francophone. **Plateforme cible initiale :** tablette tactile, avec navigateur ordinateur également pris en charge. **Expérience :** sessions libres de 10–15 minutes recommandées, sans minuteur ni blocage, accès immédiat aux personnages.

## 2. Décisions confirmées / points ouverts
### Confirmé
1. 7 continents représentés sur une mappemonde librement explorée.
2. La joueuse choisit continent et animal ; aucune progression forcée Afrique -> Océanie -> Europe.
3. 3 niveaux pédagogiques Beginner / Intermediate / Expert, 8 domaines chacun (`1.1` à `3.8`). Les niveaux structurent les acquis, pas un rail de régions.
4. Quêtes qui changent selon environnement, espèce, état de l'animal, relation familiale, compétences à travailler et historique.
5. Au sein de chaque espèce principale : papa et maman interactifs ; scène familiale romantique courte et appropriée ; 2 bébés maximum, l'un garçon et l'autre fille, prénom personnalisé ; ils apprennent grâce à la joueuse et posent des questions.
6. Croissance des bébés en quatre stades, en fonction des connaissances, expériences et interactions ; mémoire individuelle ; interactions frère/sœur et parents.
7. Dialogues d'abord contrôlés, contenus validés et assemblage contextuel ; liberté de parole par IA uniquement en évolution maîtrisée.
8. Le jeu est utilisable sans microphone, avec contrôles tactiles et aides en français facultatives.

### En attente de décision (ne PAS implémenter comme acquis)
- Emmener des animaux d'un continent à un autre (idée proposée mais non encore validée).
- Synchronisation multi-appareils, comptes parentaux en ligne, monétisation (aucune prévue dans le prototype).
- Type d'appareil prioritaire exact (iPad / Android), et voix anglaise (accent britannique conseillé, à confirmer).

## 3. Monde et interface
### Écran principal — mappemonde
- Carte du monde stylisée, cohérente géographiquement, 7 continents distincts, mer, animaux emblématiques et animations légères.
- Sélectionner n'importe quel continent -> zoom doux -> environnement(s) du continent -> espèces locales -> famille ou personnage.
- Boutons permanents simples : carte, retour, passeport, son, aide. Menu parental séparé.
- Toujours pouvoir changer de continent et reprendre une autre aventure sans perte des acquis.
- Pas de verrou géographique dû au niveau d'anglais. Les scénarios plus complexes peuvent nécessiter des compétences, mais d'autres interactions restent toujours disponibles.
- Introduire sur chaque continent un hub d'habitat avec points interactifs (arbre, tanière, rivière, neige, pont, nourriture), personnages et déclencheurs de besoins.

### Continents, habitats et espèces emblématiques au périmètre final
| Continent | Habitat initial | 3 espèces principales | Vocabulaire local initial | Exemples d'événements |
|---|---|---|---|---|
| Afrique | Savane / point d'eau | lion, éléphant, girafe | hot, sun, dry, grass, shade, water, thirsty, river | boire, trouver l'ombre, retrouver le troupeau |
| Asie | Forêt de bambous / lisière | panda géant, tigre, panda roux | bamboo, forest, green, leaves, mountain, climb | trouver le bambou, explorer un sentier, préparer un repas |
| Europe | Forêt tempérée | renard, hibou, hérisson | leaves, tree, rain, river, nest, berries, path | chercher des baies, construire un nid, pique-nique |
| Amérique du Nord | Forêt / rivière / prairie | ours, bison, castor | forest, mountain, lake, wood, bridge, river | construire un abri, traverser une rivière |
| Amérique du Sud | Forêt tropicale / fleuve | jaguar, toucan, capybara | jungle, rain, fruit, waterfall, wet, river | chercher des fruits, décrypter un indice, suivre le fleuve |
| Océanie | Eucalyptus / ruisseau | kangourou, koala, ornithorynque | jump, pouch, eucalyptus, tree, creek, sunny | retrouver une feuille, sauter un obstacle, rejoindre un ruisseau |
| Antarctique | Banquise / littoral | manchot, phoque, orque | cold, snow, ice, fish, swim, windy, frozen | chercher de la nourriture, reconnaître une piste, retrouver sa famille |

Les espèces vivent dans un **habitat local cohérent**. Si besoin, scinder un continent en biomes appropriés. Exemple : l'orque évolue en mer, pas sur la banquise comme un manchot terrestre ; tigre et panda vivent dans des zones adaptées et ne sont pas automatiquement voisins dans la même clairière. Éviter de présenter un cadre simplifié comme une représentation scientifique exacte.

### Échelle de production
21 espèces principales -> pour chacune deux parents et au plus deux bébés = jusqu'à 84 personnages par sauvegarde, sans compter personnages secondaires. Il s'agit d'un **objectif de contenu à long terme**, non d'un objectif pour le prototype. Le code doit être réutilisable ; les assets restent spécifiques à chaque espèce et stade.

## 4. Boucle de jeu libre
1. La joueuse explore ou choisit un personnage.
2. Un animal lui parle ou la joueuse lance une interaction.
3. Le moteur propose une ou plusieurs actions pertinentes (discuter, aider, jouer, enseigner, explorer, retrouver quelqu'un).
4. Une mini-aventure contextualisée s'ouvre sans interrompre la libre exploration.
5. L'enfant comprend une consigne en anglais, agit sur la scène, choisit une réponse ou parle si disponible.
6. L'animal réagit de façon cohérente ; le monde évolue (besoin satisfait, objet déplacé, souvenir créé, bébé instruit).
7. L'activité met à jour séparément les compétences de l'enfant, les connaissances du bébé, l'état du monde et la relation familiale.
8. Retour au monde, autre mission, autre animal ou continent libre.

**Ne pas** obliger les quatre types classiques découverte/jeu/dialogue/aventure à apparaître dans un ordre immuable. Ce sont des formats de contenu que le moteur peut sélectionner pour servir l'apprentissage.

## 5. Objectifs pédagogiques
- Compétences principales : écoute, compréhension de consignes, lexique, expression orale guidée, conversation, lecture et écriture naissantes.
- Progression en 3 grandes étapes et 24 domaines, détails dans `PROGRESSION_PEDAGOGIQUE.md`.
- Environ 12 à 20 éléments nouveaux maximum par domaine *au total et répartis*, avec révision récurrente ; ne pas charger une session de 20 éléments.
- L'enfant peut explorer un lieu très tôt même si des mots avancés s'y trouvent. Le dialogue adapte ses phrases aux acquis ; une nouveauté se présente avec image, audio et reprise.
- Toujours dissocier **activité terminée** et **compétence acquise**. Éviter d'exiger une prononciation parfaite.
- « Expert » signifie expert dans le jeu ; ne pas annoncer automatiquement une certification A2 ou un bilinguisme.

## 6. Familles animales et relation affective
- Les deux parents ont des voix, tempéraments, dialogues et activités distincts ; la distinction père/mère, il/elle, frère/sœur est utilisée dans des scènes naturelles et répétées.
- Une courte cinématique tendre montre le couple ; transition vers naissance ou éclosion selon l'espèce, sans contenu biologique explicite ou effrayant.
- La joueuse choisit fille/garçon et nomme le premier bébé ; le second, s'il est créé, est obligatoirement de l'autre sexe. Possibilité de sauvegarder avant les deux naissances sans forcer leur réalisation.
- Le bébé vient au monde ignorant beaucoup de choses ; il prend l'initiative de demander `What is this?`, `Where is Mum?`, etc. Les questions deviennent plus élaborées à mesure que les compétences de la joueuse augmentent et que sa propre mémoire s'enrichit.
- Quatre stades : nouveau-né, petit explorateur, jeune aventurier, grand compagnon ; évolution visuelle et comportementale non punitive et sans durée réelle imposée.
- Frère et sœur ont des souvenirs et compétences séparés, peuvent jouer ensemble et solliciter l'aide de la joueuse.
- Les parents restent des personnages actifs après la naissance, y compris pour missionner la joueuse et prendre soin de la famille.

## 7. Types d'activités et diversité
Au moins 20 archétypes de mission sont décrits dans `data/quest_archetypes.json`. Exemples : rechercher de l'eau, ramasser de la nourriture, retrouver un proche, identifier un objet, suivre une piste, compter, comparer, cacher/trouver, construire un abri, préparer un repas, répondre à une question du bébé, expliquer une émotion, parcourir un labyrinthe, déchiffrer des consignes météo, aider un frère/une sœur, organiser une petite fête, raconter une journée, rétablir un pont, faire un inventaire, résoudre une énigme.

Le contenu doit paraître **varié dans ses actions**, et pas seulement remplacer « lion » par « panda » dans une même série de QCM. Varier objectifs secondaires, interactions, objets, cheminement, ordre des dialogues, difficulté, conséquences, tonalité et protagonistes ; la trame de base reste contrôlée.

## 8. Difficulté et adaptation
Le moteur gère distinctement :
- profil compétences enfant (`new`, `recognised`, `supported`, `independent`) ;
- objectif du moment (apprendre, réviser, consolider) ;
- biome et scène ;
- acteur choisi (espèce, parent, bébé, personnalité, stade) ;
- besoin/événement en cours ;
- histoire récente (éviter redites) ;
- mémoire du bébé.

Chaque situation possède au minimum : une formulation **Beginner**, **Intermediate** et **Expert**, plus aides/variantes si nécessaires. Les réponses tactiles sont toujours possibles. Une réponse incorrecte fournit un indice, sans honte ni échec brutal.

## 9. Dialogue et sécurité linguistique
- Approche initiale : banque de phrases enregistrées, modèles paramétrés, embranchements déterministes. Tous les textes anglais doivent être revus par une personne compétente.
- Réponses possibles guidées, en particulier Beginner ; audio de référence cohérent ; lenteur, répétition et aide française optionnelle.
- Prévoir une abstraction de synthèse et reconnaissance vocale ; **ne jamais coupler le moteur à un fournisseur unique**.
- Évolutions IA conversationnelle : périmètre thématique strict, filtrage, mémoire minimale, validation parentale, coût contrôlé et alternatives hors ligne. Pas nécessaire au lancement.

## 10. Design, accessibilité, performances
- Cartographie lisible ; personnages « mignons », expressifs et cohérents entre eux ; rendu illustré premium semi-volumétrique (2.5D visuel) sans besoin de 3D temps réel.
- Boutons tactiles confortables, évitement des textes longs, sous-titres optionnels, aides audio systématiques, pas de flash rapide ni transitions agressives.
- Un jeu ralenti ou sans son ne doit pas entraîner de perte de progression.
- Sauvegarde locale initiale robuste et versionnée ; export parent sauvegarde à prévoir plus tard.
- Aucun flux social, achat intégré ou lien externe dans la partie enfant.

## 11. Politique de contenu et véracité
- Éviter de faire enseigner des contre-vérités zoologiques pour faciliter une mission ; p. ex. un panda ne mange pas habituellement des poissons et une orque ne se promène pas sur terre.
- Les situations peuvent être imaginaires et douces, mais les animaux et habitats doivent rester reconnaissables.
- Éviter les représentations explicites de souffrance, mortalité, prédation et reproduction.
- Les bébés et familles sont un ressort narratif, pas une simulation biologique exhaustive.

## 12. Premier résultat attendu
Prototype réellement jouable : vue monde, navigation libre sur les sept continents (même avec décor temporaire), au moins une espèce disponible par continent pour une salutation adaptée ; savane africaine plus aboutie, famille de lions (papa, maman, bébé et second bébé), dialogue pédagogique, mini-quête `thirsty -> waterhole`, sauvegarde et tests. Un second animal et une mission similaire dans un autre biome prouvent que le système n'est pas spécifique au lion. Les 21 espèces et quatre stades graphiques complets suivront par production progressive.


---

# PROGRESSION PEDAGOGIQUE

# PROGRESSION PÉDAGOGIQUE — 24 DOMAINES, AUCUN PARCOURS GÉOGRAPHIQUE IMPOSÉ

## Principes impératifs
Les codes `1.1` à `3.8` sont des **domaines de compétences**, pas des missions réservées à un continent. La joueuse peut travailler `1.2` (couleurs) avec le manchot, le lion, le panda, le castor, etc. Le contenu narratif, objets et environnement s'adaptent. Elle choisit librement la région ; le moteur propose une compétence adaptée à son profil et lui laisse, dans la mesure du possible, le choix entre plusieurs activités.

La progression pédagogique est un **graphe de prérequis souples**, et non une séquence de 24 portes verrouillées. Ex. l'enfant peut découvrir les couleurs avant de savoir se présenter ; une conversation plus complexe utilisant des questions nécessite en revanche une familiarisation avec les salutations/questions élémentaires. Le système suggère, présente des indices et révise — il ne ferme pas un continent.

Quatre états de suivi par expression/compétence : `new`, `recognised`, `supported`, `independent`. Ce ne sont pas les stades de croissance du bébé. Un score indicatif de 80 % sur plusieurs situations peut aider à confirmer la maîtrise, jamais comme verrou géographique ; distinguer réponses avec aide, essais répétés et sans aide. Une réussite tactile ne doit pas être considérée comme preuve de prononciation.

Les « quatre missions » historiques par domaine deviennent **quatre familles d'activités pédagogiques réutilisables** : découverte, manipulation, dialogue, aventure. Le moteur peut les proposer dans différents ordres, avec des animaux différents et plusieurs variantes. Nombre de domaines : 24 ; types de temps forts : 96 unités pédagogiques conceptuelles ; nombre de quêtes effectivement jouables : potentiellement plus élevé selon les variantes validées.

## NIVEAU 1 — BEGINNER : écouter, comprendre, nommer

| Domaine | Notion | Lexique / expressions cibles | Compétence observable | Exemple contextualisé |
|---|---|---|---|---|
| 1.1 | Salutations, prénom, politesse | hello, hi, goodbye, my name is, what's your name, how are you, fine, happy, please, thank you | Saluer, se présenter avec aide et répondre à une question simple | Le bébé lion rencontre l'exploratrice ; le bébé manchot accueille un nouvel ami |
| 1.2 | Couleurs | red, blue, green, yellow, orange, pink, purple, black, white; it's ... | Reconnaître les couleurs et compléter « It's red » | Trouver une fleur bleue dans la savane / un poisson coloré sous l'eau |
| 1.3 | Nombres 1–10 | one...ten, count, how many, more | Compter des objets, répondre How many? | Compter les poissons / feuilles / étoiles |
| 1.4 | Animaux et taille | lion, tiger, panda, bird, elephant, rabbit, bear, big, small, this is | Identifier un animal, opposer big/small | Retrouver les amis de la famille parmi des silhouettes |
| 1.5 | Corps et actions | head, eyes, nose, ears, mouth, legs, hands, feet, run, walk, jump, stop | Identifier parties du corps et suivre des commandes motrices | Aider un lionceau à apprendre à courir ; observer les nageoires d'un phoque |
| 1.6 | Nourriture et goûts | apple, banana, mango, fish, water, fruit, like, don't like, eat | Dire ce qu'on aime dans un contexte simple | Choisir un aliment **approprié à l'espèce**, compléter une collation |
| 1.7 | Météo et sensations | hot, cold, rainy, sunny, windy, snowy, thirsty, hungry, happy, sad | Identifier météo et dire une sensation | Éléphant assoiffé dans la savane / manchot surpris par le vent |
| 1.8 | Synthèse / révision | Réemploi des notions 1.1–1.7 | Réaliser plusieurs actions sans répétition mécanique | Aventure au choix dans un des continents visités |

Notes : la notion `thirsty` est introduite naturellement dans les besoins même avant l'évaluation formelle de 1.7, avec pictogramme et voix ; une phrase d'environnement plus avancée peut apparaître en **entrée compréhensible** sans être attendue en production. Pour 1.6, ne pas demander à un lion de manger une pomme comme repas naturel.

## NIVEAU 2 — INTERMEDIATE : construire, questionner, répondre

| Domaine | Notion | Lexique / structures | Compétence observable | Exemple contextualisé |
|---|---|---|---|---|
| 2.1 | Présentations et personnes | I am, you are, he is, she is, it is, we are; tall, short, young, old | Présenter un membre de famille, distinguer he/she | « She is my mum. He is my dad. » |
| 2.2 | Capacités | can, can't, swim, fly, climb, run, help | Dire ce qu'on sait faire, demander Can you ...? | Quel animal peut franchir la rivière ? |
| 2.3 | Localisation | in, on, under, next to, behind, between; where | Localiser, décrire un emplacement | « The toy is behind the tree. » |
| 2.4 | Préférences et questions | do you like, yes I do, no I don't, fish, leaves, berries | Interroger les goûts, répondre | Préparer un repas adapté à l'animal |
| 2.5 | Possession | have, has, don't have; nest, toy, tool, bag | Décrire qui possède quel objet | Retrouver le jouet du bébé |
| 2.6 | Interrogation | what, where, who, which; path, river, bridge, lost | Poser une question guidée pertinente | Interroger les animaux pour retrouver une sœur |
| 2.7 | Habits et climat | coat, hat, boots, scarf, wear, need, warm, wet, dry | Décrire une tenue humaine ou un équipement d'explorateur | Préparer l'exploratrice pour le froid (ne pas habiller de force les animaux sauvages) |
| 2.8 | Synthèse / dialogue | Réemploi de 2.1–2.7 | Échanger 6–8 tours guidés, résoudre un problème | Mission de famille avec questions et indices |

## NIVEAU 3 — EXPERT DANS LE JEU : raconter, comparer, planifier

| Domaine | Notion | Lexique / structures | Compétence observable | Exemple contextualisé |
|---|---|---|---|---|
| 3.1 | Actions en cours | I'm looking, is sleeping, are playing, what are you doing? | Décrire ce qu'un animal est en train de faire | Observer le comportement des animaux près du point d'eau |
| 3.2 | Déplacements / directions | left, right, straight, turn, cross, follow, let's | Donner et suivre des indications | Guider un bébé vers sa famille |
| 3.3 | Chronologie et routines | morning, evening, first, then, finally, wake up, eat, sleep | Raconter une routine en ordre | Organiser la journée d'un bébé |
| 3.4 | Comparaison | bigger, smaller, taller, faster, slower, than | Comparer deux objets/animaux | Comparer traces, longueurs, déplacements |
| 3.5 | Événements passés | yesterday, played, visited, went, saw, found | Raconter quelques événements avec aide | Se rappeler une quête déjà vécue |
| 3.6 | Intention / futur | tomorrow, going to, plan, bring, prepare, need | Formuler un projet simple | Préparer une expédition familiale |
| 3.7 | Résolution dialoguée | Réemploi des questions, directions, temps et comparatifs | Comprendre un problème, proposer des étapes, dialoguer | Sauvetage approprié à l'habitat choisi |
| 3.8 | Grande synthèse ouverte | Toutes notions acquises | Comprendre et résoudre une aventure à étapes | Réparer un problème de l'habitat avec sa famille favorite |

## Famille et genre grammatical — transversal
Les mots père/mère/fils/fille/frère/sœur peuvent apparaître en entrée dès le niveau 1 (`dad`, `mum`, `baby`, `brother`, `sister` avec images) ; les formulations `he`, `she`, `his`, `her`, `son`, `daughter`, `older`, `younger` sont structurées aux niveaux 2–3. Expliquer que l'anglais distingue le genre principalement dans certains pronoms et noms de personnes/animaux, mais **ne possède pas le genre grammatical français systématique des noms**.

## Grille d'une compétence
Chaque objectif pédagogique est associé à :
- `id`, niveau indicatif, prérequis, cible lexicale, structures, icône et exemples audio ;
- exemples d'évaluation à partir de scènes différentes ;
- aides acceptées, nombre de situations réussies et date de révision suggérée ;
- activités compatibles : écouter/sélectionner, manipuler, parler/choisir, dialoguer, résoudre.

## Progression au rythme de la joueuse
1. Au premier lancement : aucun test stressant. Commencer par saluer un animal dans le continent choisi.
2. Le moteur repère les acquis observés. Proposer chaque fois 1 nouveauté + du vocabulaire connu et des révisions.
3. L'enfant peut privilégier les missions d'un animal favori, revenir à l'ancien domaine ou changer de continent.
4. Une activité peut servir plusieurs notions : `I'm thirsty` + `where is the water?` + `go left` selon niveau.
5. Valider séparément compréhension, production assistée et production indépendante ; jamais sur STT seul.
6. Le parent peut visualiser ce qui a été rencontré, maîtrisé ou à retravailler, sans noter « élève en échec ».

## Audio et français
Anglais parlé par les animaux, phrases courtes, réécoute illimitée, vitesse lente facultative ; aide française déclenchée volontairement (voix ou pictogramme) pour les premières sessions. Pour chaque phrase anglaise dans les contenus de développement, stocker sa traduction française de contrôle, sans l'afficher systématiquement à l'enfant.


---

# MOTEUR DE MISSIONS

# MOTEUR DE MISSIONS CONTEXTUELLES — SPÉCIFICATION FONCTIONNELLE ET TECHNIQUE

## 1. But
Fabriquer de nombreuses **situations jouables cohérentes** sans écrire un jeu complet pour chaque combinaison de 7 continents × 21 espèces × 4 âges × 24 domaines. Le moteur ne doit pas inventer arbitrairement un scénario : il choisit et assemble des **archétypes prévalidés**, des objets compatibles, des répliques rédigées et des actions réalisables dans une scène.

## 2. Les couches de composition
1. `PlayerSkillState` : compétences acquises, à découvrir, à réviser, niveau d'assistance nécessaire.
2. `WorldContext` : continent, biome précis, lieu, météo simulée, points interactifs présents.
3. `ActorContext` : espèce, individu (father/mother/baby1/baby2), personnalité, stade de croissance, mobilité/nourriture.
4. `Motivation` : curiosité, soif, faim, besoin social, jeu, aide, événement d'exploration — légère et jamais punitive.
5. `QuestArchetype` : type de tâche (fetch, guide, locate, classify, count, ask-answer, teach-baby, follow-directions, family-reunion, build etc.).
6. `DialoguePack` : variantes Beginner / Intermediate / Expert en anglais validées, traduction FR cachée, fichier audio ou synthèse de secours, réponses et aides.
7. `WorldMutations` et `LearningEvents` : déplacer un acteur, satisfaire besoin, mémoriser un objet, mettre à jour compétence enfant/bébé, journal d'historique.

## 3. Invariants
- Une quête doit toujours posséder `entry`, `challenge`, `success`, `fallback`, `exit` ; vérifier qu'un chemin de succès est accessible sans microphone.
- Chaque `QuestArchetype` déclare les compétences qu'il peut enseigner et les exigences graphiques/physiques : `requiredAnchors`, `allowedBiomes`, `speciesConstraints`, `requiredCapabilities`, `requiredActors`, `interactiveObjects`.
- Les besoins sont des **occasions narratives** : un bébé assoiffé n'est jamais en danger de mort, il reste possible d'interrompre/reprendre.
- Le contenu anglais est contrôlé par l'auteur ; substitution de variables limitée (`{actorName}`, `{object}`, `{placeName}`, `{color}`, `{number}`) avec grammaire testée, pluriels/accords définis. Ne jamais former mécaniquement une phrase anglaise incorrecte à partir d'un mot.
- Ne pas générer un voyage physiquement impossible (éléphant sous l'eau de mer, orque marchant en forêt, manchot dans un arbre).
- À niveau d'anglais égal, une activité doit pouvoir exister avec plusieurs espèces et au moins deux habitats en modifiant la situation, pas en projetant la même scène partout.

## 4. Pipeline déterministe
```
OnPlayerRequestsInteraction(place, actor):
    profile = loadPlayerSkills()
    context = loadHabitat(place)
    actorState = loadActor(actor)
    goals = choosePedagogicalGoals(profile, revisionDue, recentHistory)
    candidates = listQuestArchetypes()
        .filter(isCompatible(context, actorState))
        .filter(hasAllRequiredAssets)
        .filter(goalCompatibility(goals))
        .filter(isPlayableByTouch)
    ranked = rank(candidates,
        contextRelevance, goalValue, characterPersonality,
        novelty, familyRelationship, pastSuccess, playerChoice)
    choice = offerUpToThreeDistinctActivities(ranked)
    quest = instantiate(choice, allowedParameters, validatedDialoguePack)
    validateQuestRuntime(quest)
    play(quest)
    commitTransactionalEvents(quest.outcome)
```

`choosePedagogicalGoals` peut suggérer de nouvelles notions pertinentes, mais **ne conditionne jamais l'accès au continent**. Une seule mission peut combiner notion du niveau, révision d'acquis et un mot environnemental présenté oralement avec pictogramme.

## 5. Répétition et diversité
- Historique des derniers `N=10` archétypes et personnages par profil (seuil ajustable).
- Pénaliser les répétitions rapprochées, sans refuser une mission explicitement choisie.
- Pas plus de deux missions successives de même mécanique suggérées automatiquement, sauf demande explicite.
- Varier `intro`, `challenge`, `path`, `result`, avec variantes validées ; utiliser des objets et points de scène différents.
- Enregistrer les quêtes vécues par les bébés pour activer rappels/mémoires.
- Permettre au moins une activité sans mission : observer, découvrir un son, converser brièvement, explorer.
- Empêcher des besoins incohérents qui se répètent toutes les 30 secondes (`cooldown` narratif, sans punition).

## 6. Exemple fil rouge : « J'ai soif »
**Savane, éléphanteau / domaine 1.7 ou révision 1.1 :**
- Déclencheur : le bébé dit `I'm thirsty!` et montre un pictogramme eau.
- Débutant : `Water, please!` ; enfant choisit une gourde / le point d'eau ; mini-dialogue `Let's go!` ; `Thank you!`.
- Intermédiaire : `Where is the water?` -> enfant doit repérer le plan d'eau `near the big tree`, guider le bébé.
- Expert : `It's hot today. We need water. Which path is shorter?` -> comparer des indices et utiliser `left/right` et `because` avec aide, selon compétences.
- Au point d'eau : animation de l'éléphanteau buvant, émotion positive ; possibilité de parler de `hot`, `cold`, `water`, `drink`.
- Mémoire bébé : `found_waterhole_with_player`; lors d'une visite ultérieure il peut dire `Remember? We found water here!`.
- Transition de retour libre vers l'habitat.

**Version savane lionceau :** même objectif de compréhension `thirsty`/eau, mais personnage, déplacement, chemin, animation, dialogue et réactions distincts. **Version banquise :** ne pas copier un point d'eau de savane ; remplacer par un objectif approprié (un bébé manchot cherche un endroit sûr pour rejoindre sa famille ou un poisson), mêmes compétences de `where`/direction ou émotions, autre archétype.

## 7. Deuxième exemple : « Enseigne-moi ce mot »
- Bébé nouvellement né pointe un élément présent (`tree`, `ice`, `flower`) qu'il ne connaît pas ; question `What's this?`.
- L'enfant touche l'image / sélectionne une carte / répond si micro activé.
- Le bébé répète avec intonation : `A tree! Thank you!`.
- Le moteur enregistre `taught` ; reteste **une autre fois et dans un autre contexte** avant `retained`.
- Si bébé possède déjà le mot : `I remember! It's a tree!` et il demande `Is the tree big?` au lieu de recommencer au stade zéro.
- Scène spécifique au lieu (banquise -> iceberg / snow, savane -> acacia / shade, forêt -> leaf / branch).

## 8. Dialogues : 3 niveaux sans IA libre
### Pack d'exemple
```
quest_id: find_water
level: beginner
entry: "I'm thirsty!"
responseOptions: ["Let's find water!", "Hello!", "Goodbye!"]
correct: "Let's find water!"
onCorrect: "Yes, please! Let's go!"
onIncorrect: "Listen again: I'm thirsty. I need water!"
audioReplay: true
hint: water_icon
```
Ce pseudo-format illustre la mécanique ; respecter le schéma typé réel de l'implémentation. Une mauvaise réponse peut être suivie d'une explication ; l'enfant n'est pas obligé de répéter mot pour mot une phrase longue.

## 9. Nombre de contenus : réalisme de production
- **20 archétypes** réutilisables au lancement du moteur, pas 20 quêtes toutes prêtes dans 21 familles.
- **7 packs d'habitat** initiaux avec au moins 10 points/objets contextuels et une quinzaine d'expressions environnementales chacun.
- **21 packs d'espèce** à terme, avec aptitudes, aliments, comportements, animations et famille.
- **24 domaines pédagogiques** avec objectifs, phrases, évaluation, indices.
- **3 bandes de complexité** pour dialogues ; **4 stades** de bébé qui modifient la formulation et les actions possibles.

Le nombre théorique de combinaisons ne garantit pas autant de quêtes qualitativement différentes. Pour empêcher l'illusion de variété, tester des sessions de 20 minutes et mesurer : répétition d'archétypes, de dialogues, d'objets, de mouvements, choix réels, et nouveauté ressentie.

## 10. Modules logiciels conseillés
- `SkillGraph` : prérequis souples, suivi, révisions.
- `WorldRegistry` : continents, biomes, lieux, points interactifs.
- `SpeciesRegistry` : caractéristiques et compatibilités.
- `FamilySystem` : parents, bébés, croissance, mémoire.
- `QuestCatalog` : archetypes et scénarios.
- `QuestSelector` : filtrage, classement, variété, choix de joueur.
- `DialogueEngine` : scripts, variables, niveaux, embranchements, hints.
- `EventStore` : événements structurés et sauvegarde versionnée.
- `AudioService` : audio préenregistré en priorité, synthèse en secours.

Pour le prototype, le sélecteur peut être déterministe avec graine pseudo-aléatoire ; il doit être testable et reproductible.

## 11. Validation automatique à prévoir
1. Pour chaque entrée du catalogue, au moins un chemin de réussite sans microphone.
2. Toutes les phrases utilisées ont texte, traduction de contrôle et audio ou stratégie de secours.
3. Aucune quête demandant `waterhole` n'est proposée sans point d'eau.
4. `species.allowedBiomes` couvre le biome actif, sauf visite intercontinentale explicitement autorisée ultérieurement.
5. Lors de 100 sélections simulées, aucun choix n'est impossible, aucune quête ne manque d'objet requis.
6. Changer d'acteur ou continent ne remet pas à zéro le graphe de compétences.
7. Rejouer une mission volontairement reste possible ; recommandation automatique pénalise les doublons.
8. Une même notion `1.1` fonctionne au moins avec lion en Afrique et manchot en Antarctique (dialogues et environnement distincts).


---

# FAMILLES ET CROISSANCE

# FAMILLES, NAISSANCES ET CROISSANCE DES BÉBÉS

## 1. Composition de chaque famille
Pour chaque espèce principale : **deux adultes interactifs**, parent `father` et `mother`, personnalités distinctes, répliques adaptées au niveau ; **deux bébés maximum** par famille et par sauvegarde, un `boy` et un `girl`. Les parents peuvent exister/interagir avant toute naissance. Les noms des adultes sont définis par les contenus du jeu et restent constants ; prénoms des bébés choisis librement par la joueuse.

Si la première naissance est un garçon, la seconde sera une fille, et inversement. N'empêcher ni d'explorer ni d'apprendre si aucun bébé n'a encore été créé. Ne pas confondre ce choix de représentation des bébés avec le système pédagogique du masculin/féminin anglais.

## 2. Événement familial — cinématique
Déclenché à l'initiative de la joueuse ou par un événement qu'elle accepte. Séquence courte, tendre, positive, adaptée à 7 ans : rapprochement des parents, petit jeu/câlin, cœurs discrets, transition douce, bébé arrive. Pour oiseaux/reptiles et espèces ovipares, adapter à l'éclosion d'un œuf ; pour mammifères, transition pudique vers nouveau-né. Pas de reproduction représentée, grossesse explicite, douleur ou explication biologique complexe. Bouton passer/sauter la scène ; possibilité de revoir la cinématique.

Après l'arrivée : choix du sexe disponible, prénom libre 1–18 caractères (Unicode, espaces et tirets contrôlés), filtrage des entrées malveillantes, aucune obligation d'un vrai prénom. Enregistrer immédiatement. Le deuxième bébé doit être l'autre sexe. Une naissance peut aussi permettre une petite leçon `It's a boy!`, `It's a girl!`, `This is my brother/sister.`

**Cohérence espèce :** ne pas appeler « maman lion » un mâle à crinière et inversement ; selon espèce, dimorphisme discret. Chez certaines espèces, les habitudes familiales anthropomorphisées sont purement fictionnelles ; garder une présentation chaleureuse sans revendiquer une exactitude biologique totale.

## 3. Quatre stades de croissance
| Stade interne | Nom UI | Visuel / comportement | Capacités de dialogue |
|---|---|---|---|
| `newborn` | Nouveau-né | Très petit, mouvements lents, découvre objets et proches | questions simples `What's this?`, `Who is that?`, réponses courtes |
| `little` | Petit explorateur | joue, marche/se déplace, curiosité accrue | `Is it blue?`, `Can we play?`, notions mémorisées |
| `young` | Jeune aventurier | davantage d'expressions, explore avec aide | `Where should we go?`, `Why ...?` avec réponses guidées |
| `companion` | Grand compagnon | presque adulte, autonomie de jeu, sans remplacer parents | conversations de plusieurs tours et projets communs |

La croissance suit une fonction de progrès **multicritère**, pas un chronomètre : diversité de connaissances enseignées et réutilisées, aventures diverses terminées, interactions positives variées. Prévoir seuils paramétrables et plafonds anti-farming ; **pas de croissance si l'on clique 50 fois le même mot**. Les étapes peuvent rester accessibles même si la joueuse a avancé en anglais ; elles ne dépendent pas mécaniquement des niveaux 1/2/3. Prévoir une annonce non intrusive et une jolie transformation, jamais une perte d'habiletés ou de souvenirs.

Exemple de seuils indicatifs POUR TESTS, à ajuster après observation : `newborn -> little` : 8 expressions vues, 3 différentes retenues, 2 activités distinctes ; `little -> young` : 20 expressions vues, 10 retenues, 6 aventures variées ; `young -> companion` : 40 expressions vues, 22 retenues, 12 aventures variées. Ne pas présenter ces chiffres comme objectifs éducatifs universels.

## 4. Le bébé prend l'initiative
Chaque bébé possède un état (`curious`, `playful`, `tired`, `hungry`, `thirsty`, `content`) léger, non punitif, et une personnalité stable (`shy`, `adventurous`, `gentle`, `funny`, etc.). Il peut déclencher une demande contextuelle :
- Nouveau-né : « What's this? » -> sélectionner une image ou répondre avec aide.
- Petit explorateur : « Is this a tree? » -> yes/no + nom.
- Jeune aventurier : « Can you show me where the river is? » -> aider et se déplacer.
- Grand compagnon : « Last time you showed me a river. Shall we go again? » -> souvenir + nouvelle mission.

Ses questions doivent avoir un objectif pédagogique : développer les acquis de l'enfant (retrieval practice, explication, conversation). Un bébé qui connaît un mot doit le **réutiliser**, pas répéter qu'il l'ignore. Une question inconnue peut être formulée comme découverte d'un nouveau contexte (ex. la couleur d'une nouvelle fleur, pas « qu'est-ce qu'un arbre ? » après 20 leçons sur les arbres).

## 5. Mémoire individuelle et liens sociaux
Créer des données minimales pour chaque bébé : `babyId`, `familyId`, `name`, `sex`, `growthStage`, `personality`, `taughtSkillIds`, `retainedSkillIds`, `recentActivities`, `milestones`, `relationshipEvents`, `questMemory`, `appearanceVariant`. Les souvenirs sont des **événements structurés** et validés : « une fois on a cherché de l'eau avec la joueuse », pas des textes générés aléatoirement.

Parents : mémoire des événements familiaux ; frère/sœur : interagir, aider, jouer, s'appeler, être retrouvés, participer à une explication. Conserver relation parent/enfant sans obliger la joueuse à « s'occuper » du bébé sous peine de punition ou de manque.

## 6. Trois progressions indépendantes
1. **Joueuse** : compétences anglaises, réussites, révisions.
2. **Bébé** : connaissances retenues, croissance, personnalité.
3. **Relations** : aventures vécues ensemble, jalons familiaux.

Événement exemple : `BabyAskedWhatIsThis` -> joueuse répond `tree` avec image -> `player.skill.tree` mise à jour (avec aide ou non) ; `baby.taughtSkillIds` + `tree` ; `family.relationshipEvents` ajoute une interaction ; mini-célébration. Une action ne donne pas automatiquement 100 % de maîtrise pour l'un ou l'autre.

## 7. Cas limites à tester
- Créer premier bébé fille, deuxième garçon ; cas inverse.
- Refuser un troisième bébé dans cette famille sans casser l'interface.
- Prénoms vides, longs, caractères spéciaux, emojis, noms identiques, données sauvegardées.
- Deux bébés de stades différents, un apprend la couleur et l'autre la connaît déjà.
- Recharger pendant/après la cinématique : aucun double enregistrement.
- Changer de continent au milieu d'une interaction : retour propre, sauvegarde.
- Sécurité : aucun stockage d'enregistrement vocal par défaut ; aucun besoin de collecte de données d'enfant.


---

# DIRECTION ARTISTIQUE ET VISUELS

# DIRECTION ARTISTIQUE — CHARTE ET PASSAGE DES VISUELS À CLAUDE CODE

## 1. Direction visuelle retenue
Les images déjà appréciées dans la conversation indiquent une préférence pour : univers cartoon animalier premium, personnages volumétriques très mignons, grands yeux expressifs, fourrure stylisée douce, éclairage chaleureux, palettes lumineuses, décors naturels immersifs ; rendu **illustré semi-3D / 2.5D** plutôt que photo-réalisme. Expressions lisibles à distance sur tablette. Mappemonde illustrée riche mais claire, continents reconnaissables et zooms fluides.

**Le jeu n'exige pas une 3D temps réel.** Une base Phaser 2D avec sprites, calques, parallaxe et animations peut produire l'impression visuelle recherchée à coût raisonnable ; les cinématiques peuvent être de courtes séquences dessinées/animées. Les images de prévisualisation ne constituent pas des fiches sprites exploitables telles quelles.

## 2. Style imposé
- Direction unifiée sur toute la planète : personnages au rendu doux, volumes arrondis, formes lisibles, textures simples, expressions bienveillantes.
- Personnages distinguables par silhouette, couleur, posture et accessoires (sans uniformiser toutes les espèces).
- Décors typiques : savane dorée, banquise turquoise/blanc, bambous vert clair, forêt tempérée chaleureuse, jungle tropicale, rivière d'Océanie, montagnes/forêts nord-américaines.
- Palette lumineuse, contrastes accessibles, typographie claire, très gros boutons, pictogrammes audio, retour, passeport.
- Déplacements lents, animations de respiration, battements des yeux, gestes ; célébrations brèves non agressives.
- Pas de copie d'un univers, d'une mascotte connue ou d'un style imitant précisément un studio / film identifié.

## 3. Assets nécessaires par catégorie
### Carte
- `world_map.png` ou scène recomposée en calques : continents distincts, zones cliquables définies séparément (pas seulement un bitmap impossible à sélectionner précisément).
- fonds d'océan, halos de sélection, icônes zones, marqueurs d'espèces.
### Biomes
- 1 fond par biome initial ; 3 à 6 calques (ciel/arrière-plan, milieu, sol, premier plan, eau/neige selon biome).
- Objets interactifs en sprites séparés : arbre, herbe, ombre, point d'eau, pierre, fruits, tanière, etc.
### Personnages
- Père, mère et bébé ont des assets distincts par espèce ; 4 variantes d'âge par bébé à terme, garçons/filles cohérents, différence visuelle discrète si dimorphisme inexistant.
- Animations requises à terme : idle, blink, happy, curious, point/show, walk or swim/fly, speak, drink/eat where relevant, family affection, grow transition.
- Pour le premier prototype, minimum : idle, speak, happy, walk, newborn, little, changements d'état lisibles.
### UI/audio
- Pictogrammes accessibles : parler, réécouter, aider, entrer/sortir, choisir, récompense.
- Sons et musique doux, voix EN naturelles (préférer clips de dialogues enregistrés ou générés légalement pour la production).

## 4. Transmettre les visuels aimés
**Attention :** les images affichées précédemment dans la conversation étaient des illustrations de référence retrouvées à partir de descriptions, pas nécessairement des illustrations originales générées et exportées pour ce jeu. Elles ne sont PAS incluses automatiquement dans ce dossier et leurs droits d'exploitation ne sont pas garantis.

Procédure :
1. Dans ChatGPT, ouvrir l'image aimée ; si une fonction d'enregistrement existe, enregistrer l'image. Sinon faire une capture d'écran propre pour **référence visuelle uniquement**.
2. Donner à chaque fichier un nom parlant : `ref_mappemonde.png`, `ref_lion_papa.png`, `ref_lion_maman.png`, `ref_lionceau.png`, `ref_savane.png`, `ref_banquise.png`, `ref_panda.png`.
3. Copier les fichiers dans `assets/references/` du projet Claude Code.
4. Dans Claude Code, demander d'analyser ces images **comme références de direction artistique**, pas de copier les fichiers directement dans le jeu.
5. Créer pour la production des assets **originaux** et autorisés, cohérents entre eux. Les enregistrer dans `assets/originals/`.
6. Utiliser temporairement des substituts simples dans le code si les originaux n'existent pas encore. Documenter les remplacements à faire.

Si les illustrations téléchargées proviennent de sources tierces, obtenir la licence adaptée **avant tout usage dans une version distribuée**. Une capture d'écran ne transfère aucun droit.

## 5. Prompt d'orientation pour créer de nouveaux personnages originaux
« Concevoir un personnage animal original pour un jeu éducatif destiné aux enfants de 7 ans : rendu cartoon semi-volumétrique premium, proportions attachantes, yeux expressifs mais naturels, silhouette lisible, lumière douce et chaleureuse, palette harmonieuse, expression bienveillante, cohérence visuelle avec le reste de la famille d'animaux et le biome, détails de pelage subtils, aucune imitation d'un personnage ou d'une franchise existante. Fournir séparément le personnage sur fond transparent et un décor de biome cohérent. »

Pour les animations, demander *spritesheets homogènes*, mêmes dimensions de cellule et cadrage, poses idle/marche/parle/heureux, sans décors intégrés au sprite. Les images d'ambiance ne remplacent pas les spritesheets.

## 6. Fiches techniques recommandées (à finaliser avec le moteur)
- Conserver originaux haute résolution puis exporter optimisés (WebP/PNG alpha selon asset).
- Format paysage tablette 16:9 comme base de composition, adaptabilité 4:3 ; zones sûres pour le HUD.
- Personnages en transparence, points d'ancrage cohérents ; décor sans boutons intégrés, pour rendre les éléments séparément interactifs.
- Générer les images de carte et de personnage séparément : une capture de savane incluant un lion ne permet pas d'animer indépendamment le lion.
- Atlas / spritesheets versionnés, convention de noms `species_role_stage_action_frame`.

## 7. Validation visuelle
La direction artistique doit être approuvée au moyen d'un trio cohérent **carte / savane / famille lion** avant production en masse. Vérifier cohérence de palette, volumes, traits, poses, lisibilité des personnages sur tablette et répétabilité du style pour 21 espèces. Ne pas produire tous les assets avant cette validation.


---

# CRITERES D ACCEPTATION

# PLAN DE PRODUCTION ET CRITÈRES D'ACCEPTATION

## Stratégie — commencer à construire, mais sans promesse irréaliste
Cette spécification décrit la destination finale, pas la livraison immédiate. Il faut une preuve jouable du choix libre, de l'adaptation de mission et de l'apprentissage interactif AVANT de produire 21 familles × 4 stades graphiques. Une première scène « magnifique mais statique » sans système pédagogique ne suffit pas.

### Phase 0 — Audit du dépôt et fondations
**Livrables :** audit des fichiers existants, stack justifiée, commandes d'installation/lancement, `docs/ETAT_DU_PROJET.md`, structure modulaire, TypeScript strict, tests automatiques, mécanisme de logs de développement sans données sensibles. Si un dépôt préexiste : aucune destruction.
**Critère :** installation, compilation et tests de base exécutés avec succès.

### Phase 1 — Monde libre et premier dialogue
**Livrables :** carte 7 continents cliquables ; choix libre continent → espèce locale → adulte/animal disponible ; navigation retour ; une interaction de salutation contextualisée par biome ; audio anglais ou fallback et bouton réécoute ; réponses tactiles ; sauvegarde locale et reconnexion.
**Critère :** sans savoir lire, on peut cliquer Antarctique, choisir un manchot, dire bonjour, revenir et choisir Afrique + lion, sans recommencer son niveau.

### Phase 2 — Premier monde vivant (savane)
**Livrables :** savane avec points interactifs (point d'eau, arbre, ombre), lion adulte père et lionne mère, dialogues différenciés, archétype « besoin d'eau », déplacement simplifié, dialogue à trois degrés de difficulté, événement de fin mémorisé. Ajouter une seconde espèce savane (éléphant) pour prouver la reconfiguration sans copier toute la logique.
**Critère :** même notion `thirsty/water` utilisée avec lion et éléphanteau dans deux scènes réellement distinctes, et aucun objet introuvable.

### Phase 3 — Famille et bébé
**Livrables :** événement de famille, cinématique tendre/skip, premier bébé fille ou garçon nommé, dialogues en initiative bébé, deuxième bébé opposé, frères/sœurs, mémoires séparées, croissance avec quatre stades en données (au moins deux représentations visibles dans un premier temps), parents toujours actifs.
**Critère :** relancer application, retrouver les deux bébés nommés et leurs connaissances ; refuser troisième bébé proprement ; aucune croissance obtenue par simple clic répétitif.

### Phase 4 — Preuve multibiome
**Livrables :** Antarctique plus abouti (manchot/phoque), au moins un objectif pédagogique commun avec Afrique, mais scénario et objets propres ; validation de la compatibilité des archétypes ; test de cohérence habitat/espèce.
**Critère :** un changement de continent ne change pas le domaine pédagogique de l'enfant ; mission de banquise ne montre pas une savane ou une source d'eau désertique.

### Phase 5 — Beginner complet
**Livrables :** tous les domaines 1.1 à 1.8 jouables à travers plusieurs espèces et biomes, variété de mini-jeux, suivi de compétence, révisions, passeport et tableau parent, contenus EN/FR corrigés.
**Critère :** parcours de compétences Beginner réalisable de différentes manières, sans voyage forcé.

### Phase 6 — Intermediate et Expert
**Livrables :** domaines 2.1 à 3.8, dialogues plus riches et construction de phrases, aventures à étapes, mémoire de famille, mission globale finale et jeu libre persistant.
**Critère :** quêtes de complexité différente adaptées à l'enfant et aux bébés, aucune IA libre requise pour jouer.

### Phase 7 — Finitions et option parole avancée
Production des assets finaux 21 espèces, animations et cinématiques, audio final, accessibilité, optimisation, sauvegarde robuste, tests appareils. Reconnaissance vocale et IA conversationnelle seulement après étude de compatibilité, confidentialité et expérience réelle d'enfant.

## Matrice fonctionnelle — minimum testable
| ID | Test | Attendu |
|---|---|---|
| NAV-01 | Choisir n'importe quel continent en début de jeu | Tous accessibles ; au moins une interaction disponible |
| NAV-02 | Faire 1.1 en Afrique puis en Asie | Progrès 1.1 conservés, dialogues différents |
| NAV-03 | Quitter en cours de mission | Sauvegarde cohérente / reprise ou retour sans corruption |
| EDU-01 | Répondre par toucher, sans micro | Toutes les quêtes essentielles restent terminables |
| EDU-02 | Mot nouveau au niveau Beginner | Audio, image, répétition et aide facultative |
| EDU-03 | Répéter 10 fois le même item | Pas de validation indue de l'autonomie ni d'évolution forcée |
| EDU-04 | Réviser un mot acquis | Contexte inédit, suivi distinct |
| QUE-01 | Bébé éléphant a soif savane | Dialogue/contextualisation + trajet jusqu'au point d'eau |
| QUE-02 | Quête `waterhole` en Antarctique | Exclue si point d'eau de savane absent ; proposer autre quête compatible |
| QUE-03 | Archétype joué deux fois | Variante ou nouvelle activité suggérée |
| QUE-04 | Aucun template compatible | Fallback conversation/exploration valide, pas crash |
| FAM-01 | Rencontre papa/maman | Deux personnages différenciés, dialoguent |
| FAM-02 | Premier bébé garçon | Deuxième éventuel bébé fille uniquement |
| FAM-03 | Premier bébé fille | Deuxième éventuel bébé garçon uniquement |
| FAM-04 | Troisième bébé demandé | Impossible de créer un troisième, UI explicative |
| FAM-05 | Bébé pose question et reçoit réponse | Souvenir et compétence mis à jour |
| FAM-06 | Deux bébés ont connaissances différentes | Dialogues différents selon mémoire individuelle |
| FAM-07 | Bébé progresse à travers activités variées | Croissance paramétrée, déclenche la bonne cinématique |
| SEC-01 | Micro refusé | Interface normale, aucune erreur bloquante |
| SEC-02 | Pas de réseau après installation offline | Le cœur du jeu chargé demeure utilisable ; rien n'envoie des informations personnelles |
| UI-01 | Tablette tactile paysage | Zones de clic larges, pas de débordement du HUD |
| UI-02 | Enfant ne lit pas | Instructions orales/pictos disponibles partout |
| VIS-01 | Assets temporaires | Identifiés comme temporaires, remplacables sans réécrire moteur |

## Tests techniques nécessaires
- Unitaires : présélection de quêtes, graphes compétences, contraintes de famille, croissance, anti-répétition, persistance.
- Intégration : changer continent/animal, terminer une quête, créer un bébé, sauvegarder/restaurer, dialogue audio/texte.
- E2E : premier lancement -> carte -> continent -> animal -> mission -> récompense -> retour carte -> autre continent, sans micro.
- Vérificateur de contenus : valider références assets, langues, sous-titres, variables des dialogues, lieu et espèces compatibles, couverture minimale de contenu.
- Tests manuels sur tablette réelle : confort, longueur phrases, plaisir, fatigue, temps de chargement.

## Definition of Done par livraison
Chaque livraison doit inclure : fonctionnalité utilisable ; tests exécutés et résultats précis ; captures si possible ; chemin des fichiers ; commandes de lancement ; limites connues ; distinction entre placeholder et définitif ; prochain objectif. Aucun « terminé » sur la base d'un simple squelette ou d'une maquette non interactive.

## Hypothèses techniques à confirmer
React/TypeScript/Vite pour menus, Phaser pour scènes 2D, IndexedDB pour données locales versionnées, PWA comme mode installable. Les moteurs de texte/dialogue et de quêtes doivent fonctionner indépendamment du rendu. Aucun outil micro obligatoire : l'API Web Speech Recognition n'a pas une compatibilité universelle entre navigateurs et peut utiliser des services en ligne selon la configuration ; tester et limiter le traitement des voix d'enfants.

## Registre de décisions / ajouts
Toute fonctionnalité nouvelle sera notée dans `docs/ETAT_DU_PROJET.md` avec statut `proposé / validé / différé`, sans reconsidérer les choix déjà approuvés. Le voyage accompagné entre continents est **proposé mais non validé**.


---

# PREMIERE CONSIGNE CLAUDE CODE

# MESSAGE À COPIER DANS CLAUDE CODE

Tu es le directeur technique et développeur principal du projet **Animal English Adventure**.

J'ai déposé dans ce dossier les instructions permanentes `CLAUDE.md`, le cahier des charges, les règles du moteur pédagogique, le système des familles, la direction artistique, les critères d'acceptation et les données initiales.

**Lis réellement tous ces documents avant de décider de l'architecture.** Les spécifications ci-jointes sont notre source de vérité. Les décisions déjà validées ne doivent pas être rediscutées ni simplifiées silencieusement.

Commence maintenant le travail dans ce dépôt :
1. Inspecte le contenu existant et identifie ce qui est réutilisable. N'écrase pas un projet existant.
2. Établis une architecture minimale, modulaire et typée, puis crée/actualise `docs/ETAT_DU_PROJET.md`.
3. Si le dépôt est vide, initialise un projet exécutable React + TypeScript + Vite et un moteur de scène 2D adapté (Phaser si compatible avec la pile installée).
4. Livre une **première tranche verticale fonctionnelle**, et non une simple maquette : mappemonde interactive des 7 continents, sélection libre du continent et d'un animal, retour à la carte, premier dialogue audio anglais de salutations avec réponse tactile et sauvegarde locale. Chaque continent peut d'abord avoir un environnement provisoire identifié comme tel, mais tous doivent être sélectionnables.
5. Pose l'architecture réelle du moteur `skill -> biome -> species -> actor -> need -> quest template -> dialogue -> assessment -> memory`, avec au moins deux variantes exécutables du même objectif (deux animaux) et des tests de compatibilité.
6. Dans la tranche suivante, approfondis la savane : deux parents lions interactifs, une cinématique familiale douce, naissance/arrivée d'un bébé au choix, prénom, baby questionne la joueuse, progression de connaissances, puis second bébé de l'autre sexe, et exemple de mission de recherche d'eau. Prépare le modèle à quatre stades, même si tous les assets graphiques définitifs ne sont pas encore disponibles.
7. Utilise des assets provisoires originaux ou des formes simples si les références graphiques ne sont pas encore déposées. Ne bloque jamais le prototype en inventant des visuels prétendument définitifs ; indique les fichiers manquants dans un inventaire.
8. Écris des tests sur les règles critiques : sélection libre, progression indépendante du continent, cohérence espèce/habitat, unicité des deux bébés et sexes opposés, sauvegarde, absence de blocage micro, anti-répétition.
9. Exécute les commandes de compilation et de tests, corrige les erreurs, puis donne : ce qui marche, comment lancer le jeu, la liste précise des fichiers créés, les résultats des tests, les limites et le prochain jalon.

**Priorité absolue :** préserver la liberté d'exploration, les familles vivantes, la qualité des échanges anglais et la réutilisation des missions. Pas de parcours linéaire géographique, pas de générateur de phrases arbitraires, pas d'IA générative libre au lancement.

Travaille effectivement dans les fichiers du projet. Ne te limite pas à me rendre un nouveau plan théorique.

