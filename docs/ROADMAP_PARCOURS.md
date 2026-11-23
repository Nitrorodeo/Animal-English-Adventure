# Parcours : anomalies, croissance et feuille de route

Snapshot du **2026-11-23**. À valider par le parent avant toute production.
Le détail décor par décor est dans `docs/CARTOGRAPHIE_PARCOURS.md`.

## 1. Point de départ vérifié

- **Sauvegarde.** Commit `83d6d21` du 2026-11-23 : tout le travail précédent.
- **Tests du 2026-11-23.**
  - Vitest : 390 sur 393 réussis. Les 3 restants attendent la fin de la génération des voix.
  - Typage OK, construction OK, 38 tests Python OK.
  - Banc de fluidité : 60 images/s sur toutes les espèces et tous les décors.
- **Nouveau test `src/engine/croissance.test.ts`** : 64 tests réussis, non commité (voir § 3).
- **Voix.** La génération Kokoro (locale et gratuite) des phrases déjà écrites est en cours : 10 107 sur 15 055.
- **Rien n'a été modifié** dans les parcours, les images ou les voix depuis la demande de validation.

## 2. Ce qui fonctionne et ne doit pas bouger

| Élément | Règle actuelle (code) | Décision |
|---|---|---|
| Niveau débutant | `OPTION_COUNT.beginner = 2` réponses. Archétypes et mécaniques existants : `talk`, `guide`, `fetch`, `teach`, `count`, `identify`, `locate`, `observe`, `compare`, `sort`, `build`, `puzzle`, `plan`, `social`, `tell`. | **Intouchable.** Un test « garde-fou » figera les scripts débutant actuels (§ 6, étape 0). |
| Intermédiaire | 3 réponses. Le jeu y passe tout seul dès que les mots d'un jeu sont acquis (`chooseTier`). Le parent peut forcer le niveau (`levelOverride`). | On l'enrichit. |
| Expert | Il existe dans le code. `chooseTier` y passe tout seul après l'intermédiaire. | **Conservé tel quel** (ordre du parent du 2026-11-23 : « Le niveau expert existe déjà. Il doit être conservé. ») : ni supprimé, ni masqué, ni bloqué. |
| Croissance | Voir § 3. | Inchangée : aucun défaut constaté dans les règles. |

## 3. Les quatre personnages et la croissance des bébés

### Règles réelles (src/engine/family.ts, events.ts, state.ts)

- **Chaque famille a 4 personnages.**
  - Papa et Maman : apparence fixe, prénoms dans `species.ts`, par exemple Leo et Lola.
  - Bébé fille et Bébé garçon : ils naissent en jeu, après une courte scène familiale.
    - Le premier a le sexe choisi par la joueuse, le second l'autre sexe, au maximum 2 (`MAX_BABIES`).
    - La joueuse donne le prénom, filtré par `sanitizeName` (18 caractères au plus).
- **Quatre phases** : `newborn` → `little` → `young` → `companion`. Les phases sont des images du même bébé, jamais un personnage en plus.
- **La croissance vient de l'apprentissage, pas du temps.** Seuils validés le 2026-11-19 :

  | Phase | Items réussis avec le bébé | Mots retenus | Activités différentes |
  |---|---|---|---|
  | little | 6 | 2 | 2 |
  | young | 16 | 6 | 5 |
  | companion | 30 | 12 | 9 |

  - Un *mot retenu* est un mot que la joueuse a enseigné au bébé et qui a été revu plus tard.
  - Les trois conditions doivent être remplies. Le stade ne recule jamais.
- **Qui progresse.** Le bébé qui joue progresse, ainsi que son frère ou sa sœur s'il parle dans la scène. Quand on joue un parent, les bébés qui parlent progressent aussi. Chaque bébé a ses propres mots appris et retenus, sa mémoire et sa personnalité.
- **Sauvegarde.** La progression est enregistrée par famille, dans `state.families[espèce]`, avec la clé `aea.save` et la version 2. Elle ne dépend pas du décor : on retrouve le même bébé au même stade dans chacun des trois décors de sa famille. Chaque famille a ses propres bébés.

