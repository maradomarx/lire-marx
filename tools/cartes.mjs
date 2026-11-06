#!/usr/bin/env node
// tools/cartes.mjs — fabrique le catalogue des cartes à collectionner.
//
// Ce n'est PAS une étape de build : le site reste statique. On lance l'outil à
// la main, on commite ce qu'il écrit (cartes/catalogue.json, les images).
//
//   node tools/cartes.mjs fetch      interroge Wikidata (cache local)
//   node tools/cartes.mjs images     télécharge et convertit les images
//   node tools/cartes.mjs build      écrit cartes/catalogue.json
//   node tools/cartes.mjs tout       les trois, dans l'ordre
//   options : --refresh (ignore le cache), --max-img=N
//
// Règles, les mêmes que pour le reste du site :
//   - rien d'inventé : les faits viennent de Wikidata (CC0), les définitions
//     des notions viennent de l'abécédaire du site, le reste est écrit à la main
//     dans cartes/main.json ;
//   - l'identifiant d'une carte est STABLE (famille + QID) : regénérer le
//     catalogue ne fait perdre aucune carte à personne ;
//   - le numéro d'une carte est attribué UNE fois et tenu dans
//     cartes/numeros.json (registre qui ne fait que grandir).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = path.join(os.tmpdir(), 'liremarx-cartes');
const IMGDIR = path.join(ROOT, 'assets/img/cartes');
const OUTDIR = path.join(ROOT, 'cartes');
const UA = 'LireMarx-cartes/1.0 (https://liremarx.com/a-propos)';
const args = process.argv.slice(2);
const cmd = args.find(a => !a.startsWith('--')) || 'build';
const REFRESH = args.includes('--refresh');
const MAXIMG = +(args.find(a => a.startsWith('--max-img=')) || '=100000').split('=')[1];
fs.mkdirSync(CACHE, { recursive: true });

// ---------------------------------------------------------------------------
// Les courants : ce qui fait entrer une personne ou une organisation au jeu.
const COURANTS = {
  Q7264: 'marxisme', Q6186: 'communisme', Q7272: 'socialisme', Q6199: 'anarchisme',
  Q155059: 'léninisme', Q181133: 'trotskisme', Q167651: 'maoïsme',
  Q211930: 'marxisme-léninisme', Q206743: 'eurocommunisme',
};
const VALS = Object.keys(COURANTS).map(q => 'wd:' + q).join(' ');
// Les partis communistes au sens large (ceux dont l'idéologie déclarée est
// communiste, léniniste, trotskiste, maoïste ou marxiste-léniniste).
const VALS_PARTI = ['Q6186', 'Q155059', 'Q181133', 'Q167651', 'Q211930', 'Q7264']
  .map(q => 'wd:' + q).join(' ');

// ---------------------------------------------------------------------------
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sparql(nom, query) {
  const f = path.join(CACHE, nom + '.json');
  if (!REFRESH && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  for (let essai = 1; essai <= 6; essai++) {
    const r = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ query }),
    }).catch(e => ({ ok: false, status: 0, e }));
    if (r.ok) {
      const d = await r.json();
      const rows = d.results.bindings.map(b => Object.fromEntries(
        Object.entries(b).map(([k, v]) => [k, v.value])));
      fs.writeFileSync(f, JSON.stringify(rows));
      console.log(`  ${nom} : ${rows.length} lignes`);
      await sleep(1500);
      return rows;
    }
    const t = r.status === 429 ? 30000 : 4000 * essai;
    console.log(`  ${nom} : HTTP ${r.status}, nouvel essai dans ${t / 1000} s`);
    await sleep(t);
  }
  throw new Error('Wikidata ne répond pas : ' + nom);
}

const qid = u => u ? u.replace('http://www.wikidata.org/entity/', '') : null;
const year = d => {
  if (!d) return null;
  const m = /^(-?\d{1,4})/.exec(d.replace(/^\+/, ''));
  return m ? +m[1] : null;
};

// Deux temps, parce qu'une requête qui fait tout d'un coup dépasse le temps
// alloué par le service : d'abord la LISTE des entités (léger), puis leurs
// DÉTAILS par lots. Les libellés : français, anglais en repli.
const LABELS = `SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }`;
const FRWIKI = `?art schema:about ?x; schema:isPartOf <https://fr.wikipedia.org/>.`;

async function ids(nom, where, lim, ordre = true) {
  const rows = await sparql('ids-' + nom, `SELECT DISTINCT ?x ?sl WHERE { ${where}
    ?x wikibase:sitelinks ?sl. ${FRWIKI} }` + (ordre ? ` ORDER BY DESC(?sl) LIMIT ${lim}` : ''));
  if (ordre) return rows.map(r => qid(r.x));
  // Sans tri côté service (trop lent sur un grand ensemble) : on trie ici.
  return rows.sort((a, b) => b.sl - a.sl).slice(0, lim).map(r => qid(r.x));
}

