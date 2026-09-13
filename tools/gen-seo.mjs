#!/usr/bin/env node
/* gen-seo.mjs — régénère les données structurées Book et le sitemap.
 *
 * MODE D'EMPLOI :   node tools/gen-seo.mjs        (depuis la racine du dépôt)
 *                   node tools/gen-seo.mjs --check  (ne récrit rien, sort 1 si périmé)
 *
 * Ce script n'est PAS une étape de build — le site reste 100 % statique et
 * Cloudflare Pages ne l'exécute jamais. C'est un outil de dépôt, comme
 * tools/export-chariot.mjs : on le lance à la main quand la source change,
 * et on commite le résultat.
 *
 * SOURCE UNIQUE : oeuvres/bibliotheque.json. Le titre, la description, les
 * concepts et le chemin d'une œuvre ne sont JAMAIS recopiés ici — ils sont
 * lus. Seuls les faits d'édition que bibliotheque.json ne porte pas vivent
 * dans la table EDITION ci-dessous, et chacun est annoté de l'endroit où il
 * est VISIBLE dans la page : un JSON-LD ne doit affirmer que ce que le
 * lecteur peut vérifier de ses yeux.
 *
 * LES URL N'ONT PAS D'EXTENSION. Cloudflare Pages sert des URL propres :
 * /oeuvres/capital-1.html répond 308 vers /oeuvres/capital-1. Une canonique
 * en .html désigne donc une page qui redirige. Voir CLAUDE.md.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ORIGIN = 'https://liremarx.com';
/* La signature de l'auteur. Elle vit ici parce qu'elle est affirmée à DEUX
   endroits — le corps de /a-propos et le `founder` de son JSON-LD — et
   qu'un schéma qui nommerait l'auteur autrement que la page serait un
   mensonge lisible par machine. Un pseudonyme est une identité : on le
   déclare, on ne le laisse pas vide. */
const AUTEUR = 'maradomarx';
const BIBLIO = 'oeuvres/bibliotheque.json';

/* ------------------------------------------------------------------ *
 * Faits d'édition absents de bibliotheque.json.
 * Une clé par œuvre DISPONIBLE. Chaque valeur dit où elle se vérifie.
 * ------------------------------------------------------------------ */
const EDITION = {
  'capital-1': {
    // « Karl Marx · 1867 · traduction Joseph Roy revue par l'auteur ·
    //   domaine public » — <p class="work-meta"> de oeuvres/capital-1.html
    datePublished: '1867',
    translator: 'Joseph Roy',
    bookEdition: "Traduction française de Joseph Roy (1872-1875), revue par Karl Marx",
    // La traduction Roy est de 1872-1875 et son traducteur est mort en 1900 :
    // elle est bien dans le domaine public. On peut donc l'affirmer.
    license: 'https://creativecommons.org/publicdomain/mark/1.0/',
    translationOfWork: {
      '@type': 'Book',
      name: 'Das Kapital. Kritik der politischen Ökonomie. Erster Band',
      inLanguage: 'de',
      datePublished: '1867'
    },
    // loadSection() appelle fr.wikisource.org — c'est la source réelle du
    // texte affiché, pas une référence de politesse.
    source: { name: 'Le Capital sur Wikisource', url: 'https://fr.wikisource.org/wiki/Le_Capital' },
    // La ligne de provenance. Elle a d'abord servi le colophon du pied de
    // page, retiré depuis sur demande du propriétaire ; elle alimente
    // désormais la notice des sources de /a-propos, qui est son seul et bon
    // endroit — c'est là qu'on vient chercher d'où vient le texte.
    // Elle est ici parce que c'est un FAIT D'ÉDITION, au même titre que le
    // traducteur, et qu'il doit pouvoir se relire à côté de ce qu'il affirme.
    // Elle peut dire « domaine public » : Roy est mort en 1900.
    colophon: 'traduction Joseph Roy (1872) revue par Marx, domaine public, servie depuis Wikisource'
  },

  'manuscrits-1844': {
    // « Karl Marx · écrits en 1844, publiés en 1932 · traduction française ·
    //   Marxists Internet Archive » — <p class="work-meta"> de
    //   oeuvres/manuscrits-1844.html
    dateCreated: '1844',
    datePublished: '1932',
    alternateName: 'Manuscrits économico-philosophiques de 1844',
    // Le traducteur est ÉTABLI, et il ne l'a pas toujours été. La page a
    // longtemps affiché « J.-M. Palmier · domaine public » : les deux termes
    // étaient faux. La note de traduction servie par le site est signée
    // « E. B. » et décrit un travail achevé après des corrections reçues de
    // Moscou au printemps 1961 — Jean-Michel Palmier, né en 1944, avait alors
    // dix-sept ans. Le catalogue de la BnF a tranché : « Oeuvres complètes
    // [7], Manuscrits de 1844, économie politique et philosophie », traduit
    // par Émile Bottigelli (1910-1975), 1962. On le nomme donc.
    translator: 'Émile Bottigelli',
    //
    // TOUJOURS PAS DE license, et cette fois avec une date : Bottigelli est
    // mort en 1975, sa traduction entre dans le domaine public le
    // 1er janvier 2046 (vie + 70 ans en France). L'original de Marx est
    // libre ; sa traduction ne l'est pas du fait de l'original.
    // Et il n'existe AUCUNE traduction française libre à lui substituer : le
    // texte n'ayant paru qu'en 1932, la plus ancienne traduction française
    // est celle de 1962. Recherche faite au catalogue de la BnF —
    // Papaïoannou (1972, mort en 1981), Gougeon (1996), Fischbach (2007)
    // sont tous postérieurs, et Costes/Molitor ne l'a jamais traduit (ses
    // tomes VI et VII sont L'Idéologie allemande).
    // (isAccessibleForFree reste vrai : la page est gratuite, ce qui est une
    // autre question que la licence.)
    source: { name: 'Manuscrits de 1844 — Marxists Internet Archive',
              url: 'https://www.marxists.org/francais/marx/works/1844/00/km18440000/' },
    // Elle ne dit PAS « domaine public », et c'est le même silence délibéré
    // que l'absence de `license` juste au-dessus : la traduction Bottigelli
    // est protégée jusqu'au 1er janvier 2046. Un colophon qui l'affirmerait
    // serait la mention fausse que la mission `affaire-palmier` a retirée.
    colophon: "traduction Émile Bottigelli (1962), importée du Marxists Internet Archive"
  }
};

/* Pages « de site » qui ne sont pas des œuvres. */
const SITE_PAGES = [
  { file: 'index.html',                 url: '/',                       priority: '1.0', changefreq: 'weekly' },
  { file: 'oeuvres/bibliotheque.html',  url: '/oeuvres/bibliotheque',   priority: '0.8', changefreq: 'weekly' },
  { file: 'oeuvres/place-publique.html',url: '/oeuvres/place-publique', priority: '0.7', changefreq: 'weekly' },
  /* /jeu/ — la page qui présente « Le circuit du capital ». C'est ELLE qui
     entre au sitemap, pas /jeu/jouer : la partie est une application sans
     contenu à indexer, et elle porte un noindex posé par
     tools/import-jeu.mjs.
     LE SLASH FINAL EST OBLIGATOIRE, et c'est le PENDANT de la règle
     « pas d'extension » : la présentation du jeu est l'index d'un DOSSIER,
     et Cloudflare Pages répond 308 de /jeu vers /jeu/ exactement comme il
     répond 308 de /page.html vers /page. Mesuré en production le jour de la
     mise en ligne : canonique, og:url et sitemap désignaient tous les trois
     une URL qui redirige — le défaut même que la mission seo-urls-reelles
     avait corrigé, reproduit en miroir. Ne pas « nettoyer » ce slash. */
  { file: 'jeu/index.html',             url: '/jeu/',                   priority: '0.8', changefreq: 'monthly' },
  /* Le glossaire — page dérivée, voir plus bas. */
  { file: 'glossaire/index.html',      url: '/glossaire/',             priority: '0.7', changefreq: 'monthly' },
  /* /a-propos — page-FICHIER, donc SANS extension et SANS slash final.
     C'est l'autre moitié de la règle du slash rappelée juste au-dessus :
     un dossier prend son slash, un fichier n'en prend pas. */
  { file: 'a-propos.html',             url: '/a-propos',               priority: '0.6', changefreq: 'yearly' },
  /* /mentions-legales — page-FICHIER elle aussi. Priorité basse : ce n'est
     pas une page qu'on cherche, mais elle doit rester trouvable. */
  { file: 'mentions-legales.html',     url: '/mentions-legales',       priority: '0.3', changefreq: 'yearly' }
];

/* HORS SITEMAP, et c'est un choix motivé — voir CLAUDE.md :
 *   oeuvres/carnet.html   — le carnet privé du lecteur
 *   oeuvres/messages.html — la messagerie privée
 * Déconnecté, ces deux pages n'ont aucun contenu à indexer : elles
 * n'affichent qu'une invitation à se connecter. Les annoncer dans un
 * sitemap, c'est demander à un moteur de venir chercher une page vide.
 * Elles restent crawlables (robots.txt Allow: /) et portent chacune leur
 * canonique — on ne les cache pas, on ne les met simplement pas en avant.
 *   oeuvres/index.html    — redirection 301 vers / (voir _redirects)
 */

const clean = p => '/' + p.replace(/\.html$/, '').replace(/^\/+/, '');

/* Rempli par le bloc « glossaire » et consommé par le bloc « sitemap »,
 * qui vient après : les pages de notion n'existent pas à l'avance, elles
 * dépendent de ce que le lexique a écrit. */
const PAGES_NOTIONS = [];
/* LES PAGES DE CHAPITRE (mission chapitres-capital) : leur liste dépend des
 * dossiers présents sous oeuvres/capital-1/chapitres/, et elle est lue par le
 * glossaire — qui renvoie de la notion au chapitre qui l'établit — AVANT que
 * les pages ne soient assemblées. D'où ce relevé en tête. Le romain donne le
 * dossier et le deep-link de l'atelier (#ch=X) ; l'arabe donne l'adresse,
 * parce que c'est « chapitre 10 » que l'on tape. */
const CHAP_DIR = 'oeuvres/capital-1/chapitres';
function romainVersArabe(rn) {
  const v = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let n = 0;
  for (let i = 0; i < rn.length; i++) { const a = v[rn[i]], b = v[rn[i + 1]] || 0; n += a < b ? -a : a; }
  return n;
}
const CHAP_META = existsSync(CHAP_DIR)
  ? readdirSync(CHAP_DIR).filter((d) => existsSync(`${CHAP_DIR}/${d}/meta.json`)).map((d) => {
      const m = JSON.parse(readFileSync(`${CHAP_DIR}/${d}/meta.json`, 'utf8'));
      return { ...m, dossier: `${CHAP_DIR}/${d}`, arabe: romainVersArabe(m.rn),
               href: `/oeuvres/capital-1/chapitre-${romainVersArabe(m.rn)}` };
    })
  : [];
/* Rempli par l'assemblage des chapitres, lu par le sitemap et par la table
 * du maillage injectée dans l'atelier. */
const PAGES_CHAPITRES = [];
const CHAP_HREF = {};
/* LES COMMENTAIRES GUIDÉS et la page-carrefour /agregation-2027 (mission
 * agregation-2027). Relevés en tête pour la même raison que les chapitres :
 * la page de chapitre et la page de notion renvoient au commentaire qui porte
 * sur elles, et elles sont assemblées AVANT lui. Le nom du dossier EST
 * l'adresse : /commentaires/<slug> — une adresse sans millésime, parce qu'un
 * commentaire vaut au-delà d'une session ; seule la page-carrefour est datée. */
const COMM_DIR = 'commentaires/textes';
const COMM_META = existsSync(COMM_DIR)
  ? readdirSync(COMM_DIR).filter((d) => existsSync(`${COMM_DIR}/${d}/meta.json`) && existsSync(`${COMM_DIR}/${d}/essai.html`)).sort().map((d) => {
      const m = JSON.parse(readFileSync(`${COMM_DIR}/${d}/meta.json`, 'utf8'));
      if (m.slug !== d) throw new Error(`Commentaire ${d} : le slug de meta.json (${m.slug}) doit être le nom du dossier.`);
      return { ...m, dossier: `${COMM_DIR}/${d}`, href: `/commentaires/${d}` };
    })
  : [];
const PAGES_COMMENTAIRES = [];
const CARREFOUR = { dir: 'commentaires/carrefour', file: 'agregation-2027.html', url: '/agregation-2027' };
/* Les notions, telles que le glossaire les a dédoublonnées et nommées —
 * l'index de recherche en dérive (voir « L'index de la recherche »). */
let INDEX_NOTIONS = [];
/* LE CONTRAT DU MAILLAGE — le titre EXACT d'une fiche de concept d'atelier
 * vers l'adresse de sa page de notion. Rempli par le bloc « glossaire »,
 * consommé par la section « maillage » : la résolution (identité, suffixe
 * de station, renvoi `voir`, `page.slug`) se fait une seule fois, ici, et
 * les ateliers n'ont plus qu'une table à lire. */
let LIENS_FICHES = { 'Le Capital': {}, 'Manuscrits de 1844': {} };

function lastmod(file) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file],
                           { encoding: 'utf8' }).trim();
    if (d) return d;
  } catch { /* dépôt absent : on retombe plus bas */ }
  return new Date().toISOString().slice(0, 10);
}

const biblio = JSON.parse(readFileSync(BIBLIO, 'utf8'));
const available = biblio.works.filter(w => w.status === 'available');

/* ---------------------------- Book ---------------------------- */
function bookFor(w) {
  const e = EDITION[w.id];
  if (!e) throw new Error(
    `Œuvre disponible sans faits d'édition : ${w.id}. Ajoutez-la à EDITION ` +
    `(et vérifiez que chaque fait est visible dans la page).`);

  const book = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: w.title,
    ...(e.alternateName ? { alternateName: e.alternateName } : {}),
    author: { '@type': 'Person', name: w.author,
              sameAs: 'https://www.wikidata.org/wiki/Q9061' },
    ...(e.translator ? { translator: { '@type': 'Person', name: e.translator } } : {}),
    ...(e.bookEdition ? { bookEdition: e.bookEdition } : {}),
    inLanguage: 'fr',
    ...(e.dateCreated ? { dateCreated: e.dateCreated } : {}),
    datePublished: e.datePublished,
    ...(e.translationOfWork ? { translationOfWork: e.translationOfWork } : {}),
    url: ORIGIN + clean(w.path),
    description: w.description,
    about: w.concepts,
    isAccessibleForFree: true,
    ...(e.license ? { license: e.license } : {}),
    ...(e.source ? { isBasedOn: { '@type': 'WebPage', name: e.source.name, url: e.source.url } } : {})
  };
  return book;
}

/* ============================ LE PIED DE PAGE ============================ *
 * La sidebar du shell est INJECTÉE par shell.js. Googlebot rend la page et
 * suit ses ancres ; les crawlers des moteurs de réponse (GPTBot, ClaudeBot,
 * PerplexityBot) lisent le HTML brut et ne voyaient rien. Mesuré avant :
 * le HTML servi portait 2 liens internes sur Capital, 1 sur les Manuscrits,
 * 0 sur Place publique.
 *
 * Le pied de page est donc du BALISAGE STATIQUE, présent dans le fichier —
 * c'est tout son objet. Et comme il vit dans vingt-deux pages, il est DÉRIVÉ :
 * deux copies d'une même donnée divergent en silence, la règle est déjà celle
 * du FAQPage, du registre et des Book.
 *
 * Le corpus se lit dans bibliotheque.json : une troisième œuvre passée en
 * `available` apparaît dans le pied de page des vingt-deux pages sans qu'on
 * touche à rien.
 * ======================================================================== */

/* Remplace ce qui vit entre deux marqueurs. Le contenu est réécrit à chaque
   passage, donc idempotent : on teste le POINT D'INSERTION, jamais le
   changement — un garde qui lève parce que « rien n'a bougé » crie au défaut
   quand tout va bien (piège de `seo-registre-servi`). */
