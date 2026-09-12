// tools/verif-citations.mjs — LES CITATIONS MÈNENT-ELLES VRAIMENT AU PASSAGE ?
//
// Comme gen-seo.mjs et capture-monde.mjs : PAS une étape de build, un outil
// de dépôt. Le site reste statique ; on le lance à la main.
//
//   node tools/verif-citations.mjs            # vérifie tout
//   node tools/verif-citations.mjs X XII      # ne vérifie que ces chapitres
//   node tools/verif-citations.mjs --refresh  # redemande les sections à Wikisource
//
// CE QU'IL VÉRIFIE, et pourquoi il faut un outil pour ça. Un data-q est une
// PROMESSE : le lien #s=N&q=… ouvre la liseuse et lui demande de retrouver
// la phrase. Or locate() fait un indexOf EXACT sur le texte du conteneur,
// sans normaliser quoi que ce soit — une apostrophe droite là où Roy imprime
// une apostrophe typographique, un trait d'union ordinaire là où le texte
// porte un insécable (U+2011), une espace avalée à une frontière d'italique,
// et le lecteur reçoit « passage introuvable » sur une page qui affirme le
// contraire.
//
// D'où la seule mesure qui vaille : le texte tel que LA LISEUSE le compose.
// On le fabrique par le chemin de la liseuse — l'API de Wikisource, puis
// cleanWS recopié de capital-1.html, puis textContent — dans un vrai Chrome,
// parce que cleanWS a besoin d'un DOMParser. Le résultat est mis en cache
// dans le dossier temporaire du système : les huit sections font un mégaoctet
// et ne changent pas d'une séance à l'autre.
//
// Il signale aussi les citations qu'une page de chapitre partagerait avec une
// page-monde du glossaire. Ce n'est pas une faute en soi — le chapitre X et
// /glossaire/surtravail citent tous deux « Le capital n'a point inventé le
// surtravail », et les deux ont raison — mais c'est une décision, pas un
// accident : deux pages du site qui citent la même phrase doivent en dire
// deux choses différentes.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SITE = path.resolve(import.meta.dirname, '..');
const JEU = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CACHE = path.join(os.tmpdir(), 'lire-marx-sections');
const CHAP_DIR = path.join(SITE, 'oeuvres/capital-1/chapitres');
const MONDES = path.join(SITE, 'glossaire/mondes');
const die = (m) => { console.error('\n✗ ' + m + '\n'); process.exit(1); };

const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const seuls = args.filter((a) => !a.startsWith('--')).map((s) => s.toUpperCase());

/* ── Le texte des huit sections, par le chemin de la liseuse ────────────
   cleanWS est RECOPIÉ de capital-1.html. Une duplication, donc, et c'est
   le moindre mal : l'alternative serait d'extraire la fonction d'une page
   de 300 Ko à coups d'expression régulière, ce qui casserait au premier
   accolade de plus. Si cleanWS change là-bas, il faut le changer ici —
   d'où ce commentaire, et d'où --refresh qui refait tout. */
const CLEANWS = String.raw`
function mathWS(box){
  box.querySelectorAll('.mwe-math-element, math').forEach(function(el){
    var m = el.matches('math') ? el : el.querySelector('math');
    if(!m){ el.remove(); return; }
    m.querySelectorAll('mstyle[scriptlevel]').forEach(function(s){
      if(Number(s.getAttribute('scriptlevel')) > 0) s.setAttribute('scriptlevel','0');
    });
    m.removeAttribute('style'); m.style.display = '';
    if(el !== m) el.replaceWith(m);
  });
}
function cleanWS(raw){
  var tmp = new DOMParser().parseFromString(raw,'text/html').body;
  mathWS(tmp);
  tmp.querySelectorAll('.mw-editsection,sup.reference,sup[class*="reference"],style,link,.mw-references-wrap,ol.references,.references,.ws-noexport,.noprint,#toc,img,.thumb,.mw-empty-elt,[class*="header"]').forEach(function(e){ e.remove(); });
  tmp.querySelectorAll('table').forEach(function(t){ if(/[◄►]|biblioth[èe]que libre|section\s*(suivante|pr[ée]c[ée]dente)/i.test(t.textContent)) t.remove(); });
  tmp.querySelectorAll('a').forEach(function(a){ a.replaceWith(tmp.ownerDocument.createTextNode(a.textContent)); });
  return tmp.innerHTML;
}`;

