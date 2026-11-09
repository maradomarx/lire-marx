#!/usr/bin/env node
// tools/cartes-partage.mjs — une adresse et une image de partage par manuscrit.
//
// Un tirage se montre : « J'ai tiré Rosa Luxemburg en manuscrit ». Partagée,
// /cartes/?carte=<id> n'affichait que l'image générale du jeu. Les 73
// manuscrits (rang 4, la liste fermée de cartes/main.json) ont donc chacun :
//   - une page /cartes/c/<id> (cartes/c/<id>.html), légère, en noindex : elle
//     sert l'aperçu du lien (og:image) et montre la carte à qui clique. Pas
//     d'indexation : trois lignes de Wikidata par page seraient du contenu
//     mince, et c'est le site entier qui le paierait ;
//   - une image 1200 × 630 (assets/img/cartes/og/<id>.jpg), avec le vrai
//     rendu de la carte (cartes/carte.js) dans un Chrome sans interface.
//
//   node tools/cartes-partage.mjs                 les pages seules
//   node tools/serveur.mjs 8840 &
//   node tools/cartes-partage.mjs --images [http://localhost:8840]
//
// Les ?v= de carte.js et carte.css sont relus dans cartes/index.html (posés
// par tools/cartes.mjs) : relancer cet outil après `cartes.mjs versions`.
// Pas une étape de build.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ORIGIN = 'https://liremarx.com';
const IMAGES = process.argv.includes('--images');
const BASE = process.argv.find((a) => /^https?:/.test(a)) || 'http://localhost:8840';

const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'cartes/catalogue.json'), 'utf8')).cartes;
const man = cat.filter((c) => c.r === 4);
const index = fs.readFileSync(path.join(ROOT, 'cartes/index.html'), 'utf8');
const vJs = (index.match(/carte\.js\?v=([a-z0-9]+)/) || [])[1];
const vCss = (index.match(/carte\.css\?v=([a-z0-9]+)/) || [])[1];
if (!vJs || !vCss) throw new Error('?v= de carte.js / carte.css introuvables dans cartes/index.html');
const total = cat.length.toLocaleString('fr-FR').replace(/\s/g, ' ');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FAM = { fig: 'Figure', org: 'Organisation', evt: 'Événement', oeu: 'Œuvre', not: 'Notion' };
// Une ligne qui situe la carte, tirée de ses faits (jamais inventée).
const situe = (c) => {
  if (c.f === 'fig') return [c.a && (c.b ? `${c.a}-${c.b}` : `née en ${c.a}`), c.pays].filter(Boolean).join(' · ');
  if (c.f === 'oeu') return [c.auteur, c.a].filter(Boolean).join(' · ');
  return [c.a, c.lieu || c.pays].filter(Boolean).join(' · ');
};
const descr = (c) => {
  const s = `${c.n}, l'un des ${man.length} manuscrits de Marx TCG, le jeu de cartes à collectionner gratuit de Lire Marx. ${c.d ? c.d + '.' : ''}`;
  return s.length > 158 ? s.slice(0, s.lastIndexOf(' ', 155)) + '…' : s;
};

function page(c) {
  const url = `${ORIGIN}/cartes/c/${c.id}`;
  const titre = `${c.n}, carte manuscrit | Marx TCG`;
  const d = descr(c);
  const lien = c.href ? `<a class="cp-b" href="${esc(c.href)}">${c.f === 'oeu' ? 'Lire le texte sur Lire Marx' : 'Lire la page sur Lire Marx'}</a>` : '';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(titre)}</title>