/* Le marqueur de FIN se cherche APRÈS celui de début, jamais depuis le haut
   du document. Avec une seule paire par fichier — le pied de page — les deux
   reviennent au même ; avec treize paires — les conteneurs de fiches du
   laboratoire — un `indexOf` non ancré rend la fin d'une AUTRE paire, et si
   elle précède le début, `slice(0,i) + contenu + slice(j)` RECOPIE tout ce
   qui les sépare. Mesuré une fois : capital-1.html passé de 313 Ko à 34 Mo
   en treize tours. */
function entreMarqueurs(src, deb, fin, contenu, fichier) {
  const i = src.indexOf(deb);
  if (i < 0) throw new Error(`Marqueur « ${deb} » introuvable dans ${fichier}.`);
  const j = src.indexOf(fin, i + deb.length);
  if (j < 0) throw new Error(`Marqueur « ${fin} » introuvable après « ${deb} » dans ${fichier}.`);
  return src.slice(0, i + deb.length) + contenu + src.slice(j);
}

const PIED_DEB = '<!-- PIED:DÉBUT — DÉRIVÉ par tools/gen-seo.mjs, ne pas éditer à la main -->';
const PIED_FIN = '<!-- PIED:FIN -->';

/* Les pages qui portent le pied de page. Le carnet et la messagerie en font
   partie : elles sont en `noindex`, mais un lecteur connecté doit pouvoir en
   sortir comme d'ailleurs — le pied de page est d'abord une navigation.
   `404.html` en est EXCLUE, et c'est déjà écrit dans sa mission : elle est
   autonome, elle ne charge ni shell.js ni shell.css, et une page d'erreur ne
   doit pas dépendre de ce qu'on n'a pas réussi à servir. */
const PIED_PAGES = [
  'index.html',
  'a-propos.html',
  'mentions-legales.html',
  'oeuvres/bibliotheque.html',
  'oeuvres/capital-1.html',
  'oeuvres/manuscrits-1844.html',
  'oeuvres/place-publique.html',
  'oeuvres/carnet.html',
  'oeuvres/messages.html',
  'glossaire/index.html',
  'jeu/index.html'
];

function lien(href, texte) { return `        <li><a href="${href}">${esc(texte)}</a></li>`; }

function piedDePage() {
  /* Le corpus, dans l'ordre du fichier — le même que la bibliothèque. */
  const corpus = available.map(w => lien(hrefOf(w), w.title)).join('\n');

  return `
<footer class="lm-foot wrap">
  <div class="lm-foot-in">
    <div class="lm-foot-id">
      <p class="lm-foot-mark">Lire<span class="d">.</span>Marx</p>
      <p class="lm-foot-lede">Marx en texte intégral, l&rsquo;appareil critique en marge du chapitre.</p>
    </div>
    <nav class="lm-foot-nav" aria-label="Pied de page">
      <div class="lm-foot-col">
        <p class="lm-foot-h">Le corpus</p>
        <ul>
${corpus}
${lien('/oeuvres/bibliotheque', 'Toute la bibliothèque')}
        </ul>
      </div>
      <div class="lm-foot-col">
        <p class="lm-foot-h">Comprendre</p>
        <ul>
${lien('/glossaire/', 'L’abécédaire de Marx')}
${lien('/jeu/', 'Le circuit du capital')}
${lien('/agregation-2027', 'Marx à l’agrégation 2027')}
        </ul>
      </div>
      <div class="lm-foot-col">
        <p class="lm-foot-h">Le site</p>
        <ul>
${lien('/', 'Accueil')}
${lien('/oeuvres/place-publique', 'Place publique')}
${lien('/a-propos', 'À propos')}
${lien('/mentions-legales', 'CGU & confidentialité')}
        </ul>
      </div>
    </nav>
  </div>
</footer>
`;
}

const HEAD = '<!-- Book : DÉRIVÉ de oeuvres/bibliotheque.json par tools/gen-seo.mjs.\n' +
             '     Ne pas éditer à la main — corriger la source, puis regénérer :\n' +
             '       node tools/gen-seo.mjs\n' +
             '     Chaque champ doit rester vérifiable dans la page elle-même. -->';
const OPEN = '<script type="application/ld+json">';
const CLOSE = '</script>';

let changed = [], stale = [];
const check = process.argv.includes('--check');

function writeIfNeeded(file, next, label) {
  /* Le fichier peut ne pas EXISTER : les pages de notion sont créées par ce
     script, pas seulement mises à jour. Une lecture sèche jetait alors ENOENT
     au lieu de créer la page. */
  let cur = null;
  try { cur = readFileSync(file, 'utf8'); } catch { cur = null; }
  if (cur === next) return;
  if (check) { stale.push(label); return; }
  writeFileSync(file, next);
  changed.push(label);
}

for (const w of available) {
  const file = w.path;
  const src = readFileSync(file, 'utf8');
  const json = JSON.stringify(bookFor(w), null, 2);
  const block = `${HEAD}\n${OPEN}\n${json}\n${CLOSE}`;

  // Remplace le bloc ld+json existant (avec son éventuel commentaire de tête).
  // Le commentaire de tête ne doit PAS pouvoir traverser d'autres commentaires :
  // avec un simple `[^]*?`, un commentaire quelconque situé PLUS HAUT dans le
  // <head> devient un point de départ valide, la paresse rallonge la capture
  // jusqu'au commentaire qui précède vraiment le script, et tout ce qui est
  // entre les deux est effacé. Vécu : l'ajout des balises de favicon a fait
  // disparaître 779 lignes de capital-1.html. D'où `(?:(?!-->)[^])*?`.
  const re = new RegExp(
    '(?:<!--(?:(?!-->)[^])*?-->\\s*)?<script type="application/ld\\+json">[^]*?</script>');
  if (!re.test(src)) throw new Error(`Aucun bloc JSON-LD trouvé dans ${file}`);
  writeIfNeeded(file, src.replace(re, () => block), file);
}

/* ------------------- Le registre de la bibliothèque -------------------- *
 * oeuvres/bibliotheque.html sert 49 mots et pas un titre d'œuvre : son
 * registre à plat (#bxFlat) — celui que CLAUDE.md décrit comme « la version
 * des lecteurs d'écran et des robots » — est en réalité peuplé par JS.
 * Google exécute le JS et finit par le voir ; les crawlers des moteurs de
 * réponse, non. On pré-rend donc le MÊME balisage que renderFlat(), que le
 * JS réécrira à l'identique. Toute modification de renderFlat() doit être
 * répercutée ici, et inversement — c'est le prix d'un rendu à deux endroits,
 * et la raison du test d'identité dans la mission.
 * ---------------------------------------------------------------------- */
const esc = v => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* href() de la page, après retrait de l'extension : Cloudflare sert des URL
 * propres, un lien interne en .html part en 308 pour rien. */
const hrefOf = w => {
  const p = String(w.path || '').replace(/\.html$/, '');
  return p && p[0] !== '/' ? '/' + p : p;
};

/* L'APPEL vit ICI et non à côté de la fonction : `esc` et `hrefOf` sont des
   `const` déclarés plus bas dans le module, donc en zone morte temporelle
   tant qu'on n'y est pas passé. Appelée plus haut, piedDePage() jetait un
   ReferenceError — le piège déjà payé par drawTRPF() sur capital-1. */
const PIED = piedDePage();


function flatRegister(biblio) {
  const works = (biblio.works || []).filter(w => w && w.id);
  const groups = biblio.readingGroups || [];
  const byId = Object.fromEntries(works.map(w => [w.id, w]));
  const titleOf = id => (byId[id] ? byId[id].title : id);
  const rd = w => w.reading || {};
  const isOk = w => w.status === 'available';

  const relLine = w => {
    const r = rd(w), parts = [];
    const dot = ids => ids.map(titleOf).join(' · ');
    if (r.after && r.after.length)   parts.push('<b>À lire après</b> ' + esc(dot(r.after)));
    if (r.primer && r.primer.length) parts.push('<b>Préparé par</b> ' + esc(dot(r.primer)));
    return parts.length ? '<p class="fl-rel">' + parts.join('<br>') + '</p>' : '';
  };

  const count = '<b>' + works.length + '</b> œuvres · <b>' +
                works.filter(isOk).length + '</b> lisibles aujourd\'hui';

  const html = groups.map(gr => {
    const list = works.filter(w => rd(w).group === gr.id)
                      .sort((a, b) => a.year - b.year);
    if (!list.length) return '';
    return '<section class="fl-group">' +
      '<h2 class="fl-gh">' + esc(gr.label) + '</h2>' +
      '<p class="fl-gn">' + esc(gr.note) + '</p>' +
      '<div class="fl-list">' + list.map(w => {
        const ok = isOk(w);
        return '<article class="fl-work">' +
          '<span class="fl-y">' + esc(w.year) + '</span>' +
          '<div class="fl-col">' +
            '<div class="fl-head">' +
              '<h3 class="fl-t">' + esc(w.title) + '</h3>' +
              '<span class="fl-status ' + (ok ? 'ok">Disponible' : 'soon">En préparation') + '</span>' +
            '</div>' +
            (rd(w).entry && ok
              ? '<p class="fl-entry">Porte d\'entrée — ' + esc(rd(w).entry) + '</p>' : '') +
            '<p class="fl-d">' + esc(w.description) + '</p>' +
            '<div class="fl-cx">' + (w.concepts || []).map(c => '<span>' + esc(c) + '</span>').join('') + '</div>' +
            relLine(w) +
            '<details class="fl-more"><summary>Comment le lire</summary>' +
              '<div class="fl-more-in">' +
                '<p class="fl-guide">' + esc(w.readingGuide) + '</p>' +
                '<p class="fl-source"><b>D\'où vient le texte —</b> ' + esc(w.sourceNote) + '</p>' +
              '</div>' +
            '</details>' +
            (ok ? '<a class="fl-open" href="' + esc(hrefOf(w)) + '">Ouvrir l\'atelier →</a>' : '') +
          '</div>' +
        '</article>';
      }).join('') + '</div>' +
    '</section>';
  }).join('');

  return { count, html };
}

{
  const file = 'oeuvres/bibliotheque.html';
  const src = readFileSync(file, 'utf8');
  const { count, html } = flatRegister(biblio);

  const note = '<!-- DÉRIVÉ de oeuvres/bibliotheque.json par tools/gen-seo.mjs — même\n' +
               '     balisage que renderFlat() plus bas, que le JS réécrit à l\'identique.\n' +
               '     Ne pas éditer à la main : node tools/gen-seo.mjs -->';

  const reCount  = /<div class="fl-count" id="flCount">[^]*?<\/div>/;
  const reGroups = /<div id="flGroups"[^>]*>[^]*?<\/div>\s*<\/main>/;
  // On teste le POINT D'INSERTION, pas le changement : quand le dépôt est
  // déjà à jour, le remplacement est un no-op légitime.
  for (const [re, what] of [[reCount, '#flCount'], [reGroups, '#flGroups']]) {
    if (!re.test(src)) throw new Error(`registre : ${what} introuvable dans ${file}`);
  }

  const next = src
    .replace(reCount,  () => `<div class="fl-count" id="flCount">${count}</div>`)
    .replace(reGroups, () => `<div id="flGroups" data-prerendu>\n${note}\n${html}\n</div>\n</main>`);
  writeIfNeeded(file, next, file + ' (registre)');
}

/* ---------------------------- FAQPage ---------------------------- */
/* Le BALISAGE de #questions est la source, ce bloc en est DÉRIVÉ — la règle
 * était déjà écrite dans CLAUDE.md, mais elle était tenue par un script
 * jetable, et les deux avaient divergé une fois : une retouche faite au
 * `replace` sur le fichier entier avait frappé la COPIE JSON-LD, qui est plus
 * haut dans le document. Elle vit ici désormais, et `--check` la surveille.
 *
 * Une donnée structurée qui promet une réponse absente de la page est un
 * mensonge, et Google la sanctionne. Rappel : il ne montre PLUS de résultat
 * enrichi FAQ depuis août 2023 hors sites gouvernementaux et de santé — ce
 * balisage sert la lecture machine, pas un snippet. Ne rien promettre d'autre.
 */
const ENTITES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };

/* L'espace se pose aux frontières de BLOC, et seulement là. Sans elle, deux
 * paragraphes se recollent (« …dans sa préface.Sur ce site… ») ; posée à
 * TOUTE frontière de balise, elle sépare l'italique de sa ponctuation
 * (« Le Capital , Livre I »). C'est la nuance que la leçon déjà écrite pour
 * headText() ne disait pas : les éléments EN LIGNE ne prennent pas d'espace. */
const BLOCS = /<\/(?:p|div|li|ul|ol|h[1-6]|section)\s*>|<br\s*\/?>/gi;

function texteNu(html) {
  return html
    .replace(BLOCS, ' ')                                      // fin de bloc = une espace
    .replace(/<[^>]+>/g, '')                                  // le reste du balisage tombe
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, e) => ENTITES[e])
    .replace(/\s+/g, ' ')                                     // espaces recomposés
    .trim();
}

function questionsDe(src) {
  const i = src.indexOf('id="questions"');
  if (i < 0) throw new Error('Section #questions introuvable dans index.html.');
  const fin = src.indexOf('</section>', i);
  const zone = src.slice(i, fin);
  const out = [];
  // Un dépliant = <summary> … <span class="hs-faq-q">Q</span> … <div class="hs-faq-a">R</div>
  const re = /<span class="hs-faq-q">([\s\S]*?)<\/span>[\s\S]*?<div class="hs-faq-a">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(zone))) {
    const q = texteNu(m[1]), a = texteNu(m[2]);
    if (!q || !a) throw new Error(`Dépliant vide dans #questions : « ${q || a} »`);
    out.push({ '@type': 'Question', name: q,
               acceptedAnswer: { '@type': 'Answer', text: a } });
  }
  if (out.length < 2) throw new Error(`Seulement ${out.length} question(s) relevée(s) — le gabarit du balisage a changé.`);
  return out;
}

{
  const file = 'index.html';
  const src = readFileSync(file, 'utf8');
  const json = JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questionsDe(src) },
    null, 2);

  /* On repère le bloc par son CONTENU (« FAQPage ») puis on remonte à sa
   * balise ouvrante par index — pas de motif qui puisse courir au-delà, le
   * piège qui avait mangé 779 lignes de capital-1.html. */
  const k = src.indexOf('"@type": "FAQPage"');
  if (k < 0) throw new Error('Bloc FAQPage introuvable dans index.html.');
  const deb = src.lastIndexOf(OPEN, k);
  const f   = src.indexOf(CLOSE, k);
  if (deb < 0 || f < 0) throw new Error('Bloc FAQPage mal délimité.');
  writeIfNeeded(file, src.slice(0, deb + OPEN.length) + '\n' + json + '\n' + src.slice(f),
                file + ' (FAQPage)');
}

/* --------------------------- glossaire --------------------------- */
/* /glossaire — L'ABÉCÉDAIRE DE MARX, page indépendante et non un glossaire
 * par œuvre (arbitrage du propriétaire, sept. 2026 : « plutôt qu'un glossaire
 * par œuvre, un glossaire global de Marx, genre un abécédaire des concepts,
 * dispo comme page indépendante »).
 *
 * Deux conséquences de cet arbitrage :
 *   · l'ordre est ALPHABÉTIQUE, pas par mécanisme. On cherche un mot comme on
 *     cherche un mot. Ce que l'ordre logique disait — d'où vient la notion —
 *     n'est pas perdu : il descend sur chaque fiche, en renvoi.
 *   · la page vit à la RACINE (/glossaire), pas sous /oeuvres/ qui la ferait
 *     lire comme dépendante d'une œuvre. Et c'est un FICHIER, donc pas de
 *     redirection de dossier (voir le piège de /jeu).
 *
 * TOUT est dérivé des deux ateliers : CONCEPTS de capital-1.html (75 fiches,
 * en objet groupé par station) et CONCEPTS de manuscrits-1844.html (7 fiches,
 * en tableau, avec le terme ALLEMAND). Rien n'est recopié ici.
 *
 * UNE SEULE PAGE, et c'est mesuré : les fiches de Capital font 846 mots à
 * elles toutes, médiane ONZE mots. Une page par terme serait du contenu
 * mince, ce que Google sanctionne. Le jour où une notion mérite sa page,
 * c'est qu'on aura écrit trois cents mots dessus.
 *
 * On ne fabrique AUCUN lien de chapitre : le contrat de deep-link connaît
 * #labo, #explore, #chrono et #s=&q=, rien par chapitre. Les chapitres sont
 * NOMMÉS, pas liés — inventer une URL serait pire que ne rien lier.
 */
