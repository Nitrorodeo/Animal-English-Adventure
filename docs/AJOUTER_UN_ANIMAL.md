# Ajouter un animal

Exemple réel : la girafe, ajoutée le 2026-11-18.

## 1. Déposer les dessins

Créer un dossier famille dans `Animaux/<Continent>/` (`Afrique`, `Asie`, `Europe`, `Amerique du Nord`, `Amerique du Sud`, `Oceanie`, `Antarctique`), par exemple `Animaux/Oceanie/Koalas/`, et y ranger le pack (zip compris). Deux formats sont acceptés :

- **PNG détourés séparés**, le plus simple : papa, maman, puis bébé garçon et bébé fille aux stades 1 à 4.
- **Une planche** sur fond transparent (comme l'éléphant). Il faut alors un point (`seed`) à l'intérieur de chaque personnage.

Les stades : 1 = `newborn`, 2 = `little`, 3 = `young`, 4 = `companion`. S'il n'y a qu'un dessin par bébé, le jeu l'agrandit à chaque stade.

## 2. Déclarer les sources

Dans `tools/asset_sources.json`, rubrique `characters` :

```json
"giraffe": {
  "father": { "src": "Animaux/Afrique/Girafes/girafe/papa_girafe.png" },
  "mother": { "src": "Animaux/Afrique/Girafes/girafe/maman_girafe.png" },
  "boy_newborn": { "src": "Animaux/Afrique/Girafes/girafe/bebe_garcon_stade_1.png" },
  "girl_companion": { "src": "Animaux/Afrique/Girafes/girafe/bebe_fille_stade_4.png" }
}
```

L'exemple est raccourci : il faut une ligne par stade et par sexe.

Ensuite, lancer `npm run assets`. Le script détoure, recadre, convertit en WebP et met à jour `src/content/assetManifest.json`.

Puis lancer `python tools/auto_rigs.py` : chaque nouveau dessin reçoit son squelette d'animation (`src/game/autoRigs.json`). Pour un parent debout de profil, ajouter la place de ses pattes dans `LEGS` (même fichier) ; vérifier dans l'atelier http://localhost:5173/?lab&sp=<espèce>. Un test échoue si un personnage n'a pas de squelette.

## 3. Rendre l'espèce jouable

Tous ces fichiers sont dans `src/` :

| Fichier | À faire |
|---|---|
| `content/species.ts` | `playable: true`, `familyReady: true`, `drinkStyle` (façon de boire) |
| `content/dialogues.ts` | Accueil dans `GREETING_WELCOMES`. Si l'espèce vit près d'un point d'eau, ajouter sa scène `find_water` propre (pas de copie mot pour mot d'une autre espèce). |
| `ui/scene.ts` | Taille à l'écran : `ADULT_HEIGHT` et `BABY_SCALE` |
| `styles.css` | Animation de la façon de boire, si elle est nouvelle (`.act-drink_…`) |
| `engine/engine.test.ts`, `ui/scene.test.ts` | Un test pour la nouvelle scène et pour les sprites. **Règle du projet : aucune modification sans test.** |

## 4. Vérifier

```bash
npm run voices   # enregistre les nouvelles phrases (quelques secondes par phrase)
npm test
npm run build
```

Si `npm run voices` signale une phrase « avec prénom sans variante parlée », ajouter une règle dans `NAME_RULES` (`src/audio/voiceKey.ts`).

Ouvrir ensuite le jeu, choisir l'animal sur la carte et jouer « Say hello », « Find water » et la scène de famille.

## Garde-fous de cohérence

- Une espèce n'habite que les biomes de son continent (un test le vérifie).
- Une quête n'est proposée que si le décor contient ce qu'il lui faut, par exemple un point d'eau pour `find_water`.
- Le régime alimentaire est respecté : `diet` dans `species.ts`.
