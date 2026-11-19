# Inventaire des ressources graphiques et sonores

*Instantané du 2026-11-18 à 12 h 05. Les dessins arrivent au fur et à mesure dans `Animaux/` : un ancien inventaire n'est pas faux, il est daté.*

## Présent et intégré

| Espèce / décor | Source dans `Animaux/` | Ce qui est dans le jeu |
|---|---|---|
| Carte du monde | `Lion/Image ChatGPT … 10_50_11-2.png` | `public/assets/backgrounds/world_map.webp` |
| Savane | `Lion/… 10_50_14-3.png` | `savanna.webp` (10 points interactifs placés à la main dans `src/content/world.ts`) |
| Portrait famille lion | `Lion/… 10_50_09-1.png` | écran titre |
| Lion | `Lion/… -4` à `-7` | père, mère, garçon, fille (**un seul dessin par bébé**) |
| Éléphant | `elephant/Famille Éléphant et étapes de croissance.png` (planche) | père, mère, garçon et fille × 4 stades (extraits de la planche) |
| Girafe | `Girafes/girafe/*.png` (10 PNG détourés) | père, mère, garçon et fille × 4 stades |

Voix anglaises : 655 enregistrements MP3 dans `public/audio/voice/` (générés par `npm run voices`, manifeste `src/content/voiceManifest.json`).

Total : 24 personnages, 3 fonds (`src/content/assetManifest.json`, régénéré par `npm run assets`).

## Remplacements provisoires en service

- Espèces sans dessin : **pictogramme emoji** à la place du personnage.
- Biomes autres que la savane : **dégradé de couleurs** et la mention « Décor provisoire ».
- Stades des lionceaux : même dessin, taille croissante.
- Voix française (aide facultative) : synthèse vocale de l'appareil.

## Manquant

**Personnages** (père, mère, bébé garçon et fille, idéalement 4 stades) — 18 espèces :

| Continent | Espèces |
|---|---|
| Asie | panda géant\*, tigre, panda roux |
| Europe | renard\*, hibou, hérisson |
| Amérique du Nord | ours\*, bison, castor |
| Amérique du Sud | jaguar, toucan\*, capybara |
| Océanie | kangourou\*, koala, ornithorynque |
| Antarctique | manchot\*, phoque, orque |

\* déjà jouables en salutations avec un pictogramme.

Lion : bébés aux stades *little*, *young*, *companion*.

**Décors** (1 image large par biome, sans personnages, avec un point d'eau visible si l'espèce boit) : forêt de bambous, forêt (Asie), forêt tempérée, forêt près de la rivière, prairie, forêt tropicale, fleuve, bois d'eucalyptus, ruisseau, banquise, mer.

**Sons** : bruitages doux (eau, rugissement, trompe). Les voix anglaises sont enregistrées (voir `docs/ETAT_DU_PROJET.md`, section « Voix »).

## Note de droits

Les dessins de lions rappellent fortement le style d'une franchise célèbre. Pour un usage **familial privé** ce n'est pas un problème. Pour toute diffusion publique ou commerciale, il faudrait des lions au style clairement original (voir `docs/DIRECTION_ARTISTIQUE.md`). Les girafes et les éléphants ont un style propre.