async function details(nom, liste, tmpl, lot = 200) {
  const f = path.join(CACHE, nom + '.json');
  if (!REFRESH && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const out = [];
  for (let i = 0; i < liste.length; i += lot) {
    const vals = liste.slice(i, i + lot).map(q => 'wd:' + q).join(' ');
    out.push(...await sparql(nom + '-' + (i / lot), tmpl(vals)));
  }
  fs.writeFileSync(f, JSON.stringify(out));
  return out;
}

const tPers = v => `SELECT ?p ?pLabel ?pDescription ?sl (SAMPLE(?dfr) AS ?descFr)
    (SAMPLE(?n) AS ?naiss) (SAMPLE(?m) AS ?mort) (SAMPLE(?img) AS ?image)
    (SAMPLE(?paysL) AS ?pays) (SAMPLE(?lnL) AS ?lieuN)
    (GROUP_CONCAT(DISTINCT ?occL; separator="|") AS ?occs)
    (GROUP_CONCAT(DISTINCT ?ideoQ; separator="|") AS ?ideos)
  WHERE { VALUES ?p { ${v} } ?p wikibase:sitelinks ?sl.
    OPTIONAL { ?p wdt:P569 ?n } OPTIONAL { ?p wdt:P570 ?m } OPTIONAL { ?p wdt:P18 ?img }
    OPTIONAL { ?p wdt:P27 ?pa. ?pa rdfs:label ?paysL. FILTER(LANG(?paysL)="fr") }
    OPTIONAL { ?p wdt:P19 ?ln. ?ln rdfs:label ?lnL. FILTER(LANG(?lnL)="fr") }
    OPTIONAL { ?p wdt:P106 ?oc. ?oc rdfs:label ?occL. FILTER(LANG(?occL)="fr") }
    OPTIONAL { ?p wdt:P1142 ?ideoQ }
    OPTIONAL { ?p schema:description ?dfr. FILTER(LANG(?dfr) = "fr") }
    ${LABELS} } GROUP BY ?p ?pLabel ?pDescription ?sl`;

const tOrg = v => `SELECT ?o ?oLabel ?oDescription ?sl (SAMPLE(?dfr) AS ?descFr)
    (SAMPLE(?d) AS ?debut) (SAMPLE(?f) AS ?fin) (SAMPLE(?img) AS ?image) (SAMPLE(?logo) AS ?logo1)
    (SAMPLE(?paysL) AS ?pays) (GROUP_CONCAT(DISTINCT ?typeL; separator="|") AS ?types)
    (GROUP_CONCAT(DISTINCT ?ideoQ; separator="|") AS ?ideos)
  WHERE { VALUES ?o { ${v} } ?o wikibase:sitelinks ?sl.
    OPTIONAL { ?o wdt:P571 ?d } OPTIONAL { ?o wdt:P576 ?f }
    OPTIONAL { ?o wdt:P18 ?img } OPTIONAL { ?o wdt:P154 ?logo }
    OPTIONAL { ?o wdt:P17 ?pa. ?pa rdfs:label ?paysL. FILTER(LANG(?paysL)="fr") }
    OPTIONAL { ?o wdt:P31 ?ty. ?ty rdfs:label ?typeL. FILTER(LANG(?typeL)="fr") }
    OPTIONAL { ?o wdt:P1142 ?ideoQ }
    OPTIONAL { ?o schema:description ?dfr. FILTER(LANG(?dfr) = "fr") }
    ${LABELS} } GROUP BY ?o ?oLabel ?oDescription ?sl`;

const tEvt = v => `SELECT ?e ?eLabel ?eDescription ?sl (SAMPLE(?dfr) AS ?descFr)
    (SAMPLE(?d) AS ?date) (SAMPLE(?d1) AS ?debut) (SAMPLE(?d2) AS ?fin)
    (SAMPLE(?img) AS ?image) (SAMPLE(?paysL) AS ?pays) (SAMPLE(?lieuL) AS ?lieu)
  WHERE { VALUES ?e { ${v} } ?e wikibase:sitelinks ?sl.
    OPTIONAL { ?e wdt:P585 ?d } OPTIONAL { ?e wdt:P580 ?d1 } OPTIONAL { ?e wdt:P582 ?d2 }
    OPTIONAL { ?e wdt:P18 ?img }
    OPTIONAL { ?e wdt:P17 ?pa. ?pa rdfs:label ?paysL. FILTER(LANG(?paysL)="fr") }
    OPTIONAL { ?e wdt:P276 ?li. ?li rdfs:label ?lieuL. FILTER(LANG(?lieuL)="fr") }
    OPTIONAL { ?e schema:description ?dfr. FILTER(LANG(?dfr) = "fr") }
    ${LABELS} } GROUP BY ?e ?eLabel ?eDescription ?sl`;

const tOeu = v => `SELECT ?w ?wLabel ?wDescription ?sl (SAMPLE(?dfr) AS ?descFr)
    (SAMPLE(?d) AS ?date) (SAMPLE(?img) AS ?image) (SAMPLE(?auL) AS ?auteur) (SAMPLE(?au) AS ?auQ)
    (SAMPLE(?langL) AS ?langue) (GROUP_CONCAT(DISTINCT ?typeL; separator="|") AS ?types)
  WHERE { VALUES ?w { ${v} } ?w wikibase:sitelinks ?sl.
    OPTIONAL { ?w wdt:P577 ?d } OPTIONAL { ?w wdt:P18 ?img }
    OPTIONAL { ?w wdt:P50 ?au. ?au rdfs:label ?auL. FILTER(LANG(?auL)="fr") }
    OPTIONAL { ?w wdt:P407 ?la. ?la rdfs:label ?langL. FILTER(LANG(?langL)="fr") }
    OPTIONAL { ?w wdt:P31 ?ty. ?ty rdfs:label ?typeL. FILTER(LANG(?typeL)="fr") }
    OPTIONAL { ?w schema:description ?dfr. FILTER(LANG(?dfr) = "fr") }
    ${LABELS} } GROUP BY ?w ?wLabel ?wDescription ?sl`;

// Les classes d'événements, une à la fois : la fermeture transitive sur
// plusieurs classes d'un coup dépasse le temps alloué.
// (« coup d'État » et « insurrection » ont été essayés : leurs identifiants
// ramenaient des attentats, des accidents d'avion et des conquêtes.)
const CLASSES = { Q10931: 'révolution', Q124734: 'rébellion', Q49776: 'grève',
  Q49775: 'grève générale', Q3199915: 'massacre' };
// Pour les rébellions et les massacres, seuls ceux qui touchent au mouvement
// ouvrier, paysan ou révolutionnaire entrent au jeu.
const SPORT = /olympi|coupe du monde|championnat|mètres|match|tournoi|grand prix|marathon|finale|ligue des champions/i;
const PERTINENT = /ouvri|grév|grève|commun|socialis|anarch|révolution|soviét|bolch|prolétar|paysan|syndic|travaill|manifest|canut|chartis|insurg|insurrect|mutin|répression|esclav|rouge|marx|lénin|trotsk|mao|guérill|colonial|indépendance|strike|worker|labou?r|miner|peasant|uprising|revolt/i;

async function fetchTout() {
  console.log('Wikidata — personnes');
  const H = `?x wdt:P31 wd:Q5.`;
  const p1 = await ids('pers-ideo', `VALUES ?i { ${VALS} } { ?x wdt:P1142 ?i } UNION { ?x wdt:P135 ?i } ${H}`, 3000);
  await details('pers-ideo', p1, tPers);
  // Les militants : d'abord les partis, puis leurs membres, quarante partis à
  // la fois — d'un seul tenant, la requête dépasse le délai du service.
  const partis = await ids('partis', `VALUES ?i { ${VALS_PARTI} } ?x wdt:P1142 ?i. FILTER NOT EXISTS { ?x wdt:P31 wd:Q5 }`, 3000, false);
  const membres = new Map();
  for (let i = 0; i < partis.length; i += 40) {
    const lot = partis.slice(i, i + 40).map(q => 'wd:' + q).join(' ');
    const rows = await sparql('ids-membres-' + (i / 40), `SELECT DISTINCT ?x ?sl WHERE { VALUES ?party { ${lot} }
      ?x wdt:P102 ?party; wdt:P31 wd:Q5; wikibase:sitelinks ?sl. ${FRWIKI} }`);
    for (const r of rows) membres.set(qid(r.x), +r.sl);
  }
  const p2 = [...membres].sort((a, b) => b[1] - a[1]).slice(0, 3500).map(x => x[0]);
  await details('pers-parti', p2.filter(q => !p1.includes(q)), tPers);
  const p3 = await ids('pers-influence', `{ ?x wdt:P737 wd:Q9061 } UNION { wd:Q9061 wdt:P737 ?x } UNION { ?x wdt:P737 wd:Q34787 } ${H}`, 1000);
  await details('pers-influence', p3.filter(q => !p1.includes(q) && !p2.includes(q)), tPers);

  console.log('Wikidata — organisations');
  const o = await ids('orgs', `VALUES ?i { ${VALS} } ?x wdt:P1142 ?i. FILTER NOT EXISTS { ?x wdt:P31 wd:Q5 }`, 2000);
  await details('orgs', o, tOrg);

  console.log('Wikidata — événements');
  for (const c of Object.keys(CLASSES)) {
    const e = await ids('evt-' + c, `?x wdt:P31/wdt:P279* wd:${c}.`, 2500).catch(() => []);
    await details('evt-' + c, e, tEvt);
  }

  // Les événements auxquels les huit cents figures les plus connues ont pris part.
  const figs = ['pers-ideo', 'pers-parti', 'pers-influence'].flatMap(cache)
    .sort((a, b) => b.sl - a.sl).slice(0, 800).map(r => qid(r.p));
  const part = new Set();
  for (let i = 0; i < figs.length; i += 100) {
    const lot = figs.slice(i, i + 100).map(q => 'wd:' + q).join(' ');
    for (const r of await sparql('ids-part-' + (i / 100), `SELECT DISTINCT ?x WHERE { VALUES ?p { ${lot} }
      ?p wdt:P1344 ?x. ${FRWIKI} FILTER NOT EXISTS { ?x wdt:P31 wd:Q5 } }`)) part.add(qid(r.x));
  }
  await details('evt-part', [...part], tEvt);

  // Les dates clés, choisies à la main et désignées par leur article.
  const main = lireJSON(path.join(OUTDIR, 'main.json'), {});
  const cles = await resoudre(main.dates || [], 'dates');
  fs.writeFileSync(path.join(CACHE, 'dates-cles.json'), JSON.stringify(cles));
  await details('evt-cles', cles, tEvt, 100);

  // Les ajouts : les classiques que les filtres automatiques ne ramènent pas
  // (Wikidata ne donne de courant ni à Jaurès, ni à Brecht, ni à Allende).
  const aj = main.ajouts || {};
  if (aj.fig) await details('ajouts-fig', await resoudre(aj.fig, 'figures'), tPers, 100);
  if (aj.oeu) await details('ajouts-oeu', await resoudre(aj.oeu, 'œuvres'), tOeu, 100);
  if (aj.org) await details('ajouts-org', await resoudre(aj.org, 'organisations'), tOrg, 100);
}

// Un titre d'article de la Wikipédia française → son entité Wikidata.
async function resoudre(titres, quoi) {
  const trouves = [];
  for (let i = 0; i < titres.length; i += 50) {
    const u = 'https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities',
      sites: 'frwiki', titles: titres.slice(i, i + 50).join('|'), props: 'sitelinks', sitefilter: 'frwiki', format: 'json' });
    const d = await (await fetch(u, { headers: { 'User-Agent': UA } })).json();
    for (const [q, e] of Object.entries(d.entities || {})) if (!q.startsWith('-')) trouves.push([q, e.sitelinks?.frwiki?.title]);
    await sleep(500);
  }
  const vus = new Set(trouves.map(t => t[1]));
  const manquent = titres.filter(t => !vus.has(t));
  if (manquent.length) console.log(`  ${quoi} introuvables : ` + manquent.join(' ; '));
  return trouves.map(t => t[0]);
}