async function dumpSections() {
  mkdirSync(CACHE, { recursive: true });
  if (!existsSync(CHROME)) die(`Chrome introuvable : ${CHROME}`);
  const require = createRequire(path.join(JEU, 'package.json'));
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); } catch { die(`puppeteer-core introuvable dans ${JEU}`); }

  const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await navigateur.newPage();
  /* Une origine http quelconque : l'API de Wikisource répond en CORS
     (origin=*), mais pas à une page file://, dont l'origine est « null ». */
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (r.url() === 'https://liremarx.test/') r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><title>x</title>' });
    else r.continue();
  });
  await page.goto('https://liremarx.test/');
  await page.evaluate(CLEANWS);

  for (let n = 1; n <= 8; n++) {
    process.stdout.write(`  section ${n}… `);
    const texte = await page.evaluate(async (n) => {
      const url = 'https://fr.wikisource.org/w/api.php?action=parse&page=Le_Capital%2FLivre_I%2FSection_'
        + n + '&prop=text&format=json&formatversion=2&origin=*';
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      let raw = j && j.parse && j.parse.text;
      if (raw && typeof raw === 'object') raw = raw['*'];
      if (!raw) throw new Error('réponse vide');
      /* eslint-disable-next-line no-undef */
      const html = cleanWS(raw);
      /* Le conteneur de la liseuse : locate() fait son indexOf sur le
         textContent de CE nœud-là. */
      const box = document.createElement('div');
      box.innerHTML = html;
      return box.textContent;
    }, n);
    writeFileSync(path.join(CACHE, `s${n}.txt`), texte);
    console.log(`${texte.length.toLocaleString('fr-FR')} caractères`);
  }
  await navigateur.close();
}

const sections = {};
function section(n) {
  if (sections[n]) return sections[n];
  const f = path.join(CACHE, `s${n}.txt`);
  if (!existsSync(f)) die(`Section ${n} absente du cache. Lancer : node tools/verif-citations.mjs --refresh`);
  return (sections[n] = readFileSync(f, 'utf8'));
}

/* Les citations d'un essai : <q data-s data-q> et <blockquote data-s data-q>. */
function citations(html) {
  const out = [];
  const re = /<(?:q|blockquote) data-s="(\d+)" data-q="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) out.push({ s: Number(m[1]), q: decodeHtml(m[2]) });
  return out;
}
const decodeHtml = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&nbsp;/g, ' ').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

/* ── Ce qui est cité ailleurs, pour ne pas le citer deux fois ───────── */
const ailleurs = new Map();
if (existsSync(MONDES)) {
  for (const d of readdirSync(MONDES)) {
    const f = path.join(MONDES, d, 'essai.html');
    if (!existsSync(f)) continue;
    for (const c of citations(readFileSync(f, 'utf8'))) ailleurs.set(c.q, `/glossaire/${d}`);
  }
}

if (refresh || !existsSync(path.join(CACHE, 's8.txt'))) {
  console.log('\nLe texte de Roy, par le chemin de la liseuse :');
  await dumpSections();
}

const dossiers = existsSync(CHAP_DIR) ? readdirSync(CHAP_DIR).filter((d) => !d.startsWith('.')) : [];
if (!dossiers.length) die('Aucun chapitre sous oeuvres/capital-1/chapitres/.');

let nCit = 0, nMal = 0, nDouble = 0, nChap = 0;
const vus = new Map();
console.log('\nLes citations des pages de chapitre :\n');
for (const d of dossiers.sort()) {
  /* Un dossier en cours d'écriture n'a pas encore ses deux fichiers : on
     l'annonce et on passe, plutôt que de faire échouer tout le relevé. */
  if (!existsSync(path.join(CHAP_DIR, d, 'meta.json')) || !existsSync(path.join(CHAP_DIR, d, 'essai.html'))) {
    console.log(`  … ${d.padEnd(6)} dossier incomplet, ignoré`);
    continue;
  }
  const meta = JSON.parse(readFileSync(path.join(CHAP_DIR, d, 'meta.json'), 'utf8'));
  if (seuls.length && !seuls.includes(meta.rn)) continue;
  nChap++;
  const essai = readFileSync(path.join(CHAP_DIR, d, 'essai.html'), 'utf8');
  const cits = citations(essai);
  const mal = [];
  for (const c of cits) {
    nCit++;
    if (section(c.s).indexOf(c.q) < 0) { mal.push(c); nMal++; }
    const dej = ailleurs.get(c.q) || vus.get(c.q);
    if (dej) { nDouble++; console.log(`  ~ ${meta.rn} partage une citation avec ${dej} : « ${c.q.slice(0, 58)} »`); }
    vus.set(c.q, `le chapitre ${meta.rn}`);
  }
  const mots = essai.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`  ${mal.length ? '✗' : '✓'} ${meta.rn.padEnd(6)} ${String(cits.length).padStart(2)} citations · ${String(mots).padStart(4)} mots`
    + (mal.length ? `  — ${mal.length} INTROUVABLE(S)` : ''));
  for (const c of mal) console.log(`      section ${c.s} : « ${c.q} »`);
}

console.log(`\n${nChap} chapitre(s), ${nCit} citations, ${nMal} introuvable(s), ${nDouble} partagée(s).\n`);
process.exit(nMal ? 1 : 0);
