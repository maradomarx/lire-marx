// Regénère les icônes du site (assets/img/logo/) et /favicon.ico à partir du
// portrait de Mayall, 1875 (assets/img/marx/face-1875.webp, domaine public) :
// pochoir trois tons, demi-tons tramés en rouge ; aplats seuls sous 48 px.
// Pas une étape de build. Emprunte puppeteer-core au dépôt du jeu, comme
// capture-jeu.mjs.   node tools/logo-portrait.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const JEU = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const puppeteer = createRequire(path.join(JEU, 'package.json'))('puppeteer-core');
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const pg = await b.newPage();
pg.on('pageerror', e => { console.error(e.message); process.exit(1); });
await pg.goto('file://' + path.join(RACINE, 'tools/logo-portrait.html'));
await pg.waitForSelector('body[data-ok]', { timeout: 20000 });
const I = await pg.evaluate(() => window.ICONES); await b.close();
const D = path.join(RACINE, 'assets/img/logo');
for (const n in I) fs.writeFileSync(path.join(D, n + '.png'), Buffer.from(I[n].split(',')[1], 'base64'));
// favicon.ico : les PNG 16/32/48 tels quels (format Vista+)
const T = [16, 32, 48], P = T.map(s => fs.readFileSync(path.join(D, `icon-${s}.png`)));
const h = Buffer.alloc(6); h.writeUInt16LE(1, 2); h.writeUInt16LE(T.length, 4);
let off = 6 + 16 * T.length;
const E = P.map((p, i) => { const e = Buffer.alloc(16); e[0] = e[1] = T[i]; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.length, 8); e.writeUInt32LE(off, 12); off += p.length; return e; });
fs.writeFileSync(path.join(RACINE, 'favicon.ico'), Buffer.concat([h, ...E, ...P]));
console.log('Icônes écrites :', Object.keys(I).join(', '), '+ favicon.ico');