// Les œuvres se cherchent APRÈS les personnes : on prend les auteurs de la
// collection les plus connus, et leurs écrits qui ont un article en français.
const GENRES = {
  ecrit: /œuvre écrite|œuvre littéraire|livre|essai|article|étude|roman|poème|poésie|pamphlet|recueil|pièce de théâtre|traité|discours|lettre|mémoires|autobiographie|nouvelle|manifeste|ouvrage|publication|texte|hymne|chanson/,
  art: /peinture|tableau|sculpture|affiche|œuvre d'art|photographie|fresque|dessin|monument|mosaïque|gravure|statue/,
  film: /film|documentaire|série/,
  musique: /symphonie|opéra|ballet|concerto|composition|œuvre musicale|chanson|hymne|quatuor|sonate|cantate|oratorio|marche|suite/,
};
// Une œuvre, au sens du jeu : un livre, un film, un tableau, une musique —
// tout ce dont l'auteur, le créateur, le réalisateur ou le compositeur est une
// figure de la collection.
async function fetchOeuvres(auteurs) {
  console.log('Wikidata — œuvres');
  const auteurDe = new Map();
  for (let i = 0; i < auteurs.length; i += 50) {
    const lot = auteurs.slice(i, i + 50).map(q => 'wd:' + q).join(' ');
    for (const [prop, pr] of [['P50', 'ecrit'], ['P170', 'art'], ['P57', 'film'], ['P86', 'musique']]) {
      const rows = await sparql(`ids-oeu-${pr}-${i / 50}`, `SELECT DISTINCT ?x ?au WHERE { VALUES ?au { ${lot} }
        ?x wdt:${prop} ?au. ${FRWIKI} }`);
      for (const r of rows) if (!auteurDe.has(qid(r.x))) auteurDe.set(qid(r.x), [qid(r.au), pr]);
    }
  }
  const rows = await details('oeu', [...auteurDe.keys()], tOeu);
  // Chaque lien n'admet que son genre : un compositeur fait entrer une
  // symphonie, pas le film qui l'a reprise ; un « créateur », un tableau, pas
  // une doctrine ni une subdivision administrative.
  return rows.filter(r => {
    const [, pr] = auteurDe.get(qid(r.w)) || [];
    const t = (r.types || '').toLowerCase();
    return (GENRES[pr] || /^$/).test(t);
  }).map(r => Object.assign(r, { auQ: auteurDe.get(qid(r.w))[0], genre: auteurDe.get(qid(r.w))[1] }));
}

