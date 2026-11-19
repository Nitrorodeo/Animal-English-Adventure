# État du projet — Animal English Adventure

*Mis à jour le 2026-11-19 à 18 h 45 — **Album de famille, autocollant du jour, bonne nuit** (demande du parent : « fais les 3 idées ») ; les « z z » du sommeil s'affichent enfin. 153 tests.*

*Mis à jour le 2026-11-19 à 18 h 30 — **Cinématiques et finitions** : naissance animée (parents et bébés en marionnettes, cœurs, paquet surprise qui tremble, éclat et confettis), carte « grandit » avec le bébé à son nouveau stade, étoiles une à une et confettis en fin d'activité, carte du lieu pendant les voyages, écran titre soigné. **Parties copiées sur l'ordinateur** et reprises automatiquement par la tablette (section ci-dessous).*

*Mis à jour le 2026-11-19 à 17 h 35 — Code envoyé sur le dépôt GitHub **privé** `Nitrorodeo/Animal-English-Adventure`. **Hébergement en ligne abandonné pour l'instant** (décision du parent : dépôt privé, pas de GitHub Pages). La tablette joue sur le Wi-Fi via l'ordinateur.*

*Mis à jour le 2026-11-19 à 17 h 10 — **Jeu installable et jouable sans internet** (PWA), **bandeau du lieu** qui suit l'aventure, **boutons premium**, **bulle des questions déplaçable**, point d'appui dans la zone humide d'Amérique du Sud.*

*Mis à jour le 2026-11-19 à 16 h 50 — **Contrôle des nouvelles familles en jeu** (hibou, hérisson, castor, bison, paresseux) et **tailles par espèce** : les petits animaux ne sont plus aussi grands qu'un lion.*

*Mis à jour le 2026-11-19 à 16 h 30 — **Tous les personnages animés** (marionnettes), **5 nouvelles familles dessinées** (ours, bison, castor, hibou, hérisson), **paresseux à la place du capybara**.*

