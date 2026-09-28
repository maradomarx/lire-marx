#!/usr/bin/env node
/* tools/carte-exil.mjs — la carte de l'exil de /karl-marx, DÉRIVÉE de
 * Natural Earth (domaine public, https://www.naturalearthdata.com).
 *
 * Lit les GeoJSON 1:10 M de Natural Earth (terres, fleuves, lacs), les
 * DÉCOUPE sur l'emprise de la carte (lon -7 → 16, lat 46,5 → 56,5), les
 * SIMPLIFIE (Douglas-Peucker) et écrit `assets/img/marx/carte-exil.json`, que la
 * scène de la page lit pour dessiner la carte au canevas. Pas une étape de
 * build : on le lance à la main, on commite le résultat.
 *
 *   node tools/carte-exil.mjs <dossier des geojson>
 *
 * Les trois fichiers attendus dans ce dossier : ne_10m_land.geojson,
 * ne_10m_rivers_lake_centerlines.geojson, ne_10m_lakes.geojson
 * (https://github.com/nvkelso/natural-earth-vector/tree/master/geojson).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] || '.';
const BBOX = { x0: -7, y0: 46.5, x1: 16, y1: 56.5 };
const TOL_LAND = 0.008, TOL_RIV = 0.01;

/* ── Douglas-Peucker ── */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let dmax = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      /* corde nulle (un anneau FERMÉ : premier et dernier points confondus) :
         la distance à la corde vaudrait zéro partout et l'anneau entier
         tomberait à deux points — vécu sur la Grande-Bretagne. On prend
         alors la distance au point. */
      const d = L < 1e-9 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / L;
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* ── Sutherland-Hodgman : un anneau contre le rectangle ── */
function clipRing(ring) {
  const edges = [
    [p => p[0] >= BBOX.x0, (a, b) => inter(a, b, 0, BBOX.x0)],
    [p => p[0] <= BBOX.x1, (a, b) => inter(a, b, 0, BBOX.x1)],
    [p => p[1] >= BBOX.y0, (a, b) => inter(a, b, 1, BBOX.y0)],
    [p => p[1] <= BBOX.y1, (a, b) => inter(a, b, 1, BBOX.y1)],
  ];
  let out = ring;
  for (const [inside, cross] of edges) {
    const inp = out; out = [];
    if (!inp.length) break;
    let S = inp[inp.length - 1];
    for (const E of inp) {
      if (inside(E)) { if (!inside(S)) out.push(cross(S, E)); out.push(E); }
      else if (inside(S)) out.push(cross(S, E));
      S = E;
    }
  }
  return out;
}
function inter(a, b, axis, v) {
  const t = (v - a[axis]) / (b[axis] - a[axis]);
  return axis === 0 ? [v, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, v];
}
const inBox = ring => ring.some(p => p[0] >= BBOX.x0 && p[0] <= BBOX.x1 && p[1] >= BBOX.y0 && p[1] <= BBOX.y1);
const touches = ring => { /* l'anneau chevauche-t-il la boîte ? */
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of ring) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return !(x1 < BBOX.x0 || x0 > BBOX.x1 || y1 < BBOX.y0 || y0 > BBOX.y1);
};
const r3 = v => Math.round(v * 1000) / 1000;

/* ── les terres : polygones (anneau extérieur + trous), découpés ── */
const land = JSON.parse(readFileSync(join(DIR, 'ne_10m_land.geojson'), 'utf8'));
const terres = [];
for (const f of land.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    if (!touches(poly[0])) continue;
    const rings = poly.map(r => simplify(clipRing(r), TOL_LAND)).filter(r => r.length >= 4);
    if (rings.length) terres.push(rings.map(r => r.map(([x, y]) => [r3(x), r3(y)])));
  }
}

/* ── les lacs, mêmes règles (ils se dessinent en mer) ── */
const lakes = JSON.parse(readFileSync(join(DIR, 'ne_10m_lakes.geojson'), 'utf8'));
const lacs = [];
for (const f of lakes.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    if (!touches(poly[0])) continue;
    const r = simplify(clipRing(poly[0]), TOL_LAND);
    if (r.length >= 4) lacs.push(r.map(([x, y]) => [r3(x), r3(y)]));
  }
}

/* ── les fleuves : lignes, découpées segment par segment, nommées ── */
const NOMS = { Rhein: 'Rhin', Mosel: 'Moselle', Waal: 'Waal', Nederrijn: 'Rhin', Lek: 'Lek', IJssel: 'IJssel', Sane: 'Saône', Donau: 'Danube', Rhine: 'Rhin', Moselle: 'Moselle', Seine: 'Seine', Meuse: 'Meuse', Maas: 'Meuse', Scheldt: 'Escaut',
  Schelde: 'Escaut', Thames: 'Tamise', Elbe: 'Elbe', Weser: 'Weser', Loire: 'Loire', Main: 'Main', Oise: 'Oise',
  Marne: 'Marne', Neckar: 'Neckar', Havel: 'Havel', Spree: 'Spree', Ems: 'Ems', Somme: 'Somme', Severn: 'Severn',
  Trent: 'Trent', Saar: 'Sarre', Sambre: 'Sambre', Aisne: 'Aisne', Yonne: 'Yonne', Lahn: 'Lahn', Ruhr: 'Ruhr',
  Lippe: 'Lippe', Sieg: 'Sieg', Nahe: 'Nahe', Aar: 'Aar', Aare: 'Aar', Rhône: 'Rhône', Rhone: 'Rhône', Saône: 'Saône', Doubs: 'Doubs',
  Saale: 'Saale', Mulde: 'Mulde', Oder: 'Oder', Warta: 'Warta', Ouse: 'Ouse', Humber: 'Humber', Mersey: 'Mersey',
  Cher: 'Cher', Allier: 'Allier', Vienne: 'Vienne', Eure: 'Eure', Sarthe: 'Sarthe', Mayenne: 'Mayenne', Aller: 'Aller', Leine: 'Leine', Fulda: 'Fulda', Werra: 'Werra' };
const riv = JSON.parse(readFileSync(join(DIR, 'ne_10m_rivers_lake_centerlines.geojson'), 'utf8'));
const fleuves = [];
for (const f of riv.features) {
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const nom = NOMS[f.properties.name] || NOMS[f.properties.name_en] || null;
  const rang = +f.properties.scalerank || 9;
  if (rang > 8 && !nom) continue;                       /* les tout petits, sans nom : on s'en passe */
  for (const line of lines) {
    /* découpe par morceaux intérieurs à la boîte */
    let cur = [];
    const flush = () => { if (cur.length >= 2) { const s = simplify(cur, TOL_RIV); fleuves.push({ n: nom, r: rang, p: s.map(([x, y]) => [r3(x), r3(y)]) }); } cur = []; };
    for (const p of line) { if (p[0] >= BBOX.x0 && p[0] <= BBOX.x1 && p[1] >= BBOX.y0 && p[1] <= BBOX.y1) cur.push(p); else flush(); }
    flush();
  }
}

const out = { source: 'Natural Earth 1:10m (domaine public), découpé et simplifié par tools/carte-exil.mjs', bbox: BBOX, terres, lacs, fleuves };
const json = JSON.stringify(out);
writeFileSync('assets/img/marx/carte-exil.json', json);
console.log(`terres ${terres.length} polygones, ${terres.reduce((n, p) => n + p.reduce((m, r) => m + r.length, 0), 0)} points ; lacs ${lacs.length} ; fleuves ${fleuves.length} tronçons (${fleuves.filter(f => f.n).length} nommés) ; ${(json.length / 1024).toFixed(0)} Ko`);