### Ce que les tests vérifient (src/engine/croissance.test.ts, 2026-11-23)

Pour **chacune des familles jouables**, avec les vraies activités du jeu :
1. Les seuils sont ceux du 2026-11-19 et l'ordre des phases est respecté.
2. Les images existent :
   - Papa, Maman et les 4 phases × 2 sexes sont présents dans `public/` ;
   - chaque bébé a 4 images différentes, pour que la croissance se voie.
3. **Évolution progressive** : la fille joue en tournant sur tous ses décors, et elle passe par les 4 phases une à une, sans sauter ni reculer.
4. **Sauvegarde** : à chaque nouvelle phase, la partie est sauvegardée, relue et retrouvée identique.
5. **Changement de décor** : la phase est conservée et des activités restent disponibles dans l'autre décor.
6. **Indépendance** :
   - quand la fille grandit, le garçon n'apprend aucun de ses mots et n'atteint pas `companion` ;
   - quand le garçon joue, il grandit avec ses propres mots, et sa sœur ne bouge pas.

**Résultat : 64 tests réussis.** Un seul défaut réel est apparu, et il est graphique, pas dans les règles :

> **Lion.** Les bébés lions n'ont qu'une image par sexe (`lion_girl`, `lion_boy`), simplement agrandie avec l'âge. Les 4 phases ne se voient donc pas.
> La planche `Animaux/Afrique/Lions/Famille de lions en évolution.png` contient bien les 4 phases × 2 sexes. Il faut la découper en `lion_girl_<phase>` et `lion_boy_<phase>`.
> Le test tolère ce cas (`ONE_SPRITE_ONLY = ['lion']`). Il devra l'exiger une fois l'image découpée.

Les 20 autres familles terrestres ont leurs 10 images (père, mère, 4 phases × 2 sexes) dans `src/content/assetManifest.json` et `public/assets/characters/`.

Sans incidence :
- les trous constatés dans certains dossiers sources (`Animaux/…`) n'affectent pas le jeu ;
- les doublons du paresseux : on garde ceux du sous-dossier `paresseux/`, qui sont ceux utilisés par le jeu.

### Océan : ce qui manque (à traiter après les continents)

- Aujourd'hui, baleine, dauphin et tortue **ne sont pas des familles**. Ce sont des jeux bonus (`src/content/sea.ts`, `src/engine/sea.ts`, `SeaBonus.tsx`), sans bébé ni croissance.
- Chaque image déposée montre **un adulte et un petit**, de sexe indéterminable :
  - `Animaux/Ocean map/Baleine/Baleines à bosse complices.png` ;
  - `…/Dauphin/Dauphins joyeux dans l'océan.png` ;
  - `…/Tortue/Tortues de mer joyeuses en nageant.png`.
- Sans rien inventer, on peut donc faire **2 personnages par famille** : un adulte et un petit, sans phases.
- **Images manquantes pour une famille complète : 10 par famille, 30 au total.**

  | Famille | Fichiers à créer dans `public/assets/characters/` |
  |---|---|
  | Baleine (`whale`) | `whale_father`, `whale_mother`, `whale_girl_newborn`, `whale_girl_little`, `whale_girl_young`, `whale_girl_companion`, `whale_boy_newborn`, `whale_boy_little`, `whale_boy_young`, `whale_boy_companion` |
  | Dauphin (`dolphin`) | les mêmes 10 noms avec `dolphin_` |
  | Tortue (`sea_turtle`) | les mêmes 10 noms avec `sea_turtle_` |