function litteralJS(src, nom, ouvrant) {
  const i = src.indexOf(nom);
  if (i < 0) throw new Error(`${nom} introuvable — le glossaire ne peut pas être dérivé.`);
  const fermant = ouvrant === '[' ? ']' : '}';
  let j = src.indexOf(ouvrant, i), prof = 0, fin = j;
  for (let k = j; k < src.length; k++) {
    if (src[k] === ouvrant) prof++;
    else if (src[k] === fermant) { prof--; if (!prof) { fin = k + 1; break; } }
  }
  return eval('(' + src.slice(j, fin) + ')');   // littéral de données, pas du code tiers
}

/* Les libellés arrivent balisés (&amp;, &#8209;, &prime;). On les garde tels
 * quels dans la page — ils y retournent en HTML — et on ne les décode que
 * pour le JSON-LD et les clés de tri, qui veulent du texte nu. */
function decode(t) {
  return String(t)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&(nbsp|amp|lt|gt|quot|prime|#39);/g,
      (_, e) => ({ nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', prime: '′', '#39': "'" }[e]));
}

/* La clé de tri IGNORE l'article de tête — un index range « Le hiéroglyphe
 * social » à H, pas à L — puis la PONCTUATION et les symboles de tête, sans
 * quoi « Le « prix du travail » » et « ΔA — plus-value » tombaient dans un
 * panier « # » au lieu de P et de A. Accents et casse ignorés de même. */
const ARTICLE = /^(?:l['’]|le |la |les |un |une |du |des |de la |de l['’])/i;
function cle(nom) {
  return decode(nom).toLowerCase().replace(ARTICLE, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .trim();
}
function slug(nom) {
  return cle(nom).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* L'IDENTITÉ d'une notion, pour le dédoublonnage : la clé de tri, moins un
 * suffixe entre parenthèses en FIN de titre. Les ateliers déclinent le même
 * concept d'une station à l'autre — « Composition organique », « Composition
 * organique (c/v) », « Composition organique (→) » — et les parenthèses y
 * disent la station, pas le concept. Dans un abécédaire ce sont trois fois
 * du bruit. Même chose pour l'article : « Journée de travail » et « La
 * journée de travail » sont un seul mot.
 * Le suffixe doit être ÉQUILIBRÉ et terminal, sinon « Condition
 * I(v+pl)=II(c) » perdrait son dernier terme. */
function sansSuffixe(nom) {
  const t = String(nom).trim();
  /* On coupe au DERNIER « espace + parenthèse », et seulement si le titre se
   * termine par une parenthèse. L'ESPACE est le discriminant : il sépare un
   * suffixe de station — « Taux de profit (pl/(c+v)) » — d'une parenthèse qui
   * fait corps avec le titre, comme dans « Condition I(v+pl)=II(c) », qui
   * perdrait son dernier terme. Une regex sur les parenthèses équilibrées
   * échouait d'ailleurs sur le suffixe imbriqué ci-dessus. */
  if (!t.endsWith(')')) return t;
  const i = t.lastIndexOf(' (');
  return i > 0 ? t.slice(0, i).trim() : t;
}
function identite(nom) {
  return cle(sansSuffixe(nom)) || cle(nom);
}

{
  /* — Le Capital : fiches groupées par station, chaque groupe pointant son
       instrument. Les libellés viennent des ONGLETS de la page. — */
  const capSrc = readFileSync('oeuvres/capital-1.html', 'utf8');
  const CAP  = litteralJS(capSrc, 'CONCEPTS=', '{');
  const META = litteralJS(capSrc, 'META=', '{');
  const labo = Object.fromEntries([...capSrc.matchAll(/data-sub="(s-[a-z]+)">([^<]*)/g)].map((m) => [m[1], m[2]]));
  const expl = Object.fromEntries([...capSrc.matchAll(/data-x="(x-[a-z]+)">([^<]*)/g)].map((m) => [m[1], m[2]]));

  /* Le LEXIQUE : définitions longues et termes allemands. Il ne porte QUE ce
   * que CONCEPTS n'a pas — les fiches des ateliers sont des légendes de
   * carte (onze mots de médiane), le glossaire doit définir. Deux métiers,
   * deux champs ; on n'allonge pas CONCEPTS, ce qui déformerait les cartes. */
  const LEX = JSON.parse(readFileSync('oeuvres/lexique.json', 'utf8')).termes;

  const brut = [];
  for (const cc of Object.keys(CAP)) {
    const suff = cc.slice(3);
    let groupe, ancre, cible = null;
    if (labo['s-' + suff])      { groupe = labo['s-' + suff]; ancre = '#labo';    cible = 's-' + suff; }
    else if (expl['x-' + suff]) { groupe = expl['x-' + suff]; ancre = '#explore'; }
    else                        { groupe = 'la chronologie'; ancre = '#chrono'; }
    const chaps = Object.keys(META).filter((r) => META[r].labo && META[r].labo === cible);
    for (const c of CAP[cc]) {
      brut.push({ nom: c.t, legende: c.d || '', formule: c.f || '', de: '',
                  oeuvre: 'Le Capital', groupe, chaps, url: '/oeuvres/capital-1' + ancre });
    }
  }

  /* — Les Manuscrits : tableau plat, déjà pourvu du terme allemand et d'une
       définition longue. Leurs concepts alimentent la carte du laboratoire. — */
  const manSrc = readFileSync('oeuvres/manuscrits-1844.html', 'utf8');
  for (const c of litteralJS(manSrc, 'CONCEPTS=', '[')) {
    brut.push({ nom: c.t, legende: c.def || '', formule: '', de: c.de || '',
                oeuvre: 'Manuscrits de 1844', groupe: 'la carte des concepts', chaps: [],
                url: '/oeuvres/manuscrits-1844#labo' });
  }

  /* Une clé du lexique qui ne correspond à AUCUNE fiche est une erreur, pas
   * une donnée en trop : c'est le symptôme d'un renommage dans CONCEPTS, qui
   * sans ce contrôle perdrait la définition en silence. */
  const identitesExistantes = new Set(brut.map((t) => identite(t.nom)));
  const orphelines = Object.keys(LEX).filter((k) => !identitesExistantes.has(identite(k)));
  if (orphelines.length) throw new Error(
    `Clés du lexique sans fiche correspondante : ${orphelines.map((o) => `« ${o} »`).join(', ')}.\n` +
    `  Un titre a-t-il changé dans CONCEPTS ? Corrigez oeuvres/lexique.json.`);

  /* DÉDOUBLONNAGE. Un abécédaire n'a qu'une entrée par mot : « Force de
   * travail » figure dans deux stations de Capital, avec deux légendes
   * complémentaires. On fusionne, et on garde LES DEUX provenances. */
  const parNom = new Map();
  for (const t of brut) {
    const id = identite(t.nom);
    if (!parNom.has(id)) parNom.set(id, { ...t, sources: [] });
    const e = parNom.get(id);
    /* On garde le nom le plus COURT : c'est celui sans le suffixe de station,
     * donc celui qui se lit comme une entrée de dictionnaire. */
    if (t.nom.length < e.nom.length) { e.legende = t.legende; }
    e.sources.push({ oeuvre: t.oeuvre, groupe: t.groupe, chaps: t.chaps, url: t.url });
    if (!e.de && t.de) e.de = t.de;
    if (!e.formule && t.formule) e.formule = t.formule;
  }

  const termes = [...parNom.values()].map((t) => {
    t.nom = sansSuffixe(t.nom);
    const lex = LEX[t.nom] || Object.entries(LEX).find(([k]) => identite(k) === identite(t.nom))?.[1];
    return { ...t,
      de:  lex && lex.de ? lex.de : t.de,
      def: lex && lex.def ? lex.def : t.legende,
      page: lex && lex.page ? lex.page : null,
      voir: lex && lex.voir ? lex.voir : null,
      carte: !!(lex && lex.carte),
      /* `affiche` est le nom MONTRÉ ; `nom` reste celui de la fiche, parce
         que c'est lui qui porte l'identité — la carte retrouve sa page par
         là. Même motif que `page.slug` pour l'adresse : le lexique corrige
         ce que la fiche dicte, sans toucher à la carte de l'atelier. */
      affiche: (lex && lex.nom) ? lex.nom : null,
      enrichi: !!(lex && lex.def) };
  });

  /* On range sur le nom MONTRÉ : c'est celui que le lecteur cherche. */
  termes.sort((a, b) => cle(a.affiche || a.nom).localeCompare(cle(b.affiche || b.nom), 'fr'));

  /* L'adresse d'une notion est le slug de son nom — sauf quand la page
   * porte un titre que le lexique ne peut pas porter : « La forme-valeur »
   * n'est aucune des six entrées de la série, et c'est pourtant le mot que
   * l'on cherche. `page.slug` la nomme alors, et l'entrée qui tient la page
   * prend cette adresse. */
  const vus = new Set();
  for (const t of termes) if (t.page && t.page.slug) {
    if (vus.has(t.page.slug)) throw new Error(`Deux notions demandent l'adresse « ${t.page.slug} ».`);
    vus.add(t.page.slug); t.id = t.page.slug;
  }
  for (const t of termes) {
    if (t.id) continue;
    let id = slug(t.nom), n = 2;
    while (vus.has(id)) id = slug(t.nom) + '-' + n++;
    vus.add(id); t.id = id;
  }

  /* ── LE RENVOI ────────────────────────────────────────────────────────
   * Trois notions du glossaire sont des PAIRES ou des SÉRIES : capital
   * constant et variable, travail mort et travail vivant, les six formes
   * de la valeur. Marx les pose ensemble et elles ne se comprennent pas
   * séparément — une page par membre dirait deux fois la même chose, et
   * deux entrées pointant le même dossier serviraient le même texte à deux
   * adresses, ce qu'un moteur compte comme du doublon.
   *
   * Le remède est celui du dictionnaire : une entrée porte la page, les
   * autres RENVOIENT vers elle (`voir` dans le lexique). Elles gardent leur
   * définition et leur place dans l'abécédaire — on cherche « forme
   * argent », il faut la trouver à F — mais leur lien mène à la page
   * commune. Une seule URL, aucun doublon, et rien à changer dans les
   * fiches de l'atelier. */
  for (const t of termes) {
    if (!t.voir) continue;
    const cible = termes.find((x) => identite(x.nom) === identite(t.voir));
    if (!cible) throw new Error(`« ${t.nom} » renvoie à « ${t.voir} », qui n'est pas une notion.`);
    if (!cible.page) throw new Error(`« ${t.nom} » renvoie à « ${cible.nom} », qui n'a pas de page.`);
    t.renvoi = cible;
  }
  for (const t of termes) {
    t.mene = !!(t.page || t.renvoi);
    t.href = t.page ? `/glossaire/${t.id}`
      : t.renvoi ? `/glossaire/${t.renvoi.id}` : `/glossaire/#${t.id}`;
  }

  /* La table du maillage. Elle est indexée par le titre de la fiche TEL QUE
   * l'atelier l'écrit — suffixe de station compris — parce que c'est ce que
   * la page a sous la main au moment de rendre la carte. Une notion qui ne
   * mène nulle part n'y figure pas : la fiche reste alors du texte.
   * Chaque entrée porte `h` (l'adresse) et `n` (le nom CANONIQUE de la
   * notion). Les deux diffèrent : la carte garde son propre terme — « Capital
   * constant (c) », notation de station comprise —, mais une LISTE de notions
   * doit nommer la page, qui couvre ici les deux capitaux. */
  const parIdentite = new Map(termes.map((t) => [identite(t.nom), t]));
  for (const b of brut) {
    const t = parIdentite.get(identite(b.nom));
    if (t && t.mene) LIENS_FICHES[b.oeuvre][b.nom] = { h: t.href, n: decode(t.affiche || t.nom) };
  }

  INDEX_NOTIONS = termes.map((t) => ({
    nom: decode(t.affiche || t.nom), de: t.de || '', def: t.def || '', id: t.id, page: t.mene,
    href: t.href, oeuvre: (t.sources[0] && t.sources[0].oeuvre) || '' }));

  /* ── L'ABÉCÉDAIRE N'EST PAS LA LISTE DES FICHES ──────────────────────
   * Quatre fiches de l'atelier sont des TITRES que le site a écrits, pas des
   * notions de Marx : « Lever le voile », « Le hiéroglyphe social », « Les
   * contre-mondes », « Le passage de relais ». Elles font de bonnes cartes —
   * « Lever le voile » vaut mieux que « Producteurs librement associés » au
   * pied d'une station — et elles gardent donc leur fiche, son lien et sa
   * place dans la recherche. Mais un abécédaire DE MARX ne les range pas à L,
   * H, C et P comme s'il les lui devait.
   * Marquées `carte: true` dans le lexique ; elles restent dans `termes`
   * (donc dans LIENS_FICHES et INDEX_NOTIONS) et sortent d'`abece`, qui est
   * ce que la page liste, compte et déclare en JSON-LD. */
  const abece = termes.filter((t) => !t.carte);
  for (const t of termes) {
    if (t.carte && !t.mene) throw new Error(
      `« ${t.nom} » est marquée carte:true mais ne mène nulle part : hors de `
      + "l'abécédaire, elle n'aurait plus d'existence. Ajoutez-lui un voir.");
  }

  const lettres = new Map();
  for (const t of abece) {
    const L = (cle(t.affiche || t.nom)[0] || '#').toUpperCase();
    const k = /[A-Z]/.test(L) ? L : '#';
    if (!lettres.has(k)) lettres.set(k, []);
    lettres.get(k).push(t);
  }

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const nav = ALPHA.map((L) => lettres.has(L)
    ? `<a href="#lettre-${L}">${L}</a>`
    : `<span aria-hidden="true">${L}</span>`).join('');
  const alphabet = `<nav class="gl-alpha" aria-label="Aller à une lettre">${nav}</nav>`;

  /* La provenance se groupe par ŒUVRE : un terme qui figure dans deux
   * stations du même livre ne doit pas le nommer deux fois. */
  const provenance = (sources) => {
    const parOeuvre = new Map();
    for (const s of sources) {
      if (!parOeuvre.has(s.oeuvre)) parOeuvre.set(s.oeuvre, { lieux: [], chaps: new Set() });
      const e = parOeuvre.get(s.oeuvre);
      e.lieux.push(`<a href="${s.url}">${s.groupe}</a>`);
      s.chaps.forEach((c) => e.chaps.add(c));
    }
    return [...parOeuvre.entries()].map(([oeuvre, e]) => {
      const ch = [...e.chaps];
      const chaps = ch.length ? ` — ${ch.length > 1 ? 'chapitres' : 'chapitre'} ${ch.join(', ')}` : '';
      return `<i>${oeuvre}</i>${chaps} · ${e.lieux.join(', ')}`;
    }).join(' · ');
  };

  let html = '';
  for (const [L, liste] of [...lettres.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'))) {
    html += `  <section class="gl-bloc" aria-labelledby="lettre-${L}">\n`
          + `    <h2 class="gl-lettre" id="lettre-${L}">${L}</h2>\n`
          + `    <dl class="gl-liste">\n`;
    for (const t of liste) {
      const lien = (x) => t.mene ? `<a href="${t.href}">${x}</a>` : x;
      html += `      <div class="gl-terme" id="${t.id}">\n`
            + `        <dt class="gl-t">${lien(t.affiche || t.nom)}`
            + (t.de ? `<span class="gl-de" lang="de">${t.de}</span>` : '')
            + `</dt>\n`
            + `        <dd class="gl-d">${t.def}\n`
            + (t.formule ? `          <span class="gl-f">${t.formule}</span>\n` : '')
            + `          <span class="gl-src">${provenance(t.sources)}</span>\n`
            + `        </dd>\n      </div>\n`;
    }
    html += `    </dl>\n  </section>\n`;
  }

  const ldJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${ORIGIN}/glossaire/#glossaire`,
    name: 'Glossaire de Marx — l’abécédaire des concepts',
    url: `${ORIGIN}/glossaire/`,
    inLanguage: 'fr',
    hasDefinedTerm: abece.map((t) => ({
      '@type': 'DefinedTerm',
      name: decode(t.affiche || t.nom),
      description: decode(t.def),
      url: `${ORIGIN}${t.href}`,
      ...(t.de ? { alternateName: decode(t.de) } : {}),
      inLanguage: 'fr',
    })),
  }, null, 2);

  const oeuvres = new Set(abece.flatMap((t) => t.sources.map((s) => s.oeuvre))).size;
  const compte = `<p class="gl-compte">${abece.length} notions · ${lettres.size} lettres · ${oeuvres} œuvres</p>`;

  const fichier = 'glossaire/index.html';
  let page = readFileSync(fichier, 'utf8');
  const entre = (src, deb, fin, contenu) => {
    const i = src.indexOf(deb), j = src.indexOf(fin);
    if (i < 0 || j < 0) throw new Error(`Marqueurs ${deb} / ${fin} introuvables dans ${fichier}.`);
    return src.slice(0, i + deb.length) + contenu + src.slice(j);
  };
  page = entre(page, '<!-- GLOSSAIRE:COMPTE:DÉBUT -->', '<!-- GLOSSAIRE:COMPTE:FIN -->', compte);
  page = entre(page, '<!-- ALPHABET:DÉBUT -->', '<!-- ALPHABET:FIN -->', alphabet);
  page = entre(page, '<!-- GLOSSAIRE:LD:DÉBUT — DÉRIVÉ, ne pas éditer à la main -->',
                     '<!-- GLOSSAIRE:LD:FIN -->', `\n${OPEN}\n${ldJson}\n${CLOSE}\n`);
  const borne = 'seconde source qui divergerait. -->';
  const d = page.indexOf(borne);
  const f = page.indexOf('  <!-- GLOSSAIRE:FIN -->');
  if (d < 0 || f < 0) throw new Error('Marqueurs du corps du glossaire introuvables.');
  page = page.slice(0, d + borne.length) + '\n' + html + page.slice(f);

  /* ── Les pages de notion ────────────────────────────────────────────
   * Une notion n'a sa page que si le lexique lui a écrit un `page` : quatre
   * cents mots, pas vingt-sept. C'est le seuil au-dessous duquel une page
   * par terme serait du contenu mince — la raison même pour laquelle
   * l'abécédaire est resté une seule page. On ne génère donc PAS
   * soixante-quinze pages : on en génère autant qu'on en a écrit.
   * Le CSS est une feuille partagée (glossaire/notion.css) et non un bloc
   * inline recopié dans chaque fichier, qui les ferait diverger.
   */
  const echap = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nu = (t) => decode(String(t).replace(/<[^>]+>/g, ''));


  /* ── Les PAGES-MONDE (mission `glossaire-mondes`, sept. 2026) ─────────
   * Une notion dont le lexique dit `page: { dossier: '<slug>' }` est un
   * ESSAI LONG avec son MONDE : glossaire/mondes/<slug>/ porte essai.html
   * (le corps, une <section data-etape> par temps de l'exposé), meta.json
   * (la tête, l'appareil, les légendes du monde) et monde.js (la scène,
   * Three.js). Le générateur ASSEMBLE, il n'écrit rien : la matière est
   * dans le dossier, la forme ici, le style dans notion.css.
   *
   * Les citations mènent au passage : un <blockquote data-s data-q> ou un
   * <q data-s data-q> est une phrase RELEVÉE dans le texte que la liseuse
   * sert, et devient un lien #s=&q= (le contrat de deep-link de la
   * liseuse) vers le passage exact. C'est ce qui lève, pour ces pages, la
   * règle « pas de citation de mémoire » : chaque citation est vérifiable
   * d'un clic. data-q doit être copié du texte servi, apostrophe
   * typographique comprise — le générateur ne peut pas le vérifier, la
   * liseuse le fera (« Passage introuvable » si la phrase diverge).
   *
   * Les actifs du monde (monde-driver.js, monde.js) portent un ?v= dérivé
   * de leur contenu : la page n'est jamais mise en cache, eux le sont
   * quatre heures — le piège documenté pour home.js et shell.css, réglé
   * ici une fois pour toutes. */
  const hashV = (f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8);
  const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  /* Le texte des essais, pour la recherche (mission `recherche-essais`) :
   * quarante-six mille mots écrits à la main que le champ ne voyait pas. */
  const ESSAIS = [];
  function pageMonde(t) {
    const dossier = `glossaire/mondes/${t.page.dossier}`;
    const meta = JSON.parse(readFileSync(`${dossier}/meta.json`, 'utf8'));
    let essai = readFileSync(`${dossier}/essai.html`, 'utf8').replace(/<!--[^]*?-->/g, '').trim();
    const url = `${ORIGIN}/glossaire/${t.id}`;
    const titre = nu(meta.titre || t.nom);
    const desc = nu(meta.description || meta.chapo);
    const src = meta.source || {};
    const lien = (sEl, q) => `/oeuvres/${src.work}#s=${sEl || src.s}&q=${encodeURIComponent(q)}`;

    /* Les sections : numéro romain, légende du monde, sommaire. */
    const sections = [];
    essai = essai.replace(/<section class="nt-sec" data-etape="([^"]+)" id="([^"]+)">\s*<h2>([^]*?)<\/h2>/g,
      (m, etape, id, h2) => {
        const n = sections.length;
        sections.push({ etape, id, h2 });
        const leg = (meta.monde && meta.monde.etapes && meta.monde.etapes[etape]) || '';
        return `<section class="nt-sec" data-etape="${etape}" id="${id}" data-legende="${echap(nu(leg))}">\n<h2><span class="nt-sec-n" aria-hidden="true">${ROMAINS[n]}</span>${h2}</h2>`;
      });
    if (sections.length < 3) throw new Error(`« ${titre} » : l'essai n'a que ${sections.length} section(s).`);
    if (meta.monde && meta.monde.etapes) {
      const manquantes = sections.filter((s) => !meta.monde.etapes[s.etape]).map((s) => s.etape);
      if (manquantes.length) throw new Error(`« ${titre} » : étapes sans légende dans meta.json : ${manquantes.join(', ')}`);
    }
    /* Les citations. */
    let nbCit = 0;
    essai = essai.replace(/<blockquote data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/blockquote>/g, (m, sEl, q, inner) => {
      nbCit++;
      return `<blockquote>${inner.trim()}<cite>${src.cite || ''}<a href="${lien(sEl, q)}">Lire dans le texte →</a></cite></blockquote>`;
    });
    essai = essai.replace(/<q data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/q>/g, (m, sEl, q, inner) => {
      nbCit++;
      return `<a class="nt-q" href="${lien(sEl, q)}" title="Lire ce passage dans le texte"><q>${inner}</q></a>`;
    });
    if (/data-q=/.test(essai)) throw new Error(`« ${titre} » : une citation n'a pas été reconnue (data-q resté dans l'essai).`);
    const mots = nu(essai).split(/\s+/).filter(Boolean).length;
    if (mots < 1200) throw new Error(`« ${titre} » : ${mots} mots — une page-monde en veut au moins 1 200.`);

    /* Les instruments viennent des provenances ; un outil du dossier qui
       vise le MÊME endroit en plus précis (#explore=x-feti contre #explore)
       remplace l'entrée automatique au lieu de la doubler. */
    const precis = (meta.outils || []).map((o) => o.url);
    const outils = [
      ...t.sources.filter((sc) => !precis.some((u) => u.startsWith(sc.url)))
        .map((sc) => ({ label: `${nu(sc.groupe)} — ${sc.oeuvre}`, url: sc.url })),
      ...(meta.outils || []),
    ];
    const voisines = (meta.voisins || [])
      .map((v) => termes.find((x) => identite(x.nom) === identite(v)))
      .filter(Boolean);
    if ((meta.voisins || []).length !== voisines.length) throw new Error(
      `Voisines introuvables pour « ${titre} » : ${(meta.voisins || [])
        .filter((v) => !termes.some((x) => identite(x.nom) === identite(v)))
        .map((v) => `« ${v} »`).join(', ')}`);

    /* Le monde : scène si elle existe, image fixe si elle existe. */
    const aScene = existsSync(`${dossier}/monde.js`);
    const still = ['webp', 'jpg', 'png'].map((e) => `${dossier}/monde.${e}`).find((f) => existsSync(f));
    const og = existsSync(`${dossier}/monde.jpg`) ? `${ORIGIN}/${dossier}/monde.jpg`
      : `${ORIGIN}/assets/img/archive/das-kapital-titre-1867.jpg`;
    const alt = echap(nu((meta.monde && meta.monde.alt) || ''));
    /* La légende de départ est celle de l'IMAGE FIXE (meta.monde.fixe) : tant
       que la scène ne joue pas, c'est elle qu'on voit ; le pilote la remplace
       par la légende de l'étape dès que la scène démarre. */
    const legende0 = echap(nu((meta.monde && meta.monde.fixe && meta.monde.fixe.legende)
      || (meta.monde && meta.monde.etapes && meta.monde.etapes[sections[0].etape]) || ''));
    /* Deux architectures : « marge » (la scène collante à droite du texte,
       celle du fétichisme) et « plein » (la scène en plein écran derrière
       la page, le texte dans une colonne sur un voile — la statue du
       travail aliéné). Le dossier choisit (meta.monde.layout). */
    const plein = meta.monde && meta.monde.layout === 'plein';
    const credit = meta.monde && meta.monde.credit ? `    <p class="nt-monde-credit">${meta.monde.credit}</p>\n` : '';
    const monde = `  <aside class="nt-monde${plein ? ' nt-monde--plein' : ''}" aria-label="Le monde de la notion"${aScene
      ? `${meta.monde && meta.monde.moteur === '2d' ? '' : ` data-three="/vendor/three.min.js?v=${hashV('vendor/three.min.js')}"`} data-scene="/${dossier}/monde.js?v=${hashV(`${dossier}/monde.js`)}"` : ''}>
    <canvas hidden role="img" aria-label="${alt}"></canvas>
${still ? `    <img class="nt-monde-still" src="/${still}" alt="${alt}" width="1200" height="750" decoding="async">` : `    <div class="nt-monde-still" role="img" aria-label="${alt}"></div>`}
${meta.monde && meta.monde.source ? `    <p class="nt-monde-src"><a href="${lien(src.s, meta.monde.source.q)}" title="Lire ce passage dans le texte">${meta.monde.source.texte} →</a></p>\n` : ''}    <p class="nt-monde-cap">${legende0}</p>
${credit}  </aside>`;

    const ld = [
      { '@context': 'https://schema.org', '@type': 'DefinedTerm',
        '@id': url, name: titre, description: desc, url, inLanguage: 'fr',
        ...(meta.de || t.de ? { alternateName: nu(meta.de || t.de) } : {}),
        inDefinedTermSet: { '@id': `${ORIGIN}/glossaire/#glossaire` } },
      { '@context': 'https://schema.org', '@type': 'Article',
        headline: `${titre} — Marx, définition et explication`,
        description: desc, url, inLanguage: 'fr', wordCount: mots,
        about: { '@id': url },
        isPartOf: { '@id': `${ORIGIN}/glossaire/#glossaire` },
        author: { '@id': `${ORIGIN}/#organisation` },
        publisher: { '@id': `${ORIGIN}/#organisation` },
        image: og },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Lire Marx', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Glossaire', item: `${ORIGIN}/glossaire/` },
          { '@type': 'ListItem', position: 3, name: titre },
        ] },
    ].map((o) => `${OPEN}\n${JSON.stringify(o, null, 2)}\n${CLOSE}`).join('\n');

    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${echap(titre)} — Marx, définition et explication | Lire Marx</title>
<!-- PAGE GÉNÉRÉE par tools/gen-seo.mjs depuis ${dossier}/ (essai.html,
     meta.json, monde.js). Ne pas éditer à la main : tout changement serait
     écrasé. Le texte se modifie dans l'essai, la scène dans monde.js, la
     forme dans le générateur, le style dans glossaire/notion.css. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/img/logo/icon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/logo/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/logo/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#15100b">
<meta name="apple-mobile-web-app-title" content="Lire Marx">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${echap(desc)}">
<meta property="og:title" content="${echap(titre)} — Marx, définition et explication">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Lire Marx">
<meta property="og:description" content="${echap(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
<link rel="stylesheet" href="/oeuvres/fonts/fonts.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/oeuvres/fonts/fonts.css"></noscript>
<link rel="stylesheet" href="/glossaire/notion.css?v=${hashV('glossaire/notion.css')}">
<link rel="preload" href="/oeuvres/shell.css?v=8" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/oeuvres/shell.css?v=8"></noscript>
${ld}
</head>
<body>
<main class="wrap" id="contenu" tabindex="-1">
<article class="nt nt--monde${plein ? ' nt--plein' : ''}">
<div class="nt-grid">
<div class="nt-col">

  <nav class="nt-fil" aria-label="Fil d'Ariane">
    <a href="/">Lire Marx</a><span aria-hidden="true">›</span><a href="/glossaire/">Glossaire</a><span aria-hidden="true">›</span>${t.nom}
  </nav>

  <p class="nt-label">La notion</p>
  <h1 class="nt-h1">${meta.titre || t.nom}${(meta.de || t.de) ? `<span class="nt-de" lang="de">${meta.de || t.de}</span>` : ''}</h1>
  <p class="nt-chapo">${meta.chapo}</p>

  <nav class="nt-som" aria-label="Sommaire">
    <p class="nt-som-t">Dans cet essai</p>
    <ol>
${sections.map((s) => `      <li><a href="#${s.id}">${s.h2}</a></li>`).join('\n')}
    </ol>
  </nav>

  <div class="nt-corps nt-essai">
${essai}
  </div>

  <p class="nt-colophon">Les citations sont relevées dans le texte que ce site sert — ${src.cite || ''} — et chacune mène au passage dans la liseuse.</p>

  <div class="nt-appareil">
    <div class="nt-bloc nt-bloc--source">
      <p class="nt-bloc-t">Où Marx l'établit</p>
      <p>${meta.ou || 'Voir les pièces de l’atelier ci-contre.'}</p>
${(() => {
  const chs = CHAP_META.filter((c) => (c.notions || []).some((n) => identite(n) === identite(t.nom)));
  const coms = COMM_META.filter((k) => (k.notions || []).some((n) => identite(n) === identite(t.nom)));
  const lis = [...chs.map((c) => `        <li><a href="${c.href}">Le chapitre ${c.rn} expliqué →</a></li>`),
               ...coms.map((k) => `        <li><a href="${k.href}">Commentaire guidé : ${k.titre} →</a></li>`)];
  return lis.length ? `      <ul class="nt-liens">\n${lis.join('\n')}\n      </ul>\n` : '';
})()}    </div>
    <div class="nt-bloc">
      <p class="nt-bloc-t">Le voir fonctionner</p>
      <ul class="nt-liens">
${outils.map((o) => `        <li><a href="${o.url}">${o.label}</a></li>`).join('\n')}
      </ul>
    </div>
  </div>

${voisines.length ? `  <div class="nt-voisines">
    <p class="nt-bloc-t">Notions voisines</p>
    <div class="nt-puces">
${voisines.map((v) => `      <a href="${v.href}">${v.nom}</a>`).join('\n')}
    </div>
  </div>
` : ''}
  <div class="nt-fin">
    <a class="nt-btn" href="/glossaire/">Revenir à l'abécédaire</a>
  </div>

</div>
${monde}
</div>
</article>
</main>
${PIED}
<script src="/config.js"></script>
<script src="/oeuvres/shell.js?v=9"></script>
<script src="/oeuvres/shell-social.js"></script>
<script>installShell({ workTitle: 'Glossaire', tabs: [] });</script>
${aScene ? `<script src="/glossaire/monde-driver.js?v=${hashV('glossaire/monde-driver.js')}" defer></script>` : ''}
</body>
</html>
`;
    /* L'ESSAI ENTRE DANS LA RECHERCHE, section par section : c'est l'ancre
     * qui fait le lien (`/glossaire/<id>#<étape>`), et le titre de section
     * qui situe le passage. On prend le texte APRÈS assemblage, donc tel
     * que le lecteur le lit — citations comprises. */
    const corps = {};
    for (const m of essai.matchAll(/<section class="nt-sec"[^>]*id="([^"]+)"[^>]*>([^]*?)<\/section>/g))
      corps[m[1]] = nu(m[2].replace(/<h2[^>]*>[^]*?<\/h2>/, '')).replace(/\s+/g, ' ').trim();
    /* TOUT CE QUE LE LECTEUR VOIT, et pas seulement le corps de l'essai :
     * la légende du monde est sous la scène, le chapô est en tête, la
     * notice de source est dans l'appareil. « Espalier » ne rendait rien
     * alors que la page de la subsomption en montre un — le mot n'est que
     * dans la légende. La légende va donc à SA section, le chapô et la
     * notice à une entrée qui mène en haut de page. */
    const legendes = (meta.monde && meta.monde.etapes) || {};
    ESSAIS.push({ id: t.id, t: titre,
      s: [{ a: '', h: 'Présentation', x: [nu(meta.chapo), nu(meta.ou)].join(' ').replace(/\s+/g, ' ').trim() }]
        .concat(sections.map((sec) => ({
          a: sec.id, h: nu(sec.h2),
          x: [corps[sec.id] || '', nu(legendes[sec.etape] || '')].join(' ').replace(/\s+/g, ' ').trim()
        })))
        .filter((sec) => sec.x.length > 40) });

    writeIfNeeded(`glossaire/${t.id}.html`, html, `glossaire/${t.id}.html`);
    PAGES_NOTIONS.push({ file: `glossaire/${t.id}.html`, url: `/glossaire/${t.id}` });
    if (!check) console.log(`  monde : « ${titre} » — ${sections.length} sections, ${mots} mots, ${nbCit} citations liées au texte${aScene ? ', scène' : ''}${still ? ', image fixe' : ', SANS image fixe'}`);
  }

  const avecPage = termes.filter((t) => t.page);
  for (const t of avecPage) {
    const pg = t.page;
    if (pg && pg.dossier) { pageMonde(t); continue; }
    const url = `${ORIGIN}/glossaire/${t.id}`;
    const titre = nu(t.nom);
    const desc = nu(pg.chapo);

    /* « Le voir fonctionner » : les instruments viennent des PROVENANCES,
     * donc des ateliers eux-mêmes. `outils` n'ajoute que ce qu'aucune
     * provenance ne donne — le jeu, par exemple. */
    const outils = [
      ...t.sources.map((sc) => ({ label: `${nu(sc.groupe)} — ${sc.oeuvre}`, url: sc.url })),
      ...(pg.outils || []),
    ];
    const voisines = (pg.voisins || [])
      .map((v) => termes.find((x) => identite(x.nom) === identite(v)))
      .filter(Boolean);
    if ((pg.voisins || []).length !== voisines.length) throw new Error(
      `Voisines introuvables pour « ${titre} » : ${(pg.voisins || [])
        .filter((v) => !termes.some((x) => identite(x.nom) === identite(v)))
        .map((v) => `« ${v} »`).join(', ')}`);

    const chaps = [...new Set(t.sources.flatMap((sc) => sc.chaps))];

    const ld = [
      { '@context': 'https://schema.org', '@type': 'DefinedTerm',
        '@id': url, name: titre, description: desc, url, inLanguage: 'fr',
        ...(t.de ? { alternateName: nu(t.de) } : {}),
        inDefinedTermSet: { '@id': `${ORIGIN}/glossaire/#glossaire` } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Lire Marx', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Glossaire', item: `${ORIGIN}/glossaire/` },
          { '@type': 'ListItem', position: 3, name: titre },
        ] },
    ].map((o) => `${OPEN}\n${JSON.stringify(o, null, 2)}\n${CLOSE}`).join('\n');

    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${echap(titre)} — Marx, définition et sources | Lire Marx</title>
<!-- PAGE GÉNÉRÉE par tools/gen-seo.mjs depuis oeuvres/lexique.json.
     Ne pas éditer à la main : tout changement serait écrasé. Le texte se
     modifie dans le lexique, la forme dans le générateur, le style dans
     glossaire/notion.css. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/img/logo/icon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/logo/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/logo/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#15100b">
<meta name="apple-mobile-web-app-title" content="Lire Marx">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${echap(desc)}">
<meta property="og:title" content="${echap(titre)} — Marx, définition et sources">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Lire Marx">
<meta property="og:description" content="${echap(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/img/archive/das-kapital-titre-1867.jpg">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
<link rel="stylesheet" href="/oeuvres/fonts/fonts.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/oeuvres/fonts/fonts.css"></noscript>
<link rel="stylesheet" href="/glossaire/notion.css">
<link rel="preload" href="/oeuvres/shell.css?v=8" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/oeuvres/shell.css?v=8"></noscript>
${ld}
</head>
<body>
<main class="wrap" id="contenu" tabindex="-1">
<article class="nt">

  <nav class="nt-fil" aria-label="Fil d'Ariane">
    <a href="/">Lire Marx</a><span aria-hidden="true">›</span><a href="/glossaire/">Glossaire</a><span aria-hidden="true">›</span>${t.nom}
  </nav>

  <p class="nt-label">La notion</p>
  <h1 class="nt-h1">${t.nom}${t.de ? `<span class="nt-de" lang="de">${t.de}</span>` : ''}</h1>
  <p class="nt-chapo">${pg.chapo}</p>

  <div class="nt-corps">
${pg.corps.map((par) => `    <p>${par}</p>`).join('\n')}
  </div>

  <div class="nt-appareil">
    <div class="nt-bloc nt-bloc--source">
      <p class="nt-bloc-t">Où Marx l'établit</p>
      <!-- La notice « ou » PRIME sur les chapitres déduits : l'atelier
           rattache une station à des chapitres du Livre I, ce qui suffit
           d'ordinaire mais induirait en erreur pour une notion établie
           ailleurs — la baisse tendancielle est du Livre III. Quand la
           notice est écrite, c'est elle qui dit vrai.
           (Pas d'accent grave dans ce commentaire : il est DANS un template
           literal, et le refermerait.) -->
      <p>${pg.ou
            || (chaps.length
                 ? `Livre&nbsp;I, ${chaps.length > 1 ? 'chapitres' : 'chapitre'} ${chaps.join(', ')}.`
                 : 'Voir les pièces de l’atelier ci-contre.')}</p>
    </div>
    <div class="nt-bloc">
      <p class="nt-bloc-t">Le voir fonctionner</p>
      <ul class="nt-liens">
${outils.map((o) => `        <li><a href="${o.url}">${o.label}</a></li>`).join('\n')}
      </ul>
    </div>
  </div>

${voisines.length ? `  <div class="nt-voisines">
    <p class="nt-bloc-t">Notions voisines</p>
    <div class="nt-puces">
${voisines.map((v) => `      <a href="${v.href}">${v.nom}</a>`).join('\n')}
    </div>
  </div>
` : ''}
  <div class="nt-fin">
    <a class="nt-btn" href="/glossaire/">Revenir à l'abécédaire</a>
  </div>

</article>
</main>
${PIED}
<script src="/config.js"></script>
<script src="/oeuvres/shell.js?v=9"></script>
<script src="/oeuvres/shell-social.js"></script>
<script>installShell({ workTitle: 'Glossaire', tabs: [] });</script>
</body>
</html>
`;
    writeIfNeeded(`glossaire/${t.id}.html`, html, `glossaire/${t.id}.html`);
    PAGES_NOTIONS.push({ file: `glossaire/${t.id}.html`, url: `/glossaire/${t.id}` });
  }

  /* L'index des essais : un fichier à part, chargé à la demande par la
   * recherche — il pèse deux cent quatre-vingts kilo-octets avant
   * compression, et l'index principal est lu dès la première frappe. Il est
   * `noindex` (voir `_headers`) : c'est une seconde copie des essais, et un
   * moteur y verrait du contenu dupliqué. */
  if (ESSAIS.length) {
    const mots = ESSAIS.reduce((n, e) => n + e.s.reduce((m, x) => m + x.x.split(/\s+/).length, 0), 0);
    writeIfNeeded('oeuvres/recherche-essais.json',
      JSON.stringify({ v: 1, source: 'tools/gen-seo.mjs', n: ESSAIS }) + '\n',
      'oeuvres/recherche-essais.json (le texte des essais)');
    if (!check) console.log(`  essais : ${ESSAIS.length} pages, ${ESSAIS.reduce((n, e) => n + e.s.length, 0)} sections, ${mots} mots indexés`);
  }

  /* Une page de notion orpheline — dont le `page` a été retiré du lexique —
   * resterait servie et indexée sans que rien ne la relie. On ne la supprime
   * pas d'office (un fichier généré peut avoir été gardé exprès), on le dit. */
  const attendues = new Set(avecPage.map((t) => `${t.id}.html`).concat('index.html'));
  const surPlace = readdirSync('glossaire').filter((f) => f.endsWith('.html'));
  const orphelinesPages = surPlace.filter((f) => !attendues.has(f));
  if (orphelinesPages.length && !check) {
    console.log(`  ⚠ pages de notion sans entrée dans le lexique : ${orphelinesPages.join(', ')}`);
  }

  writeIfNeeded(fichier, page, fichier);
  if (termes.length < 60) throw new Error(`Seulement ${termes.length} notions relevées — CONCEPTS a changé de forme.`);
  if (!check) {
    /* Le signal utile n'est pas « combien viennent du lexique » — les sept
     * notions des Manuscrits ont leur définition longue dans leur propre
     * fiche — mais « combien sont encore une légende de carte ». On mesure
     * donc la LONGUEUR, pas la provenance. */
    const courtes = termes.filter((t) => decode(t.def).split(/\s+/).length < 18);
    const mots = termes.reduce((n, t) => n + decode(t.def).split(/\s+/).length, 0);
    console.log(`  lexique : ${termes.length} notions, ${Math.round(mots / termes.length)} mots de définition en moyenne, `
      + `${termes.filter((t) => t.de).length} avec leur terme allemand`
      + (courtes.length
          ? `\n  ⚠ ${courtes.length} encore sur une légende de carte : `
            + courtes.map((t) => `« ${decode(t.nom)} »`).join(', ')
          : '.'));
  }

  /* ─────────────── LES PAGES DE CHAPITRE DU CAPITAL ───────────────
   * Mission chapitres-capital. Les trente-trois chapitres n'avaient pour
   * adresse qu'un fragment (#ch=X), que Google ignore. Or la demande est
   * réelle (« le capital chapitre 10 résumé ») et la concurrence faible :
   * des blogs, un site de lectures, et pour la plupart des chapitres AUCUNE
   * page explicative en français. Chaque page est ÉCRITE — un résumé de
   * soixante-quatre mots assemblé avec les définitions de l'abécédaire
   * aurait été du contenu mince qui fait concurrence aux pages de notion.
   *
   * Le dossier (oeuvres/capital-1/chapitres/<romain>/) porte l'essai et une
   * tête ; tout le reste est DÉRIVÉ de l'atelier : titre, section et voisins
   * (ROY_STRUCT), dates (CHRONO), instrument (META.labo), marche (META.d).
   *
   * LA DOUBLE NUMÉROTATION est l'apport propre de ces pages. Roy — revu par
   * Marx — découpe le Livre I en trente-trois chapitres, et les éditions
   * anglaises le suivent ; l'original allemand et la traduction dirigée par
   * Jean-Pierre Lefebvre en comptent vingt-cinq. Un étudiant cherche avec la
   * numérotation de SON édition. Table relevée sur trois sources concordantes :
   * l'arborescence de zeno.org (chapitres 10 à 13 dans la IVe section), les
   * lectures de d-meeus.be (la journée de travail au chapitre 8) et
   * marxists.org en anglais (Chapter Ten: The Working-Day, sept parties comme
   * chez Roy). Le chapitre 4 allemand devient IV à VI chez Roy, le 24 devient
   * XXVI à XXXII. */
  const ALLEMAND = { I: 1, II: 2, III: 3, IV: 4, V: 4, VI: 4, VII: 5, VIII: 6, IX: 7, X: 8, XI: 9,
    XII: 10, XIII: 11, XIV: 12, XV: 13, XVI: 14, XVII: 15, XVIII: 16, XIX: 17, XX: 18, XXI: 19,
    XXII: 20, XXIII: 21, XXIV: 22, XXV: 23, XXVI: 24, XXVII: 24, XXVIII: 24, XXIX: 24, XXX: 24,
    XXXI: 24, XXXII: 24, XXXIII: 25 };
  if (CHAP_META.length) {
    const capSrc = readFileSync('oeuvres/capital-1.html', 'utf8');
    const ROYS = litteralJS(capSrc, 'ROY_STRUCT=', '[');
    const METAC = litteralJS(capSrc, 'META=', '{');
    const CHRONOC = litteralJS(capSrc, 'CHRONO=', '[');
    const STEPSC = litteralJS(capSrc, 'STEPS=', '[');
    const LABOC = litteralJS(capSrc, 'LABO_LABELS=', '{');
    const ORDRE = ROYS.flatMap((sec, si) => sec.chaps.map((c) => ({ rn: c[0], t: c[1], sec: sec.rn, secT: sec.t, s: si + 1 })));
    if (ORDRE.length !== 33) throw new Error(`ROY_STRUCT rend ${ORDRE.length} chapitres — le Livre I en a trente-trois.`);
    for (const k of Object.keys(ALLEMAND)) if (!ORDRE.some((o) => o.rn === k)) throw new Error(`Numérotation allemande : ${k} n'est pas un chapitre de Roy.`);
    for (const c of CHAP_META) CHAP_HREF[c.rn] = c.href;

    for (const c of CHAP_META) {
      const i = ORDRE.findIndex((o) => o.rn === c.rn);
      if (i < 0) throw new Error(`Chapitre ${c.rn} : absent de ROY_STRUCT.`);
      const o = ORDRE[i], m = METAC[c.rn] || {};
      const url = `${ORIGIN}${c.href}`;
      const titre = nu(o.t);
      const desc = nu(c.description || c.chapo);
      const cite = `Karl Marx, <i>Le Capital</i>, Livre I, chapitre ${c.rn} — traduction Joseph Roy (1872)`;
      const lien = (sEl, q) => `/oeuvres/capital-1#s=${sEl || o.s}&q=${encodeURIComponent(q)}`;
      let essai = readFileSync(`${c.dossier}/essai.html`, 'utf8').replace(/<!--[^]*?-->/g, '').trim();

      const sections = [];
      essai = essai.replace(/<section class="nt-sec" data-etape="([^"]+)" id="([^"]+)">\s*<h2>([^]*?)<\/h2>/g, (mm, etape, id, h2) => {
        const n = sections.length; sections.push({ etape, id, h2 });
        return `<section class="nt-sec" data-etape="${etape}" id="${id}">\n<h2><span class="nt-sec-n" aria-hidden="true">${ROMAINS[n]}</span>${h2}</h2>`;
      });
      if (sections.length < 3) throw new Error(`Chapitre ${c.rn} : l'essai n'a que ${sections.length} section(s).`);
      let nbCit = 0;
      essai = essai.replace(/<blockquote data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/blockquote>/g, (mm, sEl, q, inner) => {
        nbCit++; return `<blockquote>${inner.trim()}<cite>${cite}<a href="${lien(sEl, q)}">Lire dans le texte →</a></cite></blockquote>`;
      });
      essai = essai.replace(/<q data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/q>/g, (mm, sEl, q, inner) => {
        nbCit++; return `<a class="nt-q" href="${lien(sEl, q)}" title="Lire ce passage dans le texte"><q>${inner}</q></a>`;
      });
      if (/data-q=/.test(essai)) throw new Error(`Chapitre ${c.rn} : une citation n'a pas été reconnue.`);
      const mots = nu(essai).split(/\s+/).filter(Boolean).length;
      if (mots < 900) throw new Error(`Chapitre ${c.rn} : ${mots} mots — une page de chapitre en veut au moins 900.`);

      const notions = (c.notions || []).map((n) => termes.find((x) => identite(x.nom) === identite(n)));
      if (notions.some((x) => !x)) throw new Error(`Chapitre ${c.rn} : notions introuvables — ${(c.notions || []).filter((n, k) => !notions[k]).join(', ')}`);
      const dates = CHRONOC.filter((e) => String(e.chap || '').split(/[^IVXLC]+/).includes(c.rn));
      const labo = m.labo && LABOC[m.labo] ? { label: nu(LABOC[m.labo]).replace(/^Modèle /, ''), url: `/oeuvres/capital-1#labo=${m.labo}` } : null;
      const marche = m.d && STEPSC[m.d - 1] ? { label: nu(STEPSC[m.d - 1].t), n: m.d, url: `/oeuvres/capital-1#deriv=${m.d}` } : null;

      const nA = ALLEMAND[c.rn];
      const freres = Object.keys(ALLEMAND).filter((k) => ALLEMAND[k] === nA);
      const nums = freres.length > 1
        ? `Il appartient au chapitre <b>${nA}</b> de l'original allemand et de la traduction dirigée par Jean-Pierre Lefebvre, que Roy découpe en ${freres.length} chapitres (${freres[0]} à ${freres[freres.length - 1]}) ; chapitre <b>${c.arabe}</b> dans les éditions anglaises, qui suivent le découpage de Roy.`
        : `Chapitre <b>${nA}</b> dans l'original allemand et dans la traduction dirigée par Jean-Pierre Lefebvre ; chapitre <b>${c.arabe}</b> dans les éditions anglaises, qui suivent le découpage de Roy.`;

      const voisin = (k) => {
        const v = ORDRE[k]; if (!v) return null;
        const page = CHAP_META.find((x) => x.rn === v.rn);
        return { rn: v.rn, t: nu(v.t), href: page ? page.href : `/oeuvres/capital-1#ch=${v.rn}`, page: !!page };
      };
      const prec = voisin(i - 1), suiv = voisin(i + 1);

      const ld = [
        { '@context': 'https://schema.org', '@type': 'Article',
          headline: `Le Capital, chapitre ${c.arabe} : ${titre}`, description: desc, url, inLanguage: 'fr', wordCount: mots,
          about: { '@type': 'Book', name: 'Le Capital — Livre I', url: `${ORIGIN}/oeuvres/capital-1`,
                   author: { '@type': 'Person', name: 'Karl Marx', sameAs: 'https://www.wikidata.org/wiki/Q9061' } },
          author: { '@id': `${ORIGIN}/#organisation` }, publisher: { '@id': `${ORIGIN}/#organisation` },
          image: `${ORIGIN}/assets/img/archive/das-kapital-titre-1867.jpg` },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Lire Marx', item: `${ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Le Capital', item: `${ORIGIN}/oeuvres/capital-1` },
            { '@type': 'ListItem', position: 3, name: `Chapitre ${c.rn}` },
          ] },
      ].map((x) => `${OPEN}\n${JSON.stringify(x, null, 2)}\n${CLOSE}`).join('\n');

      const bloc = (t, corps, cls = '') => `    <div class="nt-bloc${cls}">\n      <p class="nt-bloc-t">${t}</p>\n${corps}\n    </div>`;
      const marge = [
        bloc('Où il se place', `      <p>Section ${o.sec} — ${nu(o.secT)}.</p>\n      <ul class="nt-liens">\n        <li><a href="/oeuvres/capital-1#ch=${c.rn}">Lire le chapitre dans l'atelier →</a></li>\n      </ul>`, ' nt-bloc--source'),
        ...COMM_META.filter((k) => k.rn === c.rn).map((k) => bloc('Un commentaire guidé', `      <ul class="nt-liens">\n        <li><a href="${k.href}">${k.titre} →</a></li>\n      </ul>`)),
        (c.parties || []).length ? bloc(`Ses ${['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'][c.parties.length] || c.parties.length} parties`, `      <ol class="ch-plan">\n${c.parties.map(([n, t, p]) => `        <li><span class="n">${n}</span><span>${t}</span><span class="p">${p}&nbsp;%</span></li>`).join('\n')}\n      </ol>`) : '',
        notions.length ? bloc('Les notions qu’il établit', `      <ul class="nt-liens">\n${notions.map((x) => `        <li><a href="${x.href}">${decode(x.affiche || x.nom)}</a></li>`).join('\n')}\n      </ul>`) : '',
        dates.length ? bloc('Ce qu’il raconte', `      <ol class="ch-dates">\n${dates.map((e) => `        <li><span class="y">${e.year}</span><span>${nu(e.title)}</span></li>`).join('\n')}\n      </ol>`) : '',
        (labo || marche) ? bloc('Le voir fonctionner', `      <ul class="nt-liens">\n${labo ? `        <li><a href="${labo.url}">${labo.label} — le laboratoire</a></li>\n` : ''}${marche ? `        <li><a href="${marche.url}">Marche ${marche.n} du cheminement : ${marche.label}</a></li>\n` : ''}      </ul>`) : '',
      ].filter(Boolean).join('\n');

      const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Le Capital, chapitre ${c.arabe} : ${echap(titre)} — résumé et explication | Lire Marx</title>
