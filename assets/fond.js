/* ============================================================
   LE FOND — « la circulation ». Mission `fond-circulation`, oct. 2026
   (remplace « la journée », jugé trop discret : on ne le voyait pas).
   Canvas 2D, vanille, sans dépendance. Ses jetons : /assets/fond.css.

   CE QU'IL DIT. Le Capital s'ouvre sur une « immense accumulation de
   marchandises » et se démontre par un circuit : A — M — A′, l'argent qui
   devient marchandise et revient GROSSI. Deux choses, donc :
     LA POUSSIÈRE D'OR — un champ de grains semés en trois profondeurs, à la
       façon du fond étoilé de GeoInvader : ils dérivent lentement, glissent
       en parallaxe au défilement, scintillent ; de temps en temps l'un d'eux
       s'allume dans un blanc de la page et un mot de Marx monte de lui
       (valeur, travail, marchandise…), puis s'efface.
     LE CIRCUIT — dans la marge la plus large, une chaîne qui descend avec la
       page : une pièce (A), une marchandise (la toile, l'habit, le fer, le
       froment, le thé), une pièce plus grande (A′), une autre marchandise,
       A″… Un FIL ROUGE les relie et se trace jusqu'à la ligne de lecture :
       on lit, le capital circule. Chaque nœud atteint s'allume, et à chaque
       retour de l'argent un « + Δ » monte : la plus-value.
   Tout ce qui dépend du défilement est une FONCTION de la position (on
   remonte, le fil se rembobine, les nœuds s'éteignent) ; seuls le
   scintillement, la dérive et les mots qui montent sont du temps.

   LES MODES (html[data-mode], événement `lm:mode`) :
     bougie  — grains d'or qui luisent, fil rouge avec sa lueur, pièces
               dorées : la pièce à la bougie.
     jour    — la poussière dans le jour : des grains d'ocre, sans lueur ;
               le fil rouge et les traits à l'encre.
     edition — un imprimé : la poussière devient un pointillé d'imprimerie,
               IMMOBILE (ni dérive, ni scintillement, ni mots), sur le papier
               vergé ; le fil, en rouge de rubrique, se trace toujours au fil
               de la lecture — c'est le lecteur qui le fait avancer.

   LE HASARD EST SEMÉ (graine 1867, l'édition allemande du Livre I) : même
   champ, même chaîne, mêmes mots à chaque visite. Aucun Math.random.

   LES ÉGARDS. Un VOILE (masque à un quart de résolution) éteint tout ce qui
   passerait sous un texte : presque entièrement sous les colonnes de
   lecture, aux trois quarts sous tout bloc qui porte du texte. Les mots ne
   naissent que dans un blanc. Mouvement réduit, économie de données,
   réglage « immobile » : une image fixe à l'état FINI (le fil entier, aucun
   mot). Onglet masqué : rien ne tourne. Densité de pixels plafonnée à 1,5.
   Le circuit ne se pose que s'il trouve une marge d'au moins 46 px et une
   fenêtre d'au moins 700 px ; sinon il reste la poussière.

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
  /* le fil suit-il la lecture ? Oui quand le fond s'anime, et dans l'édition
     (c'est le lecteur qui le fait avancer, rien ne bouge seul) ; non sous un
     réglage « immobile », le mouvement réduit ou l'économie : état fini. */
  const filSuit = () => { const e = etat(); return e.effectif === 'anime' || e.raison === 'un imprimé ne bouge pas'; };
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
      mode: dessin, grains: grains.length, noeuds: noeuds.length, marge: bande ? [Math.round(bande.x0), Math.round(bande.x1)] : null,
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
  const lerp = (a, b, t) => a + (b - a) * t;
  const lisse = t => t * t * (3 - 2 * t);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const cloche = x => { x = clamp(x, -1, 1); return .5 + .5 * Math.cos(Math.PI * x); };   /* 1 en 0, 0 en ±1 */

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
      trait: rgb(g('--fond-trait'), [243, 233, 212]), traitA: num('--fond-trait-a', .5),
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
  let W = 0, H = 0, D = 1, dessin = 'bougie', grains = [], calmes = [], voiles = [], noeuds = [], fil = [], bande = null, docH = 0;
  let sL = window.scrollY, raf = 0, repos = 0, dernier = 0, actif = false, mode = 'anime', voileY = NaN, zonesMs = 0;
  const DPR = 1.5, VOILE = .25, LIGNE = .58;                 /* la ligne de lecture : 58 % de la hauteur */
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
    semer(); mesurerZones();
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
    tracerCircuit();
  }

  /* LA MARGE : le bord droit de ce qu'on lit (le 9e décile des bords droits
     des blocs, colonne et marge collante comprises) et son bord gauche ; on
     prend la plus large des deux marges qui restent. */
  function trouverBande() {
    if (W < 700) return null;
    const blocs = calmes.concat(voiles).filter(b => b.w >= 200 && b.x + b.w > J.sbw + 40);
    if (!blocs.length) return null;
    const dec = (arr, q) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
    const droite = dec(blocs.map(b => b.x + b.w - window.scrollX), .92);
    const gauche = dec(blocs.map(b => b.x - window.scrollX), .08);
    const D_ = { x0: droite + 18, x1: W - 12 }, G_ = { x0: J.sbw + 12, x1: gauche - 18 };
    const lD = D_.x1 - D_.x0, lG = G_.x1 - G_.x0;
    const b = lD >= lG ? D_ : G_, l = Math.max(lD, lG);
    if (l < 46) return null;
    /* trop large, la chaîne flotterait : on la tient près du texte */
    if (l > 230) { if (b === D_) b.x1 = b.x0 + 230; else b.x0 = b.x1 - 230; }
    return b;
  }

  /* LE CIRCUIT : les nœuds et le fil, en coordonnées du DOCUMENT (le circuit
     descend avec la page), le long de la marge. A, M, A′, M, A″… : une pièce
     sur deux, et la pièce grossit à chaque retour. */
  const MARCH = ['toile', 'habit', 'fer', 'froment', 'the'];
  const PRIMES = ['', '′', '″', '‴'];
  function tracerCircuit() {
    noeuds = []; fil = [];
    bande = trouverBande();
    docH = document.documentElement.scrollHeight;
    if (!bande) return;
    const l = bande.x1 - bande.x0, xi = bande.x0 + l * .3, xe = bande.x0 + l * .7;
    const y0 = 150, y1 = Math.max(y0 + 400, docH - 140);
    const n = Math.max(3, Math.round((y1 - y0) / 420) + 1);
    const pas = (y1 - y0) / (n - 1);
    const rmin = Math.min(10, l * .2), rmax = Math.min(24, l * .44);
    const nPieces = Math.ceil(n / 2);
    for (let k = 0; k < n; k++) {
      const r = semis(hache(5, k));
      const piece = k % 2 === 0, j = k >> 1;
      noeuds.push({
        y: y0 + k * pas + (r() - .5) * pas * .18,
        x: (k % 2 === 0 ? xe : xi) + (r() - .5) * l * .08,
        piece, j,
        r: piece ? lerp(rmin, rmax, nPieces > 1 ? j / (nPieces - 1) : 0) : Math.min(13, l * .26),
        nom: piece ? 'A' + (j < 4 ? PRIMES[j] : '⁽' + j + '⁾') : MARCH[j % MARCH.length]
      });
    }
    /* le fil : une S entre deux nœuds, échantillonnée tous les 6 px de document */
    for (let k = 0; k < n - 1; k++) {
      const A = noeuds[k], B = noeuds[k + 1];
      const ya = A.y + (A.piece ? A.r : 12) + 4, yb = B.y - (B.piece ? B.r : 12) - 4;
      const m = Math.max(2, Math.ceil((yb - ya) / 6));
      for (let i = 0; i <= m; i++) {
        const t = i / m, e = lisse(t);
        const ondule = Math.sin(t * Math.PI * 2) * l * .08 * (k % 2 ? 1 : -1);
        fil.push({ x: lerp(A.x, B.x, e) + ondule, y: lerp(ya, yb, t), k });
      }
      fil.push(null);                          /* une coupure : le fil passe derrière le nœud */
    }
  }

  /* les marchandises, en traits fins (u = l'unité, en px) */
  function marchandise(g, nom, x, y, u) {
    g.beginPath();
    if (nom === 'toile') {                    /* le rouleau de toile : les vingt aunes */
      g.rect(x - 1.1 * u, y - .55 * u, 2.2 * u, 1.1 * u);
      g.moveTo(x + 1.1 * u, y - .55 * u); g.ellipse(x + 1.1 * u, y, .26 * u, .55 * u, 0, -Math.PI / 2, Math.PI / 2);
      for (let i = -1; i <= 1; i++) { g.moveTo(x - 1.1 * u, y + i * .28 * u); g.lineTo(x + .8 * u, y + i * .28 * u); }
    } else if (nom === 'habit') {             /* l'habit */
      g.moveTo(x - .35 * u, y - 1 * u); g.lineTo(x - 1.05 * u, y - .6 * u); g.lineTo(x - .85 * u, y + .1 * u); g.lineTo(x - .6 * u, y);
      g.lineTo(x - .6 * u, y + 1 * u); g.lineTo(x + .6 * u, y + 1 * u); g.lineTo(x + .6 * u, y); g.lineTo(x + .85 * u, y + .1 * u);
      g.lineTo(x + 1.05 * u, y - .6 * u); g.lineTo(x + .35 * u, y - 1 * u); g.lineTo(x, y - .45 * u); g.closePath();
      g.moveTo(x, y - .45 * u); g.lineTo(x, y + 1 * u);
    } else if (nom === 'fer') {               /* la demi-tonne de fer : un lingot */
      g.moveTo(x - 1.1 * u, y + .5 * u); g.lineTo(x - .75 * u, y - .4 * u); g.lineTo(x + .75 * u, y - .4 * u); g.lineTo(x + 1.1 * u, y + .5 * u); g.closePath();
      g.moveTo(x - .75 * u, y - .4 * u); g.lineTo(x - .55 * u, y - .7 * u); g.lineTo(x + .95 * u, y - .7 * u); g.lineTo(x + .75 * u, y - .4 * u);
      g.moveTo(x + .95 * u, y - .7 * u); g.lineTo(x + 1.3 * u, y + .2 * u); g.lineTo(x + 1.1 * u, y + .5 * u);
    } else if (nom === 'froment') {           /* le quarteron de froment : un épi */
      g.moveTo(x, y + 1.1 * u); g.lineTo(x, y - 1.1 * u);
      for (let i = 0; i < 4; i++) { const yy = y - .9 * u + i * .42 * u; g.moveTo(x, yy + .2 * u); g.quadraticCurveTo(x - .5 * u, yy, x - .42 * u, yy - .25 * u); g.moveTo(x, yy + .2 * u); g.quadraticCurveTo(x + .5 * u, yy, x + .42 * u, yy - .25 * u); }
    } else {                                  /* les dix livres de thé : une caisse */
      g.rect(x - .85 * u, y - .55 * u, 1.7 * u, 1.3 * u);
      g.moveTo(x - .85 * u, y - .55 * u); g.lineTo(x - .55 * u, y - .85 * u); g.lineTo(x + 1.15 * u, y - .85 * u); g.lineTo(x + .85 * u, y - .55 * u);
      g.moveTo(x + 1.15 * u, y - .85 * u); g.lineTo(x + 1.15 * u, y + .45 * u); g.lineTo(x + .85 * u, y + .75 * u);
      g.moveTo(x - .85 * u, y + .05 * u); g.lineTo(x + .85 * u, y + .05 * u);
    }
    g.stroke();
  }

  /* la couverture du voile au point (0 : blanc de page, 1 : sous un texte) */
  const sousTexte = (x, y) => {
    if (!masque) return 0;
    const mx = Math.min(vv.width - 1, Math.max(0, x * VOILE | 0)), my = Math.min(vv.height - 1, Math.max(0, y * VOILE | 0));
    return masque[(my * vv.width + mx) * 4 + 3] / 255;
  };

  /* LES MOTS qui montent : un calendrier semé (instant, mot, grain). */
  const MOTS = ['valeur', 'travail', 'marchandise', 'argent', 'capital', 'plus-value', 'échange', 'surtravail',
    'force de travail', 'valeur d’usage', 'circulation', 'temps de travail', 'accumulation', 'salaire'];
  const PERIODE_MOT = 2300, VIE_MOT = 3400;

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
    /* la tête du fil, à l'écran : la poussière s'y allume (la circulation
       remue l'or autour d'elle) */
    let teteX = -1e4, teteY = -1e4;
    const tete = filSuit() ? sy + H * LIGNE : docH + 1e5;
    if (bande && fil.length && filSuit()) { let q = null; for (const p of fil) { if (!p) continue; if (p.y > tete) break; q = p; } if (q) { teteX = q.x; teteY = q.y - sy; } }

    /* 1. la poussière */
    if (grains.length) {
      const fixe = dessin === 'edition' || !anime;
      for (const G of grains) {
        const [x, y] = placer(G, fixe ? 0 : tt, s);
        if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
        /* sous un texte, la poussière ne s'atténue pas : elle s'efface */
        const cache = sousTexte(x, y); if (cache > .5) continue;
        const sc = fixe ? .55 : .5 + .5 * Math.sin(tt / G.tw + G.a);
        const pres = cloche(Math.hypot(x - teteX, y - teteY) / 170);
        let a = J.orA * [.34, .58, .9][G.couche] * (.45 + .55 * sc) * (1 + 1.4 * pres) * (1 - cache * 1.8);
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

    /* 2. le circuit */
    if (bande && fil.length) {
      /* le fil : une lueur large et pâle (la bougie), puis le trait */
      const passes = lueur > 0 ? [[5, .18 * lueur], [1.5, 1]] : [[1.5, 1]];
      for (const [lw, f] of passes) {
        ctx.lineWidth = lw; ctx.lineCap = 'round';
        let prev = null;
        for (const p of fil) {
          if (!p) { prev = null; continue; }
          if (p.y > tete) break;
          const y = p.y - sy;
          if (prev && y > -10 && prev.y - sy < H + 10) {
            const cache = sousTexte(p.x, y);
            const a = J.filA * f * (1 - cache * .95);
            if (a > .015) { ctx.strokeStyle = rgba(J.fil, a); ctx.beginPath(); ctx.moveTo(prev.x, prev.y - sy); ctx.lineTo(p.x, y); ctx.stroke(); }
          }
          prev = p;
        }
      }
      /* la tête du fil : un point vif là où on lit */
      if (filSuit() && tete < docH) {
        let q = null; for (const p of fil) { if (!p) continue; if (p.y > tete) break; q = p; }
        if (q) {
          const y = q.y - sy, a = J.filA * (1 - sousTexte(q.x, y) * .95);
          if (lueur > 0) { ctx.globalAlpha = a * .5 * lueur; ctx.drawImage(spriteEclat, q.x - 13, y - 13, 26, 26); ctx.globalAlpha = 1; }
          ctx.fillStyle = rgba(J.fil, a); ctx.beginPath(); ctx.arc(q.x, y, 2.4, 0, 6.2832); ctx.fill();
        }
      }
      /* les nœuds */
      ctx.lineWidth = 1.2;
      for (const N of noeuds) {
        const y = N.y - sy;
        if (y < -60 || y > H + 60) continue;
        const atteint = tete >= N.y - (N.piece ? N.r : 12);
        const pres = cloche((tete - N.y) / 160);                       /* l'instant où le fil y arrive */
        const cache = sousTexte(N.x, y), vis = 1 - cache * .95;
        const base = (atteint ? 1 : .42) * vis;
        if (base < .03) continue;
        if (atteint && lueur > 0 && pres > .02) {
          ctx.globalAlpha = Math.min(1, .8 * pres * lueur * vis);
          const R = (N.piece ? N.r : 14) * 3.2; ctx.drawImage(spriteEclat, N.x - R, y - R, 2 * R, 2 * R); ctx.globalAlpha = 1;
        }
        const coul = N.piece ? J.or : J.trait, ca = N.piece ? Math.min(1, J.orA * 1.15) : J.traitA;
        ctx.strokeStyle = rgba(coul, ca * base * (atteint ? 1 + .3 * pres : 1));
        if (N.piece) {
          ctx.beginPath(); ctx.arc(N.x, y, N.r, 0, 6.2832); ctx.stroke();
          ctx.beginPath(); ctx.arc(N.x, y, N.r * .78, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = rgba(coul, ca * base);
          ctx.font = 'italic 600 ' + Math.round(N.r * .9) + 'px ' + J.serif;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(N.nom, N.x, y + N.r * .04);
          /* le retour de l'argent : « + Δ » monte au passage du fil */
          if (N.j > 0 && atteint && pres > .03) {
            const m = (tete - N.y) / 160;
            ctx.fillStyle = rgba(J.fil, Math.min(1, pres * vis * J.filA));
            ctx.font = 'italic 600 ' + Math.max(12, Math.round(N.r * .7)) + 'px ' + J.serif;
            ctx.fillText('+ Δ', N.x, y - N.r - 10 - Math.max(0, m) * 18);
          }
        } else {
          marchandise(ctx, N.nom, N.x, y, N.r * .95);
        }
      }
    }

    /* 3. les mots qui montent : dans un blanc de la page, jamais sous un texte */
    if (anime && dessin !== 'edition' && J.motA > 0 && grains.length) {
      const k0 = Math.floor((tt - VIE_MOT) / PERIODE_MOT);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (let k = Math.max(0, k0); k <= Math.floor(tt / PERIODE_MOT); k++) {
        const r = semis(hache(11, k)), naissance = k * PERIODE_MOT + r() * 900, age = (tt - naissance) / VIE_MOT;
        if (age < 0 || age > 1) continue;
        const mot = MOTS[Math.floor(r() * MOTS.length)];
        /* le grain qui l'émet : le premier, dans l'ordre semé, qui est proche,
           visible, dans un blanc — décidé à la NAISSANCE (position d'alors) */
        let G = null, depart = Math.floor(r() * grains.length);
        for (let i = 0; i < grains.length && !G; i++) {
          const g2 = grains[(depart + i * 7) % grains.length];
          if (g2.couche !== 2) continue;
          const [x, y] = placer(g2, naissance, s);
          if (x < J.sbw + 80 || x > W - 70 || y < 90 || y > H - 40) continue;
          if (sousTexte(x, y) > .02 || sousTexte(x, y - 40) > .02 || sousTexte(x - 50, y - 20) > .02 || sousTexte(x + 50, y - 20) > .02) continue;
          G = [x, y];
        }
        if (!G) continue;
        const f = Math.sin(Math.PI * age);                              /* paraît, puis s'efface */
        ctx.globalAlpha = Math.min(1, f * J.motA);
        if (lueur > 0) ctx.drawImage(spriteEclat, G[0] - 16, G[1] - 16, 32, 32);
        ctx.fillStyle = rgba(J.mot, 1);
        ctx.font = 'italic 500 15px ' + J.serif;
        ctx.fillText(mot, G[0], G[1] - 14 - age * 30);
        ctx.globalAlpha = 1;
      }
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
     Pendant le défilement une image par image (la parallaxe et le fil suivent
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
    if (bouge || besoin) { besoin = false; raf = requestAnimationFrame(boucle); }
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
