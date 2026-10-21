/* LE FOND ANIMÉ DES PAGES DE NOTION (mission glossaire-da, oct. 2026)
   -------------------------------------------------------------------
   Un champ d'objets dessinés en points, comme une constellation, posé
   derrière la page. Chaque page dit lesquels et ce qui monte d'eux quand
   ils s'allument (meta.da.fond, lu ici dans <script id="nt-fond-data">).
   Le principe vient du fond de GEO Invader (des motifs en points dont
   certains s'allument et font monter un mot) ; ici il porte la notion.

   Pour le fétichisme : des marchandises (la table, l'habit, les bottes,
   la toile, le pain de sucre, la pièce) qui bougent à peine, comme si
   elles se mettaient à danser. De temps en temps l'une s'allume et son
   prix monte au-dessus d'elle, comme s'il lui appartenait. Quand le
   lecteur entre dans la section où le rapport social devient visible
   (body[data-lumiere="aube"], posé par monde-driver.js), ce n'est plus le
   prix qui monte, c'est le travail : « le menuisier », « neuf heures ».

   Règles de lecture, qui commandent tout :
   - derrière la colonne de texte, le champ tombe presque à rien et rien
     ne s'y allume : on ne lit pas à travers un mouvement ;
   - le champ défile plus lentement que la page (profondeur), danse en
     sinusoïdes lentes, et ne tourne que si l'onglet est visible ;
   - sous prefers-reduced-motion : une image fixe, sans allumage.
   Le canevas est plafonné à 1,5 de densité de pixels : c'est un décor. */