<!-- PAGE GÉNÉRÉE par tools/gen-seo.mjs depuis ${c.dossier}/ (essai.html,
     meta.json) et depuis les données de l'atelier. Ne pas éditer à la main :
     le texte se modifie dans l'essai, la forme dans le générateur, le style
     dans glossaire/notion.css. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/img/logo/icon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/logo/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/logo/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#15100b">
<meta name="apple-mobile-web-app-title" content="Lire Marx">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${echap(desc)}">
<meta property="og:title" content="Le Capital, chapitre ${c.arabe} : ${echap(titre)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Lire Marx">
<meta property="og:description" content="${echap(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/img/archive/das-kapital-titre-1867.jpg">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
<link rel="stylesheet" href="/oeuvres/fonts/fonts.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/oeuvres/fonts/fonts.css"></noscript>
<link rel="stylesheet" href="/glossaire/notion.css?v=${hashV('glossaire/notion.css')}">
<link rel="preload" href="/oeuvres/shell.css?v=8" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/oeuvres/shell.css?v=8"></noscript>
${ld}
</head>
<body>
<main class="wrap" id="contenu" tabindex="-1">
<article class="nt nt--ch">
<div class="nt-grid">
<div class="nt-col">

  <nav class="nt-fil" aria-label="Fil d'Ariane">
    <a href="/">Lire Marx</a><span aria-hidden="true">›</span><a href="/oeuvres/capital-1">Le Capital</a><span aria-hidden="true">›</span>Chapitre ${c.rn}
  </nav>

  <p class="nt-label">Le Capital, Livre I · Section ${o.sec}</p>
  <h1 class="nt-h1"><span class="ch-num">Chapitre ${c.rn}</span>${o.t}</h1>
  <p class="ch-nums">${nums}</p>
  <p class="nt-chapo">${c.chapo}</p>
  <div class="ch-acts">
    <a class="nt-btn" href="/oeuvres/capital-1#ch=${c.rn}">Lire le chapitre</a>
  </div>

  <nav class="nt-som" aria-label="Sommaire">
    <p class="nt-som-t">Dans cette explication</p>
    <ol>
