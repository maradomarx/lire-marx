// tools/compacte-scan.mjs — COMPACTE un scan déjà importé (LMS1) en LMS2, sans perte.
//
// Pas une étape de build : un outil de dépôt, comme import-scan.mjs, dont il
// reprend la sortie. Le binaire LMS1 (positions Uint16 quantifiées + indices)
// est INCOMPRESSIBLE tel quel — gzip : 1 065 Ko pour 1 068 Ko sur la statue du
// travail aliéné —, parce que triangles et sommets sont dans un ordre sans
// cohérence. On réordonne donc, sans rien changer à la géométrie :
//   1. triangles triés par ordre de Morton de leur centre ;
//   2. sommets renumérotés dans l'ordre de première utilisation (les sommets
//      jamais utilisés tombent) ;
//   3. indices codés en écart au plus haut sommet déjà vu (souvent 0) ;
//   4. positions codées en écart au sommet précédent, axe par axe ;
// puis le tout en gzip, que le navigateur décode avec DecompressionStream.
// Mesuré sur la statue : 1 068 → 609 Ko.
//
//   node tools/compacte-scan.mjs <in.bin (LMS1)> <out.bin (LMS2 gzip)>
//
// Format LMS2 (avant gzip) : 'LMS2', nv, ni (Uint32), min[3], ext[3] (Float32),
// puis ni indices Uint16 (écarts), puis nv×3 positions Uint16 (écarts, axe x
// entier, puis y, puis z). Limité à moins de 65 536 sommets.
import fs from 'node:fs';
import zlib from 'node:zlib';
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('Usage : node tools/compacte-scan.mjs <in.bin> <out.bin>'); process.exit(1); }
const b = fs.readFileSync(src);
if (b.toString('latin1', 0, 4) !== 'LMS1') throw new Error('entrée non LMS1');
const nv = b.readUInt32LE(4), ni = b.readUInt32LE(8), ib = b.readUInt32LE(12);
if (ib !== 2 || nv > 65535) throw new Error('LMS2 exige des indices 16 bits (moins de 65 536 sommets)');
const P = new Uint16Array(nv * 3), I = new Uint16Array(ni);
for (let i = 0; i < nv * 3; i++) P[i] = b.readUInt16LE(40 + i * 2);
for (let i = 0; i < ni; i++) I[i] = b.readUInt16LE(40 + nv * 6 + i * 2);
const T = ni / 3, keys = new Float64Array(T), ord = Array.from({ length: T }, (_, t) => t);
const part = (v) => { v &= 1023; v = (v | (v << 16)) & 0x30000FF; v = (v | (v << 8)) & 0x300F00F; v = (v | (v << 4)) & 0x30C30C3; return (v | (v << 2)) & 0x9249249; };
for (let t = 0; t < T; t++) {
  let cx = 0, cy = 0, cz = 0;
  for (let k = 0; k < 3; k++) { const v = I[t * 3 + k]; cx += P[v * 3]; cy += P[v * 3 + 1]; cz += P[v * 3 + 2]; }
  keys[t] = part((cx / 3) >> 6) * 4 + part((cy / 3) >> 6) * 2 + part((cz / 3) >> 6);
}
ord.sort((a, c) => keys[a] - keys[c]);
const map = new Int32Array(nv).fill(-1), I2 = new Uint16Array(ni), P2 = new Uint16Array(nv * 3); let n = 0;
for (let j = 0; j < T; j++) { const t = ord[j]; for (let k = 0; k < 3; k++) { const v = I[t * 3 + k]; if (map[v] < 0) { map[v] = n; P2.set(P.subarray(v * 3, v * 3 + 3), n * 3); n++; } I2[j * 3 + k] = map[v]; } }
const E = new Uint16Array(ni); let hw = 0;
for (let i = 0; i < ni; i++) { E[i] = hw - I2[i]; if (I2[i] === hw) hw++; }
const D = new Uint16Array(n * 3);
for (let k = 0; k < 3; k++) { let pv = 0; for (let i = 0; i < n; i++) { const v = P2[i * 3 + k]; D[k * n + i] = (v - pv) & 0xffff; pv = v; } }
const head = Buffer.alloc(40); head.write('LMS2', 0, 'latin1'); head.writeUInt32LE(n, 4); head.writeUInt32LE(ni, 8);
b.copy(head, 16, 16, 40);   // min[3] et ext[3] inchangés (même quantification)
const raw = Buffer.concat([head, Buffer.from(E.buffer), Buffer.from(D.buffer)]);
const gz = zlib.gzipSync(raw, { level: 9 });
fs.writeFileSync(out, gz);
console.log(`${src} → ${out} : ${nv} → ${n} sommets, ${T} triangles, ${Math.round(b.length / 1024)} → ${Math.round(gz.length / 1024)} Ko`);
