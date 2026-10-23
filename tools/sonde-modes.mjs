#!/usr/bin/env node
/* tools/sonde-modes.mjs — passe tools/sonde.js sur des pages × modes ×
   largeurs, dans un vrai Chrome sans interface (mission `affichage`).

   Pourquoi pas le volet du navigateur : il est PARTAGÉ entre agents, il gèle
   rAF, transitions et animations quand il est masqué, et ne sait pas
   enregistrer de service worker. Ici chaque page est chargée dans un onglet
   neuf, le mode posé dans localStorage AVANT le premier script
   (evaluateOnNewDocument), puis la sonde mesure l'état FINI.

   Usage :
     node tools/sonde-modes.mjs                         (les pages par défaut)
     node tools/sonde-modes.mjs --pages=/,/a-propos --modes=jour --largeurs=375
     node tools/sonde-modes.mjs --defile                (descend la page avant de sonder)
     node tools/sonde-modes.mjs --captures=<dossier>    (une capture du haut de page)
     node tools/sonde-modes.mjs --port=8840             (un serveur déjà lancé ; sinon il
                                                         en lance un, tools/serveur.mjs)
   Sort 1 s'il y a un échec. puppeteer-core est EMPRUNTÉ au dépôt du jeu
   (le site n'a ni package.json ni node_modules, et n'en aura pas). */
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const SITE = path.resolve(import.meta.dirname, '..');
const JEU = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const opt = n => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : null; };
const flag = n => process.argv.includes('--' + n);

const PAGES = (opt('pages') || [
  '/', '/karl-marx', '/a-propos', '/mentions-legales', '/agregation-2027',
  '/oeuvres/bibliotheque', '/oeuvres/capital-1', '/oeuvres/manuscrits-1844', '/oeuvres/manifeste',
  '/oeuvres/contribution-1859', '/oeuvres/salaire-prix-profit', '/oeuvres/18-brumaire',
  '/oeuvres/forum', '/oeuvres/carnet', '/oeuvres/messages',
  '/glossaire/', '/glossaire/fetichisme', '/glossaire/plus-value',
  '/oeuvres/capital-1/chapitre-10', '/commentaires/hieroglyphe-social',
  '/jeu/', '/hors-ligne', '/nexiste-pas',
].join(',')).split(',');
const MODES = (opt('modes') || 'bougie,jour,edition').split(',');
const LARGEURS = (opt('largeurs') || '375,1280').split(',').map(Number);
const CAPT = opt('captures');
if (CAPT) fs.mkdirSync(CAPT, { recursive: true });

const require = createRequire(path.join(JEU, 'package.json'));
const puppeteer = require('puppeteer-core');

let port = opt('port'), serveur = null;
if (!port) {
  port = String(8900 + Math.floor(Math.random() * 90));
  serveur = spawn(process.execPath, [path.join(SITE, 'tools/serveur.mjs'), port], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 600));
}
const ORIGIN = 'http://127.0.0.1:' + port;
const SONDE = fs.readFileSync(path.join(SITE, 'tools/sonde.js'), 'utf8');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--enable-unsafe-swiftshader', '--window-size=1400,1000'],
});
const resultats = [];
let echecs = 0;
try {
  for (const largeur of LARGEURS) for (const mode of MODES) for (const p of PAGES) {
    const page = await browser.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(String(e.message || e).slice(0, 160)));
    await page.setViewport({ width: largeur, height: largeur < 600 ? 812 : 900, deviceScaleFactor: 1, isMobile: largeur < 600, hasTouch: largeur < 600 });
    await page.evaluateOnNewDocument(m => { try { localStorage.setItem('liremarx.mode.v1', m); } catch (e) { } }, mode);
    try {
      await page.goto(ORIGIN + p, { waitUntil: 'networkidle2', timeout: 45000 });
    } catch (e) { erreurs.push('goto: ' + e.message.slice(0, 80)); }
    await new Promise(r => setTimeout(r, 1500));
    if (flag('defile')) {
      await page.evaluate(async () => {
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
        scrollTo(0, 0); await new Promise(r => setTimeout(r, 300));
      });
    }
    let b;
    try {
      await page.evaluate(SONDE);
      b = await page.evaluate(() => LM_SONDE({ fini: true, garder: true }));
    } catch (e) { b = { page: p, echecs: 1, erreur: e.message.slice(0, 120) }; }
    b.largeur = largeur; b.modeDemande = mode; b.erreursJS = erreurs;
    if (b.mode && b.mode !== mode) { b.echecs++; b.modeFaux = b.mode; }
    if (CAPT) await page.screenshot({ path: path.join(CAPT, (p.replace(/\//g, '_') || '_') + '-' + mode + '-' + largeur + '.png') }).catch(() => { });
    resultats.push(b); echecs += b.echecs || 0;
    console.log((b.echecs ? '✗' : '✓') + ' ' + mode.padEnd(8) + String(largeur).padStart(5) + '  ' + p.padEnd(34) + ' ' +
      (b.mesures || 0) + ' mesures, min ' + b.min + (b.echecs ? '  — ' + b.echecs + ' échec(s)' : '') +
      (b.surImage ? '  [' + b.surImage + ' sur image]' : '') + (erreurs.length ? '  JS: ' + erreurs[0] : ''));
    if (b.echecs && !flag('bref')) {
      for (const c of (b.contraste || []).slice(0, 6)) console.log('      contraste ' + c.ratio + ' < ' + c.seuil + '  ' + c.ou + ' « ' + c.texte + ' »');
      for (const c of (b.petits || []).slice(0, 4)) console.log('      petit ' + c.taille + ' px  ' + c.ou + ' « ' + c.texte + ' »');
      for (const c of (b.cibles || []).slice(0, 4)) console.log('      cible ' + c.l + '×' + c.h + '  ' + c.ou + ' « ' + c.texte + ' »');
      if (b.debordement) console.log('      débordement ' + b.debordement);
      if (b.erreur) console.log('      ' + b.erreur);
    }
    await page.close();
  }
} finally {
  await browser.close();
  if (serveur) serveur.kill();
}
const o = opt('out'); if (o) fs.writeFileSync(o, JSON.stringify(resultats, null, 1));
const parMode = {};
for (const r of resultats) { const k = r.modeDemande; parMode[k] = parMode[k] || { min: 99, echecs: 0, mesures: 0 }; parMode[k].mesures += r.mesures || 0; parMode[k].echecs += r.echecs || 0; if (r.min) parMode[k].min = Math.min(parMode[k].min, r.min); }
console.log('\nBilan : ' + Object.entries(parMode).map(([m, v]) => m + ' ' + v.mesures + ' mesures, min ' + v.min.toFixed(2) + ', ' + v.echecs + ' échec(s)').join(' · '));
process.exit(echecs ? 1 : 0);