${sections.map((x) => `      <li><a href="#${x.id}">${x.h2}</a></li>`).join('\n')}
    </ol>
  </nav>

  <div class="nt-corps nt-essai">
${essai}
  </div>

  <p class="nt-colophon">Les citations sont relevées dans le texte que ce site sert — ${cite} — et chacune mène au passage dans la liseuse.</p>

  <nav class="ch-suite" aria-label="Chapitres voisins">
${prec ? `    <a class="prec" href="${prec.href}"><span class="k">← Chapitre ${prec.rn}</span><span class="t">${prec.t}</span></a>` : '    <span></span>'}
${suiv ? `    <a class="suiv" href="${suiv.href}"><span class="k">Chapitre ${suiv.rn} →</span><span class="t">${suiv.t}</span></a>` : ''}
  </nav>

</div>
  <aside class="ch-marge" aria-label="Dans ce chapitre">
${marge}
  </aside>
</div>
</article>
</main>
${PIED}
<script src="/config.js"></script>
<script src="/oeuvres/shell.js?v=9"></script>
<script src="/oeuvres/shell-social.js"></script>
<script>installShell({ workTitle: 'Le Capital', tabs: [] });</script>
</body>
</html>
`;
      const fichier = `oeuvres/capital-1/chapitre-${c.arabe}.html`;
      writeIfNeeded(fichier, html, fichier);
      PAGES_CHAPITRES.push({ file: fichier, url: c.href });
      if (!check) console.log(`  chapitre ${c.rn} → ${c.href} — ${sections.length} sections, ${mots} mots, ${nbCit} citations, ${notions.length} notions, ${dates.length} dates`);
    }
  }

  /* ----------- Les commentaires guidés et /agregation-2027 ----------- *
   * Mission agregation-2027. Un commentaire porte sur un extrait du texte que
   * le site SERT : ses citations mènent au passage dans la liseuse, comme
   * celles des chapitres, et tools/verif-citations.mjs vérifie l'extrait
   * paragraphe par paragraphe. Sur toute autre œuvre — traduction protégée
   * (Bottigelli), livre non servi — le générateur REFUSE les citations
   * liées : c'est la règle déjà tenue par les pages de notion.
   * La page-carrefour n'affirme que ce qui a été vérifié à la date de son
   * champ etat ; la date des écrits ne s'affiche que si ecrits.date est
   * rempli, c'est-à-dire publiée par le ministère.
   * 2e PASSE (aérer, ordonner, animer) : feuille commentaires/agregation.css
   * et script commentaires/agregation.js, tous deux versionnés par leur
   * contenu ; pas de sur-titre, la marge porte un sommaire qui suit la
   * lecture ; la frise reçoit ses lignes « où le lire » depuis meta.acces.
   * ------------------------------------------------------------------- */
  const teteCm = (o) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${echap(o.title)} | Lire Marx</title>
<!-- PAGE GÉNÉRÉE par tools/gen-seo.mjs depuis ${o.src}/ (essai.html,
     meta.json). Ne pas éditer à la main : le texte se modifie dans l'essai,
     la forme dans le générateur, le style dans commentaires/agregation.css. -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/img/logo/icon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/logo/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/logo/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#15100b">
<meta name="apple-mobile-web-app-title" content="Lire Marx">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${echap(o.desc)}">
<meta property="og:title" content="${echap(o.og)}">
<meta property="og:type" content="${o.type}">
<meta property="og:site_name" content="Lire Marx">
<meta property="og:description" content="${echap(o.desc)}">
<meta property="og:url" content="${o.url}">
<meta property="og:image" content="${ORIGIN}${o.image}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${o.url}">
<link rel="stylesheet" href="/oeuvres/fonts/fonts.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/oeuvres/fonts/fonts.css"></noscript>
<link rel="stylesheet" href="/glossaire/notion.css?v=${hashV('glossaire/notion.css')}">
<link rel="stylesheet" href="/commentaires/agregation.css?v=${hashV('commentaires/agregation.css')}">
<link rel="preload" href="/oeuvres/shell.css?v=8" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/oeuvres/shell.css?v=8"></noscript>
${o.ld}
</head>`;
  const piedCm = (workTitle) => `${PIED}
<script src="/config.js"></script>
<script src="/oeuvres/shell.js?v=9"></script>
<script src="/oeuvres/shell-social.js"></script>
<script>installShell({ workTitle: '${workTitle}', tabs: [] });</script>
<script src="/commentaires/agregation.js?v=${hashV('commentaires/agregation.js')}" defer></script>
</body>
</html>
`;
  const ldCm = (arr) => arr.map((x) => `${OPEN}\n${JSON.stringify(x, null, 2)}\n${CLOSE}`).join('\n');
  const blocCm = (t, corps, cls = '') => `    <div class="nt-bloc${cls}">\n      <p class="nt-bloc-t">${t}</p>\n${corps}\n    </div>`;
  const numeroterCm = (essai, qui, numeros) => {
    const sections = [];
    const out = essai.replace(/<section class="nt-sec" data-etape="([^"]+)" id="([^"]+)">\s*<h2>([^]*?)<\/h2>/g, (mm, etape, id, h2) => {
      const n = sections.length; sections.push({ etape, id, h2, n: ROMAINS[n] });
      return `<section class="nt-sec" data-etape="${etape}" id="${id}">\n<h2>${numeros ? `<span class="nt-sec-n" aria-hidden="true">${ROMAINS[n]}</span>` : ''}${h2}</h2>`;
    });
    if (sections.length < 3) throw new Error(`${qui} : l'essai n'a que ${sections.length} section(s).`);
    return { essai: out, sections };
  };
  const sommaireCm = (titre, sections, numeros) => `  <nav class="nt-som${numeros ? '' : ' nt-som--plain'}" aria-label="Sommaire">
    <p class="nt-som-t">${titre}</p>
    <ol>
${sections.map((x) => `      <li><a href="#${x.id}">${x.h2}</a></li>`).join('\n')}
    </ol>
  </nav>`;
  /* Le sommaire de la MARGE : le même, mais qui suit la lecture (data-spy,
     aria-current posé par agregation.js). Chaque entrée porte data-moment :
     sur un commentaire, le moment de l'extrait correspondant s'éclaire. */
  const tocCm = (titre, sections, numeros) => blocCm(titre,
    `      <nav aria-label="${titre}" data-spy>\n        <ol class="ag-toc">\n${sections.map((x) => `          <li><a href="#${x.id}">${numeros ? `<span class="n" aria-hidden="true">${x.n}</span>` : ''}<span>${nu(x.h2)}</span></a></li>`).join('\n')}\n        </ol>\n      </nav>`,
    ' ag-marge-nav');
  const AG = 'Marx à l’agrégation 2027';

  for (const k of COMM_META) {
    const qui = `Commentaire ${k.slug}`;
    const url = `${ORIGIN}${k.href}`;
    const serviRoy = k.oeuvre === 'capital-1';
    const cite = serviRoy ? `Karl Marx, <i>Le Capital</i>, Livre I, chapitre ${k.rn} — traduction Joseph Roy (1872)` : '';
    const lien = (sEl, q) => `/oeuvres/capital-1#s=${sEl}&q=${encodeURIComponent(q)}`;
    let essai = readFileSync(`${k.dossier}/essai.html`, 'utf8').replace(/<!--[^]*?-->/g, '').trim();
    if (!serviRoy && /data-q=/.test(essai))
      throw new Error(`${qui} : citation liée sur une œuvre dont le site ne sert pas de traduction libre — paraphraser et situer.`);
    let extrait = null, nbCit = 0;
    essai = essai.replace(/<blockquote class="cm-texte" data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/blockquote>/g, (mm, sEl, q, inner) => {
      nbCit++; extrait = lien(sEl, q);
      return `<blockquote class="cm-texte">${inner.trim()}<cite>${cite}<a href="${extrait}">Lire le passage dans le texte →</a></cite></blockquote>`;
    });
    essai = essai.replace(/<blockquote data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/blockquote>/g, (mm, sEl, q, inner) => {
      nbCit++; return `<blockquote>${inner.trim()}<cite>${cite}<a href="${lien(sEl, q)}">Lire dans le texte →</a></cite></blockquote>`;
    });
    essai = essai.replace(/<q data-s="(\d+)" data-q="([^"]+)">([^]*?)<\/q>/g, (mm, sEl, q, inner) => {
      nbCit++; return `<a class="nt-q" href="${lien(sEl, q)}" title="Lire ce passage dans le texte"><q>${inner}</q></a>`;
    });
    if (/data-q=/.test(essai)) throw new Error(`${qui} : une citation n'a pas été reconnue.`);
    if (/EXTRAIT/.test(essai)) throw new Error(`${qui} : l'extrait n'a pas été recopié.`);
    const num = numeroterCm(essai, qui, true); essai = num.essai;
    /* Chaque segment de l'extrait désigne la section qui le commente. */
    const commentes = new Set();
    for (const m of essai.matchAll(/data-moment="([^"]+)"/g)) {
      if (!num.sections.some((x) => x.id === m[1])) throw new Error(`${qui} : data-moment « ${m[1]} » ne désigne aucune section.`);
      commentes.add(m[1]);
    }
    /* Chaque section qui commente un segment de l'extrait ouvre sur un renvoi
       vers lui ; agregation.js y éclaire le passage au clic. */
    for (const id of commentes)
      essai = essai.replace(new RegExp(`(<section class="nt-sec" data-etape="[^"]+" id="${id}">\\n<h2>[^]*?</h2>)`),
        `$1\n<p class="cm-rappel"><a href="#texte" data-voir="${id}">Revoir ce moment dans l’extrait</a></p>`);
    const mots = nu(essai).split(/\s+/).filter(Boolean).length;
    if (mots < 1200) throw new Error(`${qui} : ${mots} mots — un commentaire guidé en veut au moins 1 200.`);
    const notions = (k.notions || []).map((n) => termes.find((x) => identite(x.nom) === identite(n)));
    if (notions.some((x) => !x)) throw new Error(`${qui} : notions introuvables — ${(k.notions || []).filter((n, i) => !notions[i]).join(', ')}`);
    const chap = CHAP_META.find((x) => x.rn === k.rn);
    const a = k.annale;
    const desc = nu(k.description);

    const ld = ldCm([
      { '@context': 'https://schema.org', '@type': 'Article',
        headline: nu(k.title), description: desc, url, inLanguage: 'fr', wordCount: mots,
        about: serviRoy ? { '@type': 'Book', name: 'Le Capital — Livre I', url: `${ORIGIN}/oeuvres/capital-1`,
          author: { '@type': 'Person', name: 'Karl Marx', sameAs: 'https://www.wikidata.org/wiki/Q9061' } }
          : { '@type': 'Person', name: 'Karl Marx', sameAs: 'https://www.wikidata.org/wiki/Q9061' },
        author: { '@id': `${ORIGIN}/#organisation` }, publisher: { '@id': `${ORIGIN}/#organisation` },
        image: `${ORIGIN}/assets/img/archive/das-kapital-titre-1867.jpg` },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Lire Marx', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: AG, item: `${ORIGIN}${CARREFOUR.url}` },
          { '@type': 'ListItem', position: 3, name: 'Commentaire guidé' },
        ] },
    ]);

    const marge = [
      tocCm('Dans ce commentaire', num.sections, true),
      blocCm('Où il se trouve', `      <p>Le Capital, Livre I, chapitre ${k.rn}, partie ${k.partie}.</p>\n      <ul class="nt-liens">\n${extrait ? `        <li><a href="${extrait}">Lire le passage dans la liseuse →</a></li>\n` : ''}${chap ? `        <li><a href="${chap.href}">Le chapitre ${chap.arabe} expliqué →</a></li>\n` : ''}      </ul>`, ' nt-bloc--source'),
      a ? blocCm(`Donné en ${a.session}`, `      <p>Agrégation externe de philosophie, ${a.epreuve} (${a.programme}), dans la ${a.traduction}.</p>\n      <ul class="nt-liens">\n        <li><a href="${a.rapport.url}" rel="noopener">${a.rapport.name}&nbsp;›</a></li>\n      </ul>`) : '',
      notions.length ? blocCm('Les notions en jeu', `      <ul class="nt-liens">\n${notions.map((x) => `        <li><a href="${x.href}">${decode(x.affiche || x.nom)}</a></li>`).join('\n')}\n      </ul>`) : '',
      blocCm('Ce que cette page est', `      <p>Une lecture proposée par le site, qui n’est ni un corrigé ni une préparation. Sur ce qu’un jury attend, seuls ses rapports font autorité.</p>\n      <ul class="nt-liens">\n        <li><a href="${CARREFOUR.url}">${AG} →</a></li>\n      </ul>`),
    ].filter(Boolean).join('\n');

    const html = `${teteCm({ title: k.title, src: k.dossier, desc, og: nu(k.title), type: 'article', url,
      image: '/assets/img/archive/das-kapital-titre-1867.jpg', ld })}
<body>
<main class="wrap" id="contenu" tabindex="-1">
<article class="nt nt--ch nt--cm">
<div class="nt-grid">
<div class="nt-col">

  <nav class="nt-fil" aria-label="Fil d'Ariane">
    <a href="/">Lire Marx</a><span aria-hidden="true">›</span><a href="${CARREFOUR.url}">${AG}</a><span aria-hidden="true">›</span>Commentaire guidé
  </nav>

  <h1 class="nt-h1">${k.titre}</h1>
  <p class="ag-meta">Commentaire guidé · ${k.label}${a ? ` · sujet de l’agrégation ${a.session}` : ''}</p>
  <p class="nt-chapo">${k.chapo}</p>

${sommaireCm('Dans ce commentaire', num.sections, true)}

  <div class="nt-corps nt-essai">
${essai}
  </div>

  <p class="nt-colophon">L’extrait et les citations sont relevés dans le texte que ce site sert — ${cite} — et chacun mène au passage dans la liseuse.${a ? ` Les formules de la ${a.traduction} sont celles du sujet de ${a.session}, telles que le rapport du jury les reproduit.` : ''}</p>

  <div class="nt-fin">
    <a class="nt-btn" href="${CARREFOUR.url}">Revenir à la page de l’agrégation 2027</a>
  </div>

</div>
  <aside class="ch-marge" aria-label="Autour de l’extrait">
${marge}
  </aside>
</div>
</article>
</main>
${piedCm('Agrégation 2027')}`;
    const fichier = `commentaires/${k.slug}.html`;
    writeIfNeeded(fichier, html, fichier);
    PAGES_COMMENTAIRES.push({ file: fichier, url: k.href, priority: '0.6', changefreq: 'monthly' });
    if (!check) console.log(`  commentaire ${k.slug} → ${k.href} — ${num.sections.length} sections, ${mots} mots, ${nbCit} citations, ${notions.length} notions`);
  }

  if (existsSync(`${CARREFOUR.dir}/meta.json`)) {
    const m = JSON.parse(readFileSync(`${CARREFOUR.dir}/meta.json`, 'utf8'));
    const qui = 'Page-carrefour /agregation-2027';
    const url = `${ORIGIN}${CARREFOUR.url}`;
    let src = readFileSync(`${CARREFOUR.dir}/essai.html`, 'utf8');
    if (src.split('<!--COMMENTAIRES-->').length !== 2) throw new Error(`${qui} : le marqueur COMMENTAIRES doit figurer une fois, et une seule.`);
    const liste = COMM_META.length
      ? `<ul class="ag-com">\n${COMM_META.map((k) => `<li><a href="${k.href}"><span class="k">${k.label}${k.annale ? ` · sujet de ${k.annale.session}` : ''}</span><span class="t">${k.titre}</span><span class="go" aria-hidden="true">Lire →</span></a></li>`).join('\n')}\n</ul>`
      : '<p>Les premiers commentaires sont en cours d’écriture.</p>';
    src = src.replace('<!--COMMENTAIRES-->', liste).replace(/<!--[^]*?-->/g, '').trim();
    if (/data-q=/.test(src)) throw new Error(`${qui} : pas de citation liée sur la page-carrefour.`);

    /* « Où le lire » : chaque texte de la frise qui porte data-acces reçoit sa
       ligne, tirée de meta.acces — la source unique des adresses et des
       traducteurs vérifiés. Un identifiant inconnu, ou une entrée que rien
       n'utilise, fait échouer la génération. */
    const ws = (p) => `https://fr.wikisource.org/wiki/${encodeURI(p.replace(/ /g, '_'))}`;
    const acces = Object.fromEntries((m.acces || []).map((x) => [x.id, x]));
    const servis = new Set();
    src = src.replace(/<li data-acces="([^"]+)">([^]*?)<\/div><\/li>/g, (mm, ids, corps) => {
      const lignes = ids.split(/\s+/).map((id) => {
        const x = acces[id];
        if (!x) throw new Error(`${qui} : data-acces « ${id} » absent de meta.acces.`);
        servis.add(id);
        return x.href ? `<a href="${x.href}">sur ce site</a>, ${x.note}` : `<a href="${ws(x.ws)}" rel="noopener">${x.t}</a>, ${x.note}, sur Wikisource`;
      });
      return `<li>${corps}<p class="ag-acces">Où le lire&nbsp;: ${lignes.join('&nbsp;; ')}.</p></div></li>`;
    });
    for (const id of Object.keys(acces)) if (!servis.has(id)) throw new Error(`${qui} : meta.acces « ${id} » n'est utilisé par aucun texte de la frise.`);

    const num = numeroterCm(src, qui, false);
    const desc = nu(m.description);
    const ecrits = m.ecrits.date
      ? `<div><dt>Écrits</dt><dd>${m.ecrits.date}</dd></div>`
      : `<div class="ag-attente"><dt>Écrits</dt><dd>Date non publiée<small>au ${m.etat} · <a href="${m.ecrits.url}" rel="noopener">calendrier officiel</a></small></dd></div>`;
    const fiche = `  <dl class="ag-fiche">\n${m.fiche.map((f) => `    <div><dt>${f.k}</dt><dd>${f.v}${f.n ? `<small>${f.n}</small>` : ''}</dd></div>`).join('\n')}\n    ${ecrits}\n  </dl>`;

    const ld = ldCm([
      { '@context': 'https://schema.org', '@type': 'WebPage',
        name: nu(m.titre), description: desc, url, inLanguage: 'fr',
        about: { '@type': 'Person', name: 'Karl Marx', sameAs: 'https://www.wikidata.org/wiki/Q9061' },
        publisher: { '@id': `${ORIGIN}/#organisation` } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Lire Marx', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: AG },
        ] },
    ]);

    const marge = [
      tocCm('Sur cette page', num.sections, false),
      blocCm('Documents officiels', `      <ul class="nt-liens">\n        <li><a href="${m.programme.url}" rel="noopener">${m.programme.name}&nbsp;›</a></li>\n        <li><a href="${m.ecrits.url}" rel="noopener">${m.ecrits.name}&nbsp;›</a></li>\n${m.rapports.map((r) => `        <li><a href="${r.url}" rel="noopener">${r.name}&nbsp;›</a></li>`).join('\n')}\n      </ul>`, ' nt-bloc--source'),
    ].join('\n');

    const html = `${teteCm({ title: m.title, src: CARREFOUR.dir, desc, og: nu(m.titre), type: 'website', url,
      image: '/assets/img/archive/manuscrit-ideologie-1846.jpg', ld })}
<body>
<main class="wrap" id="contenu" tabindex="-1">
<article class="nt nt--ch nt--ag">
<div class="nt-grid">
<div class="nt-col">

  <nav class="nt-fil" aria-label="Fil d'Ariane">
    <a href="/">Lire Marx</a><span aria-hidden="true">›</span>Agrégation 2027
  </nav>

  <h1 class="nt-h1">${m.titre}</h1>
  <p class="ag-meta">${m.label}</p>
  <p class="nt-chapo">${m.chapo}</p>
${fiche}

${sommaireCm('Sur cette page', num.sections, false)}

  <div class="nt-corps nt-essai">
${num.essai}
  </div>

  <p class="nt-colophon">Les faits de cette page — programme, calendrier, chiffres, rapports — ont été vérifiés le ${m.etat} sur les documents officiels donnés en marge. Lire Marx n’est lié à aucun jury ni à aucune préparation.</p>

</div>
  <aside class="ch-marge" aria-label="L’épreuve en bref">
${marge}
  </aside>
</div>
</article>
</main>
${piedCm('Agrégation 2027')}`;
    writeIfNeeded(CARREFOUR.file, html, CARREFOUR.file);
    PAGES_COMMENTAIRES.unshift({ file: CARREFOUR.file, url: CARREFOUR.url, priority: '0.8', changefreq: 'weekly' });
    if (!check) console.log(`  carrefour → ${CARREFOUR.url} — ${num.sections.length} sections, ${COMM_META.length} commentaire(s)`);
  }
}

