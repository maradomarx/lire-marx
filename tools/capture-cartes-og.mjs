#!/usr/bin/env node
// tools/capture-cartes-og.mjs — l'image de partage de Marx TCG (1200 × 630).
//
// Elle n'est pas dessinée à la main : un Chrome sans interface compose cinq
// manuscrits en éventail (ceux de la vitrine de l'accueil) sous le nom du jeu,
// avec le vrai rendu des cartes (cartes/carte.js), et la photographie.
//
//   node tools/serveur.mjs 8840 &   (le site doit être servi)
//   node tools/capture-cartes-og.mjs [http://localhost:8840]
//
// Écrit assets/img/cartes/marx-tcg-og.jpg. Pas une étape de build.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..');
const BASE = process.argv[2] || 'http://localhost:8840';
const require = createRequire(path.join(process.env.HOME, 'Desktop/circuit-du-capital/package.json'));
const puppeteer = require('puppeteer-core');
const main = JSON.parse(fs.readFileSync(path.join(ROOT, 'cartes/main.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'cartes/catalogue.json'), 'utf8')).cartes;
const vit = main.vitrine.map(id => cat.find(c => c.id === id));
const n = cat.length.toLocaleString('fr-FR').replace(/\s/g, ' ');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${BASE}/oeuvres/fonts/fonts.css">
<link rel="stylesheet" href="${BASE}/cartes/carte.css">
<style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#120d08;}
body{position:relative;font-family:Inter,sans-serif;color:#f3e9d4;
  background:radial-gradient(70% 90% at 72% 60%,#3a2812,#120d08 70%);}
.t{position:absolute;left:64px;top:150px;width:470px;z-index:2;}
.l{font:600 15px/1 Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#d8ad4c;margin:0 0 18px;}
h1{font:900 104px/.92 Fraunces,serif;letter-spacing:-.03em;margin:0;}
.s{font:italic 500 30px/1.15 Fraunces,serif;color:#e5644f;margin:14px 0 0;}
.p{font:400 21px/1.45 Spectral,serif;color:#c7b599;margin:26px 0 0;}
.e{position:absolute;left:560px;top:0;width:640px;height:630px;--ct-l:200px;}
.e .ct{--ct-l:200px;position:absolute;left:50%;top:52%;margin:-140px 0 0 -100px;transform-origin:50% 130%;}
</style></head><body>
<div class="t"><p class="l">Lire Marx</p><h1>Marx TCG</h1><p class="s">le jeu de cartes à collectionner</p>
<p class="p">${n} cartes. Trois boosters gratuits par jour.</p></div>
<div class="e" id="e"></div>
<script src="${BASE}/cartes/carte.js"></script>
<script>
var d=${JSON.stringify(vit)}, e=document.getElementById('e');
e.innerHTML=d.map(function(c,i){var k=i-2;return Carte.html(c,{tete:i===4}).replace('style="','style="transform:translateX('+(k*86)+'px) translateY('+(Math.abs(k)*16)+'px) rotate('+(k*8)+'deg);z-index:'+(i+1)+';');}).join('');
</script></body></html>`;

const tmp = path.join(ROOT, '.og-tmp.html');
fs.writeFileSync(tmp, html);
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await p.goto(BASE + '/.og-tmp.html', { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
  await new Promise(r => setTimeout(r, 800));
  const png = path.join(ROOT, '.og-tmp.png');
  await p.screenshot({ path: png });
  const out = path.join(ROOT, 'assets/img/cartes/marx-tcg-og.jpg');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '3', out]);
  fs.rmSync(png, { force: true });
  console.log('écrit', path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + ' Ko');
} finally {
  await b.close();
  fs.rmSync(tmp, { force: true });
}
