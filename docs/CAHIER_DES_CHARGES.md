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
| Amérique du Sud | Forêt tropicale / fleuve | jaguar, toucan, paresseux (remplace le capybara, décision du parent du 2026-11-19) | jungle, rain, fruit, waterfall, wet, river | chercher des fruits, décrypter un indice, suivre le fleuve |
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