/* ------------- Le maillage : les fiches mènent à leur page ------------- *
 * MESURÉ AVANT : les deux ateliers — les pages les plus lourdes du site —
 * ne portaient PAS UN SEUL lien vers une page de notion. Les trente-neuf
 * pages du glossaire ne recevaient de liens que de l'abécédaire et les unes
 * des autres : une île. Or les soixante-quinze fiches du laboratoire SONT
 * les soixante-quinze notions qui ont désormais une page — la chaîne
 * existait, elle n'était pas câblée.
 *
 * Deux choses sont écrites ici, et la seconde est celle qui compte pour les
 * crawlers des moteurs de réponse, qui lisent le HTML brut :
 *   · la TABLE `window.NOTIONS_HREF`, que les deux pages lisent au rendu ;
 *   · les CARTES PRÉ-RENDUES du laboratoire de Capital, exactement comme le
 *     registre de la bibliothèque (`seo-registre-servi`) — le JS les
 *     réécrit à l'identique par-dessus.
 *
 * LE PRIX D'UN RENDU À DEUX ENDROITS : `ccHtml()` ci-dessous et celui de
 * capital-1.html doivent produire le MÊME octet. Ils bougent ensemble, et
 * le contrôle est de comparer le `innerHTML` d'un conteneur après rendu au
 * HTML servi. C'est la règle déjà posée pour `flatRegister`/`renderFlat`. */
