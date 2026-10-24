/* tools/sonde-fond.js — LA SONDE DU FOND (mission `affichage`, volet fond, oct. 2026).

   tools/sonde.js lit `color` et `background-color` : elle ne voit pas un
   canvas. Celle-ci mesure ce que le lecteur voit vraiment SOUS chaque texte
   posé sur le fond (assets/fond.js, « la circulation » depuis oct. 2026) : la
   poussière d'or, le circuit et son fil, le papier vergé, le voile.

   LA MÉTHODE n'est pas celle de Lire Debord, qui recomposait les couches à
   la main : ici les lumières sont transformées par le compositeur (rotation,
   biais, opacité), et le papier vergé est un fond de html. On demande donc au
   NAVIGATEUR de composer : le fond est figé à un instant donné
   (LM_FOND.figer), tout le texte de la page est rendu transparent (la mise en
   page ne bouge pas d'un pixel), et l'on photographie ; puis on recommence
   sans le fond (réglage « aucun », la page telle qu'elle était). Sous chaque
   texte, on lit les deux pixels et l'on compare le contraste de SA couleur :
   avec le fond, et sans. Les textes sur un aplat opaque ont la même mesure
   des deux côtés : ils ne comptent pas dans la chute.

   UN SEUL FICHIER, DEUX USAGES :
     node tools/sonde-fond.js [options]      le banc, dans Chrome sans interface
       --pages=/a-propos,/glossaire/          (défaut : les pages du fond)
       --modes=bougie,jour,edition  --largeurs=375,1280  --pos=0,0.5,1
       --graine       même image au rechargement ?
       --reversible   même image à la même position après un aller-retour ?
       --cout         coût d'une image, rendu logiciel forcé (?fond=logiciel)
       --captures=<dossier>  la page avec et sans texte (pour regarder le fond)
     et, collé dans la console d'une page : window.LM_SONDE_FOND.points()
     rend les points de mesure (textes visibles posés sur la page).
   Sort 1 s'il y a un échec. puppeteer-core est EMPRUNTÉ au dépôt du jeu
   (le site n'a ni package.json ni node_modules). Ce n'est pas une étape de
   build : un outil de dépôt, comme tools/sonde-modes.mjs. */
