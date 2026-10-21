# Charte d'écriture des pages de notion

Cette charte vaut pour toutes les pages de `glossaire/mondes/<notion>/`.
Elle a été fixée sur la page pilote du fétichisme (octobre 2026). Toute
réécriture d'une page la suit, qu'elle soit faite à la main ou par un agent.

Le dossier `glossaire/mondes/` est servi en `noindex` (voir `_headers`) :
ce fichier n'apparaîtra pas dans les moteurs.

---

## 1. Pour qui on écrit

Le lecteur arrive le plus souvent par une recherche : « fétichisme de la
marchandise », « plus-value définition ». Il veut d'abord savoir de quoi on
parle. Ensuite, s'il reste, il veut comprendre. Il peut être lycéen,
étudiant en licence, préparer l'agrégation ou simplement lire Marx pour son
compte.

On écrit donc comme un professeur de philosophie qui fait cours : il pose
une question, il y répond, il explique sa réponse, il donne un exemple, il
signale les erreurs qu'on commet souvent. Il ne cherche pas à impressionner.
Il cherche à être compris, et il n'hésite pas à reprendre une idée avec
d'autres mots quand elle est difficile.

## 2. L'ordre de la page

Une page se lit à trois profondeurs. Chacune doit se suffire.

| profondeur | où | longueur | ce qu'elle fait |
|---|---|---|---|
| 30 secondes | **En bref** (`meta.enbref`) | 50 à 85 mots | définit la notion |
| 2 minutes | **Ce qu'il faut retenir** (`meta.retenir`) | 4 ou 5 points de 15 à 30 mots | donne l'argument en résumé |
| 10 minutes | **l'essai** (`essai.html`) | 1 400 à 2 600 mots | explique, cite, discute |

Puis **Vérifier sa compréhension** (`meta.questions`) : trois questions
avec leur réponse.

### La figure

