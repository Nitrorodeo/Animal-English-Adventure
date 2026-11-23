# Cartographie des parcours — Animal English Adventure

Snapshot du **2026-11-23**. Validé par le parent le 2026-11-23 (« ordre de lancement de la production ») :
c'est la base de travail. Le suivi de production par parcours est dans la section « Suivi de production » ci-dessous.
Les anomalies consolidées, la croissance et la feuille de route sont dans `docs/ROADMAP_PARCOURS.md`.

## Ce qu'on compte

| | Nombre | Détail |
|---|---|---|
| Zones | 7 continents + l'océan | |
| Familles | 24 | 21 terrestres (3 par continent) + 3 marines |
| Décors | **69** | 21 × 3 + 3 × 2 |
| Personnages par famille | 4 | Papa, Maman, Bébé fille, Bébé garçon. Les 4 phases des bébés ne sont pas des personnages en plus. |
| Parcours personnage × décor | **276** | 69 × 4 |
| Versions jouables décor × niveau | **207** | 69 × 3 : débutant, intermédiaire, expert (l'expert existe déjà : il est conservé tel quel) |
| Séquences personnage × décor × niveau | 828 | 276 × 3 |

Sur les 69 décors, **32 sont déjà dans le jeu** : même image, place id existant. **37 sont nouveaux** :

| Zone | Déjà dans le jeu | Nouveaux |
|---|---|---|
| Afrique | 5 | 4 |
| Amérique du Nord | 4 | 5 |
| Amérique du Sud | 6 | 3 |
| Antarctique | 5 | 4 |
| Asie | 6 | 3 |
| Europe | 0 | 9 |
| Océanie | 6 | 3 |
| Océan | 0 | 6 |

## Les 69 décors en un tableau

Lecture des colonnes :
- *id* : place id du jeu. Les ids en italique sont proposés pour un nouveau décor.
- *Statut* : « jeu » = déjà jouable ; « nouveau » = à intégrer.

| Famille | Décor 1 | Décor 2 | Décor 3 |
|---|---|---|---|
| Lion | `africa_baobab` (jeu) | `africa_desert` (jeu, à renommer « la savane sèche ») | `africa_canyon` (jeu) |
| Éléphant | *`africa_pond`* (nouveau) | *`africa_acacia_plain`* (nouveau) | *`africa_forest`* (nouveau) |
| Girafe | `africa_waterhole` (jeu) | `africa_plains` (jeu) | *`africa_green_meadow`* (nouveau) |
| Ours brun | `na_redwoods` (jeu) | `na_lake` (jeu) | *`na_bear_den`* (nouveau, image trop petite) |
| Bison | *`na_bison_prairie`* (nouveau) | *`na_bison_alpine`* (nouveau) | *`na_bison_canyon`* (nouveau) |
| Castor | `na_beaver_pond` (jeu, miroir) | `na_redwood_trail` (jeu) | *`na_beaver_falls`* (nouveau) |
| Jaguar | `sa_wetland` (jeu, miroir) | `sa_river` (jeu) | `sa_andes` (jeu, absent de ses décors autorisés) |
| Paresseux | *`sa_sloth_canopy`* (nouveau) | *`sa_sloth_roots`* (nouveau) | *`sa_sloth_refuge`* (nouveau) |
| Toucan | `sa_canopy_branch` (jeu) | `sa_canopy_treehouse` (jeu) | `sa_canopy_sunrise` (jeu) |
| Ours polaire | `ice_coast` (jeu) | `an_ice_cave` (jeu) | `an_snowfield` (jeu) |
| Phoque | *`an_seal_aurora`* (nouveau) | *`an_seal_rocks`* (nouveau) | *`an_seal_sunset`* (nouveau) |
| Manchot | `open_sea` (jeu) | `an_aurora` (jeu) | *`an_penguin_cave`* (nouveau) |
| Panda | `asia_bamboo` (jeu) | `asia_garden` (jeu) | *`asia_pavilion`* (nouveau) |
| Tigre | `asia_pagoda` (jeu) | `asia_mountain` (jeu) | *`asia_jungle_falls`* (nouveau) |
| Panthère des neiges | `asia_snow_den` (jeu) | *`asia_snow_cave`* (nouveau) | `asia_arch` (jeu) |
| Renard | *`europe_fox_glade`* | *`europe_fox_autumn`* | *`europe_fox_snow`* |
| Hibou | *`europe_owl_nest`* | *`europe_owl_moon`* (nuit) | *`europe_owl_oak`* |
| Hérisson | *`europe_hog_stream`* | *`europe_hog_lake`* | *`europe_hog_log`* |
| Kangourou | *`oc_red_plain`* | *`oc_waterhole`* | *`oc_bush_coast`* |
| Koala | `oc_eucalyptus` (jeu) | `oc_gum_woodland` (jeu) | `oc_rocky_cove` (jeu, miroir, ≈ plage du lézard) |
| Lézard à collerette | `oc_outback` (jeu) | `oc_gorge` (jeu) | `oc_beach` (jeu) |
| Baleine | *cathédrale de glace* (nouveau) | *panorama antarctique* (nouveau, même scène) | — |
| Dauphin | *paradis lumineux* (nouveau) | *canyon de kelp* (nouveau) | — |
| Tortue | *jardin corallien* (nouveau) | *canyon turquoise* (nouveau, ≈ paradis du dauphin) | — |

**Une famille = ses décors.** Aujourd'hui, plusieurs familles partagent des décors : ours et castor, jaguar et paresseux, les trois familles d'Antarctique, kangourou et lézard. Avec ce tableau, chaque famille ne joue que dans ses trois décors.

## Suivi de production

Statuts : À analyser → Cartographié → En production → Intégré → Testé → Validé. « Testé » veut dire que les
tests automatiques ont réellement tourné sur ce parcours, aux 3 niveaux ; la colonne « Écran » dit ce qui a
en plus été rejoué à l'écran, et rien d'autre. « Validé » est réservé au parent, après ses essais.

Snapshot du 2026-11-23, fin d'après-midi.

### Afrique — 9 parcours, 27 versions (3 niveaux)

| Famille | Décor | Statut | Écran (version construite) |
|---|---|---|---|
| Lion | `africa_baobab` le baobab | Testé | tests automatiques ; 8 images des lionceaux vérifiées (4 phases × 2) ; histoire non rejouée à l'écran |
| Lion | `africa_desert` la savane sèche (nom de code inchangé) | Testé | tests automatiques ; histoire non rejouée à l'écran |
| Lion | `africa_canyon` le sentier de la falaise | Testé | tests automatiques ; histoire non rejouée à l'écran |
| Éléphant | `africa_pond` la mare aux roseaux | Testé | « Bath time at the pond » (cailloux qui tombaient sur Papa et Maman : corrigé) |
| Éléphant | `africa_acacia_plain` la grande plaine | Testé | « The hot plain » (herbes du repas sous la bulle : corrigé) |
| Éléphant | `africa_forest` la forêt ombragée | Testé | « A walk in the forest » (oiseau caché, cachette derrière Maman : corrigé) |
| Girafe | `africa_waterhole` la mare aux nénuphars | Testé | décor et objets posés au bord de l'eau |
| Girafe | `africa_plains` le chemin dans l'herbe dorée | Testé | tests automatiques ; histoire non rejouée à l'écran |
| Girafe | `africa_green_meadow` la prairie verte | Testé | « Meadow flowers » en entier en expert, et en débutant jusqu'au comptage (2 réponses) ; naissance des 2 bébés |

Tests automatiques qui couvrent ces 27 versions : rien posé sur la famille, rien de terrestre dans l'eau, aucun
objet caché sous la bulle ni sous le panneau de 3 ou 4 réponses, chaque zone à toucher visible à moitié au moins
et qui répond là où on la touche, aucune cachette derrière Papa ou Maman, garde-fou débutant (2 réponses,
difficulté figée), croissance des bébés, décors propres à chaque famille, voix toutes présentes.

### Autres zones

| Zone | Parcours | Statut |
|---|---|---|
| Amérique du Nord | 9 | Cartographié |
| Amérique du Sud | 9 | Cartographié |
| Asie | 9 | Cartographié |
| Antarctique | 9 | Cartographié |
| Europe | 9 | Cartographié |
| Océanie | 9 | Cartographié |
| Océan | 6 | Cartographié (images des familles marines manquantes) |

## Comment lire chaque fiche

Les fiches ci-dessous sont regroupées par zone. Elles ont été rédigées le 2026-11-23 à partir des images réellement déposées dans `Animaux/` et du code actuel.

Chaque décor donne :
- l'image source et le place id ;
- ce qu'on voit réellement, avec la position des éléments ;
- l'histoire propre au décor ;
- le vocabulaire nouveau et le vocabulaire réutilisé ;
- au débutant, 1 à 2 interactions par personnage ;
- à l'intermédiaire, 1 à 2 interactions par personnage ;
- la cohérence avec l'espèce et les points d'attention.

Règles de lecture :
- **Débutant.** On n'utilise que les mécaniques existantes, notées entre crochets : `locate`, `identify`, `count`, `sort`, `compare`, `observe`, `guide`, `talk`… Toujours 2 réponses. Les phrases sont du niveau de celles déjà testées et validées. Ce sont des **propositions** : en production, un test automatique vérifiera que chaque phrase débutant reste au niveau actuel (mécanique, nombre de réponses, longueur, mots). Une proposition trop longue ou trop difficile sera ramenée à ce niveau ou retirée.
- **Intermédiaire.** 3 réponses, avec la compétence visée entre parenthèses.
- **Vocabulaire.** La répétition est voulue : chaque décor ajoute ses mots, et réutilise les couleurs, les nombres, la famille et les mots de l'espèce.
- **Personnages.** Les 4 personnages ont chacun des interactions différentes, dans un même décor comme d'un décor à l'autre. Les phases des bébés n'ajoutent pas de personnages.

---

# Cartographie Afrique — lion, éléphant, girafe (3 familles × 3 décors = 9 parcours)

Établi le 2026-11-23, lecture seule. Images regardées : 9 décors, 3 planches (lion, éléphant, girafe), l'image orpheline. Positions en gauche / centre / droite, premier plan / plan moyen / fond. Les mécaniques citées entre crochets sont celles qui existent (locate, identify, count, compare, sort, observe, guide, plan, tell, social, talk, fetch, puzzle, build).

Rappel du code actuel : les trois espèces partagent `AFRICA = savanna, africa_waterhole, africa_baobab, africa_desert, africa_canyon, africa_plains` (`src/content/species.ts` l.9). Seule la girafe exclut `africa_canyon`. Après le choix du parent, chaque famille ne garde que ses 3 décors (voir « Anomalies »).

---

## Lions (lion) — Afrique
- Personnages : Papa Leo (courageux), Maman Lola (douce), Bébé fille (lionne à nœud rose), Bébé garçon (petite crinière brune) ; mot du bébé : cub (lionceau), famille = pride (troupe).
- Jeu propre existant : `lion_mane` « The lion's mane » (mécanique `tell`, domaines 1.5 / 2.5 / 2.3, minStage `little`, rôles mère + bébé) : cartes à toucher Roar / Show me your paw / Take a nap / Run / Fly (le piège « Fly » : les lions ne volent pas), questions « Does Mummy have a mane? », « Who says roar? », « A baby lion is a… cub », « A lion family is a… pride ». Mots propres déjà en jeu : mane, paw, roar, nap, run, cub, pride.
- Objectifs pédagogiques de la famille : 1.5 (verbes d'action : roar, run, nap, climb : le lion sait faire les quatre) ; 2.3 (lieux et positions : le lion se couche, grimpe sur les rochers, longe un chemin) ; 1.7 / 2.7 (chaud, ombre, repos : la sieste du lion à l'ombre du baobab, au soleil du désert) ; 1.3 (nombres : fleurs, rochers) ; 2.5 (parties du corps : crinière, patte, queue).
- Fil rouge des 3 décors : le baobab = le lieu de la famille, de l'ombre et de la sieste (calme, fleurs, rochers à compter) ; l'arid savane = un lieu chaud où l'on cherche l'ombre et où l'on suit des traces dans le sable (observation, contraste chaud / frais) ; le sentier sur la falaise = l'aventure, grimper de rocher en rocher et rugir pour écouter l'écho (hauteur, positions, prudence).

### Lions · décor 1 — The baobab / le baobab
- Image : `Animaux/Afrique/Lions/Image ChatGPT 19 nov. 2026, 08_59_51-2.png` · Statut : déjà dans le jeu sous `africa_baobab` (11 zones).
- Ce qu'on voit : fond, à droite du centre, un énorme baobab (tronc et racines au centre x 55-70 %, large couronne en haut qui couvre presque tout le ciel droit) ; soleil rayonnant en haut à gauche, 4 nuages ; au fond à gauche et à droite, 3 acacias parasol et des collines violettes ; grande clairière de terre rouge vide au centre bas (zone idéale pour poser les personnages) ; fleurs roses/violettes en touffes au pied du baobab (x 30-45 %, x 80-90 %), fleurs blanches et 2-3 hibiscus orange en bas à gauche (x 3-12 %, y 85 %) et en bas à droite (x 88-98 %, y 80-90 %) ; 2 gros rochers au premier plan (bas gauche x 12-25 %, bas droit x 75-90 %) et 4-5 rochers moyens autour du baobab ; herbe haute jaune sur les bords.
- Histoire : la famille lion se repose à l'ombre du grand baobab quand le soleil est haut. Les lionceaux jouent à cache-cache derrière les rochers et les racines pendant que Papa surveille et que Maman fait la sieste à l'ombre.
- Vocabulaire nouveau : baobab (le baobab) · root (la racine) · shade (l'ombre) · hibiscus (l'hibiscus) · hide (se cacher)… Vocabulaire réutilisé : tree, sun, cloud, rock, flower, nap, big / small, orange, pink, colours.
- Débutant — interactions par personnage :
  - Papa : [locate] "Where is Daddy? Touch the baobab!" (Papa est près de l'arbre, touche le baobab) ; [identify] "Is the baobab big?" (oui / non, déjà en place).
  - Maman : [sort] "It's hot! Mummy wants a nap. Touch the shade!" (la zone sombre sous le baobab) ; [identify] "Touch the orange flower!" (hibiscus).
  - Bébé fille : [count] "How many pink flowers?" (réponse 2 ou 3 sur la touffe en bas à gauche) ; [locate] "Find the rock!".
  - Bébé garçon : [locate] "Where is Baby Boy? Find the big rock!" (il se cache derrière le gros rocher de droite) ; [identify] "Touch the sun!".
- Intermédiaire :
  - Papa : [locate] "Is Daddy next to the baobab or under the tree?" (3 réponses : next to the baobab, behind the rock, on the cloud) (position) ; [compare] "Which rock is bigger?" (deux rochers en bas).
  - Maman : [observe] "What is Mummy doing?" (sleeping / running / flying) (verbes d'action) ; [count] "Can you find two orange flowers?" (couleur + quantité).
  - Bébé fille : [locate] "Is the baby behind the rock?" (position) ; [identify] "What colour are the flowers near the baobab?" (pink / blue / black).
  - Bébé garçon : [tell] "Can you find something behind the baobab?" ; [compare] "Who is smaller: the cub or Daddy?".
- Cohérence : le lion se repose à l'ombre, rien de mangé n'est montré ; il sait grimper et courir, jamais voler. Aucune chasse.
- Points d'attention : la plus grande partie du baobab est un seul gros objet : la zone « baobab » est facile à toucher, mais « tronc », « racine », « branche » exigent des zones nouvelles (racines en bas du tronc x 45-70 %, y 52-58 %). Les hibiscus et fleurs blanches du bas sont petits (≈ 6 % de large) : zones à agrandir pour le doigt d'un enfant. Aucun point d'eau ni de bébé animal dans l'image : pas de scène « boire » ici.

### Lions · décor 2 — The dry savannah / la savane sèche (code actuel : « le désert »)
- Image : `Animaux/Afrique/Lions/Image ChatGPT 19 nov. 2026, 08_59_53-3.png` · Statut : déjà dans le jeu sous `africa_desert`, nom actuel « le désert » (11 zones, `weather: hot`).
- Ce qu'on voit : soleil très fort en haut à droite (x 85-90 %, y 10 %), nuages blancs ; grandes roches orange en haut à gauche (empilées, x 0-20 %, y 5-35 %) et gros rochers au premier plan à gauche (x 0-25 %, y 55-70 %) et à droite (x 70-95 %, y 70-90 %) ; un acacia seul au fond à droite (x 70 %, y 30 %) ; touffes d'herbe sèche dorée un peu partout ; deux buissons gris-vert (centre-gauche x 30-40 %, y 45-50 % ; droite x 83-95 %, y 58-75 %) ; sable doré avec un chemin ondulé qui part du centre vers la droite ; terre craquelée en bas à gauche (x 5-40 %, y 65-90 %) ; petites pierres semées ; dunes douces au fond ; buttes rouges et collines au loin.
- Histoire : c'est la saison sèche. La famille lion cherche un coin d'ombre contre les gros rochers et suit le chemin dans le sable pour retrouver un endroit frais. Les lionceaux découvrent le sol craquelé et les petites pierres sur la route.
- Vocabulaire nouveau : sand (le sable) · crack (la fissure) · dry (sec) · hot (chaud) · bush (le buisson) · dune. Vocabulaire réutilisé : rock, stone, hill, tree, sun, cloud, grass, big / small, nap, run.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the big rock!" ; [identify] "Is the sun blue?" (non).
  - Maman : [sort] "It's hot! Touch the rock for shade!" ; [identify] "Is the sand yellow?".
  - Bébé fille : [count] "How many stones?" (2 ou 3 petites pierres groupées bas gauche) ; [identify] "Touch the green bush!".
  - Bébé garçon : [locate] "Find the tree!" (acacia du fond) ; [identify] "Is this a crack?" (oui, sur le sol craquelé).
- Intermédiaire :
  - Papa : [guide] "Follow the path! Is the path long?" (le chemin dans le sable, 3 réponses : long, short, blue) (description) ; [compare] "Which rock is bigger?" (rocher bas droite / rocher bas gauche).
  - Maman : [observe] "What is Mummy doing?" (resting / swimming / flying) ; [locate] "Is the baby under the rock or next to the bush?".
  - Bébé fille : [count] "Can you find two small stones near the crack?" ; [identify] "What colour is the grass? Yellow / blue / pink".
  - Bébé garçon : [locate] "Can you find something behind the big rock?" ; [tell] "It is hot. Where is the shade?" (3 zones d'ombre possibles).
- Cohérence : le lion vit réellement en savane sèche, lui qui tolère la chaleur ; aucun point d'eau (pas de boisson ici) : parler d'ombre, pas d'eau. Pas de danger montré.
- Points d'attention : très ressemblant au décor de l'éléphant « savane » par la palette jaune-orange mais bien différent par les rochers et le sable (famille différente, donc sans conflit). Le chemin ondulé est peu marqué (pas de contraste fort) : zone « path » à tester. Les petites pierres du sol sont minuscules (< 5 %) : au débutant privilégier les 2 gros rochers du premier plan.
- Nom conseillé : renommer « le désert » en « la savane sèche » (l'image montre une steppe d'herbe sèche avec un acacia, pas un vrai désert de dunes).

### Lions · décor 3 — The cliff path / le sentier de la falaise (code actuel : « le canyon rouge »)
- Image : `Animaux/Afrique/Lions/Image ChatGPT 19 nov. 2026, 08_59_56-4.png` · Statut : déjà dans le jeu sous `africa_canyon` (12 zones).
- Ce qu'on voit : à gauche, un entassement de gros rochers rouges (x 0-30 %, y 0-90 %) ; un acacia sur les rochers en haut (x 20-40 %, y 2-20 %) et un deuxième acacia plus bas au milieu (x 48-58 %, y 35-45 %) ; un sentier de terre qui monte en lacets du bas centre (x 30-50 %, y 60-100 %) vers le haut gauche, avec des marches de pierre au milieu (x 20-30 %, y 50-58 %) ; à droite, la falaise rouge et la vallée verte : mesas rouges au fond (x 45-100 %, y 20-45 %), vallée d'herbe jaune-verte en contrebas ; soleil rayonnant en haut à droite, nuages ; hibiscus orange en bas gauche (x 3-12 %, y 80-90 %) et bas droite (x 90-100 %, y 80-95 %), fleurs blanches, épis d'herbe dorée au premier plan ; dalle de rocher plate au bord (x 55-80 %, y 65-80 %) ; gros bloc rouge en bas droite (x 60-90 %, y 80-100 %).
- Histoire : les lions suivent le sentier au-dessus de la grande vallée pour voir leur royaume d'en haut. Le lionceau monte les marches de pierre ; le père lui montre la vallée et la falaise rouge, et ils rugissent pour écouter leur voix résonner.
- Vocabulaire nouveau : path (le chemin) · step (la marche) · cliff (la falaise) · valley (la vallée) · up / down (en haut / en bas) · echo. Vocabulaire réutilisé : rock, tree, sun, cloud, flower, grass, big / small, orange, red, climb, roar.
- Débutant :
  - Papa : [locate] "Find the path!" ; [identify] "Is the mountain red?" (oui).
  - Maman : [identify] "Touch the orange flower!" ; [count] "How many trees?" (2).
  - Bébé fille : [locate] "Find the rock!" ; [identify] "Is the path long?" (oui).
  - Bébé garçon : [locate] "Where is Baby Boy? On the big rock!" (il grimpe sur les rochers à gauche, minStage `little`) ; [identify] "Is the sun big?".
- Intermédiaire :
  - Papa : [puzzle] déjà existant `echo_canyon` « The echo » (ROAR puis écouter) ; [locate] "Is Daddy up high or down low?" (up high / down low / in the water).
  - Maman : [guide] "Mummy walks on the path. Where does the path go?" (up / down / to the sun) ; [count] "Can you find two white flowers next to the rock?".
  - Bébé fille : [compare] "Which rock is bigger?" (bloc rouge bas droit / pierre au sol) ; [observe] "What is the baby doing?" (climbing / swimming / flying).
  - Bébé garçon : [build] `climb_rock` « Up and down » (existant, young+) ; [locate] "Can you find something behind the tree?".
- Cohérence : le lion grimpe et rugit : cohérent. Mais le décor contient un vide à pic : ne jamais écrire de phrase du type « va au bord » ; garder les personnages sur le chemin ou les rochers.
- Points d'attention : décor le plus « aventure » mais aussi le plus chargé : beaucoup de petites zones (hibiscus, fleurs blanches). Pas de nourriture ni d'eau visibles : un jeu « boire » est impossible ici. Les marches de pierre (x 20-30 %, y 50-58 %) sont petites mais idéales pour le mot « step » et pour le jeu « grimper » ; la zone à agrandir. À ne pas confondre avec `asia_mountain` ou `oc_gorge` côté Asie / Océanie (même type de lieu rocheux, couleurs un peu différentes).

---

## Éléphants (elephant) — Afrique
- Personnages : Papa Bongo (rigolo, grandes défenses, trompe levée), Maman Ellie (sage, fleur d'hibiscus rose sur l'oreille), Bébé fille (nœud rose), Bébé garçon (houppe grise) ; mot du bébé : calf (éléphanteau) ; famille = herd (troupeau). La planche montre les 4 phases par sexe (assis, debout petit, qui lève la patte, grand) : OK avec le code.
- Jeu propre existant : `elephant_trunk` « The elephant's trunk » (mécanique `fetch`, domaines 1.5 / 2.2 / 1.3, minStage `little`, rôles mère + bébé) : cartes Flap your ears / Trumpet / Wave your trunk / Jump (piège : un éléphant ne saute pas), apporter des feuilles avec la trompe, « Is my trunk long or short? », « Are my ears big or small? », boire avec la trompe au point d'eau (intermédiaire), « Can an elephant jump? No », « An elephant family is a… herd ». Mots propres : trunk, ears, trumpet, leaves, herd, calf, splash.
- Objectifs pédagogiques de la famille : 1.5 (verbes : arroser, barrir, manger, marcher) ; 1.3 (nombres : feuilles, rochers, roseaux) ; 2.2 (parties du corps : trompe, oreilles, défenses, grands / petits) ; 1.7 (eau, chaleur : l'éléphant se rafraîchit) ; positions (sous l'arbre, devant le rocher) : la grande taille de l'éléphant se prête aux comparaisons (big / small).
- Fil rouge des 3 décors : la mare = l'eau, la trompe qui aspire et arrose, l'ambiance fraîche (reflets, roseaux) ; la savane = l'espace ouvert, la marche du troupeau, le grand arbre qui donne des feuilles ; la forêt = l'ombre, les feuilles et lianes à attraper, les rayons de lumière, un lieu plus calme et caché.

### Éléphants · décor 1 — The pond / la mare aux roseaux
- Image : `Animaux/Afrique/Elephants/Image ChatGPT 22 nov. 2026, 09_50_19-1.png` · Statut : NOUVEAU (proposer l'id `africa_pond`). Visuellement voisin de `africa_waterhole` (même cadrage de mare + même type d'acacias) mais sans nénuphars et avec des rochers gris au lieu de rouges ; l'ancien décor `africa_waterhole` appartient désormais à la girafe.
- Ce qu'on voit : mare bleue au centre (x 20-85 %, y 45-62 %) avec reflets du soleil ; gros acacia à gauche dont le tronc touche le bord (x 0-40 %, y 0-45 %), autre acacia à droite (x 75-100 %, y 15-40 %) ; touffes de roseaux (typha) à gauche (x 15-25 %, y 35-55 %) et à droite (x 88-100 %, y 38-60 %) ; herbe haute jaune derrière la mare ; 3 gros rochers gris à droite de la mare (x 67-82 %, y 38-50 %) et plusieurs rochers autour de l'eau ; au premier plan : un gros rocher gris bas gauche (x 0-15 %, y 80-95 %) et bas droite (x 82-98 %, y 82-100 %) ; grande étendue de terre orange devant la mare (centre, y 65-90 %) ; collines roses au fond ; soleil en haut à droite (x 77 %, y 8 %), 5 nuages ; touffes d'herbe verte et petites plantes.
- Histoire : par une journée très chaude, le troupeau d'éléphants vient à la mare. Les éléphanteaux découvrent qu'ils peuvent aspirer l'eau avec leur trompe et arroser les roseaux, pendant que Maman reste près de l'eau et que Papa fait l'arrosoir.
- Vocabulaire nouveau : water (l'eau) · reed (le roseau) · splash (éclabousser) · wet (mouillé) · drink (boire). Vocabulaire réutilisé : trunk, big / small, blue, rock, tree, sun, cloud, grass, hot.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the water!" ; [identify] "Is the water blue?".
  - Maman : [identify] "Touch the big tree!" ; [count] "How many big rocks?" (3 groupés à droite).
  - Bébé fille : [locate] "Find the green grass!" ; [identify] "Is this a reed?" (oui).
  - Bébé garçon : [identify] "Touch the sun!" ; [locate] "Where is Baby Boy? Behind the rock!" (bas gauche).
- Intermédiaire :
  - Papa : [tell] "What is Daddy doing? Drinking / flying / sleeping" ; [compare] "Which rock is bigger?".
  - Maman : [locate] "Is Mummy next to the water or under the tree?" ; [count] "Can you find two reeds?".
  - Bébé fille : [observe] "What is the baby doing? Splashing / jumping / flying" (rappel : un éléphant ne saute pas) ; [identify] "What colour is the water? blue / red / green".
  - Bébé garçon : [locate] "Can you find something behind the rock?" ; [compare] "Who is bigger: Daddy or the calf?".
- Cohérence : l'éléphant boit à la trompe et sait nager : le plan d'eau est ici très cohérent. Aucune nourriture non plausible ; ne pas demander « sauter » ni « grimper ». Pas de crocodile ni de prédateur.
- Points d'attention : le « water » est une zone ouverte : parfait pour le doigt. Les roseaux sont fins (zone ≈ 6-8 % de large) ; les prendre en groupes. La mare est un très grand décor plat : l'éléphant, très gros, risque de la masquer : prévoir des zones vers les bords. L'image est assez proche de `africa_waterhole` (même ambiance, même structure) : si les deux familles (éléphant et girafe) sont jouées à la suite, l'enfant verra deux mares quasi semblables.

### Éléphants · décor 2 — The big plain / la grande plaine
- Image : `Animaux/Afrique/Elephants/Image ChatGPT 22 nov. 2026, 09_50_21-2.png` · Statut : NOUVEAU (proposer `africa_acacia_plain`). Aucun décor existant ne correspond exactement ; l'ancien `savanna` (monde) est de la même famille de palette.
- Ce qu'on voit : un énorme acacia sur la gauche (x 0-45 %, y 0-45 %, tronc x 3-14 %), un deuxième acacia de taille moyenne à droite (x 65-90 %, y 25-45 %), nombreux acacias plus petits en ligne à l'horizon ; fond : un volcan violet pointu (x 35-50 %, y 25-35 %) et une grande mesa rose à falaises (x 60-100 %, y 15-30 %) ; grosse herbe haute jaune (milieu y 40-52 %, et premier plan à gauche x 0-20 %, y 70-100 % et à droite x 80-100 %, y 65-100 %) ; rochers roses : un gros à gauche sous l'arbre (x 5-20 %, y 45-57 %), un à droite (x 87-100 %, y 45-57 %), un gros en bas droite (x 85-100 %, y 80-100 %), petits cailloux ; buissons verts ; nuages blancs ; vaste espace de terre jaune-orange au centre (x 15-80 %, y 55-85 %) prévu pour le troupeau.
- Histoire : le troupeau traverse la grande plaine. Le plus grand éléphant ouvre la marche et les éléphanteaux suivent en file ; ils s'arrêtent sous l'acacia pour manger les feuilles basses, à l'ombre.
- Vocabulaire nouveau : plain (la plaine) · acacia (l'acacia) · volcano / mountain (la montagne) · walk (marcher) · together (ensemble) · leaves. Vocabulaire réutilisé : tree, rock, grass, cloud, sun, big / small, herd, trunk, orange, yellow.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the big tree!" ; [identify] "Is the mountain blue?" (violette : réponse à décider).
  - Maman : [fetch] existant : apporter des leaves avec la trompe (zone acacia) ; [identify] "Is the grass yellow?".
  - Bébé fille : [count] "How many big trees?" (2) ; [locate] "Find the pink rock!".
  - Bébé garçon : [locate] "Where is Baby Boy? In the tall grass!" ; [identify] "Touch the cloud!".
- Intermédiaire :
  - Papa : [guide] "Daddy walks first. Who is behind Daddy?" (the baby / the tree / the cloud) (position + file) ; [compare] "Which tree is bigger?" (gauche / droite).
  - Maman : [observe] "What is Mummy eating? Leaves / fish / meat" (3 choix, 2 faux) ; [locate] "Is Mummy under the tree or next to the rock?".
  - Bébé fille : [count] "Can you find two pink rocks?" ; [tell] "Is the baby next to Mommy?".
  - Bébé garçon : [identify] "What colour is the grass? yellow / blue / red" ; [locate] "Can you find something behind the big rock?".
- Cohérence : éléphant herbivore, les feuilles de l'acacia (foods : grass, leaves, mango) : cohérent. Pas d'eau : pas de scène « boire » ici.
- Points d'attention : décor très ouvert : peu d'éléments touchables petits (bien pour le débutant) mais peu de variété de mots : les zones « volcan », « mesa » sont lointaines (zone haute, y 15-35 %) mais assez larges (≥ 15 % de large). Même type de couleurs que l'orpheline (voir « Anomalies ») : très similaire, ne pas ajouter les deux à la même famille. Les gros rochers du premier plan sont partiellement coupés par le bord.

### Éléphants · décor 3 — The shady forest / la forêt ombragée
- Image : `Animaux/Afrique/Elephants/Image ChatGPT 22 nov. 2026, 09_50_26-3.png` · Statut : NOUVEAU (proposer `africa_forest`). Aucun décor africain existant : forêt tropicale dense, très différente des autres décors d'Afrique.
- Ce qu'on voit : énorme tronc d'arbre à gauche (x 3-30 %, y 0-60 %) avec lianes pendantes (x 20-45 %, y 5-30 %), un autre tronc à droite (x 85-100 %, y 0-40 %) ; arbres moyens au centre-fond et rayons de lumière dorés (x 65-85 %, y 5-30 %) ; grandes feuilles de monstera et fougères au premier plan (bas droite x 80-100 %, y 70-100 % ; gauche y 20-55 %) ; 2-3 hibiscus rouges (bas gauche x 0-8 %, y 52-62 % ; bas droite x 76-85 %, y 88-97 % ; petit à droite x 86-92 %, y 52-55 %) ; 3 rochers gris (centre-gauche x 22-35 %, y 48-58 % ; droite x 70-90 %, y 45-60 % ; bas gauche x 0-12 %, y 85-100 %) ; clairière de terre rouge avec ombres de feuilles au centre (x 10-80 %, y 62-90 %) ; chemin qui s'enfonce vers le fond (x 40-60 %, y 55-65 %) ; touffes d'herbe verte.
- Histoire : à l'heure la plus chaude, la famille s'enfonce dans la forêt fraîche. Les éléphanteaux attrapent des feuilles et des lianes avec leur trompe et suivent les rayons de lumière jusqu'à un coin à l'ombre.
- Vocabulaire nouveau : forest (la forêt) · vine (la liane) · big leaf (la grande feuille) · light (la lumière) · shade (l'ombre) · hibiscus. Vocabulaire réutilisé : tree, leaf, rock, flower, red, green, trunk, big / small.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the big tree!" ; [identify] "Is the leaf green?" (oui).
  - Maman : [fetch] existant : cueillir une grande leaf avec la trompe ; [identify] "Touch the red flower!".
  - Bébé fille : [count] "How many red flowers?" (2 ou 3 : à fixer sur les zones réelles) ; [locate] "Find the rock!".
  - Bébé garçon : [locate] "Where is Baby Boy? Behind the big leaf!" ; [identify] "Is the rock blue?" (non).
- Intermédiaire :
  - Papa : [tell] "What is Daddy doing? Walking / swimming / flying" ; [compare] "Which tree is bigger?" (gauche / droite).
  - Maman : [locate] "Is Mummy under the big tree or next to the rock?" ; [observe] "What is Mummy eating? Leaves / fish / meat".
  - Bébé fille : [count] "Can you find two red flowers?" ; [identify] "Which leaf is bigger?".
  - Bébé garçon : [locate] "Can you find something behind the tree?" ; [tell] "Is the baby next to the rock?".
- Cohérence : forêt dense pour un éléphant : cohérent (éléphant de forêt). Nourriture plausible : feuilles. Ne pas faire grimper.
- Points d'attention : décor sombre en haut ; le bas est très feuillu (zones de feuilles de monstera pas toujours nettes). Les lianes sont fines. La clairière centrale est visible et large, parfaite pour 4 personnages. Aucun animal sauvage ni piège dans l'image. Attention : les « pierres grises » ressemblent à ceux des autres décors éléphant : seule la forêt change de famille de mots.

---

## Girafes (giraffe) — Afrique
- Personnages : Papa Gus (calme), Maman Gina (curieuse, fleur rose sur l'oreille), Bébé fille (nœud rose), Bébé garçon (casquette bleue sur les phases moyennes, voir « Anomalies ») ; mot du bébé : calf (girafon). Planche : 4 phases par sexe (couchée, debout, patte levée, grande).
- Jeu propre existant : `giraffe_neck` « The giraffe's long neck » (mécanique `tell`, domaines 1.4 / 2.2 / 3.4, minStage `little`, rôles père + mère + bébé) : cartes Run / Eat leaves / Swing your neck / Take a nap / Climb (piège : les girafes ne grimpent pas), « Is my neck long or short? », feuilles tout en haut de l'arbre, « What colour is my tongue? purple », « Spots or stripes? », « Who is the tallest animal? ». Mots propres : neck, spots, tongue, tallest, up high, leaves.
- Objectifs pédagogiques de la famille : 1.4 (grand / petit, haut / bas : la girafe est la plus grande) ; 3.4 (comparer les hauteurs) ; 2.2 (corps : cou, taches, langue) ; 1.3 (compter : nénuphars, fleurs, termitières) ; positions (derrière, près de, sous l'arbre).
- Fil rouge des 3 décors : la mare = boire en écartant les pattes, nénuphars, reflets ; la plaine à chemin = le voyage, suivre le sentier sinueux, regarder de haut les termitières ; la prairie verte = la saison fraîche, les feuilles de l'acacia très haut, les termitières à comparer en hauteur.

### Girafes · décor 1 — The lily pond / la mare aux nénuphars
- Image : `Animaux/Afrique/Girafes/Image ChatGPT 19 nov. 2026, 08_59_49-1.png` · Statut : déjà dans le jeu sous `africa_waterhole` (11 zones dont `lily_pad`).
- Ce qu'on voit : mare bleu turquoise au centre (x 25-75 %, y 38-62 %) avec 3 groupes de nénuphars blancs (gauche x 28-38 %, y 47-55 % ; haut x 33-38 %, y 40-43 % ; droite x 58-76 %, y 48-58 %) ; roseaux typha de chaque côté (gauche x 18-28 %, y 28-45 % ; droite x 72-85 %, y 28-45 %) ; rochers brun-orange tout autour de la mare (gauche x 8-28 %, y 45-57 % ; droite x 78-95 %, y 40-62 %) ; 2 acacias parasol au fond (gauche x 1-25 %, y 12-30 % ; droite x 80-100 %, y 15-30 %) ; mesa rose au fond ; fleurs : buissons à fleurs roses (gauche x 4-15 %, y 36-48 % ; droite x 92-100 %, y 48-55 %), hibiscus orange (bas gauche x 3-12 %, y 80-90 % ; bas droite x 92-100 %, y 82-92 %), petites fleurs blanches ; épis d'herbe dorée au premier plan ; grande terre orange devant la mare (centre bas) ; soleil non visible, 8 nuages.
- Histoire : la girafe vient boire à la mare, en écartant bien ses longues pattes. Le girafon observe les nénuphars blancs sur l'eau et apprend à se baisser doucement pour boire, pendant que les parents veillent.
- Vocabulaire nouveau : water lily (le nénuphar) · lily pad (la feuille de nénuphar) · drink (boire) · bend down (se baisser) · reed. Vocabulaire réutilisé : neck, long, tree, rock, flower, blue, white, pink, orange, big / small, tall.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the water!" ; [identify] "Is the water lily white?" (déjà dans le code).
  - Maman : [count] "How many water lilies?" (groupes : 3 ou 4 fleurs blanches, à fixer) ; [identify] "Touch the orange flower!".
  - Bébé fille : [locate] "Find the big rock!" ; [identify] "Is the rock small?".
  - Bébé garçon : [locate] "Find the tree!" ; [identify] "Is the water blue?".
- Intermédiaire :
  - Papa : [compare] "Who is taller: Daddy or the baby?" ; [locate] "Is Daddy next to the water or behind the rock?".
  - Maman : [observe] "What is Mummy doing? Drinking / flying / climbing" ; [count] "Can you find two white flowers on the water?".
  - Bébé fille : [tell] "Why does the giraffe bend down? To drink / to sleep / to fly" (réponse simple) ; [identify] "What colour are the lily pads? green / red / blue".
  - Bébé garçon : [locate] "Can you find something behind the reeds?" ; [compare] "Which rock is bigger?".
- Cohérence : la girafe boit en écartant les pattes (`drinkStyle: splay`) : cohérent. Mangeant des feuilles seulement. Elle ne grimpe pas. Pas de crocodile.
- Points d'attention : très proche du décor de l'éléphant `africa_pond` (voir « Anomalies »). Les nénuphars sont petits (≈ 6-10 % de large) : zones à agrandir ; les groupes sont plus faciles que les fleurs isolées. Aucun grand arbre à portée de la girafe (feuilles « tout en haut ») : cette image convient moins au jeu « feuilles hautes » : les acacias sont au fond.

### Girafes · décor 2 — The winding path / le chemin dans l'herbe dorée
- Image : `Animaux/Afrique/Girafes/Image ChatGPT 19 nov. 2026, 09_00_00-5.png` · Statut : déjà dans le jeu sous `africa_plains` (10 zones).
- Ce qu'on voit : grand acacia à gauche (x 0-40 %, y 2-50 %, tronc penché x 8-18 %) ; autres acacias en rangée au centre-fond (x 28-55 %, y 30-45 %) et à droite (x 80-100 %, y 30-45 %) ; 2 termitières rouges (gauche x 17-27 %, y 40-52 % ; petite au fond droit x 65-70 %, y 40-45 %) ; sentier de terre sinueux qui part du bas centre (x 30-45 %, y 85-100 %) et s'éloigne vers la droite et le fond (x 70-85 %, y 45-60 %) ; herbe dorée haute avec épis au premier plan (gauche x 0-15 %, y 45-90 % ; droite x 78-100 %, y 60-100 %) ; fleurs : roses en bas gauche (x 5-17 %, y 68-82 %), hibiscus orange (x 3-8 %, y 83-90 %), violettes et roses près des rochers à droite (x 85-95 %, y 65-80 %), hibiscus rose vif (x 92-98 %, y 78-88 %), lupins violets au centre (x 28-38 %, y 52-56 %) ; rochers bruns : 2 en bas gauche (x 14-27 %, y 74-100 %) et 2 en bas droit (x 68-85 %, y 83-95 %) ; montagnes violettes au fond droit ; soleil en haut à droite ; nuages.
- Histoire : la famille girafe suit le chemin sinueux dans les hautes herbes dorées. Le girafon se met sur la pointe des sabots pour voir par-dessus l'herbe et les termitières, et la mère lui montre les feuilles tout en haut de l'acacia.
- Vocabulaire nouveau : termite mound (la termitière) · path (le chemin) · tall grass (les hautes herbes) · mountain · follow (suivre). Vocabulaire réutilisé : tree, leaves, tall, neck, long, flower, rock, sun, cloud, pink, orange, purple.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the tall tree!" ; [identify] "Is the tree tall?" (existant).
  - Maman : [fetch ou identify] "Touch the leaves up high!" (feuilles de l'acacia de gauche) ; [identify] "Is the path long?".
  - Bébé fille : [count] "How many termite mounds?" (2) ; [locate] "Find the pink flower!".
  - Bébé garçon : [locate] "Find the rock!" ; [identify] "Is the termite mound blue?" (non).
- Intermédiaire :
  - Papa : [guide] `follow_tracks` existant (« Follow the footprints », biome africa_plains) ; [compare] "Who is taller: Daddy or the termite mound?".
  - Maman : [locate] "Is Mummy under the tree or next to the path?" ; [count] "Can you find two purple flowers?".
  - Bébé fille : [compare] `race` existant (« Let's race! », young+) ; [identify] "What colour are the tall grasses? Yellow / blue / red".
  - Bébé garçon : [tell] "Can you find something behind the termite mound?" ; [observe] "What is the baby doing? Walking / swimming / flying".
- Cohérence : girafe dans une savane herbeuse avec acacias : milieu naturel ; elle mange les feuilles d'acacia, pas l'herbe (la girafe ne se baisse pour l'herbe que pour boire) : ne pas poser « eat the grass ». Aucune prédation.
- Points d'attention : la zone « tree » du code est énorme (40 % de large) : facile pour un enfant. Les termitières sont compactes (≈ 10 % de large) ; au débutant elles sont bien visibles. TRÈS semblable au décor 3 (même motif : chemin sinueux + acacias + termitières + rochers + fleurs), voir « Anomalies » : écart de palette (herbe dorée sèche ici, vert printanier là) mais même structure.

### Girafes · décor 3 — The green meadow / la prairie verte
- Image : `Animaux/Afrique/Girafes/Image ChatGPT 22 nov. 2026, 09_50_57-3.png` · Statut : NOUVEAU (proposer `africa_green_meadow`).
- Ce qu'on voit : baobab / gros acacia au tronc épais à gauche (x 0-18 %, y 0-65 %) avec large couronne en haut (x 0-55 %, y 0-30 %) ; autre acacia à droite (x 80-100 %, y 8-45 %, tronc x 88-95 %) ; deux acacias jumeaux au centre-droit (x 48-78 %, y 22-50 %) ; 3 termitières rouges (gauche x 20-30 %, y 45-57 % ; grosse à droite x 78-95 %, y 42-65 % ; petite au fond x 53-57 %, y 48-52 %) ; mesa rose à gauche au fond (x 15-35 %, y 32-42 %) ; sentier rouge sinueux (x 35-70 %, y 55-100 %) ; herbe verte tendre ; buissons à fleurs : hibiscus roses/magenta en bas gauche (x 0-22 %, y 68-85 %) ; hibiscus jaunes à droite (x 83-100 %, y 68-82 %) ; buisson orange (x 29-38 %, y 55-62 %) et violet (x 33-42 %, y 52-58 % ; x 76-85 %, y 52-62 %) ; rochers rouges (gauche x 13-25 %, y 58-70 % et x 25-40 %, y 62-72 % ; bas gauche x 5-22 %, y 85-100 % ; bas droite x 72-85 %, y 80-95 %, x 83-100 %, y 87-100 %) ; nuages dont un gros en haut à droite.
- Histoire : après la pluie, la prairie est toute verte et fleurie. La girafe grignote les jeunes feuilles de l'acacia tout en haut, et le girafon compare la taille des termitières et se compare à elles.
- Vocabulaire nouveau : green meadow / grass (l'herbe verte) · yellow flower (la fleur jaune) · red path · mound · bloom. Vocabulaire réutilisé : tree, termite mound, path, rock, flower, leaves, tall, pink, yellow, purple, orange.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the big tree!" ; [identify] "Is the grass green?" (oui).
  - Maman : [identify] "Touch the yellow flower!" ; [fetch] « leaves up high » à l'acacia de droite.
  - Bébé fille : [count] "How many termite mounds?" (3 grandes visibles) ; [identify] "Is the rock red?".
  - Bébé garçon : [locate] "Find the red path!" ; [identify] "Touch the pink flower!".
- Intermédiaire :
  - Papa : [compare] "Which termite mound is taller? The big one / the small one / the tree" ; [locate] "Is Daddy next to the tree or behind the rock?".
  - Maman : [count] "Can you find two yellow flowers?" ; [observe] "What is Mummy doing? Eating leaves / swimming / flying".
  - Bébé fille : [tell] "Is the baby taller than the termite mound?" ; [identify] "What colour is the path? red / blue / green".
  - Bébé garçon : [locate] "Can you find something behind the big tree?" ; [compare] "Which rock is bigger?".
- Cohérence : même vérifications que le décor 2. L'herbe verte n'est pas la nourriture de la girafe : seulement les feuilles d'acacia.
- Points d'attention : très semblable au décor 2 (mêmes éléments, même composition) : si les deux sont dans la même famille, l'enfant ne perçoit presque pas de différence. À différencier par l'histoire (saison verte, floraison, comparaisons de hauteur) et par des mots différents (yellow flower, red path, comparaison tall / taller), pas par la forme. Le tronc de gauche ressemble à un jeune baobab. Beaucoup de fleurs colorées : bon pour les couleurs.

---

## Anomalies — Afrique

1. **Lions : un seul portrait par sexe dans le code.** `src/content/assetManifest.json` ne contient que `lion_father`, `lion_mother`, `lion_boy`, `lion_girl` (sans phase) ; les fichiers `public/assets/characters/lion_*.webp` datent du 20 nov. Les éléphants et girafes ont bien 10 entrées chacun (father, mother, girl et boy × newborn / little / young / companion). La planche `Animaux/Afrique/Lions/Famille de lions en évolution.png` (fond vert) montre pourtant bien 8 bébés : 4 phases par sexe (assis, assis plus grand, qui marche, grand) + père et mère couchés. Conséquence : le lionceau ne grandit pas visuellement. Il faut découper la planche en 8 bébés (+ 2 parents), générer `lion_girl_newborn…companion` et `lion_boy_newborn…companion` dans `public/assets/characters/` et dans `assetManifest.json`, et vérifier que le code de croissance remplace `lion_boy` / `lion_girl`.
2. **Lions : le père et la mère de la planche sont couchés.** Les parents sont dessinés allongés (père à crinière à gauche, mère à droite) : adaptés aux scènes de sieste, moins pour « se promener » ou « grimper ». Vérifier la hauteur de pose dans les décors (baobab OK, sentier de falaise et sol sec moins naturels).
3. **Lions : décors du code qui sortent du parcours.** `africa_waterhole` (mare), `africa_plains` (plaine) et `savanna` (monde) ne sont plus dans la famille lion. Mots et jeux qui y vivaient et sont à replacer : `who_in_water` (identify, mare + savanna) ; `follow_tracks` et `race` (plains + savanna) ; `sun_and_shade` garde `africa_desert` (OK). `echo_canyon` et `climb_rock` restent (canyon, desert). Le lion perd donc tout jeu d'eau : seules les histoires nouvelles peuvent combler (ex. « footprints in the sand » dans la savane sèche, déjà couvert par `sun_and_shade`).
4. **Image orpheline** : `Animaux/Image ChatGPT 22 nov. 2026, 09_50_52-1.png` (à la racine) montre une savane herbeuse jaune : grand acacia penché à gauche (x 0-50 %, y 0-60 %), un acacia en parasol à droite, 5-6 petits acacias au fond, collines douces beiges, 3-4 rochers gris (bas droit gros, gauche), grande terre orange vide au centre, herbe jaune au premier plan ; ni eau, ni sentier, ni termitière, ni montagne marquée. Elle est quasiment identique à `Elephants/…09_50_21-2.png` (même arbre, mêmes rochers, mêmes herbes), avec un fond d'horizon plus calme (pas de volcan, pas de mesa). Usage suggéré : variante apaisante pour la famille lion ou éléphant si le décor 2 de l'éléphant (volcan + mesa) paraît trop chargé ; ou simple double. Pour le lion elle ne remplace aucun décor (déjà baobab + savane sèche + falaise) ; pour l'éléphant elle ferait doublon avec `africa_acacia_plain`. Il est préférable de ne pas l'ajouter sans décision du parent.
5. **Girafe : canyon interdit dans le code.** `src/content/species.ts` l.24 : `allowedBiomes: AFRICA.filter((p) => p !== 'africa_canyon')`. Cohérent : la girafe ne grimpe pas, et l'image 3 des lions est justement un sentier rocheux. Les 3 décors des girafes (mare, chemin, prairie verte) n'incluent pas le canyon : aucun conflit. Une fois la liste de lieux remplacée par les 3 décors de chaque famille, la ligne `.filter(…canyon)` devient inutile.
6. **Girafes : deux décors presque jumeaux.** `Girafes/…09_00_00-5.png` (`africa_plains`) et `Girafes/…09_50_57-3.png` (NOUVEAU) : même composition (acacia gauche, termitières, sentier sinueux, rochers, fleurs) : seule la saison (herbe dorée / herbe verte) change. À différencier par l'histoire et le vocabulaire, pas par les zones. Même constat à moindre degré entre la mare des girafes (`africa_waterhole`) et la mare des éléphants (`Elephants/…09_50_19-1.png`, futur `africa_pond`) : deux plans d'eau très proches.
7. **Éléphants : trois nouveaux ids de décor à créer.** Aucun des trois n'existe dans le jeu (statut NOUVEAU dans le fichier de correspondance du brief) : ids proposés `africa_pond`, `africa_acacia_plain`, `africa_forest`. À créer : entrée dans `src/content/places/africa.json` (anchors), `assetManifest.json` (fond), `depth.ts` (`horizonY`, `farY`, zone d'eau pour la mare), liste `AFRICA` / `allowedBiomes` de l'éléphant dans `species.ts`, et `allowedBiomes` des archétypes (par ex. `who_in_water` pour `africa_pond`, `follow_tracks` et `race` pour `africa_acacia_plain`) sinon les jeux de décor ne se déclenchent pas.
8. **Éléphants / girafes : jeux propres à des décors disparus.** `windy_baobab` et `baobab_nest` (biome `africa_baobab` uniquement, ancrage `baobab`) ne seront plus jouables que par le lion ; `sun_and_shade`, `echo_canyon` et `climb_rock` (desert / canyon) ne seront plus jouables que par le lion. `who_in_water` reste utilisable par la girafe (mare) et, à ajouter, par l'éléphant (nouvelle mare). `follow_tracks` et `race` (plains) restent pour la girafe. L'éléphant n'aura aucun de ces jeux de décor tant que les `allowedBiomes` ne sont pas étendus.
9. **Girafe : casquette bleue sur le bébé garçon.** Sur `Girafes/planche_reference_girafes.png`, les bébés garçons des phases 3 et 4 portent une casquette bleue à l'envers ; le bébé fille porte un nœud rose, la mère une fleur. Vérifier que la phase « newborn » du garçon (sans casquette ?) est bien cohérente avec les autres. Fond de la planche : dégradé sombre chaud avec halo (non transparent) : s'assurer que le détourage des 10 webp est propre (pas de halo orange autour des silhouettes).
10. **Éléphants : bébés bien présents.** `public/assets/characters/elephant_*` et `giraffe_*` : les 10 fichiers existent pour chaque famille (father, mother, girl / boy × newborn, little, young, companion) et sont déclarés dans `assetManifest.json`. Seul le lion manque (voir 1). Bébé fille éléphant : nœud rose ; bébé garçon : houppe grise : différenciation visible.
11. **Nom du décor « le désert » (lions).** `africa_desert` est une savane sèche avec acacia (herbe, buissons, pas de dunes) : le mot « desert » y est trompeur ; la zone « sand dune » n'est pas vraiment une dune marquée. Renommer en « la savane sèche » (nameEn « the dry savanna ») ; le mot « canyon » pour le décor 3 est aussi un peu fort : il s'agit d'un sentier au bord d'une falaise.
12. **Zones minuscules.** Dans toutes les images, les fleurs isolées, les petits cailloux, les nénuphars et les roseaux font moins de 8 % de large : au niveau débutant, les zones à toucher doivent rester celles de plus de 10 % de large (arbre, rocher, mare, termitière, chemin, soleil) ; les petites zones seulement en intermédiaire (ou agrandies pour le doigt).
13. **Résolution.** Les 9 décors font 1672 × 941 px (lus par l'outil de lecture) : suffisant, aucun flou à signaler. Les planches (1536 × 1024) servent uniquement à regarder les personnages.


---

# Amérique du Nord — cartographie des parcours (3 familles × 3 décors = 9)

Date : 2026-11-23. Repères : positions en % de la largeur (x) et de la hauteur (y) de l'image, lues sur les PNG.
Domaines cités = `docs/PROGRESSION_PEDAGOGIQUE.md` (1.3 nombres, 1.5 espèce/mots, 2.2 nourriture, 2.3 actions, etc. tels qu'utilisés par les jeux existants).
Mécaniques existantes utilisées au débutant : locate, identify, count, compare, observe, fetch, social, build. Débutant = 2 réponses, phrases très courtes ; intermédiaire = 3 réponses.
Les objets (miel, branches, bisons…) sont posés par le jeu sur la terre ferme (`ground()` dans `north_america.ts`) : les décors n'ont donc pas à les montrer.

---

## Ours brun (bear) — Amérique du Nord
- Personnages : Papa Bruno (fort), Maman Bella (chaleureuse), Bébé fille, Bébé garçon (mot : cub / ourson). Planche vue : ours très fourrus, brun roux, museau crème ; Maman a une fleur rose d'hibiscus dans l'oreille ; bébés fille avec nœud rose ; 4 phases (assis, quadrupède, patte levée, grand).
- Jeu propre existant : `bear_honey` « Sniff, sniff! Honey! » — pattes (paws), griffes (claws), fourrure douce, renifler le miel (baies à l'intermédiaire), refuser herbe/bambou, cartes (se dresser, grogner, grimper, dormir), « Where do bears sleep in winter? » (den). Mots propres déjà en jeu : paws, claws, fur, honey, berries, den, cub.
- Objectifs pédagogiques de la famille : 1.5 (mots de l'ours, parties du corps) ; 2.2 (ce que mange l'ours, miel/baies) ; 1.3 (compter feuilles, baies, pattes) ; 2.3 (grimper, grogner, dormir) ; couleurs (feuilles rouges, tronc roux).
- Fil rouge des 3 décors : saison qui avance. Forêt de séquoias = l'été et le miel dans les grands arbres ; lac des Rocheuses = l'automne, on ramasse feuilles rouges et on prépare l'hiver ; tanière = l'hiver, le grand dodo. Trois ambiances (soleil doré, bleu/rouge d'automne, blanc de neige).

### Ours brun · décor 1 — The redwood forest / La forêt de séquoias
- Image : `Animaux/Amerique du Nord/Ours_Bruns/01_Foret_de_sequoias.png` (1672×941) · Statut : déjà dans le jeu sous `na_redwoods` (score 1.0). Actuellement aussi autorisé pour le castor : à retirer de `beaver` (voir Anomalies).
- Ce qu'on voit : 4 troncs de séquoias géants rouge-orangé (x 0-25 très gros avec racines moussues y 55-70 ; x 41-52 ; x 70-80 baigné de rayons de soleil en haut x 70-80 y 0-40 ; x 88-100) ; petit sapin vert au centre-gauche (x 30-40, y 40-62) ; fougères en bas-gauche (x 0-22, y 65-100) et à droite (x 85-100, y 50-65) ; fleurs roses (lupins) à gauche (x 0-9, y 55-75), fleurs violettes à droite (x 77-86, y 55-62), fleurs orange (pavots, x 88-100, y 72-82) ; marguerites blanches minuscules (x 12-18, y 65-70) ; gros rochers moussus bas-gauche (x 12-26, y 77-92), droite (x 82-100, y 62-76) et bas-droite (x 85-100, y 84-100) ; large chemin de terre orange au centre (x 25-85, y 66-100).
- Histoire : Papa Bruno sent une odeur sucrée dans la forêt : il y a du miel haut dans les grands arbres. Toute la famille suit le chemin de terre entre les troncs, en cherchant les bons arbres, pendant que les rayons de soleil guident la promenade. Le chemin est le fil du jeu : on passe d'un arbre à l'autre.
- Vocabulaire nouveau : redwood (le séquoia) · fern (la fougère) · sunbeam (le rayon de soleil) · path (le chemin) · moss (la mousse) — Vocabulaire réutilisé : honey, paws, tree, flower, rock, big, small, colors, numbers, cub.
- Débutant — interactions par personnage :
  - Papa : [locate] "Daddy sniffs! Find the big redwood!" (Papa renifle ! Trouve le grand séquoia !)
  - Maman : [identify] "Mommy sees a flower. Is it pink?" (Maman voit une fleur. Est-elle rose ?) — Oui / Non, zone : lupins roses gauche
  - Bébé fille : [locate] "Baby Girl, touch the green fern!" (Touche la fougère verte !) — zone fougère gauche grande
  - Bébé garçon : [count] "How many rocks? One or two?" (Combien de rochers ? Un ou deux ?) — compter les 2 rochers du bas-droite (phase `little` min)
- Intermédiaire :
  - Papa : [locate] "Can you find the sunbeam behind the big tree?" (position : behind)
  - Maman : [compare] "Which tree is bigger, this one or this one?" (comparaison : left giant trunk vs small fir)
  - Bébé fille : [identify] "What color is the bear's tree: red, green or blue?" (couleur tronc roux)
  - Bébé garçon : [fetch] "Baby Boy sniffs! Is the honey next to the rock?" (next to, 3 choix de positions)
- Cohérence : l'ours mange miel et baies (jamais poisson ici, aucun lac). Il sait grimper : les séquoias sont énormes mais l'ours reste au sol dans le jeu ; aucune prédation, aucun danger.
- Points d'attention : fleurs trop petites pour un doigt sauf lupins roses (gauche) et pavots (bas-droite) ; le chemin central est grand : bon pour poser les props. Ressemble beaucoup à `na_redwood_trail` du castor : bien séparer les deux familles.

### Ours brun · décor 2 — The mountain lake / Le lac des Rocheuses
- Image : `Animaux/Amerique du Nord/Ours_Bruns/03_Lac_des_Rocheuses.png` (1672×941) · Statut : déjà dans le jeu sous `na_lake` (score 1.0). À retirer du castor.
- Ce qu'on voit : grand érable aux feuilles rouges et orange en haut-gauche (tronc x 0-9, feuillage x 0-58, y 0-25) ; cascade à gauche (x 15-26, y 33-50) ; grand lac turquoise au centre (x 18-98, y 48-78) avec reflets d'automne ; montagnes enneigées au fond (x 33-95, y 10-35) ; forêt de sapins et arbres jaune/orange (x 5-100, y 25-48) ; canoë rouge échoué à droite (x 68-92, y 64-80) ; gros rochers gris bas-gauche (x 8-32, y 57-100) et bas-droite (x 87-100, y 70-90) ; feuilles d'érable rouges au sol (x 0-15, y 70-90 et semées vers le centre) ; chemin de terre en bas (x 25-80, y 80-100) ; grandes herbes (x 17-27, y 55-65).
- Histoire : C'est l'automne. Maman Bella rassemble des feuilles rouges et des baies avant l'hiver ; les petits découvrent le canoë rouge et se demandent à qui il est. L'eau est belle, mais les ours restent au bord : on regarde la cascade et les reflets avant de rentrer.
- Vocabulaire nouveau : maple (l'érable) · leaf (la feuille) · lake (le lac) · waterfall (la cascade) · canoe (le canoë) — Vocabulaire réutilisé : red, yellow, rock, tree, mountain, big, honey, berries, path.
- Débutant :
  - Papa : [locate] "Daddy, where is the canoe? Touch the red canoe!" (Où est le canoë ? Touche le canoë rouge !)
  - Maman : [count] "Mommy has red leaves. How many? Two or three?" (feuilles d'érable au sol, 2-3 visibles par zone)
  - Bébé fille : [identify] "Baby Girl, is this a lake?" (Est-ce un lac ?) — Oui / Non (montagne)
  - Bébé garçon : [locate] "Baby Boy, find the waterfall!" (Trouve la cascade !)
- Intermédiaire :
  - Papa : [compare] "Which is bigger, the canoe or the rock?" (comparer deux éléments)
  - Maman : [locate] "Can you find two red leaves under the tree?" (couleur + quantité + under)
  - Bébé fille : [observe] "What is the water doing? Is it blue and calm?" (descriptions courtes : blue, calm)
  - Bébé garçon : [identify] "Is the canoe next to the rocks?" (next to)
- Cohérence : pas de pêche ni poisson (l'ours se nourrit de baies et miel ; poisson autorisé par `foods` mais non montré). Les props ne sont pas posés dans l'eau (anchors `lake` et `waterfall` marqués `water`). Le canoë est un objet humain sans personne : décor neutre, pas d'absurdité.
- Points d'attention : le canoë est bien visible (24×15 %), c'est la meilleure cible tactile ; la cascade est petite-moyenne ; beaucoup de rochers gris à gauche = bon pour « rock ». Ressemble au lac du castor (`na_beaver_pond`) : eau + montagne, mais ici automne rouge.

### Ours brun · décor 3 — The winter den / La tanière hivernale
- Image : `Animaux/Amerique du Nord/Ours_Bruns/03_Taniere_hivernale.png` (**763×506**, ratio 1,51 au lieu de 1,78) · Statut : NOUVEAU → proposer `na_bear_den`.
- Ce qu'on voit : grotte-tanière dans un gros rocher couvert de neige à droite (ouverture sombre x 68-93, y 40-72 ; paille/foin au sol de la tanière x 65-92, y 60-72) ; stalactites de glace petites au centre-droit (x 68-72, y 22-48, très étroites) ; mousse verte sur les pierres (x 40-68, y 35-55) ; gros rochers enneigés au centre (x 40-60, y 55-70) ; 4-5 sapins enneigés à gauche et au centre-haut (x 0-45, y 0-60) ; montagnes neigeuses au fond gauche (x 7-35, y 22-40) ; buisson sec sans feuilles en bas-gauche (x 3-20, y 60-85) ; grande étendue de neige devant (x 0-100, y 70-100) ; petits rochers dans la neige bas-gauche et bas-droite.
- Histoire : L'hiver est arrivé. Les ours sont fatigués, la tanière est prête avec son lit de paille. Papa et Maman montrent aux petits comment se préparer : compter les rochers, repérer l'entrée, puis on entre doucement et on fait « chut » pour le grand dodo. C'est l'histoire du sommeil d'hiver, calme et tendre.
- Vocabulaire nouveau : den (la tanière) · snow (la neige) · cold (froid) · straw (la paille) · icicle (le glaçon) — Vocabulaire réutilisé : rock, tree, pine tree, mountain, white, big, small, sleep, cub.
- Débutant :
  - Papa : [locate] "Daddy is cold! Find the den!" (Papa a froid ! Trouve la tanière !)
  - Maman : [identify] "Mommy sees the snow. Is the snow white?" (Oui / Non)
  - Bébé fille : [locate] "Baby Girl, find the pine tree!" (sapin enneigé à gauche, grande cible)
  - Bébé garçon : [count] "How many big rocks in the snow? Two or three?" (rochers enneigés du centre)
- Intermédiaire :
  - Papa : [locate] "Can you find something behind the rock?" (behind, l'entrée derrière les rochers)
  - Maman : [observe] "Is the den warm or cold inside?" (comparer ; réponse : warm, paille) + « Where do bears sleep in winter ? » (reprise du jeu `bear_honey`)
  - Bébé fille : [compare] "Which is bigger, the den or the rock?"
  - Bébé garçon : [social] "Baby Boy is sleepy. Is he in the den or in the snow?" (position : in)
- Cohérence : aucune nourriture visible, donc pas de miel/baies ici : décor dédié au sommeil d'hiver (conforme à `bear_honey`, question den). Les props du jeu miel (honey, berries) n'ont pas de sens dans la neige : prévoir de masquer cette partie, ou déjà jouer le miel au décor 1.
- Points d'attention : **image trop petite** (763×506 étirée à 1672×941 ou plus : flou visible, détails de la neige et de la tanière mous) ; stalactites trop fines pour un doigt ; le décor est le plus « vide » : peu d'éléments à toucher (tanière, sapins, rochers, neige, glaçons, buisson). Zone d'entrée de tanière à vérifier : paille visible mais ombre profonde, l'ours dort à l'intérieur (invisible).

---

## Bison (bison) — Amérique du Nord
- Personnages : Papa Buck (calme), Maman Daisy (gentille), Bébé fille, Bébé garçon (mot : calf / bisonneau). Planche vue : bisons roux très laineux, cornes crème, bosse, queue à pompon ; Maman a une fleur rose d'hibiscus ; bébé fille avec nœud rose ; les bébés ont de petites cornes dès la phase 2.
- Jeu propre existant : `bison_herd` « The bison herd » — cornes (horns), bosse (hump, « On your back »), compter le troupeau (3 à 5 bisons ; un cerf en intrus à l'intermédiaire), courir avec le troupeau, manger de l'herbe, cartes (taper des sabots, rouler dans la poussière, courir, grimper = faux), les parents tapent des sabots / roulent dans la poussière. Mots propres : horns, hump, herd, hooves, dust, grass, calf.
- Objectifs pédagogiques : 1.3 (compter le troupeau) ; 1.5 (mots du bison) ; 2.2 (herbe) ; 2.3 (taper, rouler, courir) ; prépositions et couleurs (fleurs violettes/jaunes).
- Fil rouge des 3 décors : même troupeau, trois façons de vivre la grande prairie. Prairie = on broute et on compte ; alpage = on traverse le ruisseau et on se désaltère ; canyon = on se rafraîchit, on se roule dans la terre rouge. On compte partout, mais à chaque fois autre chose (herbe, rochers, fleurs).
- Décors actuels du bison dans le code : `na_prairie`, `na_desert`, `na_lake` — aucun ne correspond à ses 3 nouvelles images (voir Anomalies).

### Bison · décor 1 — The flowery prairie / La prairie fleurie
- Image : `Animaux/Amerique du Nord/Bisons/Prairie nord-américaine fleurie et montagneuse-1.png` (1672×941) · Statut : NOUVEAU → proposer `na_bison_prairie` (≠ `na_prairie` qui est une autre image, `Continant/Amerique du nord/02_Grandes_prairies.png`).
- Ce qu'on voit : immense prairie d'herbe jaune dorée (x 5-100, y 47-100) ; grand chêne à gauche (tronc x 0-9, feuillage x 0-47, y 0-25) ; collines et montagnes lointaines (x 5-90, y 20-47) ; sapins à droite (x 88-100, y 0-47 ; x 72-82, y 35-47) et à gauche (x 8-18, y 22-47) ; ruisseau à droite (x 68-100, y 58-72) avec petits rochers ; gros rochers bas-gauche (x 0-32, y 67-95) ; lupins violets à gauche (x 1-12, y 52-70) et bas-droite (x 85-98, y 75-95) ; marguerites jaunes bas-gauche (x 0-14, y 80-98) ; nuages (x 70-95, y 2-15).
- Histoire : Le troupeau arrive dans la grande prairie dorée. Papa Buck compte les bisons ; Maman Daisy broute l'herbe. Les petits cherchent les fleurs violettes et le ruisseau. Un grand espace ouvert pour courir ensemble.
- Vocabulaire nouveau : prairie/meadow (la prairie) · grass (l'herbe) · stream (le ruisseau) · hill (la colline) · lupine (le lupin) — Vocabulaire réutilisé : horns, hump, herd, flower, rock, tree, mountain, yellow, purple, numbers.
- Débutant :
  - Papa : [count] "Daddy counts the herd! How many bison? Two or three?" (jeu `bison_herd`)
  - Maman : [identify] "Mommy eats grass. Is the grass yellow?" (Oui / Non)
  - Bébé fille : [locate] "Baby Girl, touch the purple flower!" (lupins violets gauche)
  - Bébé garçon : [locate] "Baby Boy, find the big tree!" (chêne à gauche)
- Intermédiaire :
  - Papa : [compare] "Which is bigger, the bison or the rock?"
  - Maman : [locate] "Can you find two purple flowers next to the rock?" (couleur + quantité + next to)
  - Bébé fille : [observe] "What is Mommy doing? Eating, running or sleeping?"
  - Bébé garçon : [locate] "Where is the stream? Near the trees?" (near)
- Cohérence : herbe = vraie nourriture ; le bison court, ne grimpe pas : le chêne est un repère, pas un perchoir. Aucun prédateur. Un cerf comme intrus au compte reste plausible.
- Points d'attention : ruisseau petit et à l'extrême droite (zone `water` à déclarer pour que les props évitent l'eau) ; l'herbe haute en premier plan peut cacher les props ; très semblable au décor 2 (même chêne à gauche, lupins, ruisseau à droite) : différencier par la montagne rose/basse et l'herbe jaune sèche.

### Bison · décor 2 — The alpine meadow / L'alpage fleuri et la rivière
- Image : `Animaux/Amerique du Nord/Bisons/Panorama alpin fleuri et rivière scintillante-2.png` (1672×941) · Statut : NOUVEAU → proposer `na_bison_alpine`.
- Ce qu'on voit : grandes montagnes rocheuses enneigées (x 20-97, y 3-35) ; soleil en haut à droite (x 95, y 0) ; forêt de sapins étagée (x 0-100, y 28-55) ; petit lac au fond (x 38-52, y 47-52) ; rivière avec rapides (x 55-100, y 55-72) ; chêne en haut-gauche (tronc x 0-10, y 0-65) ; gros tronc couché en bas-gauche (x 0-28, y 72-92) ; lupins violets (x 8-25, y 62-80 ; x 74-85, y 75-92) ; buisson rouge/orange à droite (x 86-100, y 68-85) ; fleurs jaunes bas-gauche (x 0-12, y 85-100) ; rochers (x 5-20, y 48-62 ; x 40-60, y 65-78 ; x 78-90, y 55-65 ; x 80-100, y 82-100).
- Histoire : Le troupeau monte vers l'alpage au printemps, entre montagnes et rivière claire. On s'arrête pour boire à la rivière et manger l'herbe verte et fraîche. Les petits comptent les rochers et trouvent le grand tronc couché.
- Vocabulaire nouveau : river (la rivière) · log (le tronc couché) · mountain (la montagne) · snow (la neige) · drink (boire) — Vocabulaire réutilisé : grass, flower, rock, tree, herd, big, blue, green, purple.
- Débutant :
  - Papa : [locate] "Daddy is thirsty! Find the river!" (Papa a soif ! Trouve la rivière !)
  - Maman : [identify] "Mommy eats grass. Is the grass green?" (Oui / Non)
  - Bébé fille : [count] "How many rocks near the log? One or two?" (rochers gauche)
  - Bébé garçon : [locate] "Baby Boy, touch the big log!" (tronc couché bas-gauche, grande cible)
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing? Drinking, running or sleeping?" (boire : action de `drinkStyle` par défaut)
  - Maman : [locate] "Can you find the red bush behind the rock?" (couleur + behind)
  - Bébé fille : [compare] "Which is bigger, the mountain or the tree?"
  - Bébé garçon : [identify] "Is the lake near the mountains?" (near)
- Cohérence : le bison boit en rivière (vrai) ; herbe verte (vraie nourriture) ; pas de grimpeur, pas de proie. La montagne reste fond de décor.
- Points d'attention : décor très dense et colorié ; rapides de la rivière ; **ressemble beaucoup au décor 1** (arbre à gauche, lupins, ruisseau à droite) ; la rivière est la seule zone d'eau : à tagger `water`.

### Bison · décor 3 — The red canyon / Le canyon aux falaises rouges
- Image : `Animaux/Amerique du Nord/Bisons/Paysage de canyon aux falaises rouges-3.png` (1672×941) · Statut : NOUVEAU → proposer `na_bison_canyon` (≠ `na_desert` qui est `04_Desert_des_roches_rouges.png`).
- Ce qu'on voit : falaises rouges (x 78-100, y 12-55) et gros blocs rouges à gauche (x 3-34, y 40-60) ; mesas rouges au fond (x 45-85, y 15-45) ; rivière turquoise en méandre (x 42-90, y 55-75) ; chêne en haut-gauche (tronc x 0-5, feuillage x 0-50, y 0-35) ; deux grands rochers au premier plan gauche (x 3-27, y 57-95) ; petits rochers (x 52-58, y 78-85 ; x 75-85, y 75-80 ; x 74-90, y 91-100) ; fleurs rouges (x 27-40, y 63-75) et rose (x 0-8, y 85-97) ; plante jaune (x 30-45, y 77-92) ; sentier de terre rouge en bas (x 45-75, y 85-100) ; pins épars (x 7-20, y 22-42 ; x 85-95, y 33-55) ; herbe dorée sur la pente (x 0-100, y 55-85).
- Histoire : Le troupeau traverse un grand canyon rouge. Au bord de la rivière turquoise, Papa Buck frappe la terre rouge, Maman Daisy se roule dans la poussière rouge. Les petits suivent le sentier et regardent les falaises : « Tout est rouge et grand ! »
- Vocabulaire nouveau : canyon (le canyon) · cliff (la falaise) · dust (la poussière, déjà introduit en cartes) · path (le sentier) · red rock (le rocher rouge) — Vocabulaire réutilisé : river, rock, tree, grass, flower, big, red, hooves, herd.
- Débutant :
  - Papa : [locate] "Daddy stomps! Find the red cliff!" (falaise rouge à droite, grande cible)
  - Maman : [identify] "Mommy rolls in the dust. Is the dust red?" (Oui / Non)
  - Bébé fille : [count] "How many big rocks? One or two?" (les 2 grands rochers du premier plan gauche)
  - Bébé garçon : [locate] "Baby Boy, touch the red flower!" (fleurs rouges, zone moyenne)
- Intermédiaire :
  - Papa : [compare] "Which is bigger, the cliff or the rock?"
  - Maman : [observe] "What is Mommy doing? Rolling, drinking or flying?" (rouler dans la poussière)
  - Bébé fille : [locate] "Can you find something behind the big rock?" (behind)
  - Bébé garçon : [locate] "Where is the river? Near the cliffs?" (near)
- Cohérence : herbe dorée sur la pente (nourriture), rivière pour boire, terre rouge pour se rouler : tout est plausible pour un bison (Grandes Plaines/rocheuses). Pas de grimpe sur les falaises (le bison ne grimpe pas : ne jamais proposer d'escalader).
- Points d'attention : sentier rouge central discret, falaises en arrière-plan, rivière à tagger `water` ; zones à toucher grandes et claires.

---

## Castor (beaver) — Amérique du Nord
- Personnages : Papa Benny (occupé), Maman Bonnie (maligne), Bébé fille, Bébé garçon (mot : kit / bébé castor). Planche vue : castors roux, grandes dents blanches, queue plate brune quadrillée ; Maman a une fleur rose ; bébé fille avec nœud rose ; 4 phases (assis, debout, patte levée, grand).
- Jeu propre existant : `beaver_dam` « The beaver's dam » — dents, ronger le bois, compter les branches (pomme de pin en intrus à l'intermédiaire), barrage, queue plate (claque dans l'eau), hutte (lodge, porte sous l'eau, `lodge` seulement si le décor en a), cartes (taper la queue, ronger, creuser, nager si eau, grimper = faux). Mots propres : teeth, chew, stick, dam, flat tail, lodge, kit.
- Objectifs pédagogiques : 1.3 (compter branches, nénuphars) ; 1.5 (mots du castor, mots de l'eau) ; 2.3 (ronger, creuser, nager, construire) ; positions (sous l'eau, à côté, derrière) ; 2.2 (feuilles et baies, jamais de poisson).
- Fil rouge des 3 décors : un castor à trois étapes de chantier. Étang = la maison (hutte) et le tronc rongé ; sentier de séquoias = on cherche du bois sur terre ferme ; chute d'eau = on construit un barrage sur le torrent. Eau calme / forêt sèche / eau vive.

### Castor · décor 1 — The beaver pond / L'étang du castor
- Image : `Animaux/Amerique du Nord/Castors/Image ChatGPT 21 nov. 2026, 07_56_29-1.png` (1672×941) · Statut : déjà dans le jeu sous `na_beaver_pond` (version MIROIR : coordonnées du jeu = 100 − x ci-dessous ; dans le jeu la hutte est à droite x 60-87, y 35-52).
- Ce qu'on voit (image brute) : hutte de branches avec entrée sombre au bord de l'eau (x 14-40, y 35-52 ; porte x 29-35, y 46-52) ; grand tronc rongé en travers à gauche, extrémité mâchée visible, copeaux de bois (x 7-55, y 64-88 ; copeaux x 25-37, y 83-90) ; étang bleu (x 15-100, y 42-90) ; nénuphars (x 67-78, y 72-78 ; petits x 15-25, y 58-60) ; quenouilles à droite (x 82-100, y 52-90) ; baies rouges à gauche (x 0-8, y 64-75) ; lupins violets (x 1-8, y 85-95) ; gros rocher moussu bas-gauche (x 0-22, y 78-95) ; bouleaux jaunes, érable rouge, sapins en fond ; montagne neigeuse (x 58-80, y 18-28) ; soleil en haut à droite (x 91, y 5).
- Histoire : Voici la maison du castor : la hutte de branches au bord de l'étang, avec la porte sous l'eau. Papa a rongé un gros tronc, les copeaux sont tombés. Maman cherche les bonnes branches et les petits cherchent les nénuphars et les baies rouges.
- Vocabulaire nouveau : pond (l'étang) · lodge (la hutte) · log (le tronc) · water lily (le nénuphar) · reed (le roseau) — Vocabulaire réutilisé : teeth, chew, stick, dam, tail, rock, berries, mountain, big, numbers.
- Débutant :
  - Papa : [locate] "Daddy chews! Find the log!" (tronc rongé, grande cible)
  - Maman : [locate] "Mommy lives in the lodge. Touch the lodge!" (hutte)
  - Bébé fille : [count] "How many water lilies? One or two?" (nénuphars)
  - Bébé garçon : [identify] "Baby Boy, are these red berries?" (Oui / Non)
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing? Chewing, flying or sleeping?" (ronger le bois)
  - Maman : [locate] "Where is the door of the lodge? Under the water?" (sous l'eau : repris de `beaver_dam`)
  - Bébé fille : [locate] "Can you find two green lily pads next to the rock?" (couleur + quantité + next to)
  - Bébé garçon : [compare] "Which is bigger, the lodge or the log?"
- Cohérence : castor mange feuilles et écorce, pas de poisson (baies : le castor ne les mange pas ; les montrer comme décor, ne pas les proposer comme nourriture). Le castor nage et creuse, jamais de grimpe.
- Points d'attention : décor le mieux adapté au castor ; hutte et tronc gros et clairs ; l'étang couvre le centre : props bien tenus à terre (anchor `pond` marqué `water`) ; image brute miroir du jeu.

### Castor · décor 2 — The redwood trail / Le sentier de séquoias
- Image : `Animaux/Amerique du Nord/Castors/Image ChatGPT 21 nov. 2026, 07_56_34-2.png` (1672×941) · Statut : déjà dans le jeu sous `na_redwood_trail` (score 1.0).
- Ce qu'on voit : énorme tronc de séquoia à gauche, racines moussues (x 0-35, y 0-67) ; troncs au centre (x 44-56), (x 68-75, rayons de soleil), (x 83-96) ; vieux tronc couché empilé de bois pourri et mousse à droite (x 77-100, y 52-72) ; gros rocher moussu au centre (x 50-60, y 53-59) ; gros rocher moussu bas-gauche (x 13-33, y 75-97) ; fougères (x 0-20, y 55-80 et x 82-100, y 60-82) ; lupins violets (x 7-14, y 77-90 ; x 70-77, y 63-70) ; trèfles bas-gauche (x 0-23, y 82-100) ; sentier de terre rouge au centre (x 40-74, y 64-100) ; petits cailloux ; grande lumière dorée.
- Histoire : Pas d'eau ici : le castor est parti chercher du bois. Maman Bonnie flaire de vieilles branches sous les gros troncs, Papa Benny creuse la terre souple près des racines. Les petits ramassent des branches pour les rapporter à l'étang.
- Vocabulaire nouveau : trail/path (le sentier) · root (la racine) · moss (la mousse) · fern (la fougère) · clover (le trèfle) — Vocabulaire réutilisé : log, stick, tree, rock, dig, chew, big, small, green.
- Débutant :
  - Papa : [locate] "Daddy digs! Find the big root!" (racine du séquoia gauche, grande cible)
  - Maman : [count] "Mommy finds sticks. How many? Two or three?" (jeu `beaver_dam`, branches au sol sur le sentier)
  - Bébé fille : [locate] "Baby Girl, touch the green fern!" (fougère droite)
  - Bébé garçon : [identify] "Baby Boy, is this a log?" (vieux tronc couché à droite)
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing? Digging, swimming or flying?" (creuser)
  - Maman : [compare] "Which is bigger, the redwood or the log?"
  - Bébé fille : [locate] "Can you find the sunbeam behind the big tree?" (behind)
  - Bébé garçon : [locate] "Is the mossy rock next to the path?" (next to)
- Cohérence : sans eau, les cartes « Swim! » et la claque d'eau sont ignorées par le jeu (`wet(c)`) ; le castor creuse et ronge sur terre. Pas de grimpe. La hutte (lodge) n'existe pas ici : pas de `lodge` anchor.
- Points d'attention : très proche de `na_redwoods` de l'ours (forêt de séquoias, sentier orange) : seules la mousse épaisse, la lumière plus rouge et le tronc empilé à droite changent ; pas d'eau, donc le thème « castor » est faible : l'histoire du bois en forêt est la seule justification.

### Castor · décor 3 — The waterfall river / La rivière et sa chute
- Image : `Animaux/Amerique du Nord/Castors/Image ChatGPT 21 nov. 2026, 12_46_54-3.png` (1672×941) · Statut : NOUVEAU → proposer `na_beaver_falls`.
- Ce qu'on voit : torrent turquoise avec rapides (x 28-78, y 42-58) ; chute d'eau à droite (x 65-87, y 27-45) ; gros rochers moussus dans l'eau (x 38-48, y 46-52 ; x 55-65, y 45-52 ; x 56-62, y 47-53) ; falaise de roche avec buisson orange (x 78-100, y 10-45) ; gros rocher gris moussu à gauche (x 12-29, y 33-52) ; grand tronc de sapin à gauche (x 2-22, y 0-52) ; vieux tronc couché moussu à droite (x 78-100, y 43-58) ; large clairière de terre rouge au premier plan (x 0-100, y 60-90) ; baies rouges bas-gauche (x 0-12, y 75-88) ; érable orange à gauche (x 0-9, y 32-50) ; feuilles d'érable rouges bas-droite (x 87-100, y 90-100) ; fougères bas-droite (x 87-100, y 72-88) ; trembles jaunes (x 17-30, y 12-33) ; pic enneigé (x 45-72, y 8-20).
- Histoire : L'eau coule vite sous la chute. Pour garder de l'eau calme, la famille construit un petit barrage de branches et de pierres. Papa Benny pousse les branches, Maman Bonnie les range, les petits les comptent sur la grande clairière de terre.
- Vocabulaire nouveau : waterfall (la cascade/chute) · river (la rivière) · dam (le barrage — déjà en jeu) · fast (vite) · leaf (la feuille) — Vocabulaire réutilisé : stick, log, rock, tree, mountain, berries, big, red, orange, numbers.
- Débutant :
  - Papa : [build] "Daddy builds a dam! Touch the stick!" (jeu `beaver_dam`, branche)
  - Maman : [count] "Mommy sorts sticks. How many? Two or three?" (branches sur la clairière)
  - Bébé fille : [locate] "Baby Girl, find the waterfall!" (cascade à droite)
  - Bébé garçon : [locate] "Baby Boy, touch the red leaf!" (feuille rouge bas-droite)
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing? Building, flying or sleeping?" (construire)
  - Maman : [compare] "Which water is faster, here or there?" (comparer chute/torrent calme)
  - Bébé fille : [locate] "Can you find two red berries next to the rock?" (couleur + quantité + next to)
  - Bébé garçon : [locate] "Where is the log? Near the waterfall?" (near)
- Cohérence : un barrage de castor est plausible sur un cours d'eau, mais jamais dans une cascade : à limiter à « au pied de la chute, dans l'eau calme » ; pas de grimpe sur les rochers ; baies et feuilles en décor.
- Points d'attention : clairière de terre rouge très grande et vide (excellente pour poser props), chute et torrent à tagger `water` ; ressemble à `na_lake` de l'ours (cascade + érables) : le lac du castor est le même type de décor, mais ici torrent et clairière dominent.

---

## Anomalies — Amérique du Nord

1. `Animaux/Amerique du Nord/Ours_Bruns/03_Taniere_hivernale.png` : 763×506 (ratio 1,51) alors que les 8 autres décors font 1672×941 (1,78). Conséquence : une fois étirée/recadrée en 16:9 elle sera floue et mal proportionnée. À faire : régénérer la tanière en 1672×941 (ou vérifier le rendu après `npm run assets`), sinon recadrer vers un 16:9 en perdant du haut ou du bas.
2. Deux fichiers ours commencent par « 03_ » : `Ours_Bruns/03_Lac_des_Rocheuses.png` et `Ours_Bruns/03_Taniere_hivernale.png`. Il n'y a pas de « 02_ ». Conséquence : tri ambigu, risque de confusion dans les scripts de correspondance. À faire : renommer la tanière en `03_` et le lac en `02_` (ou l'inverse), seulement si aucun script ne lit ces noms (la correspondance du jeu se fait par image, `source` dans le JSON).
3. Le bison n'a que `na_prairie`, `na_desert`, `na_lake` (`src/content/species.ts`, ligne 36) ; aucun ne correspond à ses 3 nouveaux décors (`Bisons/Prairie...-1.png`, `Panorama alpin...-2.png`, `Paysage de canyon...-3.png`). Conséquence : le bison n'a aucun de ses décors dans le jeu et partage `na_lake` avec l'ours et le castor. À faire : créer `na_bison_prairie`, `na_bison_alpine`, `na_bison_canyon` (fond .webp + anchors + spots + `depth.ts`) et remplacer `allowedBiomes` du bison.
4. Décors partagés : `bear` = `[na_redwoods, na_lake, na_coast, na_beaver_pond, na_redwood_trail]` et `beaver` = `[na_lake, na_redwoods, na_beaver_pond, na_redwood_trail]` (`species.ts` l. 35 et 37). Conséquence : chaque famille doit avoir ses 3 décors propres. À faire : `bear` → `[na_redwoods, na_lake, na_bear_den]` ; `beaver` → `[na_beaver_pond, na_redwood_trail, na_beaver_falls]` ; `bison` → les 3 nouveaux. Ces archetypes référencent aussi ces ids dans `src/content/archetypes.ts` (`climb_rock`, `maple_leaves`…), `src/content/activities/africa.ts` (l. 487 `na_beaver_pond`), `src/content/places/depth.ts` : à relire.
5. Décors orphelins après la décision : `na_prairie`, `na_desert`, `na_coast` (images `Continant/Amerique du nord/02_..., 04_..., 05_...` absentes de `Animaux/`) ne servent plus à aucune espèce. Mots et jeux qui y vivaient à replacer : prairie (hill, mountain, red_bush, boulder), désert (arch, cactus, tallcactus, agave), côte (lighthouse, house, cliff, sea, wave, sand, lupine). Rien n'est à supprimer, signaler.
6. `na_beaver_pond` : l'image déposée est le MIROIR de celle du jeu (score « miroir »). Conséquence : tout positionnement lu sur l'image de `Animaux/` doit être inversé (x → 100 − x) pour les anchors/spots existants (lodge hit x 60-87 dans le jeu). À faire : ne pas ajouter d'anchors sans retourner l'image ; ou remplacer le fond du jeu par l'image brute et inverser les anchors.
7. `na_beaver_pond` / `na_lake` / décors d'eau : à vérifier que les nouveaux décors d'eau (`na_bison_alpine`, `na_bison_canyon`, `na_beaver_falls`) ont leurs zones d'eau avec le tag `water`, sinon `ground()` pose miel/branches/bisons dans l'eau.
8. Ressemblances à surveiller : `Ours_Bruns/01_Foret_de_sequoias.png` ≈ `Castors/...07_56_34-2.png` (forêt de séquoias + sentier orange, familles différentes) ; `Bisons/Prairie...-1.png` ≈ `Bisons/Panorama alpin...-2.png` (même chêne gauche, lupins, ruisseau droite, même famille) ; `Ours_Bruns/03_Lac_des_Rocheuses.png` ≈ `Castors/...12_46_54-3.png` (cascade + érables d'automne). Conséquence : risque de parcours répétitifs. À faire : écrire des histoires bien séparées (déjà prévu ci-dessus).
9. `na_redwoods` et les autres `source` du JSON pointent vers `Continant/Amerique du nord/...` (anciens chemins) alors que les images actuelles sont dans `Animaux/Amerique du Nord/...` : incohérence de nommage sans effet sur le jeu (fonds déjà en `public/assets/backgrounds/*.webp`). À corriger si un script régénère les fonds depuis `source`.
10. Personnages : les 3 familles ont bien `<id>_father`, `<id>_mother`, `<id>_girl_{newborn,little,young,companion}`, `<id>_boy_{newborn,little,young,companion}` dans `src/content/assetManifest.json` (bear, bison, beaver : 10 entrées chacune, vérifié). Rien de manquant.
11. Jeu ours : `bear_honey` (props miel/baies) n'a pas de sens dans la tanière sous la neige (décor 3). À faire : décider si le jeu garde le miel dans ce décor ou passe à une variante sommeil (hors périmètre de cette cartographie).
12. Le fichier `Animaux/Amerique du Nord/Ours_Bruns/Animal_English_Adventure_Ours_3_Decors.zip` est ignoré (comme demandé).


---

# Cartographie des parcours — Amérique du Sud (3 familles × 3 décors = 9 parcours)

Établi le 2026-11-23 (lecture seule du dépôt). Coordonnées d'image en % de la largeur / hauteur (0,0 = haut gauche) ; les
`anchors` du JSON sont dans le même repère. Images décors toutes en 1672×941 (1671×941 pour « Refuge »), nettes.
Personnages en jeu vérifiés : les `.webp` de `public/assets/characters/` correspondent aux dossiers `jaguar/`, `toucan/` et
`paresseux/paresseux/` (sous-dossier) ; les 10 clés `<id>_father/_mother/_girl_<phase>/_boy_<phase>` existent pour les 3 espèces.

Rappel des mots déjà dans le jeu pour les trois espèces (réutilisables) : couleurs, nombres 1-5, big/small, tree, flower, leaf,
vine, rock, path, water, waterfall, mountain, cloud, branch, fruit, orchid, Daddy / Mummy / Baby Girl / Baby Boy.

---

## Jaguar (jaguar) — Amérique du Sud
- Personnages : Papa Juan (calme), Maman Jade (courageuse), Bébé fille (bébé jaguar = « cub », nœud rose), Bébé garçon (cub). Phases newborn → companion.
  Planche `planche_reference_jaguars.png` : pelage jaune-orangé à taches rosettes noires, queue annelée noire ; Maman porte une fleur d'hibiscus rose.
- Jeu propre existant : `jaguar_quiet_paws` « Quiet paws » (mécanique `observe`) — taches, empreintes à compter, « Quiet paws », cartes d'ordre (climb / swim / run / roar / fly = non), yeux perçants dans la nuit (lune). Mots propres déjà en jeu : spots, paw prints, quiet paws, sharp eyes, in the dark, swim, roar, climb.
- Objectifs pédagogiques : 1.5 (corps et actions : paws, eyes, tail, run/swim/climb — l'animal s'y prête, ses empreintes et sa queue sont très lisibles) ; 1.3 (compter les empreintes, les pierres) ; 2.3 (se cacher derrière les racines, les murs de pierre) ; 3.2 (suivre un chemin : sentier, pas japonais, terrasses).
- Fil rouge des 3 décors : (1) l'étang et la cascade — l'eau, la fraîcheur, les pierres moussues du chemin ; (2) la rivière et les vieilles pierres — traverser, les nénuphars, l'arche de racines et les marches de pierre ; (3) la prairie de montagne — les grands espaces dégagés, les terrasses de pierre, se déplacer en hauteur. Trois milieux (eau calme / eau vive + ruines / altitude) donc trois verbes dominants (observer / traverser / grimper).

### Jaguar · décor 1 — The jungle pond / L'étang de la jungle
- Image : `Animaux/Amerique du Sud/Jaguars/Clairière tropicale et cascade enchantée-1.png` · Statut : déjà dans le jeu sous `sa_wetland` (le décor du jeu est le MIROIR de cette image : cascade à gauche dans le jeu, à droite dans l'image ; décrit ci-dessous dans l'orientation du jeu = anchors du JSON).
- Ce qu'on voit (orientation du jeu) : à droite un énorme arbre aux racines étalées (x 72-94, y 5-60, zone large) ; à gauche une cascade (x 18-34, y 33-57) qui tombe dans un bassin turquoise (x 5-40, y 59-69) ; rochers moussus ronds alignés au milieu devant l'eau (x 43-56, y 61-70, gros, faciles à toucher) ; sentier de terre orangée au centre-bas (x 28-58, y 86-96, grande zone) ; grandes feuilles de monstera et feuilles de bananier au fond à gauche (x 0-18, y 6-34) ; fleurs rouge-orangé (héliconias, x 0-12, y 40-60) et hibiscus rouge devant ; falaise-montagne au fond (x 16-38, y 19-27) ; rayons de soleil dans les arbres (x 55-69, y 12-38) ; nuage (x 25-34, y 12-18) ; lianes qui pendent en haut (x 15-28, y 1-16).
- Histoire : après la pluie, la famille vient se rafraîchir à l'étang. Papa et Maman sont des jaguars qui adorent l'eau ; les petits découvrent la cascade, comptent les rochers moussus et suivent le sentier de pas sur la terre humide jusqu'à l'arbre géant. Histoire « eau et fraîcheur », sans aucune pêche.
- Vocabulaire nouveau : pond (l'étang) · stone (la pierre ; déjà dans le JSON) · mossy (moussu, en simple « green rock ») · sunlight (la lumière) · liana (la liane)
  Vocabulaire réutilisé : waterfall · water · rock · tree · flower · leaf · path · cloud · red · green · big / small · spots · paw prints
- Débutant — interactions par personnage :
  - Papa : [locate] "Where is Daddy?" — Papa est caché derrière le gros arbre de droite (zone `tree`) ; on touche l'arbre (« Find the tree! »).
  - Maman : [count] "How many rocks?" — 3 rochers moussus du milieu, on touche chacun (« Touch the big rock! » / « Touch the small rock! »).
  - Bébé fille : [identify] "Is this a fish?" devant la cascade (non, c'est de l'eau) — réponse « No, it's water! » ; phase minimale little.
  - Bébé garçon : [locate] "Touch the red flower!" — l'hibiscus ou l'héliconia rouge à l'avant gauche ; différent de sa sœur (couleur, pas animal).
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is sitting next to the water. » / « He is climbing the tree. » / « He is flying. » (3 choix ; 3.1 + 2.3).
  - Maman : [compare] "Which rock is bigger?" — rocher moussu central ou le petit devant (3.4).
  - Bébé fille : [locate] "Is the baby next to the waterfall?" (oui / non / « behind the tree ») (2.3).
  - Bébé garçon : [count] "Can you find two red flowers?" — compter les fleurs rouges à gauche (couleur + nombre, 1.2 + 1.3).
- Cohérence : jaguar nage (can swim) : on peut montrer le bassin, jamais un poisson attrapé. Aucun objet posé dans l'eau (jeu `dryLand` : seulement 4 emplacements au sec dans ce décor).
- Points d'attention : décor-miroir (le fichier déposé n'est pas dans le même sens que le jeu : si on remplace l'image du jeu par l'originale, il faut retourner TOUS les anchors et spots de `sa_wetland`). Peu de terrain plat dégagé (4 spots secs) → pas plus de 3-4 objets à compter.

### Jaguar · décor 2 — The river and the old stones / La rivière et les vieilles pierres
- Image : `Animaux/Amerique du Sud/Jaguars/Image ChatGPT 19 nov. 2026, 09_03_10-3.png` · Statut : déjà dans le jeu sous `sa_river` (identique, score 0.4).
- Ce qu'on voit : grand arbre à racines tordues à gauche (x 5-35, y 3-53) ; ruines de pierre moussues et petit escalier derrière, au centre gauche (x 34-58, y 18-48, escalier x 37-46, y 30-48) ; arche de racine/tronc moussue au bord de l'eau (x 36-58, y 52-62) ; rivière bleue à droite qui s'enfonce vers un volcan enneigé (x 64-84, y 6-22) ; nénuphars sur l'eau (x 46-62, y 68-79) ; pas japonais en pierre sur le sentier au premier plan (x 25-37, y 79-86, petits, ~4 pierres plates) ; sentier orangé en bas à gauche (x 18-40, y 86-96) ; gros rochers moussus (x 31-47, y 62-77 ; autre x 56-70, y 78-92) ; fleurs : hibiscus rouge et héliconia orange en bas à gauche (x 0-15, y 68-93), oiseaux de paradis + orchidées violettes en bas à droite (x 75-100, y 62-100), gingembre rouge à droite (x 90-96, y 30-50).
- Histoire : la famille suit le sentier qui longe la rivière jusqu'aux vieilles pierres. Les petits montent l'escalier moussu, passent sous l'arche de racines et traversent par les pas japonais ; Papa explique que les pierres sont « très vieilles », Maman montre les nénuphars. Histoire « traverser et explorer ».
- Vocabulaire nouveau : stepping stone (le pas japonais) · staircase (l'escalier) · ruins (les ruines) · river (la rivière) · water lily (le nénuphar)
  Vocabulaire réutilisé : stone · rock · tree · flower · path · mountain · cloud · red · purple · orange · one-two-three-four (pas japonais) · big / small
- Débutant :
  - Papa : [locate] "Where is Daddy?" — il est debout sur les marches de pierre ; toucher l'escalier ou « Find the stairs! ».
  - Maman : [count] "How many stepping stones?" — 3 pas japonais à toucher (on garde 3 pour rester simple).
  - Bébé fille : [identify] "Touch the purple flower!" (orchidée violette en bas à droite) ; little minimum.
  - Bébé garçon : [identify] "Is this a water lily?" (nénuphar : oui / non « a rock ») ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is walking on the stones. » / « sleeping » / « swimming ».
  - Maman : [locate] "Can you find something behind the tree?" — les ruines/escalier (derrière l'arbre) (2.3).
  - Bébé fille : [locate] "Where is the baby hiding?" — sous l'arche de racines (under) ou derrière le rocher (behind) (2.3, 2.6).
  - Bébé garçon : [count] "Can you find two pink flowers?" — fleurs roses/violettes près des ruines (couleur + nombre).
- Cohérence : jaguar sait nager et grimper : escalier de pierre = montée possible. Pas de proie. Les nénuphars sont dans l'eau : ne pas poser de props dessus (zone `river` x 56-80, y 40-56 taguée water).
- Points d'attention : l'arche de racines (belle zone cachette) n'a pas d'anchor dans le JSON : à ajouter (`root_arch`). Les pas japonais sont petits (7×12 % chacun) mais acceptables comme un seul bloc.

### Jaguar · décor 3 — The high mountains / Les hautes montagnes
- Image : `Animaux/Amerique du Sud/Jaguars/Image ChatGPT 19 nov. 2026, 09_03_13-4.png` · Statut : déjà dans le jeu sous `sa_andes` (identique, 0.2) MAIS `sa_andes` n'est PAS dans `allowedBiomes` du jaguar (voir Anomalies).
- Ce qu'on voit : grande prairie verte dégagée au centre (x 15-90, y 56-90, énorme zone plate) ; fond de montagnes enneigées et deux pics verts avec nuages (x 18-75, y 5-45) ; terrasses de pierre et ruines incas en escalier à droite (x 57-100, y 20-55) ; mur de pierre avec une frise sculptée à gauche (mur x 0-22, y 12-52, sculpture x 3-14, y 19-30) ; lupins violets (x 88-98, y 62-82) et fleurs oranges/rouges à droite (x 80-90, y 72-80) ; fleurs roses et jaunes en bas à gauche (x 1-25, y 73-95) ; rochers moussus (x 0-15, y 66-82 ; x 75-100, y 82-100) ; pierres plates posées dans l'herbe (x 58-68, y 76-80 ; x 26-38, y 84-90) ; chemins de terre brune (x 45-75, y 87-97) ; un fil de rivière dans la vallée (x 30-37, y 47-52) ; pas d'arbre sauf une branche en haut à gauche.
- Histoire : la famille de jaguars monte dans la prairie d'altitude pour voir les montagnes. Les petits trouvent la porte sculptée, comptent les marches des terrasses, et Papa leur montre qu'on voit très, très loin avec « sharp eyes ». Histoire « grands espaces et regarder au loin ».
- Vocabulaire nouveau : terrace (la terrasse) · snow (la neige) · carving (la sculpture) · wall (le mur) · lupin / purple flower (reste « purple flower »)
  Vocabulaire réutilisé : mountain · cloud · stone · rock · path · grass · flower · sharp eyes · big / small · colours (violet, rose, jaune)
- Débutant :
  - Papa : [identify] "Is this a mountain?" — montagne enneigée touchée ; oui / non (« a tree »).
  - Maman : [count] "How many terraces?" — 3 marches de terrasse à toucher (seulement 3).
  - Bébé fille : [identify] "Touch the yellow flower!" (fleurs jaunes bas-gauche) ; little minimum.
  - Bébé garçon : [locate] "Where is Baby Boy?" — caché derrière le mur sculpté ; toucher le mur.
- Intermédiaire :
  - Papa : [observe] "What can Daddy see?" — « The snow. » / « A fish. » / « A banana. » → neige (vocabulaire + sharp eyes).
  - Maman : [compare] "Which stone is bigger?" — la pierre plate de droite ou celle de gauche (3.4).
  - Bébé fille : [locate] "Is the baby next to the purple flowers?" (2.3).
  - Bébé garçon : [count] "Can you find three stones?" — compter les 3 pierres plates dans l'herbe (1.3).
- Cohérence : prairie d'altitude : le jaguar marche, grimpe les terrasses, mais jamais de chasse. Pas d'eau tagguée à gauche : tout le terrain est au sec (beaucoup d'emplacements, parfait pour des props).
- Points d'attention : décor sans arbre, donc pas de « climb the tree » : utiliser terrasses et mur à la place (carte `Climb!` remplace l'arbre par les terrasses). Ressemble peu aux deux autres décors (le plus distinct).

---

## Paresseux (sloth) — Amérique du Sud
- Personnages : Papa Nico (rêveur), Maman Nina (douce, fleur d'hibiscus rouge dans les cheveux), Bébé fille (nœud rose), Bébé garçon (bébé paresseux = « cub » dans le code ; « baby sloth » plus parlant), 4 phases chacun.
- Jeu propre existant : `sloth_slow_slow` « Slow, slow sloth » (mécanique `observe`) — « fast or slow? », longues griffes, suspendu la tête en bas, compter les feuilles à manger (et refuser un poisson), cartes d'ordre (Climb / Sleep / Eat, Run et Jump = refus), dormir beaucoup. Mots propres : very slow, long claws, upside down, leaves, sleep a lot, hang.
- Objectifs pédagogiques : 1.5 (corps et actions : claws, hands, head, slow — lenteur = vocabulaire naturel) ; 1.6 (nourriture : leaves seulement) ; 3.3 (routine lente : first, then : manger, grimper, dormir) ; 3.4 (comparaison : « slower than ») ; 2.2 (capacités : can climb / can swim, can't run / can't jump).
- Fil rouge des 3 décors : (1) la grande branche en hauteur — la vie dans les arbres, suspendu la tête en bas, vue sur la forêt ; (2) le pied des grands arbres — le sol de la forêt, racines géantes, la rivière au loin, descendre lentement ; (3) le refuge près de la cascade — le creux de l'arbre-maison, le lit de feuilles sèches, la sieste. Trois lieux : haut / bas / maison.
- Personnages en double (Anomalie 1) : voir plus bas.
- Contrainte forte : le paresseux ne peut ni courir ni sauter (cannot run / jump) : toutes les interactions sont lentes (toucher, regarder, grimper, s'accrocher, manger, nager lentement).

### Paresseux · décor 1 — The high branch / La grande branche en hauteur
- Image : `Animaux/Amerique du Sud/Paresseux/Image ChatGPT 22 nov. 2026, 09_54_38-1.png` · Statut : NOUVEAU, proposer l'id `sa_sloth_canopy`.
- Ce qu'on voit : énorme branche diagonale du bas-gauche vers le haut-droit, large et plate au centre (x 18-100, y 60-100 ; partie plate x 20-70, y 65-82) couverte de mousse verte (x 20-45, y 66-84 ; x 55-70, y 64-72) ; tronc à gauche (x 0-30, y 0-65) ; fleurs : orchidées violettes en haut à gauche (x 22-29, y 8-26), grande broméliade rouge-jaune sur le tronc (x 3-24, y 38-58), broméliade verte à droite sur la branche (x 74-95, y 43-63), héliconia rouge pendante en haut à droite (x 88-97, y 12-37) ; feuilles de monstera bas-gauche (x 0-14, y 60-85) ; liane qui pend au centre (x 32-36, y 7-64) ; au fond la forêt, une rivière blanche brumeuse (x 48-60, y 40-50), collines bleues et rayons de soleil en haut à droite (x 68-85, y 5-25) ; petites taches blanches (lichen) sur la branche (x 44, y 74).
- Histoire : le matin, Nico et Nina grimpent lentement sur la grande branche pour voir toute la forêt. Les petits apprennent à se suspendre la tête en bas et à choisir les feuilles tendres. Histoire « en haut de l'arbre, doucement ».
- Vocabulaire nouveau : branch (la branche) · moss / green (reste « green ») · high (haut) · look (regarder) · orchid (déjà) · bromeliad (reste « red flower »)
  Vocabulaire réutilisé : tree · leaf · flower · vine · red · purple · slow · upside down · long claws · hold · one-two
- Débutant :
  - Papa : [locate] "Where is Daddy?" — sur la grande branche (touche la branche) ; réponse lente en 2 choix « branch / water ».
  - Maman : [identify] "Touch the purple flower!" — les orchidées en haut à gauche.
  - Bébé fille : [count] "How many red flowers?" — 2 fleurs rouges visibles (broméliade + héliconia) ; little minimum.
  - Bébé garçon : [identify] "Is this a leaf?" — monstera vert à gauche : oui / non (« a fish »), puis « Touch the green leaf! » ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is hanging upside down. » / « He is running. » / « He is jumping. » (jamais courir ni sauter ; 3.1 + 2.2).
  - Maman : [locate] "Is Mummy under the branch or on the branch?" (2.3) avec 3 choix « on / under / behind ».
  - Bébé fille : [compare] "Which one is slower?" — le paresseux ou … l'autre animal ? (pas d'autre animal) → à la place : « Which flower is bigger? » (grande broméliade vs orchidée) (3.4).
  - Bébé garçon : [count] "Can you find two green plants?" — compter les broméliades vertes (1.2 + 1.3).
- Cohérence : tout est en hauteur (branche) : pas d'eau ni de sol ; le paresseux mange feuilles uniquement (pas de fleurs, pas de fruits ici) ; il ne saute jamais d'une branche à l'autre : il tend la main et s'accroche.
- Points d'attention : décor sans sol : le jeu `dryLand` (spots « au sec ») doit placer ses props sur la branche, donc spots à poser sur la bande x 20-70, y 62-80. Ressemble à `sa_canopy_branch` du toucan (même type de grande branche, mêmes plantes) : changer les histoires pour qu'elles ne se répètent pas (toucan = bec/fruit, paresseux = feuille/lenteur).

### Paresseux · décor 2 — The giant roots / Les racines géantes
- Image : `Animaux/Amerique du Sud/Paresseux/Image ChatGPT 22 nov. 2026, 09_54_40-2.png` · Statut : NOUVEAU, proposer l'id `sa_sloth_roots`.
- Ce qu'on voit : arbre géant à gauche, aux racines-contreforts étalées (x 0-52, y 0-80 ; racines au sol x 20-53, y 62-85) ; second tronc au centre-fond entouré de lianes (x 52-72, y 8-55) ; fougères centrales (x 40-58, y 35-58) ; trois broméliades rose-rouge (x 7-22, y 27-40 ; x 28-40, y 45-55 ; x 60-67, y 47-55) et une grande orange en bas à droite (x 80-98, y 62-82) ; rivière turquoise à droite avec rochers (x 70-95, y 50-60) ; clairière ensoleillée d'herbe et de terre rouge au centre (x 45-85, y 63-90, grande zone plate) ; rochers moussus (x 55-62, y 58-62 ; x 20-27, y 82-92 ; x 55-65, y 87-93 ; gros rocher x 75-100, y 80-100) ; feuilles sèches au sol (x 28-70, y 88-95) ; grandes feuilles de monstera en bas à gauche (x 0-25, y 60-100).
- Histoire : après la nuit dans les arbres, la famille descend très lentement tout en bas pour rejoindre la rivière. Sur le sol, les petits comptent les feuilles sèches, touchent les racines géantes et se reposent dans la clairière ensoleillée. Histoire « descendre sans se presser ».
- Vocabulaire nouveau : root (la racine) · fern (la fougère) · ground (le sol) · down (en bas) · sun (le soleil, via sunlight)
  Vocabulaire réutilisé : tree · leaf · rock · river · flower · path · big / small · red · green · slow
- Débutant :
  - Papa : [locate] "Find the tree!" — le tronc central entouré de lianes ; Papa y est accroché.
  - Maman : [identify] "Touch the big rock!" / « Touch the small rock! » (3 rochers de tailles différentes).
  - Bébé fille : [count] "How many leaves?" — 3 feuilles sèches ou vertes à toucher sur le sol ; little minimum.
  - Bébé garçon : [identify] "Is this a river?" — rivière à droite : oui / non (« a mountain ») ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is climbing down the tree. » / « He is running. » / « He is flying. »
  - Maman : [locate] "Where is the baby hiding?" — « behind the root » / « in the water » / « on the rock » (2.3, 2.6).
  - Bébé fille : [count] "Can you find two pink flowers?" — broméliades roses.
  - Bébé garçon : [compare] "Which root is longer?" — deux racines au sol, la plus longue (3.4).
- Cohérence : sol de forêt : le paresseux marche TRÈS lentement au sol (c'est vrai), jamais de course ni de saut. La rivière est une zone eau : ne rien y poser. Nourriture : feuilles uniquement.
- Points d'attention : ressemble à `sa_jungle` (même type de clairière avec gros arbre à gauche) ; pas de mur d'eau ici contrairement à `sa_waterfall`. Bien distinguer des décors du jaguar (sa_river) : le jaguar a ruines et nénuphars, le paresseux n'en a pas.

### Paresseux · décor 3 — The tree-hollow refuge / Le refuge près de la cascade
- Image : `Animaux/Amerique du Sud/Paresseux/Refuge tropical au pied de la cascade.png` · Statut : NOUVEAU, proposer l'id `sa_sloth_refuge` (1671×941, un pixel de moins que les autres : le script de décors doit l'accepter).
- Ce qu'on voit : cascade à gauche (x 16-30, y 25-60) tombant dans un bassin turquoise (x 12-40, y 60-72) ; ruisseau et rochers moussus en bas à gauche (x 0-55, y 68-100, gros rochers x 27-45, y 70-85 ; x 50-68, y 88-100) ; énorme tronc à droite avec un creux-refuge (x 76-90, y 42-66) contenant un lit de feuilles sèches et une bûche (x 77-89, y 54-66) ; sentier de terre et feuilles mortes au centre-droit (x 45-90, y 66-92, grande zone plate) ; oiseaux de paradis orange en bas à gauche (x 0-15, y 45-75) ; hibiscus rouge en bas à droite (x 88-98, y 60-77) ; fleurs roses en haut à gauche sur une branche (x 3-14, y 0-10) ; feuilles en cœur sur le tronc (x 87-98, y 3-27) ; montagne verte au fond (x 44-67, y 12-30).
- Histoire : le soir tombe ; la famille retourne à son refuge dans le creux de l'arbre près de la cascade, où le lit de feuilles sèches les attend. Les petits cherchent leur « maison », se frottent les yeux, et s'endorment après avoir mangé quelques feuilles. Histoire « la maison et la sieste ».
- Vocabulaire nouveau : home (la maison) · nest (le nid ; existe en prop) · bed (le lit de feuilles) · sleep (dormir ; déjà) · hole / hollow (le creux)
  Vocabulaire réutilisé : waterfall · water · rock · tree · leaf · flower · path · sleep a lot · very slow · red · orange · big / small
- Débutant :
  - Papa : [locate] "Where is Daddy?" — dans le creux de l'arbre (touche le creux/tronc).
  - Maman : [identify] "Touch the red flower!" — l'hibiscus rouge à droite.
  - Bébé fille : [identify] "Is this a bed?" — le lit de feuilles dans le creux : oui / non (« a rock ») ; newborn possible (réponse passive : le bébé dort).
  - Bébé garçon : [count] "How many rocks?" — 3 rochers du ruisseau ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is sleeping in the tree. » / « He is jumping. » / « He is swimming fast. »
  - Maman : [locate] "Is the baby in the tree or next to the waterfall?" (2.3).
  - Bébé fille : [compare] "Which is bigger, the tree or the rock?" (3.4).
  - Bébé garçon : [count] "Can you find two orange flowers?" — oiseaux de paradis à gauche.
- Cohérence : le paresseux dort beaucoup (vrai) : décor idéal pour la routine du soir (3.3). Nager : il sait nager, on peut montrer le bassin, mais sans le mettre dans l'eau (cohérent avec `dryLand`). Pas de poisson.
- Points d'attention : décor très semblable en composition à `sa_wetland` du jaguar (cascade + bassin + rochers + arbre à droite ; score de ressemblance 51 vs 47 pour sa_river, donc pas identique mais même thème) : différencier par le creux de l'arbre et l'histoire « maison ». La cascade est en haut à gauche, le refuge à droite : les props au sec sont limités (rochers + sentier).

---

## Toucan (toucan) — Amérique du Sud
- Personnages : Papa Tico (bavard), Maman Tina (joyeuse, hibiscus rose), Bébé fille (nœud rose), Bébé garçon (bébé toucan = « chick »). Planche `planche_reference_toucans.png` : bec jaune-orange à pointe noire, plumage noir, bavette blanc-jaune, ailes bleues, dessous de queue rouge, yeux marron.
- Jeu propre existant : `toucan_big_beak` « My big beak » (mécanique `observe`) — le grand bec coloré, des baies/bananes à trouver (poisson et viande refusés), « toss and catch », cartes d'ordre (Fly / Hop / Toss ; Swim et Run = refus), ailes, dormir dans un trou d'arbre. Mots propres : big beak, colourful, toss and catch, hole in a tree, wings, hop, fly.
- Objectifs pédagogiques : 1.2 (couleurs : tout le toucan et ses fruits sont colorés) ; 1.5 (bec, ailes, pattes) ; 1.6 (baies, bananes, fruits) ; 2.3 (position : in the hole, on the branch, behind the leaf) ; 3.2 (direction : left, right, across the bridge — le pont de corde).
- Fil rouge des 3 décors : (1) la grande branche — le jeu du bec et des fruits ; (2) la cabane et le pont — traverser, monter, où dort-on ; (3) le lever de soleil — le matin, le fruit doré, la routine. Un mot de lieu et un verbe dominant par décor (fruit/bec ; pont/cabane ; soleil/fruits).

### Toucan · décor 1 — The big branch / La grande branche
- Image : `Animaux/Amerique du Sud/Toucans/Image ChatGPT 21 nov. 2026, 08_22_35-1.png` · Statut : déjà dans le jeu sous `sa_canopy_branch` (identique, 0.4).
- Ce qu'on voit : tronc géant à gauche (x 0-19, y 4-60) ; grande branche horizontale au centre-bas, très large et plate (x 25-80, y 56-76, zone idéale pour poser des objets) ; lianes pendantes (x 24-44, y 4-34) ; orchidées violettes sur le tronc (x 3-10, y 27-48) ; hibiscus rouge et jaune en bas à gauche (x 0-18, y 70-92) ; hibiscus rose à droite (x 91-100, y 49-58) ; héliconia rouge-orange en bas à droite (x 90-100, y 66-92) ; feuilles de monstera à gauche ; mousse sur la branche ; au fond la canopée avec des arbres en parasol ; une cascade lointaine très petite (x 69-76, y 36-47) ; soleil en haut à droite (x 81-90, y 0-11) ; nuages au fond (x 46-67, y 19-31) ; brume.
- Histoire : au petit matin, Tico et Tina sont perchés sur la grande branche. Les petits regardent les couleurs : hibiscus rouge et jaune, orchidées violettes ; Papa montre comment on lance une baie en l'air avec le bec et on la rattrape. Histoire « le bec et les couleurs ».
- Vocabulaire nouveau : blossom (la fleur de l'arbre) · rainforest (la forêt tropicale) · branch · colourful · hop (déjà) · catch (rattraper)
  Vocabulaire réutilisé : big beak · colourful · berries · banana · red · yellow · purple · pink · flower · leaf · tree · sun · cloud
- Débutant :
  - Papa : [identify] "Touch the red flower!" — l'hibiscus rouge en bas à gauche.
  - Maman : [locate] "Where is Mummy?" — perchée sur la branche (touche la branche) ; réponse en 2 choix.
  - Bébé fille : [count] "How many flowers?" — 3 fleurs à toucher (rouge, jaune, rose) ; little minimum ; wings en phase young.
  - Bébé garçon : [identify] "Is this a leaf?" — monstera à gauche : oui / non (« a fish ») ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is tossing a berry. » / « He is swimming. » / « He is sleeping. »
  - Maman : [locate] "Is the toucan on the branch or under the branch?" (2.3).
  - Bébé fille : [count] "Can you find two purple flowers?" — orchidées violettes sur le tronc (1.2 + 1.3).
  - Bébé garçon : [compare] "Which flower is bigger?" — héliconia ou hibiscus (3.4).
- Cohérence : le toucan vole, saute (hop), mange baies et bananes (foods) ; ne nage pas, ne court pas : jamais de carte Swim/Run juste. Aucun poisson posé sur la branche (le jeu en pose comme leurre à refuser : OK).
- Points d'attention : la branche est très large (55×20 %) : parfait pour 5 emplacements. Cascade lointaine trop petite pour un doigt (6×11 %) : ne pas l'utiliser comme cible. Brouillard blanc au centre : éviter d'y poser des props.

### Toucan · décor 2 — The tree house / La cabane dans l'arbre
- Image : `Animaux/Amerique du Sud/Toucans/Image ChatGPT 21 nov. 2026, 08_22_38-2.png` · Statut : déjà dans le jeu sous `sa_canopy_treehouse` (identique, 0.4).
- Ce qu'on voit : cabane en bambou dans un creux de l'arbre à gauche, avec sa plate-forme et sa rambarde (x 11-31, y 32-51) ; pont de corde en haut au centre-droit (x 54-75, y 20-32) menant à des plates-formes en forme de feuilles vertes (x 65-87, y 35-45 ; autres plus haut à droite x 72-92, y 15-30) ; grosse branche large au premier plan (x 35-75, y 64-76) ; orchidées roses au premier plan gauche (x 5-21, y 64-85) ; héliconia rouge-orange à l'extrême gauche (x 0-10, y 55-75) ; orchidées jaunes à droite (x 90-99, y 53-70) ; grosses feuilles de monstera en bas à droite (x 74-100, y 74-100) ; cascade à étages au fond (x 39-47, y 44-64) ; petites fleurs violettes pendant des lianes (x 75-77, y 50-60).
- Histoire : la famille toucan a construit sa cabane dans l'arbre. Aujourd'hui, les petits veulent aller de la cabane aux plates-formes feuilles ; Papa passe par le pont de corde, Maman vole au-dessus. À la fin de la journée, tout le monde rentre dans le trou de l'arbre pour dormir. Histoire « aller d'un côté à l'autre ».
- Vocabulaire nouveau : tree house (la cabane) · bridge (le pont) · platform (la plate-forme) · across (de l'autre côté) · left / right (gauche / droite)
  Vocabulaire réutilisé : orchid · hole in a tree · branch · waterfall · flower · leaf · pink · yellow · orange · wings
- Débutant :
  - Papa : [locate] "Where is Daddy?" — sur le pont de corde (touche le pont).
  - Maman : [locate] "Find the tree house!" — la cabane à gauche.
  - Bébé fille : [identify] "Touch the pink flower!" — orchidées roses en bas à gauche ; little minimum.
  - Bébé garçon : [count] "How many platforms?" — 3 plates-formes à toucher (une grande, deux en haut) ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is walking on the bridge. » / « He is swimming. » / « He is digging. » (3.1 ; le toucan sautille/marche, ne court pas).
  - Maman : [locate] "Where is the baby hiding?" — « in the tree house » / « under the water » / « behind the cloud ».
  - Bébé fille : [observe] "Can you find something next to the waterfall?" (2.3) — la cascade à étages.
  - Bébé garçon : [count] "Can you find two yellow flowers?" — orchidées jaunes à droite.
- Cohérence : un toucan dort dans un trou d'arbre (le creux-cabane s'y prête parfaitement : à utiliser). Il traverse le pont en volant ou en sautillant : OK. Pas d'eau au sec : cascade au fond, hors de portée.
- Points d'attention : les plates-formes en feuilles sont plus petites que la zone `platform` du JSON (22×10 %) : bien à vérifier visuellement. Beaucoup d'éléments : ne pas surcharger la scène. Les 3 décors toucan ont le même type de branche : différencier par cabane/pont (ici) et soleil/fruit (décor 3).

### Toucan · décor 3 — The sunrise branch / La branche du lever de soleil
- Image : `Animaux/Amerique du Sud/Toucans/Image ChatGPT 21 nov. 2026, 08_22_41-3.png` · Statut : déjà dans le jeu sous `sa_canopy_sunrise` (identique, 0.3).
- Ce qu'on voit : soleil levant dans les branches (x 21-29, y 21-33) avec rayons ; longue branche en diagonale qui monte vers la droite (x 20-100, y 40-85 ; partie plate x 25-80, y 60-76) ; grappe de fruits orange en haut à gauche (x 12-21, y 10-26) ; grappes de baies rouges en haut à droite (x 82-88, y 0-14) ; mangues jaunes en bas à droite (x 89-98, y 61-74) ; grande broméliade rouge à droite sur la branche (x 77-94, y 37-54) ; hibiscus rouge en bas à gauche (x 2-10, y 64-80) ; orchidées violettes (x 8-21, y 79-91) ; fleurs roses en haut à droite (x 92-100, y 10-25) ; deux cascades lointaines dans la brume (x 60-66, y 41-50) et une rivière qui serpente (x 58-67, y 52-61) ; ciel rose-orangé avec nuages (x 66-79, y 17-28).
- Histoire : le soleil se lève sur la forêt et le toucan petit-déjeune des fruits dorés. Les petits comptent les fruits orange, reconnaissent les baies et les mangues, et Maman leur montre qu'on peut lancer un fruit en l'air. Histoire « le matin et le petit-déjeuner de fruits ».
- Vocabulaire nouveau : mango (la mangue) · sunrise (le lever de soleil) · fruit (déjà dans le JSON, au pluriel) · morning (le matin) · golden (doré)
  Vocabulaire réutilisé : berries · banana · red · orange · yellow · pink · purple · flower · branch · sun · cloud · big beak · toss and catch
- Débutant :
  - Papa : [identify] "Is this a berry?" — baies rouges en haut à droite : oui / non (« a fish »).
  - Maman : [count] "How many oranges?" — fruits orange en haut à gauche (une grappe de 4 : on compte jusqu'à 4 ; ou seulement 3 à toucher).
  - Bébé fille : [identify] "Touch the yellow mango!" — mangues en bas à droite ; little minimum.
  - Bébé garçon : [locate] "Find the sun!" — soleil levant ; little minimum.
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — « He is eating a berry. » / « He is eating a fish. » / « He is sleeping. »
  - Maman : [locate] "Can you find something behind the branch?" — cascades et rivière du fond (2.3).
  - Bébé fille : [compare] "Which fruit is bigger, the orange or the berry?" (3.4).
  - Bébé garçon : [count] "Can you find two red flowers?" — broméliade + hibiscus rouge (1.2 + 1.3).
- Cohérence : le toucan mange baies et bananes (foods) ; la mangue et l'orange sont des fruits mais ne sont pas dans `species.foods` du toucan (voir Anomalies). Le toucan vole, ne nage pas : la rivière du fond est hors de portée.
- Points d'attention : les fruits sont en hauteur (haut gauche et haut droite) : bien pour 'fruit' (anchor existant) mais difficile à poser en prop de jeu. La famille se tient en bas à droite et cacherait les mangues (x 89-98) : prévoir la mangue en zone gauche si besoin.

---

## Anomalies — Amérique du Sud

1. **Paresseux : personnages en double (même dossier, deux jeux de fichiers)** — `Animaux/Amerique du Sud/Paresseux/` contient `papa_paresseux.png`, `maman_paresseuse.png`, `bebe_fille_stade_1…4.png`, `bebe_garcon_stade_1…4.png` à la racine ET les 10 mêmes personnages dans `Animaux/Amerique du Sud/Paresseux/paresseux/` (`papa_paresseux.png`, `maman_paresseux.png`, `bebe_*_stade_*.png`). Comparaison : ce sont les mêmes dessins ; la racine est un recadrage plus petit et plus éloigné (têtes plus petites, tailles inégales d'un fichier à l'autre), le sous-dossier est un recadrage plus serré et plus grand. Les `.webp` du jeu (`public/assets/characters/sloth_*.webp`) correspondent au SOUS-DOSSIER `paresseux/` (écart 0,4 à 1,0 contre 27 à 59 pour la racine). Nom de fichier différent aussi : `maman_paresseuse.png` (racine) / `maman_paresseux.png` (sous-dossier). Conséquence : risque de réimporter la mauvaise version (celle de la racine) et de changer la taille des paresseux à l'écran. À faire : garder le sous-dossier comme référence, archiver ou supprimer les copies de la racine.
2. **Paresseux : décors partagés avec le jaguar** — `src/content/species.ts` ligne 41 : `allowedBiomes: ['sa_jungle', 'sa_river', 'sa_waterfall', 'sa_wetland']` ; `sa_river` et `sa_wetland` sont les décors du jaguar (images `Jaguars/…09_03_10-3.png` et `Jaguars/Clairière tropicale… -1.png`). Les 3 vraies images du paresseux (`Paresseux/…09_54_38-1.png`, `…09_54_40-2.png`, `Refuge tropical au pied de la cascade.png`) n'existent pas dans le jeu. À faire : créer `sa_sloth_canopy`, `sa_sloth_roots`, `sa_sloth_refuge` (fond `.webp` 1672×941, entrée dans `src/content/assetManifest.json`, anchors et spots dans `src/content/places/south_america.json`), puis passer l'`allowedBiomes` du paresseux à ces trois seuls ids.
3. **Décors du jeu qui sortent du parcours** : `sa_jungle` (source `Continant/Amerique du sud/Image ChatGPT 19 nov. 2026, 09_03_06-1.png`, absente de tout dossier `Animaux/`) et `sa_waterfall` (source `Continant/Amerique du sud/Cascade tropicale dans la jungle luxuriante-2.png`, absente aussi) n'ont plus d'image dans les dossiers de famille. Utilisés aujourd'hui par : `sa_jungle` → jaguar + paresseux ; `sa_waterfall` → paresseux, ainsi que `src/content/adventures/south_america.ts` (ligne 43 `go('sa_waterfall'…)`, aventure `south_america_big_waterfall`, départ `sa_river`, espèce `sloth`) et les archétypes `who_in_water` / `butterflies` (`src/content/archetypes.ts` lignes 35 et 50), `africa.ts` lignes 53 et 490 (mots de `sa_waterfall` : waterfall, mountain, vine, pool), `species_south_america.test.ts` ligne 211 (mots spray, pool). Aventures qui s'y appuient : `south_america_old_stones` et `south_america_lily_pond` (jaguar + paresseux, via `sa_river` et `sa_wetland`). Conséquence : si le paresseux quitte ces décors, ces aventures et leurs `species: ['sloth']` ne tournent plus ; mots à replacer : spray, pool (sa_waterfall) ; terrace, carving (sa_andes). Rien n'a été supprimé.
4. **Jaguar : `sa_andes` absent de ses biomes, `sa_jungle` présent à tort** — `src/content/species.ts` ligne 39 : `allowedBiomes: ['sa_jungle', 'sa_river', 'sa_wetland']`. L'image `Jaguars/Image ChatGPT 19 nov. 2026, 09_03_13-4.png` est `sa_andes` (identique, 0.2) mais n'est pas dans la liste : le jaguar ne peut pas jouer dans les hautes montagnes ; à l'inverse `sa_jungle` n'a pas d'image dans le dossier Jaguars. À faire : `['sa_wetland', 'sa_river', 'sa_andes']`. Vérifier les tests `species_south_america.test.ts` (mots `terrace`, `carving`, photo `terrace`).
5. **Jaguar décor 1 en miroir** — `Jaguars/Clairière tropicale et cascade enchantée-1.png` est le miroir de l'actuel `sa_wetland` (cascade à droite dans le fichier, à gauche dans le jeu : `anchors.waterfall` x 18-34, `tree` x 72-94). Conséquence : si on réimporte l'image telle quelle, tous les anchors, spots et stands de `sa_wetland` sont faux. À faire : soit garder le fond actuel, soit retourner anchors/spots.
6. **Image qui n'est pas un décor, mais piège** — `Animaux/Amerique du Sud/Toucans/Famille de toucans en pleine croissance.png` (1448×1086, fond vert chroma) est une AUTRE version des personnages toucan : yeux bleus, ailes noires (pas bleues), bec orange, bavette blanche, hibiscus rose chez Maman. Elle ne correspond pas à la planche `planche_reference_toucans.png` (yeux marron, ailes bleues) ni aux `.webp` du jeu (qui suivent `toucan/` : écart 0,4 à 1,3). Conséquence : risque de mélange de deux designs de toucan. À faire : la ranger comme archive ou la supprimer ; ne pas l'utiliser.
7. **Toucan : nourriture visible non déclarée** — `species.ts` ligne 40 : `foods: ['banana', 'berries']`. Le décor 3 montre des mangues jaunes (`mango`, x 89-98, y 61-74) et des fruits orange en grappe (`fruit`, x 12-21, y 10-26). Conséquence : on ne peut pas dire « le toucan mange les mangues » sans enfreindre `foods` ; les mots restent utilisables comme noms à toucher. À faire : décider d'ajouter `mango` aux `foods` du toucan (le prop `mango` existe dans `src/content/props.ts`) ou de s'en tenir aux mots sans verbe manger.
8. **Décors à peu de terrain « sec »** — `sa_wetland` (jaguar) n'a que 4 emplacements au sec ; le jeu `jaguar_quiet_paws` tombe à 4 empreintes max en intermédiaire (voir code), ce qui reste compatible avec le débutant (3). Les 3 décors paresseux nouveaux n'ont pas encore de spots : `sa_sloth_canopy` n'aura qu'une bande étroite (branche, x 20-70, y 62-80) → `dryLand ≥ 3` à vérifier pour que `sloth_slow_slow` démarre.
9. **Image Paresseux décor 3 à 1671×941** — `Paresseux/Refuge tropical au pied de la cascade.png` fait 1671×941 (les autres 1672×941) ; `assetManifest.json` annonce 1672×941 pour tous les fonds. Conséquence : un pixel d'écart, sans effet visuel, mais le test de dimensions (s'il existe) échouerait. À faire : redimensionner à 1672×941 à l'import.
10. **Planches/titres** : aucun personnage ni aucune phase manquants : `jaguar_*`, `toucan_*`, `sloth_*` ont tous les 10 fichiers `.webp` (father, mother, girl/boy × newborn, little, young, companion) dans `src/content/assetManifest.json`. Le dossier `Jaguars/jaguar/` et `Toucans/toucan/` n'ont pas de doublons. Aucune image décor n'est floue ou trop petite.
11. **Les trois décors du paresseux se ressemblent entre eux et avec ceux du jaguar** : `sa_sloth_canopy` ≈ `sa_canopy_branch` (toucan, même grande branche), `sa_sloth_roots` ≈ `sa_jungle` (clairière + arbre à racines), `sa_sloth_refuge` ≈ `sa_wetland` (cascade + bassin). Conséquence : sans histoire différente, l'enfant aura une impression de répétition. À faire : s'appuyer sur ce que chaque image a de propre (branche haute et vue / racines géantes et rivière / creux de l'arbre et lit de feuilles).


---

# Asie — cartographie des 9 parcours (panda, tigre, panthère des neiges)

Établi le 2026-11-23, lecture seule. Images regardées : les 9 décors + les 3 planches de personnages.
Mécaniques utilisées (existantes, `archetypes.ts`) : locate, identify, count, fetch, guide, observe, compare, social, sort, talk, puzzle, build.
Rappel : débutant = 2 réponses, phrases très courtes ; intermédiaire = 3 réponses. Coordonnées en % de l'image (x vers la droite, y vers le bas).
Tous les jeux propres existants (`panda_picnic`, `tiger_stripes`, `leopard_leap`) restent valables dans tous les décors de leur espèce.

---

## Panda géant (giant_panda) — Asie
- Personnages : Papa Bao (sleepy), Maman Mei (gentle, fleur d'hibiscus rose sur la tête), Bébé fille (nœud rose sur la tête), Bébé garçon (sans nœud). Mot du bébé : cub (« bébé panda »). Les deux parents sont dessinés couchés/accroupis (pas debout) ; bébés 4 phases × 2 sexes présents.
- Jeu propre existant : `panda_picnic` « Bamboo picnic! » — compter des bâtons de bambou, refuser le poisson et la viande, carte-commande (roll over, munch, climb, sleep). Mots de l'espèce déjà en jeu : black and white, black ears, bamboo, munch, round tummy, roll over, climb, can't fly.
- Objectifs pédagogiques : 1.6 (nourriture : bambou, seul aliment du panda) ; 1.2 (couleurs : noir/blanc, rose, vert, rouge des lanternes) ; 1.3 (nombres : bâtons, lanternes, marches) ; 2.3 (positions : derrière le rocher, sur le pont, en haut des marches) ; 2.2 (actions : grimper, rouler, mâcher).
- Fil rouge des 3 décors : D1 la forêt verte au bord de la cascade (jeux cachés et feuilles, matin) ; D2 le jardin aux lanternes de pierre et aux nénuphars (lumières, fleurs, pont, calme) ; D3 le pavillon rouge sur la colline (grimper, traverser le pont de pierre, regarder la montagne au loin). Trois ambiances : fraîche et vert profond / dorée et fleurie / haute et aérée.

### Panda · décor 1 — The bamboo forest / La forêt de bambous
- Image : `Animaux/Asie/Pandas/Image ChatGPT 19 nov. 2026, 09_01_15-1.png` · Statut : déjà dans le jeu sous `asia_bamboo`
- Ce qu'on voit : gros troncs de bambou verts au premier plan gauche (0-11, 5-60) et à droite (92-100, 0-55) ; fond de forêt de bambous dans la brume avec un faisceau de soleil en haut au centre-droit (55-77, 2-40) ; petite cascade (23-31, 40-54) tombant dans un bassin turquoise (22-46, 55-62) bordé de rochers moussus ; cerisier rose à gauche (11-25, 18-31) et à droite (77-92, 28-40) ; gros rocher moussu à droite (67-87, 39-58) et à gauche en bas (7-22, 75-95) ; fleurs roses en bas à gauche (0-10, 74-86) et en bas à droite (88-100, 80-92), petites fleurs blanches ; feuilles jaunes tombées en bas (35-59, 86-98) ; grande clairière d'herbe au centre (20-80, 62-90).
- Histoire : la famille se réveille dans la forêt. On entend l'eau : où est la cascade ? Un rayon de soleil éclaire la clairière, Papa se cache derrière le gros rocher pour un cache-cache, et les feuilles jaunes tombées sont à compter avant le goûter de bambou.
- Vocabulaire nouveau : waterfall (la cascade) · sunray (le rayon de soleil) · pond (le bassin) · fallen leaf (la feuille tombée) · behind (derrière, intermédiaire) — Vocabulaire réutilisé : bamboo · rock · flower · leaf · green · pink · one, two, three · Daddy · Mummy
- Débutant :
  - Papa : [locate] « Where is Daddy? » — Papa est caché derrière le gros rocher de droite ; l'enfant touche le rocher (« Daddy is behind the rock! »).
  - Maman : [identify] « Touch the waterfall! » (Touche la cascade !) puis « Is the bamboo green? » (oui/non).
  - Bébé fille : [count] « How many yellow leaves? » (touche les feuilles jaunes tombées, 2 ou 3) — dès la phase little.
  - Bébé garçon : [identify] « Touch the pink flower! » / « Is this a pink flower or a blue flower? » (deux choix) — dès la phase newborn (regarder/toucher, pas de déplacement).
- Intermédiaire :
  - Papa : [locate] « Where is Daddy hiding? » — trois rochers possibles (gauche, centre-fond, droite), réponse « Behind the big rock » (position : behind).
  - Maman : [compare] « Which is bigger, the waterfall or the rock? » / « Can you find two pink flowers? » (couleur + quantité).
  - Bébé fille : [guide] « Can you take me to the pond? » — l'enfant guide le bébé vers le bassin ; « The water is cold! » (verbe d'action : look, walk).
  - Bébé garçon : [social] « What is Baby Boy doing? » (Baby Boy is looking at the sunray / eating bamboo / sleeping) (what is X doing ?).
- Cohérence : le panda mange seulement du bambou (aucun poisson dans le bassin). Il sait grimper, pas voler. Aucun danger. Le bassin est de l'eau : pas d'objet posé dedans (règle déjà appliquée par `dryLand`).
- Points d'attention : la zone de la cascade (8×14 %) est petite pour un doigt : prendre la zone cascade+bassin ensemble. Un fond de forêt dense : bambou « fond » non touchable, utiliser les troncs du premier plan.

### Panda · décor 2 — The lantern garden / Le jardin aux lanternes
- Image : `Animaux/Asie/Pandas/Image ChatGPT 19 nov. 2026, 09_01_31-5.png` · Statut : déjà dans le jeu sous `asia_garden`
- Ce qu'on voit : grand cerisier rose qui part de la gauche et couvre le haut (0-55, 0-25) ; lanterne de pierre allumée à gauche (7-18, 37-62) ET une deuxième à droite (88-97, 40-58, pas encore dans les zones) ; petite cascade (22-31, 34-48) et bassin avec nénuphars roses (24-44, 49-57) ; barrière en bambou devant le bassin (45-80, 49-57) ; pont arqué en bois rouge-brun (56-74, 38-49) ; pavillon à toit de tuiles en haut à droite (80-95, 14-38) avec des marches de pierre (80-92, 40-60) ; iris violets (44-50, 41-51) ; montagnes dans la brume avec une toute petite pagode au loin (55-68, 22-32) ; soleil et nuage en haut (68-80, 0-14) ; grand sol de terre dorée au centre (10-90, 62-95) ; rocher à gauche (7-22, 80-98), fleurs blanches en bas à droite.
- Histoire : le soir approche : les lanternes de pierre sont allumées de chaque côté du jardin. Les pandas viennent regarder les nénuphars roses, traversent le petit pont, puis s'assoient entre les deux lanternes pour compter les lumières.
- Vocabulaire nouveau : lantern (la lanterne) · bridge (le pont) · lotus (le nénuphar) · fence (la barrière) · steps (les marches) — Vocabulaire réutilisé : pink · flower · waterfall · pond · one, two · bamboo (la barrière est en bambou) · big / small
- Débutant :
  - Papa : [count] « How many lanterns? » (deux lanternes à toucher : celle de gauche, celle de droite) — réponse « Two! ».
  - Maman : [locate] « Where is the bridge? » (touche le pont rouge-brun).
  - Bébé fille : [identify] « Touch the pink lotus! » (nénuphar rose sur le bassin) — touche seulement, pas d'objet à déposer dans l'eau.
  - Bébé garçon : [identify] « Is the lantern big or small? » (grande pierre / petite fleur) — ou « Touch the purple flower! » (iris) dès newborn.
- Intermédiaire :
  - Papa : [guide] « Let's cross the bridge! Which way? » — 3 choix : « Over the bridge / Behind the fence / Up the steps » (positions).
  - Maman : [count] « Can you find three pink lotus flowers? » (couleur + quantité).
  - Bébé fille : [observe] « What is Baby Girl doing? » (She is looking at the lantern / sleeping / eating bamboo).
  - Bébé garçon : [compare] « Which lantern is closer to Daddy? » (la gauche / la droite) (position near).
- Cohérence : jamais de poisson dans le bassin à nénuphars (le panda ne mange pas de poisson) ; les fleurs de cerisier et les nénuphars ne sont pas de la nourriture du panda. Le bambou est le seul aliment.
- Points d'attention : ressemble beaucoup au décor 1 du tigre (voir Anomalies). Deuxième lanterne à ajouter aux zones (88-97, 40-58) ; la barrière en bambou traverse tout le décor et peut cacher le bassin (ne pas y poser de personnage). Les marches au fond à droite sont petites.

### Panda · décor 3 — The red pavilion / Le pavillon rouge
- Image : `Animaux/Asie/Pandas/Paysage de bambous et pagode en montagne.png` · Statut : NOUVEAU (proposer `asia_pavilion`)
- Ce qu'on voit : gros bambous verts à gauche (0-30, 0-75) ; fleurs roses en bas à gauche (5-20, 62-85) ; montagnes en pics couvertes d'arbres dans la brume, avec une haute cascade (62-64, 25-42) au fond ; pont de pierre en arche au centre (42-67, 52-65) et petite chute d'eau en dessous qui devient une rivière (50-78, 65-85) ; pavillon rouge à toit sombre à droite (73-98, 15-52) avec deux lanternes rouges (88-97, 32-40) ; grosses pierres moussues à droite (78-100, 58-95) et en bas ; branche de cerisier rose en haut à droite ; herbe verte avec petites fleurs roses au sol (10-60, 80-96).
- Histoire : au-dessus de la forêt, le pavillon rouge guette la montagne. Les pandas grimpent sur les gros rochers moussus (ils savent grimper), traversent le pont de pierre et regardent la haute cascade au loin. On compte les lanternes rouges.
- Vocabulaire nouveau : stream (la rivière) · mountain (la montagne) · red house / pavilion (le pavillon) · stone bridge (le pont de pierre) · mist (la brume) — Vocabulaire réutilisé : lantern · red · bridge · rock · climb · waterfall · pink · bamboo
- Débutant :
  - Papa : [locate] « Where is the red house? » (touche le pavillon) — Papa dort devant ; ou « Where is Daddy? » (sur le gros rocher de droite).
  - Maman : [count] « How many red lanterns? » (deux lanternes rouges, à toucher).
  - Bébé fille : [identify] « Touch the pink flower! » (fleurs roses en bas à gauche).
  - Bébé garçon : [identify] « Is the bridge big or small? » / « Touch the grey rock! » — dès newborn.
- Intermédiaire :
  - Papa : [locate] « Where is Daddy? » — « On the big rock / Under the bridge / Next to the red house » (positions on, under, next to).
  - Maman : [compare] « Which rock is bigger? » (le rocher de droite / celui du centre-bas / celui de gauche).
  - Bébé fille : [guide] « Where can I climb? » (Up the big rock / Into the stream / Over the bridge) — le bébé grimpe dès la phase little.
  - Bébé garçon : [observe] « What is Baby Boy doing? » (He is climbing / looking at the mountain / eating bamboo).
- Cohérence : grimper = capacité réelle (`can: climb`). La rivière est de l'eau : pas d'objet dedans. Le bambou à gauche est la seule nourriture.
- Points d'attention : très peu de sol dégagé : les personnages doivent se tenir sur l'herbe en bas (x 10-60, y 80-96) et sur les rochers ; la rivière est devant le pont. Image de 1671 px de large (1 px de moins que les autres, 1672). Ressemble en partie au décor 2 (pont + pavillon + cascade) mais cadre plus serré, pont gris au lieu de rouge-brun.

---

## Tigre (tiger) — Asie
- Personnages : Papa Raj (proud, grand, touffe de poils orange sur la tête), Maman Tara (calm, foulard rose autour du cou), Bébé fille (nœud rose sur l'oreille), Bébé garçon (touffe orange, sans nœud). Mot du bébé : cub (« bébé tigre »). Parents debout, de profil.
- Jeu propre existant : `tiger_stripes` « Tiger stripes! » — rayures noires, fourrure orange, cartes (Roar, jump, run, dance), se cacher dans le bambou (sinon question « Why have I got stripes? »), feuilles orange à compter, nager dans le bassin (s'il existe), « A cub ». Mots de l'espèce : stripes, orange fur, roar, hide, swim, cub, can't fly.
- Objectifs pédagogiques : 1.5 (parties du corps : rayures, pattes, queue) ; 1.2 (couleurs : orange, rouge, rose, turquoise) ; 2.2 (actions : nager, sauter, courir, se cacher) ; 2.3 (positions : derrière, sur, dans) ; 1.3 (nombres : lanternes, marches, pierres).
- Fil rouge des 3 décors : D1 la pagode rouge (cérémonie calme, lanternes, escalier, pont) ; D2 le sentier de montagne dans les nuages (grimper les marches, courir, sauter de pierre en pierre) ; D3 la jungle humide à la grande cascade (se baigner, se cacher dans les racines, feuilles tombées). Trois verbes dominants : marcher/compter, grimper/sauter, nager/se cacher.

### Tigre · décor 1 — The red pagoda / La pagode rouge
- Image : `Animaux/Asie/Tigres/Image ChatGPT 19 nov. 2026, 09_01_17-2.png` · Statut : déjà dans le jeu sous `asia_pagoda`
- Ce qu'on voit : grande pagode rouge et blanche à toit bleu-gris et ornements dorés à droite du centre (59-84, 6-40) avec escalier de pierre (62-77, 40-49) et deux lanternes de pierre de chaque côté (56-65, 40-52 ; 74-79, 40-52) ; pont rouge en arche (30-47, 40-50) ; cascade à gauche (17-25, 39-52) et bassin avec nénuphars roses (19-50, 50-57) ; cerisiers roses de chaque côté de la pagode (49-62, 30-42 ; 80-95, 25-48) ; bambous sur les bords gauche et droit ; soleil en haut à droite (80, 3-10) ; montagnes lointaines (36-55, 15-30) ; immense sol de terre orange au centre (10-90, 55-95) ; gros rochers gris en bas à gauche et à droite (0-15, 67-83 ; 82-95, 70-92) ; fleurs roses en bas à gauche.
- Histoire : un matin de fête à la pagode. La famille de tigres monte l'escalier jusqu'à la grande porte rouge, compte les lanternes, puis traverse le pont rouge pour boire au bassin.
- Vocabulaire nouveau : pagoda (la pagode) · stairs (l'escalier) · door (la porte) · gold (doré) · bridge (le pont) · lantern (la lanterne) — Vocabulaire réutilisé : red · orange · pink · stripes · pond · waterfall · one, two · cherry blossom
- Débutant :
  - Papa : [locate] « Where is Daddy? » (Papa se tient devant l'escalier ; l'enfant touche Papa) ; « Touch the pagoda! ».
  - Maman : [count] « How many lanterns? » (deux, une de chaque côté de l'escalier).
  - Bébé fille : [identify] « Touch the red bridge! » (« Is the bridge red? » oui/non).
  - Bébé garçon : [identify] « Touch the pink flower! » (gauche en bas) ; dès newborn.
- Intermédiaire :
  - Papa : [guide] « Daddy walks to the stairs. Which way? » — « Up the stairs / Over the bridge / Behind the rock » (positions).
  - Maman : [count] « Can you find two pink trees? » (cerisiers, couleur + quantité).
  - Bébé fille : [social] « Is Baby Girl next to Mummy? » (Yes / No / Under the bridge).
  - Bébé garçon : [observe] « What is Baby Boy doing? » (He is looking at the pagoda / swimming / running) — nager seulement au bord du bassin.
- Cohérence : le tigre sait nager : boire ou se rafraîchir au bassin (l'eau est un objet décoratif, aucune proie). Pas de nourriture montrée (le tigre mange de la viande : ne rien montrer). Il ne vole pas.
- Points d'attention : le parent a validé la pagode pour le tigre. Très proche en composition du décor 2 du panda (voir Anomalies). La grande zone de terre au centre est idéale pour placer la famille (rien à toucher, laisser les zones sur les bords).

### Tigre · décor 2 — The misty mountain path / Le sentier dans les nuages
- Image : `Animaux/Asie/Tigres/Image ChatGPT 19 nov. 2026, 09_01_22-3.png` · Statut : déjà dans le jeu sous `asia_mountain`
- Ce qu'on voit : soleil rayonnant en haut à gauche (23-30, 6-20) ; gros bambous à gauche (0-13, 0-75) ; vallée de nuages avec pics rocheux couverts d'arbres et petites cascades (12-50, 30-70) ; terrasses vertes (45-65, 45-70) ; escalier de pierre qui monte vers le haut à droite (66-90, 35-65) ; chemin de terre qui serpente de bas en haut (40-85, 65-100) ; bosquet de bambous en haut à droite (55-95, 3-45) ; gros rochers à droite (80-100, 45-70 ; 75-95, 82-98) et en bas à gauche (8-22, 72-90) avec fleurs roses (0-14, 72-90) ; petites fleurs blanches (25-35, 78-84 ; 50-55, 78-82).
- Histoire : le tigre est en haut, au-dessus des nuages. Le sentier de terre monte par de grosses marches ; les bébés grimpent derrière Papa. On compte les marches puis on saute de pierre en pierre vers les fleurs roses.
- Vocabulaire nouveau : path (le sentier) · step (la marche) · cloud (le nuage) · mountain (la montagne) · up / down (en haut / en bas) — Vocabulaire réutilisé : sun · bamboo · rock · pink · flower · jump · run · waterfall · orange
- Débutant :
  - Papa : [locate] « Where is Daddy? » (Papa est en haut du sentier, à droite, près des marches) .
  - Maman : [count] « How many big steps? » (touche 3 grosses marches) — « Three! ».
  - Bébé fille : [identify] « Touch the sun! » (soleil en haut à gauche).
  - Bébé garçon : [identify] « Touch the pink flower! » / « Is the cloud white? » — newborn possible.
- Intermédiaire :
  - Papa : [guide] « Daddy goes up. Where are the steps? » — « Next to the bamboo / Under the cloud / Behind the rock » (positions).
  - Maman : [compare] « Which rock is bigger? » (les 3 rochers de droite et de gauche).
  - Bébé fille : [observe] « What is Baby Girl doing? » (She is jumping / sleeping / swimming) — jump dès little.
  - Bébé garçon : [count] « Can you find two white flowers? » (couleur + quantité).
- Cohérence : le tigre saute, court, grimpe des marches (jump, run). Aucune proie, aucun précipice dangereux mis en scène : l'équipe reste sur le chemin. Pas d'eau à sec (cascades lointaines non touchables).
- Points d'attention : ce décor est AUSSI l'ancien lieu partagé « asia_mountain » (panda, panthère, tigre) : il devient propre au tigre. Les cascades de la vallée sont minuscules (6 % de large) : ne pas en faire des cibles. Le chemin occupe le bas à droite, donc la famille (en bas à droite) peut le cacher.

### Tigre · décor 3 — The jungle waterfall / La cascade de la jungle
- Image : `Animaux/Asie/Tigres/Clairière tropicale et cascade lumineuse.png` · Statut : NOUVEAU (proposer `asia_jungle_falls`)
- Ce qu'on voit : énorme arbre tropical à gauche avec grosses racines qui descendent en bas (0-35, 0-75) ; hibiscus rouges à gauche (2-12, 43-60) et à droite (95-100, 48-56) ; grande feuille de monstera à droite (86-100, 28-52) ; fougères au centre-gauche (32-45, 33-52) ; haute cascade à droite (70-88, 24-55) qui tombe dans un bassin turquoise (55-95, 55-75) avec un petit seuil d'eau (57-75, 60-68) ; rochers moussus (25-55, 50-72), (55-70, 45-55) et en bas à droite (77-100, 82-100) ; sentier de terre avec feuilles brunes tombées au centre-bas (22-85, 72-95) ; rayons de lumière en haut à droite (80-90, 0-30). Pas de bambou visible.
- Histoire : au fond de la jungle humide, le grand arbre cache des racines parfaites pour jouer à cache-cache. Les tigres adorent nager : les bébés regardent Papa se rafraîchir sous la cascade pendant que Maman compte les fleurs rouges.
- Vocabulaire nouveau : jungle (la jungle) · roots (les racines) · hibiscus / red flower (la fleur rouge) · big leaf (la grande feuille) · swim (nager) — Vocabulaire réutilisé : waterfall · rock · stripes · hide · orange · red · green · one, two, three
- Débutant :
  - Papa : [locate] « Where is Daddy? » (Papa est près de la cascade, à droite) ; « Touch the waterfall! ».
  - Maman : [count] « How many red flowers? » (3 fleurs rouges : 2 à gauche, 1 à droite).
  - Bébé fille : [identify] « Touch the big tree! » (arbre de gauche) ; « Is the tree big? » oui/non.
  - Bébé garçon : [identify] « Touch the green leaf! » (grande feuille à droite).
- Intermédiaire :
  - Papa : [guide] « Daddy wants to swim. Where is the water? » — « The pool / The big tree / The path » (le tigre aime nager).
  - Maman : [locate] « Where is Mummy hiding? » — « Behind the big tree / Under the leaf / Next to the rock » (positions).
  - Bébé fille : [observe] « What is Baby Girl doing? » (She is hiding / swimming / sleeping) — hiding dans les racines dès little.
  - Bébé garçon : [compare] « Which rock is bigger? » (rochers moussus).
- Cohérence : le tigre nage (`can: swim`). Les rayures aident à se cacher dans les feuilles : cohérent avec `tiger_stripes`. Aucune proie montrée, jamais de chasse. Le jeu `tiger_stripes` utilise l'ancre « bamboo » pour se cacher ; sans bambou il retombe sur la question « Why have I got stripes? » (déjà géré).
- Points d'attention : pas de bambou : toute question « bambou » doit être retirée de ce parcours. Très grande cascade lumineuse, belle zone tactile. Sol assez étroit : placer la famille sur le sentier (y 72-95).

---

## Panthère des neiges (snow_leopard) — Asie
- Personnages : Papa Sasha (quiet, grosse crinière blanche, queue très épaisse), Maman Shanti (gentle, fleur d'hibiscus rose sur la tête, yeux bleus), Bébé fille (nœud rose), Bébé garçon (sans nœud). Mot du bébé : cub (« bébé panthère »). Parents dessinés couchés, queue touffue enroulée, yeux bleus.
- Jeu propre existant : `leopard_leap` « Snow leopard leaps! » — « Chuff, chuff! » (elle ne rugit pas), queue touffue sur le nez, grosses pattes poilues, fourrure épaisse, compter les bonds, cartes (leap, climb, run, roar→non). Mots de l'espèce : chuff, fluffy tail, big furry paws, thick fur, leap, climb, can't roar.
- Objectifs pédagogiques : 1.5 (parties du corps : queue, pattes, fourrure) ; 3.3 (le temps/le jour : matin, froid) ; 2.3 (positions : dans la grotte, sur le rocher, sous l'arche) ; 1.3 (nombres : drapeaux, baies, rochers) ; 1.2 (couleurs : blanc, rouge, violet, bleu).
- Fil rouge des 3 décors : D1 l'aube dorée devant la grotte et le monastère (drapeaux de prière, chute d'eau, matin) ; D2 la grotte enneigée au grand silence (neige, baies rouges, traces, calme) ; D3 la prairie à l'arche de pierre (été sur les hauteurs, grimper et sauter sur l'arche, la seule scène sans neige). Trois ambiances : lever de soleil / silence blanc / pré vert.

### Panthère · décor 1 — The dawn at the Himalaya / L'aube sur l'Himalaya
- Image : `Animaux/Asie/Penthere des neige/Aube dorée sur l’Himalaya enneigé.png` · Statut : déjà dans le jeu sous `asia_snow_den`
- Ce qu'on voit : grotte sous un rocher à gauche (9-32, 41-55) avec stalactites de glace (7-27, 29-41) sous un pin enneigé (0-40, 0-35) ; guirlande de drapeaux de prière colorés (13-28, 15-26) ; monastère blanc et rouge sur une falaise (29-40, 10-26) et petit temple plus loin (46-50, 28-31) ; sommet doré (60-80, 3-22) ; soleil levant à droite (90, 10-15) ; sapins enneigés (32-50, 30-55 ; 90-98, 8-22) ; arche de rocher en haut à droite (76-100, 22-42) ; chute d'eau turquoise (74-90, 45-58) et bassin gelé-turquoise (62-100, 58-72) ; fleurs violettes en bas à gauche (0-8, 70-85), au centre (32-38, 59-66) et en bas à droite (83-95, 75-85) ; buisson rouge à gauche (0-10, 45-60) ; grande dalle de pierre plate centrale (22-80, 66-80) ; marches de pierre en bas (22-40, 82-92).
- Histoire : le soleil se lève sur la montagne dorée. Les panthères sortent de la grotte, regardent les drapeaux colorés et le monastère tout là-haut, puis comptent les drapeaux. Elles boivent à l'eau claire et se réchauffent au soleil.
- Vocabulaire nouveau : cave (la grotte) · flag (le drapeau) · icicle (le glaçon) · morning / wake up (matin / se réveiller) · footprint (la trace) — Vocabulaire réutilisé : snow · tree · cold · mountain · sun · red · purple · chuff · fluffy tail · big furry paws
- Débutant :
  - Papa : [locate] « Where is Daddy? » (Papa est sur la dalle plate devant la grotte).
  - Maman : [count] « How many flags? » (drapeaux de prière : on en touche 3 ou 4 — choisir 3 pour rester simple).
  - Bébé fille : [identify] « Touch the cave! » (grotte à gauche) ; « Is the cave dark? » oui/non.
  - Bébé garçon : [identify] « Touch the purple flower! » / « Is the sun yellow? » — newborn possible.
- Intermédiaire :
  - Papa : [guide] « Daddy goes home. Where is the cave? » — « Next to the pine tree / Under the arch / Behind the waterfall » (positions).
  - Maman : [count] « Can you find two purple flowers? » (couleur + quantité).
  - Bébé fille : [observe] « What is Baby Girl doing? » (She is waking up / drinking / jumping).
  - Bébé garçon : [compare] « Which is higher, the cave or the mountain? » (la montagne) — ou « Which flag is red? ».
- Cohérence : la panthère boit à l'eau libre, jamais de proie. Elle saute, grimpe, ne rugit pas (chuff). Les drapeaux sont de simples décorations. La famille reste au sol (pas de danger de falaise).
- Points d'attention : l'ancienne zone « arch » (76,21,24,21) de ce décor est bien l'arche de rocher visible ; la grotte existe aussi dans le décor 2 (même mot « cave ») : les histoires doivent être clairement différentes (ici le matin et les drapeaux). Les drapeaux sont petits (autour de 3 % de large) : toucher la guirlande entière.

### Panthère · décor 2 — The snowy cave / La grotte enneigée
- Image : `Animaux/Asie/Penthere des neige/Grotte enneigée face aux sommets alpins.png` · Statut : NOUVEAU (proposer `asia_snow_cave`)
- Ce qu'on voit : grotte sombre avec de la paille sèche à l'entrée (12-42, 32-52) sous un rocher enneigé couvert de lichen orange (0-42, 5-55) ; grappes de glaçons (30-34, 20-42) ; branche de pin enneigée en haut (0-57, 0-18) ; grande montagne enneigée à droite (40-100, 10-42) et vallée dans la brume avec forêt de sapins (45-100, 38-60) ; baies rouges à gauche (0-22, 45-72) et à droite (87-100, 50-78) ; gros rochers couverts de neige et de lichen (72-97, 62-88), à gauche en bas (5-20, 63-80), en bas (8-32, 80-100) ; touffes d'herbe dorée (28-38, 70-85 ; 65-75, 57-65 ; 63-75, 75-85) ; grande étendue de neige au centre (30-70, 62-95). Pas de soleil visible, ciel bleu clair, pas d'eau.
- Histoire : jour calme et froid après la neige. Les panthères restent près de leur grotte, sur la neige fraîche. Elles comptent les baies rouges (pas à manger : les panthères ne mangent pas de baies), regardent le grand sommet et font un grand bond de rocher en rocher.
- Vocabulaire nouveau : berries (les baies) · icicle (le glaçon) · hay / dry grass (l'herbe sèche) · lichen / orange rock (le rocher orange) · peak (le sommet) — Vocabulaire réutilisé : cave · snow · cold · red · white · rock · tree · fluffy tail · big furry paws · leap
- Débutant :
  - Papa : [locate] « Where is Daddy? » (Papa se tient sur le grand rocher de droite).
  - Maman : [count] « How many red berries? » (une branche à droite : toucher 3 baies).
  - Bébé fille : [identify] « Touch the snow! » / « Is the snow white? » (oui/non).
  - Bébé garçon : [identify] « Touch the big rock! » / « Is the cave dark? » (oui).
- Intermédiaire :
  - Papa : [locate] « Where is Daddy? » — « In the cave / On the rock / Behind the tree » (positions in, on, behind).
  - Maman : [count] « Can you find two red berry branches? » (une à gauche, une à droite : couleur + quantité).
  - Bébé fille : [guide] « Baby Girl wants to stay warm. Where does she go? » — « Into the cave / Into the snow / Up the mountain ».
  - Bébé garçon : [social] « Is Baby Boy next to Daddy? » (Yes / No / Under the berries).
- Cohérence : les baies sont seulement à regarder et à compter ; la panthère est carnivore, elle ne mange jamais de baies (`notFoods: berries`). Pas de proie, pas de traces d'animaux. La grotte sert d'abri pour dormir, sans danger.
- Points d'attention : décor très blanc : zones touchables moins contrastées ; pas d'eau, donc pas de scène « boire ». Pas de sol brun : les personnages blancs sur neige blanche : vérifier le contraste. Image 1671 px (1 px d'écart). Aucune zone équivalente à l'ancien décor : la grotte ici est plus grande (30 % de la largeur).

### Panthère · décor 3 — The stone arch meadow / Le pré à l'arche de pierre
- Image : `Animaux/Asie/Penthere des neige/Image ChatGPT 19 nov. 2026, 09_01_25-4.png` · Statut : déjà dans le jeu sous `asia_arch`
- Ce qu'on voit : grand arbre à tronc brun et large couronne à gauche (0-25, 0-58) ; grande arche de pierre moussue couverte de fleurs roses en haut à droite (56-90, 13-42) ; gros rochers moussus (26-40, 18-34 ; 33-46, 28-42 ; 53-63, 40-51 ; 82-93, 28-42) ; touffes de bambous (34-43, 40-55 ; 90-100, 10-65 ; 10-20, 33-50) ; fougères ; petites marches de pierre (67-80, 46-55) ; sommets lointains dans la brume (42-55, 15-30) ; soleil à droite (84-96, 3-12) ; grand pré d'herbe jaune-vert au centre (10-90, 55-90) ; fleurs roses en bas à gauche (0-12, 85-100) et en bas à droite (95-100, 94-100) ; gros rochers au premier plan (6-22, 75-92 ; 79-100, 84-98).
- Histoire : l'été arrive sur les hauteurs : plus de neige, de l'herbe verte autour de la grande arche. Les panthères grimpent sur les rochers moussus, sautent sous l'arche et jouent à cache-cache dans les bambous. Un peu de fourrure en moins : elles font la sieste à l'ombre du grand arbre.
- Vocabulaire nouveau : arch (l'arche) · tree (l'arbre) · fern (la fougère) · summer / warm (l'été / chaud) · shade (l'ombre) — Vocabulaire réutilisé : rock · bamboo · pink · flower · green · sun · mountain · leap · climb · fluffy tail
- Débutant :
  - Papa : [locate] « Where is Daddy? » (Papa est sous l'arche).
  - Maman : [identify] « Touch the stone arch! » (arche en haut à droite).
  - Bébé fille : [count] « How many pink flowers? » (3 fleurs roses en bas à gauche, ou celles sur l'arche).
  - Bébé garçon : [identify] « Touch the big tree! » / « Is the grass green? » (oui).
- Intermédiaire :
  - Papa : [guide] « Daddy leaps! Where to? » — « Onto the rock / Under the arch / Behind the tree » (positions + verbe leap).
  - Maman : [compare] « Which rock is bigger? » (rocher gauche / centre / droite).
  - Bébé fille : [observe] « What is Baby Girl doing? » (She is climbing / napping in the shade / swimming) — grimper dès little ; nager est faux (pas d'eau).
  - Bébé garçon : [locate] « Where is Baby Boy hiding? » — « Next to the bamboo / In the tree / Behind the rock » (cache-cache).
- Cohérence : la panthère saute et grimpe (`can: climb, jump`). L'arche est un décor, pas un défi dangereux. Pas de neige : ne pas parler de neige ni de froid ici ; garder « warm sun ». Pas d'eau : pas de scène « boire ».
- Points d'attention : décor très vert et tropical, loin d'une montagne enneigée ; un enfant peut trouver bizarre une panthère « des neiges » sans neige (choix du parent, à garder : décor déjà validé). Pas d'eau du tout dans ce décor. L'ancien partage avec le tigre et le panda disparaît.

---

## Anomalies — Asie

1. **Ressemblance panda D2 / tigre D1** : `Animaux/Asie/Pandas/Image ChatGPT 19 nov. 2026, 09_01_31-5.png` (asia_garden) et `Animaux/Asie/Tigres/Image ChatGPT 19 nov. 2026, 09_01_17-2.png` (asia_pagoda). Même composition : cascade à gauche avec bassin à nénuphars roses, pont arqué rouge au centre, paire de lanternes de pierre allumées (une à gauche, une à droite), cerisiers roses, grand sol de terre dorée au centre, mêmes montagnes lointaines. Différences nettes : le tigre a une grande pagode rouge et blanche avec escalier à droite, le panda a un petit pavillon à toit sombre avec marches, une barrière en bambou devant l'eau, un pont brun et un soleil rayonnant. Conclusion : proches (même « monde », composition quasi identique à 70 %), pas identiques. Un enfant qui joue panda puis tigre reconnaîtra le même endroit. Conséquence : la variété de décors entre familles est faible. Il faudrait, si le parent veut les distinguer, soit régénérer l'un des deux avec une autre composition (cascade à droite, eau au premier plan), soit accepter la ressemblance. À signaler au parent plutôt que de trancher.
   - `Animaux/Asie/Pandas/Paysage de bambous et pagode en montagne.png` partage avec ces deux images : pont en pierre, pavillon rouge à droite, cascade, lanternes rouges. Plus proche du panda D2 que du tigre D1, mais cadrage rapproché, forêt dense, pont gris et rivière devant : suffisamment différent.
2. **Le tigre n'utilise pas ses 3 décors** : `src/content/species.ts` ligne 27 donne `allowedBiomes: ['asia_bamboo', 'asia_mountain', 'asia_arch']`. Ses images sont : `asia_pagoda` (Tigres `09_01_17-2`), `asia_mountain` (`09_01_22-3`) et NOUVEAU (`Clairière tropicale et cascade lumineuse.png`, à créer, ex. `asia_jungle_falls`). Conséquence : il joue aujourd'hui dans la forêt de bambous du panda et dans l'arche de la panthère, et ne voit pas sa pagode. À faire : remplacer par `['asia_pagoda','asia_mountain','asia_jungle_falls']`.
3. **Le panda et la panthère partagent encore des décors qui ne sont plus à eux** : panda (`species.ts` ligne 10, `ASIA_PANDA`) = bamboo, mountain, arch, garden, pagoda ; il devrait être bamboo (`09_01_15-1`), garden (`09_01_31-5`) et NOUVEAU `asia_pavilion` (`Paysage de bambous et pagode en montagne.png`). Il perd `asia_mountain` (image du tigre), `asia_arch` (image de la panthère), `asia_pagoda` (image du tigre). Panthère (`ASIA_HEIGHTS`, ligne 13) = mountain, arch, snow_den ; elle devrait être snow_den (`Aube dorée…`), NOUVEAU `asia_snow_cave` (`Grotte enneigée face aux sommets alpins.png`) et arch (`09_01_25-4`). Elle perd `asia_mountain`.
4. **Aventures partagées à replacer** (`src/content/adventures/asia.ts`, lignes 267-272) : `asia_bamboo_morning` (species panda + tigre) → le tigre n'a plus la forêt de bambous ; `asia_lantern_night` (start `asia_pagoda`, species panda seul) → la pagode devient le décor du tigre, le panda garde le jardin (`asia_garden`, aussi lanternes) ; `asia_misty_mountain` (start `asia_mountain`, 3 espèces) → seulement tigre ; `asia_rainbow_rain` et `asia_arch_morning` (start `asia_arch`, panda/tigre/panthère) → seulement panthère ; `asia_leopard_rocks` (start `asia_mountain`, panthère + tigre) → à déplacer vers `asia_arch`/`asia_snow_cave`. Archétype `lanterns` (`archetypes.ts` ligne 47) : `allowedBiomes: ['asia_garden','asia_pagoda']` ; `echo_canyon` et `climb_rock` incluent `asia_mountain` / `asia_arch`. Aussi `src/content/activities/africa.ts` lignes 59-60, 204-205 et 471-476 (nombres par décor, ancres de comparaison, mots) et `src/content/places/depth.ts` lignes 62-70 : à compléter pour les 3 nouveaux ids.
5. **3 décors NOUVEAUX sans place id ni anchors/spots/depth** : `asia_pavilion` (panda), `asia_jungle_falls` (tigre), `asia_snow_cave` (panthère). Fichiers à produire : image webp dans `public/assets/backgrounds/`, entrée dans `src/content/assetManifest.json` (`backgrounds`), place dans `src/content/places/asia.json`, profondeur dans `depth.ts`. Rien dans `assetManifest.json` ni `public/assets/backgrounds/` pour eux aujourd'hui (existent : asia_arch, bamboo, garden, mountain, pagoda, snow_den, tous 1672×941).
6. **Personnages et phases : rien ne manque.** `src/content/assetManifest.json` et `public/assets/characters/` contiennent pour giant_panda, tiger et snow_leopard : `<id>_father`, `<id>_mother`, `<id>_girl_{newborn,little,young,companion}` et `<id>_boy_{newborn,little,young,companion}` (10 fichiers .webp par espèce, 30 au total). Contrairement à l'énoncé, le dossier source `Animaux/Asie/Pandas/panda/` contient bien `bebe_garcon_stade_2.png` (les 8 bébés + 2 parents sont présents dans les trois sous-dossiers `panda`, `tigre`, `panthere`).
7. **Chemins `source` à vérifier** dans `src/content/places/asia.json` : 5 décors (`asia_bamboo`, `asia_pagoda`, `asia_mountain`, `asia_arch`, `asia_garden`) pointent vers `Continant/Asie/…` (faute « Continant ») alors que les images sont maintenant dans `Animaux/Asie/<famille>/` ; `asia_snow_den` pointe déjà vers `Animaux/Asie/Penthere des neige/`. Conséquence : traçabilité cassée, sans impact sur le jeu. À corriger.
8. **Lanterne droite du jardin non zonée** : `asia_garden` ne contient qu'une lanterne (7,37,11,24) alors que l'image en montre deux (la seconde vers x 88-97, y 40-58). Conséquence : « How many lanterns? » donnerait 1 au lieu de 2. À ajouter dans `asia.json`.
9. **Décors à peu de sol dégagé** : panda D3 (`Paysage de bambous et pagode en montagne.png`, rivière en bas au centre, rochers à droite) ; panthère D2 (neige blanche : personnages blancs peu contrastés) ; tigre D3 (sentier étroit, pas de bambou : le jeu `tiger_stripes` retombe sur la question « Why have I got stripes? » au lieu de « Touch the bamboo! », prévu). `dryLand()` dans `src/content/activities/species/asia.ts` exige ≥ 5 emplacements au sec pour `panda_picnic` et `tiger_stripes` : à vérifier pour les 3 nouveaux décors (sinon les jeux propres du panda et du tigre disparaissent dans ces décors).
10. **Tailles** : `Pandas/Paysage de bambous et pagode en montagne.png` et `Penthere des neige/Grotte enneigée face aux sommets alpins.png` font 1671×941 (les autres 1672×941) : 1 px d'écart, à normaliser au passage en webp. Aucune image trop petite ou floue ; toutes en bonne définition.
11. **Cohérence panthère / décor** : `Image ChatGPT 19 nov. 2026, 09_01_25-4.png` (asia_arch) est un pré vert tropical, sans neige, ce qui détonne avec « panthère des neiges ». Choix du parent à respecter ; les histoires doivent éviter neige et froid dans ce décor.


---

# Cartographie — ANTARCTIQUE (3 familles × 3 décors = 9 parcours)

Cartographie du 2026-11-23, lecture seule. Images vues : 9 décors + 3 planches de famille (12 images). Coordonnées en % de l'image (x, y, largeur, hauteur), comme dans `places/antarctica.json`. Mécaniques débutant utilisées : celles de `archetypes.ts` (locate, identify, count, observe, compare, fetch, sort, tell, social, talk), jamais autre chose ; 2 réponses au choix. Intermédiaire : 3 réponses.

Constat d'ensemble : aujourd'hui, `species.ts` lignes 47-49 donne aux trois espèces des décors qui se recouvrent (manchot : les 5 ; ours : les 5 ; phoque : `ice_coast`, `open_sea`, `an_aurora`). Chaque famille doit avoir ses 3 propres décors : ours = `ice_coast` + `an_ice_cave` + `an_snowfield` ; manchot = `open_sea` + `an_aurora` + NOUVEAU `an_penguin_cave` ; phoque = 3 NOUVEAUX (`an_seal_aurora`, `an_seal_rocks`, `an_seal_sunset`).

---

## Ours polaire (polar_bear) — Antarctique
- Personnages : Papa Polo (fort, écharpe bleue), Maman Snowy (douce, fleur d'hibiscus rose dans l'oreille), Bébé fille (nœud rose), Bébé garçon (sans nœud) — mot du bébé : cub / ourson. Les 4 phases sont des oursons blancs, du bébé assis au grand ourson debout.
- Jeu propre existant : `polar_bear_fur` « White like the snow » (identify) — couleur de la fourrure (white), nez noir, empreintes à compter, rouler dans la neige, nager en pagayant, « A baby polar bear is a cub », carte « Simon says ». Mots propres déjà en jeu : fur, white, black, nose, paw, footprint, paddle, cub, roll.
- Objectifs pédagogiques : 1.2 couleurs (blanc, noir, bleu de la glace : l'ours est blanc, le nez noir) ; 1.3 nombres (empreintes, cristaux) ; 1.5 corps et actions (paws, nose, roll, run, paddle) ; 2.2 capacités (can swim, can run, can't hop) ; 3.4 comparaison (grosses empreintes, grand/petit, au intermédiaire).
- Fil rouge des 3 décors : décor 1 = le bord de l'eau (nager, pagayer, plaques de glace, soleil et chaleur ressentie) ; décor 2 = la grotte de glace (cristaux colorés, rayons de soleil, écho, cache-cache, glissade sur le sol gelé) ; décor 3 = la grande plaine vide (traces de pattes, loin/près, rouler dans la neige, blocs de glace bleue).

### Ours · décor 1 — The ice coast / la côte de glace
- Image : `Animaux/Antarctique/Ours/Image ChatGPT 20 nov. 2026, 09_50_12-1.png` · Statut : déjà dans le jeu sous `ice_coast`.
- Ce qu'on voit : soleil rayonnant en haut à gauche (x2-14, y0-17) ; nuages en haut à gauche et en haut à droite ; grand iceberg bleu-blanc à gauche (x8-27, y22-37) ; mur de glacier bleu clair au fond, du centre vers la droite (x44-90, y19-33) ; montagnes enneigées au fond ; lagon turquoise au centre (x20-76, y38-56) avec plaques de glace flottantes (grande plaque x30-42, y36-47 ; plusieurs petites) ; plateau de banquise à droite (x66-90, y45-53) ; premier plan = grande étendue de neige (x28-68, y68-88) ; rochers gris enneigés en bas à gauche (x0-19, y78-94) et à droite (x85-100, y45-72). Zones assez larges pour un doigt : mer, neige, iceberg, glacier, rochers droite et gauche.
- Histoire : Polo et Snowy conduisent leurs oursons au bord du lagon, par une belle journée de soleil. Les oursons veulent voir de près la grande plaque de glace qui flotte ; on apprend les mots du bord de l'eau et on compte les plaques, puis toute la famille fait trempette à tour de rôle.
- Vocabulaire nouveau : floe / plaque de glace · glacier (le glacier) · lagoon, pond non retenu (rester sur « sea ») · sunny (ensoleillé). Vocabulaire réutilisé : ice, snow, sea, iceberg, rock, sun, cloud, mountain, white, blue, big, small, one…five, paw, swim.
- Débutant — interactions par personnage :
  - Papa : [locate] "Where is Daddy? Touch the big iceberg!" (Où est Papa ? Touche le grand iceberg !) ; [identify] "Is the sea blue?" (La mer est bleue ?).
  - Maman : [observe] "Look! Mummy swims. Touch the sea!" (Regarde, Maman nage : touche la mer !) ; [count] "How many ice floes? Count the big ones: one, two!" (Combien de plaques ? 1, 2 !).
  - Bébé fille : [locate] "Where is Baby Girl? Behind the rock!" (derrière un rocher : « Find the rock ! ») ; [identify] "Touch the white snow!" (Touche la neige blanche !).
  - Bébé garçon : [tell] "Baby Boy is happy. Is the sun hot?" (le soleil est chaud ? réponse oui / non) ; [fetch] "Find the cloud!" (Trouve le nuage !).
- Intermédiaire — même format :
  - Papa : [locate] "Is Daddy next to the iceberg or the rock?" (3 choix : iceberg / rock / sea — position, 2.3) ; [talk] "What is Daddy doing? He is swimming." (3.1).
  - Maman : [count + couleur] "Can you find three white ice floes?" (couleur + nombre + objet) ; [compare] "Which ice floe is bigger?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the rocks, near the iceberg, or under the cloud?" (3 positions) ; [fetch] "Bring me the small white rock." (couleur + taille).
  - Bébé garçon : [observe] "Is Baby Boy near the sea? Yes, he is." (près / loin) ; [social] « Say to Mummy: I am cold. » (1.7).
- Cohérence : l'ours nage, ne sautille pas (cannot hop) ; aucun poisson mangé à l'image ; chasse jamais montrée. Attention : « Is the sun hot ? » → la réponse est non (« warm »), cohérent avec « cold » du lieu.
- Points d'attention : décor déjà très proche de `open_sea` du manchot (glacier + lagon + rochers) : l'histoire doit être « eau, nage, plaques » et non « mur de glace ». L'iceberg de gauche est à 8-27 %, c'est assez gros.

### Ours · décor 2 — The ice cave / la grotte de glace
- Image : `Animaux/Antarctique/Ours/Image ChatGPT 20 nov. 2026, 09_50_14-2.png` · Statut : déjà dans le jeu sous `an_ice_cave`.
- Ce qu'on voit : voûtes de glace bleue qui forment une galerie ; stalactites de glace (haut, x0-15 ; x40-50 ; x80-100) ; trois grands trous de lumière dans le plafond avec rayons de soleil à gauche (x16-30, y10-30) ; touffes de grands cristaux transparents en bas à gauche (x0-8, y62-82), en bas à droite (x88-100, y64-90), au centre (x50-57, y40-55) et à gauche (x1-5, y43-55) ; tunnel qui s'enfonce à droite (x56-88, y16-52) ; sol de glace lisse et brillante avec fissures lumineuses (x20-76, y62-86) ; talus enneigés dans les angles du bas.
- Histoire : la famille d'ours entre dans la grotte brillante pour se mettre à l'abri du vent. Les cristaux scintillent de plusieurs couleurs ; on les compte, on fait un écho (« Hello ! »), puis les oursons jouent à cache-cache dans le tunnel, et la famille se retrouve au milieu, sur la glace.
- Vocabulaire nouveau : crystal / cristal · icicle / glaçon pendant · cave / grotte · echo (écho) · shiny / brillant. Vocabulaire réutilisé : ice, snow, blue, white, big, small, one…five, hello, cold, paw.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the ice cave!" (le tunnel de droite) ; [identify] "Is the ice cold? Yes!"
  - Maman : [count] "How many crystals? Touch them: one, two, three!" ; [observe] "Look at the icicles! Touch an icicle!".
  - Bébé fille : [locate] "Where is Baby Girl? In the cave!" ; [identify] "Touch the blue crystal!".
  - Bébé garçon : [tell] "Say hello to the cave. Hello!" (écho joué en son) ; [fetch] "Find the sun!" (rayons en haut à gauche).
- Intermédiaire :
  - Papa : [locate] "Is Daddy behind the crystal, next to the icicle, or in the cave?" (2.3) ; [talk] "What is Daddy doing? He is walking on the ice." (3.1).
  - Maman : [count + couleur] "Can you find two big crystals?" ; [compare] "Which crystal is bigger?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the crystals, under the icicles, or in the cave?" ; [observe] "Is the ice shiny or dull?" (3 choix).
  - Bébé garçon : [fetch] "Bring a small crystal to Mummy." ; [social] « Say: it is cold in the cave. » (1.7).
- Cohérence : un ours dans une grotte de glace est plausible (abri) ; aucune nourriture montrée ; ne pas montrer l'ours grimpant sur les stalactites ou les cristaux (le jeu ne l'autorise pas).
- Points d'attention : pas de neige au centre : l'ancre `snow` n'existe qu'en bas à gauche (x12-34, y84-100), assez petite ; pour les jeux « rouler dans la neige » il faut s'y poser (`stand` x30, y88). Cristaux proches des bords, visibles donc touchables. Sol très brillant : les zones se confondent ; se servir des cristaux comme points d'appui.

### Ours · décor 3 — The snowy plain / la plaine de neige
- Image : `Animaux/Antarctique/Ours/Image ChatGPT 20 nov. 2026, 09_50_16-3.png` · Statut : déjà dans le jeu sous `an_snowfield`.
- Ce qu'on voit : immense plaine de neige poudreuse avec dunes ondulées ; soleil jaune à gauche (x21-26, y6-14) ; gros nuages en haut à gauche et en haut à droite ; chaîne de montagnes enneigées au centre-droit (x45-80, y16-28) avec langue de glacier bleu (x48-78, y28-37) ; gros blocs de glace bleue enneigés en bas à gauche (x0-18, y60-92) et à droite (x80-100, y57-75) ; petits blocs au fond (x20-30, y36-44 ; x84-96, y35-46). Aucun animal, aucune trace.
- Histoire : un grand matin tout blanc. Les oursons découvrent une plaine sans fin et suivent de grosses traces de pattes pour retrouver Papa ; en chemin, on compare le près et le loin, on roule dans la neige, et la famille se retrouve près des blocs de glace bleue.
- Vocabulaire nouveau : plain / plaine (« snowy plain » ; mot facultatif) · hill / colline · footprints (déjà en jeu) · far / loin · near / près. Vocabulaire réutilisé : snow, ice, mountain, sun, cloud, white, blue, big, small, one…five, run, roll.
- Débutant :
  - Papa : [locate] "Where is Daddy? Find the big mountain!" ; [identify] "Touch the blue ice!".
  - Maman : [count] "How many footprints? Count!" (props empreintes, existant) ; [observe] "Is the snow white? Yes!".
  - Bébé fille : [fetch] "Find the sun!" ; [locate] "Where is Baby Girl? Next to the ice!" (près des blocs).
  - Bébé garçon : [tell] "Baby Boy runs! Touch the snow!" ; [identify] "Is the cloud big?" (gros nuage).
- Intermédiaire :
  - Papa : [locate] "Is Daddy near the mountain, near the ice, or near the hill?" ; [compare] "Whose footprints are bigger, Daddy's or the baby's?" (3.4).
  - Maman : [count + couleur] "Can you find two blue ice blocks?" ; [observe] "What is Mummy doing? She is rolling in the snow." (3.1).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the ice, under the cloud, or next to the hill?" ; [fetch] "Bring me the small blue ice."
  - Bébé garçon : [compare] "Which mountain is far? Which one is near?" ; [talk] « Tell Mummy: the snow is cold. »
- Cohérence : plaine arctique crédible pour un ours ; l'ours court (can run), pagaie ; jamais de proie. Pas de poisson ici : le mot « fish » de la quête mangée reste hors de ce décor (pas de mer visible).
- Points d'attention : décor très vide : beaucoup de zones « neige » identiques ; il faut s'appuyer sur les blocs de glace (bas gauche, bas droite) et la montagne. Aucune mer visible : retirer « paddle / swim » des cartes ici (le jeu le fait déjà si l'ancre `sea` manque).

---

## Phoque (seal) — Antarctique (parent : phoque, ni phoque de Weddell ni phoque arctique précisé)
- Personnages : Papa Sam (paresseux, phoque gris tacheté), Maman Sally (joueuse, fleur d'hibiscus rose près de l'oreille), Bébé fille (nœud rose), Bébé garçon — mot du bébé : pup / bébé phoque. Phase 1 : pelage blanc duveteux, sans taches ; phases 2 à 4 : taches grises de plus en plus nettes.
- Jeu propre existant : `seal_whiskers` « The seal's whiskers » (observe) — moustaches, trouver des poissons, plonger, applaudir avec les nageoires, « A baby seal is a pup », trou pour respirer (expert), carte « Simon says ». Mots propres déjà en jeu : whiskers, flippers, dive, clap, pup, fish, sea, rest.
- Objectifs pédagogiques : 1.5 corps et actions (whiskers, flippers, clap, dive) ; 1.6 nourriture (fish seulement, jamais d'herbe ni de banane) ; 2.2 capacités (can swim, can't climb, can't fly) ; 1.7 météo et sensations (froid, soleil du soir, vent) ; 2.3 localisation (sur le rocher, dans l'eau, près des algues) ; 3.1 actions en cours (le phoque nage, dort, applaudit).
- Fil rouge des 3 décors : décor 1 = le soir polaire et l'aurore (glace, banquise, cacher sous l'arche, dormir) ; décor 2 = les rochers et la mare d'eau de mer (observer de près : étoile de mer, algues, vagues) ; décor 3 = la plage de sable au coucher du soleil (se reposer sur le sable, couleurs du ciel, galets à compter, fleurs).

### Phoque · décor 1 — Seal aurora bay / la baie de l'aurore
- Image : `Animaux/Antarctique/Phoque/Paysage arctique sous une aurore boréale-1.png` · Statut : NOUVEAU (proposer `an_seal_aurora`).
- Ce qu'on voit : grande grotte de glace avec glaçons pendants à gauche (x0-30, y0-45, ouverture sombre x4-17, y28-45) ; rochers bruns enneigés en bas à gauche (x0-22, y65-95) et en bas à droite (x85-100, y76-96) ; ciel bleu-violet avec aurore verte en haut (x42-85, y0-22) et nuages roses (x30-47, y12-20 ; x85-100, y3-17) ; mer bleue profonde au centre-droit (x40-100, y38-68) avec plaques de glace (x56-70, y41-47 ; x70-85, y50-56 ; x55-60, y58-63 ; x82-90, y50-56) ; falaises de glace au fond (x52-85, y29-42) ; montagne à droite (x70-100, y17-33) ; grande étendue de neige au premier plan ; blocs de glace à glaçons au milieu à gauche (x15-52, y55-73).
- Histoire : au crépuscule, l'aurore danse et Sally emmène les bébés phoques jusqu'au bord de l'eau. Sam, paresseux, se prélasse sur la banquise ; on compte les plaques de glace flottantes puis les bébés se glissent dans la grotte pour dormir au chaud.
- Vocabulaire nouveau : aurora / aurore · cave / grotte · floe / plaque de glace · night / nuit (facultatif). Vocabulaire réutilisé : ice, sea, snow, rock, mountain, cloud, blue, green, pink, whiskers, flippers, dive, pup.
- Débutant :
  - Papa : [locate] "Where is Daddy? On the snow!" ; [observe] "Daddy is lazy. Is Daddy sleeping?" (oui / non).
  - Maman : [count] "How many ice floes? One, two, three!" ; [identify] "Touch the green light in the sky!" (aurore).
  - Bébé fille : [locate] "Where is Baby Girl? In the cave!" ; [observe] "Clap your flippers! Clap, clap!" (existant).
  - Bébé garçon : [identify] "Touch the pink cloud!" ; [tell] "Dive! Touch the sea!" (existant).
- Intermédiaire :
  - Papa : [locate] "Is Daddy next to the rock, near the cave, or on the ice?" ; [talk] "What is Daddy doing? He is resting." (3.1).
  - Maman : [count + couleur] "Can you find two white ice floes?" ; [compare] "Which floe is bigger?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? In the cave, behind the rock, or under the cloud?" ; [fetch] "Bring me a fish" (un props poisson déjà existant) uniquement si un poisson de jeu existe.
  - Bébé garçon : [observe] "Is the sea warm or cold?" ; [social] « Say good night to the aurora. » (1.1 révisé).
- Cohérence : le phoque nage et se repose sur la glace ; ne grimpe pas dans la grotte (cannot climb) : il glisse jusqu'à l'ouverture, qui est de plain-pied ; aucune prédation.
- Points d'attention : même composition que le décor 3 du manchot (`Pingoin/Paysage polaire en 3D cartoon virtuel.png`) : grotte à gauche + banquise + glacier à droite, seule la lumière change (aurore et rose contre ciel bleu). L'histoire doit insister sur le soir et l'aurore pour les distinguer. La mer est entourée de glace sans zone d'accès : ancre « sea » à tracer avec soin.

### Phoque · décor 2 — The rocky shore / le rivage de rochers
- Image : `Animaux/Antarctique/Phoque/Littoral subarctique entre rochers et glaciers-2.png` · Statut : NOUVEAU (proposer `an_seal_rocks`).
- Ce qu'on voit : gros rochers gris, avec mousse verte, qui occupent la moitié gauche et le premier plan (x0-60, y20-100) ; paquets d'algues dorées (kelp) sur les rochers (x5-38, y47-67 et x68-100, y71-92) ; étoile de mer rouge-orangée en bas à gauche (x14-20, y82-88 ; petite : hit x13, y81, w10, h9) ; groupe de bernacles blanches (x37-43, y63-68, très petit) ; mare d'eau claire et pierres au premier plan (x25-60, y73-95) ; vagues qui éclaboussent au centre (x55-65, y37-47) ; mer turquoise et petits rochers dans l'eau à droite (x76-97, y34-62) ; neige sur les rochers en haut à gauche (x0-25, y0-30) ; au loin, montagnes enneigées et icebergs (x56-100, y18-33).
- Histoire : à marée basse, Sally montre aux bébés la mare entre les rochers. Les phoques s'y glissent, regardent l'étoile de mer et les algues, sentent les vagues, puis Sam retrouve ses bébés couchés sur un grand rocher, le museau au soleil.
- Vocabulaire nouveau : starfish / étoile de mer · seaweed / algue · wave / vague · pebble / galet (déjà employé en 3 décors) · rock pool / mare. Vocabulaire réutilisé : rock, sea, sun, cloud, mountain, iceberg, green, red, orange, blue, one…five, whiskers, flippers, dive.
- Débutant :
  - Papa : [locate] "Where is Daddy? On the big rock!" ; [identify] "Is the seaweed green? No! It is brown!" (couleur 1.2 : réponse « brown/gold » à valider, sinon rester sur « Is the starfish red ? »).
  - Maman : [identify] "Touch the red starfish!" ; [count] "How many rocks in the sea? One, two!".
  - Bébé fille : [observe] "Look! A wave! Touch the wave!" ; [locate] "Where is Baby Girl? Near the starfish!"
  - Bébé garçon : [tell] "Wiggle your whiskers! Wiggle, wiggle!" ; [fetch] "Find the sun!" ou « Find the cloud! ».
- Intermédiaire :
  - Papa : [locate] "Is Daddy on the rock, next to the seaweed, or in the water?" ; [talk] "What is Daddy doing? He is resting on the rock." (3.1).
  - Maman : [count + couleur] "Can you find one red starfish and two pebbles?" ; [compare] "Which rock is bigger?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the seaweed, under the rock, or next to the wave?" ; [fetch] "Bring me a small pebble."
  - Bébé garçon : [observe] "Is the water cold? Is the seaweed wet?" (1.7, wet/dry 2.7) ; [social] « Say hello to the starfish. » (1.1).
- Cohérence : le phoque mange du poisson ; ici on ne montre ni étoile de mer ni algue mangée : aucune de ces deux n'est dans `foods` (`fish`, `krill`). Il ne grimpe pas sur les rochers : il s'y hisse en glissant sur les rochers plats du bas (à signaler : ne pas montrer d'escalade du rocher de gauche).
- Points d'attention : décor hors-glace, rocheux et herbeux : littoral subarctique, pas Antarctique stricto sensu (le dossier est « Antarctique », le parent a choisi). Petites zones : étoile de mer et bernacles trop petites pour un doigt d'enfant tel quel : agrandir la zone de contact (voir ci-dessus). Trop de rochers semblables : rattacher les mots à des couleurs / formes (rocher gris, algue dorée, étoile rouge). L'image n'a aucune glace au premier plan : le jeu `seal_whiskers` actuel demande une ancre `snow` à pose possible : ne marchera pas ici sans adaptation (voir Anomalies).

### Phoque · décor 3 — The sunset beach / la plage au coucher du soleil
- Image : `Animaux/Antarctique/Phoque/Crique nordique au coucher du soleil-3.png` · Statut : NOUVEAU (proposer `an_seal_sunset`).
- Ce qu'on voit : large plage de sable doré au premier plan et au centre (x20-80, y60-100) ; mer turquoise avec vagues blanches qui viennent mourir sur le sable (x35-100, y38-70) ; soleil bas à droite (x84-88, y31-36 ; hit x80, y27, w12, h14) avec reflet orange sur l'eau ; ciel orange et rose avec nuages (x15-45, y0-18 ; x45-80, y17-27 ; x85-100, y10-30) ; petite île rocheuse à l'horizon (x49-68, y33-38) ; grosses roches grises à gauche (x0-30, y15-60) et en bas à droite (x83-100, y60-96) ; hautes herbes et épis à gauche (x0-22, y0-100) ; fleurs roses en bas de la touffe de gauche (x0-6, y42-52, petites) ; galets (x40-55, y85-100) et algues au bord de l'eau (x40-55, y76-80 ; x73-88, y78-85).
- Histoire : le soleil se couche. Sally et Sam ont fini la pêche, ils se reposent sur le sable tiède avec leurs bébés. Les petits regardent les couleurs du ciel (orange, rose, bleu), comptent les galets au bord de l'eau, puis s'endorment l'un contre l'autre.
- Vocabulaire nouveau : sand / sable · beach / plage · sunset / coucher de soleil · grass / herbe (mot d'une autre espèce, ici juste décor ; ne pas mélanger avec la nourriture) · orange. Vocabulaire réutilisé : sea, sun, cloud, rock, pebble, pink, blue, one…five, rest, wave.
- Débutant :
  - Papa : [locate] "Where is Daddy? On the sand!" ; [identify] "Is Daddy sleeping? Yes!" (lui, paresseux).
  - Maman : [identify] "Touch the orange sun!" ; [count] "How many pebbles? One, two, three!".
  - Bébé fille : [identify] "Touch the pink cloud!" ; [observe] "Clap, clap! Look at the waves!".
  - Bébé garçon : [locate] "Where is Baby Boy? Near the rock!" ; [tell] "Dive! Touch the sea!"
- Intermédiaire :
  - Papa : [locate] "Is Daddy on the sand, next to the rock, or near the water?" ; [talk] "What is Daddy doing? He is sleeping on the sand." (3.1).
  - Maman : [count + couleur] "Can you find three grey pebbles?" ; [compare] "Which rock is bigger, the left one or the right one?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the grass, next to the rock, or under the cloud?" ; [fetch] "Bring me a small grey pebble."
  - Bébé garçon : [observe] "Is the sun low or high?" ; [social] « Say: good night, sun! » (1.1 / 3.3).
- Cohérence : phoque sur le sable, autorisé (se repose sur le rivage) ; ne pas lui faire cueillir les fleurs ni manger l'herbe ; ne pas lui faire gravir les rochers (cannot climb).
- Points d'attention : paysage tempéré, chaud (sable, herbes, fleurs, aucun glaçon) : aucune neige ni glace, aucun mot « cold » à employer ; météo à passer de `cold` à `mild` ou `sunny`. Zones petites : fleurs roses et soleil (agrandir la zone de contact), galets : plusieurs petits (choisir 3 gros). Soleil bas : bon moment pour le mot « sunset ».

---

## Manchot (penguin) — Antarctique (dossier « Pingoin »)
- Personnages : Papa Pip (drôle ; lunettes d'aviateur sur le front et écharpe bleue), Maman Penny (attentive ; fleur d'hibiscus rose), Bébé fille (nœud rose ; écharpe rose en phase 3 seulement), Bébé garçon — mot du bébé : chick / poussin. Phase 1 : poussin gris duveteux assis ; phases 2-4 : plumage noir et blanc.
- Jeu propre existant : `penguin_waddle` « Waddle and slide! » (tell) — se dandiner, nageoires, glisser sur le ventre, nid de cailloux (pebbles) et œuf (intermédiaire / expert), se serrer contre le froid (expert) ; « Fly! » (carte piège : « Penguins can't fly »). Mots propres déjà en jeu : waddle, flippers, belly, slide, pebble, nest, egg, huddle, chick.
- Objectifs pédagogiques : 1.5 corps et actions (flippers, feet, beak) ; 1.3 nombres (cailloux du nid, poissons) ; 2.2 capacités (can swim, can hop, can't fly — la blague des lunettes de Papa) ; 1.7 sensations (cold, windy) ; 3.2 directions (left, right, follow, cross la glace) ; 3.1 actions en cours (is waddling, is sliding).
- Fil rouge des 3 décors : décor 1 = le lagon au pied du mur de glace (sauter d'une plaque à l'autre, pêche, jeu de glisse) ; décor 2 = la soirée sur la glace (aurore, couleurs du ciel, patiner et glisser sur le lac gelé, retrouver sa famille) ; décor 3 = la grotte et les rochers (abri contre le vent, nid de galets, se serrer pour avoir chaud).

### Manchot · décor 1 — The glacier lagoon / le lagon du glacier
- Image : `Animaux/Antarctique/Pingoin/Image ChatGPT 20 nov. 2026, 09_50_19-4.png` · Statut : déjà dans le jeu sous `open_sea` (nameEn « the cold sea »).
- Ce qu'on voit : immense mur de glacier bleu clair avec hautes parois verticales, au centre et à droite (x35-100, y0-52) ; lagon turquoise au milieu (x20-85, y52-72) ; grandes plaques de glace plates : au centre-droit (x65-82, y62-74), à gauche (x18-37, y62-72), à droite (x85-100, y60-70), petites au milieu ; soleil en haut à gauche (x14-20, y2-10) avec nuages (x22-40, y12-22) ; montagnes lointaines à gauche (x6-28, y25-38) ; rochers bruns à gauche (x0-18, y55-78) et bas à gauche (x6-20, y86-98) ; rochers à droite (x78-95, y69-82) ; grand plateau de neige au premier plan (x10-85, y76-95).
- Histoire : Pip et Penny arrivent au lagon par une belle journée et se mettent en file pour sauter de plaque en plaque. Les poussins se dandinent derrière eux, comptent les plaques, glissent sur le ventre dans la neige, puis la famille regarde le grand mur de glace.
- Vocabulaire nouveau : glacier · ice floe / plaque de glace · wall (non retenu) · slide (déjà) · fish (le poisson de la pêche). Vocabulaire réutilisé : ice, snow, sea, rock, sun, cloud, blue, white, brown, one…five, waddle, flippers, swim, belly.
- Débutant :
  - Papa : [locate] "Where is Daddy? On the ice!" ; [tell] "Daddy has goggles! Can penguins fly? No!" (carte piège existante).
  - Maman : [count] "How many ice floes? One, two, three!" ; [identify] "Touch the blue glacier!".
  - Bébé fille : [observe] "Waddle, waddle! Left, right!" (existant) ; [locate] "Where is Baby Girl? Next to the rock!"
  - Bébé garçon : [tell] "Slide on your belly! Touch the snow!" (existant) ; [identify] "Touch the sun!"
- Intermédiaire :
  - Papa : [locate] "Is Daddy on the ice floe, next to the rock, or in the sea?" ; [talk] "What is Daddy doing? He is hopping." (3.1, can hop).
  - Maman : [count + couleur] "Can you find two big white floes?" ; [compare] "Which floe is bigger?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the rock, near the glacier, or under the cloud?" ; [fetch] "Bring me the brown rock."
  - Bébé garçon : [observe] "Is the glacier tall or small?" ; [social] « Say to Daddy: let's swim! » (2.2).
- Cohérence : le manchot nage, saute (hop) mais ne vole ni ne grimpe : ne pas lui faire gravir le glacier ; il mange poisson et krill ; aucune prédation visible.
- Points d'attention : très proche de `ice_coast` de l'ours (glacier, lagon, rochers) ; différence visuelle = le mur de glace énorme plein cadre et les grandes plaques plates. Zone « sea » et « ice » : le lagon est bordé de plaques, ce qui aide pour « hop on the floe ». Les ancres actuelles `cliff`, `block`, `ledge` sont adaptées à ce décor.

### Manchot · décor 2 — The evening ice / la glace du soir
- Image : `Animaux/Antarctique/Pingoin/Image ChatGPT 20 nov. 2026, 09_50_21-5.png` · Statut : déjà dans le jeu sous `an_aurora` (nameEn « the evening ice »).
- Ce qu'on voit : arche de glace bleue lumineuse à gauche (x0-32, y22-52) ; soleil couchant au fond (x34-36, y41-44, petit) ; aurore verte et violette en haut au centre-droit (x52-88, y0-25) ; nuages roses ; falaises et pics de glace à droite (x64-100, y20-50) ; lac gelé violet-bleu avec fissures lumineuses au centre (x20-65, y55-85) ; plaques de glace enneigées (x52-70, y56-63 ; x18-28, y74-82 ; x65-73, y73-77) ; dunes de neige scintillante au premier plan, à droite et à gauche (x0-35, y60-95 ; x62-100, y62-100).
- Histoire : le soir tombe, le ciel devient rose et violet, l'aurore apparaît. Pip et Penny emmènent les poussins glisser sur le lac gelé en suivant les fissures lumineuses, puis ils passent sous l'arche pour rentrer.
- Vocabulaire nouveau : arch / arche · crack / fissure · sunset / coucher du soleil · aurora · purple / violet · evening (soir). Vocabulaire réutilisé : ice, snow, sea, sun, cloud, iceberg, pink, blue, one…five, slide, waddle.
- Débutant :
  - Papa : [locate] "Where is Daddy? Under the arch!" ; [identify] "Touch the pink cloud!".
  - Maman : [count] "How many cracks? One, two!" ; [identify] "Touch the green light!".
  - Bébé fille : [observe] "Slide on the ice! Wheee!" ; [locate] "Where is Baby Girl? Near the ice floe!"
  - Bébé garçon : [identify] "Is the sun big? No, it is small!" (petit au fond) ; [tell] "Waddle, waddle!" 
- Intermédiaire :
  - Papa : [locate] "Is Daddy under the arch, next to the iceberg, or on the ice?" ; [talk] "What is Daddy doing? He is sliding." (3.1).
  - Maman : [count + couleur] "Can you find three pink clouds?" (nuages roses) ; [compare] "Which iceberg is taller?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? Behind the iceberg, under the arch, or next to the snow?" ; [fetch] "Bring me a small purple stone" (non : pas de pierre violette visible : utiliser « the small ice floe »).
  - Bébé garçon : [observe] "Is it day or night?" (3 choix : morning, evening, night) ; [social] « Say good evening to Mummy. » (1.1).
- Cohérence : un manchot sur un lac gelé est plausible ; il ne vole pas, ne grimpe ni l'arche ni les pics ; pas de nourriture montrée.
- Points d'attention : sol brillant, texture sans repères : s'appuyer sur l'arche, l'aurore, les plaques. Ce décor est celui où le mot « evening » se prête le mieux (3.3). Image très colorée mais lisible pour un enfant.

### Manchot · décor 3 — The ice-cave rocks / la grotte aux rochers
- Image : `Animaux/Antarctique/Pingoin/Paysage polaire en 3D cartoon virtuel.png` · Statut : NOUVEAU (proposer `an_penguin_cave`).
- Ce qu'on voit : grosse arche de rochers bruns enneigés à gauche (x0-40, y0-58) avec une entrée de grotte sombre et des glaçons pendants (entrée x11-32, y28-55 ; glaçons x15-32, y22-40) ; mer bleue (x40-85, y45-67) avec plaques de glace (x58-72, y60-65 ; x65-80, y45-48 ; x78-100, y50-58 grande) ; mur de glacier au fond (x55-100, y30-45) ; montagnes enneigées (x70-100, y12-30) ; nuages (x21-47, y1-12 ; x64-75, y20-26 ; x88-100, y0-10) ; très grande étendue de neige au premier plan (x10-80, y60-100) avec empreintes discrètes (x20-40, y56-60 ; x56-70, y74-80) ; rochers enneigés à droite (x82-100, y70-90 ; x72-80, y76-83) et en bas à gauche (x0-25, y68-95).
- Histoire : un vent glacé se lève. Penny conduit les poussins vers l'entrée de la grotte pour s'abriter ; Pip ramasse des galets pour un nid devant l'entrée, et toute la famille se serre pour avoir chaud en regardant les glaçons.
- Vocabulaire nouveau : cave / grotte · icicle / glaçon pendant · nest / nid (déjà en jeu) · huddle (déjà en jeu) · windy (venteux). Vocabulaire réutilisé : snow, ice, sea, rock, sun, cloud, mountain, pebble, white, brown, blue, one…five, cold, waddle, flippers.
- Débutant :
  - Papa : [locate] "Where is Daddy? In the cave!" ; [identify] "Is the ice cold? Yes!" 
  - Maman : [identify] "Touch the brown rock!" ; [count] "How many pebbles?" (props pebbles, existant, sur les spots de neige).
  - Bébé fille : [locate] "Where is Baby Girl? Next to the rock!" ; [observe] "Brrr! Is it cold?" (1.7).
  - Bébé garçon : [tell] "Waddle, waddle!" ; [identify] "Touch the icicle!" (zone petite, voir ci-dessous).
- Intermédiaire :
  - Papa : [locate] "Is Daddy in the cave, behind the rock, or next to the sea?" ; [talk] "What is Daddy doing? He is looking at the sea." (3.1).
  - Maman : [count + couleur] "Can you find two brown rocks?" ; [compare] "Which ice floe is bigger?" (3.4).
  - Bébé fille : [locate] "Where is the baby hiding? In the cave, behind the rocks, or under the icicles?" ; [fetch] "Bring three pebbles to the nest." (existant, count = 3).
  - Bébé garçon : [observe] "Is the wind cold or hot?" ; [social] « Say to Mummy: I am cold. Let's huddle! » (1.7 / expert existant).
- Cohérence : les manchots empereurs ne nichent pas dans une grotte, mais l'abri contre le vent est plausible ; le nid de galets (esp. Adélie) est déjà dans le jeu ; ne pas montrer de poissons capturés ni de prédateur ; pas de vol, pas d'escalade des rochers.
- Points d'attention : ressemble au décor 1 du phoque (`Phoque/Paysage arctique sous une aurore boréale-1.png`) : même grotte à gauche + banquise + glacier à droite ; ici ciel bleu de jour, rochers bruns et sans aurore. La grotte est le thème commun des deux : utiliser pour le manchot « abri contre le vent, galets, huddle ». Les glaçons sont une zone petite (hit x15, y22, w17, h18 conseillé).

---

## Anomalies — Antarctique

1. `src/content/species.ts` lignes 47-49 : chevauchement des décors. Ours : `allowedBiomes` = ice_coast, an_ice_cave, an_snowfield, open_sea, an_aurora ; manchot : les mêmes cinq ; phoque : ice_coast, open_sea, an_aurora. Conséquence : un même décor (par exemple `ice_coast`) est proposé aux trois familles ; ce n'est pas ce qui est voulu. À faire : ours = [ice_coast, an_ice_cave, an_snowfield] ; manchot = [open_sea, an_aurora, an_penguin_cave] ; phoque = [an_seal_aurora, an_seal_rocks, an_seal_sunset].
2. Quatre décors à créer (fichiers images déposés mais pas encore intégrés) : `Phoque/Paysage arctique sous une aurore boréale-1.png`, `Phoque/Littoral subarctique entre rochers et glaciers-2.png`, `Phoque/Crique nordique au coucher du soleil-3.png`, `Pingoin/Paysage polaire en 3D cartoon virtuel.png`. Il manque, pour chacun : une entrée dans `src/content/places/antarctica.json` (anchors, spots, groundY, weather), un fond dans `public/assets/backgrounds/` (celles qui existent : `ice_coast.webp`, `an_ice_cave.webp`, `an_snowfield.webp`, `open_sea.webp`, `an_aurora.webp`) et l'entrée `assetManifest.json`, plus une ligne dans `PHOTO_SUBJECTS` (`src/content/activities/africa.ts` ~lignes 504-508) et dans `allowedBiomes` des archétypes concernés (ex. `snowflakes` dans `archetypes.ts` ligne 52 liste an_snowfield, ice_coast, an_aurora, open_sea).
3. Décors du phoque 2 et 3 sans neige ni glace : le jeu `seal_whiskers` (`species/antarctica.ts`, `choices`) exige l'ancre `sea` ET `snowOf(c)` (ancre d'id `snow` avec `stand`). Sur `an_seal_rocks` et `an_seal_sunset` il n'y a pas de neige : le jeu propre du phoque ne serait pas proposé. À faire : généraliser `snowOf` en « zone de repos » (sable, rocher plat, neige) ou donner à ces décors une ancre `snow` renommée / alias ; adapter le texte (« rest on the sand ») ; idem pour `polar_bear_fur` et `penguin_waddle` si on les ouvrait ailleurs. Les textes du jeu actuel (« Rest on the ice! », « Let's rest on the snow! ») sont inadaptés à une plage ; le mot « snow » ne doit pas y apparaître.
4. Ancre de décor à enrichir pour la cohérence : `an_ice_cave` n'a qu'une petite zone `snow` (x12-34, y84-100) ; les jeux de neige (rouler, glisser) y sont donc cantonnés à un coin.
5. Aventures `src/content/adventures/antarctica.ts` : `start: 'open_sea'` pour `fish_feast` et `white_feather` (lignes 174-175) et `go('ice_coast', …)` (ligne 131) sont écrites pour les trois espèces (`species: ['penguin','seal','polar_bear']`). Une fois les décors répartis par famille, le phoque et l'ours n'auront plus `open_sea` : ces aventures ne démarreront plus pour eux. À faire : un point de départ par famille ou un décor choisi parmi ceux de la famille.
6. `species.ts` ligne 48 : phoque `mobility: 'swim'` ; vérifié, ce champ ne sert qu'à `canFly` (`game/staging.ts` ligne 20 ; `ui/Habitat.tsx` ligne 602), donc il n'empêche pas de marcher. En revanche `can: ['swim']` et `cannot: ['fly','climb']` : les cartes « Hop » et « Run » ne peuvent être proposées au phoque que comme pièges ; n'utiliser que « wriggle / slide / clap / dive / rest » dans les histoires. Les ancres tag `climb` (iceberg, ice, glacier…) ne doivent pas être des cibles d'escalade pour le phoque ni le manchot (`cannot: climb`).
7. Personnages : vérifié dans `src/content/assetManifest.json` et dans `public/assets/characters/` : `polar_bear`, `seal`, `penguin` ont chacun `_father`, `_mother`, `_girl_newborn|little|young|companion`, `_boy_newborn|little|young|companion` (10 fichiers .webp par famille, 30 au total). Rien ne manque. Le dossier source du phoque contient bien `Phoque/phoque/bebe_garcon_stade_1.png` (10 fichiers, comme les autres familles) : l'affirmation du brief est inexacte.
8. Planche du manchot : l'écharpe rose apparaît sur la phase 3 de la fille seulement (la phase 3 du garçon n'en a pas) ; Papa porte des lunettes d'aviateur sur le front : à exploiter (carte « Fly! » avec réponse piège « Penguins can't fly »), jamais comme équipement de vol. Mineur.
9. Ressemblances à connaître : (a) `Phoque/Paysage arctique sous une aurore boréale-1.png` et `Pingoin/Paysage polaire en 3D cartoon virtuel.png` : même composition (grotte glacée à gauche, banquise, glacier à droite) ; (b) `Ours/…09_50_12-1.png` (ice_coast) et `Pingoin/…09_50_19-4.png` (open_sea) : même type de lagon avec glacier et rochers, mais le mur de glace est beaucoup plus grand côté manchot ; (c) `Ours/…09_50_14-2.png` (grotte) et `Pingoin/…09_50_21-5.png` (lac gelé fissuré) : même sol de glace fissuré, mais intérieur / extérieur. Conséquence : il faut des histoires clairement différentes.
10. Décors du phoque 2 et 3 : paysage tempéré / subarctique (herbes, algues, fleurs roses, sable doré, aucune glace) rangé dans « Antarctique ». À conserver (voulu par le parent), mais `weather: 'cold'` y serait faux : prévoir `mild` ou `sunny` et éviter les mots « cold » / « snow » dans ces parcours.
11. Zones trop petites pour un doigt d'enfant (à agrandir côté `hit`) : étoile de mer et bernacles (`an_seal_rocks`), fleurs roses et soleil (`an_seal_sunset`), glaçons de l'entrée (`an_penguin_cave`), soleil couchant du manchot (`an_aurora`, déjà x33, y39, w6, h6 dans le JSON actuel).
12. Les `source` des décors existants dans `places/antarctica.json` pointent vers `Continant/Antartic/…` alors que les images sont maintenant dans `Animaux/Antarctique/Ours|Pingoin/` ; sans conséquence sur le jeu, mais à aligner pour le suivi de provenance.
13. Résolution : les 9 décors et les 3 planches font au moins 1536 × 1024 (décors 1672 × 941 ou 940) : aucune image trop petite ni floue ; fonds de personnages sur vert chroma (planches) donc non utilisables comme décors.


---

# Cartographie des parcours — EUROPE (renard, hibou, hérisson)

Rédigé le 2026-11-23. Lecture seule sur le dépôt. Positions en % de l'image (1672×941) : gauche→droite (x), haut→bas (y). Les 9 images ont la même taille 1672×941, les 3 planches 1536×1024.

Rappels de code utiles (vérifiés) :
- `species.ts` : fox (foods `berries`, `worm` ; notFoods bamboo, grass ; can run/jump/dig ; cannot fly ; Felix « clever », Fiona « kind » ; bébé « cub » / renardeau) ; owl (diet `carnivore`, foods `['bug']`, can fly ; cannot swim/run ; Oscar « wise », Olive « calm » ; « owlet » / petit hibou) ; hedgehog (diet insectivore, foods bug+worm ; notFoods fish, bamboo ; can run ; cannot fly/jump ; Hugo « shy », Hazel « funny » ; « hoglet » / bébé hérisson).
- `allowedBiomes` actuels : fox = forest, farm, alps, lake ; owl = forest, lake, farm ; hedgehog = forest, farm, coast. Les trois listes devront être remplacées par les 3 nouveaux ids de chaque famille.
- `dryLand(place)` (europe.ts) exige `spots` : fox ≥ 3, owl ≥ 4, hedgehog ≥ 5 emplacements secs hors ancres tag `water`/`sea`. Chaque nouveau décor devra donc fournir au moins 6 `spots` au sec (sinon le jeu propre disparaît silencieusement : `choices` renvoie `[]`).
- Mécaniques existantes utilisées ci-dessous : identify, count, guide, compare, observe, puzzle, plan, build (champ `mechanic` de `archetypes.ts`). Au débutant : 2 choix ; à l'intermédiaire : 3 choix.

---

## Renard (fox) — Europe
- Personnages : Papa Felix (malin), Maman Fiona (gentille, fleur rose), Bébé fille (nœud rose), Bébé garçon (sans nœud) ; mot du bébé : cub (renardeau). Planche : `Animaux/Europe/Renards/Famille renard _ étapes de croissance.png` (fond vert, 10 poses propres) ; dossier `Renards/renard/` : papa, maman, 4 stades fille, 4 stades garçon.
- Jeu propre existant : `fox_tricks` « Fox tricks! » (mécanique plan, `europe.ts`) — cri « Yip, yip! », queue touffue, grandes oreilles, cartes de tours (Leap/Dig/Run/Wag), flair des baies (berries), tanière (den) ; « Can a fox fly? » en expert. Mots propres déjà en jeu : fox, yip, bushy tail, big ears, leap, dig, sniff, berries, grass, den, nest. NB : le jeu cherche une ancre `den` dans le décor (`anchor(place,'den')`) sinon pose un accessoire ; avec les 3 nouveaux décors, les trois ont un vrai trou/tanière dessiné : l'ancre `den` doit exister dans chaque `places` JSON (sinon l'accessoire flottant est utilisé alors que l'image montre déjà une tanière).
- Objectifs pédagogiques de la famille : 1.5 (verbes d'action : leap, dig, run, sniff — le renard fait exactement ça), 2.2 (corps / parties de l'animal : ears, tail, paws), 1.3 (compter baies / empreintes / pommes de pin), 1.2 (couleurs : roux, blanc, rouge des baies), 2.3 (milieu : tanière, forêt, saison) ; positions (3.x) au niveau intermédiaire : « in / near / next to the den ».
- Fil rouge des 3 décors : (1) la clairière au coucher de soleil = « rentrer à la tanière avant la nuit » (soir, tanière dans une souche) ; (2) le sous-bois d'automne = « préparer le lit de paille de la tanière et suivre le ruisseau » (feuilles, champignons, pommes de pin) ; (3) la forêt enneigée = « suivre les traces dans la neige jusqu'à la tanière » (empreintes, baies rouges, froid).

### Renard · décor 1 — The sunset glade / la clairière du soir
- Image : `Animaux/Europe/Renards/01_Clairiere_et_terrier.png` · Statut : NOUVEAU → proposer `europe_fox_glade`
- Ce qu'on voit : à gauche, deux bouleaux blancs au tronc écorcé (x 0-24 %, toute la hauteur) avec feuillage vert-jaune en haut ; entrée de tanière dans une souche moussue creuse, à droite sous un grand pin (zone tanière x 80-98 %, y 52-70 %, assez grande) ; gros rochers moussus en avant à gauche (x 2-25 %, y 72-95 %) et au fond (x 20-36 %, y 47-58 %) ; petits cailloux dispersés dans l'herbe ; lupins violets près de la tanière (x 76-82 %, y 50-63 %) ; baies rouges à gauche sur un buisson (x 0-8 %, y 45-62 %) ; marguerites blanches (partout, petites) ; fougères en bas à gauche ; grande pelouse centrale et chemin de terre en bas (x 40-65 %, y 85-100 %) ; au fond sapins, montagne à neige (x 40-58 %, y 25-33 %), soleil couchant (x 66-70 %, y 28-33 %, petit), nuages roses.
- Histoire : le soleil se couche et le renardeau n'est pas encore rentré. La famille traverse la clairière pour rejoindre la tanière dans la souche, en comptant les cailloux et en cherchant des baies pour le dîner.
- Vocabulaire nouveau : birch (le bouleau) · sunset (le coucher de soleil) · log / stump (la souche) · daisy (la marguerite) · fern (la fougère). Vocabulaire réutilisé : den, tree, rock, mountain, flower, berries, red, white, green, yip, bushy tail.
- Débutant :
  - Papa : [identify] "Find the den!" (Trouve la tanière !) ; "Touch the big rock!" (Touche le gros rocher !)
  - Maman : [identify] "Touch the red berries!" (Touche les baies rouges !)
  - Bébé fille : [count] "How many rocks?" (Combien de rochers ? — 2 grands au premier plan à gauche) — dès « little »
  - Bébé garçon : [identify] "Where is the sun?" (Où est le soleil ?) — touche le petit disque au fond
- Intermédiaire :
  - Papa : [guide] "Follow Daddy to the den! Is it near the pine tree?" (position near ; 3 réponses : pine tree / birch / mountain)
  - Maman : [identify] "Can you find two white trees?" (couleur + objet + quantité : les 2 bouleaux)
  - Bébé fille : [observe] "What is the baby doing?" (verbes : dig / leap / sniff) — après « little »
  - Bébé garçon : [compare] "Which rock is bigger?" (gros rocher au premier plan vs rocher du fond)
- Cohérence : les renards vivent en tanière et mangent des baies ; aucune proie ; rien dans l'eau (pas d'eau dans l'image). Les baies rouges sont un vrai buisson visible à gauche.
- Points d'attention : le soleil est petit (zone de touche à agrandir artificiellement, x 64-72 %). Fond de lumière jaune très saturé : les marguerites blanches sont minuscules, ne pas en faire des cibles seules. La tanière est collée au bord droit, là où la famille se tient en bas à droite (`dryLand` range déjà la gauche d'abord : placer les accessoires à gauche/centre).

### Renard · décor 2 — The autumn den / la tanière d'automne
- Image : `Animaux/Europe/Renards/02_Sous_bois_automnal.png` · Statut : NOUVEAU → `europe_fox_autumn`
- Ce qu'on voit : à gauche un énorme tronc dont les racines forment une tanière en tunnel (x 22-40 %, y 40-70 %), avec un lit de paille doré bien visible à l'entrée (x 22-39 %, y 58-70 %) ; deux champignons rouges à pois blancs (x 14-22 %, y 66-77 %) ; fougères à gauche (x 0-17 %, y 48-82 %) ; gros rochers moussus au centre (x 49-70 %, y 53-75 %) et en bas (x 20-35 %, y 73-92 %) ; ruisseau à droite avec petite cascade (x 72-100 %, y 48-68 %) ; deux pommes de pin au sol (x 71-80 %, y 78-87 %) ; grandes feuilles d'érable rouges/orange en bas à gauche (x 0-25 %, y 83-100 %) et éparpillées ; chemin de terre rouge au centre (x 30-75 %, y 70-100 %) ; arbres en contre-jour avec rayons de soleil, haut droit.
- Histoire : l'automne arrive. La famille ramasse des feuilles, des pommes de pin et de la paille pour rendre la tanière douillette avant l'hiver, et le renardeau découvre la cascade du ruisseau à distance (il ne s'y baigne pas).
- Vocabulaire nouveau : pine cone (la pomme de pin) · straw / bed (la paille, le lit) · stream (le ruisseau) · maple leaf (la feuille d'érable) · cosy (douillet). Vocabulaire réutilisé : den, mushroom, leaf, rock, red, orange, count 1-5, fox words (dig, sniff).
- Débutant :
  - Papa : [identify] "Touch the den!" (Touche la tanière !)
  - Maman : [count] "How many pine cones?" (2) — pommes de pin visibles en bas à droite
  - Bébé fille : [identify] "Touch the red mushroom!" (Touche le champignon rouge !) — 2 champignons, même couleur, donc seule la couleur différencie des rochers
  - Bébé garçon : [identify] "Touch the orange leaf!" (Touche la feuille orange !) — grandes feuilles bas gauche
- Intermédiaire :
  - Papa : [identify] "What is in the den? Is it straw, a rock or a fish?" (paille ; poisson = absurde volontaire, nourriture déjà exclue)
  - Maman : [guide] "Find something next to the red mushrooms!" (next to : la fougère / le rocher / le tronc)
  - Bébé fille : [compare] "Which one is bigger, the pine cone or the rock?" — dès « little »
  - Bébé garçon : [count] "Can you find two orange leaves?" (couleur + quantité)
- Cohérence : tanière de renard (réaliste) ; ne jamais mettre « Fox eats the mushroom » (champignon non nourriture, pas dans `foods`) ; ruisseau = décor, accessoires de jeu hors de l'eau.
- Points d'attention : TRÈS proche du décor hérisson `Herissons/Clairière enchantée au ruisseau scintillant.png` (même composition : tanière sous racines à gauche, champignons rouges, ruisseau avec cascade à droite) : voir Anomalies. Le ruisseau (x 72-100 %) est en haut droite : zone 'water' à déclarer pour que `dryLand` l'évite. Le tronc/tunnel est la zone la plus grande et la plus facile à toucher.

### Renard · décor 3 — The snowy forest / la forêt enneigée
- Image : `Animaux/Europe/Renards/03_Foret_enneigee.png` · Statut : NOUVEAU → `europe_fox_snow`
- Ce qu'on voit : grand chêne à feuilles orange à gauche (tronc x 0-25 %, y 0-65 %, branche qui passe au-dessus) ; entrée de tanière en pierres sous un monticule enneigé, à droite (x 70-88 %, y 45-58 %, entrée sombre x 77-84 %, y 49-56 %) ; une piste d'empreintes de pattes qui monte du bas centre vers la tanière (de x 50 %,y 98 % à x 78 %,y 60 %) : 8 à 10 empreintes nettement visibles ; baies rouges sur branches enneigées à gauche (x 0-20 %, y 57-93 %) et à droite (x 85-100 %, y 50-83 %) ; buisson orange (x 55-66 %, y 40-56 %) ; ruisseau et petite chute au centre gauche (x 33-48 %, y 53-63 %, l'eau est mince) ; deux bouleaux blancs (x 80-98 %, y 0-57 %) ; sapins couverts de neige ; montagnes enneigées au fond (x 30-52 %, y 25-35 %) ; soleil qui perce à gauche (x 17-24 %, y 18-28 %). Grande plaine de neige au premier plan (x 25-85 %, y 62-100 %).
- Histoire : il a neigé pendant la nuit. Le renardeau suit les empreintes de pattes dans la neige jusqu'à la tanière, où Maman l'attend, et la famille cherche les baies rouges encore accrochées aux branches.
- Vocabulaire nouveau : snow (la neige) · footprints / paw prints (les empreintes) · cold (froid) · white (blanc, si pas encore vu) · birch (si pas vu en décor 1). Vocabulaire réutilisé : den, berries, red, tree, rock, count, mountain, "Brrr!" (hérisson), cosy.
- Débutant :
  - Papa : [guide] "Follow the footprints!" (Suis les empreintes !)
  - Maman : [identify] "Where is Mommy? Find the den!" (la tanière, où Maman se tient à l'entrée) — dès « newborn »
  - Bébé fille : [identify] "Touch the red berries!" (Touche les baies rouges !)
  - Bébé garçon : [count] "How many paw prints?" (limiter à 3 empreintes isolées touchées une à une)
- Intermédiaire :
  - Papa : [guide] "Which way to the den? Left, right or straight?" (3 réponses ; lecture de l'image)
  - Maman : [observe] "What is Mommy doing?" (sniff / dig / leap, vraie capacité du renard)
  - Bébé fille : [identify] "Is the den under the snow or under the tree?" (position under / near)
  - Bébé garçon : [compare] "Which is colder, the snow or the sun?" ou "Which tree is white?" (couleur + objet : bouleau)
- Cohérence : fox = omnivore, baies d'hiver plausibles (vraies baies rouges dessinées) ; empreintes = empreintes de renard (type canidé) ; pas de prédation, pas de proie ; la neige est la seule saison où l'on n'ajoute pas de champignons.
- Points d'attention : les empreintes sont fines (≈ 2 % de large) : prévoir une ancre `prints` en bande (hit x 50-80 %, y 58-100 %) plutôt que des touches individuelles. Dans l'image, plusieurs empreintes sont assez petites pour un doigt d'enfant.

---

## Hibou (owl) — Europe
- Personnages : Papa Oscar (sage), Maman Olive (calme, fleur rose), Bébé fille (nœud rose), Bébé garçon ; mot du bébé : owlet (petit hibou). Planche : `Animaux/Europe/Hiboux/Progression d’une famille de hiboux adorables.png` (fond vert, 10 poses, les ailes ouvertes visibles pour 2 stades) ; dossier `Hiboux/hibou/`.
- Jeu propre existant : `owl_night` « Night owl! » (mécanique observe) — passe la scène en nuit (`scene(true)`), lune/étoiles à toucher, cri « Hoot, hoot! », grands yeux, tête qui tourne, plumes à compter, ailes, « owlet », puis retour au jour pour dormir. Mots propres : owl, hoot, big eyes, feather, wings, moon, star, night, owlet, fly.
- Objectifs pédagogiques de la famille : 2.2 (corps : eyes, wings, feathers, head), 1.5 (verbes : fly, turn, sleep, hoot), 1.3 (compter plumes, glands, étoiles), 2.3 (jour/nuit, moment de la journée), positions (« in the nest », « on the branch », « behind the leaves »).
- Fil rouge des 3 décors : (1) le nid dans la forêt de jour = « la maison » (nid, creux de l'arbre, branche) ; (2) la branche de nuit = « la nuit des hiboux » (lune, étoiles, cri) ; (3) le vieux chêne = « les trésors de la clairière » (glands, champignons, creux dans le tronc), saison douce.

### Hibou · décor 1 — The nest in the day / le nid dans la forêt, de jour
- Image : `Animaux/Europe/Hiboux/01_Hiboux_Nid_Foret_Jour.png` · Statut : NOUVEAU → `europe_owl_nest`
- Ce qu'on voit : vue en hauteur sur la forêt (canopée verte en fond, collines au loin, nuages blancs) ; à gauche un gros tronc avec un creux rond sombre (x 10-19 %, y 23-40 %) contenant un petit nid de paille (x 10-20 %, y 39-47 %) ; à droite, un nid de brindilles sur une branche (x 80-95 %, y 25-37 %) ; longue branche moussue qui s'avance au centre (x 17-60 %, y 55-80 %) ; deux champignons rouges à pois (x 3-13 %, y 83-100 %) ; fougères à gauche (x 0-17 %, y 70-90 %) ; gros rocher moussu en bas à droite (x 72-100 %, y 80-100 %) ; feuillage vert en haut ; rayons de soleil au fond à droite.
- Histoire : le jour, le hibou dort, mais sa famille vient voir les nids : celui du creux du tronc et celui de la branche. Papa et Maman montrent à l'owlet où dormir et ce qu'on voit depuis si haut.
- Vocabulaire nouveau : nest (le nid) · branch (la branche) · hole (le creux / le trou) · sky (le ciel) · high (haut). Vocabulaire réutilisé : tree, leaf, mushroom, rock, cloud, flower, owl words (feather, wings, fly, owlet, sleep).
- Débutant :
  - Papa : [identify] "Find the nest!" (Trouve le nid !)
  - Maman : [identify] "Touch the green leaf!" (Touche la feuille verte !)
  - Bébé fille : [identify] "Touch the red mushroom!" (dès « newborn »)
  - Bébé garçon : [count] "How many nests?" (2 : creux + branche)
- Intermédiaire :
  - Papa : [guide] "Is the nest on the branch or in the tree?" (position on / in ; 3 choix)
  - Maman : [identify] "Can you find a nest behind the leaves?" (position behind)
  - Bébé fille : [observe] "What does the owlet do on the branch?" (sleep / fly / hoot) — dès « young » pour voler
  - Bébé garçon : [compare] "Which nest is higher?" (creux vs branche)
- Cohérence : les hiboux nichent dans les creux d'arbre et sur les branches ; aucun œuf ni proie montrés. Si on mentionne la nourriture : insectes (bug) uniquement ; ne pas ajouter de souris.
- Points d'attention : les nids sont petits (≈ 10 % de large) mais le creux sombre est une grosse zone ; prendre le creux entier (x 8-21 %, y 22-48 %). Pas de sol : la famille volerait ou se tiendrait sur la branche : `spots` (≥ 4) à placer sur la longue branche (x 20-58 %, y 57-72 %), le rocher du bas droite et les feuilles, pas dans le vide (aucun sol dessiné).

### Hibou · décor 2 — The moon branch / la branche sous la lune (nuit)
- Image : `Animaux/Europe/Hiboux/02_Hiboux_Branche_Foret_Nuit.png` · Statut : NOUVEAU → `europe_owl_moon`
- Ce qu'on voit : nuit bleue étoilée (étoiles minuscules haut), pleine lune jaune lumineuse en haut à droite (x 70-81 %, y 8-25 %, très visible) ; gros chêne à gauche avec une longue branche moussue qui part du tronc vers le centre (x 8-70 %, y 46-80 %, bien éclairée orange) ; forêt de sapins bleutée et brume au fond (x 25-100 %, y 35-70 %) ; collines et nuages violets (nuages x 77-100 %, y 17-33 % ; x 48-72 %, y 28-38 %) ; en bas à gauche un grand rocher moussu (x 11-39 %, y 80-100 %) et un 2ᵉ rocher à son côté (x 43-55 %, y 95-100 %) ; feuilles de chêne vert vif à droite (x 76-100 %, y 70-100 %) et en haut.
- Histoire : la nuit est tombée, c'est l'heure des hiboux. Perchés sur la grande branche sous la lune, la famille écoute les bruits de la forêt et regarde les étoiles. L'owlet apprend « hoot, hoot ! » en répondant à Maman.
- Vocabulaire nouveau : moon (déjà en jeu via owl_night) · star (déjà) · night (déjà) · cloud (le nuage) · hill (la colline) · fir tree (le sapin) · mist (déjà dans europe_lake). Vocabulaire réutilisé : moon, star, night, branch (décor 1), tree, rock, leaf, big eyes, hoot, fly.
- Débutant :
  - Papa : [identify] "Touch the moon!" (Touche la lune !)
  - Maman : [identify] "Find the big branch!" (Trouve la grande branche !)
  - Bébé fille : [identify] "Touch the green leaf!"
  - Bébé garçon : [count] "How many clouds?" (2 nuages nets à droite)
- Intermédiaire :
  - Papa : [compare] "Which is bigger, the moon or the cloud?" (3 choix : moon / cloud / star)
  - Maman : [guide] "Is the moon over the hills or under the hills?" (position over/under)
  - Bébé fille : [observe] "What does an owl say at night?" (hoot / yip / moo) — dès « little »
  - Bébé garçon : [identify] "Can you find something behind the branch?" (sapins / brume / colline)
- Cohérence : hibou nocturne, vole la nuit ; rien dans l'eau ; AUCUNE souris ni proie dessinée ; la nourriture reste « bug » : on peut montrer des lucioles/coccinelles seulement en accessoire (props `bug`), pas dans l'image.
- Points d'attention : (1) LISIBILITÉ : l'image reste lisible pour toucher, la lune (jaune clair sur bleu nuit) et la branche (orange chaud) sont les deux zones les plus contrastées et grandes ; les étoiles sont trop petites (≈ 0,3 %) → utiliser des étoiles-props du jeu (`skyProp 'star'`) plutôt que de les chercher dans l'image ; le bas et le fond de forêt sont sombres : les accessoires (plume `feather`, bug) doivent avoir un halo clair. (2) CONFLIT avec `owl_night` : ce jeu appelle `scene(true)` « faisons venir la nuit » puis `scene(false)` « le soleil se lève » : sur un décor DÉJÀ de nuit, l'intro est incohérente et le passage au jour assombrit/éclaircit une image déjà nocturne. Prévoir une variante : saut de `scene(true)`/dire « It is night! » directement, et ne pas appeler `scene(false)` (ou terminer sur « Good night »). (3) La scène 'moon' prop ajoutée par `owl_night` s'ajouterait à la lune dessinée : utiliser l'ancre `moon` de l'image (hit x 70-81 %, y 8-25 %) et ne pas poser `owl_moon` en double.

### Hibou · décor 3 — The old oak clearing / la clairière du vieux chêne
- Image : `Animaux/Europe/Hiboux/Image ChatGPT 22 nov. 2026, 10_03_16-1.png` · Statut : NOUVEAU → `europe_owl_oak`
- Ce qu'on voit : un énorme chêne à droite (tronc x 55-100 %, y 0-71 %) avec un creux rond et un nid de paille à l'intérieur (x 74-83 %, y 18-33 %) ; grosse branche moussue qui part vers le haut gauche (x 15-68 %, y 5-28 %) ; glands accrochés en haut à gauche (x 9-14 %, y 10-17 % ; x 25-30 %, y 24-30 %) et à droite (x 88-96 %, y 18-33 %), le plus visible en haut à gauche ; champignons marron au pied des racines (x 55-62 %, y 58-66 %) ; champignons rouges à pois à droite (x 86-95 %, y 58-68 %) et à gauche (x 4-14 %, y 73-86 %) ; clochettes violettes à gauche (x 0-8 %, y 56-76 %) ; fougères (x 75-90 %, y 50-66 % ; x 6-18 %, y 52-65 %) ; rochers moussus (x 11-25 %, y 56-68 % ; x 82-98 %, y 70-85 % ; x 80-95 %, y 88-100 %) ; grande clairière de terre ocre au centre (x 15-85 %, y 70-95 %) avec 3-4 feuilles orange (x 25-38 %, y 82-95 %) ; sapins et chênes au fond, rayons de soleil à gauche (x 15-30 %, y 20-45 %).
- Histoire : la grande clairière est bien éclairée. Les hiboux ramassent les glands tombés et regardent les champignons ; l'owlet découvre le creux du vieux chêne, où il dormira quand il sera grand.
- Vocabulaire nouveau : acorn (le gland, déjà dans l'ancien `europe_forest`) · oak (le chêne) · bluebell (la clochette) · hollow (le creux) · big / small (déjà). Vocabulaire réutilisé : nest, branch, mushroom, rock, leaf, flower, red, purple, count.
- Débutant :
  - Papa : [identify] "Touch the oak tree!" (Touche le chêne !)
  - Maman : [identify] "Find the nest!" (le nid dans le creux)
  - Bébé fille : [count] "How many red mushrooms?" (limiter à 2, ceux de gauche)
  - Bébé garçon : [identify] "Touch the purple flower!" (clochettes violettes à gauche)
- Intermédiaire :
  - Papa : [guide] "Can you find two acorns on the branch?" (couleur / quantité / position on)
  - Maman : [compare] "Which tree is bigger, the oak or the fir?" (3 choix)
  - Bébé fille : [observe] "What is the owlet doing near the nest?" (hoot / fly / sleep)
  - Bébé garçon : [identify] "Is the mushroom next to the rock?" (position next to ; réponses yes/no/…)
- Cohérence : les glands sont décor et jeu de comptage seulement : le hibou ne les mange pas (foods = bug) ; ne pas dire « owl eats acorn ». Hibou ne court pas : ne pas proposer « run ».
- Points d'attention : décor chargé en haut (feuillage dense) : zones tactiles réellement grandes = le chêne, la clairière, les rochers. Glands petits (≈ 2-3 %) : zone de touche élargie. Très proche des anciennes images `europe_forest` pour l'ambiance (chêne + champignons).

---

## Hérisson (hedgehog) — Europe
- Personnages : Papa Hugo (timide), Maman Hazel (drôle, fleur rose), Bébé fille (nœud rose), Bébé garçon ; mot du bébé : hoglet (bébé hérisson). Planche : `Animaux/Europe/Herissons/planche_reference_herissons.png` (fond gris-rose dégradé, PAS vert : voir Anomalies) ; dossier `Herissons/herisson/`.
- Jeu propre existant : `hedgehog_ball` « Curl up, hedgehog! » (mécanique build) — piquants, boule, lit de feuilles à compter, scarabées et vers à trouver (poisson et bambou = intrus), « hoglet ». Mots propres : spikes, ball, curl up, bed of leaves, beetle, worm, hoglet.
- Objectifs pédagogiques de la famille : 1.5 (verbes : curl, run, munch, sleep), 2.2 (corps : spikes, nose, paws), 1.3 (compter feuilles / baies / cailloux), 1.2 (couleurs des baies : rouge, bleu), 2.3 (nourriture et abri), positions (« in the log », « near the stream »).
- Fil rouge des 3 décors : (1) la clairière du ruisseau = « la maison de feuilles » (trou sous les racines garni de feuilles mortes, fraises sauvages) ; (2) le lac de montagne = « une promenade au bord de l'eau, sans se mouiller » (rochers, fleurs, cascade, montagne) ; (3) le tronc creux de la prairie = « les baies rouges et bleues et la cachette du tronc ».

### Hérisson · décor 1 — The leafy den by the stream / la maison de feuilles au ruisseau
- Image : `Animaux/Europe/Herissons/Clairière enchantée au ruisseau scintillant.png` · Statut : NOUVEAU → `europe_hog_stream`
- Ce qu'on voit : à gauche, un gros arbre à lierre dont les racines forment un tunnel (x 13-33 %, y 38-68 %) garni de feuilles mortes brunes (lit : x 14-30 %, y 52-66 %) ; champignons rouges à pois (x 0-13 %, y 50-73 %) ; marguerites blanches (x 2-14 %, y 79-96 %) ; fougères ; gros rochers moussus au centre (x 49-65 %, y 45-65 %), petits rochers ronds en bas (x 24-37 %, y 87-100 % ; x 39-53 %, y 95-100 %) ; chemin de terre et de feuilles au centre ; ruisseau avec petite chute à droite (x 63-98 %, y 40-68 %, eau claire) ; fraises sauvages rouges à droite (x 92-98 %, y 60-72 %, 2 fraises) ; clochettes violettes en haut à droite (x 92-100 %, y 22-36 %) ; tronc couché mousseux en bas à droite (x 66-100 %, y 77-100 %) ; sous-bois lumineux avec rayons.
- Histoire : le hérisson garnit son lit de feuilles sèches dans le trou sous les racines. La famille ramasse des feuilles sur le chemin et retrouve des petits vers et scarabées près du ruisseau (jamais dedans).
- Vocabulaire nouveau : root (la racine) · stream (le ruisseau) · strawberry (la fraise) · log (le tronc couché) · dry (sec). Vocabulaire réutilisé : leaf, mushroom, rock, flower, red, bed of leaves, beetle, worm, spikes.
- Débutant :
  - Papa : [identify] "Find the bed of leaves!" (Trouve le lit de feuilles !)
  - Maman : [count] "How many red mushrooms?" (2)
  - Bébé fille : [identify] "Touch the strawberries!" (Touche les fraises !) — attention : le hérisson ne les mange pas (voir Cohérence), on les touche pour la couleur
  - Bébé garçon : [identify] "Touch the big rock!" (Touche le gros rocher !)
- Intermédiaire :
  - Papa : [guide] "Is the bed inside the tree or next to the stream?" (position inside / next to ; 3 choix)
  - Maman : [build] "Put the leaves in the bed! How many leaves?" (reprend `hedgehog_ball`)
  - Bébé fille : [observe] "What is the hoglet doing?" (curl up / run / sleep) — jamais « jump » ni « fly »
  - Bébé garçon : [compare] "Which rock is smaller?" (rochers ronds du bas)
- Cohérence : nourriture = scarabées et vers (dans l'herbe, hors du ruisseau) ; ni poisson, ni bambou ; les fraises sont un décor, pas un repas (non listées dans `foods`) ; le hérisson ne saute pas, ne vole pas.
- Points d'attention : (1) TRÈS proche du renard `02_Sous_bois_automnal.png` (tanière à racines, champignons rouges, ruisseau avec cascade à droite) : risque que la même famille d'accessoires et la même question « Touch the den » reviennent d'un animal à l'autre ; différencier l'histoire (lit de feuilles / fraises contre paille / pommes de pin). (2) Le ruisseau doit avoir une zone `water` pour `dryLand`. (3) Zone tunnel bien grande ; fraises petites (≈ 4 %).

### Hérisson · décor 2 — The mountain lake walk / la promenade au lac de montagne
- Image : `Animaux/Europe/Herissons/Image ChatGPT 21 nov. 2026, 12_46_47-1.png` · Statut : NOUVEAU → `europe_hog_lake`
- Ce qu'on voit : à gauche un grand pin au tronc brun épais (x 0-13 %, y 0-65 %) ; cascade qui tombe de rochers (x 18-29 %, y 32-46 %) dans un lac turquoise (x 28-97 %, y 40-65 %, galets visibles dessous) ; chaîne de montagnes enneigées au fond (x 38-90 %, y 5-32 %) ; sapins sur la rive ; lupins violets à gauche (x 12-22 %, y 42-55 % ; x 0-12 %, y 72-92 %) ; fleurs orange et blanches (x 12-28 %, y 87-100 %) ; gros rochers : à gauche (x 0-14 %, y 48-66 %), en bas à droite (x 79-100 %, y 76-98 %), au milieu à droite (x 78-93 %, y 50-70 %), au bord du lac (x 33-43 %, y 49-59 %) ; buisson de baies rouges à droite (x 88-99 %, y 62-73 %) ; grande prairie verte (x 15-80 %, y 62-90 %) avec chemin de terre (x 20-75 %, y 80-95 %).
- Histoire : une promenade au bord du lac. Le hérisson et sa famille restent sur la rive herbeuse : ils comptent les rochers, regardent la montagne et la cascade, cherchent des vers sur le sentier, sans entrer dans l'eau.
- Vocabulaire nouveau : lake (déjà dans `europe_lake`) · waterfall (la cascade) · pine tree (déjà) · lupin / purple flower (la fleur violette) · path (le chemin) · shore (la rive). Vocabulaire réutilisé : mountain, rock, flower, berries, red, big/small, count, worm, beetle.
- Débutant :
  - Papa : [identify] "Find the lake!" (Trouve le lac !)
  - Maman : [identify] "Touch the mountain!" (Touche la montagne !)
  - Bébé fille : [count] "How many big rocks?" (2 à droite) — dès « newborn »
  - Bébé garçon : [identify] "Touch the purple flower!" (lupins violets, à gauche)
- Intermédiaire :
  - Papa : [guide] "Is the waterfall near the pine tree?" (position near ; 3 choix : pine / lake / mountain)
  - Maman : [compare] "Which rock is bigger?" (rocher bas droite vs rocher bord de lac)
  - Bébé fille : [observe] "What is the hoglet doing on the path?" (run / curl up / sleep)
  - Bébé garçon : [identify] "Can you find three red berries?" (couleur + quantité + objet ; buisson droit)
- Cohérence : jamais « hedgehog swims » (cannot swim n'est pas listé mais le hérisson ne nage pas dans le jeu : accessoires hors eau) ; aucun poisson ; nourriture = vers/scarabées sur la prairie. Les baies rouges sont décor (couleur/comptage seulement).
- Points d'attention : (1) lac = grande zone d'eau (x 28-97 %, y 40-65 %) : déclarer une ancre `water` et ne poser aucun accessoire dedans (`dryLand`). (2) Image très proche du décor jaguar/ours `na_lake` (lac de montagne) et du décor actuel `europe_alps` : ressemblance avec d'autres continents, pas un problème de code mais attention à la répétition des mots « lake / mountain ». (3) La bordure de lac est étroite au premier plan, la prairie large est la zone de jeu.

### Hérisson · décor 3 — The hollow log meadow / la prairie du tronc creux
- Image : `Animaux/Europe/Herissons/Image ChatGPT 21 nov. 2026, 12_46_51-2.png` · Statut : NOUVEAU → `europe_hog_log`
- Ce qu'on voit : de grands troncs de séquoias/sapins en fond ; à droite, un gros tronc couché et creux avec champignons de bois (x 60-95 %, y 36-53 %, ouverture visible côté droit x 88-94 %, y 40-52 %) ; buissons de baies : rouges à gauche (x 0-22 %, y 60-85 %) et à droite en bas (x 88-100 %, y 80-96 %) et au centre fond (x 27-40 %, y 38-50 %) ; baies bleues à droite (x 88-100 %, y 30-56 %) et au centre (x 53-60 %, y 38-48 %) ; lupins violets (x 0-10 %, y 45-60 % ; x 71-82 %, y 77-90 %) ; marguerites blanches ; fleurs jaunes à droite (x 86-100 %, y 66-78 %) ; rochers moussus : gros à gauche (x 0-19 %, y 80-100 %), gros à droite (x 76-100 %, y 77-100 %), un derrière au fond (x 16-28 %, y 34-48 %), petits ronds au centre ; grande clairière d'herbe et de terre au centre (x 15-80 %, y 55-85 %) ; colline boisée au fond.
- Histoire : au bord de la prairie, le hérisson se cache dans le grand tronc creux quand il a peur (boule piquante) et la famille compte les baies rouges et bleues qu'elle voit sur les buissons, sans les manger : les hérissons préfèrent les vers et scarabées.
- Vocabulaire nouveau : blueberry / blue berry (la myrtille, la baie bleue) · log (le tronc couché, si non vu en décor 1) · hide (se cacher) · meadow (la prairie, déjà dans `europe_alps`) · yellow flower. Vocabulaire réutilisé : berries, red, blue, purple, rock, flower, count, curl up, spikes, ball.
- Débutant :
  - Papa : [identify] "Find the log!" (Trouve le tronc !)
  - Maman : [identify] "Touch the blue berries!" (Touche les baies bleues !)
  - Bébé fille : [count] "How many red berry bushes?" (2 gros buissons visibles à gauche et en bas à droite)
  - Bébé garçon : [identify] "Touch the yellow flower!" (fleurs jaunes à droite)
- Intermédiaire :
  - Papa : [build] "Curl up in the log! Is it inside or outside?" (position inside / outside ; reprend `hedgehog_ball`)
  - Maman : [compare] "Which is bigger, the log or the rock?" (3 choix)
  - Bébé fille : [guide] "Where is the hoglet hiding? In the log, behind the rock or under the tree?" (cachette ; positions in / behind / under)
  - Bébé garçon : [identify] "Can you find two blue berry bushes?" (couleur + quantité + objet)
- Cohérence : baies = décor/couleurs seulement (pas dans `foods` : ne jamais écrire « the hedgehog eats the berries ») ; nourriture = bug/worm ; aucune eau ; hérisson ne saute pas : pour monter sur le tronc couché, utiliser « the hoglet walks next to the log ».
- Points d'attention : décor très chargé en baies (rouges, bleues) : les couleurs aident, mais plusieurs buissons rouges (gauche, centre, bas droite) se ressemblent : toujours préciser la position. Zone la plus facile : le gros tronc creux. Très proche du renard `01_Clairiere_et_terrier.png` pour l'ambiance (prairie + souche + lupins) : même lumière doré-vert.

---

## Mots et jeux des 5 anciens décors qui sortent des parcours (à replacer)
Les 5 décors (`europe_forest`, `europe_farm`, `europe_alps`, `europe_lake`, `europe_coast`) restent dans `europe.json` et sont encore référencés par `species.ts` (allowedBiomes), `archetypes.ts`, `adventures/europe.ts` (aventures de voyage), `activities/africa.ts` (listes par décor, l. 52, 206, 275, 477-481) et `places/depth.ts`. Rien n'a été supprimé.

| Ancien décor | Mots ancres (anchors) | Jeux / aventures qui y vivent | Où les replacer |
|---|---|---|---|
| `europe_forest` | tree(oak), mushroom, acorn, berry, bridge, castle, rock, mountain, leaf, flower, den | `follow_tracks` (empreintes, l. 275 de africa.ts : cerf/hoofprint) ; aventures `europe_autumn_walk`, `europe_big_trip` (départ forêt) ; décor de départ de 3 espèces | mushroom/acorn/leaf/den/rock → hibou 3 (chêne), renard 2 (sous-bois), hérisson 1 ; tree/berry/flower/mountain → renard 1 ; bridge/castle (hors famille) → à abandonner ou à garder dans l'aventure de voyage ; empreintes → renard 3 (neige) |
| `europe_farm` | apple tree, apple, house, wall, fence, bridge, stream, castle, flower, cloud, village | `pick_apples` (compter les pommes ; `requiredAnchors: ['appletree']`, `allowedBiomes: ['europe_farm']`) ; aventure `europe_apple_day` (départ ferme) | apple/apple tree/house/fence/village n'ont AUCUN équivalent dans les 9 nouvelles images : le jeu `pick_apples` n'est plus jouable en Europe par ces 3 espèces → à re-créer sur une image nouvelle (ex. pommier) ou à retirer ; stream → renard 2 / hérisson 1 |
| `europe_alps` | pine tree, tree, mountain, church, house, lake, rock, flower, cloud, edelweiss, meadow | `echo_canyon` (« L'écho », `allowedBiomes` inclut `europe_alps`) ; aventure de voyage « Let's go to the mountains! » | mountain/lake/pine/rock/flower/cloud/meadow → hérisson 2 (lac de montagne) ; echo_canyon → hérisson 2 ou renard 1 (montagne au fond) ; church/house/edelweiss → perdus |
| `europe_lake` | pine tree, tree, lake, island, mountain, rock, stone, berry, flower, cloud, mist, heather | `who_in_water` (identify, listé dans `allowedBiomes` : `europe_lake`) ; aventure `europe_lake_night` (fox, owl) ; `africa.ts` l. 52 (liste de nombres [2,3,4] pour europe_lake) | lake/rock/stone/pine → hérisson 2 ; mist → hibou 2 (brume de la nuit) ; island/heather → perdus ; `who_in_water` : plus de lac pour fox/owl : seul le hérisson 2 aura un lac |
| `europe_coast` | pine tree, pot, step, sea, arch, sand, house, flower, cloud, sun, cypress tree, window | `beach_shells` (`allowedBiomes` inclut `europe_coast`) ; aventure de voyage « Let's go to the sea! » ; hérisson était le seul à y vivre | sea/sand/arch/sun... aucun équivalent dans les nouvelles images : le hérisson perd la mer (cohérent : ce n'est pas son milieu) ; `beach_shells` n'a plus de place en Europe |

Aventures (`src/content/adventures/europe.ts`) à revoir : elles enchaînent `europe_forest` → `europe_alps` → `europe_coast` (l. 128, 171, 187, 204) et déclarent `species: ['fox','owl','hedgehog']` ; avec de nouveaux décors propres à chaque espèce, ces voyages sortent de la logique « chaque espèce a ses 3 décors » : décision à prendre avec Westimmo (hors périmètre de cette cartographie).

---

## Anomalies — Europe

1. **Décors trop semblables (fox 2 / hedgehog 1)** — `Animaux/Europe/Renards/02_Sous_bois_automnal.png` et `Animaux/Europe/Herissons/Clairière enchantée au ruisseau scintillant.png` : même composition (arbre à racines-tunnel à gauche, champignons rouges à pois, ruisseau avec cascade à droite, chemin de terre). Conséquence : le parcours « tanière + ruisseau » est presque identique pour deux familles. À faire : accepter la ressemblance mais distinguer l'histoire (paille / pommes de pin pour le renard ; feuilles mortes / fraises pour le hérisson) ou régénérer l'une des deux images.
2. **Planche hérisson à fond non vert** — `Animaux/Europe/Herissons/planche_reference_herissons.png` : fond gris-rose dégradé avec ombre portée, alors que les planches renard et hibou ont un fond vert uni. Conséquence : détourage plus difficile si l'on doit regénérer les personnages ; non bloquant puisque `public/assets/characters/` contient déjà les sprites (voir point 3). À faire : ne rien changer sauf regénération.
3. **Personnages : complets.** `src/content/assetManifest.json` contient pour chacune des trois familles `<id>_father`, `<id>_mother`, `<id>_girl_{newborn,little,young,companion}` et `<id>_boy_{newborn,little,young,companion}` (fox, owl, hedgehog : 10 entrées chacun) ; `public/assets/characters` contient 30 fichiers `fox_*`, `owl_*`, `hedgehog_*`. Aucun manque. Les dossiers sources `Renards/renard`, `Hiboux/hibou`, `Herissons/herisson` ont chacun 10 PNG (papa, maman, 4+4 stades).
4. **Hibou 2 (nuit) vs `owl_night`** — `Animaux/Europe/Hiboux/02_Hiboux_Branche_Foret_Nuit.png` / `src/content/activities/species/europe.ts` (`owlNight`) : le jeu fait `scene(true)` (« faisons venir la nuit »), pose sa propre lune et revient au jour avec `scene(false)`. Sur une image déjà de nuit : intro incohérente, lune en double, obscurité cumulée. À faire : variante ou condition « si le décor est de nuit » (ne pas appeler `scene(true/false)`, réutiliser l'ancre `moon` de l'image). Les deux autres décors du hibou (jour) gardent le comportement actuel, ce qui est cohérent.
5. **Hibou : pas de sol** — `Hiboux/01_Hiboux_Nid_Foret_Jour.png` et `02_Hiboux_Branche_Foret_Nuit.png` : vue en hauteur, sol absent ou en bas à droite (rocher). `dryLand` exige ≥ 4 `spots` pour `owl_night` ; si on les place dans le vide, les plumes et accessoires flottent. À faire : ancrer les `spots` sur la branche (x 20-58 %, y 57-72 %), le rocher bas gauche/droit et les feuilles.
6. **Ancres `den` à créer** — pour fox 1, 2 et 3 : `foxTricks` cherche `anchor(place,'den')`. Aucun des 3 nouveaux décors n'existe dans `places/europe.json` : il faudra définir `den` (tanière) pour chacun avec les zones indiquées ci-dessus, sinon l'accessoire `fox_den` s'ajoute par-dessus la tanière dessinée.
7. **Eau à déclarer pour `dryLand`** — hedgehog 1 (ruisseau), hedgehog 2 (lac), fox 2 (ruisseau), fox 3 (ruisseau mince) : sans ancre taguée `water`, `dryLand` peut placer scarabées, feuilles ou baies dans l'eau (contradiction avec le commentaire de tête de `europe.ts` : « aucun objet n'est posé dans l'eau »).
8. **`allowedBiomes` et listes à mettre à jour** — `src/content/species.ts` l. 31-33 : fox = forest, farm, alps, lake ; owl = forest, lake, farm ; hedgehog = forest, farm, coast. Conséquence : tant que ces listes ne sont pas remplacées, aucune des 9 nouvelles images n'est atteignable ; à l'inverse, les anciens décors continueraient d'être proposés. À faire : remplacer par les 3 ids de chaque famille (voir ids proposés).
9. **Jeux perdus** — `pick_apples` (`europe_farm`), `beach_shells` (`europe_coast`), `who_in_water` (`europe_lake`, seul le hérisson 2 conserve un lac) et `echo_canyon` (`europe_alps`) n'ont plus de support pour le renard/hibou ; voir tableau plus haut.
10. **Hibou : diet `carnivore` dans le code** — `src/content/species.ts` l. 32 : `diet: 'carnivore'` avec `foods: ['bug']`. Les images ne montrent aucune proie (conforme) ; ne jamais ajouter de souris/rongeur. Aucune action sur l'image ; seule la sémantique de « carnivore » dans `species.ts` pourrait prêter à confusion (insecte = bug) et mérite d'être gardée telle quelle comme demandé.
11. **Hérisson : baies et fraises dans 3 décors** — `Herissons/Image ChatGPT 21 nov. 2026, 12_46_47-1.png`, `…12_46_51-2.png` et `Clairière enchantée…` : baies rouges/bleues et fraises bien visibles, mais `foods` du hérisson = bug, worm. Risque que le moteur de quêtes propose « nourrir le hérisson de baies ». À faire : ne les utiliser que pour couleur/comptage (déjà prévu ci-dessus).
12. **Résolutions** : toutes les images de décors font 1672×941 (correctes, pas de flou, pas de petite image comme pour `03_Taniere_hivernale.png` côté Amérique du Nord). Les 3 planches font 1536×1024 (suffisant).
13. **Renard 3 : empreintes fines** — `Renards/03_Foret_enneigee.png` : les empreintes mesurent ≈ 2 % de large ; pour un enfant de 7 ans, ancre en bande (x 50-80 %, y 58-100 %), pas d'ancres individuelles.
14. **Fichiers du dépôt** : aucun fichier d'image manquant ; les 9 décors listés dans la mission existent. Aucun de ces 9 décors n'est encore dans `src/content/places/europe.json` (il contient 5 décors, tous anciens, issus de `Continant/Europe 2/…`).


---

# Cartographie Océanie — 3 familles × 3 décors (2026-11-23)

Sources lues : `oceania.json` (7 décors actuels), `oceania.arch.ts`, `oceania.ts`, `species.ts`, `assetManifest.json`, 12 images (9 décors + 3 planches). Coordonnées des zones = % de l'image (x, y, largeur, hauteur), lues sur l'image ; pour les décors déjà dans le jeu, ce sont celles de `oceania.json`.
Règles de niveau : débutant = 2 réponses, phrases très courtes, mécaniques existantes seulement ; intermédiaire = 3 réponses. Ne rien ajouter au débutant (validé avec l'enfant).

Répartition proposée des décors (chaque famille a les siens, aucun partagé) :

| Famille | Décor 1 | Décor 2 | Décor 3 |
|---|---|---|---|
| Kangourou | `oc_red_plain` (NOUVEAU) | `oc_waterhole` (NOUVEAU) | `oc_bush_coast` (NOUVEAU) |
| Koala | `oc_eucalyptus` | `oc_gum_woodland` | `oc_rocky_cove` (à arbitrer, voir Anomalies) |
| Lézard à collerette | `oc_outback` | `oc_gorge` | `oc_beach` |

`oc_fern_forest` (fougères de Tasmanie) sort du parcours (aucune famille ne l'utilise, aucune image dans `Animaux/Oceanie/`).

---

## Kangourou (kangaroo) — Océanie
- Personnages : Papa Kip (bondissant), Maman Kira (attentionnée, SEULE à avoir une poche), Bébé fille, Bébé garçon (mot du bébé : joey ; le planche montre assis → debout → bondit → grand, nœud rose pour la fille)
- Jeu propre existant : `kangaroo_hop` « Hop like a kangaroo! » — pieds (big feet), poche de Maman (pouch), joey, empreintes à toucher dans l'ordre (3/4/5 selon niveau), queue solide (intermédiaire), ordres hop/jump/run. Mots déjà en jeu : kangaroo, joey, pouch, big/small, feet, footprint, hop, tail, strong, one-five.
- Objectifs pédagogiques : 1.5 corps et actions (pieds, queue, poche, hop, jump) ; 1.3 nombres (empreintes, cailloux) ; 2.2 capacités (hop/jump/run oui, climb/fly non) ; 1.7 météo (chaud, soif au point d'eau) ; 2.3 localisation (derrière le rocher, près de l'eau) ; 3.4 comparaison (plus grand/plus loin).
- Fil rouge des 3 décors : (1) la plaine rouge = le grand terrain de sauts et de poursuite, on compte les rochers et on suit les empreintes ; (2) le point d'eau = la pause soif de midi, on cherche où boit chacun et on voit un reflet ; (3) la côte = on grimpe la colline d'herbe pour voir la mer de loin (le kangourou regarde la mer, il ne s'y baigne pas), plus loin / plus près.

### Kangourou · décor 1 — The red plain / la plaine rouge
- Image : `Animaux/Oceanie/Kangourous/Paysage coloré de l’Outback australien-1.png` (1672×941) · Statut : NOUVEAU → `oc_red_plain`
- Ce qu'on voit : à gauche gros eucalyptus à l'écorce pelée blanche/orange (0,0,20,65) ; à gauche devant buisson de fleurs rouges en goupillon (0,58,15,38) ; gros rocher rond rouge (12,64,18,24) ; au centre sentier de terre rouge qui s'élargit vers l'avant (30,70,45,30) ; touffes d'herbe jaune (25,55,28,15) ; petits cailloux sur le sentier (22,82,30,12) ; à droite gros rochers rouges (77,58,23,22 et 76,80,24,20), buisson à petites fleurs blanches (86,68,14,16) ; fond : massif de rochers rouges en haut à droite (65,27,28,22), montagnes bleues (15,32,70,13), arbre vert à droite (78,2,22,48), nuages blancs (45,16,40,14).
- Histoire : Kip et Kira emmènent les bébés sur la plaine rouge, là où l'herbe sèche et les gros rochers font un terrain de jeu. Chacun saute d'un rocher à l'autre ; on suit le chemin rouge en comptant les rochers avant d'atteindre l'arbre.
- Vocabulaire nouveau : red sand (le sable rouge) · rock (le rocher) · path (le chemin) · mountain (la montagne) · white flowers (fleurs blanches). Réutilisé : tree, big/small, red, green, one-five, hop, feet, joey, footprint.
- Débutant :
  - Papa : [guide] "Hop, hop! Follow me on the red path!" (Suis-moi sur le chemin rouge !) — enchaîne le jeu des empreintes `kangaroo_hop`.
  - Maman : [identify] "Is this a rock?" (touche le rocher, 2 réponses rock / flower) "Touch the big rock!" (Touche le gros rocher !)
  - Bébé fille : [count] "How many rocks?" (2 grands rochers à droite, réponse 1 ou 2). Dès `newborn` : elle reste dans la poche, juste "Where is the joey?"
  - Bébé garçon : [locate] "Touch the red flower!" (le goupillon rouge, à gauche devant). Phase minimale `little` pour sauter vers lui.
- Intermédiaire :
  - Papa : [compare] "Which rock is bigger?" (le rocher rond à gauche ou celui de droite) (3.4)
  - Maman : [locate] "Is the joey behind the rock or on the path?" (3 choix : behind / next to / on) (2.3)
  - Bébé fille : [count] "Can you find two white flowers?" (couleur + objet + quantité : buisson de droite) (1.2 + 1.3)
  - Bébé garçon : [observe] "What is Daddy doing?" — "He's hopping!" / "He's sleeping!" / "He's swimming!" (3.1)
- Cohérence : herbe (food `grass`) ; hop/jump/run ; aucun grimper (les arbres sont du décor).
- Points d'attention : décor proche d'`oc_outback` du lézard (mêmes rochers rouges, mêmes touffes d'herbe) mais l'eucalyptus pelé et le goupillon sont distinctifs et le lézard a le monolithe central. Le sentier est large : bonnes cibles tactiles.

### Kangourou · décor 2 — The waterhole / le point d'eau
- Image : `Animaux/Oceanie/Kangourous/Reflet paisible dans l’outback australien-2.png` (1672×941) · Statut : NOUVEAU → `oc_waterhole`
- Ce qu'on voit : grand eucalyptus pelé à gauche (0,0,20,70) avec goupillons rouges qui pendent (20,2,13,18) ; étang calme à droite avec reflets (47,53,53,28) ; nénuphars (66,66,15,8) ; roseaux/quenouilles à droite (82,55,18,25) ; pierres au bord de l'eau (52,52,15,9), rocher posé sur la rive (63,76,19,10) ; gros rocher moussu à gauche devant (3,68,25,22) ; grosse touffe d'herbe (17,52,16,22) ; fleurs rouges en goupillon en bas à droite (84,78,16,22) ; chemin orange (22,68,43,32) ; fond : rocher rose type monolithe (60,31,18,16), rangée d'eucalyptus verts, ciel avec 2 nuages.
- Histoire : à midi il fait très chaud ; la famille de kangourous vient boire au point d'eau. Les bébés regardent leur reflet dans l'eau, cherchent les nénuphars et comptent les pierres au bord, sans entrer dans l'eau.
- Vocabulaire nouveau : pond (l'étang) · water (l'eau) · lily pad (le nénuphar) · thirsty (avoir soif) · drink (boire) · reflection (le reflet, facultatif). Réutilisé : rock, path, red flower, hot, big/small, joey, hop, grass.
- Débutant :
  - Papa : [identify] "Daddy is thirsty! Where is the water?" (Touche l'eau ; 2 zones : eau / sable) 
  - Maman : [social] "Drink, drink! Touch Mummy!" (Touche Maman, elle boit au bord) — aucune mise à l'eau.
  - Bébé fille : [count] "How many lily pads?" (nénuphars, réponse 2 ou 3 — compter ce qui est vraiment visible, vérifier à l'intégration). 
  - Bébé garçon : [locate] "Find the big rock!" (le gros rocher gauche, 2 réponses rock / tree).
- Intermédiaire :
  - Papa : [observe] "Is the water cold or hot?" ... préférer : "Is the kangaroo near the water?" (near / far / under) (2.3)
  - Maman : [locate] "Where is the baby hiding?" — "behind the rock" / "next to the pond" / "in the tree" (2.3)
  - Bébé fille : [identify] "Can you find a red flower near the water?" (couleur + position) (1.2 + 2.3)
  - Bébé garçon : [observe] "What is Mummy doing?" — "She's drinking!" / "She's flying!" / "She's climbing!" (3.1, 2.2)
- Cohérence : le kangourou boit au bord, ne nage pas (`swim` absent de `can`) ; mange de l'herbe ; aucun poisson, aucune proie.
- Points d'attention : l'eau occupe une grande zone à ne jamais utiliser comme emplacement d'objets (`landSpots` à vérifier : rives étroites). Le monolithe rose en fond ressemble à celui du décor lézard `oc_outback` (petit ici, ne gêne pas). Les quenouilles à droite sont fines : zone tactile large nécessaire.

### Kangourou · décor 3 — The bush coast / la côte de brousse
- Image : `Animaux/Oceanie/Kangourous/Paysage côtier australien ensoleillé-3.png` (1672×941) · Statut : NOUVEAU → `oc_bush_coast`
- Ce qu'on voit : à gauche tronc d'eucalyptus pelé (0,0,18,60) et fleurs rouges + petites jaunes (0,58,15,38) ; gros rocher rond (10,57,22,23) et un deuxième plus bas (31,73,18,15) ; grosse touffe d'herbe pointue (grass tree) (13,43,20,22) ; fond gauche : colline rocheuse (17,21,30,13) ; plaine d'herbe dorée au centre (35,55,35,20) ; buissons verts (62,52,20,14, 75,55,15,12) ; rochers de plage à droite (88,43,12,12) ; mer turquoise (52,38,48,14) avec vagues blanches (62,45,22,5) ; plage de sable fine en courbe (47,40,24,9) ; sentier de terre en bas (38,80,28,20) ; nuages blancs à droite (70,8,30,30).
- Histoire : après avoir traversé la brousse dorée, la famille monte voir la mer au loin. Kip dit « Look! The sea! » mais la mer est loin et les kangourous restent sur l'herbe ; les bébés comparent ce qui est près (les rochers) et ce qui est loin (les vagues, la colline).
- Vocabulaire nouveau : sea (la mer) · wave (la vague) · hill (la colline) · near / far (près / loin, intermédiaire) · golden grass (herbe dorée). Réutilisé : sand, rock, big/small, blue, hop, feet, tail, red flower.
- Débutant :
  - Papa : [locate] "Look! Touch the sea!" (Touche la mer ; 2 réponses sea / hill)
  - Maman : [identify] "Is the sea blue?" (oui/non — couleur turquoise) 
  - Bébé fille : [count] "How many big rocks?" (2 rochers devant à gauche : 1 ou 2)
  - Bébé garçon : [guide] "Hop to the hill!" (suit les empreintes dans l'herbe, `kangaroo_hop`), phase minimale `little`.
- Intermédiaire :
  - Papa : [compare] "Is the sea near or far?" (3 choix : near / far / big) (2.3, 3.4)
  - Maman : [locate] "Can you find something behind the big rock?" (le 2e rocher / le buisson / la touffe d'herbe) (2.3)
  - Bébé fille : [observe] "What can you see in the sea?" — vagues blanches: "Waves!" / "A kangaroo!" / "A bird!" (1.4)
  - Bébé garçon : [identify] "Find the small rock and the big rock." (comparaison de taille entre 2 rochers) (3.4)
- Cohérence : on reste sur l'herbe ; le kangourou regarde la mer (ne nage pas, ne mange pas de poisson).
- Points d'attention : décor mixte terre/mer ; la mer est une fine bande (12 % de haut), zone tactile minimale ≈ 48×14 : OK mais loin de la zone de marche. Moins semblable aux plages des deux autres familles car dominé par la brousse (voir Anomalies).

---

## Koala (koala) — Océanie
- Personnages : Papa Kobi (endormi), Maman Kali (douce), Bébé fille (noeud rose), Bébé garçon (mot du bébé : joey ; sur la planche : couché → assis → marche → grand)
- Jeu propre existant : `koala_sleepy` « The sleepy koala » — toucher son arbre (eucalyptus > gum tree > tree), câlin à l'arbre (hug), feuilles d'eucalyptus à ramasser (le bambou et la banane = refus), oreilles toutes douces (fluffy ears), nez, griffes (claws), sieste. Papa n'y parle pas (réservé à Maman / bébé).
- Objectifs pédagogiques : 1.5 corps (oreilles, nez, griffes) ; 1.6 nourriture (seulement l'eucalyptus) ; 1.2 couleurs (écorce blanche/orange, fleurs rouges/blanches) ; 1.3 nombres (feuilles, rochers) ; 2.3 localisation (sur/dans/derrière l'arbre) ; 3.3 routines (dormir, manger, grimper).
- Fil rouge des 3 décors : (1) forêt d'eucalyptus = l'arbre et le câlin, un ruisseau entendu de loin (le koala ne boit pas, ne nage pas) ; (2) bois de gommiers sec = quelles feuilles sont bonnes (vertes sur l'arbre) / sèches par terre, la sieste de Papa ; (3) crique = vacances à l'ombre de l'arbre, le koala regarde la mer et ne nage pas.

### Koala · décor 1 — The gum tree forest / la forêt d'eucalyptus
- Image : `Animaux/Oceanie/Koalas/02_Foret_eucalyptus.png` · Statut : déjà dans le jeu sous `oc_eucalyptus`
- Ce qu'on voit : gros troncs d'eucalyptus pelés blancs/orange à gauche (0,0,30,72) ; branches et feuilles longues en haut (30,0,32,16) ; fleurs rouges en goupillon à gauche devant (0,58,12,22) ; chemin de terre au centre (38,72,34,28) ; ruisseau et petite cascade au fond (62,55,20,12) ; plan d'eau (42,62,36,9) ; rochers gris à droite (84,66,16,20) ; touffe d'herbe pointue (grass tree) à droite (85,40,15,22) ; colline lointaine (53,34,16,6).
- Histoire : la famille koala est dans le grand arbre ; on entend la cascade au loin mais personne ne descend vers l'eau. Maman montre à Bébé les feuilles qu'on mange et les écorces de toutes les couleurs.
- Vocabulaire nouveau : trunk (le tronc) · bark (l'écorce) · branch (la branche) · waterfall (la cascade) · stream (le ruisseau). Réutilisé : tree, eucalyptus, leaf, hug, claws, ears, sleepy, red, white, big/small, rock.
- Débutant :
  - Papa : [social] "Zzz... Touch Daddy!" (Touche Papa, il dort — réponse : tap sur l'arbre) ; ne parle pas.
  - Maman : [identify] "Where is my tree? Touch the tree!" (le grand tronc de gauche ; existant)
  - Bébé fille : [identify] "Touch the green leaf!" (branches en haut ; 2 réponses leaf / rock)
  - Bébé garçon : [locate] "Touch the red flower!" (goupillon à gauche)
- Intermédiaire :
  - Papa : [observe] "What is Daddy doing?" — "He's sleeping!" / "He's swimming!" / "He's flying!" (3.1)
  - Maman : [locate] "Is the baby on the tree or under the tree?" (3 choix) (2.3)
  - Bébé fille : [count] "How many rocks? Count the grey rocks." (couleur + quantité) (1.2 + 1.3)
  - Bébé garçon : [identify] "Can you find the waterfall? Is it near or far?" (2.3)
- Cohérence : jamais d'objet dans l'eau ; seule nourriture = eucalyptus ; le koala regarde l'eau mais ne la touche pas.
- Points d'attention : la cascade est petite (12×9) : zone tactile élargie à ≈ 20×14 recommandée. Proche d'`oc_gum_woodland` (même type de forêt, chemin de terre à gauche, rochers) : à distinguer par ruisseau/cascade (ici) et herbe sèche + fleurs blanches (l'autre).

### Koala · décor 2 — The gum tree woodland / le bois de gommiers
- Image : `Animaux/Oceanie/Koalas/Image ChatGPT 21 nov. 2026, 07_56_37-3.png` · Statut : déjà dans le jeu sous `oc_gum_woodland`
- Ce qu'on voit : tronc d'eucalyptus pelé très clair à gauche (0,0,22,70), écorce qui se détache (6,22,12,30) ; second grand arbre à droite (85,4,15,52) ; buissons à fleurs blanches à gauche (4,60,12,14) et à droite (90,50,10,40) ; grosse pierre ronde à lichen à droite (78,62,22,18) ; autres pierres (3,81,19,15) ; herbe jaune sèche (22,62,18,10) ; chemin de terre rouge au centre (34,72,34,24) ; feuilles sèches brunes sur le chemin (70,86,22,13) ; collines vertes au fond (88,34,12,10) ; deux nuages (55,19,10,8).
- Histoire : à l'ombre des gommiers, Papa fait la sieste contre le tronc. Les bébés ramassent des feuilles : seules les feuilles VERTES de l'arbre sont bonnes à manger, les feuilles brunes tombées par terre ne le sont pas.
- Vocabulaire nouveau : dry leaf (la feuille sèche) · fresh / green leaf (feuille fraîche) · white flower (la fleur blanche) · stone (la pierre) · nap (la sieste). Réutilisé : eucalyptus, tree, bark, hug, sleepy, ears, nose, big/small, one-three.
- Débutant :
  - Papa : [social] "Shh! Daddy is sleepy. Zzz..." (Papa ne parle pas ; touche Papa → bâille) 
  - Maman : [identify] "Is this a green leaf?" (2 réponses : green leaf / dry leaf)
  - Bébé fille : [count] "How many white flowers?" (2 buissons : 1 ou 2)
  - Bébé garçon : [locate] "Find the big stone!" (la pierre de droite)
- Intermédiaire :
  - Papa : [observe] "Daddy is sleeping. Is he in the tree or next to the tree?" (2.3)
  - Maman : [sort] "Which leaf is good for koala? The green one or the brown one?" — 3 choix : green leaf / dry leaf / banana (1.6)
  - Bébé fille : [identify] "Can you find two white flowers on the left?" (1.2 + 1.3 + gauche/droite 3.2)
  - Bébé garçon : [compare] "Which stone is bigger?" (3.4)
- Cohérence : feuilles d'eucalyptus uniquement (les feuilles sèches sont un contre-exemple doux : « no, thank you ») ; aucun arbre autre que le gum tree grimpé.
- Points d'attention : les feuilles sèches (70,86,22,13) sont au bord bas : zone tactile peu accessible si le bandeau d'interface est bas. Proche d'`oc_eucalyptus` (voir ci-dessus).

### Koala · décor 3 — The rocky cove / la crique rocheuse
- Image : `Animaux/Oceanie/Koalas/Image ChatGPT 21 nov. 2026, 07_56_41-4.png` · Statut : déjà dans le jeu sous `oc_rocky_cove` (miroir : dans le jeu, la mer est à gauche et le pandanus à droite ; l'image source a le pandanus à gauche et la mer à droite)
- Ce qu'on voit (orientation du jeu, miroir) : mer turquoise à gauche (0,40,50,22) avec vague blanche (6,52,20,6) ; gros rochers orange au fond (52,37,26,15) et au premier plan (0,62,30,30) ; sable doré en courbe (32,76,34,18) ; à droite un pandanus à racines aériennes et fruits orange-jaune (79,2,21,30), gros tronc (78,0,22,70) ; gommier fin au fond (50,2,20,30) ; fleurs rouges en goupillon + grandes feuilles (84,72,16,22) ; soleil (2,0,12,14), nuages (28,3,20,12) ; colline (28,32,22,7).
- Histoire : vacances à la crique. Le koala s'installe à l'ombre du gommier ; les vagues font du bruit mais le koala ne nage pas, il reste sur son arbre. Les bébés comptent les rochers et comparent le chaud (sable au soleil) et le frais (ombre de l'arbre).
- Vocabulaire nouveau : sea (la mer) · wave (la vague) · sand (le sable) · sun (le soleil) · shade (l'ombre) · hot / cool (chaud / frais). Réutilisé : tree, rock, big/small, hug, claws, sleepy, eucalyptus, red flower.
- Débutant :
  - Papa : [social] "Zzz... Touch Daddy!" (sieste à l'ombre ; Papa ne parle pas)
  - Maman : [identify] "Is the sea blue?" (oui / non)
  - Bébé fille : [count] "How many big rocks?" (rochers du premier plan : 1 ou 2)
  - Bébé garçon : [locate] "Find the sun!" (soleil en haut)
- Intermédiaire :
  - Papa : [observe] "Is Daddy in the sun or in the shade?" (shade : 3 choix) (1.7, 2.3)
  - Maman : [identify] "Can koalas swim?" — "No, they climb!" / "Yes, they swim!" / "Yes, they fly!" (2.2)
  - Bébé fille : [locate] "Can you find something behind the big rock?" (2.3)
  - Bébé garçon : [compare] "Which rock is bigger?" (3.4)
- Cohérence : jamais dans l'eau ni sur le sable chaud pour manger ; l'arbre est le gommier du fond (pas le pandanus, dont les fruits ne se mangent pas) : l'ancre `gum_tree` (50,2,20,30) est bien celle trouvée par `koalaTree` avant `tree` (le pandanus).
- Points d'attention : trop semblable à la plage du lézard (voir Anomalies). Gommier du fond assez petit : agrandir la zone de toucher.

---

## Lézard à collerette (frilled_lizard) — Océanie
- Personnages : Papa Frankie (courageux, chapeau d'explorateur et sacoche), Maman Frida (rigolote, fleur d'hibiscus rose), Bébé fille (fleur rose), Bébé garçon (mot du bébé : hatchling ; en `newborn` ils sont encore dans leur œuf sur la planche, puis lézards de plus en plus grands avec collerette)
- Jeu propre existant : `lizard_frill` « Open your frill! » — couleur de la collerette (orange), « Hsss! », se chauffer sur le rocher (warm), sur/sous le rocher, insectes à compter (la banane/les feuilles = refus), courir sur deux pattes, longue queue. Mots déjà en jeu : frill, orange, hiss, rock, warm, bug, two legs, tail, long/short.
- Objectifs pédagogiques : 1.2 couleurs (orange, rouge, violet) ; 1.3 nombres (insectes, rochers) ; 1.7 sensations (chaud/froid, soleil) ; 2.2 capacités (grimper, courir sur deux pattes, pas voler) ; 2.3 localisation (sur le rocher, dans l'arbre) ; 3.3 routines (se réchauffer au matin, manger, dormir).
- Fil rouge des 3 décors : (1) outback = le matin froid, on se réchauffe sur le rocher face au grand rocher rouge ; (2) gorge = grimper à l'arbre bouteille (boab) pour voir la gorge ; (3) plage = course sur deux pattes dans le sable chaud, on cherche l'hibiscus.

### Lézard · décor 1 — The red outback / l'outback rouge
- Image : `Animaux/Oceanie/Lezards_A_Collerette/01_Outback_rouge.png` · Statut : déjà dans le jeu sous `oc_outback`
- Ce qu'on voit : tronc d'eucalyptus pelé à gauche (0,0,24,56) ; énorme rocher monolithe rouge au fond (51,30,40,16) ; rocher orange rond (15,53,20,18) et autres rochers (0,80,18,20, 85,82,15,18) ; buissons gris-argentés (0,60,12,18, 63,52,20,10) ; touffes d'herbe sèche (36,63,16,15) ; sable rouge (55,64,26,11) ; sentier rouge (42,76,32,16) ; cailloux (26,82,16,14) ; arbres plats à droite (88,18,12,32) ; nuages blancs (65,1,30,16).
- Histoire : au petit matin il fait un peu froid ; la famille monte sur le grand rocher orange pour se réchauffer. Quand le soleil chauffe, on ouvre la collerette et on chasse les petits insectes sur le sable rouge.
- Vocabulaire nouveau : red sand (le sable rouge) · hill / big red rock (le grand rocher rouge) · bush (le buisson) · morning (le matin). Réutilisé : rock, warm, frill, orange, bug, tail, tree, cloud.
- Débutant :
  - Papa : [guide] "Daddy opens his frill! Hsss!" ... préférer le jeu existant : "Brr! Touch the rock!" (`lizard_frill`)
  - Maman : [social] "Touch Mummy! Open your frill!" (existant)
  - Bébé fille : [count] "How many pebbles?" (cailloux du sentier : 2 ou 3)
  - Bébé garçon : [identify] "Is the sand red?" (oui/non). `newborn` : dans l'œuf, on touche l'œuf.
- Intermédiaire :
  - Papa : [locate] "Is Daddy on the rock or under the rock?" (existant, 3 choix) (2.3)
  - Maman : [identify] "Can you find a grey bush near the red rock?" (couleur + position) (1.2 + 2.3)
  - Bébé fille : [count] "How many bugs?" (existant)
  - Bébé garçon : [compare] "Which one is bigger, the red rock or the orange rock?" (3.4)
- Cohérence : insectes seulement ; se chauffe au soleil ; pas de banane, pas de feuilles.
- Points d'attention : monolithe rouge en fond (similaire au petit monolithe rose du point d'eau du kangourou, mais très différent en taille). Sable rouge et rochers rouges proches du décor 1 kangourou (voir Anomalies).

### Lézard · décor 2 — The red gorge / la gorge rouge
- Image : `Animaux/Oceanie/Lezards_A_Collerette/03_Gorges_Kimberley.png` · Statut : déjà dans le jeu sous `oc_gorge`
- Ce qu'on voit : falaises rouges à strates des deux côtés (57,2,30,36 à droite ; 14,12,36,28 à gauche) ; eau turquoise de la gorge au centre (34,52,12,42 environ ; zone du jeu 34,52,42,12) ; baobab/boab au tronc bulbeux blanc à droite (88,20,12,32) ; eucalyptus blanc à gauche (0,0,20,58) ; fleurs violettes à gauche (0,62,16,12) ; fleurs rouges en goupillon à droite (88,59,12,16) ; rochers orange (74,78,20,18) ; sentier sablonneux orange au centre (30,70,40,18) ; touffe d'herbe jaune (0,76,20,20) ; nuages (52,9,12,8).
- Histoire : au fond de la gorge, il fait chaud. Le lézard grimpe à l'arbre bouteille pour voir toute la gorge d'en haut, puis redescend à l'ombre des falaises. Les bébés cherchent les fleurs violettes et rouges.
- Vocabulaire nouveau : cliff (la falaise) · gorge · baobab (l'arbre bouteille) · purple flower (fleur violette) · climb (grimper) · up / down (en haut / en bas). Réutilisé : rock, water, red, orange, frill, tail, path.
- Débutant :
  - Papa : [identify] "Touch the baobab!" (arbre bulbeux à droite)
  - Maman : [social] "Mummy opens her frill! Hsss!" (existant)
  - Bébé fille : [locate] "Find the purple flower!" (violette à gauche)
  - Bébé garçon : [count] "How many red flowers?" (touffes à droite : 2 ou 3 — à compter sur l'image).
- Intermédiaire :
  - Papa : [guide] "Climb the baobab! Is Daddy up or down?" (3 choix) (2.2, 2.3)
  - Maman : [identify] "Which one is taller, the baobab or the tree?" (3.4)
  - Bébé fille : [locate] "Can you find a purple flower next to the rock?" (couleur + position) (1.2 + 2.3)
  - Bébé garçon : [observe] "What is Mummy doing?" — "She's climbing!" / "She's flying!" / "She's swimming!" (3.1, 2.2)
- Cohérence : grimpe (canon `can: climb`) ; insectes ; l'eau est un décor (pas de bain).
- Points d'attention : l'eau est au fond, étroite : zone tactile facile à rater, agrandir. Le baobab touche le bord droit de l'image (zone coupée selon le cadrage). Décor très différent des deux autres : bon.

### Lézard · décor 3 — The sunny beach / la plage ensoleillée
- Image : `Animaux/Oceanie/Lezards_A_Collerette/04_Cote_tropicale.png` (1754×897, ratio 1,96 au lieu de 1,78 des autres) · Statut : déjà dans le jeu sous `oc_beach`
- Ce qu'on voit : mer turquoise à droite (30,48,60,14) avec vagues blanches (30,58,36,8) ; sable doré en courbe (20,72,40,20) et sable mouillé (55,76,18,10) ; écume (46,66,18,8) ; gros rochers orange et ronds à droite (75,70,22,20) et au fond (18,35,16,18) ; branche d'eucalyptus en haut à gauche (0,0,16,46) ; hibiscus rouges à gauche (0,70,14,18) ; soleil rayonnant en haut à droite (86,0,12,14) ; montagnes bleues au loin (62,41,24,6) ; nuages (63,3,18,10) ; fougères/feuillage vert (0,38,16,30).
- Histoire : la famille traverse la plage chaude en courant sur deux pattes, de rocher en rocher. Les bébés cherchent l'hibiscus rouge et comptent les vagues, mais personne ne va dans l'eau.
- Vocabulaire nouveau : beach (la plage) · sea (la mer) · wave (la vague) · sand (le sable) · sun (le soleil) · hibiscus (la fleur rouge). Réutilisé : rock, run, two legs, hot, warm, red, big/small, frill.
- Débutant :
  - Papa : [identify] "Touch the sun!" (soleil en haut à droite)
  - Maman : [guide] "Run on two legs! Zoom!" (existant `run`)
  - Bébé fille : [locate] "Find the red flower!" (hibiscus à gauche)
  - Bébé garçon : [count] "How many big rocks?" (rochers de droite : 2 ou 3)
- Intermédiaire :
  - Papa : [observe] "Is the sand hot or cold?" — "It's hot!" / "It's cold!" / "It's blue!" (1.7)
  - Maman : [compare] "Which rock is bigger, the left one or the right one?" (3.4)
  - Bébé fille : [locate] "Can you find the red flower under the tree?" (2.3)
  - Bébé garçon : [observe] "What is Daddy doing?" — "He's running!" / "He's swimming!" / "He's flying!" (3.1, 2.2)
- Cohérence : insectes (sur les fleurs / dans le sable), pas de poisson ; ne nage pas.
- Points d'attention : trop semblable à la crique du koala (voir Anomalies) ; image plus large : vérifier que le cadrage n'écrase pas les coordonnées.

---

## Anomalies — Océanie

1. **Plages trop semblables — `Animaux/Oceanie/Koalas/Image ChatGPT 21 nov. 2026, 07_56_41-4.png` (`oc_rocky_cove`) et `Animaux/Oceanie/Lezards_A_Collerette/04_Cote_tropicale.png` (`oc_beach`).** Même recette : sable doré en courbe de bas-gauche vers le centre, mer turquoise à vagues blanches, groupe de gros rochers orange arrondis au fond et au premier plan, soleil et nuages gonflés, mêmes goupillons/hibiscus rouges en bas. Seules différences : pandanus + gommier (koala) contre branche + hibiscus (lézard). L'une des deux est de trop pour un enfant de 7 ans (même sensation de « même endroit »). Conséquence : le même décor deux fois. À faire : garder la plage du lézard (rochers + sable chaud = cohérent avec les reptiles) et déposer une autre image pour le koala (ex. eucalyptus au lever du soleil, colline à gommiers, brume du matin) ; à défaut, garder la crique en miroir mais ne l'utiliser QUE pour le koala (et retirer `oc_beach` au koala).
2. **Plage kangourou `Animaux/Oceanie/Kangourous/Paysage côtier australien ensoleillé-3.png`** : comparée aux deux autres, elle est nettement différente (brousse dorée à 60 % de l'image, mer en fine bande, sentier de terre, colline à crêtes de rochers) ; pas de doublon à craindre. Garder.
3. **Kangourou et lézard partagent aujourd'hui presque tous les décors** (`species.ts` `allowedBiomes` : kangaroo = oc_outback, oc_eucalyptus, oc_gorge, oc_beach, oc_fern_forest, oc_gum_woodland, oc_rocky_cove ; frilled_lizard = oc_outback, oc_eucalyptus, oc_gorge, oc_beach, oc_gum_woodland, oc_rocky_cove ; koala = oc_eucalyptus, oc_beach, oc_gum_woodland, oc_rocky_cove). À faire : kangaroo → `oc_red_plain`, `oc_waterhole`, `oc_bush_coast` ; koala → `oc_eucalyptus`, `oc_gum_woodland`, `oc_rocky_cove` ; lézard → `oc_outback`, `oc_gorge`, `oc_beach`. `oc_fern_forest` : aucune famille. `oc_beach` est actuellement permis au koala : à retirer.
4. **Trois décors du kangourou absents du jeu** (`oc_red_plain`, `oc_waterhole`, `oc_bush_coast`) : aucune entrée dans `src/content/places/oceania.json`, aucun fond généré, aucune zone (anchors), ni `depth.ts`, ni liste de mots par décor (`src/content/activities/africa.ts` ~l.500 : `ANCHOR_WORDS`). Conséquence : pas de parcours kangourou propre. À faire : créer les 3 places (coordonnées proposées plus haut) + `depth.ts` (ligne d'horizon, eau de l'étang) + mots.
5. **Aventures et adventures partagées par décor** (`src/content/adventures/oceania.ts` ligne 126 `go('oc_fern_forest', ...)`, et lignes 211-214 : `oceania_forest_stars` start `oc_eucalyptus` avec `kangaroo`, `koala`, `frilled_lizard` ; `oceania_coconut_thump` start `oc_beach` avec les trois ; `oceania_waterfall_crystal` start `oc_eucalyptus` avec les trois). Conséquence : après le découpage, kangourou et lézard n'auront plus `oc_eucalyptus` ; koala n'aura plus `oc_beach` ; l'étape `oc_fern_forest` mène à un lieu retiré. À faire : réassigner chaque aventure à un décor de chaque famille (ou la limiter à l'espèce qui y vit) et retirer le saut vers `oc_fern_forest`. Tests à ajuster : `src/engine/species_oceania.test.ts`, `world.test.ts`, `ecran.test.ts`.
6. **Mots d'`oc_fern_forest` à replacer** (waterfall, fern, tree fern, mossy stone, rapids) : `waterfall` vit déjà dans `oc_eucalyptus` (koala), `rapids`/`mossy stone`/`fern` n'ont plus de lieu : à replacer ou abandonner.
7. **Personnages : OK.** `src/content/assetManifest.json` et `public/assets/characters/` contiennent bien, pour `kangaroo`, `koala` et `frilled_lizard`, les 10 entrées (`<id>_father`, `<id>_mother`, `<id>_girl_{newborn,little,young,companion}`, `<id>_boy_{newborn,little,young,companion}`), toutes en `.webp` non vides (12 à 95 Ko). Les trous des dossiers sources (koala : `Koalas/koala/` contient bien stades 1-4 ×2 sexes ; kangourou : stades 1-2 aussi en vrac dans `Kangourous/` et 1-4 dans `Kangourous/kangourou/`) sont donc sans effet sur le jeu : aucun personnage ni phase manquants. Mini-points : `koala_girl_newborn.webp` fait 252×185 (couchée, format paysage) contre ~183×220 pour les autres espèces — OK pour l'image « couchée » mais à valider à l'écran ; les bébés lézard `newborn` sont dans l'œuf sur la planche (`Lezards_A_Collerette/Famille de lézards à collerette.png`) : les interactions de nouveau-né se limitent à toucher l'œuf, pas d'action de marche.
8. **Image `Animaux/Oceanie/Lezards_A_Collerette/04_Cote_tropicale.png`** a un format différent (1754×897, ratio 1,96) des autres décors (1672×941, ratio 1,78) : cadrage ou étirement possible, coordonnées des zones à revérifier à l'écran.
9. **Koala en `oc_rocky_cove` : l'ancre `tree` (pandanus, 78,0,22,70) n'est pas un arbre de koala.** `koalaTree` choisit d'abord `eucalyptus`, puis `gum_tree` (50,2,20,30), puis `tree` : le gommier est bien pris, mais l'ancre `tree` laisse le pandanus à toucher pour « Where is my tree? » si `gum_tree` disparaît. À faire : garder `gum_tree` ; ne jamais fallback sur le pandanus.
10. **Koala et eau** : `species.ts` indique `cannot: swim` et `drinkStyle: 'none'` ; aucun parcours proposé ne met le koala dans l'eau, aucun ne le fait boire. Les décors 1 (cascade) et 3 (mer) du koala ont de l'eau en décor seulement.
11. **Fichier ancien** : `source` de `oc_outback`, `oc_eucalyptus`, `oc_gorge`, `oc_beach`, `oc_fern_forest` pointe vers `Continant/Oceanie/…` (faute « Continant »), alors que les images actuelles sont dans `Animaux/Oceanie/…` ; vérifier que `oc_fern_forest` (`05_Foret_fougeres_Tasmanie.png`) existe encore côté sources avant de retirer.
12. **Débutant — à ne pas toucher** : tous les exemples proposés utilisent les types existants (`locate`/`identify`/`count`/`guide`/`social`/`observe`, 2 réponses). Les propositions « compare », « sort » et les positions (behind, next to, near) sont réservées à l'intermédiaire.


---

# Océan — 3 familles marines × 2 fonds (cartographie du 2026-11-23, lecture seule)

Consigne du parent respectée : on conserve les images disponibles, on n'invente ni personnage ni phase de croissance,
on documente ce qui manque et ses conséquences. L'océan se traite APRÈS les continents. Tout ce qui dépend d'images
absentes est marqué **[DÉPEND D'IMAGES MANQUANTES]**. Mécaniques citées = celles de `src/content/archetypes.ts`
(`count`, `identify`, `locate`, `observe`, `compare`, `fetch`, `social`, `guide`, `talk`…). Prénom de test : Mia.

## État actuel du code (analysé d'abord)
- **Aucune espèce marine dans `src/content/species.ts`** (ni baleine, dauphin, tortue). Le seul animal marin « famille » est le
  phoque (`seal`, Antarctique, décors `ice_coast`, `open_sea`, `an_aurora`).
- Les 3 animaux marins vivent uniquement comme **jeux bonus** (`src/content/sea.ts`, `src/engine/sea.ts`, `src/ui/SeaBonus.tsx`,
  appel depuis `src/ui/WorldMap.tsx` et `src/ui/App.tsx`) : baleine « Count my splashes! » (compter 1 à 5 jets, 3 manches),
  tortue « Find it! » (poisson, crabe, coquillage, pieuvre), dauphins « Big or little? » (grand/petit dauphin : saute, nage,
  éclabousse). Le commentaire d'en-tête de `sea.ts` dit explicitement : « Ces animaux ne sont pas des familles (pas de bébés) :
  ce sont des amis de passage, hors des continents ». **Ce principe est contredit par la décision du 2026-11-23 (3 familles
  marines) : il faudra le réviser.**
- Images déjà dans le jeu : `public/assets/sea/{whale,turtle,dolphin_big,dolphin_little}.webp` (petites découpes posées sur la
  carte) et `*_hd.webp` (fabriquées par `scripts/sea_hd.py` à partir de `Ocean map/`). `sea_hd.py` a déjà détouré ces
  images (baleine : « faux damier retiré » ; dauphins : séparés, chacun avec son éclaboussure) : un détourage de la planche
  verte actuelle est donc à refaire/adapter, les sources sont maintenant des planches vertes différentes.
- Voix actuelles des jeux bonus : baleine = `father`, tortue = `mother`, dauphin grand = `boy`, petit = `girl`. Le grand
  dauphin (adulte) parle avec la voix du garçon : incohérent avec un « Papa/Maman » adulte, à revoir.
- Aucun `ContinentId` « ocean » (`src/content/types.ts` ligne 3) : un 8e « continent » (ou un regroupement marin) est à créer,
  avec décors `places/ocean.json`, `allowedBiomes`, etc.
- `assetManifest.json` : 0 entrée baleine/dauphin/tortue. `public/assets/characters/` : 204 fichiers, aucun marin.

## Croissance (src/engine/family.ts) — ce qui se passe si on joue SANS les images manquantes
- `computeStage()` ne dépend que de compteurs (`seen`, `retained`, `activities`) : la logique de passage
  newborn → little → young → companion **fonctionne sans image** (seuils 6/2/2, 16/6/5, 30/12/9). Elle ne regarde pas les sprites.
- Mais l'interface affiche `<id>_<girl|boy>_<stage>` et `<id>_father` / `<id>_mother` : sans fichier, l'enfant voit une image
  cassée/vide (ou le jeu plante selon le chargeur de `assetManifest`). Donc **créer une famille marine complète sans images
  est impossible proprement**.
- Conséquences de chaque option, sans rien inventer :
  1. **Mode « duo adulte + petit » (recommandé, aucune image à créer)** : 2 personnages seulement par famille, le petit reste
     le même (pas de 4 phases, pas de choix fille/garçon, pas de naissance, pas de nom donné par la joueuse). Il faut un
     mode explicite dans `species.ts` (ex. famille « sans croissance ») qui court-circuite `computeStage` (le stade reste
     fixe) et la scène de naissance. La barre de croissance du passeport (`Passport.tsx`, `nextStageGoal`) et l'album de
     stades (`engine/album.ts`) doivent être masqués pour ces familles. Les mots appris restent comptés (`seen`/`retained`).
  2. **Un seul bébé « neutre »** : même chose, mais le petit peut être nommé. Le sexe est **non déterminable sur l'image**
     (nommer « Baby » sans fille/garçon).
  3. **Famille complète 4 personnages × 4 phases** : exige les 18 images par famille listées ci-dessous (54 au total).
- Autres éléments touchés : `src/game/rigs.ts` (rig de marionnette `<id>_father`…) : nage/queue différentes des rigs terrestres
  (pas de pattes à animer) ; `engine/sea.ts` et `ui/SeaBonus.tsx` à reconsidérer (jeux bonus conservés tels quels, ou
  intégrés comme jeu propre de la famille) ; voix des 4 rôles à réattribuer.

## Images manquantes — liste exacte (pour la famille complète)
Par famille `<id>` = `whale`, `dolphin`, `sea_turtle` (ids proposés ; `turtle` serait ambigu avec une tortue terrestre future) :
- `public/assets/characters/<id>_father.webp` (Papa, apparence fixe)
- `public/assets/characters/<id>_mother.webp` (Maman, apparence fixe)
- `public/assets/characters/<id>_girl_newborn.webp`, `<id>_girl_little.webp`, `<id>_girl_young.webp`, `<id>_girl_companion.webp`
- `public/assets/characters/<id>_boy_newborn.webp`, `<id>_boy_little.webp`, `<id>_boy_young.webp`, `<id>_boy_companion.webp`

Soit **10 fichiers par famille, 30 au total** (2 adultes + 8 bébés), à partir de planches sources à fournir par le parent
(1 planche par famille : Papa, Maman, bébé fille ×4 stades, bébé garçon ×4 stades, sur fond vert uni, sans bulles
semi-transparentes qui laissent des franges vertes). Aujourd'hui : **1 adulte + 1 petit par famille** = 2 personnages sur
10 (ni Papa/Maman distincts, ni fille/garçon, ni phases). Le brief mentionne « 18 images » : le décompte exact est **10 par
famille** (2 adultes + 2 sexes × 4 phases).

---

## Baleine à bosse (whale) — Océan (Antarctique d'après les 2 fonds)
- Image d'animaux : `Animaux/Ocean map/Baleine/Baleines à bosse complices.png` — 1536×1024, RGB (pas d'alpha), **fond vert
  uni (#00FF00)** à détourer. Montre **2 individus** : 1 grande baleine à bosse (adulte, bosses/pustules blanches sur la tête,
  longues nageoires pectorales à bords blancs, queue relevée à gauche) et 1 baleineau (petit, bouche ouverte souriante),
  au premier plan bas-gauche, chevauchant l'adulte (la nageoire du petit passe devant le ventre, la queue du petit touche
  presque le bord gauche). Un seul adulte : **on ne sait pas si c'est Papa ou Maman**, et le petit n'a pas de sexe visible.
- Personnages : Papa ? / Maman ? (non séparables aujourd'hui), Bébé fille / Bébé garçon (mot : `calf`, fr « baleineau »).
- **Ce qu'on peut faire SANS inventer** : 2 personnages — « Adulte » (au choix Papa **ou** Maman, un seul des deux) et
  « Baleineau » (sans sexe, sans phases). Détourage du vert : bords plutôt nets, nageoires à franges blanches (surveiller la
  frange verte sur les bords blancs des nageoires et les pustules). L'adulte et le petit **se touchent** : à détourer en
  une seule image ou à séparer avec soin (le petit masque une partie du ventre/de la nageoire de l'adulte, la nageoire
  gauche de l'adulte masque le petit : séparation propre impossible sans reconstitution → une planche « duo » en un seul bloc
  est plus sûre).
- Jeu propre existant : `whale` « Count my splashes! » (bonus) — compter 1 à 5 jets d'eau ; mots : one…five, splash.
- Objectifs pédagogiques : 1.1 salutations/premiers mots (bonjour de la baleine), nombres 1-5 (jets, bulles, étoiles de mer),
  grand/petit (adulte/baleineau), couleurs (orange, violet, bleu, blanc), positions (derrière un iceberg).
- Fil rouge des 2 décors : le 1er (cathédrale de glace) tourne autour de la **grotte de glace lumineuse** et de la lumière
  qui descend ; le 2e (panorama) autour de **colonnes de bulles** et du **fond de sable blanc** ouvert où l'on voit loin.
  Seuls 2 décors : la répétition vient des mots des deux fonds (étoile de mer, oursin, anémone, glace).

### Baleine · décor 1 — Ice cathedral / Cathédrale de glace sous-marine
- Image : `Animaux/Ocean map/Baleine/Cathédrale de glace sous-marine-2.png` (1671×941) · Statut : NOUVEAU
  (id proposé `ocean_ice_cathedral`)
- Ce qu'on voit : à gauche, un grand bloc de glace avec **une grotte voûtée qui brille en turquoise** (x≈5-30 %, y≈45-65 %) et
  de **gros glaçons pendants** en haut-gauche ; au centre-haut, un **bloc de glace flottant** et des **rayons de soleil** qui
  descendent ; à droite, des plates-formes de glace ; au fond centre, un petit iceberg. Sol de **sable blanc** ridé de reflets.
  Devant : en bas-gauche **une étoile de mer orange** (x≈12-22 %, y≈85-95 %) sur un rocher, **2 oursins violets** (x≈0-8 % et
  x≈30-38 %, y≈85-95 %), une **anémone orange** (x≈0-10 %, y≈62-75 %) ; en bas-droite **2 anémones orange** (x≈88-97 %, y≈75-90 %)
  et **des algues vertes** (x≈78-90 %, y≈60-80 %). Quelques grosses bulles (3-4) au centre-gauche. Zones assez grandes pour un
  doigt : l'étoile de mer, la grotte, l'anémone droite, le bloc flottant, les rochers.
- Histoire : le baleineau veut voir la grotte qui brille. Maman/Papa nage devant, ils comptent les oursins et les anémones
  en chemin, puis ils passent sous le bloc de glace flottant jusqu'à la grotte. À la fin, la grotte s'allume en turquoise.
- Vocabulaire nouveau : ice (glace) · cave (grotte) · starfish (étoile de mer) · sea urchin (oursin) · seaweed (algue) ·
  Vocabulaire réutilisé : big/little, one…five, orange, purple, blue, white, Daddy/Mommy, baby, splash.
- Débutant (2 réponses) — **[DÉPEND D'IMAGES MANQUANTES]** pour les rôles Papa/Maman et fille/garçon : avec le duo, on ne
  joue que « Adulte » et « Baleineau » ; les phrases ci-dessous valent pour ce duo.
  - Papa (ou le seul adulte) : [locate] "Find the cave!" (Trouve la grotte !) ; [count] "How many sea urchins?" (2).
  - Maman : [identify] "Is this a starfish?" (oui/non sur l'étoile orange) ; **si Maman n'existe pas, cette ligne passe à l'adulte**.
  - Bébé fille : [identify] "Touch the orange anemone!" **[nécessite un bébé fille]** → sinon le baleineau neutre.
  - Bébé garçon : [locate] "Where is the ice?" **[nécessite un bébé garçon]** ; sinon omis.
- Intermédiaire (3 réponses) :
  - Adulte : [locate] "Can you find something under the ice?" (position under) ; [compare] "Which one is bigger, the whale or the baby?".
  - Baleineau : [count] "Can you find two purple sea urchins?" (couleur + nombre) ; [observe] "What is the baby doing?".
- Cohérence : la baleine à bosse vit réellement en eaux froides polaires (Antarctique) : cohérent avec le décor. Nourriture :
  krill/petits poissons — **ne montrer aucun repas** (rien dans l'image ne le montre) ; pas de prédation. Pas de poissons visibles
  dans le décor, donc ne pas faire « trouver les poissons ». Capacités : swim, dive, splash ; pas de grimpe/vol.
- Points d'attention : **très proche du décor 2** (voir Anomalies). Les anémones « orange » de fond froid sont stylisées
  (coraux d'aspect tropical sous la glace) : acceptable, ne pas dire « coral ». Sol blanc sans relief : peu de zones à toucher au centre.

### Baleine · décor 2 — Open ice panorama / Panorama sous-marin de l'Antarctique
- Image : `Animaux/Ocean map/Baleine/Panorama sous-marin de l’Antarctique-1.png` (1672×941) · Statut : NOUVEAU
  (id proposé `ocean_antarctic_panorama`)
- Ce qu'on voit : même type de scène, **plus ouverte** : en haut gauche/droite des glaçons, au centre un **iceberg-bloc** (x≈15-40 %,
  y≈40-65 %) et des plates-formes de glace à droite ; **3 colonnes de bulles** montantes (x≈14 %, x≈30 %, x≈80-92 %) ; au fond,
  grande étendue de **sable blanc** reflets. Devant : en bas-gauche **grande anémone orange à tentacules** (x≈0-14 %, y≈50-72 %),
  **étoile de mer orange** (x≈15-27 %, y≈80-90 %), **oursin violet** (x≈1-10 %, y≈78-92 %) ; en bas-droite **oursin violet**
  (x≈92-100 %, y≈68-80 %), **anémone orange** (x≈80-90 %, y≈60-70 %), rochers enneigés. Pas de grotte.
- Histoire : le baleineau suit les colonnes de bulles qui montent jusqu'au soleil. L'adulte l'invite à compter les bulles puis à
  retrouver l'étoile de mer posée sur le rocher de neige. Au bout, ils nagent ensemble dans la lumière.
- Vocabulaire nouveau : bubble (bulle) · snow (neige) · sand (sable) · rock (rocher) · light (lumière) ·
  Vocabulaire réutilisé : starfish, sea urchin, ice, orange, purple, one…five, big/little.
- Débutant :
  - Papa/adulte : [count] "How many bubbles?" (colonne de bulles à gauche) ; [locate] "Find the starfish!".
  - Maman : [identify] "Is this a sea urchin?" ; **[nécessite Maman distincte]**.
  - Bébé fille : [identify] "Touch the purple sea urchin!" **[nécessite bébé fille]**.
  - Bébé garçon : [locate] "Where is the sand?" **[nécessite bébé garçon]**.
- Intermédiaire :
  - Adulte : [locate] "Is the baby next to Mommy?" ; [compare] "Which anemone is bigger?".
  - Baleineau : [count] "Can you find two orange things?" (anémone + étoile : couleur + quantité) ; [locate] "Can you find something behind the rock?".
- Cohérence : mêmes règles que le décor 1. Aucune nourriture dans l'image : ne rien faire manger. Pas de danger.
- Points d'attention : **même composition que le décor 1** ; ici les zones à toucher sont plus petites au centre (sable blanc vide).

---

## Dauphin (dolphin) — Océan (eaux claires, tropicales/tempérées)
- Image d'animaux : `Animaux/Ocean map/Dauphin/Dauphins joyeux dans l’océan.png` — 1536×1024, RGB, **fond vert uni (#00FF00)**.
  Montre **2 individus** : 1 grand dauphin adulte (à droite, souriant, œil bleu à cils, bouche ouverte) et 1 petit (bas-gauche,
  souriant), avec **de nombreuses bulles semi-transparentes** derrière leurs queues. Aucun sexe visible. Les deux se
  chevauchent peu (la queue du petit passe sous le ventre de l'adulte).
- Personnages : Papa ? / Maman ? (un seul adulte), Bébé fille / Bébé garçon (mot : `calf`, fr « bébé dauphin »).
- **Ce qu'on peut faire SANS inventer** : 2 personnages « Adulte » et « Petit ». Les bulles verdâtres sont le principal
  problème de détourage (franges vertes sur les bulles) : à supprimer ou à reconstituer ; `sea_hd.py` sait déjà séparer les
  deux dauphins avec leur éclaboussure (existant, à reprendre). **Voix actuelles** : grand = voix `boy`, petit = voix `girl` ;
  à reconsidérer si le grand devient Papa/Maman.
- Jeu propre existant : `dolphins` « Big or little? » (bonus) — « Big dolphin, jump! » ; mots : big, little, jump, swim, splash.
- Objectifs pédagogiques : grand/petit (déjà fait par le jeu bonus), verbes d'action jump/swim/splash, couleurs (orange,
  jaune, violet, vert, rose du récif), nombres (poissons rayés, bulles), positions (dans l'arche).
- Fil rouge des 2 décors : le 1er (paradis lumineux, récif de corail) est un jeu de **poissons à compter et de couleurs de
  coraux** ; le 2e (canyon de kelp) est un jeu de **passages : arches de pierre, algues hautes, nager à travers**.

### Dauphin · décor 1 — Bright paradise / Paradis sous-marin lumineux
- Image : `Animaux/Ocean map/Dauphin/Paradis sous-marin lumineux pour dauphins.png` (1672×941) · Statut : NOUVEAU
  (id proposé `ocean_bright_reef`)
- Ce qu'on voit : **arche de rocher moussu** à gauche (x≈5-30 %, y≈25-60 %) couverte de coraux ; coraux roses violets (x≈0-10 %, y≈30-50 %),
  **éponge-tuyaux jaune** (x≈0-6 %, y≈55-70 %) ; **étoile de mer orange** sur un rocher en bas-gauche (x≈10-22 %, y≈82-92 %) ; **banc de petits
  poissons argentés** (x≈30-45 %, y≈28-36 %) ; **6 poissons rayés jaunes/noirs** au centre-droit (x≈63-73 %, y≈40-48 %) ; à droite
  **corail orange en branches** (x≈88-100 %, y≈55-75 %), corail rose, rochers ; sable doré avec reflets en bas-centre. Algues vertes en haut-gauche et haut-droite.
- Histoire : le petit dauphin joue à compter les poissons rayés puis nage à travers l'arche de corail. L'adulte lui montre
  l'étoile de mer sur son rocher ; ils plongent dans les rayons de lumière.
- Vocabulaire nouveau : coral (corail) · arch (arche) · fish (poisson) · yellow (jaune) · sand (sable) ·
  Vocabulaire réutilisé : starfish, orange, pink, purple, one…five, big/little, jump, swim, splash.
- Débutant :
  - Papa/adulte : [count] "How many yellow fish?" (6 : au débutant, n'en faire compter que 3 ou donner 2 choix ≤ 5) ; [locate] "Find the arch!".
  - Maman : [identify] "Is this a fish?" ; **[nécessite Maman distincte]**.
  - Bébé fille : [locate] "Touch the pink coral!" **[nécessite bébé fille]**.
  - Bébé garçon : [identify] "Touch the orange starfish!" **[nécessite bébé garçon]**.
- Intermédiaire :
  - Adulte : [locate] "Can you find the baby behind the coral?" ; [action] "What is the baby doing?" (swim, jump).
  - Petit : [count] "Can you find two pink corals?" ; [compare] "Which coral is bigger?".
- Cohérence : dauphin = poissons (foods : fish) mais **ne jamais faire manger les poissons du décor** (on voit des poissons : aucune
  prédation montrée). Pas de tortue ni autre animal. Capacités : swim, jump, splash ; pas de marche/vol.
- Points d'attention : **quasi-identique à la tortue « Canyon sous-marin aux rayons turquoise »** (voir Anomalies). Ce décor est
  ouvert, bien lumineux : bon pour un enfant.

### Dauphin · décor 2 — Enchanted kelp canyon / Canyon sous-marin enchanté aux forêts de kelp
- Image : `Animaux/Ocean map/Dauphin/Canyon sous-marin enchanté aux forêts de kelp.png` (1672×941) · Statut : NOUVEAU
  (id proposé `ocean_kelp_canyon`)
- Ce qu'on voit : **grande arche de pierre moussue** en haut-gauche (x≈10-42 %, y≈15-55 %), **seconde arche lointaine** au centre
  (x≈50-70 %, y≈48-70 %), très grandes **feuilles de kelp vertes** devant à gauche (x≈0-15 %) et droite (x≈83-100 %), **hautes algues fines**
  entre les arches, **rochers bleu-gris moussus** en bas-droite, sol de dalles ondulantes bleu en bas-centre, **bulles** dispersées
  (≈10 visibles), lumière du haut. **Aucun poisson, aucun corail, aucun sable.**
- Histoire : le dauphin traverse un canyon de pierre en suivant les bulles. Il faut passer sous la 1re arche, puis choisir la
  2e arche au fond, pendant que le petit se cache derrière les algues pour qu'on le retrouve.
- Vocabulaire nouveau : kelp (kelp) · stone (pierre) · bubble (bulle) · green (vert) · gate/arch (arche) ·
  Vocabulaire réutilisé : big/little, swim, jump, blue, hide (cacher), behind.
- Débutant :
  - Papa/adulte : [locate] "Find the big arch!" ; [count] "How many arches?" (2).
  - Maman : [identify] "Touch the green leaf!" **[nécessite Maman distincte]**.
  - Bébé fille : [locate] "Where is Baby Girl?" (cachée derrière une algue) **[nécessite bébé fille]**.
  - Bébé garçon : [count] "How many bubbles?" (limiter à 3 entourées) **[nécessite bébé garçon]**.
- Intermédiaire :
  - Adulte : [locate] "Can you find something behind the kelp?" ; [compare] "Which arch is bigger?".
  - Petit : [observe] "Where is the baby hiding?" (3 choix : kelp, rock, arch) ; "Is the baby next to Daddy?".
- Cohérence : forêts de kelp réelles en eaux tempérées/fraîches ; dauphin y nage normalement. Aucune nourriture montrée.
- Points d'attention : image **sans coraux ni poissons** : vocabulaire plus pauvre (nager, arche, algue, bulle) → compenser par la
  répétition des mots du décor 1. Bonne différence visuelle avec le décor 1.

---

## Tortue de mer (sea_turtle) — Océan (récifs tropicaux)
- Image d'animaux : `Animaux/Ocean map/Tortue/Tortues de mer joyeuses en nageant.png` — 1536×1024, RGB, **fond vert uni**.
  Montre **2 individus** : 1 grande tortue de mer adulte (carapace brun-orange, tête à droite, bouche ouverte souriante, œil brun)
  et 1 petite tortue (bas-gauche, même motif, souriante). La nageoire avant de l'adulte tombe devant son ventre ; la
  petite est en grande partie dégagée. **Pas de bulles**, donc le détourage est le plus simple des trois. Sexe non visible.
- Personnages : Papa ? / Maman ? (un seul adulte), Bébé fille / Bébé garçon (mot : `hatchling`, fr « bébé tortue » ; le petit
  est ici un jeune plutôt qu'un nouveau-né vu sa taille).
- **Ce qu'on peut faire SANS inventer** : 2 personnages « Adulte » et « Petit », sans phases. À noter : la tortue est la seule
  famille marine dont l'adulte nage **vers le haut-droite** (tête haute) — à l'inverse de la baleine et du dauphin.
- Jeu propre existant : `turtle` « Find it! » (bonus) — trouver poisson, crabe, coquillage, pieuvre ; mots : fish, crab, shell, octopus.
  **Attention** : ces 4 choses ne sont pas toutes visibles dans les décors tortue (poisson et hippocampe seulement) ; adapter la liste
  au décor.
- Objectifs pédagogiques : 1.1, couleurs (nombreuses), formes (rond/rayé), compter (poissons, coraux, bulles), grand/petit
  (adulte/petit), positions (derrière le corail), mots du récif.
- Fil rouge des 2 décors : le jardin corallien est un **jeu de couleurs et de petits habitants du récif** (clownfish, hippocampe,
  éponges) ; le canyon est un **jeu de chemin et de lumière** (arche, banc de poissons). Mais voir Anomalies : le canyon est très
  proche du décor « paradis » du dauphin.

### Tortue · décor 1 — Coral garden / Jardin corallien sous-marin éclatant
- Image : `Animaux/Ocean map/Tortue/Jardin corallien sous-marin éclatant.png` (1672×941) · Statut : NOUVEAU
  (id proposé `ocean_coral_garden`)
- Ce qu'on voit : style **plus dessiné, plus vif** que les autres. En haut-gauche **3 poissons-clown orange et blancs** (x≈20-30 %,
  y≈20-30 %) ; en haut-droite **2 poissons bleus et jaunes** (x≈75-83 %, y≈12-18 %) et **un hippocampe orange** (x≈82-86 %, y≈22-33 %) ;
  **banc de petits poissons sombres** (x≈62-72 %, y≈30-38 %) ; coraux roses, orange, violets partout, **éponges-tuyaux orange** à
  gauche et à droite ; **étoile de mer jaune** sur un rocher en bas-gauche (x≈11-22 %, y≈78-92 %) ; **arche de rocher moussu** à
  droite (x≈70-88 %, y≈35-55 %) ; grand sable doré avec reflets au centre-bas ; algues vertes très hautes à gauche et à droite.
- Histoire : la petite tortue part à la recherche du poisson-clown caché dans le jardin. Elle compte les poissons, croise un
  hippocampe, puis rejoint l'adulte sur le sable doré.
- Vocabulaire nouveau : clownfish/fish (poisson) · seahorse (hippocampe) · coral (corail) · sponge (éponge) · sand (sable) ·
  Vocabulaire réutilisé : starfish, orange, pink, purple, yellow, blue, one…five, big/little, swim.
- Débutant :
  - Papa/adulte : [identify] "Is this a seahorse?" ; [locate] "Find the orange fish!".
  - Maman : [count] "How many clownfish?" (3) **[nécessite Maman distincte]**.
  - Bébé fille : [locate] "Touch the pink coral!" **[nécessite bébé fille]**.
  - Bébé garçon : [locate] "Where is the yellow starfish?" **[nécessite bébé garçon]**.
- Intermédiaire :
  - Adulte : [count] "Can you find two blue fish?" (couleur + nombre) ; [locate] "Can you find something near the arch?".
  - Petit : [compare] "Which coral is bigger?" ; [observe] "What is the seahorse doing?".
- Cohérence : tortue de mer = herbivore/algues, méduses (selon l'espèce) : **ne pas faire manger de poisson ni de crabe**.
  On voit des poissons : aucune prédation. Nourriture à montrer : `seagrass` / algues seulement (pas de corail à manger).
- Points d'attention : **style graphique plus plat/cartoon** que le fond « Canyon » de la même famille ; très riche en éléments
  (zone à toucher pour poisson-clown et hippocampe assez petite : agrandir à ≥10 % de la largeur).

### Tortue · décor 2 — Turquoise canyon / Canyon sous-marin aux rayons turquoise
- Image : `Animaux/Ocean map/Tortue/Canyon sous-marin aux rayons turquoise.png` (1672×941) · Statut : NOUVEAU
  (id proposé `ocean_turquoise_canyon`)
- Ce qu'on voit : **même composition que le « Paradis » du dauphin** mais **plus sombre et plus bleu profond** : arche rocheuse à
  gauche (x≈5-28 %, y≈20-60 %), **banc de poissons argentés** au centre-haut (x≈30-50 %, y≈25-38 %), **4 poissons rayés
  jaunes/noirs** à droite (x≈82-90 %, y≈50-60 %), gros coraux rose-violet à gauche, **éponge-tuyaux jaune** (x≈0-8 %, y≈68-82 %),
  **étoile de mer orange** (x≈8-18 %, y≈83-95 %), corail orange à droite (x≈88-100 %, y≈70-90 %), grands rochers falaise au fond ;
  sable bleu pâle avec reflets en bas-centre.
- Histoire : la tortue guide le petit à travers l'arche vers la falaise du fond, compte les poissons rayés au passage et
  s'arrête auprès de l'étoile de mer pour se reposer.
- Vocabulaire nouveau : canyon/cliff (falaise) · arch (arche) · stripe/striped (rayé) · deep (profond) ·
  Vocabulaire réutilisé : fish, starfish, coral, sponge, orange, yellow, pink, big/little, swim.
- Débutant : Papa/adulte : [locate] "Find the arch!" ; Maman : [count] "How many striped fish?" (4 → limiter à 3 choix) ;
  Bébé fille : [identify] "Touch the orange starfish!" ; Bébé garçon : [locate] "Where is the yellow sponge?"
  (Maman/fille/garçon : **[nécessitent les personnages manquants]**).
- Intermédiaire : Adulte : [locate] "Can you find something behind the arch?" ; Petit : [compare] "Which rock is bigger?" ;
  "Is the baby next to the starfish?".
- Cohérence : idem tortue décor 1 (aucune prédation montrée).
- Points d'attention : **quasi-doublon visuel du Paradis dauphin** → à remplacer ou différencier (voir Anomalies).

---

## Anomalies — Océan

1. **Décors trop semblables, famille baleine** — `Animaux/Ocean map/Baleine/Cathédrale de glace sous-marine-2.png` et
   `Animaux/Ocean map/Baleine/Panorama sous-marin de l’Antarctique-1.png` : **même scène recadrée/rejouée**, même sol de sable blanc
   et rayons au centre, mêmes éléments en bas (anémone orange, étoile de mer sur rocher, oursins violets, rochers), même ciel de
   glaçons. Différences réelles mais faibles : le décor 1 a la **grotte de glace lumineuse** à gauche et le plafond de glace
   dominant ; le décor 2 a les **colonnes de bulles** et un sol plus dégagé, sans grotte. **Tranche : on garde les deux** (le parent
   n'a fourni que ces deux fonds pour la baleine) mais on les distingue par **l'élément qui n'existe que dans l'un** : grotte de
   glace (décor 1) / colonnes de bulles (décor 2). Prévenir le parent que la ressemblance est forte ; si possible lui
   demander un 2e fond vraiment différent (ex. iceberg vu depuis la surface, banc de krill).
2. **Doublon inter-famille** — `Animaux/Ocean map/Dauphin/Paradis sous-marin lumineux pour dauphins.png` et
   `Animaux/Ocean map/Tortue/Canyon sous-marin aux rayons turquoise.png` : **même composition** (arche gauche, éponge jaune,
   étoile de mer orange bas-gauche, banc argenté en haut, poissons rayés à droite, corail orange à droite), seule la palette
   change (clair/doré pour le dauphin, sombre/bleu profond pour la tortue). Joués côte à côte, l'enfant verra « le même
   décor ». **Tranche : garder le Paradis pour le dauphin (le plus lumineux, avec sable doré) et demander au parent un autre fond
   pour la tortue** (ex. prairie d'herbiers/seagrass, épave douce, plage de ponte vue sous l'eau). À défaut, garder le canyon
   en l'utilisant comme décor profond, mais ne l'ouvrir qu'après le jardin corallien.
3. **`Dauphin/Canyon sous-marin enchanté aux forêts de kelp.png` vs Paradis dauphin** : **pas trop proches** (kelp + arches de
   pierre + aucun corail ni poisson, contre corail + poissons + sable doré). Garder les deux ; c'est le meilleur couple de la
   famille.
4. **Aucune espèce marine dans `src/content/species.ts`** : whale, dolphin, sea_turtle sont à créer (`sp({...})` avec
   `continentId` inexistant « ocean » → créer ce `ContinentId`), `foods` (krill, fish, seagrass), `notFoods`, `can`/`cannot`,
   `father`/`mother` (prénoms), `babyWord` (`calf` / `calf` / `hatchling`). Conséquence : tant que ce n'est pas fait, aucune famille
   marine n'est jouable ; seuls les 3 jeux bonus fonctionnent.
5. **Personnages manquants** (`public/assets/characters/`, `src/content/assetManifest.json`) : pour chacune des 3 familles,
   **absents** : `<id>_father`, `<id>_mother`, `<id>_girl_{newborn,little,young,companion}`, `<id>_boy_{newborn,little,young,companion}`
   (10 par famille, 30 au total, ids `whale`, `dolphin`, `sea_turtle`). Les planches fournies donnent 1 adulte + 1 petit par famille.
   Conséquence : pas de scène de naissance, pas de croissance illustrée, pas de choix fille/garçon.
6. **Principe de `src/content/sea.ts` périmé** (« ces animaux ne sont pas des familles ») : il contredit la décision du
   2026-11-23. À réécrire quand l'océan sera traité, en gardant les 3 jeux bonus (tests `src/engine/sea.test.ts`).
7. **Voix** : `sea.ts` donne `father` à la baleine, `mother` à la tortue, `boy`/`girl` aux dauphins grand/petit. Avec un seul adulte
   non sexué par planche, il faut décider si l'adulte est Papa ou Maman ; le grand dauphin parle aujourd'hui avec la voix du garçon.
8. **Images de personnages = planches vertes en RGB sans alpha** : détourage obligatoire (chroma #00FF00). Risques : franges vertes
   sur les bords blancs des nageoires de la baleine, **bulles semi-transparentes du dauphin** (à retirer ou reconstituer), et
   chevauchement adulte/petit pour la baleine (nageoires) → préférer un bloc « duo » ou redessiner chaque individu séparément.
   Le parent a dit de conserver les cartes (`Baleine map.png`, `Dauphin map.png`, `Tortue map .png`) : ne pas les toucher.
9. **Tailles** : fonds 1671×941 / 1672×941 (16:9, correct pour un décor), planches personnages 1536×1024 : pas d'image trop petite.
   `Cathédrale…-2.png` est 1671×941 (1 px de moins que les autres) : sans conséquence mais à unifier.
10. **Jeu bonus tortue ≠ décors** : « Find it! » cherche poisson/crabe/coquillage/pieuvre ; les fonds tortue montrent poissons,
    hippocampe, étoile de mer, corail, éponges — **ni crabe, ni coquillage, ni pieuvre**. À adapter si le jeu devient propre à la famille.
11. **Croissance** : voir section dédiée. Si on joue sans les 30 images, il faut un mode « famille sans croissance » (stade
    figé, scène de naissance et barre de croissance masquées). `computeStage` lui-même n'a pas besoin de changer.
12. **Aucun parcours marin ne peut être joué en 4 personnages aujourd'hui** : toutes les lignes Papa/Maman/Bébé fille/Bébé garçon
    ci-dessus sont marquées **[DÉPEND D'IMAGES MANQUANTES]**. Avec le duo seul, on joue « Adulte » (2 lignes) et « Petit » (2 lignes) par décor.


---