(function () {
  'use strict';

  /* ================= DANS LA PAGE ================= */
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const parse = s => {
      s = String(s);
      let m = s.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+%?))?\)/);
      if (m) return { c: [+m[1] * 255, +m[2] * 255, +m[3] * 255], a: m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]) };
      m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      return { c: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
    };
    const HORS = '.topbar,.sidebar,.fond,script,style,noscript,template,[aria-hidden="true"],.sr-only';
    const visible = e => {
      for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      }
      return true;
    };
    window.LM_SONDE_FOND = {
      /* les points de mesure : pour chaque texte visible dans la fenêtre, une
         grille de 7 × 3 points sur ses lignes, sa couleur et sa taille */
      points() {
        const W = innerWidth, H = innerHeight, out = [], vus = new Set();
        const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: n => !n.nodeValue.trim() || !n.parentElement || n.parentElement.closest(HORS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
        });
        while (tw.nextNode()) {
          const t = tw.currentNode, e = t.parentElement;
          if (vus.has(e)) continue; vus.add(e);
          if (!visible(e)) continue;
          const cs = getComputedStyle(e), fg = parse(cs.color);
          if (!fg || fg.a < .05) continue;
          const r = document.createRange(); r.selectNodeContents(t);
          const pts = [];
          for (const b of r.getClientRects()) {
            if (b.bottom < 1 || b.top > H - 1 || b.right < 1 || b.left > W - 1 || b.width < 2) continue;
            for (let i = 0; i <= 6; i++) for (let j = 0; j <= 2; j++) {
              const x = Math.round(b.left + b.width * (.04 + .92 * i / 6)), y = Math.round(b.top + b.height * (.2 + .3 * j));
              if (x >= 0 && y >= 0 && x < W && y < H) pts.push([x, y]);
            }
          }
          if (!pts.length) continue;
          const px = parseFloat(cs.fontSize), gras = (parseInt(cs.fontWeight, 10) || 400) >= 700;
          out.push({ ou: (e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '')), texte: t.nodeValue.trim().slice(0, 40), fg, grand: px >= 24 || (gras && px >= 18.66), pts });
        }
        return out;
      },
      /* l'empreinte du FOND seul (et non de la page, dont la barre du haut ou
         une note qui s'inscrit peuvent changer d'un passage à l'autre) : le
         contenu de chaque canvas du fond, sa place, son opacité, le papier */
      empreinte() {
        const b = document.querySelector('.fond'); if (!b) return null;
        const vw = document.documentElement.clientWidth / innerWidth;   /* la part VISIBLE (une page qui déborde élargit le canvas) */
        const out = [...b.children].map(c => {
          const o = { nom: c.className.replace('fond-', ''), style: c.style.transform + '|' + c.style.opacity };
          if (c.tagName === 'CANVAS' && c.width && c.height) {
            /* la dernière rangée et la dernière colonne d'un canvas à basse
               résolution chevauchent le bord : sur une page qui déborde, la
               hauteur de la fenêtre varie d'un pixel et elles avec — on les écarte */
            const lum = c.classList.contains('fond-lumiere');
            const w = lum ? c.width : Math.max(1, Math.round(c.width * vw) - 1), h = lum ? c.height : Math.max(1, c.height - 1);
            const d = c.getContext('2d').getImageData(0, 0, w, h).data;
            let s = ''; for (let i = 0; i < d.length; i += 8192) s += String.fromCharCode.apply(null, d.subarray(i, i + 8192));
            o.w = w; o.data = btoa(s);
          }
          return o;
        });
        out.push({ nom: 'papier', style: getComputedStyle(document.documentElement).backgroundImage.length + '' });
        return { y: Math.round(scrollY), out };
      },
      /* rendre tout le texte transparent, sans toucher à la mise en page */
      cacher(oui) {
        let st = document.getElementById('lm-sonde-fond-cache');
        if (oui && !st) {
          st = document.createElement('style'); st.id = 'lm-sonde-fond-cache';
          st.textContent = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}';
          document.head.appendChild(st);
          /* et la coquille posée PAR-DESSUS la page (barre du haut, filet de
             progression, bouton « haut de page »…), si elle ne porte pas de
             texte mesuré : un texte qui passe dessous
             est mesuré sur ce qu'il y a vraiment derrière lui — le fond. Sans
             cela, la barre de progression des gestes, de longueur différente
             d'une photographie à l'autre, passait pour une chute de 27 %. */
          for (const e of document.querySelectorAll('body *')) {
            if (e.closest('.fond')) continue;
            const p = getComputedStyle(e).position;
            /* un élément fixe qui porte lui-même un texte mesuré (la tranche de
               l'abécédaire) reste : c'est sur SON fond que ce texte se lit */
            if (e.matches('.topbar') || (p === 'fixed' && !(e.textContent.trim() && !e.closest('.topbar,.sidebar')))) { e.dataset.lmSondeCache = e.style.visibility || '-'; e.style.visibility = 'hidden'; }
          }
        } else if (!oui && st) {
          st.remove();
          for (const e of document.querySelectorAll('[data-lm-sonde-cache]')) { e.style.visibility = e.dataset.lmSondeCache === '-' ? '' : e.dataset.lmSondeCache; delete e.dataset.lmSondeCache; }
        }
      }
    };
    return;
  }

  /* ================= LE BANC (node) ================= */
  const path = require('path'), fs = require('fs');
  const { spawn } = require('child_process');
  const { createRequire } = require('module');
  const SITE = path.resolve(__dirname, '..');
  const JEU = process.env.CIRCUIT_REPO || path.join(process.env.HOME, 'Desktop/circuit-du-capital');
  const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const opt = n => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : null; };
  const flag = n => process.argv.includes('--' + n);
  const PAGES = (opt('pages') || ['/a-propos', '/mentions-legales', '/agregation-2027', '/commentaires/hieroglyphe-social',
    '/oeuvres/capital-1/chapitre-10', '/oeuvres/forum', '/oeuvres/messages', '/glossaire/', '/nexiste-pas'].join(',')).split(',');
  const MODES = (opt('modes') || 'bougie,jour,edition').split(',');
  const LARGEURS = (opt('largeurs') || '375,1280').split(',').map(Number);
  const POS = (opt('pos') || '0,0.5,1').split(',').map(Number);
  const CAPT = opt('captures'); if (CAPT) fs.mkdirSync(CAPT, { recursive: true });
  const T = 4321;                                      /* l'instant figé : le même partout */
  const SOI = fs.readFileSync(__filename, 'utf8');

  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const sur = (fg, bg) => fg.c.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));

  (async () => {
    const require2 = createRequire(path.join(JEU, 'package.json'));
    const puppeteer = require2('puppeteer-core');
    const port = String(8600 + Math.floor(Math.random() * 90));
    const srv = spawn(process.execPath, [path.join(SITE, 'tools/serveur.mjs'), port], { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 600));
    const ORIGIN = 'http://127.0.0.1:' + port;
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--window-size=1400,1000'] });
    let echecs = 0;
    const bilan = {};

    async function ouvrir(p, mode, largeur, extra) {
      const page = await browser.newPage();
      const err = []; page.on('pageerror', e => err.push(String(e.message).slice(0, 140)));
      await page.setViewport({ width: largeur, height: largeur < 600 ? 812 : 900, deviceScaleFactor: 1, isMobile: largeur < 600, hasTouch: largeur < 600 });
      await page.evaluateOnNewDocument(m => { try { localStorage.setItem('liremarx.mode.v1', m); localStorage.removeItem('liremarx.fond.v1'); } catch (e) {} }, mode);
      await page.goto(ORIGIN + p + (extra || ''), { waitUntil: 'networkidle2', timeout: 45000 }).catch(e => err.push('goto ' + e.message.slice(0, 60)));
      /* les polices d'abord : la première page d'une session les télécharge,
         et leur arrivée remet en page le texte APRÈS la première mesure — on
         prendrait ce changement de la page pour une irréversibilité du fond */
      await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
      await new Promise(r => setTimeout(r, 1300));
      /* les révélations au défilement : on les achève, comme tools/sonde.js */
      await page.evaluate(() => {
        const st = document.createElement('style');
        st.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important}';
        document.head.appendChild(st);
        document.querySelectorAll('.reveal,.reveal-stagger').forEach(e => e.classList.add('in'));
      });
      await page.evaluate(SOI);
      return { page, err };
    }
    const aller = (page, q) => page.evaluate(async q => {
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      scrollTo(0, Math.round(max * q)); await new Promise(r => setTimeout(r, 350));
      return Math.round(scrollY);
    }, q);
    /* les photographies sont décodées par un onglet à part (le site n'a pas de
       décodeur PNG, et l'on n'en ajoute pas) : il rend les pixels demandés */
    const atelier = await browser.newPage();
    const photo = page => page.screenshot({ type: 'png', encoding: 'base64' });
    const lirePixels = (b64, pts) => atelier.evaluate(async (b64, pts) => {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, im.width, im.height).data;
      return pts.map(([x, y]) => { const i = (y * im.width + x) * 4; return [d[i], d[i + 1], d[i + 2]]; });
    }, b64, pts);
    const empreinte = page => page.evaluate(() => LM_SONDE_FOND.empreinte());
    /* deux empreintes : égales si chaque couche est à la même place, et si ses
       pixels ne s'écartent nulle part de plus de 2 niveaux sur 255 (le flou
       d'un canvas n'est pas reproductible au bit près d'un passage à l'autre) */
    const diff = (a, b) => {
      if (!a || !b) return 'absent';
      if (a.y !== b.y) return 'position ' + a.y + ' ≠ ' + b.y;
      const bad = [];
      a.out.forEach((A, i) => {
        const B = b.out[i]; if (!B || A.nom !== B.nom) { bad.push('couches'); return; }
        if (A.style !== B.style) { bad.push(A.nom + ' (place)'); return; }
        if (A.data) {
          const x = Buffer.from(A.data, 'base64'), y = Buffer.from(B.data || '', 'base64');
          if (x.length !== y.length) { bad.push(A.nom + ' (taille)'); return; }
          let m = 0; for (let k = 0; k < x.length; k++) { const d = Math.abs(x[k] - y[k]); if (d > m) m = d; }
          if (m > 2) bad.push(A.nom + ' (écart ' + m + ')');
        }
      });
      return bad.join(', ');
    };

    try {
      if (flag('cout')) {
        for (const largeur of LARGEURS) for (const mode of MODES) for (const p of PAGES) {
          const { page } = await ouvrir(p, mode, largeur, '?fond=logiciel');
          const r = await page.evaluate(async () => {
            const F = window.LM_FOND; if (!F || F.etat().effectif === 'absent') return null;
            F.figer(1); const ms = [];
            const max = document.documentElement.scrollHeight - innerHeight;
            for (let k = 0; k < 40; k++) {
              scrollTo(0, Math.round(max * k / 39)); await new Promise(r => setTimeout(r, 16));
              const t0 = performance.now(); F.figer(1000 + k * 33); ms.push(performance.now() - t0);
            }
            ms.sort((a, b) => a - b);
            const t0 = performance.now(); for (let k = 0; k < 40; k++) F.image(2000 + k * 33); const image = (performance.now() - t0) / 40;
            /* une image de défilement : la page a bougé, le voile est repeint (sans remesurer les zones) */
            const md = [];
            for (let k = 0; k < 40; k++) { scrollTo(0, Math.round(max * k / 39)); const t1 = performance.now(); F.image(3000 + k * 33); md.push(performance.now() - t1); }
            md.sort((a, b) => a - b);
            const m = F.mesure();
            return { image_repos_ms: +image.toFixed(3), image_defilement_ms: +md[20].toFixed(2), defilement_max_ms: +md[39].toFixed(2), zones_ms: +ms[20].toFixed(2), zones: m.zones, grains: m.grains };
          });
          console.log('coût ' + mode.padEnd(8) + String(largeur).padStart(5) + '  ' + p.padEnd(34) + ' ' + JSON.stringify(r));
          await page.close();
        }
      }
      if (flag('graine') || flag('reversible')) {
        for (const largeur of LARGEURS) for (const mode of MODES) for (const p of PAGES) {
          const { page } = await ouvrir(p, mode, largeur);
          const ok = await page.evaluate(() => !!(window.LM_FOND && window.LM_FOND.etat().effectif !== 'absent'));
          if (!ok) { await page.close(); continue; }
          await aller(page, .4); await page.evaluate(t => LM_FOND.figer(t), T);
          const a = await empreinte(page);
          let ligne = mode.padEnd(8) + String(largeur).padStart(5) + '  ' + p.padEnd(34);
          if (flag('reversible')) {
            for (const q of [1, 0, .75, .1]) { await aller(page, q); await page.evaluate(t => LM_FOND.figer(t), T + 999); }
            await aller(page, .4); await page.evaluate(t => LM_FOND.figer(t), T);
            const b = await empreinte(page);
            { const d = diff(a, b); ligne += ' réversible ' + (d ? 'NON (' + d + ')' : 'oui'); if (d) echecs++; }
          }
          if (flag('graine')) {
            /* une seconde visite, dans un onglet neuf (un rechargement garde des
               restes de l'émulation de l'appareil, et la taille de la fenêtre
               peut changer d'un pixel) */
            const { page: p2 } = await ouvrir(p, mode, largeur);
            await aller(p2, .4); await p2.evaluate(t => LM_FOND.figer(t), T);
            const c = await empreinte(p2);
            await p2.close();
            { const d = diff(a, c); ligne += '  graine ' + (d ? 'NON (' + d + ')' : 'oui'); if (d) echecs++; }
          }
          console.log(ligne);
          await page.close();
        }
      }
      if (!flag('cout') && !flag('graine') && !flag('reversible')) {
        for (const largeur of LARGEURS) for (const mode of MODES) for (const p of PAGES) {
          const { page, err } = await ouvrir(p, mode, largeur);
          const etat = await page.evaluate(() => window.LM_FOND ? window.LM_FOND.etat() : null);
          if (!etat || etat.effectif === 'absent') { console.log('· ' + mode.padEnd(8) + String(largeur).padStart(5) + '  ' + p.padEnd(34) + ' (pas de fond)'); await page.close(); continue; }
          for (const q of POS) {
            const y = await aller(page, q);
            await page.evaluate(t => LM_FOND.figer(t), T);
            const pts = await page.evaluate(() => LM_SONDE_FOND.points());
            await page.evaluate(() => LM_SONDE_FOND.cacher(true));
            await new Promise(r => setTimeout(r, 60));
            const avec = await photo(page);
            if (CAPT) fs.writeFileSync(path.join(CAPT, (p.replace(/\//g, '_') || '_') + '-' + mode + '-' + largeur + '-' + q + '-fond.png'), Buffer.from(avec, 'base64'));
            /* sans le fond : la page telle qu'elle était */
            await page.evaluate(() => LM_FOND.regler('aucun'));
            await new Promise(r => setTimeout(r, 60));
            const sans = await photo(page);
            await page.evaluate(() => { LM_SONDE_FOND.cacher(false); LM_FOND.regler('anime'); });
            await page.evaluate(t => { scrollTo(0, scrollY); LM_FOND.figer(t); }, T);
            const tous = pts.flatMap(P => P.pts), PA = await lirePixels(avec, tous), PB = await lirePixels(sans, tous);
            let n = 0, pire = null, chute = 0, chuteOu = null, k0 = 0;
            for (const P of pts) {
              let cMin = 99, base = 99;
              for (const [x, yy] of P.pts) {
                const a = PA[k0], b = PB[k0]; k0++;
                const ca = ratio(sur(P.fg, a), a), cb = ratio(sur(P.fg, b), b); n++;
                if (ca < cMin) { cMin = ca; base = cb; }
                const ch = 1 - ca / cb; if (ch > chute) { chute = ch; chuteOu = { ou: P.ou, texte: P.texte, avec: +ca.toFixed(2), sans: +cb.toFixed(2), x, y: yy, pa: a.join(','), pb: b.join(',') }; }
              }
              const seuil = P.grand ? 3 : 4.5;
              /* un échec DÛ AU FOND : sous le seuil avec lui, au-dessus sans lui */
              if (cMin < seuil && base >= seuil) { if (!pire || cMin < pire.c) pire = { c: +cMin.toFixed(2), sans: +base.toFixed(2), seuil, ou: P.ou, texte: P.texte }; }
            }
            const ech = pire ? 1 : 0; echecs += ech;
            const k = mode + ' ' + largeur; bilan[k] = bilan[k] || { mesures: 0, chute: 0, echecs: 0 };
            bilan[k].mesures += n; bilan[k].chute = Math.max(bilan[k].chute, chute); bilan[k].echecs += ech;
            console.log((ech ? '✗ ' : '✓ ') + mode.padEnd(8) + String(largeur).padStart(5) + '  ' + p.padEnd(34) + ' y=' + String(y).padStart(5) + '  ' + n + ' points, chute max ' + (chute * 100).toFixed(1) + ' %' +
              (chuteOu && chute > .02 ? '  (' + chuteOu.ou + ' « ' + chuteOu.texte + ' » ' + chuteOu.sans + ' → ' + chuteOu.avec + (flag('detail') ? ' en ' + chuteOu.x + ',' + chuteOu.y + ' : ' + chuteOu.pb + ' → ' + chuteOu.pa : '') + ')' : '') +
              (pire ? '  ÉCHEC ' + pire.c + ' < ' + pire.seuil + ' (sans fond ' + pire.sans + ') ' + pire.ou + ' « ' + pire.texte + ' »' : '') + (err.length ? '  JS: ' + err[0] : ''));
          }
          await page.close();
        }
        console.log('\nBilan : ' + Object.entries(bilan).map(([k, v]) => k + ' ' + v.mesures + ' points, chute max ' + (v.chute * 100).toFixed(1) + ' %, ' + v.echecs + ' échec(s)').join(' · '));
      }
    } finally { await browser.close(); srv.kill(); }
    process.exit(echecs ? 1 : 0);
  })().catch(e => { console.error(e); process.exit(2); });
})();
