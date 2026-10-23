#!/usr/bin/env node
/* Serveur de test qui IMITE Cloudflare Pages — parce que `python3 -m http.server`
   ne prouve rien sur les URL (piège payé quatre fois sur ce site) :

     /oeuvres/x        → sert oeuvres/x.html          (URL propre)
     /oeuvres/x.html   → 308 vers /oeuvres/x          (l'extension redirige)
     /jeu              → 308 vers /jeu/               (un dossier redirige vers son slash)
     /jeu/             → sert jeu/index.html

   ⚠️ LE FICHIER GAGNE SUR LE DOSSIER : `oeuvres/capital-1` peut être à la fois
   `capital-1.html` et un dossier ; en production c'est le fichier qui répond.

   Aucun cache (`Cache-Control: no-store`) : Chrome appliquerait sinon son cache
   heuristique et servirait des feuilles périmées.

   Usage : node tools/serveur.mjs [port]      (défaut 8840)
   Ce n'est PAS une étape de build. Le site reste statique. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8840);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream', '.gz': 'application/gzip',
};

const isFile = p => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = p => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function send(res, code, body, type, extra = {}) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
  res.end(body);
}
function serveFile(res, abs) {
  const ext = path.extname(abs).toLowerCase();
  send(res, 200, fs.readFileSync(abs), MIME[ext] || 'application/octet-stream');
}

/* Les redirections de production (_redirects) : sans elles, le serveur de test
   répond 404 là où Cloudflare répond 301, et l'on croit à un lien mort. Seule
   la forme simple « source destination code » est lue — c'est tout ce que le
   site emploie. */
const REDIRS = (() => {
  try {
    return fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
      .map(l => l.split(/\s+/)).filter(x => x.length >= 2)
      .map(([de, vers, code]) => ({ de, vers, code: Number(code) || 302 }));
  } catch { return []; }
})();

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let p = decodeURIComponent(u.pathname);
  if (p.includes('..')) return send(res, 400, 'bad path', 'text/plain');
  const q = u.search || '';

  const r = REDIRS.find(x => x.de === p);
  if (r) return send(res, r.code, '', 'text/plain', { Location: r.vers + q });

  // 1. l'extension redirige (sauf index.html → /)
  if (/\.html$/.test(p)) {
    const clean = p === '/index.html' ? '/' : p.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    return send(res, 308, '', 'text/plain', { Location: clean + q });
  }
  const abs = path.join(ROOT, p);
  // 2. dossier avec slash → son index
  if (p.endsWith('/')) {
    const idx = path.join(abs, 'index.html');
    if (isFile(idx)) return serveFile(res, idx);
    return notFound(res);
  }
  // 3. fichier réel (actifs, json…)
  if (isFile(abs)) return serveFile(res, abs);
  // 4. URL propre → page-fichier — LE FICHIER GAGNE SUR LE DOSSIER
  if (isFile(abs + '.html')) return serveFile(res, abs + '.html');
  // 5. dossier sans slash → 308 vers le slash
  if (isDir(abs) && isFile(path.join(abs, 'index.html'))) return send(res, 308, '', 'text/plain', { Location: p + '/' + q });
  return notFound(res);

  function notFound(res) {
    const nf = path.join(ROOT, '404.html');
    if (isFile(nf)) return send(res, 404, fs.readFileSync(nf), MIME['.html']);
    send(res, 404, 'Not found', 'text/plain');
  }
}).listen(PORT, () => console.log(`Lire Marx — http://localhost:${PORT}/  (racine ${ROOT}, imite Cloudflare Pages, no-store)`));