const MAILLE_DEB = '<!-- NOTIONS:DÉBUT';
const MAILLE_FIN = '<!-- NOTIONS:FIN -->';

/* Le même balisage que `ccHtml()` dans capital-1.html. Une fiche dont la
   notion ne mène nulle part reste un <div> : on ne fabrique pas un lien
   mort pour l'uniformité. */
function ccHtml(x, ICONS, h) {
  const inner = '<div class="cc-icon">' + ICONS[x.ic] + '</div><div><div class="cc-term">' + x.t
    + '</div><div class="cc-def">' + x.d + '</div><span class="cc-formula">' + x.f + '</span></div>';
  return h ? '<a class="ccard cc-go" style="--accent:' + x.ac + '" href="' + h + '">' + inner + '</a>'
           : '<div class="ccard" style="--accent:' + x.ac + '">' + inner + '</div>';
}

for (const [file, oeuvre] of [['oeuvres/capital-1.html', 'Le Capital'],
                              ['oeuvres/manuscrits-1844.html', 'Manuscrits de 1844']]) {
  let src = readFileSync(file, 'utf8');
  const liens = LIENS_FICHES[oeuvre];

  /* La table. Les clés sont les titres de fiche, dans l'ordre du fichier —
     stable d'une génération à l'autre, donc `--check` ne bat pas la mesure. */
  const table = ' — DÉRIVÉ par tools/gen-seo.mjs, ne pas éditer à la main.\n'
    + '     La table du titre de fiche vers sa page de notion : la résolution\n'
    + '     (identité, suffixe de station, renvoi « voir ») se fait dans le\n'
    + '     générateur, la page ne fait que lire. -->\n'
    + '<script>window.NOTIONS_HREF=' + JSON.stringify(liens) + ';'
    + (oeuvre === 'Le Capital' ? 'window.CHAPITRES_HREF=' + JSON.stringify(CHAP_HREF) + ';' : '')
    + '</script>\n';
  src = entreMarqueurs(src, MAILLE_DEB, MAILLE_FIN, table, file);

  /* Les cartes pré-rendues — Capital seul : les Manuscrits n'ont pas de
     `.ccard`, leurs concepts vivent dans la carte du laboratoire. */
  if (oeuvre === 'Le Capital') {
    const CONCEPTS = litteralJS(src, 'CONCEPTS=', '{');
    const ICONS    = litteralJS(src, 'ICONS=', '{');
    for (const id of Object.keys(CONCEPTS)) {
      const deb = `<!--CC:${id}-->`, fin = '<!--/CC-->';
      if (src.indexOf(deb) < 0) throw new Error(`maillage : conteneur ${id} sans marqueur dans ${file}`);
      const html = CONCEPTS[id].map((x) => ccHtml(x, ICONS, (liens[x.t] || {}).h || '')).join('');
      src = entreMarqueurs(src, deb, fin, html, file);
    }
  } else {
    /* Les Manuscrits n'ont pas de fiches : leurs sept concepts vivent dans
       la carte du laboratoire, qui est un SVG interactif. Le panneau de
       détail porte le renvoi, mais il est peuplé par le script — donc
       invisible à un crawler qui n'exécute pas de JavaScript. Cette ligne,
       elle, est servie. Elle n'est pas un doublon de la carte : la carte
       montre des rapports, la ligne dit que chaque nœud a sa page. */
    const noms = Object.keys(liens);
    const lien = (n) => `<a href="${liens[n].h}">${n}</a>`;
    const liste = noms.length > 1
      ? noms.slice(0, -1).map(lien).join(', ') + ' et ' + lien(noms[noms.length - 1])
      : noms.map(lien).join('');
    src = entreMarqueurs(src, '<!--CARTE:DÉBUT', '<!--CARTE:FIN -->',
      ` — DÉRIVÉ par tools/gen-seo.mjs, ne pas éditer à la main.
           La carte est un INSTRUMENT : on y suit des liens, on n'y lit pas.
           Cette ligne est le chemin qui en sort — et, contrairement au
           panneau de détail, elle est dans le HTML SERVI, donc lisible par
           un crawler qui n'exécute pas de script. -->
      <p class="carte-sortie">Chaque concept de cette carte a sa page : ${liste}.</p>
      `, file);
  }
  writeIfNeeded(file, src, file + ' (maillage du glossaire)');
}

