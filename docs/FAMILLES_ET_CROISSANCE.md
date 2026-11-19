# FAMILLES, NAISSANCES ET CROISSANCE DES BÉBÉS

## 1. Composition de chaque famille
Pour chaque espèce principale : **deux adultes interactifs**, parent `father` et `mother`, personnalités distinctes, répliques adaptées au niveau ; **deux bébés maximum** par famille et par sauvegarde, un `boy` et un `girl`. Les parents peuvent exister/interagir avant toute naissance. Les noms des adultes sont définis par les contenus du jeu et restent constants ; prénoms des bébés choisis librement par la joueuse.

Si la première naissance est un garçon, la seconde sera une fille, et inversement. N'empêcher ni d'explorer ni d'apprendre si aucun bébé n'a encore été créé. Ne pas confondre ce choix de représentation des bébés avec le système pédagogique du masculin/féminin anglais.

## 2. Événement familial — cinématique
Déclenché à l'initiative de la joueuse ou par un événement qu'elle accepte. Séquence courte, tendre, positive, adaptée à 7 ans : rapprochement des parents, petit jeu/câlin, cœurs discrets, transition douce, bébé arrive. Pour oiseaux/reptiles et espèces ovipares, adapter à l'éclosion d'un œuf ; pour mammifères, transition pudique vers nouveau-né. Pas de reproduction représentée, grossesse explicite, douleur ou explication biologique complexe. Bouton passer/sauter la scène ; possibilité de revoir la cinématique.

Après l'arrivée : choix du sexe disponible, prénom libre 1–18 caractères (Unicode, espaces et tirets contrôlés), filtrage des entrées malveillantes, aucune obligation d'un vrai prénom. Enregistrer immédiatement. Le deuxième bébé doit être l'autre sexe. Une naissance peut aussi permettre une petite leçon `It's a boy!`, `It's a girl!`, `This is my brother/sister.`

**Cohérence espèce :** ne pas appeler « maman lion » un mâle à crinière et inversement ; selon espèce, dimorphisme discret. Chez certaines espèces, les habitudes familiales anthropomorphisées sont purement fictionnelles ; garder une présentation chaleureuse sans revendiquer une exactitude biologique totale.

## 3. Quatre stades de croissance
| Stade interne | Nom UI | Visuel / comportement | Capacités de dialogue |
|---|---|---|---|
| `newborn` | Nouveau-né | Très petit, mouvements lents, découvre objets et proches | questions simples `What's this?`, `Who is that?`, réponses courtes |
| `little` | Petit explorateur | joue, marche/se déplace, curiosité accrue | `Is it blue?`, `Can we play?`, notions mémorisées |
| `young` | Jeune aventurier | davantage d'expressions, explore avec aide | `Where should we go?`, `Why ...?` avec réponses guidées |
| `companion` | Grand compagnon | presque adulte, autonomie de jeu, sans remplacer parents | conversations de plusieurs tours et projets communs |

La croissance suit une fonction de progrès **multicritère**, pas un chronomètre : diversité de connaissances enseignées et réutilisées, aventures diverses terminées, interactions positives variées. Prévoir seuils paramétrables et plafonds anti-farming ; **pas de croissance si l'on clique 50 fois le même mot**. Les étapes peuvent rester accessibles même si la joueuse a avancé en anglais ; elles ne dépendent pas mécaniquement des niveaux 1/2/3. Prévoir une annonce non intrusive et une jolie transformation, jamais une perte d'habiletés ou de souvenirs.

Exemple de seuils indicatifs POUR TESTS, à ajuster après observation : `newborn -> little` : 8 expressions vues, 3 différentes retenues, 2 activités distinctes ; `little -> young` : 20 expressions vues, 10 retenues, 6 aventures variées ; `young -> companion` : 40 expressions vues, 22 retenues, 12 aventures variées. Ne pas présenter ces chiffres comme objectifs éducatifs universels.

## 4. Le bébé prend l'initiative
Chaque bébé possède un état (`curious`, `playful`, `tired`, `hungry`, `thirsty`, `content`) léger, non punitif, et une personnalité stable (`shy`, `adventurous`, `gentle`, `funny`, etc.). Il peut déclencher une demande contextuelle :
- Nouveau-né : « What's this? » -> sélectionner une image ou répondre avec aide.
- Petit explorateur : « Is this a tree? » -> yes/no + nom.
- Jeune aventurier : « Can you show me where the river is? » -> aider et se déplacer.
- Grand compagnon : « Last time you showed me a river. Shall we go again? » -> souvenir + nouvelle mission.

Ses questions doivent avoir un objectif pédagogique : développer les acquis de l'enfant (retrieval practice, explication, conversation). Un bébé qui connaît un mot doit le **réutiliser**, pas répéter qu'il l'ignore. Une question inconnue peut être formulée comme découverte d'un nouveau contexte (ex. la couleur d'une nouvelle fleur, pas « qu'est-ce qu'un arbre ? » après 20 leçons sur les arbres).

## 5. Mémoire individuelle et liens sociaux
Créer des données minimales pour chaque bébé : `babyId`, `familyId`, `name`, `sex`, `growthStage`, `personality`, `taughtSkillIds`, `retainedSkillIds`, `recentActivities`, `milestones`, `relationshipEvents`, `questMemory`, `appearanceVariant`. Les souvenirs sont des **événements structurés** et validés : « une fois on a cherché de l'eau avec la joueuse », pas des textes générés aléatoirement.

Parents : mémoire des événements familiaux ; frère/sœur : interagir, aider, jouer, s'appeler, être retrouvés, participer à une explication. Conserver relation parent/enfant sans obliger la joueuse à « s'occuper » du bébé sous peine de punition ou de manque.

## 6. Trois progressions indépendantes
1. **Joueuse** : compétences anglaises, réussites, révisions.
2. **Bébé** : connaissances retenues, croissance, personnalité.
3. **Relations** : aventures vécues ensemble, jalons familiaux.

Événement exemple : `BabyAskedWhatIsThis` -> joueuse répond `tree` avec image -> `player.skill.tree` mise à jour (avec aide ou non) ; `baby.taughtSkillIds` + `tree` ; `family.relationshipEvents` ajoute une interaction ; mini-célébration. Une action ne donne pas automatiquement 100 % de maîtrise pour l'un ou l'autre.

## 7. Cas limites à tester
- Créer premier bébé fille, deuxième garçon ; cas inverse.
- Refuser un troisième bébé dans cette famille sans casser l'interface.
- Prénoms vides, longs, caractères spéciaux, emojis, noms identiques, données sauvegardées.
- Deux bébés de stades différents, un apprend la couleur et l'autre la connaît déjà.
- Recharger pendant/après la cinématique : aucun double enregistrement.
- Changer de continent au milieu d'une interaction : retour propre, sauvegarde.
- Sécurité : aucun stockage d'enregistrement vocal par défaut ; aucun besoin de collecte de données d'enfant.
