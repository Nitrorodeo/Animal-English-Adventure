# Animal English Adventure

Jeu d'aventure pour apprendre l'anglais à partir de 7 ans : on choisit un continent, une famille d'animaux, et on joue avec eux en anglais (aide française facultative). Pas de publicité, pas de compte, pas de collecte de données ; la progression reste sur l'appareil.

**Jouer :** https://nitrorodeo.github.io/Animal-English-Adventure/

Sur tablette : ouvrir le lien, puis « Ajouter à l'écran d'accueil ». Dans l'espace parents (⚙️), la section « Jouer sans internet » indique quand tout le jeu est téléchargé ; il fonctionne ensuite sans connexion.

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/ + service worker hors-ligne
```

Le jeu est publié automatiquement sur GitHub Pages à chaque envoi sur `main` (`.github/workflows/deploy.yml`).

Documentation : `docs/` (état du projet, cahier des charges, ajout d'un animal).
