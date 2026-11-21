# État du projet — Animal English Adventure

*Mis à jour le 2026-11-21 vers 9 h — **Jeu en ligne, 4 nouveaux décors, audit** (demandes du parent : « tu trouvera les 4 decors dans les dossiers des castors et koalas met en place », « fais un audit complet du jeu », « Je veux un vrai site en ligne », « je veux les deux noindex et le code ») :*
*- **Site en ligne** : https://nitrorodeo.github.io/Animal-English-Adventure/ (GitHub Pages, dépôt public). Publié par `.github/workflows/deploy.yml` à chaque envoi sur `main`, après les tests. Build `VITE_STATIC_SITE=1` : code demandé une fois par appareil (`src/engine/access.ts`, seule l'empreinte est dans le code), aucun appel aux API de l'ordinateur (sauvegarde, voix du prénom). Le jeu servi par l'ordinateur (`npm run dev`) ne demande rien.*
*- **Pas de référencement** : `noindex, nofollow, noarchive` dans `index.html`. **Politique de sécurité (CSP)** ajoutée au jeu construit (`tools/pwa/csp.mjs`) : seuls les fichiers du jeu sont chargés.*
*- **4 décors** : étang des castors et sentier des séquoias (Amérique du Nord), bois d'eucalyptus et crique aux rochers (Océanie). Castor et koala ont maintenant 4 décors ; ours, kangourou et lézard en reçoivent aussi deux. Profondeur mesurée (`depth.ts`), voix régénérées.*
*- **Audit** : 0 vulnérabilité dans les dépendances du jeu ; vitest (outil de test local, jamais publié) signale des alertes corrigées seulement par une version majeure, non appliquée. `sanitizeSpelling` ne laisse plus un tiret en tête (argument du script de voix). Prénom d'enfant retiré des exemples et des tests.*
*- Contrôlé en ligne : code refusé puis accepté, noindex, CSP, service hors-ligne actifs, aucune erreur console. Tests : **236 Vitest** + typage OK.*
*- **Partie partagée entre appareils** (demande : « pouvoir s'y connecter du PC, de la tablette, du téléphone ») : code de famille créé sur le premier appareil (ex. `lion-mango-4271`), tapé une fois sur les autres ; la partie s'envoie toute seule et se récupère au démarrage, au retour sur le jeu et chaque minute. Service Cloudflare `cloud/worker.mjs` (notice `cloud/LISEZ_MOI.md`), décisions `src/engine/cloud.ts`, écran `src/ui/FamilyGate.tsx`, section « Partie partagée » dans l'espace parents. Testé (253 Vitest) et vérifié au navigateur avec un faux service : création du code, mauvais code refusé, appareil vierge qui retrouve la partie, mise à jour venue d'un autre appareil reprise automatiquement. **En ligne depuis le 2026-11-21** : service `https://aea-saves.aea-famille.workers.dev` (compte Cloudflare du parent, stockage KV `SAVES`), relié au site par la variable de dépôt `CLOUD_URL`.*
*- **Mise à jour immédiate sur les appareils** : quand une nouvelle version est publiée, le jeu se recharge tout seul une fois dans la minute qui suit l'ouverture (`shouldReloadForUpdate`, `src/pwa/offline.ts`), au lieu d'afficher l'ancienne version jusqu'à l'ouverture suivante.*
*- **En cours (autre session)** : panthère des neiges à la place du panda roux en Asie (décision du parent).*
*- **Limites** : la page du dépôt GitHub public peut être indexée ; le code n'est qu'une porte (le dépôt est lisible). L'écran de prononciation du prénom n'a pas d'effet en ligne.*

*Mis à jour le 2026-11-20 vers 18 h 30 — **Carte élargie puis recentrée, étiquettes fines, vraie profondeur par décor** (demandes du parent : « il doit pouvoir aller quand même assez loin […] complètement au fond du chemin », « on est trop décalé vers la droite, centre-moi ce décor », « les bulles marchent sur les pingouins […] quelque chose de plus petit, de plus fin, de plus premium ») :*
*- **Carte du monde** 2172×1086 (2:1). Élargie par `scripts/map_wide.py` : les continents sont écartés, la mer est étirée. Elle est ensuite **recentrée** par `scripts/map_center.py` : 135 px d'océan retirés à gauche et 135 px de mer ajoutés à droite, par coutures dans l'eau. Les continents se décalent d'un bloc, sans déformation. Seule la pointe de la Sibérie, coupée par le bord, est un peu allongée dans l'herbe. L'image d'avant le recentrage est gardée : `world_map_avant_centrage.webp`. Ont été recalés : les zones cliquables et les étiquettes (`world.ts`), la baleine, la tortue et les dauphins (`sea.ts`), et les autocollants déjà collés (`toWideMap`, nouveau repère `map: 3`).*
*- **Étiquettes des continents** : petites pastilles de verre (fond blanc translucide, ombre douce, police plus petite, compteur 🎁 discret derrière un filet). « Africa » est passée dans la mer, à côté du sud de l'Afrique. « Antarctica » est posée sur la banquise, à gauche des manchots. La bulle de jeu des animaux marins est affinée de la même façon. Contrôlé au navigateur en 1879×940, en tablette 1024×768 et en iPhone couché 844×390.*
*- **Profondeur par décor** (`src/content/places/depth.ts`) : pour chacun des 36 décors, la ligne d'horizon et le fond du sol sont mesurés sur l'image. Un animal posé tout au fond descend jusqu'à 14 % de sa taille (`FARTHEST`) ; par exemple les lions au bout du chemin de la savane. Sur les plages, le bord de la mer est tracé point par point : un animal lâché au-dessus de l'eau reste sur le sable. Sur les rochers (`perches`, et les ancres de type rocher) l'animal se pose dessus, avec la taille qu'il aurait au pied du rocher ; exemple : le lézard sur la grosse pierre de la plage. Les petits animaux au fond sont plus faciles à attraper (zone de prise agrandie, `--grab`).*
*- **Limite** : l'eau des lacs et des rivières à l'intérieur d'un décor n'est pas encore interdite ; seul le bord de mer du fond l'est.*
*- Tests : **227 Vitest** (dont `src/game/depth.test.ts`) et typage OK.*

*Mis à jour le 2026-11-20 vers 17 h 30 — **Restes de découpe des autres familles vérifiés et corrigés** (demande du parent : « vérifie les autres familles pour des restes de découpe ») :*
*- **Ours brun, hérisson, koala** : franges claires, pieds et éclats repris dans `tools/retouches_planches.json` (nouvelles options `"edge": n` = seulement près du vide, `"clear": true` = tout retirer dans la zone) puis personnages redécoupés ; ombre au sol sous les pattes du hérisson papa et plancher entre les pattes des bébés koala retirés. `stacked_seam` rattache maintenant à l'animal voisin les morceaux détachés.*
*- **Girafe, paresseux** : propres. **Éléphant, tigre, panda, hibou, manchot, phoque, ours polaire, renard, kangourou, lézard** (anciennes planches à fond vert, non régénérables car retouchées à la main) : reflets olive du fond vert repris **en place sur le contour seulement** (`tools/despill_png.py`, `despill_spots` dans `decoupe_planche.py`) ; le cœur du personnage (yeux, feuilles de la fleur) n'est pas touché. Sauvegardes avant correction dans le dossier temporaire de la session. **Lions non touchés.***
*- **Passe sur tous les défauts restants** (demande : « tu peux vraiment tout corriger ») : `despill_spots` traite aussi les creux olive au cœur (jamais près d'une pupille, d'une vraie feuille ou d'une fleur rose) ; reflets verts du kangourou (4 bébés + maman, entre-jambe), du renard, du lézard, du tigre bébé garçon 4 repris ; point de mousse du toucan maman laissé (détail du dessin).*
*- **Éclats clairs de contour** (`pale_fringe` dans `decoupe_planche.py`) : restes de fond crème posés sur un pelage plus foncé retirés sur 182 personnages (tous sauf les lions) ; le pelage naturellement clair et les moustaches sont gardés. Sauvegarde avant passe dans le dossier temporaire de la session.*
*- WebP du jeu, squelettes (`autoRigs.json`) régénérés. Tests : 226 Vitest, 30 tests Python OK. Le typage signale encore des erreurs dans `src/game/depth.test.ts` (autre chantier, non touché).*

*Mis à jour le 2026-11-20 vers 16 h 50 — **Places gardées, carte sans bandes, sens gauche/droite, perspective, marche des mamans** (demandes du parent : « Oui, garde-les », « je veux qu'elle soit full écran, je ne veux pas tes bords Bleus », « il faut qu'il reste dans le sens où on l'a mis », « le rendre encore plus performant et adapté », « les femelles par contre n'ont pas d'animation ») :*
*- **Places gardées** : chaque animal posé au doigt reste à sa place dans chaque décor, même le lendemain (`src/engine/spots.ts`, sauvegardé dans la partie, anciennes parties compatibles).*
*- **Carte en plein écran** sans bandes (`src/ui/mapFit.ts`) : elle couvre tout l'écran ; sur un écran très large elle dépasse en haut et en bas et se fait glisser (doigt ou souris) ; les noms des continents restent à l'écran.*
*- **Sens gauche/droite** : l'animal regarde vers où on l'emmène et garde ce sens une fois posé (sauvegardé) ; bouton « ⇄ Turn around » dans son menu pour le retourner.*
*- **Perspective réelle** : il rapetisse nettement vers le fond (jusqu'à 42 %) et grossit au premier plan (jusqu'à 130 %), selon la ligne d'horizon du décor ; il ne peut plus monter dans le ciel.*
*- **Marche plus fluide** : déplacement par `transform` (carte graphique), durée selon la distance (vitesse constante), plus de clignotement gauche/droite sur un petit écart.*
*- **Pattes animées** ajoutées (`tools/auto_rigs.py`, LEGS) : lionne, tigresse, girafe maman, et éléphants, ours polaires (papa et maman). Jaguars et pandas sont couchés : ils se dandinent. Leo inchangé.*
*- Tests : 211 Vitest + typage OK. Contrôle au navigateur : place et sens retrouvés après rechargement, Lola marche.*

*Mis à jour le 2026-11-20 vers 16 h 15 — **Planches sur fond crème découpées, 7 familles en HD, fluidité des jeux** (demande du parent : « continue avec les planches qui manquent Tu mets en place tous les décors et surtout tu regardes la fluidité des animations pour les Jeux ») :*
*- **Planches sur fond crème ou en dégradé** maintenant acceptées par `tools/decoupe_planche.py` : fond reconstitué, ombre au sol retirée, trous du fond (boucle de queue, entre les pattes) retirés ; ventre clair, dents, joues et oreilles gardés. 10 personnages par planche, contrôlés un à un sur fond clair et sombre.*
*- **7 familles en HD** (WebP 95, 2,6 Mo au total) : ours brun, bison, castor, hérisson (remplacent les anciennes images), **jaguar, toucan, koala** (remplacent le pictogramme). Tailles par espèce ajoutées (jaguar, koala, toucan) ; pattes des marionnettes recalées pour les parents ours et bison. Contrôlé au navigateur : famille jaguar dans la clairière de la jungle.*
*- **Décors** : les 35 décors de continent (5 par continent) ont leur image source et sont tous utilisés.*
*- **Fluidité** : la tortue du jeu bonus nage par `transform` au lieu de `left/top` (animée par la carte graphique, sans recalcul de la page). Toutes les autres animations des jeux n'animent déjà que `transform` et l'opacité. Mesure au navigateur : aucune tâche longue pendant les manches.*
*- **Restes de découpe du jaguar et du bison corrigés** (vers 16 h 40, demande du parent : « corrige les restes de découpe du jaguar et du bison ») : zones de retouche désignées à la main par planche dans `tools/retouches_planches.json`, appliquées par `decoupe_planche.py` (GrabCut dans la zone, ou retrait des seuls pixels pâles presque gris). Retirés : sol sous les pieds du jaguar garçon stade 4 et de la maman jaguar, lueur autour du papa bison, sol sous les sabots des bisons stade 4, fond entre les pattes de la bisonne stade 4. Pattes, moustaches, cornes claires gardées. Contrôlé sur fond sombre.*
*- **Castor, toucan et jaguar fille stade 3 corrigés aussi** (vers 16 h 55, demande du parent : « corrige aussi le castor, le toucan et la jaguar stade 3 ») : reflet gris au-dessus de la tête du castor garçon stade 4 ; fond rosé resté entre les pieds, sous la queue et le long de la branche des deux toucans parents, et franges blanches des feuilles de la maman ; coin de sol blanc entre les pattes de la jaguar fille stade 3 (mêmes couleurs que le fond de la planche) et petits éclats sous ses orteils. Zones ajoutées dans `tools/retouches_planches.json` (castors, toucans, jaguars). Plus aucun reste connu sur ces familles.*
*- Tests : 211 Vitest + typage OK ; Python : 26 (découpe dont retouches, préparation, mer).*

*Mis à jour le 2026-11-20 vers 15 h 40 — **Carte en plein écran, bandeau premium, animaux déplaçables** (demandes du parent : « la MAP propre et mise correctement sur toute la page […] le menu en haut beaucoup plus premium » et « prendre n'importe quel animal et le mettre où je veux ») :*
*- **Carte du monde** : plus de bandes sombres de chaque côté. Le fond prolonge la mer et les nuages de la carte, flouté (`public/assets/backgrounds/world_map_backdrop.webp`, 6 Ko, produit par `python scripts/map_backdrop.py`). Les bords gauche et droit de la carte se fondent dedans ; vignette légère.*
*- **Bandeau du haut** : fond brun profond, filet doré lumineux, médaillons à anneau d'or avec icônes dessinées (carte, sac, réglages) à la place des émojis ; titre doré « ✦ World Map ✦ » sur la carte, qui se dit à voix haute quand on le touche.*
*- **Animaux déplaçables** : dans tous les décors, on attrape n'importe quel personnage (parents, bébés) et on le pose où l'on veut. Il rapetisse en s'éloignant (perspective), ne sort pas du décor, et un simple toucher ouvre toujours le menu d'activités ; l'appui long garde chatouilles et câlins. La place choisie est **sauvegardée avec la partie** (décision du parent : « chaque animal reste à l'endroit où l'enfant l'a laissé, même le lendemain ») : par décor et par personnage, dans `player.spots` (`src/engine/spots.ts`, 3 tests ; anciennes parties lues sans souci). Enregistrée quand on lève le doigt, pas à chaque mouvement, pour rester fluide. Pendant une aventure, les personnages reprennent leur place de quête ; la nuit, ils dorment à leur place. Code : `dragSpot` dans `src/ui/drag.ts` (3 tests), `Habitat.tsx`.*
*- Tests : 199 Vitest + typage OK. Contrôlé au navigateur (glisser de Frankie dans l'outback, place retrouvée après rechargement de la page, toucher simple sur Frida, carte en 1600×780, 1200×640 et tablette en portrait).*

*Mis à jour le 2026-11-20 vers 15 h 10 — **Ours polaire en Antarctique, orque retirée, images HD** :*
*- **Ours polaire** dans le jeu en Antarctique (décision du parent) : famille complète de 10 personnages, salutations, les 3 aventures d'Antarctique (passe par la banquise), voix générées.*
*- **Orque retirée du jeu** (demande du parent : « tu enlèves ça ») : espèce, salutations, aventures et données. Une ancienne partie qui avait une famille d'orques se charge toujours (famille gardée dans la sauvegarde, sans photo). L'Antarctique a 3 espèces : manchot, phoque, ours polaire.*
*- **Images HD, jeu rapide** (« je veux des images hd de partout » puis « le jeu doit rester rapide ») : export en WebP qualité 95, au lieu de 88 pour les personnages et 86 pour les décors. La transparence est gardée sans perte (`tools/prepare_assets.py`, `CHAR_WEBP` / `BG_WEBP`). Taille en pixels inchangée, donc animation aussi fluide. Les images se chargent scène par scène (~0,7 Mo par décor). Total : décors 25 Mo, personnages 5 Mo. Le sans-perte complet a été essayé puis écarté (3 fois plus lourd, différence invisible).*
*- **Limite réelle de la netteté** : la taille des dessins fournis (planches de 1536×1024, donc environ 300 à 700 px par personnage ; décors en 1672×941). Les images dont la source a disparu gardent leur ancienne version : lion, panda roux, ours brun, bison, castor, hérisson, et 5 décors. Pour aller plus loin : planches plus grandes (un personnage par image), ou un agrandisseur IA à installer (téléchargement à valider par le parent).*
*- **Mer en HD** : baleine, dauphins et tortue des jeux bonus refaits à partir des dessins du parent (`Animaux/Ocean map/`), avec `scripts/sea_hd.py` (6 tests) : faux damier retiré sous la baleine ; les deux dauphins séparés, chacun avec son éclaboussure, la flaque en fondu. Sorties : `public/assets/sea/*_hd.webp`. La carte du monde garde ses petites découpes, posées exactement sur sa peinture. Contrôlé au navigateur dans les 3 jeux.*
*- Tests : 193 Vitest + typage OK ; Python : 9 (découpe des planches), 7 (préparation des images), 6 (mer).*

*Mis à jour le 2026-11-20 (après 14 h 40) — **5 décors par continent, familles posées sur la terre** (demandes du parent : « il faut bien que les animaux soient posés sur la terre et pas au milieu de l'eau » et « Tu as la série de 5 images par continent qui doivent être en place et adaptées au personnage »). Contrôle de tous les décors (7 continents × 5) avec la position réelle des pieds de la famille :*
*- Amérique du Sud : les deux nouvelles images sont en place — « Cascade tropicale… » = `sa_waterfall`, « Clairière tropicale… » = `sa_wetland` (devenu « l'étang de la jungle »), toutes deux **retournées en miroir** pour que le chemin soit à droite, sous la famille ; repères refaits (cascade, eau, arbre, rocher, fleur, chemin…). `sa_valley` retiré (son image n'existe plus) : 5 lieux. L'aventure de l'étang ne parle plus de nénuphars ni de palmier absents de l'image (cascade, eau, fleur rose, grand arbre, feuille, grenouilles sur les rochers) ; voix régénérées.*
*- Forêt de fougères (Océanie) : la famille était dans le ruisseau → décor retourné en miroir, repères retournés, objets replacés sur les rochers.*
*- Rivière (Amérique du Sud) et lac des Rocheuses : sol abaissé (groundY 84), la famille se tient sur la berge et non au bord de l'eau.*
*- Outils : option `"flip"` dans `tools/asset_sources.json` (testée), suivie par `tools/dev/place_tools.py check`.*

*Mis à jour le 2026-11-20 à 12 h 40 — **Toutes les familles fournies sur fond vert ou transparent sont détourées et dans le jeu** : éléphants, girafes, tigres, pandas, renards, hiboux, lézards à collerette, paresseux, kangourous, manchots, phoques (11 familles, 10 personnages chacune). Manchot, phoque et kangourou n'ont plus de pictogramme. Ombre verte entre les pattes retirée (tigres), pattes des marionnettes recalées (renard, tigre, girafe). 192 tests + 12 tests Python. Ce qui manque encore : section « Bloqué / à décider par le parent ».*

*Mis à jour le 2026-11-20 (après 12 h 10) — **Prénom de l'enfant et sa prononciation** : au premier lancement, l'enfant entre son prénom, choisit à l'oreille comment il se dit, et les animaux l'appellent par son prénom (demande du parent : « quand l'enfant se connecte, ils doivent rentrer son prénom, que les animaux interagissent avec lui directement, mais il faut faire attention à la prononciation »). 191 tests.*

*Mis à jour le 2026-11-20 à 12 h 10 — **Lézard à collerette à la place de l'ornithorynque**, **nouveaux décors d'Australie et d'Antarctique**, **dossier Animaux rangé par continent** (demandes du parent : « australie on remplace lui par un lezard a colerrette , je fais le design de la famille / tu as aussi tous les decors de tous les continents » et « range tout »). 178 tests.*

*Mis à jour le 2026-11-20 à 10 h 45 — **Jeux bonus de la mer** : la baleine, la tortue et les dauphins de la carte sont interactifs et ont chacun leur jeu (demande du parent : « Je veux qu'on se serve de ces 3 animaux marins pour faire des jeux bonus. Ils doivent aussi être interactifs. »). 176 tests.*

*Mis à jour le 2026-11-20 à 10 h 15 — **« Simon says! », « Yes or no? », chatouilles et câlins** (demande du parent : « Les 3 conseillées »). 163 tests.*

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
npm test             # 191 tests (+ python -m unittest dans tools/tts)
npm run build        # version statique dans dist/ (+ dist/sw.js pour le hors-ligne)
npx vite preview --port 4173   # sert dist/ : seule version où le hors-ligne est actif
npm run assets       # après chaque dépôt d'images dans Animaux/
npm run voices       # après chaque ajout ou changement de phrase anglaise
```

## Découpage des planches de personnages (2026-11-20, mis à jour à 12 h 40)

- `python tools/decoupe_planche.py <planche.png> <dossier> <espece>` : découpe une planche de famille (Papa et Maman en haut, garçon stades 1→4, fille stades 1→4) en 10 images détourées, aux noms attendus par `tools/asset_sources.json`. Tests : `python -m unittest tools/test_decoupe_planche.py tools/test_prepare_assets.py` (12 tests).
- Fond accepté : **vert vif uni**, planche déjà transparente, ou **fond crème / dégradé doux** (depuis le 2026-11-20 16 h 15 : fond reconstitué, ombre au sol et trous du fond retirés). Fond bruité refusé. Deux animaux qui se touchent sont séparés au point de contact ; l'ombre verte entre les pattes est rendue transparente (une feuille vert sombre près de la tête est gardée).
- Familles faites et dans le jeu : éléphant, girafe, tigre, panda géant, renard, hibou, lézard à collerette, paresseux, kangourou, manchot, phoque ; puis ours brun, bison, castor, hérisson, jaguar, toucan, koala (fond crème). Kangourou garçon stade 3 : pied repris de la fille stade 3 (son pied était vert sur la planche).
- Ces espèces sont marquées `"_raw": true` dans `tools/asset_sources.json` : `npm run assets` garde leur bord doux tel quel (pas de seuil ni d'érosion).
- Les images dont la source a disparu (lion, panda roux ; 3 anciens décors d'Amérique du Sud ; carte du monde, savane, portrait des lions) restent dans le jeu : `npm run assets` garde l'image déjà convertie.
- Une posture ne change jamais : un animal dessiné couché reste couché (la marionnette respire, parle, se dandine). Phoques couchés, paresseux et castors assis, bébés assis au stade 1 : normal.

## Prénom de l'enfant et sa prononciation (2026-11-20)

- **Premier lancement** : « Play » ouvre l'écran « What's your name? » (dit en anglais, aide française). L'enfant tape son prénom avec le parent, puis écoute « Hello, <prénom>! » de trois façons : 🇫🇷 à la française, 🇬🇧 à l'anglaise, ✏️ comme je l'écris (ex. « Ma-é-la », lu à la française). On garde celle qui sonne juste, puis « C'est parti ! ».
- **Les animaux l'appellent par son prénom** : titre « Hello, <prénom>! », Maman qui accueille à l'arrivée dans un lieu, « Well done, <prénom>! » du personnage en fin d'aventure, bonne nuit, merci… (27 phrases).
- **Comment** : l'ordinateur qui sert le jeu enregistre ces 27 phrases avec le prénom (≈ 40 s, en arrière-plan) : la phrase anglaise est convertie en sons, les sons du prénom (prononciation choisie) y sont insérés, puis la voix Kokoro dit le tout. Rangé dans `prenoms/<id>/` (privé, ignoré par git). Essai d'écoute ≈ 6 s.
- **Sans l'ordinateur** (jeu copié ailleurs, voix pas encore prêtes) : rien ne casse, les animaux disent les phrases sans prénom, comme avant.
- **Espace parents** : prénom, prononciation, état des voix, bouton « Changer le prénom ou sa prononciation ». Aucun verrou.
- Code : `src/engine/nameVoice.ts` (décisions testées), `src/ui/NameSetup.tsx`, `src/ui/useNameVoices.ts`, `src/audio/speech.ts` (`setNameVoice`, `sequence`), `tools/names/namePlugin.mjs` (serveur), `tools/tts/name_voices.py` (voix). Tests : `src/engine/nameVoice.test.ts`, `src/audio/speech.test.ts`, `tools/tts/test_name_voices.py`.
- Vérifié au navigateur avec un prénom d'essai (« Chloé ») : écran du prénom, trois essais d'écoute, choix sauvegardé, 27 phrases prêtes, titre dit avec le prénom après rechargement. Partie d'essai effacée ensuite.
- Limite : la prononciation « à l'anglaise » ou « à la française » vient d'un convertisseur automatique ; pour un prénom rare, la carte « Comme je l'écris » est la solution.

## Lézard à collerette, décors d'Australie et d'Antarctique, dossier Animaux rangé (2026-11-20, 12 h 10)

- **Dossier `Animaux/` rangé** : un dossier par continent, une famille par sous-dossier (`tools/asset_sources.json` suit les nouveaux chemins).
- **Lézard à collerette** (`frilled_lizard`, Frankie et Frida, 🦎) remplace l'ornithorynque en Océanie : 10 dessins du parent (parents + 4 stades fille et garçon), squelettes animés (4 pattes), salutations. Une ancienne sauvegarde qui contiendrait une famille d'ornithorynques ne casse pas l'album (test).
- **Australie : 5 vrais décors** (`Continant/Oceanie/01…05`) : outback rouge, forêt d'eucalyptus, gorges rouges, plage ensoleillée, forêt de fougères de Tasmanie. Les 4 anciens lieux `oc_*` (images d'Amérique du Sud) sont retirés du jeu ; leurs webp restent sur le disque.
  - Kangourou : les 5 lieux. Koala : eucalyptus et plage (pas de koala en Tasmanie). Lézard : outback, eucalyptus, gorges, plage.
  - Aventures adaptées : les étoiles (forêt d'eucalyptus), **le coquillage doré** (plage, remplace la noix de coco : pas de cocotier dans le décor), la cascade arc-en-ciel (eucalyptus ; le kangourou continue en forêt de fougères), l'outback rouge (kangourou et lézard, puis on boit aux gorges). Les identifiants internes des aventures sont gardés pour les sauvegardes ; l'ancien trésor « noix de coco dorée » reste reconnu.
- **Antarctique : 5 vrais décors** (`Continant/Antartic/`) : banquise, grotte de glace, plaine enneigée, mer froide, banquise du soir. Fin du décor provisoire en dégradé. Le bateau, l'igloo et la vague (absents des images) sont remplacés par la falaise, le rocher, la glace ; l'oiseau vole désormais comme objet dans le ciel ; le manchot rentre dans la grotte de glace.
- Contrôlé au navigateur (1024 × 768) : Océanie → lézard dans l'outback, Antarctique → manchots sur la banquise, décors chargés.
- **Non intégrés pour l'instant** : les packs Jaguars, Toucans, Paresseux, Kangourous et Koalas présents dans `Animaux/` ne sont pas encore câblés comme personnages ; manchot, phoque et orque n'ont pas encore de dessins (pictogrammes).
- ~~À voir avec le parent~~ réglé le 20/11 après 14 h 40 : les deux nouvelles images d'Amérique du Sud sont câblées, `sa_valley` retiré.

## Jeux bonus de la mer (2026-11-20, 10 h 45)

Demande du parent : « Je veux qu'on se serve de ces 3 animaux marins pour faire des jeux bonus. Ils doivent aussi être interactifs. » Testé au navigateur en taille tablette (1024 × 768) ; partie de test effacée ensuite.

- **Sur la carte** : la baleine, la tortue et les deux dauphins peints sur la carte sont recouverts de leur découpe exacte (`public/assets/sea/*.webp`, fabriquées par `python scripts/sea_sprites.py public/assets/backgrounds/world_map.webp public/assets/sea`). Au toucher, l'animal grossit et se dandine, dit bonjour avec sa voix (« Splash! I'm a big blue whale! Let's play! ») et une bulle ▶ propose son jeu. Pas de verrou ni d'ordre imposé.
- **Baleine, « Count my splashes! »** : elle souffle 1 à 5 jets d'eau, qui restent affichés pour qu'on puisse les compter, puis l'enfant touche la bonne carte (chiffre + mot). Erreur : « Oops! Watch again! », puis elle compte avec l'enfant (« One, Two, Three! ») et la bonne carte brille. Toucher la baleine relance les jets.
- **Tortue, « Find it! »** : trouver le poisson, le crabe, le coquillage ou la pieuvre dans des bulles ; la tortue nage jusqu'à la bonne. Toucher la tortue redit la consigne.
- **Dauphins, « Big or little? »** : « Big dolphin, jump! » ; on touche le bon dauphin, qui saute, nage ou éclabousse. Le mauvais répond « Not me! I'm the little dolphin! » ; à la 2e erreur, l'indice est dit et le bon dauphin brille.
- Fin : étoiles, confettis, retour à la carte ; les mots joués (nombres, fish, crab, shell, octopus, big, little, jump, swim, splash) arrivent au passeport (`seaReward`).
- Code : `src/content/sea.ts` (textes), `src/engine/sea.ts` (lecteur pur, déterministe), `src/ui/SeaBonus.tsx`, `src/ui/WorldMap.tsx`, écran `sea` dans `App.tsx`. Nouveaux mots `little`, `crab`, `octopus`. Voix : 48 enregistrements. Tests : `src/engine/sea.test.ts` (13 tests).
- Limite : les découpes gardent un léger halo de l'eau de la carte ; il se fond bien dans la mer de l'écran bonus.

## Simon says, Yes or no, chatouilles et câlins (2026-11-20, 10 h 15)

Demande du parent : « Les 3 conseillées ». Testé en taille tablette (1024 × 768) avec une partie fictive de lions (2 bébés), effacée ensuite (navigateur et `saves/`).

- **« Simon says! »** (`family_orders`, `src/content/activities/play.ts`, menu de tous les personnages) : la voix dit « Daddy, jump! », « Baby girl, dance! »… ; l'enfant touche le bon membre de la famille, qui le fait aussitôt. Mauvais personnage : il répond « Not me! Find … ! » ; à la 2e erreur, l'indice est dit et le bon personnage brille. Papa et Maman au niveau débutant, + le bébé au niveau intermédiaire, + le 2e bébé au niveau expert. Un geste différent par personnage (seulement ceux que l'espèce sait faire ; le panda n'en a que 3 pour 4, une répétition est alors possible). Nouvelle étape `tapActor` (types, lecteur, voix, validation).
- **« Yes or no? »** (`yes_or_no`) : questions rigolotes à la première personne (« Can I fly? », « Do I eat bamboo? ») et générales (« Is the sun cold? », « Do cats say woof? ») ; réponse 👍 / 👎 sans lire. Les questions sur l'animal viennent de ses vraies capacités et de sa vraie nourriture. 3 questions (débutant), 5, puis 6 (expert). Classé « talk » pour ne pas prendre, au canyon, la place du jeu de l'écho.
- **Chatouilles et câlins** (`src/engine/cuddles.ts`) : **appui long** (un peu plus d'une demi-seconde) sur un bébé → il rit (« Hee, hee! That tickles! », « I love you! »…) ; sur un parent → câlin (« Aww! A big hug! »). Cœurs qui montent. Un simple toucher ouvre toujours le menu. Désactivé pendant la nuit.
- **Défaut corrigé** : les mots des étapes « toucher le bon personnage » n'étaient pas comptés (`scriptItems`) : ils manquaient au passeport et le jeu restait en bas du classement du menu.
- Voix : 457 nouveaux enregistrements (`npm run voices`). Tests : `src/engine/play.test.ts` (10 tests).

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
| **Aventures** (27) | Histoires en plusieurs scènes propres à chaque continent, avec un trésor à gagner : Afrique 4, Asie 4, Europe 4, Amérique du Nord 4, Amérique du Sud 4, Océanie 4, Antarctique 3. Chaque espèce en vit au moins 3 (l'orque, qui en avait 2, a été retirée le 2026-11-20). Données : `src/content/adventures/<continent>.ts` | tests + navigateur (Afrique, Asie) |
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
- Décors : `sa_andes` ne sert à aucune aventure (seul le toucan y va) ; quelques points du décor sont dans la zone de la famille.
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

- ~~Planches à refaire sur fond vert~~ : fait le 2026-11-20 (16 h 15), les planches sur fond crème sont découpées directement (bisons, castors, ours bruns, jaguars, toucans, hérissons, koalas).
- **Parents couchés à refaire debout** sur fond vert : jaguars, pandas géants (les pandas actuels, parents couchés, restent dans le jeu en attendant), panthères des neiges (pas encore dans le jeu).
- **Panda roux** : dossier supprimé à la demande du parent ; l'espèce reste jouable avec ses anciennes images. À confirmer : la garder ou la retirer (la panthère des neiges la remplacerait en Asie).
- **Deux nouveaux décors d'Amérique du Sud** (« Cascade tropicale… », « Clairière tropicale… ») pas encore utilisés : les anciens décors cascade, zone humide et vallée, déjà réglés (points touchables), restent en place.
- Fichiers en vrac laissés tels quels : 10 PNG à la racine de `Animaux/Amerique du Sud/Paresseux/`, 4 PNG à la racine de `Animaux/Oceanie/Kangourous/`, et les zips (Antarctique, Girafes, Paresseux).
- **Voyage accompagné d'animaux entre continents** : proposé, **non validé** — non implémenté. Les voyages de la V2 restent **à l'intérieur d'un continent**.
- Style des lions : voir la note de droits dans `docs/INVENTAIRE_ASSETS.md`.

## Journal des décisions techniques (défauts raisonnables documentés)

| Décision | Raison |
|---|---|
| Pas de Phaser : scène en couches DOM/CSS en pourcentages | Scènes de dialogue et de toucher, pas de physique ; plus léger, accessible, testable ; Phaser pourra être ajouté pour des mini-jeux |
| Sauvegarde `localStorage` versionnée plutôt qu'IndexedDB | Volume minuscule, synchrone, testable ; migration prévue |
| Versions figées (React 19.3.1, Vite 7.3.8, TypeScript 5.9.3, Vitest 3.2.7) | Reproductibilité |
| Chaque espèce n'a que les décors de son continent où elle est plausible (`allowedBiomes` dans `src/content/species.ts`, de 2 à 6 décors), pas les 5 pour tout le monde | Cohérence habitat/espèce (cahier des charges §47). Expliqué au parent le 2026-11-20, qui l'approuve (« c'est une bonne idée »). Règle ajoutée par le parent le même jour : **au minimum 3 décors par animal** ; il verra lui-même ce qui manque. Sous ce seuil aujourd'hui : **castor** (2 : lac, séquoias) et **koala** (2 : eucalyptus, plage) |
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

### 21 novembre 2026 — Toucans repris sur la canopée + écran titre

- **Toucans** : nouvelle planche « Famille de toucans en pleine croissance » (oiseaux debout sur leurs pattes, fond vert) découpée et installée (10 sprites, rigs régénérés). Ancien jeu de sprites sauvegardé hors dépôt.
- **3 nouveaux décors** (dossier `Animaux/Amerique du Sud/Toucans/`) : `sa_canopy_branch` (la grande branche), `sa_canopy_treehouse` (la cabane dans l'arbre), `sa_canopy_sunrise` (la branche du lever de soleil). Le sol est le dessus de la branche (`farY` tracé point par point dans `depth.ts`).
- Le toucan ne vit plus que dans ces trois décors ; il quitte les aventures au sol (cascade, vieilles pierres, fête de la jungle). Trois aventures canopée : « Le matin dans la canopée », « La cabane dans l'arbre », « Le fruit doré ». Nouveaux mots : branch, bridge, tree house, orchid, fruit (voix régénérées : `npm run voices`).
- **Écran titre** : l'image de la famille de lions s'affiche entière (plus rognée), la carte du titre passe en bas, et les pictogrammes sont remplacés par les vrais personnages en miniature.
- Tests : 236 Vitest, 31 Python, `tsc` propre hors `depth.test.ts` (autre chantier). Un test ajouté pour les toucans de la canopée.
- **Règle des toucans : seulement sur la branche** (demande du parent, 2026-11-21). Chaque décor perché a une bande `lane` (`[x, fond, devant]` en %) dans `depth.ts` : glisser un toucan dans le ciel ou dans le vide le ramène au bord de la branche (`snapToLane`, `laneAt`, `laneMid` dans `staging.ts` ; paramètre `lane` de `dragSpot`). Plus de perspective sur une branche : il garde sa taille (0,94 au fond, 1,06 devant), au lieu de rapetisser à 0,65. La famille démarre alignée sur la branche (`LANE_X` dans `scene.ts`) ; une place gardée d'avant est ramenée sur la branche. Tests : `src/game/lane.test.ts`. 259 Vitest, `tsc` propre.