- **Conséquence si on joue sans ces images.** Le calcul de croissance fonctionnerait, car il ne dépend que de compteurs. Mais il n'y aurait rien à montrer. Il faudrait alors un mode « famille sans croissance » : pas de scène de naissance, pas de barre de croissance, et seulement un adulte et un petit à afficher.
- **Recommandation : attendre les 30 images** plutôt que de créer un mode à part.

## 4. Anomalies consolidées : chemins exacts

Le détail et les conséquences sont à la fin de chaque zone, dans `docs/CARTOGRAPHIE_PARCOURS.md`.

### 4.1 Images : à fournir, à refaire ou à arbitrer par le parent

| # | Fichier | Problème | Ce qu'il faudrait |
|---|---|---|---|
| A1 | `Animaux/Amerique du Nord/Ours_Bruns/03_Taniere_hivernale.png` | 763×506 au lieu de 1672×941, et un ratio différent : floue et mal cadrée dans le jeu. | Une nouvelle image en 1672×941. |
| A2 | `Animaux/Ocean map/Baleine/Cathédrale de glace sous-marine-2.png` et `…/Panorama sous-marin de l'Antarctique-1.png` | Même scène, recadrée. | Un 2e fond baleine vraiment différent. |
| A3 | `Animaux/Ocean map/Tortue/Canyon sous-marin aux rayons turquoise.png` et `…/Dauphin/Paradis sous-marin lumineux pour dauphins.png` | Même composition, palette différente. | Un autre fond tortue, par exemple un herbier. |
| A4 | `Animaux/Oceanie/Koalas/Image ChatGPT 21 nov. 2026, 07_56_41-4.png` (`oc_rocky_cove`) et `Animaux/Oceanie/Lezards_A_Collerette/04_Cote_tropicale.png` (`oc_beach`) | Même plage : sable en courbe, mer turquoise, rochers orange. | Un autre 3e décor pour le koala (il ne nage pas : forêt, rivière à gommiers…), ou garder la crique et différencier par l'histoire. |
| A5 | 30 images marines (§ 3) | Pas de père, mère ni phases. | À fournir pour faire de vraies familles. |
| A6 | `Animaux/Afrique/Lions/Famille de lions en évolution.png` | Planche non découpée : pas de phases visibles. | Découper la planche en 8 images de bébés (je peux le faire, avec votre accord). |

### 4.2 Ressemblances à compenser par l'histoire (pas bloquant)

- **Girafe.** `Animaux/Afrique/Girafes/Image ChatGPT 19 nov. 2026, 09_00_00-5.png` et `…/Image ChatGPT 22 nov. 2026, 09_50_57-3.png` : même chemin et mêmes termitières, seule la saison change.
- **Éléphant et girafe.** La mare de l'éléphant (`…/Elephants/Image ChatGPT 22 nov. 2026, 09_50_19-1.png`) ressemble à celle de la girafe (`africa_waterhole`).
- **Renard et hérisson.** `Animaux/Europe/Renards/02_Sous_bois_automnal.png` a la même composition que `Animaux/Europe/Herissons/Clairière enchantée au ruisseau scintillant.png`.
- **Panda et tigre.** `asia_garden` ressemble à `asia_pagoda` (cascade, bassin, pont, lanternes), mais les deux restent distinguables.
- **Phoque et manchot.** Le décor aurore du phoque ressemble à la grotte du manchot. `ice_coast` (ours polaire) est proche de `open_sea` (manchot).
- **Bison.** La prairie et l'alpage se ressemblent.
- **Ours et castor.** Les séquoias de l'ours ressemblent à ceux du castor.

### 4.3 Images à ne pas utiliser (on les garde, on ne les intègre pas)

- `Animaux/Image ChatGPT 22 nov. 2026, 09_50_52-1.png` : savane orpheline, à la racine. C'est presque un doublon de la plaine de l'éléphant. Elle n'est pas intégrée sans votre décision.
- `Animaux/Amerique du Sud/Toucans/Famille de toucans en pleine croissance.png` : un autre dessin de toucan, différent du jeu.
- `Animaux/Amerique du Sud/Paresseux/*.png` à la racine du dossier : ce sont des doublons recadrés, le jeu utilise ceux de `paresseux/`.

