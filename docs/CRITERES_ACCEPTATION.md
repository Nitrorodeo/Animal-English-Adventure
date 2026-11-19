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