*Mis à jour le 2026-11-19 à 14 h 40 — **Une aventure par lieu en Afrique** : 3 nouvelles aventures (point d'eau, baobab, canyon) ; l'aventure du lieu où l'on est passe en tête du menu ; nouveau jeu de Papa au baobab « Catch the leaves! ». L'Afrique a maintenant 7 aventures et 12 jeux propres.*

*Mis à jour le 2026-11-19 à 13 h 20 — **Pilote Afrique** : 11 nouveaux jeux propres aux décors, jeux différents pour Papa, Maman et les bébés, croissance des bébés qui débloque des jeux (section ci-dessous). Les autres continents gardent les jeux V2.*

*Mis à jour le 2026-11-19 à 12 h 30 — **V2 : composition du jeu** (27 aventures sur les 7 continents, 15 jeux, voyages entre lieux d'un même continent, trésors, objets à toucher, cache-cache). Demande du parent : « passe à la V 2 […] Chaque continent doit avoir son propre vocabulaire et ses propres aventures ». Dessins des personnages manquants : à fournir par le parent. Le jeu n'est PAS terminé.*

## Lancer le jeu

```bash
npm install          # une seule fois
npm run dev          # puis ouvrir http://localhost:5173
npm test             # 153 tests
npm run build        # version statique dans dist/ (+ dist/sw.js pour le hors-ligne)
npx vite preview --port 4173   # sert dist/ : seule version où le hors-ligne est actif
npm run assets       # après chaque dépôt d'images dans Animaux/
npm run voices       # après chaque ajout ou changement de phrase anglaise
```

## Album de famille, autocollant du jour, bonne nuit (2026-11-19, 18 h 45)

Demande du parent : « fais les 3 idées ». Testé en taille tablette (1024 × 768) avec une partie fictive, ensuite effacée (navigateur et `saves/`).

- **Album de famille** (passeport, section 📸) : une photo à la naissance (papa, maman et le bébé dans le décor de la famille) et une à chaque stade atteint. Rien n'est stocké en plus : l'album se déduit des bébés (`src/engine/album.ts`), donc les parties déjà commencées ont aussi leurs photos. Toucher une photo la fait lire (« Welcome to our family, … » / « … is a little explorer now! »). Flash d'appareil photo et pastille « 📸 Photo dans l'album ! » à la fin de la naissance et sur la carte « grandit ».
- **Autocollant du jour** (`src/engine/stickers.ts`) : après la **première** activité terminée de la journée (horloge de l'appareil), l'enfant choisit 1 autocollant parmi 3 (16 en tout, les 3 derniers choisis ne reviennent pas). Il est collé sur la carte du monde, sur le continent où elle jouait ; toucher un autocollant le fait remuer et dire son nom. 40 gardés au plus. Aucun compteur de jours, aucune perte si elle ne joue pas. Sauvegarde : `player.stickers` et `player.stickerDay`, remplis par défaut pour les anciennes parties (pas de changement de version).
- **Bonne nuit** (bouton 🌙 en haut à gauche de l'habitat, `src/engine/bedtime.ts`) : le ciel s'assombrit (lune, étoiles qui scintillent) ; maman dit « Good night, <prénom>! », chaque bébé « Good night, Mummy! Good night, Daddy! », papa « Sweet dreams, everyone! », puis toute la famille dort (« z z »). Le gros bouton ☀️ « Good morning! » réveille la famille à tout moment. Pas de lune ajoutée dans les scènes de nuit des aventures (« Touche la lune ! » resterait sans ambiguïté).
- **Défaut corrigé** : les « z z » du sommeil restaient invisibles (opacité 0 jamais animée), y compris dans les aventures ; ils montent et s'effacent maintenant.
- Voix : 18 nouvelles phrases enregistrées (`npm run voices`) ; tests : chaque légende, autocollant et phrase du coucher a son enregistrement.

## Cinématiques, finitions et parties copiées sur l'ordinateur (2026-11-19, 18 h 30)

Demande du parent : « Je serai toujours connecté au Wifi […] faut juste qu'elle puisse y jouer de la tablette et avoir toutes ces parties en mémoire. Je veux juste que tu optimises encore le jeu, refais un tour […] améliorer les cinématiques, les designs […] il faut que ça reste facile pour une enfant de 7 ans ».

- **Naissance** (`src/ui/FamilyEvent.tsx`) : fond opaque (on ne voit plus le décor et les boutons au travers), halo qui tourne lentement ; parents et bébés **animés** par leurs marionnettes (`src/ui/LiveSprite.tsx`, image fixe si WebGL manque) ; la maman parle à l'intro, le bébé quand il dit bonjour ; cœurs qui montent, paquet « ? » qui tremble comme un œuf, **éclat de lumière + confettis** à « It's a boy/girl! », confettis et cœurs à la fin. Décisions dans `src/ui/fx.ts` (testé).
- **Carte « grandit »** : le bébé à son nouveau stade, animé, sur des rayons de soleil, avec confettis ; les nouveaux jeux en pastilles sur plusieurs colonnes (la carte tient dans l'écran même avec 8 jeux).
- **Fin d'activité** : les 3 étoiles arrivent une à une, confettis sur toute la scène.
- **Voyage** : une carte « 🧭 the waterhole · la mare » s'affiche au centre pendant le changement de lieu (vocabulaire du lieu).
- **Écran titre** : titre doré, un animal par continent qui se balance, bouton Play qui pulse.
- **Correctif** : la scène (et la naissance) ne peut plus « défiler » quand un décor dépasse (`overflow: clip`) ; avant, un effet qui dépasse pouvait faire remonter la bulle au milieu de l'écran.
- **Parties copiées sur l'ordinateur** (`src/engine/backup.ts` testé, `tools/save/savePlugin.mjs`, `src/ui/useGame.ts`) : la sauvegarde de la tablette reste dans le navigateur ET une copie est envoyée au PC (`saves/save.json`, + une copie par jour dans `saves/historique/`), 1,5 s après chaque changement. Si la tablette ouvre le jeu sans partie (adresse du PC changée, navigateur vidé), elle **reprend toute seule** la copie du PC (« ✓ Partie retrouvée sur l'ordinateur » sur l'écran titre). « Effacer la partie » range la copie dans l'historique (rien n'est détruit). `saves/` n'est pas envoyé sur GitHub. Sans le serveur du PC, tout échoue en silence.
  - Limite : une seule copie pour tout le foyer ; si un autre appareil joue aussi, la copie est celle du dernier appareil qui a joué (les copies du jour restent dans l'historique).
  - Conseil : réserver une adresse fixe pour le PC dans la box et garder le même favori sur la tablette.
- Vérifié à l'écran (tablette 1024 × 768) : naissance complète (parents et bébé animés, éclat, confettis), aventure « The big thirst » (carte du lieu, étoiles, 30 confettis), carte « grandit » de Kiara (marionnette active, tout tient dans l'écran), copie envoyée puis reprise après effacement du navigateur ; aucune erreur console. Données de test supprimées ensuite (`saves/` vidé).

## Publication GitHub (2026-11-19, 17 h 35) — dépôt privé, hébergement abandonné pour l'instant

- Dépôt **privé** `Nitrorodeo/Animal-English-Adventure`, branche `main` (un seul envoi, le 2026-11-19). GitHub Pages n'est pas disponible pour un dépôt privé en offre gratuite et le parent ne veut pas le rendre public : **pas de jeu en ligne**. `.github/workflows/deploy.yml` reste prêt mais ne sert à rien tant que Pages n'est pas actif.
- Aucun nouvel envoi sans accord explicite du parent.
- **Pas dans le dépôt** (`.gitignore`) : `Animaux/`, `Continant/`, `Decors/` (dessins sources, ≈ 210 Mo, gardés sur le PC : le jeu utilise les versions préparées de `public/`), moteur de voix `tools/tts/.venv` et `models/`, `node_modules/`, `dist/`, `.claude/`, l'archive `.zip`. `npm run assets` et `npm run voices` ne fonctionnent donc que sur ce PC.
- Confidentialité : aucune donnée de l'enfant n'est en ligne (prénoms et progression restent dans l'appareil) ; son prénom a été retiré des tests et le pseudonyme du parent remplacé par « le parent » dans les fichiers publiés.
- Vérifié avant envoi : copie neuve du dépôt → `npm ci`, 131 tests, construction OK ; servie dans un sous-dossier comme GitHub Pages (sensible aux majuscules) → aucun fichier manquant, 7 608 médias téléchargés, jeu jouable serveur coupé.

## Hors-ligne, bandeau, boutons, bulle déplaçable (2026-11-19, 17 h 10)

Demande du parent : « 1. oui met en place 2. attends de tous les avoirs 3. ameliore le bandeaux , rends les bouton plus prenium et surtout que lon puisse deplacer la fenetre des question car fixe 4. fait le ». Le point 2 (queues animées) attend que tous les dessins soient déposés.

- **Hors-ligne installable (PWA)** : `public/manifest.webmanifest` (plein écran, paysage, icônes Leo dans `public/icons/`), service worker sans dépendance généré par `npm run build` (`tools/pwa/build_sw.ts` + `tools/pwa/sw-template.js` → `dist/sw.js`). Les 8 fichiers de démarrage sont mis en cache à l'installation ; les ≈ 7 600 dessins et voix (≈ 175 Mo) se téléchargent en arrière-plan, images d'abord. Chaque fichier porte une empreinte : une mise à jour ne retélécharge que ce qui a changé. Audio servi en 206 (requêtes Range). Avancement visible dans l'espace parents, section « Jouer sans internet ». Logique testée dans `src/pwa/*.test.ts`.
  - Vérifié : `npm run build` puis `npx vite preview`, téléchargement complet, serveur arrêté, page rechargée → jeu, décor, marionnettes et voix fonctionnent.
  - **Limite** : un service worker n'existe qu'en https ou sur `localhost`. Sur la tablette via l'adresse locale du PC en http (port 5173), le hors-ligne est indisponible. Le parent a indiqué le 2026-11-19 que la tablette est toujours sur le Wi-Fi : le hors-ligne n'est pas nécessaire pour l'instant.
- **Bandeau** : pilule avec vignette du décor + icône de l'espèce, nom anglais du lieu, continent (+ nom français si l'aide française est activée) ; toucher = le nom est lu. Il suit maintenant le lieu de l'aventure en cours (`onWhere` dans `Habitat.tsx`).
- **Boutons premium** : barre du haut en bois, boutons ronds dorés en relief, boutons d'action dorés (verts pour valider), Family rose, cartes-réponses et vignettes de lieux qui se soulèvent au survol (`src/styles.css`).
- **Bulle des questions déplaçable** au doigt ou à la souris (`src/ui/drag.ts`, `DialogueBox.tsx`) : poignée en haut, reste toujours entière dans la scène, un simple toucher reste un toucher (seuil 6 px), les réponses se choisissent normalement, la position est gardée d'une réplique à l'autre. Le texte ne se sélectionne pas pendant le glisser. Vérifié dans le navigateur.
- **Zone humide** (`sa_wetland`) : points d'appui eau, nénuphar, fleur de nénuphar, rocher ; 22 voix ajoutées (`npm run voices`). Test : chaque lieu a au moins un point d'appui.
- Tests : `npm test` **131 / 131** ; `npx tsc -b` 0 erreur ; `npm run build` OK.

## Tous les personnages animés + 5 nouvelles familles + paresseux (2026-11-19, 16 h 30)

Demandes du parent : « c'est très bien, on va laisser comme ça […] Je veux que tous les animaux aient leurs propres petites animations » ; « Je t'ai ajouté plein d'autres animaux » ; « On va remplacer le capybara par un paresseux pour l'Amérique du Sud ».

- **Nouvelles familles dessinées** (10 dessins chacune, décompressées dans `Animaux/`) : ours brun (`Ours_Bruns/`), bison (`Bisons/`), castor (`Castors/`), hibou (`Hiboux/`), hérisson (`Herissons/`). Déclarées dans `tools/asset_sources.json`, `npm run assets` : **114 personnages**. Les paquets `Pack_Renards…` et `Pack_Pandas_Roux…` sont identiques aux renards et pandas roux déjà intégrés.
- **Paresseux à la place du capybara** : `sloth` (Nico et Nina, 🦥, mange des feuilles, grimpe et nage, jungle, rivière, cascade, étang) dans `species.ts`, accueil dans `activities/basic.ts`, les 3 aventures d'Amérique du Sud du capybara, `data/species.json`, cahier des charges. Pas encore de dessins : pictogramme. Voix enregistrées (`npm run voices`).
- **Chaque personnage est une marionnette animée** (respire, hoche la tête en parlant, marche, boit) :
  - squelette calculé sur la silhouette par `python tools/auto_rigs.py` → `src/game/autoRigs.json` (**à relancer après chaque `npm run assets`**) ; Leo garde son squelette réglé à la main (`src/game/rigs.ts`) ;
  - pattes qui bougent : parents debout de profil (ours ×2, bison ×2, panda roux ×2, renard, tigre, girafe), placées à l'œil dans `LEGS` de `tools/auto_rigs.py` — l'ombre dessinée au sol relie les pieds et empêche de les détecter ;
  - les autres (assis, de face, bébés) se dandinent et sautillent en marchant ; pour boire, ils baissent la tête plus doucement que Leo (`drinkDip`).
  - Atelier : http://localhost:5173/?lab&sp=bear (une espèce à la fois : chaque personnage ouvre un contexte WebGL).
- Constaté dans le navigateur : atelier pour ours, bison, tigre, girafe, hibou, éléphant, panda roux, hérisson (repos, marche, boire, parler) ; famille ours animée dans la forêt de séquoias.
- Tests : `npm test` **115 / 115** (dont : tous les personnages ont un squelette ; aucun ne sort de son cadre dans aucune animation ; dandinement sans pattes) ; `npm run build` OK.
- Limites : animation par déformation d'un dessin unique (validée par le parent pour cette version, amélioration prévue dans une version ultérieure) ; pas de queue animée pour les squelettes automatiques ; Lola et les lionceaux n'ont pas de pattes animées.

## Tailles par espèce + contrôle en jeu (2026-11-19, 16 h 50)
- Vérifié dans leur décor : hiboux et hérissons (forêt d'automne, Europe), castors (lac de montagne) et bisons (grande prairie, Amérique du Nord). Tous animés, dans le cadre.
- Corrigé : toutes les espèces avaient la taille du lion (le hérisson était aussi grand que le hibou). `ADULT_HEIGHT` dans `src/ui/scene.ts` règle maintenant la taille de chaque espèce (hérisson 22, castor 27, hibou 28, panda roux 29, renard et paresseux 30, lion et tigre 34, ours, bison et panda géant 36, éléphant 44, girafe 54) ; les bébés suivent la taille de leurs parents. Minimum 22 % de la scène pour rester facile à toucher. Test ajouté dans `src/ui/scene.test.ts`.
- Paresseux : pictogramme 🦥 tant que ses dessins ne sont pas déposés dans `Animaux/`.
- Bison : le père et la mère se chevauchent un peu (dessins très larges), sans sortir du cadre.

## Leo animé au point d'eau (2026-11-19, 15 h 05) — validé par le parent (« c'est très bien, on va laisser comme ça »)
- Demande : « Tu peux essayer de faire une vraie animation avec ce décor ». Essai sur Leo (`lion_father`) seulement.
- Technique : le dessin unique de Leo est posé sur une grille déformable (squelette de 8 os : corps, tête, queue ×2, 4 pattes), redessinée en WebGL. Fichiers : `src/game/puppet.ts`, `src/game/rigs.ts`, `src/game/staging.ts`, `src/ui/Puppet.tsx`, branchement dans `src/ui/Habitat.tsx`, styles en fin de `src/styles.css`. Atelier de réglage (développement seulement) : http://localhost:5173/?lab&clip=drink&t=2
- Dans « Splash day » : Leo marche jusqu'à l'eau (pattes qui bougent, demi-tour, rapetisse au fond), baisse la tête et lape avec des ronds dans l'eau. Constaté dans le navigateur.
- Limite : c'est un dessin déformé, pas un dessin animé (amélioration dans une version ultérieure). Les pattes se plient comme du caoutchouc, la tête descend d'un bloc, rien de ce qui est caché derrière (autre côté du corps, cou) ne peut apparaître. Qualité « dessin animé » = dessins en couches séparées ou poses dessinées image par image : à décider par le parent. 
- Tests : `npm test` **112 / 112** (12 nouveaux : `src/game/puppet.test.ts`, `src/game/staging.test.ts`) ; `npm run build` OK.

## Une aventure par lieu — Afrique (2026-11-19, 14 h 40)

Question du parent : « Quand je change de décor, les aventures ne changent pas, c'est toujours les 4 mêmes ? », puis « Oui, une par lieu ».

| Aventure | Départ | Espèces | Trésor | Ce qu'on fait |
|---|---|---|---|---|
| 💦 Splash day | point d'eau | lion, éléphant, girafe | 🪷 nénuphar rose | boire, nager (ou éclabousser), « Who says ribbit? », compter les grenouilles, retrouver le bébé caché, trouver la fleur rose |
| 🐦 The baobab birds | baobab | lion, éléphant, girafe | 🌰 graine de baobab | toucher le baobab, « Who says tweet tweet? », compter les oiseaux, grimper (ou regarder en haut), cache-cache, se reposer à l'ombre |
| 🌙 Night in the canyon | canyon rouge | lion, éléphant (la girafe ne vit pas au canyon) | 🔴 caillou rouge | montagne, grand ou petit, chemin, grimper ou courir, coucher du soleil, nuit, la lune parmi les étoiles, dormir, le matin, caillou rouge |

- **Menu** : section « 🗺️ Adventure here » (seulement l'aventure du lieu où l'on est, en grande carte), puis les jeux, puis « 🧭 Adventures in other places » en petites cartes (➜ lieu de départ, 🎁 ou trésor gagné). Compteur Afrique sur la carte du monde : 🎁 x/7.
- **Jeu de Papa au baobab** « 🍃 Catch the leaves! » (Papa et bébé *little*) : le vent fait tomber des feuilles, attraper la feuille jaune, verte (orange en plus à partir du niveau intermédiaire), compter les feuilles (intermédiaire et plus). Nouveau mot : *wind*.
- Constaté dans le navigateur (lion) : au baobab, « The baobab birds » en tête et « Catch the leaves! » chez Papa ; aventure jouée jusqu'au trésor ; « Catch the leaves! » joué en entier ; au canyon, « Night in the canyon » en tête et jouée en entier (nuit, lune, matin, caillou rouge). « Splash day » vérifiée par les tests seulement.

## Pilote Afrique — jeux par décor, par rôle et par stade (2026-11-19)

Demande du parent : « faire vraiment différents types de jeux et d'animation en fonction des 5 décors […] que les interactions ou que les jeux ne soient pas les mêmes si c'est le papa, la maman ou les 2 enfants », puis « Oui, l'Afrique d'abord » et « il faut aussi un système cohérent pour faire grandir les bébés avec les différents stades de croissance ». Vocabulaire gardé simple.

**11 nouveaux jeux** (`src/content/activities/africa.ts`, déclarés dans `src/content/archetypes.ts`) :

| Jeu | Où | Qui | Ce qu'on fait |
|---|---|---|---|
| 🐾 Follow the footprints | plaines, savane | Papa | toucher les empreintes **dans l'ordre** jusqu'au zèbre |
| 🏁 Let's race! | plaines, savane | Papa, bébé *young* | course, qui est le plus rapide |
| 🗣️ The echo | canyon | Papa, bébé *young* | crier un mot, le canyon répond |
| 🧗 Up and down | canyon, désert | Papa, bébé *young* (espèces qui grimpent) | grimper au rocher, en haut / en bas |
| 👑 You are the boss! | toute l'Afrique | Papa | donner des ordres (Jump! Run! Roar!…) ; « Fly! » fait rire sans compter |
| 🐦 The bird's nest | baobab | Maman | compter les œufs du nid |
| 🥵 Too hot! | désert, savane | Maman | soleil ou ombre, chaud ou frais |
| 🌙 Good night! | toute l'Afrique | Maman | la nuit tombe, compter les étoiles, la lune, bonne nuit, le jour revient |
| 💧 Who is in the water? | point d'eau, savane | Maman, bébé *little* | jeu d'écoute : cartes sans texte, on devine à l'oreille |
| 🤗 How do I feel? | toute l'Afrique | Maman, bébé *little* | happy, sad, tired, hungry… |
| 📷 Take a photo | toute l'Afrique | Maman, bébé *little* | photographier un élément du décor ; la photo va dans l'**album** du passeport |

**Rôles** : chaque jeu (anciens compris) porte la liste des personnages qui peuvent le proposer (`roles`) et, pour les bébés, un stade minimum (`minStage`). Papa = jeux d'action et d'exploration ; Maman = soins, observation, émotions ; bébés = jeux simples au début, puis de plus en plus.

**Croissance cohérente** :

- stades *newborn → little → young → companion*, gagnés par les mots appris et les jeux variés (inchangé) ;
- chaque stade **débloque des jeux** (`unlockedAt`) : la carte « il grandit » les annonce, le bébé dit « Look at me! I'm bigger now! » ;
- ce que dit un bébé quand on le touche change avec son stade (« Goo goo! Play with me! » → « Can we play? » → « Let's go on an adventure! » → « I have an idea! ») ;
- passeport : **barre de croissance** vers le stade suivant et **jeux préférés** ❤️ du bébé (mécaniques qu'il a jouées au moins 2 fois ; le moteur les lui repropose un peu plus).

**Nouvelles mécaniques du lecteur de scènes** (`src/engine/runner.ts`) : ordres à donner (`command`), objets à toucher dans l'ordre (`ordered`), nuit (`scene`), objets dans le ciel (étoiles, lune), habits portés par le personnage, photos.

**Menus** : un jeu propre à 1 à 3 lieux passe devant un jeu de tout le continent, lui-même devant un jeu valable partout ; une seule activité par mécanique ; le personnage qui a soif propose d'abord l'eau.

Constaté dans le navigateur (savane, lion) : Papa propose empreintes / course / que se passe-t-il, Maman trop chaud / bonne nuit / famille ; « Good night! » joué en entier (nuit, étoiles, lune, retour du jour) ; menus différents dans les 6 lieux ; barre de croissance de Mia dans le passeport.

## V2 — composition du jeu (2026-11-19)

| Domaine | Ce qui marche | Vérifié |
|---|---|---|
| **Aventures** (27) | Histoires en plusieurs scènes propres à chaque continent, avec un trésor à gagner : Afrique 4, Asie 4, Europe 4, Amérique du Nord 4, Amérique du Sud 4, Océanie 4, Antarctique 3. Chaque espèce en vit au moins 3 (orque : 2). Données : `src/content/adventures/<continent>.ts` | tests + navigateur (Afrique, Asie) |
| **Vocabulaire par continent** | Chaque aventure travaille les mots de son décor (bambou, brume, arche, cascade, érable, banquise…) ; le passeport range les mots appris par continent | tests + navigateur |
| **Voyages** | Une aventure peut emmener la famille d'un lieu à l'autre **du même continent** (fondu enchaîné, nouveau décor) ; la famille reste au lieu d'arrivée ; une bande de vignettes permet de changer de lieu à tout moment | navigateur |
| **15 jeux** (activités courtes) | Dire bonjour, présenter la famille, trouver de l'eau, trouver à manger, apprendre un mot au bébé, se souvenir d'hier, aider frère/sœur, compter, couleurs, cache-cache, météo, ce que l'animal sait faire, comparer, que se passe-t-il, où est-ce | tests (198 192 variantes jouées) + navigateur |
| **Vraies interactions** | Toucher le décor, toucher/compter des objets posés dans la scène (comptage à voix haute), retrouver un bébé caché, personnages qui se déplacent et s'animent (saut, nage, vol, danse, rugissement…), réaction propre à un mauvais objet (« No, that one is pink! ») | navigateur + `src/engine/runner.test.ts` |
| **Trésors** | Carte trésor avec confettis ; album dans le passeport (❔ tant que non trouvé) ; compteur 🎁 par continent sur la carte du monde | navigateur |
| **Menu par personnage** | Section « Adventures » (✓ si déjà faite, ➜ lieu de départ si ailleurs) + section « Games » (3 jeux choisis par le moteur) | navigateur |
| **Croissance des bébés** | Un bébé à qui il manque des mots pour grandir propose d'abord « Teach me a word » ; en simulation il atteint *little* vers le 18ᵉ jeu. Tous les bébés qui participent à une aventure en profitent | tests |
| **Lecteur de scènes** | `src/engine/runner.ts` : fonction pure (état + action → état + phrases), indépendante de l'écran ; l'écran (`src/ui/useQuest.ts`, `src/ui/Habitat.tsx`) ne fait qu'afficher | tests |

## Réalisé et vérifié (V1)

| Domaine | Ce qui marche | Vérifié |
|---|---|---|
| Monde libre | Carte des 7 continents cliquable ; continent → espèce → personnage ; retour carte à tout moment ; ✓ sur les continents où une activité a été terminée | navigateur + tests |
| Salutations (1.1) | Accueil propre à chaque espèce et biome (lion, éléphant, girafe, panda, renard, ours, toucan, kangourou, manchot) ; 3 niveaux (débutant / intermédiaire / expert) ; réponse tactile, audio anglais | navigateur + tests |
| Savane approfondie | Décor illustré, 10 points interactifs (eau, arbre, ombre, soleil, rocher, fleur, herbe, chemin, nuage, cascade) : un toucher hors quête dit le mot | navigateur |
| Familles | Père et mère pour chaque espèce ; scène familiale tendre ; bébé 1 fille ou garçon au choix, prénom libre avec garde-fous ; bébé 2 automatiquement de l'autre sexe ; 3e refusé ; même prénom refusé | navigateur (lion, girafe) + tests |
| Quête réutilisable `find_water` | Même objectif pédagogique, trois scènes réellement différentes : lion (lape), éléphant (trompe, « Are you happy? »), girafe (écarte les pattes, « Big or small? » au niveau expert). Le lion et la girafe marchent jusqu'au point d'eau. | navigateur + tests |
| Cohérence habitat | `find_water` n'existe que là où il y a un point d'eau ; un manchot sur la banquise n'a que « Say hello » ; aucune espèce hors de son continent | tests |
| Bébés qui questionnent | « Teach me a word » : le bébé montre une image du décor, la joueuse répond, le bébé retient ; reteste espacé (oui/non) | navigateur + tests |
| Croissance en 4 stades | newborn → little → young → companion, par apprentissages et expériences variées, jamais par le temps ; pas de recul ; chaque bébé a sa mémoire | tests (stade 2 non atteignable en jeu, voir limites) |
| Évaluation douce | Mauvaise réponse → « Try again! » + indice ; après 2 essais la bonne réponse est montrée ; aucune pénalité ; statuts : nouveau / reconnu / avec soutien / autonome | navigateur + tests |
| Anti-répétition | Jamais 3 fois de suite la même mécanique ; au plus 3 activités proposées ; soif → l'eau d'abord | tests (100 sélections simulées) |
| Audio | **Voix enregistrées Kokoro**, une par rôle (voir « Voix ») ; 🔊 réécouter, 🐢 lent ; aide FR par la synthèse de l'appareil ; repli sur la synthèse si une phrase n'est pas enregistrée ; le jeu continue sans aucun son | tests `src/audio/voice.test.ts` + navigateur |
| Sauvegarde | Locale, versionnée, migration ; sauvegarde illisible → copie de secours + nouvelle partie | tests |
| Passeport | Continents, bébés (stade, mots, objectif de croissance), mots avec étoiles | navigateur |
| Espace parents | Ouvert directement par ⚙️ (verrou par multiplication supprimé sur demande du parent le 2026-11-19) ; prénom, son, vitesse des voix avec bouton Écouter, voix lente, aide FR, niveau ; tableau de suivi ; remise à zéro en 2 clics | navigateur |
| Respect de l'enfant | Ni micro, ni compte, ni internet après chargement, ni pub, ni classement, ni chat | revue du code |

## Tests passés (2026-11-19, une aventure par lieu, 14 h 32)

- `npm test` : **100 / 100**, dont 2 nouveaux tests dans `src/engine/africa.test.ts` : dans chaque lieu de chaque espèce d'Afrique, la première aventure du menu part de ce lieu ; « Catch the leaves! » est proposé à Papa au baobab pour toutes les espèces et jamais à Maman.
- `npx tsc -b` : 0 erreur. `npm run build` : OK.
- Voix : 131 enregistrements créés ; 7 439 fichiers, 146,1 Mo.

## Tests passés (2026-11-19, pilote Afrique, 13 h 20)

- `npm test` : **98 / 98**, dont `src/engine/africa.test.ts` (15 tests : menus Papa ≠ Maman dans chaque décor d'Afrique, jeux débloqués à chaque stade et jamais perdus, jeux propres aux lieux, grimper réservé aux espèces qui grimpent, aucun jeu d'Afrique ailleurs, ordres, ordre des empreintes, nuit, habits, album photo, goûts, barre de croissance, ancienne sauvegarde).
- `npx tsc -b` : 0 erreur. `npm run build` : OK.
- Voix : 596 phrases créées, 1 216 enregistrements devenus inutiles supprimés ; 7 308 fichiers, 143,3 Mo.

## Tests passés (2026-11-19, V2)

- `npm test` : **83 / 83** (12 h 27). Voix V2 générées : 7 928 enregistrements, 156,5 Mo (narrateur 799, père 1 776, mère 1 820, fille 1 768, garçon 1 768) ; le catalogue couvre les 198 192 variantes de scènes.
- `npx tsc -b` : 0 erreur. `npm run build` : OK (≈ 623 ko JS).
- Navigateur : « The big thirst » (lion, savane → point d'eau), « Let's count » et « Teach me a word » avec Mia, « The bamboo morning » et « The misty mountain » (panda, voyage jusqu'à l'arche), passeport, espace parents : aucune erreur.

## En cours / limites connues

- **Pilote Afrique seulement** : les 11 jeux par décor n'existent qu'en Afrique ; les autres continents gardent les 15 jeux V2 (avec rôles et stades). Le menu ne montre que 3 jeux à la fois : les autres reviennent au fil des parties.
- Pilote Afrique : empreintes, nid, étoiles et habits sont des émojis (pas encore de dessins) ; le zèbre de « Follow the footprints » aussi.
- Après une mise à jour pendant que le jeu est ouvert, une page blanche peut apparaître (cache du navigateur) : recharger avec Ctrl + F5.

- **Dessins manquants** (le parent les fournira) : lion, éléphant, girafe, panda géant, tigre, panda roux, renard, ours, bison, castor, hibou et hérisson ont des sprites (paresseux, jaguar, toucan, kangourou, koala, ornithorynque, manchot, phoque, orque : pictogramme) ; les autres espèces ont un pictogramme. Décors de l'Antarctique provisoires (dégradés), sans point d'eau.
- Décors : l'image de `sa_valley` vient du dossier Océanie ; `sa_andes` et `sa_valley` ne servent à aucune aventure (seul le toucan y va) ; quelques points du décor sont dans la zone de la famille.
- Objets : pas encore de perle, arc-en-ciel, grenouille ou banane en objets à toucher ; la pluie est racontée sur des décors ensoleillés ; certaines vérifications de couleur sont approximatives (stone / rock presque doublons).
- Le hibou n'a pas d'animation de vol pour se déplacer (il se dandine).
- Prénoms : les voix enregistrées ne prononcent pas les prénoms libres (la bulle les affiche).
- Hors-ligne : seulement en https ou sur `localhost`, et seulement avec la version construite (`npm run build`), pas avec `npm run dev`. Tablette en http local : pas de hors-ligne.
- Queues animées : en attente de tous les dessins (décision du parent).

## Voix

Correction faite au passage : les cartes-réponses affichaient la variable brute (« My name is {playerName}. ») ; elles sont maintenant remplies avec le prénom.

Choix du parent du 2026-11-18 (après écoute d'un essai) :

| Rôle | Voix Kokoro | Accent |
|---|---|---|
| Narrateur et réponses à toucher | Isabella (`bf_isabella`) | britannique |
| Papas (Leo…) | Daniel (`bm_daniel`) | britannique |
| Mamans (Lola…) | Bella (`af_bella`) | américain |
| Bébé fille | Emma rajeunie (`bf_emma+5`) | britannique |
| Bébé garçon | Kore rajeunie (`af_kore+5`) | américain |

Bébés : Lily (premier choix) sonnait comme une adulte ; Kokoro n'a pas de voix d'enfant. Les voix des bébés sont donc des voix adultes **rajeunies de 5 demi-tons** (hauteur et timbre montés ensemble, débit normal), choisies par le parent le 2026-11-18 sur une page d'écoute de 12 candidates. Le suffixe `+5` dans `VOICE_OF_ROLE` est lu par `generate_voices.py`.

Réglages d'écoute (demande du parent du 2026-11-18 : « plus lente et audible ») dans `tools/tts/generate_voices.py` :

- débit `SPEED = 0.8` pour toutes les voix (au lieu de 0.95), le bouton 🐢 ralentit encore (× 0,75) ;
- chaque phrase d'une réplique est dite séparément, avec 0,35 s de pause entre deux phrases ;
- volume égalisé pour toutes les voix (−16 dB en moyenne, crête à −1 dB, jamais saturé).

Vitesse réglable sans régénérer (demandes du parent du 2026-11-19 : « le 100 % soit le réel et que je puisse ou ralentir ou accélérer ») : espace parents ⚙️ → **Vitesse des voix**, de 50 % à 150 % par crans de 5 %, **100 % = vitesse naturelle**. Boutons 🐢 − / + 🐇, choix rapides **Lent 70 % / Conseillé 80 % / Naturel 100 %**, et **▶ Écouter** à côté de la barre (accueil de Leo, `SPEED_SAMPLE` dans `src/content/utterances.ts`). Bouger la barre pendant l'écoute change la vitesse de la phrase en cours. Défaut 80 % = vitesse des enregistrements, lus sans retouche ; au-delà ou en deçà, le navigateur accélère ou ralentit sans changer la hauteur (`playbackRate = vitesse / RECORDED_SPEED`, `preservesPitch`). `RECORDED_SPEED` (`src/audio/speech.ts`) doit rester égal à `SPEED` du générateur : un test le vérifie. Sauvegarde : `settings.speechSpeed` (corrigé s'il est hors plage) ; l'essai de la veille `voiceSpeed` est abandonné à la lecture. La voix de l'appareil (aide française, repli) suit le même réglage (1 = débit naturel).

Vérifié le 2026-11-19 dans le vrai Firefox 160 (sans écran, profil temporaire, piloté par WebDriver BiDi avec de vrais clics) : glissement, clic sur la barre, boutons + et choix rapides, Écouter, changement de vitesse en pleine phrase (1 → 1,25 → 0,875). Défauts corrigés : un bouton « 100 % » qui apparaissait et raccourcissait la barre pendant le glissement ; un conflit avec la classe CSS `.listen` qui écrasait le bouton Écouter.

Pour changer un réglage d'enregistrement : modifier la valeur, augmenter `RENDER_VERSION`, puis `npm run voices` (tout est régénéré, ≈ 13 min). Tests du générateur : `tools/tts/.venv/Scripts/python -m unittest tools/tts/test_generate_voices.py`.

Fonctionnement :

- `src/audio/voiceCatalog.ts` énumère toutes les phrases que le jeu peut dire, chacune dans la voix qui la dit. Les phrases d'interface sont écrites une seule fois, dans `src/content/utterances.ts`.
- État au 2026-11-18 (17 h 50) : **655 enregistrements** (Isabella 164, Emma 130, Kore 130, Daniel 116, Bella 116 ; un bébé n'a pas de phrase « I'm {name}! » dite à voix haute), 13,5 Mo en MP3 (voix ralenties), ≈ 13 min de génération complète sur le processeur.
- `npm run voices` exporte ce catalogue (`tools/tts/lines.json`) puis `tools/tts/generate_voices.py` crée les MP3 dans `public/audio/voice/` et le manifeste `src/content/voiceManifest.json`. La génération est incrémentale : seules les nouvelles phrases sont créées, et les fichiers inutilisés sont supprimés.
- En jeu, `src/audio/speech.ts` cherche l'enregistrement de la phrase (clé « voix | texte, prénoms remplacés par {name} ») ; sinon il utilise la synthèse de l'appareil et le signale dans la console en développement.
- Une phrase avec un prénom doit avoir une variante parlée dans `NAME_RULES` (`src/audio/voiceKey.ts`) ; sinon `npm run voices` et les tests échouent.
- Les tests vérifient que chaque phrase du catalogue a son fichier : **après un changement de texte anglais, lancer `npm run voices`**.
- Outils locaux (hors du jeu livré) : environnement Python `tools/tts/.venv` (kokoro-onnx 0.6.1, Python 3.13), modèle dans `tools/tts/models/` (téléchargé depuis les publications de kokoro-onnx sur GitHub, ≈ 340 Mo). Pour recréer l'environnement : `python -m venv tools/tts/.venv` puis `tools/tts/.venv/Scripts/pip install kokoro-onnx soundfile`.

## Bloqué / à décider par le parent

- **Voyage accompagné d'animaux entre continents** : proposé, **non validé** — non implémenté. Les voyages de la V2 restent **à l'intérieur d'un continent**.
- Style des lions : voir la note de droits dans `docs/INVENTAIRE_ASSETS.md`.

## Journal des décisions techniques (défauts raisonnables documentés)

| Décision | Raison |
|---|---|
| Pas de Phaser : scène en couches DOM/CSS en pourcentages | Scènes de dialogue et de toucher, pas de physique ; plus léger, accessible, testable ; Phaser pourra être ajouté pour des mini-jeux |
| Sauvegarde `localStorage` versionnée plutôt qu'IndexedDB | Volume minuscule, synchrone, testable ; migration prévue |
| Versions figées (React 19.3.1, Vite 7.3.8, TypeScript 5.9.3, Vitest 3.2.7) | Reproductibilité |
| Pas de polices Google | Hors-ligne et aucune requête externe |
| Dialogues = bibliothèque de répliques validées + variables `{actorName}`… | Exigence « dialogues contrôlés, pas d'IA générative » |
| Images préparées par `tools/prepare_assets.py` (détourage, WebP) | L'utilisatrice dépose ses dessins dans `Animaux/` sans retouche manuelle |
| Voix pré-enregistrées (Kokoro, local) plutôt que synthèse de l'appareil | Voix de l'appareil robotique (Windows : Hazel) ; dialogues contrôlés donc enregistrables à l'avance ; hors ligne, sans compte |
| Prénoms non prononcés par les voix enregistrées | Impossible d'enregistrer à l'avance un prénom libre ; synthèse mêlée = rupture de voix |
| Vitesse des voix réglée à la lecture (`playbackRate`), pas en régénérant ; 100 % = naturelle, défaut 80 % = enregistrements tels quels | Réglage immédiat par les parents, sans 13 min de génération ; la vitesse la plus utilisée garde la qualité d'origine ; hauteur conservée par le navigateur |
| Aucun verrou sur l'espace parents | Décision du parent du 2026-11-19 : pas de sécurité ajoutée sans demande |
| Activités génériques = `choices()` + `build()` purs, aventures = suites d'étapes typées | Le catalogue des voix et les tests parcourent **toutes** les variantes ; aucune scène ne peut contenir une phrase non enregistrée ou un point du décor inexistant |
| Lecteur de scènes pur (`runner.ts`) séparé de l'écran | Toutes les aventures sont jouées automatiquement par les tests, avec et sans erreurs |
| Délai des tests porté à 60 s (`vite.config.ts`) | Les tests de couverture parcourent ≈ 200 000 scènes |
| Pilote Afrique : rôles de Papa et Maman tels que proposés dans le plan (Papa action / exploration, Maman soin / observation / émotions) | Pas de réponse sur ce point ; défaut du plan, modifiable dans `roles` de `archetypes.ts` |
| Pilote Afrique : toucher seulement, pas de glisser-déposer | Plus simple à 7 ans sur tablette ; pas de réponse sur ce point |
| Pilote Afrique : aucun ancien jeu retiré | Pas de réponse sur ce point |
| Le lion sait grimper (`can: climb`) ; l'éléphant et la girafe non | Les lions grimpent vraiment aux rochers et aux arbres ; « Up and down » n'est proposé qu'aux espèces qui grimpent |
| Jeu d'écoute « Who is in the water? » : cartes sans texte ni 🔊 | La réponse se devine à l'oreille, jamais par la lecture |
| Aventures : celle du lieu où l'on est en tête ; les autres restent jouables en petites cartes | Rien n'est retiré ; on peut toujours partir vers un autre lieu |
| La girafe n'a pas d'aventure au canyon | Elle ne vit pas au canyon dans les données des espèces (cohérence habitat) |

## Prochain jalon proposé (V2 suite)

0. Faire essayer le pilote Afrique (jeux et une aventure par lieu) ; si le principe plaît, étendre les jeux et les aventures par décor, par rôle et par stade aux 6 autres continents (même modèle : `content/activities/<continent>.ts`).
1. Intégrer les dessins des personnages manquants dès qu'ils arrivent dans `Animaux/` (`npm run assets`).
2. Écouter les nouvelles voix et corriger les phrases mal prononcées.
3. Objets dessinés manquants (lune, arc-en-ciel, grenouille, banane) et décors de pluie.
4. (Abandonné pour l'instant, décision du parent) Hébergement https de `dist/` pour le hors-ligne.
5. Queues animées quand tous les dessins seront déposés.