(function(){
  'use strict';
  var data = document.getElementById('nt-fond-data');
  var cv = document.querySelector('.nt-fond');
  if (!data || !cv || !cv.getContext) return;
  var cfg; try { cfg = JSON.parse(data.textContent); } catch (e) { return; }
  var ctx = cv.getContext('2d');
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(1.5, window.devicePixelRatio || 1);

  /* ── les motifs : une grille de points par objet ── */
  var MOTIFS = {
    table:  ['111111111111','111111111111','.1........1.','.1........1.','.1........1.','.1........1.','.1........1.'],
    habit:  ['...1...1...','..11...11..','.1111.1111.','11111111111','1.1111111.1','1.1111111.1','1.1111111.1','..1111111..','..1111111..','..111.111..'],
    botte:  ['..1111.....','..1111.....','..1111.....','..1111.....','..1111.....','..11111....','..1111111..','..11111111.','..11111111.'],
    toile:  ['..111111...','.11111111..','1111..1111.','111....111.','1111..1111.','.1111111111','..111111111'],
    sucre:  ['....1....','...111...','...111...','..11111..','..11111..','.1111111.','.1111111.','111111111'],
    piece:  ['..11111..','.1111111.','111...111','11.....11','11.....11','11.....11','111...111','.1111111.','..11111..'],
    sac:    ['..1...1..','...111...','..11111..','.1111111.','111111111','111111111','111111111','.1111111.'],
    rouet:  ['...11111...','..1.....1..','.1...1...1.','.1..111..1.','.1...1...1.','..1.....1..','...11111...','.....1.....','....111....','...11111...']
  };
  var CELL = 4.4;                       /* pas de la grille, en px CSS, à profondeur 1 */
  var TEINTES = { chaude: [216, 173, 76], aube: [169, 196, 222] };

  function sprite(rows, rgb, glow){
    var w = rows[0].length, h = rows.length, pad = glow ? 10 : 2;
    var c = document.createElement('canvas');
    c.width = Math.ceil((w * CELL + pad * 2) * DPR); c.height = Math.ceil((h * CELL + pad * 2) * DPR);
    var g = c.getContext('2d'); g.scale(DPR, DPR);
    g.fillStyle = 'rgb(' + rgb.join(',') + ')';
    if (glow) { g.shadowColor = 'rgba(' + rgb.join(',') + ',.85)'; g.shadowBlur = 8; }
    var r = CELL * 0.24;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (rows[y][x] === '1') {
      g.beginPath(); g.arc(pad + x * CELL + CELL / 2, pad + y * CELL + CELL / 2, r, 0, 6.2832); g.fill();
    }
    return { c: c, w: c.width / DPR, h: c.height / DPR, pad: pad };
  }

  /* ── les objets de la page ── */
  var defs = (cfg.motifs || []).filter(function(d){ return MOTIFS[d.m]; });
  if (!defs.length) return;
  var spr = {};
  defs.forEach(function(d){
    var rows = MOTIFS[d.m];
    spr[d.m] = { dim: sprite(rows, [243, 233, 212], false),
                 chaude: sprite(rows, TEINTES.chaude, true), aube: sprite(rows, TEINTES.aube, true) };
  });

  /* Le champ est une bande virtuelle plus haute que l'écran, qui défile à
     une fraction de la vitesse de la page et revient sur elle-même. */
  var W = 0, H = 0, BANDE = 0, items = [], seed = 7;
  function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function peupler(){
    seed = 7; items = [];
    BANDE = H * 1.6;
    var pas = W < 700 ? 104 : 136, cols = Math.ceil(W / pas) + 1, rows = Math.ceil(BANDE / pas);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      if (rnd() < 0.42) continue;                 /* un champ clairsemé, pas une grille */
      var d = defs[Math.floor(rnd() * defs.length)];
      var z = 0.55 + rnd() * 0.5;                 /* profondeur : taille, opacité, parallaxe */
      items.push({ d: d, x: (i + 0.15 + rnd() * 0.7) * pas, y: (j + 0.15 + rnd() * 0.7) * pas, z: z,
        ph: rnd() * 6.28, per: 7 + rnd() * 6, rot: (rnd() - 0.5) * 0.5,
        lit: 0, t: 0, label: '', lum: 'chaude' });
    }
  }

  /* la colonne de texte : on ne lit pas à travers un mouvement */
  var zones = [];
  function mesurerZones(){
    zones = [];
    ['.nt-col', '.nt-tete', '.nt-som'].forEach(function(s){
      var e = document.querySelector(s); if (!e) return;
      var r = e.getBoundingClientRect(); if (r.width) zones.push([r.left - 44, r.right + 44]);
    });
  }
  function dansZone(x){ for (var k = 0; k < zones.length; k++) if (x > zones[k][0] && x < zones[k][1]) return true; return false; }

  function resize(){
    var w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return;
    W = w; H = h;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    peupler(); mesurerZones(); dessiner(performance.now(), 0);
  }

  function lumiere(){ return document.body.dataset.lumiere === 'aube' ? 'aube' : 'chaude'; }
  var prochain = 0;
  function allumer(now){
    if (now < prochain) return;
    prochain = now + 1500 + Math.random() * 1300;
    var off = scrollY * 0.22, cand = [];
    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      if (it.lit > 0) continue;
      var sy = ((it.y - off * it.z) % BANDE + BANDE) % BANDE - (BANDE - H) / 2;
      if (sy < 60 || sy > H - 40 || dansZone(it.x) || it.x < 20 || it.x > W - 20) continue;
      cand.push(it);
    }
    if (!cand.length) return;
    var it2 = cand[Math.floor(Math.random() * cand.length)];
    var lum = lumiere(), mots = it2.d[lum] || it2.d.chaude || [];
    it2.lum = lum; it2.t = now; it2.lit = 0.001;
    it2.label = mots.length ? mots[Math.floor(Math.random() * mots.length)] : '';
  }

  /* ── LE REGARD LÈVE LE VOILE (survol, souris seulement) ──
     Le curseur porte une faible lumière qui éclaire les objets voisins.
     Celui qu'on approche prend la lumière froide et montre, au lieu de son
     prix, le travail qui l'a fait (ses mots « aube ») : ce que l'analyse
     de Marx fait voir derrière l'apparence. Rien ne se passe quand le
     curseur est sur la colonne de texte. Pas d'effet au doigt : il n'y a
     pas de survol, et un toucher sert à faire défiler. */
  var SURVOL = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mx = -1e4, my = -1e4, souris = false, cible = null, R_HALO = 170, R_CIBLE = 92;
  function eteindre(){ souris = false; cible = null; if (REDUCE) redessiner(); }
  var attente = false;
  function redessiner(){ if (attente) return; attente = true; requestAnimationFrame(function(){ attente = false; dessiner(performance.now()); }); }
  if (SURVOL) {
    window.addEventListener('pointermove', function(e){
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY; souris = !dansZone(mx);
      if (REDUCE) redessiner();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', eteindre);
    window.addEventListener('blur', eteindre);
  }

  var VIE = 4200;
  function dessiner(now){
    ctx.clearRect(0, 0, W, H);
    var off = REDUCE ? 0 : scrollY * 0.22, sec = now / 1000;
    /* la lanterne du regard, sous les objets */
    if (souris) {
      var halo = ctx.createRadialGradient(mx, my, 0, mx, my, R_HALO);
      halo.addColorStop(0, 'rgba(216,173,76,.075)'); halo.addColorStop(1, 'rgba(216,173,76,0)');
      ctx.fillStyle = halo; ctx.fillRect(mx - R_HALO, my - R_HALO, R_HALO * 2, R_HALO * 2);
    }
    var proche = null, dProche = R_CIBLE;
    ctx.font = 'italic 500 14px Fraunces, Georgia, serif'; ctx.textAlign = 'center';
    for (var k = 0; k < items.length; k++) {
      var it = items[k], s = spr[it.d.m];
      var sy = ((it.y - off * it.z) % BANDE + BANDE) % BANDE - (BANDE - H) / 2;
      if (sy < -60 || sy > H + 60) continue;
      var zone = dansZone(it.x);
      var danse = REDUCE ? 0 : Math.sin(sec * 6.2832 / it.per + it.ph);
      var x = it.x + (REDUCE ? 0 : danse * 3), y = sy + (REDUCE ? 0 : Math.cos(sec * 6.2832 / (it.per * 1.3) + it.ph) * 4);
      var rot = it.rot * 0.25 + danse * 0.06;
      var base = (zone ? 0.055 : 0.2) * it.z;
      /* le regard : éclaire les voisins, et le plus proche montre son travail */
      if (souris && !zone) {
        var dx = x - mx, dy = y - my, dist = Math.sqrt(dx * dx + dy * dy);
        base += Math.max(0, 1 - dist / R_HALO) * 0.26;
        if (dist < dProche) { dProche = dist; proche = it; }
      }
      var cibleH = it === cible ? 1 : 0;
      it.h = (it.h || 0) + (cibleH - (it.h || 0)) * (REDUCE ? 1 : 0.16);
      if (it.h < 0.01) it.h = 0;
      var h = it.h;
      /* l'allumage : monte en 600 ms, tient, s'éteint */
      var l = 0;
      if (it.lit > 0) {
        var a = now - it.t;
        l = a < 600 ? a / 600 : a < VIE - 1300 ? 1 : Math.max(0, (VIE - a) / 1300);
        if (a > VIE) { it.lit = 0; l = 0; }
      }
      var sc = it.z * (1 + h * 0.1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot * (1 - h)); ctx.scale(sc, sc);
      ctx.globalAlpha = base * (1 - Math.max(l * 0.6, h * 0.8));
      ctx.drawImage(s.dim.c, -s.dim.w / 2, -s.dim.h / 2, s.dim.w, s.dim.h);
      if (l > 0 && h < 1) {
        var sl = s[it.lum];
        ctx.globalAlpha = l * 0.75 * (1 - h);
        ctx.drawImage(sl.c, -sl.w / 2, -sl.h / 2, sl.w, sl.h);
      }
      if (h > 0) {
        ctx.globalAlpha = h * 0.9;
        ctx.drawImage(s.aube.c, -s.aube.w / 2, -s.aube.h / 2, s.aube.w, s.aube.h);
      }
      ctx.restore();
      var haut = y - s.dim.h * sc / 2 - 8;
      if (l > 0 && it.label && h < 1) {
        var rgb = TEINTES[it.lum], monte = (now - it.t) / VIE;
        ctx.globalAlpha = l * 0.82 * (1 - h);
        ctx.fillStyle = 'rgb(' + rgb.join(',') + ')';
        ctx.fillText(it.label, x, haut - monte * 16);
      }
      if (h > 0 && it.travail) {
        ctx.globalAlpha = h * 0.92;
        ctx.fillStyle = 'rgb(' + TEINTES.aube.join(',') + ')';
        ctx.fillText(it.travail, x, haut - 2);
      }
    }
    ctx.globalAlpha = 1;
    /* la cible du prochain dessin ; son mot est choisi une fois, à l'arrivée */
    if (proche !== cible) {
      cible = proche;
      if (cible) { var mots = cible.d.aube || []; cible.travail = mots.length ? mots[Math.floor(Math.random() * mots.length)] : ''; }
      if (REDUCE) redessiner();
    }
  }

  var raf = null, encours = false;
  function boucle(now){
    raf = null;
    if (!encours) return;
    allumer(now); dessiner(now);
    raf = requestAnimationFrame(boucle);
  }
  function lancer(){ if (REDUCE) return; encours = !document.hidden; if (encours && !raf) raf = requestAnimationFrame(boucle); }
  document.addEventListener('visibilitychange', lancer);
  window.addEventListener('resize', resize);
  /* la colonne bouge quand la coquille et les polices arrivent : on remesure */
  window.addEventListener('load', function(){ mesurerZones(); if (REDUCE) dessiner(0); });
  setTimeout(mesurerZones, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ mesurerZones(); if (REDUCE) dessiner(0); });
  resize();
  lancer();
})();