La scène 3D (ou la planche) ne suit plus le défilement : elle est une
**figure posée après « Ce qu'il faut retenir »**, immobile par défaut
(l'image fixe), que le lecteur fait jouer (« Voir la scène », puis une
étape par section de l'essai). Arbitrage du propriétaire (octobre 2026) :
l'interface passe avant l'animation, le texte ne doit jamais bouger ni être
accompagné d'un mouvement qu'on n'a pas demandé.

Conséquences pour une réécriture :

- les légendes d'étape (`meta.monde.etapes`) se lisent maintenant **sous la
  figure, une à une, au clic** : chacune doit se comprendre seule ;
- `meta.monde.fixe.legende` est la légende de l'image au repos ;
- **le cadrage est à revérifier** pour les pages qui étaient en
  architecture « plein » (`meta.monde.layout: "plein"`) : leur caméra visait
  à gauche du sujet pour laisser la place au texte, et dans une figure le
  sujet peut se retrouver décentré. On regarde l'image fixe et la scène
  dans la figure ; si le sujet est décentré, on corrige la visée dans
  `monde.js` (pas de décalage quand le canevas fait moins de 1100 px) et
  l'on refait l'image avec `node tools/capture-monde.mjs <notion>`.

### En bref

- La première phrase commence par le nom de la notion et la définit :
  « Le fétichisme de la marchandise désigne… », « La plus-value est… ».
  C'est la phrase que Google peut reprendre telle quelle.
- On dit où Marx l'expose (œuvre, chapitre, date).
- On termine par ce qui rend la notion difficile ou importante, en une
  phrase.
- Aucun terme technique sans explication. Si « valeur d'usage » est
  nécessaire, on dit ce que c'est.

### Ce qu'il faut retenir

Quatre ou cinq phrases complètes, dans l'ordre de l'essai. Une personne
qui ne lit que cette liste doit pouvoir refaire l'argument. Pas de mots
isolés, pas de titres en gras suivis de deux-points.

### L'essai

Six sections au plus (autant que d'étapes du monde : `data-etape`). La
longueur suit la notion : on ne rallonge pas une page pour atteindre un
chiffre, et l'on ne coupe pas une page riche quand chaque section sert.
Avec « En bref » et « Ce qu'il faut retenir » en tête, l'essai n'a plus à
tout dire dans ses premières lignes.

- **Le titre de chaque section est une question** que le lecteur se pose :
  « D'où vient le mystère de la table ? », « Suffit-il de comprendre le
  fétichisme pour s'en libérer ? ».
- **Le premier paragraphe y répond en une ou deux phrases**
  (`<p class="nt-lead">`). Quelqu'un qui ne lit que les titres et ces
  réponses doit suivre l'argument.
- Le reste de la section explique la réponse, cite Marx, donne l'exemple.
- **Au moins un exemple concret par page**, développé
  (`<div class="nt-ex">`, voir §6). On prend de préférence celui de Marx.
  Si l'on invente des chiffres, on le dit.
- **La dernière section traite des lectures et des contresens.** Les
  contresens prennent le composant `nt-cs` (voir §6), un par erreur, trois
  au plus.

### Vérifier sa compréhension

Trois questions qu'un professeur poserait en fin de cours, avec une réponse
de deux à quatre phrases. Une question porte sur l'exemple, une sur le
mécanisme, une sur une conséquence. Pas de question piège.

## 3. Le ton

- **« On » par défaut.** « Nous » seulement pour prendre position dans un
  débat (« nous suivons Roubine sur ce point »). On s'adresse rarement au
  lecteur ; quand on le fait, c'est au vous et pour une consigne
  (« prenons un exemple », « relisez la phrase »).
- **Des phrases de longueur variée.** Une phrase courte après une longue,
  souvent. Pas de phrase de plus de quarante-cinq mots. Pas de suite de
  phrases nominales.
- **Une idée par paragraphe**, et des paragraphes de trois à six phrases.
- **Les liens logiques sont dits, mais pas à chaque phrase.** « Or »,
  « donc », « dès lors », « en cela que » : chacun une fois par section au
  plus. Un raisonnement clair n'a pas besoin d'un connecteur pour tenir.
- **Définir avant d'employer.** La première fois qu'un mot technique
  apparaît, on dit ce qu'il veut dire, dans la phrase même (« la valeur
  d'usage, c'est-à-dire l'utilité d'une chose »).
- **Un peu de style, pas davantage.** On peut reprendre une image de Marx
  (la table qui danse, le hiéroglyphe, le vampire) et s'en servir comme
  d'une prise. On peut garder son ironie quand elle porte un argument. On
  ne fabrique pas de formules.

Le modèle n'est ni le traité ni l'article de blog : c'est le cours. On
avance par questions, on reprend ce qui est difficile, et l'on ne passe à
la suite qu'une fois le point acquis.

## 4. Ce qu'on s'interdit

Ces habitudes donnent au texte l'allure d'un texte généré. Elles sont
interdites dans les pages, sauf mention contraire.

1. **Le tiret cadratin (—) et le demi-cadratin (–) dans la prose.** On les
   remplace par une virgule, deux-points, des parenthèses ou un point.
   Seule exception : une notation de Marx (A-M-A′ s'écrit avec le trait
   d'union simple).
2. **La fausse opposition** : « ce n'est pas X, c'est Y », « il ne s'agit
   pas de X mais de Y », « ni X ni Y : c'est Z », « non pas X, mais Y »,
   « plus qu'un X, un Y ». On dit Y directement. On garde l'opposition
   seulement quand X est une erreur que le lecteur commet réellement, et
   c'est alors la place d'un contresens (`nt-cs`), pas d'une phrase
   ordinaire.
3. **La phrase de clôture qui répète** le paragraphe (« Tout est là. »,
   « C'est toute la thèse. »).
4. **Les séries de trois par habitude** (trois adjectifs, trois exemples
   parallèles). Une énumération de trois est permise quand le texte de Marx
   en a trois.
5. **Le vocabulaire de remplissage** : véritable, crucial, essentiel, clé
   (adjectif), au cœur de, fondamentalement, en réalité, précisément,
   il importe de, il convient de, force est de constater, on mesure ici,
   il n'est pas inutile de, considérable, célèbre (sauf fait vérifiable).
6. **Les annonces** : « Voyons maintenant », « Il faut alors dire »,
   « Penchons-nous sur ». La question en titre suffit.
7. **Le gras** dans la prose, les titres avec majuscule à chaque mot.
8. **Les phrases sur la valeur de ce qu'on écrit** (« ce point décisif »,
   « la question cruciale »). Si c'est important, la suite le montre.

## 5. Les citations

Rien ne change sur le fond, et c'est la règle la plus stricte du dossier.

- Une citation liée (`<q data-s data-q>` ou `<blockquote data-s data-q>`)
  est une phrase **relevée dans le texte que la liseuse sert**. On ne la
  cite jamais de mémoire.
- `data-q` se copie du texte servi **au caractère près** : apostrophe
  typographique (’), orthographe de Roy (« très-complexe »), espaces
  insécables. On ne « corrige » rien.
- `node tools/verif-citations.mjs <NOTION>` (le nom du dossier en
  capitales, par exemple `FETICHISME`) doit rendre **0 introuvable** avant
  tout commit. L'outil vérifie les pages du glossaire depuis octobre 2026 ;
  à cette date, six pages en ligne avaient des citations introuvables
  (appendice de la machine, force de travail, forme-valeur, législation
  sanglante, valeur d'usage) : la réécriture de ces pages doit les réparer. `--corriger` réécrit un `data-q` à la lettre quand le motif est
  unique.
- **Les Manuscrits de 1844** (traduction Bottigelli, protégée jusqu'en
  2046) et **les livres non servis** (Livre III, lettres, *L'Idéologie
  allemande*) sont **paraphrasés et situés**, jamais cités entre guillemets.
- Dans `meta.enbref`, `meta.retenir` et `meta.questions`, pas de citation
  liée : on paraphrase. Une citation y serait invérifiable par l'outil.
- On garde les citations de l'ancienne version quand elles servent ; on
  peut en retirer, on en ajoute seulement après vérification.

## 6. Les composants de l'essai

Le gabarit (`tools/gen-seo.mjs`, `pageMonde`) les met en forme ; on écrit
seulement le balisage.

```html
<section class="nt-sec" data-etape="table" id="table">
<h2>D'où vient le mystère de la table ?</h2>
<p class="nt-lead">La réponse en une ou deux phrases.</p>
<p>L'explication…</p>

<div class="nt-ex">
<p class="nt-ex-t">Un exemple</p>
<p>L'exemple développé, en un ou deux paragraphes.</p>
</div>
</section>

<!-- dans la dernière section -->
<div class="nt-cs">
<p><span class="nt-cs-k">On lit souvent</span> L'erreur, dite honnêtement.</p>
<p><span class="nt-cs-k">Ce que dit le texte</span> La correction, appuyée sur Marx.</p>
</div>
```

- `data-etape` et `id` ne changent pas lors d'une réécriture : le monde lit
  le premier, la recherche du site et les liens externes le second.
- Les légendes du monde (`meta.monde.etapes`) suivent la même charte :
  une ou deux phrases, pas de tiret.

## 7. `meta.json`

Champs nouveaux, tous obligatoires pour une page réécrite :

```json
"enbref": "Le fétichisme de la marchandise désigne…",
"retenir": ["…", "…", "…", "…"],
"questions": [{ "q": "…?", "r": "…" }, …]
```

`enbref` remplace `chapo` (on supprime `chapo`). `description` reste le
texte du résultat Google (150 caractères environ) et suit la même charte.
La présence de `enbref` fait passer la page au nouveau gabarit
(`nt--tete`) ; une page non réécrite garde l'ancien.

## 8. Avant de rendre une page

- [ ] `node tools/gen-seo.mjs` sans erreur, puis `--check` à jour ;
- [ ] `node tools/verif-citations.mjs` : 0 introuvable ;
- [ ] aucun tiret cadratin dans la prose : le générateur refuse une page
  réécrite qui en garde un (y compris dans `source.cite` et les légendes) ;
- [ ] aucune des tournures du §4, relu à voix haute ;
- [ ] « En bref » commence par le nom de la notion ;
- [ ] chaque titre de section est une question, chaque section ouvre sur
  `nt-lead` ;
- [ ] au moins un `nt-ex`, et les contresens en `nt-cs` ;
- [ ] trois questions dans `meta.questions` ;
- [ ] aucun fait nouveau sans source (date, nom, titre d'ouvrage) : on ne
  comble pas un blanc par une supposition.