/* --------------------------- sitemap --------------------------- */
/* ------------------- L'index de la recherche ---------------------------- *
 * oeuvres/recherche.json — lu par la recherche partagée de shell.js.
 * DÉRIVÉ, comme tout le reste : les chapitres et leur résumé (ROY_STRUCT +
 * META), les parties des Manuscrits (MAN_STRUCT), les dates (CHRONO), les
 * instruments et explorations (libellés des onglets des ateliers), les
 * notions du glossaire (après dédoublonnage), les œuvres (bibliotheque.json)
 * et les pages du site. Chaque entrée porte l'URL qui mène AU bon endroit —
 * le contrat de deep-link : #ch=, #partie=, #cahier=, #labo=, #explore=,
 * #chrono, ancre ou page de glossaire.
 * Avant (sept. 2026), l'index vivait dans shell.js et ne contenait que les
 * œuvres et leurs 76 mots-clés : « fétichisme », « 1867 » et « chapitre X »
 * ne rendaient rien, et tout résultat déposait en haut de la page de
 * l'œuvre. Mission `recherche-index`.
 * Le champ `hay` (la botte de foin) n'est jamais affiché : résumés tronqués,
 * texte nu. `rn` sert aux requêtes « chapitre X » (jeton entier), `y` aux
 * années. */
{
  const strip = (t) => decode(String(t == null ? '' : t).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const court = (t, n) => { t = strip(t); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
  const items = [];

  for (const w of biblio.works) {
    const dispo = w.status === 'available';
    items.push({ t: strip(w.title), s: [w.author, w.year].filter(Boolean).join(' · '),
      cat: dispo ? 'oeuvre' : 'a-venir', url: dispo ? hrefOf(w) : '/oeuvres/bibliotheque',
      hay: [w.shortTitle, w.description, (w.concepts || []).join(' ')].filter(Boolean).join(' ') });
  }

  const capSrc = readFileSync('oeuvres/capital-1.html', 'utf8');
  const ROY = litteralJS(capSrc, 'ROY_STRUCT=', '[');
  const META = litteralJS(capSrc, 'META=', '{');
  for (const sec of ROY) for (const [rn, titre] of sec.chaps) {
    items.push({ t: `Chapitre ${rn} — ${strip(titre)}`, s: `Le Capital · section ${sec.rn}, ${strip(sec.t)}`,
      cat: 'chapitre', rn, url: `/oeuvres/capital-1#ch=${rn}`,
      hay: `chapitre ${rn} ` + court(META[rn] && META[rn].s, 400) });
  }
  for (const e of litteralJS(capSrc, 'CHRONO=', '[')) {
    items.push({ t: `${e.year} — ${strip(e.title)}`, s: 'La chronologie du Capital' + (e.chap ? ' · ' + strip(e.chap) : ''),
      cat: 'date', y: e.year, url: '/oeuvres/capital-1#chrono', hay: court(e.desc, 300) });
  }
  const labels = (re) => [...capSrc.matchAll(re)].map((m) => [m[1], m[2]]);
  for (const [id, lab] of labels(/data-sub="(s-[a-z]+)">([^<]*)/g))
    items.push({ t: strip(lab), s: 'Le laboratoire · Le Capital', cat: 'outil', url: `/oeuvres/capital-1#labo=${id}`, hay: 'simulation modèle instrument laboratoire faire varier' });
  for (const [id, lab] of labels(/data-x="(x-[a-z]+)">([^<]*)/g))
    items.push({ t: strip(lab), s: 'Les explorations · Le Capital', cat: 'outil', url: `/oeuvres/capital-1#explore=${id}`, hay: 'exploration pièce' });
  items.push({ t: 'La chronologie du Capital', s: 'Le dossier · Le Capital', cat: 'outil', url: '/oeuvres/capital-1#chrono', hay: 'frise dates histoire accumulation primitive 1450 1867' });
  items.push({ t: "Le cheminement — l'ascension de l'abstrait au concret", s: 'Le dossier · Le Capital', cat: 'outil', url: '/oeuvres/capital-1#deriv', hay: 'déduction marches catégories dérivation' });

  const manSrc = readFileSync('oeuvres/manuscrits-1844.html', 'utf8');
  const MS = litteralJS(manSrc, 'MAN_STRUCT=', '[');
  /* Le numéro de sommaire suit MAN_FLAT : deux pièces d'ouverture, puis les
   * parties dans l'ordre des cahiers. */
  let g = 0;
  for (const [titre, hay] of [['Note du traducteur', 'Bottigelli traduction 1962'], ['Préface', 'avant-propos']]) {
    g++; items.push({ t: titre, s: 'Manuscrits de 1844 · ouverture', cat: 'partie', url: `/oeuvres/manuscrits-1844#partie=${g}`, hay });
  }
  for (const sec of MS) for (const [titre, resume] of sec.chaps) {
    g++; items.push({ t: strip(titre), s: `Manuscrits de 1844 · ${strip(sec.t)}`, cat: 'partie',
      url: `/oeuvres/manuscrits-1844#partie=${g}`, hay: court(resume, 400) });
  }
  for (const [id, lab] of Object.entries(litteralJS(manSrc, 'INSTR_LABELS=', '{')))
    items.push({ t: strip(lab), s: 'Le laboratoire · Manuscrits de 1844', cat: 'outil', url: `/oeuvres/manuscrits-1844#labo=${id}`, hay: 'instrument laboratoire manipuler' });
  for (const [id, lab] of Object.entries(litteralJS(manSrc, 'EXPLO_LABELS=', '{')))
    items.push({ t: strip(lab), s: 'Les explorations · Manuscrits de 1844', cat: 'outil', url: `/oeuvres/manuscrits-1844#explore=${id}`, hay: 'exploration pièce' });

  for (const n of INDEX_NOTIONS) {
    items.push({ t: n.nom, s: (n.de ? n.de + ' · ' : '') + n.oeuvre, cat: 'notion',
      url: n.href, hay: court(n.def, 300) });
  }

  for (const [t, s, url, hay] of [
    ['La bibliothèque', 'Toutes les œuvres, et par où commencer', '/oeuvres/bibliotheque', 'corpus livres œuvres rayons'],
    ["Le glossaire — l'abécédaire de Marx", 'Les notions, de A à Z', '/glossaire/', 'définitions concepts vocabulaire lexique'],
    ['Place publique', 'Le forum des lecteurs', '/oeuvres/place-publique', 'discussions notes partagées forum'],
    ['Le circuit du capital', 'Le jeu de la plus-value', '/jeu/', 'jeu jouer simulation chariot'],
    ['Mon carnet', 'Vos passages et vos notes', '/oeuvres/carnet', 'surlignages annotations notes'],
    ['Messages', 'Vos conversations privées', '/oeuvres/messages', 'messagerie contacts'],
    ['À propos', 'Qui tient Lire Marx, et comment', '/a-propos', 'auteur sources méthode contact'],
    ['CGU & confidentialité', 'Mentions légales et règles du site', '/mentions-legales', 'cgu rgpd confidentialité règles'],
    ['Marx à l’agrégation 2027', 'Le programme, le commentaire, l’œuvre', '/agregation-2027', 'agrégation concours programme 2027 épreuve histoire de la philosophie commentaire de texte plotin'],
  ]) items.push({ t, s, cat: 'page', url, hay });
  for (const k of COMM_META)
    items.push({ t: strip(k.titre), s: `Commentaire guidé · ${strip(k.label)}`, cat: 'page', url: k.href,
      hay: court(`commentaire de texte agrégation ${strip(k.description)}`, 300) });

  /* ── DE QUOI CHERCHER DANS LE TEXTE (mission `recherche-texte`) ──────
   * L'index sait où sont les chapitres et les notions ; il ne sait pas ce
   * que le texte DIT. Le plein texte se cherche à l'exécution — le Capital
   * par l'API de Wikisource, les Manuscrits dans les fragments que le site
   * sert déjà —, mais il faut deux choses pour SITUER un résultat, et
   * elles se dérivent ici plutôt que d'être recopiées dans shell.js :
   *   · les huit sections de Roy, pour nommer celle où la phrase se trouve ;
   *   · les cinq fragments locaux des Manuscrits, avec leur ordre — c'est
   *     lui qui donne le `#s=` du contrat de deep-link (parts[n-1]).
   * Le tableau `parts` de la page est la source : le manifeste en porte une
   * seconde copie, aux accents près, et c'est la page qui fait foi. */
  const texte = {
    'capital-1': { sections: ROY.map((sec, i) => ({ n: i + 1, rn: sec.rn, t: strip(sec.t) })) },
    'manuscrits-1844': {
      parts: litteralJS(manSrc, 'parts=', '[').map((p, i) => ({
        n: i + 1, t: strip(p.title),
        f: `/oeuvres/manuscrits-1844/textes/${String(p.file).replace(/\.html$/, '')}`
      }))
    }
  };
  if (texte['capital-1'].sections.length !== 8)
    throw new Error(`ROY_STRUCT rend ${texte['capital-1'].sections.length} sections — le Livre I en a huit.`);
  if (texte['manuscrits-1844'].parts.length < 3)
    throw new Error(`Le tableau parts des Manuscrits rend ${texte['manuscrits-1844'].parts.length} fragments.`);

  writeIfNeeded('oeuvres/recherche.json',
    JSON.stringify({ v: 2, source: 'tools/gen-seo.mjs', items, texte }) + '\n', 'oeuvres/recherche.json (index de recherche)');
}

const entries = [
  ...SITE_PAGES.map(p => ({ ...p, loc: ORIGIN + p.url })),
  /* Les pages de notion. Priorité modeste : elles comptent, mais moins que
     les œuvres et que l'abécédaire qui les rassemble. */
  ...PAGES_NOTIONS.map(p => ({ ...p, loc: ORIGIN + p.url,
    priority: '0.6', changefreq: 'monthly' })),
  /* Les pages de chapitre du Capital : même rang que les notions. */
  ...PAGES_CHAPITRES.map(p => ({ ...p, loc: ORIGIN + p.url,
    priority: '0.6', changefreq: 'monthly' })),
  /* La page-carrefour /agregation-2027 et les commentaires guidés : chacun
     porte sa priorité (le carrefour est la porte d'entrée de la saison). */
  ...PAGES_COMMENTAIRES.map(p => ({ ...p, loc: ORIGIN + p.url })),
  ...available.map(w => ({
    file: w.path, loc: ORIGIN + clean(w.path),
    priority: '0.9', changefreq: 'monthly', title: w.title
  }))
];

/* ------------------------------ /a-propos ------------------------------ *
 * La page qui dit qui tient le site. Deux blocs y sont dérivés, et pour la
 * même raison que partout ailleurs : ils affirment des faits d'édition qui
 * vivent déjà dans EDITION et dans bibliotheque.json. Une notice de sources
 * qui diverge de ce que le pied de page et les Book affirment serait pire
 * que pas de notice — c'est exactement l'erreur de l'affaire Palmier.
 * ---------------------------------------------------------------------- */
{
  const f = 'a-propos.html';
  const src = readFileSync(f, 'utf8');

  const sources = '\n' + available.map(w => {
    const e = EDITION[w.id];
    return `      <li>\n` +
      `        <b class="ap-src-t">${esc(w.title)}</b>\n` +
      `        <p class="ap-src-d">${esc(e.colophon.charAt(0).toUpperCase() + e.colophon.slice(1))}.` +
      ` <a href="${esc(e.source.url)}" rel="noopener">${esc(e.source.name)} &rsaquo;</a></p>\n` +
      `      </li>`;
  }).join('\n') + '\n    ';

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'À propos — qui tient Lire Marx, et comment',
    url: `${ORIGIN}/a-propos`,
    inLanguage: 'fr',
    isPartOf: { '@id': `${ORIGIN}/#organisation` },
    /* Le `mainEntity` est l'Organization : c'est d'ELLE que la page parle.
       L'auteur y est rattaché en `Person` — un pseudonyme reste une identité,
       et une identité stable vaut infiniment mieux qu'une page anonyme. On
       n'affirme RIEN de plus que ce que la page imprime : pas de jobTitle
       inventé, pas d'affiliation, pas de sameAs qu'on ne peut pas vérifier. */
    mainEntity: {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organisation`,
      name: 'Lire Marx',
      url: ORIGIN,
      founder: { '@type': 'Person', name: AUTEUR },
      email: 'contact@liremarx.com'
    }
  };

  let page = entreMarqueurs(src,
    '<!-- SOURCES:DÉBUT — DÉRIVÉ par tools/gen-seo.mjs, ne pas éditer à la main -->',
    '<!-- SOURCES:FIN -->', `\n    <ul class="ap-src">${sources}</ul>\n    `, f);
  page = entreMarqueurs(page,
    '<!-- A-PROPOS:LD:DÉBUT — DÉRIVÉ par tools/gen-seo.mjs, ne pas éditer à la main -->',
    '<!-- A-PROPOS:LD:FIN -->',
    `\n${OPEN}\n${JSON.stringify(ld, null, 2)}\n${CLOSE}\n`, f);
  writeIfNeeded(f, page, f + ' (sources + JSON-LD)');
}

/* Le pied de page, écrit entre ses marqueurs dans les neuf pages tenues à la
   main. Les douze pages de notion le reçoivent par leur gabarit, plus bas —
   elles sont entièrement générées, elles n'ont pas besoin de marqueurs. */
for (const f of PIED_PAGES) {
  const src = readFileSync(f, 'utf8');
  writeIfNeeded(f, entreMarqueurs(src, PIED_DEB, PIED_FIN, PIED, f), f + ' (pied de page)');
}

const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<!-- DÉRIVÉ par tools/gen-seo.mjs depuis oeuvres/bibliotheque.json.
     Ne pas éditer à la main : \`node tools/gen-seo.mjs\`.
     Les URL sont SANS extension — Cloudflare Pages sert des URL propres et
     répond 308 sur les .html. Le carnet et la messagerie sont volontairement
     absents : déconnecté, ils n'ont aucun contenu à indexer. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${lastmod(e.file)}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeIfNeeded('sitemap.xml', xml, 'sitemap.xml');

if (check) {
  if (stale.length) {
    console.error('PÉRIMÉ : ' + stale.join(', '));
    process.exit(1);
  }
  console.log('À jour : ' + [...available.map(w => w.path),
    'oeuvres/bibliotheque.html (registre)', 'index.html (FAQPage)',
    ...PIED_PAGES.map(f => f + ' (pied de page)'),
    'glossaire/index.html', ...PAGES_NOTIONS.map(p => p.file),
    'sitemap.xml'].join(', '));
} else {
  console.log(changed.length ? 'Récrit : ' + changed.join(', ') : 'Rien à faire.');
}