### 4.4 Incohérences de code à corriger pendant la production

- **Décors autorisés (`allowedBiomes`, `src/content/species.ts`) à aligner sur le tableau de la cartographie.**
  - Le **jaguar** n'a pas `sa_andes`, qui est pourtant son image.
  - Le **koala** a encore `oc_beach`.
  - La **girafe** a un filtre canyon devenu inutile.
  - **Décors partagés à séparer** : ours et castor, jaguar et paresseux, les trois familles d'Antarctique, kangourou et lézard.
  - **Le tigre** n'a pas `asia_pagoda` ni la cascade.
  - **Le bison, l'éléphant, le kangourou, le phoque et toute l'Europe** pointent sur des décors qui ne sont pas les leurs.
- **Décors qui sortent de tous les parcours.** Les images et leurs fichiers restent : on ne supprime rien.
  - Liste : `savanna`, `europe_forest`, `europe_farm`, `europe_alps`, `europe_lake`, `europe_coast`, `na_prairie`, `na_desert`, `na_coast`, `sa_jungle`, `sa_waterfall`, `oc_fern_forest`.
  - Les mots et les jeux qui y vivaient sont listés dans chaque zone et seront replacés dans les nouveaux décors : `pick_apples`, `beach_shells`, `who_in_water`, `echo_canyon`, `follow_tracks`, `race`, mots spray et pool…
- **Aventures à repenser** quand les décors seront séparés : `src/content/adventures/{asia,antarctica,oceania,europe}.ts` démarrent des espèces dans des décors qui ne seront plus les leurs.
- **Jeux à adapter.**
  - `seal_whiskers` exige de la neige : les rochers et la plage du phoque n'en ont pas.
  - `owl_night` ajoute une lune sur un décor déjà nocturne.
  - `bear_honey` n'a pas de sens dans la tanière enneigée.
  - Le jeu bonus tortue cherche un crabe, un coquillage et une pieuvre, absents des fonds marins.
- **Nourriture.** Le décor 3 du toucan montre des mangues. Faut-il ajouter `mango` à ses aliments ?
- **Petits défauts.**
  - Miroirs : `na_beaver_pond`, `sa_wetland` et `oc_rocky_cove` sont inversés par rapport à l'image déposée. On garde la version du jeu, et les zones à toucher suivent cette version.
  - Chemins `source` erronés : « Continant/Asie », « Continant/Antartic ».
  - `asia_garden` n'a qu'une lanterne zonée alors que l'image en montre deux.
  - Zones trop petites pour un doigt, à agrandir ou à éviter au débutant : fleurs, cailloux, étoiles, glaçons.
  - Les nouveaux décors d'eau doivent marquer leurs zones `water`.

### 4.5 Voix : un risque constaté

`tools/tts/generate_voices.py` nomme chaque fichier d'après sa voix et son texte. **Une phrase inchangée n'est donc jamais régénérée** : seuls les textes nouveaux coûtent du temps.

En revanche, à la fin de chaque génération, le script **supprime les mp3 dont le texte n'existe plus**. Ceux qui sont déjà commités restent récupérables dans git, mais pour préserver vraiment les voix, il faudra **archiver au lieu de supprimer** (étape 0).

## 5. Ce qui attend votre décision

