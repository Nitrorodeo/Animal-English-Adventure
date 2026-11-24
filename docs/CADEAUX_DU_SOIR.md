# Le cadeau du soir — objets, tailles et fabrication

*Préparé le 2026-11-24 pour Westimmo. Les 70 dessins sont faits le même jour et passent tous le contrôle (70/70 OK). Le cadeau est dans le jeu le même soir (points 1, 2, 3, 5 et 6 ci-dessous) ; reste le point 4.*

## Le principe

Après la première partie de la soirée, le personnage avec qui l'enfant a joué apporte trois paquets :
« A present for our home! Pick one! ». Elle en ouvre un et entend le mot anglais (« A kite! »). Puis elle pose
l'objet du doigt où elle veut dans le décor de la famille.

- L'objet reste dans le décor, puis il entre dans les jeux : « Where is my ball? », « Is the kite red? »,
  « How many blocks? ».
- Un cadeau par soir au plus. Rien ne se perd si elle ne joue pas.
- Le cadeau du soir remplace l'autocollant du jour.

## Les objets : 70, adaptés à chaque décor

La liste complète est dans `tools/cadeaux/catalogue.json`, avec pour chaque objet :
- le mot anglais et le mot français ;
- les couleurs, sur lesquelles portent les questions du jeu ;
- la hauteur logique `h` ;
- les décors où l'objet a du sens (`where`) ;
- la famille, si l'objet lui est propre ;
- s'il peut flotter.

Le catalogue compte trois sortes d'objets :
- **16 objets de partout** : ballon, tambour, cubes, couverture, coussin, coffre, guitare, panier, clochette,
  xylophone, train, toupie, livre, nounours, petite voiture, ballons.
