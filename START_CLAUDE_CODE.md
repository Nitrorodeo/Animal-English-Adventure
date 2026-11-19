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
