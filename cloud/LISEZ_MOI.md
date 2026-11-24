# Partie partagée entre appareils (Cloudflare Workers)

Demande du parent (2026-11-21) : « pouvoir s'y connecter du PC, de la tablette, du téléphone ».

Le jeu en ligne (GitHub Pages) range la partie de la famille sur ce petit service, sous un **code de
famille** (ex. `lion-mango-4271`) créé sur le premier appareil puis tapé une fois sur chaque autre.

- `worker.mjs` : le service (lecture / écriture de LA partie d'une famille). Testé dans
  `src/engine/cloud.test.ts`.
- `src/engine/cloud.ts` : décisions côté jeu (qui a la partie la plus récente, code de famille).
- `src/ui/useCloudSync.ts` : échanges (au démarrage, au retour sur le jeu, chaque minute, et
  8 secondes après un changement). `src/ui/FamilyGate.tsx` : écran du code de famille.

## Ce qui est gardé

- La partie (même contenu que la sauvegarde de l'appareil) et sa date, sous l'empreinte SHA-256 du
  code de famille (le code lui-même n'est pas stocké).
- La version de la veille, 60 jours, au cas où un appareil enverrait une mauvaise partie.
- Rien d'autre : ni compte, ni e-mail, ni adresse IP.

## Cercle d'amis (2026-11-24)

Demande du parent : « que ma fille voie la progression de ses amis, pas pour les mettre en concurrence, juste pour les
motiver » ; « à chaque nouvel enfant inscrit, un petit tableau de bord très simple ».

Même service, deux routes de plus (`/v1/circle`, en-tête `X-Circle: <code du cercle>`) : `GET` (les cartes du cercle,
404 si le cercle n'existe pas), `PUT` (la carte d'une famille : identifiant aléatoire, prénom, étoiles, aventures ;
le premier envoi crée le cercle), `DELETE ?id=` (quitter). 12 enfants au plus. **Seuls le prénom (20 caractères) et
deux nombres sont gardés**, jamais la partie ; la clé est l'empreinte du code du cercle. Décisions côté jeu :
`src/engine/circle.ts` ; échanges : `src/ui/useCircle.ts` ; écran : `src/ui/Friends.tsx` ; réglages (créer, rejoindre,
quitter) : espace parents, `src/ui/CircleSettings.tsx`. Tests : `src/engine/circle.test.ts`.

**Mettre en ligne dans cet ordre** : d'abord le service (`cd cloud` puis `npx wrangler@4 deploy` : ajout seulement,
les parties déjà rangées ne bougent pas), ensuite le site (envoi sur `main`). Dans l'autre sens, le cercle
répondrait « pas de connexion » jusqu'au déploiement du service.

## Limites connues

- Deux appareils qui jouent **en même temps** : la dernière partie envoyée l'emporte.
- Le code de famille est la seule clé (≈ 10 millions de codes possibles) : ne pas le publier.
- Offre gratuite Cloudflare : 100 000 lectures et 1 000 écritures par jour, largement assez pour une
  famille (une écriture au plus toutes les 8 secondes de jeu).

## Mise en ligne (une seule fois)

1. Le parent crée un compte gratuit sur https://dash.cloudflare.com/sign-up (lui-même).
2. Connexion de l'outil Cloudflare (une page s'ouvre, le parent clique « Allow ») :
   `cd cloud` puis `npx wrangler@4 login`
3. Espace de stockage : `npx wrangler@4 kv namespace create SAVES`, puis recopier l'`id` donné dans
   `wrangler.toml` (à la place de `A_REMPLIR`).
4. Envoi du service : `npx wrangler@4 deploy`. L'adresse affichée ressemble à
   `https://aea-saves.<nom>.workers.dev`.
5. Donner l'adresse au site : `gh variable set CLOUD_URL --body "https://aea-saves.<nom>.workers.dev"`,
   puis envoyer le code sur `main` : la publication GitHub Pages reconstruit le jeu avec le partage.

Mettre à jour le service plus tard : `cd cloud` puis `npx wrangler@4 deploy`.
