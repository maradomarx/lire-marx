/* ============================================================
   LE FOND — le ciel étoilé. Canvas 2D, vanille, sans dépendance.
   Ses jetons : /assets/fond.css.

   CE QU'IL EST. Le fond étoilé de GeoInvader (son StarField), repris à la
   demande du propriétaire (25 oct. 2026 : « seulement le fond étoilé dont on
   a l'impression qu'il traverse l'écran ») : des étoiles en perspective qui
   viennent vers le lecteur et traversent l'écran. On voyage d'un pas lent
   tant qu'on lit, plus vite quand on descend, à rebours quand on remonte ;
   un défilement vif étire les étoiles en traînées. Quelques étoiles sont
   d'or (et luisent à la bougie), plus rares de rouge.
   Il a remplacé « la circulation » (poussière d'or, pièces A, A′ dans la
   marge) puis « le marché » (le mini-jeu, un jour en ligne) : ne pas
   remettre de scène jouée derrière le texte.

   LES MODES (html[data-mode], événement `lm:mode`) :
     bougie  — étoiles crème, quelques-unes d'or qui luisent.
     jour    — étoiles d'encre brune, plus présentes (un fond clair les
               mange), sans lueur ; on voyage plus lentement.
     edition — un imprimé : rien ne bouge seul, ni scintillement ni
               traînée ; c'est le LECTEUR qui fait avancer le ciel en
               descendant la page. Sur le papier vergé.

   LE HASARD EST SEMÉ (graine 1867, l'édition allemande du Livre I) : même
   ciel à chaque visite. Aucun Math.random.

   LES ÉGARDS. Un VOILE (masque à un quart de résolution) éteint tout ce qui
   passerait sous un texte : presque entièrement sous les colonnes de
   lecture, aux trois quarts sous tout bloc qui porte du texte ; le ciel
   est passé deux fois au masque en destination-out (~99 % effacé).
   Mouvement réduit, économie de données, réglage « immobile » : une image
   fixe. Onglet masqué : rien ne tourne. Densité de pixels plafonnée à 1,5.

   OÙ. Sur toutes les pages qui portent le bloc AFFICHAGE, l'accueil compris,
   SAUF la bibliothèque. Une page le refuse par body[data-fond="aucun"].

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

  /* ---------- où il se monte ----------
     Partout où le bloc AFFICHAGE est posé, SAUF la bibliothèque (sa pièce en
     trois dimensions est déjà un ciel à elle). Une page le refuse par
     body[data-fond="aucun"]. */
  const SAUF = [/^\/oeuvres\/bibliotheque\/?$/];
  const SCENES = '[data-fond="aucun"]';
  const CALMES = '.nt-essai,.ap-corps,.ml-corps,.reader-content,[data-fond="calme"]';
  const HORS = '.topbar,.sidebar,.fond,script,style,noscript,template,svg,canvas,[hidden],.sr-only';
  function ici() {
    const p = location.pathname.replace(/\.html$/, '');
    return !SAUF.some(r => r.test(p));
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
      mode: dessin, etoiles: etoiles.length,
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
      etoile: rgb(g('--fond-etoile'), [214, 199, 166]), etoileA: num('--fond-etoile-a', 1),
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
  let W = 0, H = 0, D = 1, dessin = 'bougie', etoiles = [], calmes = [], voiles = [], docH = 0, vitesse = 0;
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

  /* LE CIEL — le fond étoilé de GeoInvader (son StarField), dans nos couleurs :
     des étoiles en perspective qui viennent vers le lecteur et traversent
     l'écran. On voyage d'un pas lent tant qu'on lit, plus vite quand on
     descend, À REBOURS quand on remonte ; un défilement vif étire les étoiles
     en traînées. Le trajet est une FONCTION de l'instant et de la position,
     jamais un état : figer(t) redonne l'image au pixel, et remonter la page
     ramène exactement le même ciel. Chaque étoile parcourt la profondeur de
     z = 1 (au fond) à z = 0,04 (contre la vitre), puis renaît ailleurs : sa
     place à chaque passage est semée par (étoile, passage). */
  const V_TEMPS = .000012, V_DEFIL = .00055;          /* z parcouru par ms, par px défilé */
  function semer() {
    etoiles = [];
    if (!(J.etoileA > 0)) return;
    const n = Math.round(clamp(W * H / 5200, 140, 320));
    for (let i = 0; i < n; i++) { const r = semis(hache(3, i)); etoiles.push({ o: r(), tw: r() * 6.283 }); }
  }
  /* l'étoile i au trajet donné : position à l'écran, profondeur, passage, teinte */
  function etoile(E, i, trajet) {
    const u = E.o + trajet, c = Math.floor(u), f = u - c, r = semis(hache(4001 + c, i));
    const z = 1 - f * .96, fo = Math.max(W, H) * .42, x = r() * 2 - 1, y = r() * 2 - 1, a = r();
    return { x: W / 2 + x / z * fo, y: H / 2 + y / z * fo, z, c, teinte: a < .08 ? 1 : a < .1 ? 2 : 0 };
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

  /* ---------- une image ---------- */
  function rendre(t, force) {
    const t0 = performance.now();
    if (fige) { t = tFige; force = true; sL = window.scrollY; }
    if (window.innerWidth !== W || window.innerHeight !== H) { if (force) construire(); else reconstruire(); }
    const anime = mode === 'anime' && (force || !document.hidden);
    const sy = window.scrollY;
    if (sy !== voileY) voiler();
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, W, H);
    /* le temps fait avancer quand le fond s'anime ; la lecture aussi dans
       l'édition (rien ne bouge seul, c'est le lecteur qui avance) ; immobile
       sinon (réglage, mouvement réduit, économie) */
    const edition = etat().raison === 'un imprimé ne bouge pas';
    const tt = anime ? t : 0, s = anime ? sL : (edition ? sy : 0);
    const trajet = tt * V_TEMPS * J.vit + s * V_DEFIL;
    const sombre = dessin === 'bougie', lueur = J.lueur;
    const traine = anime && !fige ? Math.min(sombre ? .7 : .4, Math.abs(vitesse) / 45) : 0;
    const retour = vitesse * V_DEFIL;                    /* le trajet d'une image en arrière */
    const coul = [J.etoile, J.or, J.fil];
    for (let i = 0; i < etoiles.length; i++) {
      const E = etoiles[i], p = etoile(E, i, trajet);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      /* sous un texte, l'étoile ne s'atténue pas : elle s'efface */
      const cache = sousTexte(p.x, p.y); if (cache > .5) continue;
      const pres = 1 - p.z;                                         /* 0 au fond, 1 tout près */
      const sc = anime && !edition ? .75 + .25 * Math.sin(tt / 700 + E.tw) : 1;
      let a = (sombre ? .3 : .3) + pres * (sombre ? .52 : .55);
      a = Math.min(sombre ? .88 : .92, a * sc * (p.teinte ? 1.3 : 1)) * J.etoileA * (1 - cache * 1.8);
      if (a < .02) continue;
      const c = coul[p.teinte], taille = (sombre ? 1.2 : 1.4) + pres * 2.3;
      if (traine > .08) {
        const q = etoile(E, i, trajet - retour);
        if (q.c === p.c) {
          ctx.globalAlpha = a * (sombre ? .45 : .22);
          ctx.strokeStyle = rgba(c, 1); ctx.lineWidth = Math.max(.5, taille * .55);
          ctx.beginPath(); ctx.moveTo(q.x + (q.x - p.x) * traine * 1.2, q.y + (q.y - p.y) * traine * 1.2); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
      }
      /* les étoiles d'or luisent à la bougie */
      if (p.teinte === 1 && lueur > 0) {
        const R = 4 + taille * 2;
        ctx.globalAlpha = Math.min(1, a * lueur * .9);
        ctx.drawImage(spriteEclat, p.x - R, p.y - R, 2 * R, 2 * R);
      }
      ctx.globalAlpha = a; ctx.fillStyle = rgba(c, 1);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), taille, taille);
    }
    ctx.globalAlpha = 1;
    /* le voile, deux fois en destination-out : une traînée qui passerait sous
       un texte y est effacée (~99 %) */
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(vv, 0, 0, W, H); ctx.drawImage(vv, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
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
  let besoin = false, fige = false, tFige = 0, yPrec = window.scrollY;
  function boucle(t) {
    raf = 0;
    if (!actif || fige || document.hidden || mode !== 'anime') return;
    const dt = Math.min(64, dernier ? t - dernier : 16);
    const ecart = window.scrollY - sL, bouge = Math.abs(ecart) > .4;
    const dy = window.scrollY - yPrec; yPrec = window.scrollY;
    vitesse += (dy * 16.7 / dt - vitesse) * .12; if (Math.abs(vitesse) < .01) vitesse = 0;
    if (bouge) sL += ecart * (1 - Math.pow(.86, dt / 16.7)); else sL = window.scrollY;
    rendre(t); dernier = t;
    besoin = false; raf = requestAnimationFrame(boucle);
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
