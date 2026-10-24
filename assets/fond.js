/* ============================================================
   LE FOND — « la circulation ». Mission `fond-circulation`, oct. 2026
   (remplace « la journée », jugé trop discret : on ne le voyait pas).
   Canvas 2D, vanille, sans dépendance. Ses jetons : /assets/fond.css.

   CE QU'IL DIT. Le Capital s'ouvre sur une « immense accumulation de
   marchandises » et se démontre par un circuit : A — M — A′, l'argent qui
   revient GROSSI. La scène est celle du premier écran de GeoInvader, dite
   dans la langue du livre (demande du propriétaire, 24 oct. 2026) :
     LA POUSSIÈRE D'OR — le ciel : un champ de grains semés en trois
       profondeurs, qui dérivent, glissent en parallaxe et scintillent.
     LE MARCHÉ — une formation de marchandises dessinées en points (l'habit,
       la toile, le froment, le fer, le diamant, la table qui danse, la
       montre, les souliers) glisse d'un bord à l'autre en deux poses et
       descend lentement. En bas, LA PIÈCE A suit le curseur, sinon vise la
       marchandise libre la plus proche, et tire. La marchandise atteinte
       passe à l'or, une onde part, « A′ » monte, et la pièce grossit d'un
       cran à chaque vente. Aux trois quarts vendue, la formation s'efface et
       le cycle recommence. Elle vit derrière TOUTE la page et s'efface sous
       le texte : on la voit passer dans les marges et les blancs, et l'on ne
       tire que sur ce qu'on voit. Pas sous 760 px : il n'y a pas de marge.
   (Avant elle : les pièces A, A′, A″ dans la marge, et des mots qui
   montaient seuls de la poussière. Elles sont devenues la pièce qui tire, les
   mots sont devenus « A′ ».) La position de la formation est une fonction du
   temps ; ce qui est vendu, les tirs et les éclats sont un état. Figée
   (figer, réglage immobile, mouvement réduit), l'image redevient une
   fonction de t : la formation semée, la pièce au centre, aucun tir.

   LES MODES (html[data-mode], événement `lm:mode`) :
     bougie  — grains d'or qui luisent ; vendues, les marchandises passent
               de l'éclat à l'or, avec leur halo.
     jour    — des grains et des marchandises d'ocre, sans lueur.
     edition — un imprimé : poussière et formation IMMOBILES, en pointillé
               d'encre, sur le papier vergé ; c'est le LECTEUR qui vend —
               la part de marchandises passées au rouge de rubrique suit la
               lecture (jusqu'aux quatre cinquièmes en bas de page).

   LE HASARD EST SEMÉ (graine 1867, l'édition allemande du Livre I) : même
   champ, même chaîne, mêmes mots à chaque visite. Aucun Math.random.

   LES ÉGARDS. Un VOILE (masque à un quart de résolution) éteint tout ce qui
   passerait sous un texte : presque entièrement sous les colonnes de
   lecture, aux trois quarts sous tout bloc qui porte du texte ; la scène
   est passée deux fois au masque en destination-out (~99 % effacé).
   Mouvement réduit, économie de données, réglage « immobile » : une image
   fixe. Onglet masqué : rien ne tourne. Densité de pixels plafonnée à 1,5.

   OÙ. Liste ICI : à propos, mentions, l'agrégation et les commentaires, les
   chapitres expliqués, le forum, la messagerie, l'index du glossaire, la
   404. JAMAIS l'accueil, la bibliothèque, /karl-marx, le carnet, les
   ateliers, le jeu, les pages de notion (glossaire/fond.js). Une page le
   refuse par body[data-fond="aucun"].

   L'API (inchangée) :
     LM_FOND.regler('anime' | 'fixe' | 'aucun')   mémorisé (liremarx.fond.v1)
     LM_FOND.reglage()   LM_FOND.etat()   { reglage, effectif, raison, mode }
     LM_FOND.remesurer() LM_FOND.image(t)   LM_FOND.figer(t) / figer(null)
     LM_FOND.mesure()    ?fond=logiciel (chaque image forcée jusqu'au pixel)
   Chaque changement émet `lm:fond` sur document, detail = etat().
   ============================================================ */
