# MOTEUR DE MISSIONS CONTEXTUELLES — SPÉCIFICATION FONCTIONNELLE ET TECHNIQUE

## 1. But
Fabriquer de nombreuses **situations jouables cohérentes** sans écrire un jeu complet pour chaque combinaison de 7 continents × 21 espèces × 4 âges × 24 domaines. Le moteur ne doit pas inventer arbitrairement un scénario : il choisit et assemble des **archétypes prévalidés**, des objets compatibles, des répliques rédigées et des actions réalisables dans une scène.

## 2. Les couches de composition
1. `PlayerSkillState` : compétences acquises, à découvrir, à réviser, niveau d'assistance nécessaire.
2. `WorldContext` : continent, biome précis, lieu, météo simulée, points interactifs présents.
3. `ActorContext` : espèce, individu (father/mother/baby1/baby2), personnalité, stade de croissance, mobilité/nourriture.
4. `Motivation` : curiosité, soif, faim, besoin social, jeu, aide, événement d'exploration — légère et jamais punitive.
5. `QuestArchetype` : type de tâche (fetch, guide, locate, classify, count, ask-answer, teach-baby, follow-directions, family-reunion, build etc.).
6. `DialoguePack` : variantes Beginner / Intermediate / Expert en anglais validées, traduction FR cachée, fichier audio ou synthèse de secours, réponses et aides.
7. `WorldMutations` et `LearningEvents` : déplacer un acteur, satisfaire besoin, mémoriser un objet, mettre à jour compétence enfant/bébé, journal d'historique.

