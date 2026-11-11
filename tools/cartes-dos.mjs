// Photographie le dos des cartes pour la scène 3D de l'ouverture : la pile qui
// sort du sachet doit être, au pixel près, celle que la page affiche ensuite.
// À relancer après toute retouche du dos (carte.js, carte.css).
//   node tools/cartes-dos.mjs
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..');
const require = createRequire(path.join(path.resolve(ROOT, '../circuit-du-capital'), 'package.json'));
const puppeteer = require('puppeteer-core');
const PORT = 8878;
const srv = spawn('node', ['tools/serveur.mjs', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const b = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage();
await p.setViewport({ width: 900, height: 1100, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${PORT}/cartes/echantillons.html`, { waitUntil: 'load' });
await p.evaluate(async () => {
  document.body.innerHTML = Carte.dos();
  document.documentElement.style.background = document.body.style.background = 'transparent';
  document.body.style.margin = '0';
  const ct = document.querySelector('.ct'); ct.style.setProperty('--ct-l', '720px'); ct.style.position = 'absolute'; ct.style.left = ct.style.top = '40px';
  await document.fonts.ready;
  await Promise.all([...document.images, ...document.querySelectorAll('image')].map(() => new Promise((r) => setTimeout(r, 300))));
});
await new Promise((r) => setTimeout(r, 500));
const png = path.join(os.tmpdir(), 'cartes-dos.png');
const clip = await p.evaluate(() => { const r = document.querySelector('.ct').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
await p.screenshot({ path: png, clip, omitBackground: true });
await b.close(); srv.kill();
execFileSync('cwebp', ['-quiet', '-q', '88', '-alpha_q', '95', png, '-o', path.join(ROOT, 'assets/img/cartes/dos.webp')]);
console.log('dos.webp', fs.statSync(path.join(ROOT, 'assets/img/cartes/dos.webp')).size, 'octets', clip.width + '×' + clip.height);