- **12 objets selon le décor** :
  - plein air : cerf-volant, moulin à vent, banc ;
  - pays chauds : pot de fleurs, arrosoir, nichoir (s'il y a des arbres) ;
  - neige et glace : bonhomme de neige, luge ;
  - eau : bateau, canard ;
  - plage : château de sable, pelle.
- **42 objets propres à une famille**, deux par animal : la couronne et le parasol des lions, l'igloo et les patins
  des pingouins, la théière et la flûte des pandas, etc.

Règles d'habitat, vérifiées par `tools/cadeaux/carte.py` sur les 63 décors des 21 familles :
- pas de bonhomme de neige dans la savane ;
- pas de cerf-volant dans la grotte de glace ;
- sur une branche ou un perchoir, seulement des petits objets (`h` ≤ 0,4).

Chaque famille dispose de 21 à 29 cadeaux possibles.

## Les tailles : logiques, et selon la profondeur comme les animaux

- `h` = hauteur de l'objet en fraction de la hauteur du papa de la famille. Exemples :
  - ballon : 0,3 ;
  - trompette : 0,25 (relevée de 0,2 le 2026-11-24, parce qu'elle est très allongée) ;
  - igloo : 1,3 (le pingouin doit pouvoir y entrer) ;
  - théière : 0,25.
- L'objet est posé par sa base. Il rapetisse en allant vers le fond et grandit au premier plan, avec le même
  calcul que les animaux (`placeScale`, réglages décor par décor dans `places/depth.ts`).
- Les petits objets gardent leur vraie taille à l'écran, mais leur zone de toucher est plus grande, pour que
  l'enfant les attrape facilement.
- Le jeu les accorde au décor :
  - teinte de la lumière ambiante ;
  - ombre au sol colorée par le sol ;
  - léger voile atmosphérique au fond.

## La fabrication (version 2 « peinte », validée le 2026-11-24)

- Les dessins sont des SVG en haute définition, sans contour foncé, avec des volumes en dégradés, des ombres
  colorées et des matières faites avec des filtres. Consigne commune : `tools/cadeaux/CONSIGNES_DESSIN.md`.
- Ils sont dessinés par 8 agents (lots par matière), dans `assets/cadeaux/v2/<id>.svg`.
- `tools/cadeaux/rendre.py` rend chaque dessin en PNG transparent, avec Chrome sans fenêtre (rien à installer).
- `tools/cadeaux/controle.py` fait le contrôle mécanique : fond transparent, objet posé par sa base, viewBox serré,
  couleurs du catalogue présentes, ids préfixés.
- `tools/cadeaux/planche.py` fait les planches de contrôle visuel : par lot, et par famille avec le papa et ses
  cadeaux à leur taille logique.
- Les essais et comparaisons sont dans `assets/cadeaux/apercu/`.

## Dans le jeu (2026-11-24)

**Seulement des objets posés au sol (décision de Westimmo après l'essai chez les lions, 2026-11-24).** Une couronne posée par terre à côté du lion, c'est absurde : on ne peut pas la lui mettre sur la tête. Les objets qui se portent (`use: "worn"`) ou se tiennent (`use: "held"`) sont marqués dans `tools/cadeaux/catalogue.json` et ne sont plus offerts (`giftAllowed`). Restaient 48 objets. Les 22 autres pourront revenir le jour où les animaux sauront les porter ou s'en servir (il faudra alors la place de la tête et des pattes sur chaque dessin d'animal).

**Seulement des jouets ou des objets vraiment liés à l'animal (Westimmo, même jour, devant le coffre au trésor du lion : « faut plutôt que ce soit des jouets ou des choses réellement en rapport avec l'animal »).**

- 18 objets ne sont plus offerts (`use: "object"`) : coffre au trésor, couverture, oreiller, panier, pot de fleurs, arrosoir, banc, parasol, tente, charrette, caisse à outils, sac à dos, longue-vue, brouette, gong, drapeau, lanterne. Le nichoir est gardé pour la chouette.
- Un objet déjà reçu parmi eux est repris à la lecture de la sauvegarde, et l'enfant rouvre des paquets ce jour-là.
- 8 objets nouveaux, un par famille qui n'en avait plus à elle :
  - la grosse corde à tirer des lionceaux ;
  - les bambous du panda ;
  - la boule de neige du léopard des neiges ;
  - le raisin du renard ;
  - la coupe de fruits du toucan ;
  - la botte de foin du bison ;
  - le tronc du lézard à collerette ;
  - le seau de poissons du phoque.
- Chaque famille a donc au moins un objet à elle, et l'un des trois paquets en contient un tant qu'il en reste.
- Un seul cadeau par jour : on ouvre un paquet sur les trois.

- `tools/cadeaux/exporter.py` rend les dessins en `public/assets/gifts/<id>.webp` (640 px) et écrit
  `src/content/gifts.json`, le catalogue du jeu, avec les proportions de chaque image.
- `src/engine/gifts.ts` : les classes de décor (reprises de `carte.py`), les trois paquets du jour, la réception
  et le déplacement, la sauvegarde (`player.gifts`, `player.giftDay`).
  - Parmi les trois paquets, il y a un objet propre à la famille tant qu'il en reste.
  - Le cadeau arrive dans le décor où l'on est. Après une aventure qui change de lieu, il vient à l'activité suivante.
  - Un objet suit la famille dans ses autres décors quand il y a du sens, et garde sa place décor par décor.
  - Quand une famille a reçu tout ce qui a du sens dans ce décor, il n'y a plus de paquets ici.
- `src/ui/Gifts.tsx` et `src/ui/giftLook.ts` :
  - les paquets ;
  - l'objet posé, qu'on glisse au doigt et qui redit son mot quand on le touche ;
  - la taille selon la profondeur ;
  - l'ombre couleur du sol, la teinte de la lumière et le voile au fond, lus sur une petite copie du dessin.

## Ensuite, dans le jeu

1. Le moteur : un cadeau par soir et trois paquets au choix. Ils sont tirés parmi les objets permis dans ce décor,
   sans redonner un objet que la famille a déjà reçu.
2. La pose au doigt, à la bonne taille selon la profondeur, avec l'ombre et l'accord de lumière.
3. Les voix anglaises des nouveaux mots et des phrases du cadeau.
4. Les objets reçus entrent dans « Where is it? », « Find the colour » et « Let's count ». Les bébés en reparlent.
5. L'autocollant du jour est remplacé ; les autocollants déjà collés restent.
6. Les tests, puis un essai à l'écran chez les lions avant les autres familles.