// ---------------------------------------------------------------------------
// Mise en forme.

const clean = s => (s || '').replace(/\s+/g, ' ').trim();
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
// Wikidata rend « Q12345 » quand un libellé n'existe dans aucune des langues
// demandées : une telle entité ne fait pas une carte lisible.
const lisible = s => s && !/^Q\d+$/.test(s);
const lst = s => (s || '').split('|').map(clean).filter(Boolean);

// Une description Wikidata est faite pour départager des homonymes, pas pour
// être lue : on écarte celles qui ne disent rien.
function desc(s) {
  s = clean(s);
  if (!s || /^(page d'homonymie|article|élément|wikimedia)/i.test(s)) return '';
  return cap(s);
}

function pers(r, src) {
  const q = qid(r.p);
  const n = year(r.naiss), m = year(r.mort);
  return {
    id: 'fig-' + q, q, f: 'fig', n: cap(clean(r.pLabel)), d: desc(r.descFr),
    a: n, b: m, pays: clean(r.pays), lieu: clean(r.lieuN),
    occ: lst(r.occs).slice(0, 3), cour: lst(r.ideos).map(qid).filter(x => COURANTS[x]).map(x => COURANTS[x]),
    img: r.image || null, sl: +r.sl, src,
  };
}

function lireJSON(f, def) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } }
function cache(nom) { return lireJSON(path.join(CACHE, nom + '.json'), []); }

