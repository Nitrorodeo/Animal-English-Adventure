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