## 3. Invariants
- Une quête doit toujours posséder `entry`, `challenge`, `success`, `fallback`, `exit` ; vérifier qu'un chemin de succès est accessible sans microphone.
- Chaque `QuestArchetype` déclare les compétences qu'il peut enseigner et les exigences graphiques/physiques : `requiredAnchors`, `allowedBiomes`, `speciesConstraints`, `requiredCapabilities`, `requiredActors`, `interactiveObjects`.
- Les besoins sont des **occasions narratives** : un bébé assoiffé n'est jamais en danger de mort, il reste possible d'interrompre/reprendre.
- Le contenu anglais est contrôlé par l'auteur ; substitution de variables limitée (`{actorName}`, `{object}`, `{placeName}`, `{color}`, `{number}`) avec grammaire testée, pluriels/accords définis. Ne jamais former mécaniquement une phrase anglaise incorrecte à partir d'un mot.
- Ne pas générer un voyage physiquement impossible (éléphant sous l'eau de mer, orque marchant en forêt, manchot dans un arbre).
- À niveau d'anglais égal, une activité doit pouvoir exister avec plusieurs espèces et au moins deux habitats en modifiant la situation, pas en projetant la même scène partout.

## 4. Pipeline déterministe
```
OnPlayerRequestsInteraction(place, actor):
    profile = loadPlayerSkills()
    context = loadHabitat(place)
    actorState = loadActor(actor)
    goals = choosePedagogicalGoals(profile, revisionDue, recentHistory)
    candidates = listQuestArchetypes()
        .filter(isCompatible(context, actorState))
        .filter(hasAllRequiredAssets)
        .filter(goalCompatibility(goals))
        .filter(isPlayableByTouch)
    ranked = rank(candidates,
        contextRelevance, goalValue, characterPersonality,
        novelty, familyRelationship, pastSuccess, playerChoice)
    choice = offerUpToThreeDistinctActivities(ranked)
    quest = instantiate(choice, allowedParameters, validatedDialoguePack)
    validateQuestRuntime(quest)
    play(quest)
    commitTransactionalEvents(quest.outcome)
```

`choosePedagogicalGoals` peut suggérer de nouvelles notions pertinentes, mais **ne conditionne jamais l'accès au continent**. Une seule mission peut combiner notion du niveau, révision d'acquis et un mot environnemental présenté oralement avec pictogramme.

## 5. Répétition et diversité
- Historique des derniers `N=10` archétypes et personnages par profil (seuil ajustable).
- Pénaliser les répétitions rapprochées, sans refuser une mission explicitement choisie.
- Pas plus de deux missions successives de même mécanique suggérées automatiquement, sauf demande explicite.
- Varier `intro`, `challenge`, `path`, `result`, avec variantes validées ; utiliser des objets et points de scène différents.
- Enregistrer les quêtes vécues par les bébés pour activer rappels/mémoires.
- Permettre au moins une activité sans mission : observer, découvrir un son, converser brièvement, explorer.
- Empêcher des besoins incohérents qui se répètent toutes les 30 secondes (`cooldown` narratif, sans punition).

## 6. Exemple fil rouge : « J'ai soif »
**Savane, éléphanteau / domaine 1.7 ou révision 1.1 :**
- Déclencheur : le bébé dit `I'm thirsty!` et montre un pictogramme eau.
- Débutant : `Water, please!` ; enfant choisit une gourde / le point d'eau ; mini-dialogue `Let's go!` ; `Thank you!`.
- Intermédiaire : `Where is the water?` -> enfant doit repérer le plan d'eau `near the big tree`, guider le bébé.
- Expert : `It's hot today. We need water. Which path is shorter?` -> comparer des indices et utiliser `left/right` et `because` avec aide, selon compétences.
- Au point d'eau : animation de l'éléphanteau buvant, émotion positive ; possibilité de parler de `hot`, `cold`, `water`, `drink`.
- Mémoire bébé : `found_waterhole_with_player`; lors d'une visite ultérieure il peut dire `Remember? We found water here!`.
- Transition de retour libre vers l'habitat.

**Version savane lionceau :** même objectif de compréhension `thirsty`/eau, mais personnage, déplacement, chemin, animation, dialogue et réactions distincts. **Version banquise :** ne pas copier un point d'eau de savane ; remplacer par un objectif approprié (un bébé manchot cherche un endroit sûr pour rejoindre sa famille ou un poisson), mêmes compétences de `where`/direction ou émotions, autre archétype.

## 7. Deuxième exemple : « Enseigne-moi ce mot »
- Bébé nouvellement né pointe un élément présent (`tree`, `ice`, `flower`) qu'il ne connaît pas ; question `What's this?`.
- L'enfant touche l'image / sélectionne une carte / répond si micro activé.
- Le bébé répète avec intonation : `A tree! Thank you!`.
- Le moteur enregistre `taught` ; reteste **une autre fois et dans un autre contexte** avant `retained`.
- Si bébé possède déjà le mot : `I remember! It's a tree!` et il demande `Is the tree big?` au lieu de recommencer au stade zéro.
- Scène spécifique au lieu (banquise -> iceberg / snow, savane -> acacia / shade, forêt -> leaf / branch).

## 8. Dialogues : 3 niveaux sans IA libre
### Pack d'exemple
```
quest_id: find_water
level: beginner
entry: "I'm thirsty!"
responseOptions: ["Let's find water!", "Hello!", "Goodbye!"]
correct: "Let's find water!"
onCorrect: "Yes, please! Let's go!"
onIncorrect: "Listen again: I'm thirsty. I need water!"
audioReplay: true
hint: water_icon
```
Ce pseudo-format illustre la mécanique ; respecter le schéma typé réel de l'implémentation. Une mauvaise réponse peut être suivie d'une explication ; l'enfant n'est pas obligé de répéter mot pour mot une phrase longue.

## 9. Nombre de contenus : réalisme de production
- **20 archétypes** réutilisables au lancement du moteur, pas 20 quêtes toutes prêtes dans 21 familles.
- **7 packs d'habitat** initiaux avec au moins 10 points/objets contextuels et une quinzaine d'expressions environnementales chacun.
- **21 packs d'espèce** à terme, avec aptitudes, aliments, comportements, animations et famille.
- **24 domaines pédagogiques** avec objectifs, phrases, évaluation, indices.
- **3 bandes de complexité** pour dialogues ; **4 stades** de bébé qui modifient la formulation et les actions possibles.

Le nombre théorique de combinaisons ne garantit pas autant de quêtes qualitativement différentes. Pour empêcher l'illusion de variété, tester des sessions de 20 minutes et mesurer : répétition d'archétypes, de dialogues, d'objets, de mouvements, choix réels, et nouveauté ressentie.

## 10. Modules logiciels conseillés
- `SkillGraph` : prérequis souples, suivi, révisions.
- `WorldRegistry` : continents, biomes, lieux, points interactifs.
- `SpeciesRegistry` : caractéristiques et compatibilités.
- `FamilySystem` : parents, bébés, croissance, mémoire.
- `QuestCatalog` : archetypes et scénarios.
- `QuestSelector` : filtrage, classement, variété, choix de joueur.
- `DialogueEngine` : scripts, variables, niveaux, embranchements, hints.
- `EventStore` : événements structurés et sauvegarde versionnée.
- `AudioService` : audio préenregistré en priorité, synthèse en secours.

Pour le prototype, le sélecteur peut être déterministe avec graine pseudo-aléatoire ; il doit être testable et reproductible.

## 11. Validation automatique à prévoir
1. Pour chaque entrée du catalogue, au moins un chemin de réussite sans microphone.
2. Toutes les phrases utilisées ont texte, traduction de contrôle et audio ou stratégie de secours.
3. Aucune quête demandant `waterhole` n'est proposée sans point d'eau.
4. `species.allowedBiomes` couvre le biome actif, sauf visite intercontinentale explicitement autorisée ultérieurement.
5. Lors de 100 sélections simulées, aucun choix n'est impossible, aucune quête ne manque d'objet requis.
6. Changer d'acteur ou continent ne remet pas à zéro le graphe de compétences.
7. Rejouer une mission volontairement reste possible ; recommandation automatique pénalise les doublons.
8. Une même notion `1.1` fonctionne au moins avec lion en Afrique et manchot en Antarctique (dialogues et environnement distincts).
