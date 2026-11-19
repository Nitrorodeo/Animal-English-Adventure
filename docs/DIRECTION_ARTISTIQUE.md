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