function personnes() {
  const m = new Map();
  for (const [nom, src] of [['ajouts-fig', 'main'], ['pers-ideo', 'ideo'], ['pers-influence', 'infl'], ['pers-parti', 'parti']])
    for (const r of cache(nom)) {
      const c = pers(r, src);
      if (!lisible(c.n) || m.has(c.id)) continue;
      if (!c.d && (!c.a || !c.occ.length)) continue;
      m.set(c.id, c);
    }
  return [...m.values()];
}

function organisations() {
  return [...cache('ajouts-org'), ...cache('orgs')].map(r => {
    const q = qid(r.o);
    const types = lst(r.types);
    return {
      id: 'org-' + q, q, f: 'org', n: cap(clean(r.oLabel)), d: desc(r.descFr),
      a: year(r.debut), b: year(r.fin), pays: clean(r.pays), types: types.slice(0, 2),
      cour: lst(r.ideos).map(qid).filter(x => COURANTS[x]).map(x => COURANTS[x]),
      img: r.logo1 || r.image || null, sl: +r.sl,
    };
  }).filter(c => lisible(c.n));
}

function evenements() {
  const m = new Map();
  const cles = new Set(lireJSON(path.join(CACHE, 'dates-cles.json'), []));
  for (const classe of ['cles', ...Object.keys(CLASSES), 'part']) {
    for (const r of cache('evt-' + classe)) {
      const q = qid(r.e);
      if (m.has('evt-' + q)) continue;
      const a = year(r.date) ?? year(r.debut);
      const cle = cles.has(q);
      // Le jeu couvre l'âge du capitalisme industriel : de la Révolution
      // française à nos jours. Avant, on garde seulement ce qu'on a choisi.
      if (!cle && (a == null || a < 1789)) continue;
      if (!cle && SPORT.test(clean(r.eLabel))) continue;
      if (!cle && (classe === 'Q124734' || classe === 'Q3199915' || classe === 'part') &&
          !PERTINENT.test(clean(r.eLabel) + ' ' + clean(r.eDescription))) continue;
      m.set('evt-' + q, {
        id: 'evt-' + q, q, f: 'evt', n: cap(clean(r.eLabel)), d: desc(r.descFr),
        a, b: year(r.fin), pays: clean(r.pays), lieu: clean(r.lieu), classe: cle ? 'date clé' : CLASSES[classe] || 'participation', cle,
        img: r.image || null, sl: +r.sl,
      });
    }
  }
  return [...m.values()].filter(c => lisible(c.n));
}

// ---------------------------------------------------------------------------
// Les images : la vignette Commons, réduite et convertie en WebP.

async function commonsMeta(fichiers) {
  const f = path.join(CACHE, 'commons-meta.json');
  const meta = lireJSON(f, {});
  const manque = fichiers.filter(x => !(x in meta));
  for (let i = 0; i < manque.length; i += 50) {
    const lot = manque.slice(i, i + 50);
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'extmetadata|size',
      titles: lot.map(x => 'File:' + x).join('|'),
    });
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (!r.ok) { await sleep(5000); i -= 50; continue; }
    const d = await r.json();
    const norm = Object.fromEntries((d.query.normalized || []).map(x => [x.to, x.from]));
    for (const p of Object.values(d.query.pages || {})) {
      const titre = norm[p.title] || p.title;
      const nom = titre.replace(/^File:/, '');
      const em = p.imageinfo?.[0]?.extmetadata || {};
      const txt = k => clean((em[k]?.value || '').replace(/<[^>]+>/g, ' '));
      // « Unknown author Unknown author » : Commons répète la mention, en anglais.
      const aut = txt('Artist').replace(/(unknown author|unknown|anonymous|anonyme|auteur inconnu)(\s+\1)*/gi, 'auteur inconnu')
        .replace(/(auteur inconnu\s*)+/g, 'auteur inconnu ').trim().slice(0, 80);
      meta[nom] = { lic: txt('LicenseShortName').replace(/^Public domain$/i, 'domaine public'), aut };
    }
    for (const x of lot) if (!(x in meta)) meta[x] = { lic: '', aut: '' };
    fs.writeFileSync(f, JSON.stringify(meta));
    process.stdout.write(`\r  licences : ${Math.min(i + 50, manque.length)} / ${manque.length}`);
    await sleep(400);
  }
  if (manque.length) process.stdout.write('\n');
  return meta;
}