1. **Océan.** Attendre les 30 images de famille (recommandé), ou jouer avec seulement un adulte et un petit, sans croissance ?
2. **Images à remplacer** : A1 (tanière de l'ours), A2 (2e fond baleine), A3 (fond tortue), A4 (3e décor du koala). Fournissez-vous de nouvelles images, ou gardons-nous les actuelles en les différenciant par l'histoire ?
3. **Lion** : puis-je découper la planche en 8 images de bébés (A6) ?
4. **Décors sortants** (§ 4.4) : on les retire des parcours sans supprimer les fichiers. D'accord ?
5. **Toucan** : ajouter la mangue à ses aliments ?
6. **Ordre de production** proposé ci-dessous, Afrique d'abord.

## 6. Feuille de route de production

Chaque étape se termine par :
- les tests ;
- une vérification à l'écran : capture de chaque décor, sans débordement ni zone trop petite ;
- la mise à jour de `docs/ETAT_DU_PROJET.md` ;
- un commit.

La publication en ligne n'a lieu qu'avec votre accord.

**Étape 0 — Socle, sans rien changer de visible pour l'enfant**
- **Garde-fou débutant.** Un test fige les activités débutant actuelles : mécanique, 2 réponses, longueur des phrases, mots employés. Toute nouvelle phrase débutant doit rester dans ces bornes.
- ~~Plafond des niveaux~~ : abandonné. L'expert est conservé tel quel (ordre du parent du 2026-11-23).
- **Voix.**
  - Le script archive les voix au lieu de les supprimer.
  - Un mode « comparaison » compte, avant de générer, les phrases déjà vocalisées, les nouvelles et les retirées.
  - Aucune génération sans ce compte.
- **Une famille = ses décors.** Un test vérifie que chaque famille a exactement ses 3 décors, que chaque décor appartient à une seule famille, et que chaque image est la bonne.

**Étapes 1 à 7 — Une zone à la fois**, toujours dans le même ordre pour chaque zone :
1. Intégrer les décors nouveaux : image, zones à toucher, profondeur, eau, sol pour poser les objets. Les images validées ne sont pas modifiées.
2. Aligner `allowedBiomes` et replacer les mots et jeux des décors sortants.
3. Écrire l'histoire et le vocabulaire de chaque décor, avec des mots propres et des mots réutilisés.
4. Débutant : ajouter les interactions de chaque personnage avec les mécaniques existantes, sous le garde-fou.
5. Intermédiaire : ajouter les interactions de chaque personnage, sur 3 réponses : positions, comparaisons, actions, mémoire.
6. Adapter les aventures et les jeux concernés.
7. Voix : lancer la comparaison, puis générer seulement les phrases nouvelles.

| Étape | Zone | Volume |
|---|---|---|
| 1 | **Afrique** (zone pilote, à tester avec l'enfant avant de continuer) | 4 décors nouveaux ; lion découpé |
| 2 | Amérique du Nord | 5 nouveaux ; tanière (A1) |
| 3 | Amérique du Sud | 3 nouveaux ; jaguar `sa_andes` |
| 4 | Asie | 3 nouveaux |
| 5 | Antarctique | 4 nouveaux ; jeu du phoque |
| 6 | Europe | 9 nouveaux : la plus grosse zone |
| 7 | Océanie | 3 nouveaux ; plage du koala (A4) |
| 8 | **Océan**, après les continents | Selon votre décision sur les 30 images |

Après l'Afrique, les zones suivantes s'enchaînent sans attendre (demande du parent du 2026-11-23 : « Une fois que tu as fini l'Afrique, si tout est OK, tu enchaînes sur les autres continents »). Les zones suivantes reprennent exactement le même modèle.

## 7. Est-ce faisable ?

Oui pour les 63 décors terrestres. Chacun a sa fiche avec ce qu'on voit, une histoire et des interactions pour les 4 personnages aux 2 niveaux.

Les limites sont dites telles quelles :
- **Océan.** On ne peut pas faire de vraies familles sans les 30 images.
- **Quatre couples de décors très proches** (A1 à A4) : on peut les différencier par l'histoire, mais de nouvelles images seraient meilleures.
- **Les phrases proposées seront revues une à une en production.** Le garde-fou débutant écartera tout ce qui dépasserait le niveau validé.