(function () {
  'use strict';
  if (window.LM_FOND) return;
  const html = document.documentElement;
  const CLE = 'liremarx.fond.v1';
  const GRAINE = 1867;
  const LOGICIEL = /[?&]fond=logiciel/.test(location.search);

  /* ---------- où il se monte ---------- */
  const ICI = [
    /^\/a-propos\/?$/, /^\/mentions-legales\/?$/, /^\/agregation-2027\/?$/,
    /^\/commentaires\/[^/]+\/?$/, /^\/oeuvres\/capital-1\/chapitre-\d+\/?$/,
    /^\/oeuvres\/(forum|messages)\/?$/, /^\/glossaire\/?$/, /^\/glossaire\/index$/
  ];
  const SCENES = '[data-fond="aucun"],.nt-ambiance,.nt-fond,#hero-bg,#circuit-bg,.monde';
  const CALMES = '.nt-essai,.ap-corps,.ml-corps,.reader-content,[data-fond="calme"]';
  const HORS = '.topbar,.sidebar,.fond,script,style,noscript,template,svg,canvas,[hidden],.sr-only';
  function ici() {
    const p = location.pathname.replace(/\.html$/, '');
    if (ICI.some(r => r.test(p))) return true;
    return !!document.querySelector('.e-wrap .e-code');
  }

  const lire = () => { try { const v = localStorage.getItem(CLE); return v === 'fixe' || v === 'aucun' ? v : 'anime'; } catch (e) { return 'anime'; } };
  let reglage = lire();
  let absent = true;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)');
  const econome = !!(navigator.connection && navigator.connection.saveData);
  const modeDe = () => { const m = html.getAttribute('data-mode'); return m === 'jour' || m === 'edition' ? m : 'bougie'; };

  function etat() {
    const mode = modeDe();
    if (absent) return { reglage, effectif: 'absent', raison: 'page sans fond', mode };
    if (reglage === 'aucun') return { reglage, effectif: 'aucun', raison: 'réglage', mode };
    if (reglage === 'fixe') return { reglage, effectif: 'fixe', raison: 'réglage', mode };
    if (reduit.matches) return { reglage, effectif: 'fixe', raison: 'mouvement réduit', mode };
    if (econome) return { reglage, effectif: 'fixe', raison: 'économie de données', mode };
    if (mode === 'edition') return { reglage, effectif: 'fixe', raison: 'un imprimé ne bouge pas', mode };
    return { reglage, effectif: 'anime', raison: '', mode };
  }
  const annonce = () => document.dispatchEvent(new CustomEvent('lm:fond', { detail: etat() }));
  const stats = { n: 0, tot: 0, max: 0 };
  const api = {
    regler(v) {
      if (v !== 'anime' && v !== 'fixe' && v !== 'aucun') return etat();
      reglage = v;
      try { if (v === 'anime') localStorage.removeItem(CLE); else localStorage.setItem(CLE, v); } catch (e) {}
      if (!absent) appliquer();
      annonce();
      return etat();
    },
    reglage: () => reglage,
    etat,
    remesurer() { if (absent || !actif) return null; mesurerZones(); voileY = NaN; rendre(performance.now(), true); return api.mesure(); },
    mesure: () => ({
      images: stats.n, ms_moyen: stats.n ? +(stats.tot / stats.n).toFixed(3) : 0, ms_max: +stats.max.toFixed(3),
      mode: dessin, grains: grains.length, marchandises: lit.length, scene, vendues: Array.prototype.reduce.call(vendu, (a, b) => a + b, 0), generation: gen,
      zones: [calmes.length, voiles.length], zones_ms: +zonesMs.toFixed(1), collants: voiles.filter(z => z.el).length
    }),
    image(t) { if (absent || !actif) return null; sL = window.scrollY; rendre(t == null ? performance.now() : t, true); return api.mesure(); },
    figer(t) {
      if (absent || !actif) return null;
      if (t == null) { fige = false; dernier = 0; relancer(); return api.mesure(); }
      fige = true; tFige = t; arreter(); mesurerZones(); sL = window.scrollY; rendre(t, true); return api.mesure();
    }
  };
  window.LM_FOND = api;

  /* ---------- le hasard SEMÉ ---------- */
  function semis(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const hache = (k, i) => (Math.imul(i + 1, 73856093) ^ Math.imul(k + 1, 19349663) ^ GRAINE) | 0;
  const lisse = t => t * t * (3 - 2 * t);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- les jetons ---------- */
  let J = {};
  function rgb(v, d) { const m = String(v || '').match(/[\d.]+/g); return m && m.length >= 3 ? m.slice(0, 3).map(Number) : d; }
  function jetons() {
    const cs = getComputedStyle(html), g = n => cs.getPropertyValue(n), num = (n, d) => { const x = parseFloat(g(n)); return isFinite(x) ? x : d; };
    J = {
      papier: rgb(cs.backgroundColor, [21, 16, 11]),
      or: rgb(g('--fond-or'), [216, 173, 76]), orA: num('--fond-or-a', .7),
      eclat: rgb(g('--fond-eclat'), [255, 222, 160]), lueur: num('--fond-lueur', 1),
      fil: rgb(g('--fond-fil'), [213, 64, 47]), filA: num('--fond-fil-a', .85),
      mot: rgb(g('--fond-mot'), [216, 173, 76]), motA: num('--fond-mot-a', .9),
      vit: num('--fond-vit', 1),
      vergeure: rgb(g('--fond-vergeure'), [40, 30, 18]), vergeureA: num('--fond-vergeure-a', 0),
      serif: "'Fraunces',Georgia,serif",
      sbw: (() => { const s = document.querySelector('.sidebar'); if (!s) return 0; const r = s.getBoundingClientRect(); return r.right > 0 && r.left < 1 && getComputedStyle(s).visibility !== 'hidden' ? Math.round(r.right) : 0; })()
    };
  }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (+a).toFixed(4) + ')';

  /* ---------- l'état ---------- */
  const boite = document.createElement('div');
  boite.className = 'fond'; boite.setAttribute('aria-hidden', 'true');
  const cv = document.createElement('canvas'), vv = document.createElement('canvas');
  cv.className = 'fond-champ';
  const ctx = cv.getContext('2d', LOGICIEL ? { willReadFrequently: true } : undefined);
  const vtx = vv.getContext('2d', { willReadFrequently: true });
  let masque = null;
  let W = 0, H = 0, D = 1, dessin = 'bougie', grains = [], calmes = [], voiles = [], docH = 0;
  let sL = window.scrollY, raf = 0, repos = 0, dernier = 0, actif = false, mode = 'anime', voileY = NaN, zonesMs = 0;
  const DPR = 1.5, VOILE = .25;
  let spriteEclat = null;

  function construire() {
    jetons();
    dessin = modeDe();
    W = window.innerWidth; H = window.innerHeight;
    D = Math.min(DPR, window.devicePixelRatio || 1);
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    vv.width = Math.ceil(W * VOILE); vv.height = Math.ceil(H * VOILE);
    if (dessin === 'edition' && J.vergeureA > 0) html.style.setProperty('--fond-verge', 'url(' + verge() + ')');
    else html.style.removeProperty('--fond-verge');
    spriteEclat = eclat();
    semer(); mesurerZones(); mesurerScene();
  }

  /* L'ÉCLAT d'un grain qui luit : un petit halo pré-rendu, posé sans mise à
     l'échelle (shadowBlur coûte plus cher pour la même lueur) */
  function eclat() {
    const n = Math.ceil(26 * D), c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'), m = n / 2, gr = g.createRadialGradient(m, m, 0, m, m, m);
    gr.addColorStop(0, rgba(J.eclat, .9)); gr.addColorStop(.18, rgba(J.or, .45)); gr.addColorStop(.5, rgba(J.or, .1)); gr.addColorStop(1, rgba(J.or, 0));
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return c;
  }

  /* LE PAPIER VERGÉ (l'édition) : vergeures et pontuseaux, une tuile semée
     posée en fond de html — elle défile avec la feuille sans rien repeindre. */
  const TW = 552, PERIODE = 240;
  function verge() {
    const te = Math.min(2, window.devicePixelRatio || 1);
    const tuile = document.createElement('canvas');
    tuile.width = Math.round(TW * te); tuile.height = Math.round(PERIODE * te);
    const t = tuile.getContext('2d'); t.scale(te, te);
    const r = semis(hache(9, 0)), a = J.vergeureA;
    for (let y = 2; y < PERIODE; y += 4) {
      const w = .55 + r() * .5, al = a * (.3 + r() * .25), ph = r() * 6.283;
      t.strokeStyle = rgba(J.vergeure, al); t.lineWidth = w; t.beginPath();
      for (let x = 0; x <= TW; x += 12) { const yy = y + .35 * Math.sin(x / TW * 6.283 * 4 + ph); if (x) t.lineTo(x, yy); else t.moveTo(x, yy); }
      t.stroke();
    }
    for (let k = 0; k < 6; k++) {
      const x = 46 + k * 92 + (r() - .5) * 5;
      /* le pontuseau : à moitié de la force qu'il avait dans « la journée »,
         dont le voile doux l'atténuait sous le texte ; ici il passe dessous
         tel quel (mesuré : 12,6 % de contraste perdu sous une lettre) */
      for (const [dx, lw, f] of [[0, 1, .45], [-2.4, 2.6, .16], [2.4, 2.6, .16]]) {
        t.strokeStyle = rgba(J.vergeure, a * f * (.8 + r() * .3)); t.lineWidth = lw; t.beginPath();
        for (let y = 0; y <= PERIODE; y += 10) { const xx = x + dx + .6 * Math.sin(y / PERIODE * 6.283 * 2 + k); if (y) t.lineTo(xx, y); else t.moveTo(xx, y); }
        t.stroke();
      }
    }
    return tuile.toDataURL('image/png');
  }

  /* LA POUSSIÈRE D'OR. Trois profondeurs : le lointain (petit, pâle, lent),
     le milieu, le proche (plus gros, plus vif, quelques-uns luisent). Chaque
     grain glisse en parallaxe au défilement (z × la position), dérive en
     deux sinus et monte doucement dans l'air chaud ; la fenêtre est un tore,
     un grain qui sort en haut revient en bas. */
  function semer() {
    grains = [];
    if (!(J.orA > 0)) return;
    const n = Math.round(clamp(W * H / 2900, 130, 480));
    for (let i = 0; i < n; i++) {
      const r = semis(hache(3, i)), c = r();
      const couche = c < .5 ? 0 : (c < .85 ? 1 : 2);
      const z = [.18, .42, .8][couche];
      grains.push({
        u: r(), v: r(), couche, z,
        s: [1, 1.5, 2.2][couche] * (.75 + r() * .6),
        a: r() * 6.283, b: r() * 6.283, c: r() * 6.283,
        tw: 900 + r() * 2600, mont: (.003 + r() * .007) * (.5 + z),
        luit: couche === 2 && r() < .32, k: r()
      });
    }
  }
  function placer(G, t, s) {
    const HH = H + 40, WW = W + 40;
    let x = G.u * WW - 20 + 18 * G.z * Math.sin(t / 9100 + G.a) + 7 * Math.sin(t / 3330 + G.b);
    let y = G.v * HH - s * .28 * G.z + 14 * G.z * Math.sin(t / 7700 + G.c) - t * G.mont * J.vit;
    y = ((y % HH) + HH) % HH - 20;
    x = ((x + 20) % WW + WW) % WW - 20;
    return [x, y];
  }

  /* LES ZONES de texte (le voile), et LA MARGE du circuit. */
  function mesurerZones() {
    const t0 = performance.now();
    const sy = window.scrollY, sx = window.scrollX, memo = new Map();
    const collant = e => {
      for (let n = e; n && n !== document.body; n = n.parentElement) {
        if (memo.has(n)) return memo.get(n);
        const p = getComputedStyle(n).position;
        if (p === 'sticky' || p === 'fixed') { memo.set(n, true); return true; }
      }
      return false;
    };
    const rect = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left + sx), y: Math.round(b.top + sy), w: Math.round(b.width), h: Math.round(b.height), el: collant(e) ? e : null }; };
    const els = [...document.querySelectorAll(CALMES)].filter(e => !e.parentElement.closest(CALMES) && !e.closest(HORS));
    calmes = els.map(rect).filter(b => b.w > 0 && b.h > 0);
    const blocs = new Set(), tw = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeType === 1 ? (n.matches(CALMES) || n.matches(HORS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP)
        : (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)
    });
    while (tw.nextNode()) {
      let e = tw.currentNode.parentElement;
      while (e && e !== document.body && getComputedStyle(e).display.startsWith('inline')) e = e.parentElement;
      if (e && e !== document.body) blocs.add(e);
    }
    voiles = [...blocs].map(rect).filter(b => b.w > 0 && b.h > 0);
    for (const e of document.querySelectorAll('main svg, main canvas, main img')) { const b = rect(e); if (b.w > 120 && b.h > 80) voiles.push(b); }
    zonesMs = performance.now() - t0; voileY = NaN;
    docH = document.documentElement.scrollHeight;
  }

  /* la couverture du voile au point (0 : blanc de page, 1 : sous un texte) */
  const sousTexte = (x, y) => {
    if (!masque) return 0;
    const mx = Math.min(vv.width - 1, Math.max(0, x * VOILE | 0)), my = Math.min(vv.height - 1, Math.max(0, y * VOILE | 0));
    return masque[(my * vv.width + mx) * 4 + 3] / 255;
  };

  /* LE MARCHÉ — la scène, reprise du premier écran de GeoInvader et dite
     dans la langue du livre. Une formation de marchandises dessinées en
     points (celles du chapitre I : l'habit, la toile, le froment, le fer, le
     diamant, la table — qui danse —, la montre, les souliers) glisse d'un
     bord à l'autre, deux poses qui alternent, et descend lentement. En bas,
     LA PIÈCE A : elle suit le curseur, sinon vise la marchandise libre la plus
     proche, et tire une pièce. La marchandise atteinte passe à l'or, une
     onde part, « A′ » monte — et la pièce A grossit d'un cran à chaque vente :
     l'argent qui revient grossi. Aux trois quarts vendue, la formation
     s'efface et le cycle recommence, la pièce revenue à sa taille.
     Elle vit derrière toute la page, et comme la poussière elle s'efface sous
     le texte (le voile, en destination-out) : on la voit passer dans les
     marges et les blancs. On ne tire que sur ce qu'on voit. */
  const SPR = {
    table: [['00000000000', '11111111111', '11111111111', '01000000010', '01000000010', '01000000010', '01000000010', '01000000010'],
            ['11111111111', '11111111111', '01000000010', '01000000010', '01000000010', '00100000100', '00100000100', '00000000000']],
    habit: [['00110001100', '01111011110', '11111111111', '11011111011', '11011111011', '11011111011', '00011111000', '00011011000'],
            ['00110001100', '01111011110', '11111111111', '11011111011', '01011111010', '01011111010', '00011111000', '00011011000']],
    toile: [['00111111100', '01000000010', '10011111001', '10000000001', '01000000010', '00111111100', '00000111111', '00000111111'],
            ['00111111100', '01000000010', '10011111001', '10000000001', '01000000010', '00111111100', '00000111110', '00000011111']],
    froment: [['00010001000', '00001010000', '00000100000', '00111111100', '01111111110', '11111111111', '11111111111', '01111111110'],
              ['00100010000', '00010100000', '00000100000', '00111111100', '01111111110', '11111111111', '11111111111', '01111111110']],
    fer: [['00000000000', '11111111100', '01111111111', '00011111000', '00001110000', '00001110000', '00011111000', '00111111100'],
          ['00000010100', '11111111100', '01111111111', '00011111000', '00001110000', '00001110000', '00011111000', '00111111100']],
    diamant: [['00111111100', '01101010110', '11111111111', '01110101110', '00111011100', '00011111000', '00001110000', '00000100000'],
              ['00111111101', '01101010110', '11111111111', '01110101110', '00111011100', '00011111000', '00001110000', '00000100000']],
    montre: [['00001110000', '00000100000', '00111111100', '01100100110', '01000100010', '01000011010', '01100000110', '00111111100'],
             ['00001110000', '00000100000', '00111111100', '01100000110', '01011100010', '01000100010', '01100000110', '00111111100']],
    souliers: [['01100001100', '01100001100', '01100001100', '01100001100', '01110001110', '01111001111', '01111001111', '00000000000'],
               ['01100000000', '01100001100', '01100001100', '01110001100', '01111001100', '01111001110', '00000001111', '00000001111']]
  };
  const NOMS = Object.keys(SPR);
  const SW = 11, SH = 8;
  let px = 4, cols = 0, rangs = 0, x0z = 0, x1z = 0, sprites = {}, scene = false;
  let gen = 0, genT0 = 0, lit = new Float32Array(0), vendu = new Uint8Array(0), sortes = [];
  let fondu = 1, efface = false, tirA = 0, shipX = 0, cibleX = 0, sourisX = null, sourisT = -1e9, eclair = -1e9, ventes = 0, vide = 0, tPrec = 0;
  const tirs = [], eclats = [], ondes = [], etiquettes = [];
  const cw = () => 16 * px, chh = () => 13 * px;

  function sprite(rows, coul, lueur, dot) {
    const pad = lueur ? 6 * px : 0;
    const c = document.createElement('canvas');
    c.width = Math.ceil((SW * px + pad * 2) * D); c.height = Math.ceil((SH * px + pad * 2) * D);
    const g = c.getContext('2d'); g.scale(D, D);
    if (lueur) {
      g.shadowColor = rgba(J.or, .6 * J.lueur); g.shadowBlur = 3 * px * J.lueur;
      const gr = g.createLinearGradient(pad, pad, pad + SW * px, pad + SH * px);
      gr.addColorStop(0, rgba(coul[0], 1)); gr.addColorStop(1, rgba(coul[1], 1)); g.fillStyle = gr;
    } else g.fillStyle = rgba(coul, 1);
    const d = Math.max(1, px * dot), o = (px - d) / 2;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (rows[y][x] === '1') {
      if (dessin === 'edition' || !lueur) { g.beginPath(); g.arc(pad + x * px + px / 2, pad + y * px + px / 2, d / 2, 0, 6.2832); g.fill(); }
      else g.fillRect(pad + x * px + o, pad + y * px + o, d, d);
    }
    return c;
  }
  function peindreSprites() {
    sprites = {};
    if (!scene) return;
    /* vendue : l'éclat vers l'or (bougie), l'ocre (jour), le rouge de rubrique (édition) */
    const vend = dessin === 'edition' ? [J.fil, J.fil] : [J.eclat, J.or];
    for (const n of NOMS) for (let p = 0; p < 2; p++) {
      sprites[n + p] = sprite(SPR[n][p], J.or, false, dessin === 'jour' ? .5 : .42);
      sprites[n + p + 'v'] = sprite(SPR[n][p], vend, J.lueur > 0, .8);
    }
  }
  /* la formation d'une génération : les sortes et les marchandises déjà
     vendues au départ, semées (même formation au même rang) */
  function formation(g) {
    const N = cols * rangs, f = { lit: new Float32Array(N), vendu: new Uint8Array(N), sortes: [] };
    const r = semis(hache(21, g));
    for (let i = 0; i < N; i++) f.sortes.push(NOMS[(Math.floor(r() * NOMS.length) + i) % NOMS.length]);
    const graines = Math.max(2, Math.round(N * .1));
    for (let k = 0; k < graines; k++) { const i = Math.floor(r() * N); f.lit[i] = 1; f.vendu[i] = 1; }
    return f;
  }
  let F0 = null;                       /* la formation semée, pour les images figées */
  function poserFormation(g) {
    gen = g;
    const f = formation(g);
    lit = f.lit; vendu = f.vendu; sortes = f.sortes;
    ventes = 0; vide = 0; efface = false;
  }
  function mesurerScene() {
    scene = W >= 760 && J.orA > 0;
    if (!scene) { cols = rangs = 0; return; }
    px = W < 1100 ? 3.4 : 4;
    x0z = J.sbw + 14; x1z = W - 14;
    cols = Math.max(5, Math.floor(((x1z - x0z) * .97) / cw()));
    rangs = H < 720 ? 3 : 4;
    shipX = cibleX = (x0z + x1z) / 2;
    if (!genT0) genT0 = performance.now();
    peindreSprites();
    F0 = formation(0);
    poserFormation(gen);
  }

  /* la position est une FONCTION du temps (glissement en sinus, ralenti aux
     bords ; descente plafonnée) : figer(t) la redonne au pixel */
  const ampl = () => Math.max(px * 3, ((x1z - x0z) * .995 - cols * cw()) / 2);
  const BASE = 66;
  const descente = (t, t0) => Math.min(Math.max(0, t - t0) * .003, Math.max(0, H * .42 - (BASE + rangs * chh())));
  const posM = (i, t, t0 = genT0) => ({
    x: x0z + ((x1z - x0z) - cols * cw()) / 2 + Math.sin(t * .00032) * ampl() + (i % cols) * cw() + 2.5 * px,
    y: BASE + descente(t, t0) + Math.floor(i / cols) * chh()
  });
  const shipY = () => H * .9;
  const rayonA = () => 11 + 1.5 * Math.min(ventes, 8);
  /* une marchandise se voit-elle ? (centre et deux coins hors du voile) */
  const voit = (x, y) => sousTexte(x + SW * px / 2, y + SH * px / 2) < .3 && sousTexte(x, y) < .5 && sousTexte(x + SW * px, y + SH * px) < .5;

  function avancer(t, dt) {
    for (let i = 0; i < lit.length; i++) if (vendu[i] && lit[i] < 1) lit[i] = Math.min(1, lit[i] + dt / 420);
    let n = 0; for (let i = 0; i < vendu.length; i++) n += vendu[i];
    if (!efface && n / vendu.length > .75) efface = true;
    if (efface) { fondu = Math.max(0, fondu - dt / 700); if (fondu === 0) { genT0 = t; poserFormation(gen + 1); } }
    else if (fondu < 1) fondu = Math.min(1, fondu + dt / 900);

    /* la cible : la marchandise libre, visible, la plus proche de la pièce */
    let vise = -1, bd = Infinity;
    for (let i = 0; i < lit.length; i++) {
      if (vendu[i]) continue;
      const p = posM(i, t); if (!voit(p.x, p.y)) continue;
      const d = Math.abs(p.x + SW * px / 2 - shipX) + (rangs - Math.floor(i / cols)) * 30;
      if (d < bd) { bd = d; vise = i; }
    }
    /* plus rien à acheter à la vue : au bout de quatre secondes, la formation se renouvelle */
    if (vise < 0 && !efface) { vide += dt; if (vide > 4000) efface = true; } else vide = 0;
    if (sourisX != null && t - sourisT < 2200) cibleX = sourisX;
    else if (vise >= 0) cibleX = posM(vise, t).x + SW * px / 2;
    cibleX = clamp(cibleX, x0z + 20, x1z - 20);
    shipX += (cibleX - shipX) * Math.min(1, dt * .004);

    const libre = sousTexte(shipX, shipY()) < .3;
    if (!efface && libre && t > tirA && tirs.length < 2 && vise >= 0 && Math.abs(cibleX - shipX) < 30) {
      tirA = t + 1300 + semis(hache(23, Math.floor(t)))() * 900;
      tirs.push({ x: shipX, y: shipY() - rayonA() });
      eclair = t;
    }
    for (let s = tirs.length - 1; s >= 0; s--) {
      const T = tirs[s]; T.y -= dt * .55;
      let touche = -1;
      for (let i = lit.length - 1; i >= 0; i--) {
        if (vendu[i]) continue;
        const p = posM(i, t);
        if (T.x >= p.x - px && T.x <= p.x + (SW + 1) * px && T.y >= p.y && T.y <= p.y + SH * px && voit(p.x, p.y)) { touche = i; break; }
      }
      if (touche >= 0) {
        vendu[touche] = 1; ventes++;
        const p = posM(touche, t), cx = p.x + SW * px / 2, cy = p.y + SH * px / 2, r = semis(hache(29, ventes + gen * 97));
        for (let k = 0; k < 12; k++) { const a = r() * 6.2832, v = .03 + r() * .08; eclats.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 1 }); }
        ondes.push({ x: cx, y: cy, vie: 1 }); etiquettes.push({ x: cx, y: p.y - 4, vie: 1 });
        tirs.splice(s, 1);
      } else if (T.y < -20) tirs.splice(s, 1);
    }
    for (let k = eclats.length - 1; k >= 0; k--) { const P = eclats[k]; P.x += P.vx * dt; P.y += P.vy * dt; P.vy += .00008 * dt; P.vie -= dt / 900; if (P.vie <= 0) eclats.splice(k, 1); }
    for (let k = ondes.length - 1; k >= 0; k--) { ondes[k].vie -= dt / 600; if (ondes[k].vie <= 0) ondes.splice(k, 1); }
    for (let k = etiquettes.length - 1; k >= 0; k--) { etiquettes[k].vie -= dt / 1500; if (etiquettes[k].vie <= 0) etiquettes.splice(k, 1); }
  }

  function peindreMarche(t, vivant) {
    const pad = 6 * px, master = dessin === 'bougie' ? .78 : .9, pose = Math.floor(t / 620) & 1;
    /* figée (réglage immobile, mouvement réduit, édition, sonde) : la formation
       semée, la pièce au centre — l'image est une fonction de t */
    const L = vivant ? lit : F0.lit, SO = vivant ? sortes : F0.sortes, t0 = vivant ? genT0 : 0, fo = vivant ? fondu : 1;
    /* l'édition : c'est le LECTEUR qui vend — la part vendue suit la lecture */
    let part = -1;
    if (dessin === 'edition') { const max = Math.max(1, docH - H); part = clamp(window.scrollY / max, 0, 1) * .8; }
    for (let i = 0; i < L.length; i++) {
      const p = posM(i, t, t0), rg = Math.floor(i / cols), prof = .55 + (rg / Math.max(1, rangs - 1)) * .45;
      let l = L[i];
      if (part >= 0) l = semis(hache(31, i))() < part ? 1 : 0;
      const k = SO[i] + ((pose + i) & 1);
      if (l < 1) { ctx.globalAlpha = fo * master * (dessin === 'bougie' ? .6 : .58) * prof * (1 - l); ctx.drawImage(sprites[k], p.x, p.y, SW * px, SH * px); }
      if (l > 0) {
        const s = sprites[k + 'v'], pp = J.lueur > 0 ? pad : 0;
        ctx.globalAlpha = fo * master * .9 * (.7 + prof * .3) * l;
        ctx.drawImage(s, p.x - pp, p.y - pp, SW * px + pp * 2, SH * px + pp * 2);
      }
    }
    ctx.globalAlpha = 1;
    if (!vivant) { peindrePiece(t, (x0z + x1z) / 2, 0); return; }
    /* l'onde : un anneau de pièce qui s'élargit */
    ctx.strokeStyle = rgba(J.or, 1); ctx.lineWidth = 1;
    for (const O of ondes) { ctx.globalAlpha = O.vie * .6 * master; ctx.beginPath(); ctx.arc(O.x, O.y, (1 - O.vie) * 26 + 8, 0, 6.2832); ctx.stroke(); }
    /* les pièces tirées, leur traînée */
    for (const T of tirs) {
      const g = ctx.createLinearGradient(0, T.y, 0, T.y + 14 * px);
      g.addColorStop(0, rgba(J.eclat, .9)); g.addColorStop(1, rgba(J.or, 0));
      ctx.globalAlpha = master; ctx.fillStyle = g; ctx.fillRect(T.x - px * .35, T.y, px * .7, 14 * px);
      ctx.fillStyle = rgba(J.eclat, 1); ctx.beginPath(); ctx.arc(T.x, T.y, px * .9, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = rgba(J.or, 1);
    for (const P of eclats) { ctx.globalAlpha = Math.max(0, P.vie) * master; ctx.fillRect(Math.round(P.x / px) * px, Math.round(P.y / px) * px, px * .8, px * .8); }
    /* « A′ » monte au-dessus de la marchandise vendue */
    ctx.font = 'italic 600 ' + Math.max(13, Math.round(px * 3.6)) + 'px ' + J.serif;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = rgba(J.mot, 1);
    for (const E of etiquettes) { ctx.globalAlpha = Math.min(1, E.vie * 1.6) * J.motA; ctx.fillText('A′', E.x, E.y - (1 - E.vie) * 28); }
    ctx.globalAlpha = 1;
    peindrePiece(t, shipX, ventes);
  }
  /* LA PIÈCE A : deux anneaux et sa lettre ; elle s'éclaire à chaque tir */
  function peindrePiece(t, x, v) {
    const R = 11 + 1.5 * Math.min(v, 8), y = shipY(), fl = Math.max(0, 1 - (t - eclair) / 500);
    if (J.lueur > 0 && fl > .02) { ctx.globalAlpha = .9 * fl * J.lueur; ctx.drawImage(spriteEclat, x - R * 2.6, y - R * 2.6, R * 5.2, R * 5.2); }
    ctx.globalAlpha = Math.min(1, J.orA * 1.25) * (.85 + .15 * fl);
    ctx.strokeStyle = rgba(J.or, 1); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * .78, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = rgba(J.or, 1);
    ctx.font = 'italic 600 ' + Math.round(R * .9) + 'px ' + J.serif;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v ? 'A′' : 'A', x, y + R * .04);
    ctx.globalAlpha = 1;
  }

  /* ---------- une image ---------- */
  function rendre(t, force) {
    const t0 = performance.now();
    if (fige) { t = tFige; force = true; sL = window.scrollY; }
    if (window.innerWidth !== W || window.innerHeight !== H) { if (force) construire(); else reconstruire(); }
    const anime = mode === 'anime' && (force || !document.hidden);
    const tt = anime ? t : 0, s = anime ? sL : window.scrollY;
    const sy = window.scrollY;
    if (sy !== voileY) voiler();
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const lueur = J.lueur;
    /* la ligne de lecture, en coordonnées du document : une pièce s'allume
       quand on l'atteint (état fini : toutes) */

    /* 1. la poussière */
    if (grains.length) {
      const fixe = dessin === 'edition' || !anime;
      for (const G of grains) {
        const [x, y] = placer(G, fixe ? 0 : tt, s);
        if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
        /* sous un texte, la poussière ne s'atténue pas : elle s'efface */
        const cache = sousTexte(x, y); if (cache > .5) continue;
        const sc = fixe ? .55 : .5 + .5 * Math.sin(tt / G.tw + G.a);
        let a = J.orA * [.34, .58, .9][G.couche] * (.45 + .55 * sc) * (1 - cache * 1.8);
        if (a < .02) continue;
        if (G.luit && lueur > 0 && !fixe) {
          ctx.globalAlpha = Math.min(1, a * lueur * (.35 + .65 * sc * sc));
          ctx.drawImage(spriteEclat, x - spriteEclat.width / D / 2, y - spriteEclat.height / D / 2, spriteEclat.width / D, spriteEclat.height / D);
        }
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = rgba(G.luit && lueur > 0 ? J.eclat : J.or, 1);
        const z = G.s;
        if (dessin === 'edition') ctx.fillRect(x - z * .4, y - z * .4, z * .8, z * .8);
        else { ctx.beginPath(); ctx.arc(x, y, z * .5, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }

    /* 2. le marché, puis le voile : tout ce qui est dessiné s'efface sous le
       texte (le masque posé deux fois en destination-out : ~99 %) */
    if (scene && lit.length) {
      const vivant = anime && !fige && dessin !== 'edition';
      if (vivant) { const dt = Math.min(64, tPrec ? t - tPrec : 16); tPrec = t; avancer(t, dt); } else tPrec = 0;
      peindreMarche(vivant ? t : tt, vivant);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(vv, 0, 0, W, H); ctx.drawImage(vv, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (LOGICIEL) ctx.getImageData(0, 0, 1, 1);
    const ms = performance.now() - t0;
    stats.n++; stats.tot += ms; if (ms > stats.max) stats.max = ms;
  }

  /* LE VOILE : un masque (un quart de la résolution, jamais affiché) — presque
     entier sous les colonnes de lecture, aux trois quarts sous tout bloc qui
     porte un texte, en paliers de fondu. Chaque palier est UNE union de
     rectangles, un seul remplissage : deux paragraphes voisins ne se cumulent
     pas. */
  function voiler() {
    voileY = window.scrollY;
    vtx.setTransform(VOILE, 0, 0, VOILE, 0, 0);
    vtx.clearRect(0, 0, W, H);
    vtx.fillStyle = '#000';
    poser(vtx, calmes, [[44, .35], [26, .5], [10, .7], [-6, .95]]);
    poser(vtx, voiles, [[22, .35], [10, .55], [0, .85]]);
    vtx.globalAlpha = 1;
    masque = vtx.getImageData(0, 0, vv.width, vv.height).data;
  }
  function poser(c2, liste, paliers) {
    if (!liste.length) return;
    const sy = window.scrollY, sx = window.scrollX, vus = [];
    for (const c of liste) {
      let x = c.x - sx, y = c.y - sy, w = c.w, h = c.h;
      if (c.el) { const b = c.el.getBoundingClientRect(); x = Math.round(b.left); y = Math.round(b.top); w = Math.round(b.width); h = Math.round(b.height); }
      if (!(y > H + 60 || y + h < -60 || x > W + 60 || x + w < -60)) vus.push([x, y, w, h]);
    }
    if (!vus.length) return;
    for (const [m, a] of paliers) {
      c2.globalAlpha = a; c2.beginPath();
      for (const [x, y, w, h] of vus) {
        const yy = Math.max(-80, y - m), hh = Math.min(H + 80, y + h + m) - yy;
        if (hh <= 0) continue;
        if (c2.roundRect) c2.roundRect(x - m, yy, w + 2 * m, hh, Math.max(0, m)); else c2.rect(x - m, yy, w + 2 * m, hh);
      }
      c2.fill('nonzero');
    }
  }

  /* ---------- la boucle ----------
     Pendant le défilement une image par image (la parallaxe et les pièces suivent
     un défilement LISSÉ) ; au repos, une toutes les 50 ms suffit à la
     poussière et aux mots — le navigateur dort entre deux. */
  let besoin = false, fige = false, tFige = 0;
  function boucle(t) {
    raf = 0;
    if (!actif || fige || document.hidden || mode !== 'anime') return;
    const dt = Math.min(64, dernier ? t - dernier : 16);
    const ecart = window.scrollY - sL, bouge = Math.abs(ecart) > .4;
    if (bouge) sL += ecart * (1 - Math.pow(.86, dt / 16.7)); else sL = window.scrollY;
    rendre(t); dernier = t;
    if (bouge || besoin || (scene && dessin !== 'edition')) { besoin = false; raf = requestAnimationFrame(boucle); }
    else repos = setTimeout(() => { repos = 0; if (!raf) raf = requestAnimationFrame(boucle); }, 50);
  }
  const arreter = () => { if (raf) cancelAnimationFrame(raf); if (repos) clearTimeout(repos); raf = 0; repos = 0; };
  const relancer = () => {
    if (mode !== 'anime' || !actif || fige || document.hidden) return;
    if (repos) { clearTimeout(repos); repos = 0; }
    if (!raf) raf = requestAnimationFrame(boucle);
  };
  let fixeRaf = 0, finDefil = 0;
  const auDefilement = () => {
    if (!actif) return;
    clearTimeout(finDefil); finDefil = setTimeout(() => { if (actif) { mesurerZones(); voileY = NaN; if (mode !== 'anime') rendre(0); } }, 220);
    if (mode === 'anime') { besoin = true; relancer(); return; }
    if (!fixeRaf && !fige) fixeRaf = requestAnimationFrame(() => { fixeRaf = 0; rendre(0); });
  };

  function appliquer() {
    const e = etat().effectif;
    if (e === 'aucun' || e === 'absent') {
      actif = false; html.classList.remove('fond-on'); html.style.removeProperty('--fond-verge');
      arreter(); boite.remove(); return;
    }
    mode = e;
    if (!boite.isConnected) { boite.append(cv); document.body.insertBefore(boite, document.body.firstChild); }
    html.classList.add('fond-on');
    if (!actif) { actif = true; construire(); signature = signer(); }
    else if (dessin !== modeDe()) { construire(); signature = signer(); }
    sL = window.scrollY;
    rendre(performance.now());
    if (mode === 'anime') { dernier = 0; relancer(); } else arreter();
  }

  let attente = 0;
  const reconstruire = () => { clearTimeout(attente); attente = setTimeout(() => { if (!actif) return; construire(); rendre(performance.now()); }, 120); };
  let signature = '';
  const signer = () => { jetons(); const { sbw, ...k } = J; return modeDe() + JSON.stringify(k); };
  const aRepeindre = () => {
    if (absent) return;
    const e = etat().effectif;
    if ((e === 'anime' || e === 'fixe') !== actif || (actif && e !== mode)) { appliquer(); annonce(); return; }
    if (!actif) return;
    const s = signer(); if (s === signature) return;
    signature = s; construire(); rendre(performance.now());
  };

  function init() {
    absent = !ici() || !!document.querySelector(SCENES);
    if (absent) { annonce(); return; }
    appliquer(); annonce();
    addEventListener('scroll', auDefilement, { passive: true });
    addEventListener('resize', reconstruire);
    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { sourisX = e.clientX; sourisT = performance.now(); } }, { passive: true });
    document.addEventListener('pointerleave', () => { sourisX = null; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) arreter(); else if (actif) { rendre(performance.now()); dernier = 0; relancer(); } });
    document.addEventListener('lm:mode', aRepeindre);
    new MutationObserver(aRepeindre).observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    reduit.addEventListener && reduit.addEventListener('change', () => { appliquer(); annonce(); });
    if (window.ResizeObserver) {
      let t = 0; const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (actif) { mesurerZones(); auDefilement(); } }, 60); });
      ro.observe(document.body);
      const sb = document.querySelector('.sidebar'); if (sb) ro.observe(sb);
    }
    let fin = 0; const apres = () => { clearTimeout(fin); fin = setTimeout(() => { if (actif) { mesurerZones(); voileY = NaN; rendre(performance.now()); } }, 80); };
    document.addEventListener('transitionend', apres, true);
    document.addEventListener('animationend', apres, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (actif) { mesurerZones(); auDefilement(); } });
    addEventListener('load', () => { if (actif) { mesurerZones(); auDefilement(); } });
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