<!-- PAGE GÉNÉRÉE par tools/cartes-partage.mjs depuis cartes/catalogue.json.
     Ne pas éditer à la main. noindex : c'est l'aperçu d'un lien partagé,
     pas une page à classer (voir l'en-tête de l'outil). -->
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, follow">
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lire Marx">
<meta property="og:title" content="${esc(c.n)}, carte manuscrit de Marx TCG">
<meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/img/cartes/og/${c.id}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/assets/img/logo/apple-touch-icon.png">
<meta name="theme-color" content="#15100b">
<link rel="stylesheet" href="/oeuvres/fonts/fonts.css?v=2">
<link rel="stylesheet" href="/cartes/carte.css?v=${vCss}">
<style>
html,body{margin:0;background:#15100b;color:#f3e9d4;font-family:Inter,system-ui,sans-serif;}
body{min-height:100vh;display:grid;place-items:center;padding:32px 16px;box-sizing:border-box;
  background:radial-gradient(70% 60% at 70% 45%,#3a2812,#15100b 70%) fixed;}
.cp{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:clamp(28px,6vw,80px);align-items:center;max-width:980px;width:100%;}
.cp-l{font:600 .78rem/1 Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#d8ad4c;margin:0 0 16px;}
.cp-l a{color:inherit;text-decoration:none;}
h1{font:900 clamp(2.4rem,6vw,4.2rem)/.95 Fraunces,serif;letter-spacing:-.02em;margin:0;}
.cp-r{font:italic 500 1.35rem/1.2 Fraunces,serif;color:#e5644f;margin:12px 0 0;}
.cp-s{color:#b7a888;margin:10px 0 0;font-size:.95rem;}
.cp-d{font:400 1.12rem/1.5 Spectral,Georgia,serif;color:#e6dcc4;margin:20px 0 0;max-width:34em;}
.cp-a{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px;}
.cp-b{display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:100px;font-weight:600;font-size:.95rem;
  text-decoration:none;color:#f3e9d4;border:1px solid rgba(243,233,212,.3);}
.cp-b--p{background:#f3e9d4;color:#15100b;border-color:#f3e9d4;}
.cp-b:focus-visible{outline:2px solid #d8ad4c;outline-offset:3px;}
.cp-c{--ct-l:min(340px,78vw);cursor:pointer;background:none;border:0;padding:0;color:inherit;}
.cp-c:focus-visible{outline:2px solid #d8ad4c;outline-offset:6px;border-radius:14px;}
.cp-n{font-size:.82rem;color:#b7a888;margin-top:12px;text-align:center;}
@media (max-width:760px){.cp{grid-template-columns:1fr;text-align:center;}.cp>div:last-child{order:-1;justify-self:center;}.cp-a{justify-content:center;}.cp-d{margin-inline:auto;}}
</style>
</head>
<body>
<main class="cp">
  <div>
    <p class="cp-l"><a href="/cartes/">Marx TCG</a> · ${esc(FAM[c.f])} · n° ${c.no}</p>
    <h1>${esc(c.n)}</h1>
    <p class="cp-r">Manuscrit, le rang le plus rare</p>
    <p class="cp-s">${esc(situe(c))}</p>
    ${c.d ? `<p class="cp-d">${esc(c.d)}. L'une des ${man.length} cartes manuscrits sur ${total}, à tirer dans les boosters gratuits de Lire Marx.</p>` : ''}
    <div class="cp-a">
      <a class="cp-b cp-b--p" href="/cartes/">Ouvrir mes boosters</a>
      <a class="cp-b" href="/cartes/?carte=${encodeURIComponent(c.id)}">Voir dans l'album</a>
      ${lien}
    </div>
  </div>
  <div>
    <button class="cp-c" id="cp" type="button" aria-label="Retourner la carte">
      <noscript><img src="/assets/img/cartes/og/${c.id}.jpg" alt="" width="300"></noscript>
    </button>
    <p class="cp-n" aria-hidden="true">Touchez la carte pour la retourner</p>
  </div>
</main>
<script src="/cartes/carte.js?v=${vJs}"></script>
<script>
(function(){var c=${JSON.stringify(c).replace(/</g, '\\u003c')};
var tete=/[?&]irisee/.test(location.search), b=document.getElementById('cp');
b.innerHTML=Carte.html(c,{verso:true,tete:tete});
b.addEventListener('click',function(e){if(e.target.closest('a'))return;var a=b.querySelector('.ct');if(a)a.classList.toggle('retournee');});})();
</script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(ROOT, 'cartes/c'), { recursive: true });
const ids = new Set(man.map((c) => c.id));
for (const f of fs.readdirSync(path.join(ROOT, 'cartes/c'))) {
  if (f.endsWith('.html') && !ids.has(f.slice(0, -5))) fs.rmSync(path.join(ROOT, 'cartes/c', f));
}
for (const c of man) fs.writeFileSync(path.join(ROOT, `cartes/c/${c.id}.html`), page(c));
console.log(`pages : ${man.length} dans cartes/c/`);

if (IMAGES) {
  const require = createRequire(path.join(process.env.HOME, 'Desktop/circuit-du-capital/package.json'));
  const puppeteer = require('puppeteer-core');
  const dir = path.join(ROOT, 'assets/img/cartes/og');
  fs.mkdirSync(dir, { recursive: true });
  const gab = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${BASE}/oeuvres/fonts/fonts.css">
<link rel="stylesheet" href="${BASE}/cartes/carte.css">
<style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#120d08;}
body{position:relative;font-family:Inter,sans-serif;color:#f3e9d4;background:radial-gradient(70% 90% at 76% 55%,#3a2812,#120d08 70%);}
.t{position:absolute;left:70px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;}
.l{font:600 17px/1 Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#d8ad4c;margin:0 0 22px;}
h1{font:900 82px/.95 Fraunces,serif;letter-spacing:-.025em;margin:0;}
.r{font:italic 500 34px/1.15 Fraunces,serif;color:#e5644f;margin:18px 0 0;}
.p{font:400 24px/1.4 Spectral,serif;color:#c7b599;margin:22px 0 0;}
.c{position:absolute;right:96px;top:50%;--ct-l:345px;transform:translateY(-50%) rotate(3deg);}
.c .ct{--ct-l:345px;}
</style></head><body>
<div class="t"><p class="l">Marx TCG · Lire Marx</p><h1 id="n"></h1><p class="r">Manuscrit, le rang le plus rare</p><p class="p" id="p"></p></div>
<div class="c" id="c"></div>
<script src="${BASE}/cartes/carte.js"></script></body></html>`;
  const tmp = path.join(ROOT, '.og-cartes-tmp.html');
  fs.writeFileSync(tmp, gab);
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const p = await b.newPage();
    await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await p.goto(BASE + '/.og-cartes-tmp.html', { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    const png = path.join(ROOT, '.og-cartes-tmp.png');
    // --seul=<id> : une seule image, quand une seule carte a changé
    const seul = (process.argv.find((a) => a.startsWith('--seul=')) || '').slice(7);
    for (const c of man.filter((m) => !seul || m.id === seul)) {
      await p.evaluate((c, s) => {
        document.getElementById('n').textContent = c.n;
        document.getElementById('n').style.fontSize = c.n.length > 22 ? '58px' : c.n.length > 15 ? '70px' : '82px';
        document.getElementById('p').textContent = s;
        document.getElementById('c').innerHTML = Carte.html(c, {});
      }, c, situe(c));
      await p.evaluate(async () => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
      await new Promise((r) => setTimeout(r, 250));
      await p.screenshot({ path: png });
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '4', path.join(dir, `${c.id}.jpg`)]);
    }
    fs.rmSync(png, { force: true });
    const ko = fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0) / 1024;
    console.log(`images : ${man.length} dans assets/img/cartes/og/ (${Math.round(ko)} Ko)`);
  } finally {
    await b.close();
    fs.rmSync(tmp, { force: true });
  }
}
