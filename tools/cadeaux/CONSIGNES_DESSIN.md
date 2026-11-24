# Cadeaux du soir — consigne de dessin (version 2 « peinte »)

*Validée par Westimmo le 2026-11-24 (« oui version 2 »). Commune à tous les agents qui dessinent les objets.*

## Le but

Chaque soir, l'enfant (7 ans) reçoit un objet et le pose du doigt dans le décor de sa famille d'animaux. Les
décors et les animaux sont des **images peintes « cartoon 3D premium »** : volumes doux, lumière chaude, dégradés
riches, reflets, ombres colorées, **aucun contour noir**. Les objets doivent avoir l'air de faire partie de ce monde.

**Regarde d'abord** (outil Read sur les images) :
- un ou deux décors de `public/assets/backgrounds/` (par exemple `savanna.webp`, `an_aurora.webp`, `asia_garden.webp`) ;
- un ou deux animaux de `public/assets/characters/` (par exemple `lion_father.webp`, `penguin_father.webp`) ;
- **les deux références validées** : `assets/cadeaux/v2/igloo.svg` et `assets/cadeaux/v2/teapot.svg`. Lis leur code
  (techniques de dégradés et de filtres) et regarde leur rendu (`assets/cadeaux/apercu/planche_v1_v2.jpg`, colonnes
  « v2 peinte »). C'est le niveau attendu.

## Ce que dit le catalogue

`tools/cadeaux/catalogue.json`, entrée de ton objet (`id`) :
- `draw` : la description à dessiner. Respecte-la.
- `colors` : les couleurs **dominantes obligatoires**. Le jeu demandera « Is the ball red? » : elles doivent sauter aux yeux.
- `h` : hauteur de l'objet dans le jeu, en fraction de la hauteur du papa animal. Le jeu affiche ton dessin à cette
  hauteur : **la largeur découle de ton viewBox**. Donne donc à l'objet ses vraies proportions (une couverture pliée
  est bien plus large que haute, une guitare debout bien plus haute que large).
- Ne modifie pas le catalogue. Si une hauteur te paraît illogique, dis-le dans ton compte rendu.

## Le style (obligatoire)

- **Pas de contour foncé.** Au plus un liseré très léger de la couleur de l'objet assombrie (opacité ≤ 0,35), ou rien.
- Volume par **plusieurs couches de dégradés** (radial + linéaire), **occlusion ambiante** dans les creux et à la base,
  **lumière d'appoint** (rim light chaude, pêche ou dorée) sur le bord opposé à la lumière, **reflets spéculaires** doux.
- Lumière venant **d'en haut à gauche**. Ombres **colorées**, jamais grises ou noires : bleu-violet pour la neige et la
  glace, brun chaud ou prune pour le bois et le tissu, teinte assombrie de la couleur pour le reste.
- Matières par **filtres SVG**, discrets : `feTurbulence` + `feDisplacementMap` (bords irréguliers : neige, feuilles,
  laine, osier), `feTurbulence` + `feColorMatrix`/`feComposite` (grain : bois, tissu, terre cuite, papier),
  `feGaussianBlur` (ombrages doux), `feSpecularLighting` (brillance : métal, porcelaine, plastique). Le rendu doit
  rester propre à 512 px comme à 1024 px.
- Couleurs **vives et chaleureuses**, saturées comme les décors, mais pas fluo.
- Vue de **trois quarts, légèrement d'en haut**. Objet entier, robuste, lisible de loin par un enfant : formes simples
  et généreuses, détails fins seulement en bonus.
- Aucun texte, aucune lettre, aucun chiffre lisible, aucun personnage, aucune marque, aucune imitation d'un objet de
  film ou de dessin animé connu.

## Contraintes techniques (vérifiées par `controle.py`)

- Fichier : `assets/cadeaux/v2/<id>.svg` (le nom = l'`id` du catalogue).
- Fond transparent : aucun rectangle de fond, **pas d'ombre portée au sol** (le jeu l'ajoute), pas de sol autour.
  Seule exception : un petit support qui fait partie de la description (congère des skis, tas de sable de la pelle,
  tas de pierres du drapeau, socle).
- `viewBox` **serré** autour de l'objet (marges ≤ 3 %) et **le bas du viewBox = la base de l'objet** (marge du bas
  ≤ 1,5 %) : le jeu pose l'objet par le bas. Un objet qui flotte (bateau, canard, bouée, canoë) : le bas = le dessous
  de la coque, sans eau dessinée.
- Tous les `id` préfixés par le nom de l'objet : `ball-…`, `sled-…` (plusieurs objets vivront sur la même page).
- XML valide (pas d'attribut en double), pas d'image externe, pas de police, fichier < 150 Ko.

## La méthode

1. Pour chaque objet : écris le SVG (directement, ou avec un petit script Python générateur rangé **dans ton dossier
   temporaire**, jamais dans le dépôt).
2. Rends-le : `python -I tools/cadeaux/rendre.py assets/cadeaux/v2/<id>.svg --taille 768 --sortie <ton dossier temporaire>`
   (Chrome sans fenêtre, rien à installer), puis regarde le PNG avec Read à côté des références.
3. Corrige. **2 passes au plus par objet** (3 pour les grands objets, `h` ≥ 0,6). Mieux vaut un objet fini et propre
   qu'une quatrième retouche.
4. Contrôle : `python -I tools/cadeaux/controle.py assets/cadeaux/v2/<id>.svg [...]` jusqu'à « OK » pour chacun.

Interdits : installer un paquet, commiter, modifier un autre fichier du dépôt que tes `assets/cadeaux/v2/<id>.svg`,
toucher aux objets d'un autre lot.

## Compte rendu (court)

Une ligne par objet : `id` — OK au contrôle ou non — ce qui reste imparfait — remarque éventuelle sur `h`.
