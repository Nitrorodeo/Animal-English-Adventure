# Animal English Adventure

Jeu d'aventure pour apprendre l'anglais à partir de 7 ans : on choisit un continent, une famille d'animaux, et on joue avec eux en anglais (aide française facultative). Pas de publicité, pas de compte, pas de collecte de données ; la progression reste sur l'appareil.

**Jouer :** lancer `npm run dev` sur l'ordinateur, puis ouvrir sur la tablette (même Wi-Fi) l'adresse « Network » affichée, port 5173. Les parties restent sur la tablette, avec une copie sur l'ordinateur (`saves/`, non versionné).

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/ + service worker hors-ligne
```

`.github/workflows/deploy.yml` peut publier le jeu sur GitHub Pages, mais Pages n'est pas activé (dépôt privé).

Documentation : `docs/` (état du projet, cahier des charges, ajout d'un animal).