const nomCommons = u => decodeURIComponent(u.replace(/^.*Special:FilePath\//, '')).replace(/_/g, ' ');

async function images(cartes) {
  fs.mkdirSync(IMGDIR, { recursive: true });
  let avec = cartes.filter(c => c.img);
  // --echantillon : quelques images par époque × rang × famille, pour juger
  // le design avant de tout télécharger.
  if (args.includes('--echantillon')) {
    const vu = {};
    avec = avec.filter(c => { const k = c.e + c.r + c.f; vu[k] = (vu[k] || 0) + 1; return vu[k] <= 3; });
  }
  const IDS = (args.find(a => a.startsWith('--ids=')) || '').slice(6);
  if (IDS) avec = avec.filter(c => IDS.split(',').includes(c.id));
  avec = avec.slice(0, MAXIMG);
  let fait = 0, deja = 0, rate = 0;
  // Quatre téléchargements à la fois : poli pour Commons, quatre fois plus
  // rapide qu'à la file (4 500 images).
  async function une(c) {
    const dest = path.join(IMGDIR, c.id + '.webp');
    if (fs.existsSync(dest)) { deja++; return; }
    const src = c.img.replace(/^http:/, 'https:') + '?width=420';
    const tmp = path.join(CACHE, 'tmp-' + c.id);
    try {
      const r = await fetch(src, { headers: { 'User-Agent': UA } });
      if (r.status === 429) { await sleep(20000); throw new Error('429'); }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
      // ffmpeg normalise d'abord (cwebp ne lit ni le GIF ni le TIFF).
      const png = tmp + '.png';
      execFileSync('ffmpeg', ['-v', 'quiet', '-y', '-i', tmp, '-vf', 'scale=320:-2', '-frames:v', '1', png]);
      execFileSync('cwebp', ['-quiet', '-q', '62', '-m', '6', png, '-o', dest]);
      fs.rmSync(png, { force: true });
      fait++;
    } catch (e) { rate++; }
    fs.rmSync(tmp, { force: true });
    if ((fait + rate) % 20 === 0) process.stdout.write(`\r  images : ${fait} neuves, ${deja} déjà là, ${rate} ratées`);
    await sleep(150);
  }
  let i = 0;
  await Promise.all([0, 1, 2, 3].map(async () => { while (i < avec.length) await une(avec[i++]); }));
  process.stdout.write(`\r  images : ${fait} neuves, ${deja} déjà là, ${rate} ratées\n`);
}

// ---------------------------------------------------------------------------
// La rareté, l'époque, le numéro.

// Cinq rangs, nommés comme des états d'un même imprimé : du tract qui passe de
// main en main au manuscrit dont il n'existe qu'un exemplaire.
export const RANGS = ['tract', 'brochure', 'reliure', 'originale', 'manuscrit'];
// Part de chaque rang DANS une famille : le classement suit la notoriété
// (nombre de Wikipédias qui ont un article), donc les figures que tout le monde
// connaît sont les plus rares à tirer.
// Le classement automatique s'arrête à l'ÉDITION ORIGINALE : le manuscrit est
// une liste fermée, choisie à la main (cartes/main.json, « legendaires »), une
// soixantaine de classiques. La notoriété seule y faisait entrer Medvedev.
const SEUILS = [0, 0.04, 0.15, 0.40]; // manuscrit (aucun), originale, reliure, brochure

function rangs(liste) {
  const tri = [...liste].sort((x, y) => (y.sl || 0) - (x.sl || 0));
  tri.forEach((c, i) => {
    const p = i / tri.length;
    c.r = p < SEUILS[0] ? 4 : p < SEUILS[1] ? 3 : p < SEUILS[2] ? 2 : p < SEUILS[3] ? 1 : 0;
  });
}

// L'époque d'une carte commande son style. Une personne se date par le
// milieu de sa vie active, le reste par sa date propre.
export function epoque(c) {
  let y = c.f === 'fig' ? (c.a != null ? c.a + 35 : c.b) : c.a;
  if (y == null) return 'contemporain';
  if (y < 1848) return 'gravure';
  if (y < 1917) return 'internationale';
  if (y < 1940) return 'constructivisme';
  if (y < 1968) return 'affiche';
  if (y < 1992) return 'serigraphie';
  return 'contemporain';
}

function numeros(cartes) {
  const f = path.join(OUTDIR, 'numeros.json');
  const reg = lireJSON(f, { prochain: 1, n: {} });
  // Les nouvelles cartes reçoivent les numéros suivants, par famille puis par
  // date : le registre ne renumérote jamais une carte existante.
  const neuves = cartes.filter(c => !reg.n[c.id]).sort((x, y) =>
    x.f.localeCompare(y.f) || (x.a ?? 9999) - (y.a ?? 9999) || x.n.localeCompare(y.n, 'fr'));
  for (const c of neuves) reg.n[c.id] = reg.prochain++;
  fs.writeFileSync(f, JSON.stringify(reg, null, 0));
  for (const c of cartes) c.no = reg.n[c.id];
}

// Les notions viennent de l'abécédaire tel qu'il est servi : c'est la source
// qui fait foi, et elle est déjà dérivée par gen-seo.
function notions() {
  const html = fs.readFileSync(path.join(ROOT, 'glossaire/index.html'), 'utf8');
  const out = [];
  const re = /<div class="gl-terme" id="([^"]+)">([\s\S]*?)<\/dd>\s*<\/div>/g;
  let m;
  const ent = s => s.replace(/&nbsp;/g, ' ').replace(/&#8209;/g, '‑').replace(/&prime;/g, '′')
    .replace(/&#39;|&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  const txt = s => clean(ent(s.replace(/<[^>]+>/g, ' ')));
  while ((m = re.exec(html))) {
    const [, ancre, corps] = m;
    const dt = /<dt class="gl-t">([\s\S]*?)<\/dt>/.exec(corps);
    if (!dt) continue;
    const de = /<span class="gl-de"[^>]*>([\s\S]*?)<\/span>/.exec(dt[1]);
    const t = dt[1].replace(/<span class="gl-de"[\s\S]*?<\/span>/, '');
    const lien = /href="([^"]+)"/.exec(t);
    const dd = /<dd class="gl-d">([\s\S]*)$/.exec(corps)[1];
    const fo = /<span class="gl-f">([\s\S]*?)<\/span>/.exec(dd);
    const src = /<span class="gl-src">([\s\S]*?)<\/span>/.exec(dd);
    const def = dd.replace(/<span class="gl-(?:f|src)">[\s\S]*?<\/span>/g, '');
    out.push({
      id: 'not-' + ancre, f: 'not', n: txt(t), de: de ? txt(de[1]) : '', d: txt(def),
      fo: fo ? txt(fo[1]) : '', oeuvre: src ? txt(src[1]) : '',
      href: lien ? lien[1] : '/glossaire/#' + ancre, img: null,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------

async function build() {
  const main = lireJSON(path.join(OUTDIR, 'main.json'), { cartes: [], exclure: [], rang: {} });
  const fig = personnes(), org = organisations(), evt = evenements();
  const not = notions();
  // Les œuvres : celles des trois cents figures les plus connues de la collection.
  // Les auteurs : les figures dont le courant déclaré est marxiste au sens
  // large, ou qui ont appartenu à un parti communiste. (Les socialistes au sens
  // général, Orwell ou Wells, y faisaient entrer leurs romans.)
  const COMMU = new Set(['marxisme', 'communisme', 'léninisme', 'trotskisme', 'maoïsme', 'marxisme-léninisme', 'eurocommunisme']);
  const auteurs = fig.filter(c => c.src === 'parti' || c.cour.some(x => COMMU.has(x)) || ['Q9061', 'Q34787'].includes(c.q))
    .sort((x, y) => y.sl - x.sl).slice(0, 600).map(c => c.q);
  const nomFig = new Map(fig.map(c => [c.q, c.n]));
  const oeu = [...cache('ajouts-oeu'), ...await fetchOeuvres(auteurs)].map(r => ({
    id: 'oeu-' + qid(r.w), q: qid(r.w), f: 'oeu', n: cap(clean(r.wLabel)), d: desc(r.descFr),
    a: year(r.date), auteur: nomFig.get(r.auQ) || clean(r.auteur), auQ: r.auQ, langue: clean(r.langue),
    types: lst(r.types).slice(0, 2), genre: r.genre, img: r.image || null, sl: +r.sl,
  })).filter(c => lisible(c.n) && !/^(Q\d+)$/.test(c.n));

  const ex = new Set(main.exclure || []);
  // Une même entité n'a qu'une carte : une date clé qui désigne en fait une
  // organisation (l'Internationale communiste) ou une œuvre reste dans sa famille.
  const ailleurs = new Set([...org, ...oeu, ...fig].map(c => c.q));
  for (let i = evt.length - 1; i >= 0; i--) if (ailleurs.has(evt[i].q)) evt.splice(i, 1);
  for (let i = oeu.length - 1; i >= 0; i--) if (org.some(o => o.q === oeu[i].q)) oeu.splice(i, 1);
  const familles = { fig, org, evt, oeu };
  for (const k in familles) {
    familles[k] = [...new Map(familles[k].filter(c => !ex.has(c.id)).map(c => [c.id, c])).values()];
    rangs(familles[k]);
  }
  // Les notions : leur rang vient du lexique (une page = plus rare).
  for (const c of familles.evt) if (c.cle) c.r = Math.max(c.r, 2);
  for (const c of not) c.r = c.href.startsWith('/glossaire/') && !c.href.includes('#') ? 2 : 1;

  let toutes = [...familles.fig, ...familles.org, ...familles.evt, ...familles.oeu, ...not, ...(main.cartes || [])];
  for (const [id, r] of Object.entries(main.rang || {})) {
    const c = toutes.find(x => x.id === id); if (c) c.r = r;
  }
  const absents = [];
  for (const nom of main.legendaires || []) {
    const [, f, n] = /^(?:(fig|org|evt|oeu|not):)?(.*)$/.exec(nom);
    const c = toutes.filter(x => x.n === n && (!f || x.f === f));
    if (c.length !== 1) { absents.push(nom + (c.length ? ' (ambigu)' : '')); continue; }
    c[0].r = 4;
  }
  if (absents.length) console.log('  manuscrits introuvables : ' + absents.join(' ; '));
  const ANS = [[/Manuscrits/, 1844], [/Manifeste/, 1848], [/brumaire/i, 1852], [/Contribution/, 1859], [/Salaires/, 1865], [/Capital/, 1867]];
  for (const c of not) { const x = ANS.find(([re]) => re.test(c.oeuvre || '')); c.an = x ? x[1] : 1867; }
  const figQ = new Map(familles.fig.map(c => [c.q, c]));
  for (const c of familles.oeu) if (c.a == null && figQ.has(c.auQ)) c.aAuteur = figQ.get(c.auQ).a;
  for (const c of toutes) {
    c.e = c.f === 'oeu' && c.a == null ? epoque({ f: 'fig', a: c.aAuteur }) : c.f === 'not' ? epoque({ f: 'oeu', a: c.an }) : epoque(c);
    if (c.img && !fs.existsSync(path.join(IMGDIR, c.id + '.webp'))) c.imgSrc = c.img; // pas encore téléchargée
  }
  if (cmd === 'images' || cmd === 'tout') await images(toutes);
  const meta = await commonsMeta(toutes.filter(c => c.img).map(c => nomCommons(c.img)));

  numeros(toutes);
  const sortie = toutes.map(c => {
    const aImg = fs.existsSync(path.join(IMGDIR, c.id + '.webp'));
    const m0 = c.img ? meta[nomCommons(c.img)] || {} : {};
    const m = { lic: (m0.lic || '').replace(/^Public domain$/i, 'domaine public'),
      aut: (m0.aut || '').replace(/(unknown author|unknown|anonymous|anonyme|auteur inconnu)(\s+\1)*/gi, 'auteur inconnu').replace(/(auteur inconnu\s*)+/g, 'auteur inconnu ').trim() };
    const o = { id: c.id, no: c.no, f: c.f, r: c.r, e: c.e, n: c.n };
    for (const k of ['d', 'de', 'fo', 'oeuvre', 'a', 'b', 'pays', 'lieu', 'auteur', 'langue', 'href', 'q'])
      if (c[k] != null && c[k] !== '') o[k] = c[k];
    if (c.occ?.length) o.occ = c.occ;
    if (c.cour?.length) o.cour = [...new Set(c.cour)];
    if (c.types?.length) o.types = c.types;
    if (c.classe) o.classe = c.classe;
    if (c.genre) o.g = c.genre;
    if (aImg) { o.i = 1; o.cr = [m.aut, m.lic].filter(Boolean).join(' · '); }
    return o;
  }).sort((x, y) => x.no - y.no);

  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(path.join(OUTDIR, 'catalogue.json'),
    JSON.stringify({ v: 1, n: sortie.length, rangs: RANGS, cartes: sortie }));
  // Le serveur ne connaît que l'identifiant et le rang : c'est assez pour
  // tirer. Une carte retirée du catalogue est DÉSACTIVÉE, jamais effacée —
  // ceux qui l'ont déjà la gardent.
  const vals = sortie.map(c => `('${c.id.replace(/'/g, "''")}',${c.r})`);
  let sql = '-- Écrit par tools/cartes.mjs — ne pas éditer à la main.\n' +
    '-- À rejouer dans Supabase après chaque regénération du catalogue.\nbegin;\n';
  for (let i = 0; i < vals.length; i += 1000)
    sql += 'insert into public.cartes_catalogue (id, r) values\n' + vals.slice(i, i + 1000).join(',\n') +
      '\non conflict (id) do update set r = excluded.r, actif = true;\n';
  sql += 'update public.cartes_catalogue set actif = false where id not in (' +
    sortie.map(c => `'${c.id.replace(/'/g, "''")}'`).join(',') + ');\ncommit;\n';
  fs.writeFileSync(path.join(ROOT, 'supabase/cartes-catalogue.sql'), sql);
  const cpt = k => sortie.filter(c => c.f === k).length;
  const ci = sortie.filter(c => c.i).length;
  console.log(`catalogue : ${sortie.length} cartes — figures ${cpt('fig')}, organisations ${cpt('org')}, événements ${cpt('evt')}, œuvres ${cpt('oeu')}, notions ${cpt('not')} ; ${ci} avec image`);
  for (let r = 0; r < 5; r++) console.log(`  ${RANGS[r]} : ${sortie.filter(c => c.r === r).length}`);
}

if (cmd === 'fetch' || cmd === 'tout') await fetchTout();
if (cmd === 'build' || cmd === 'images' || cmd === 'tout') await build();
