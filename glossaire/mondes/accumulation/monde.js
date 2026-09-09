/* LE MONDE DE L'ACCUMULATION — la goutte et le fleuve.

   L'image est de Marx, et elle vaut une démonstration : « tout capital avancé
   se perd comme une goutte dans le fleuve toujours grossissant de
   l'accumulation. » Une goutte en haut, puis un filet ; des affluents entrent
   l'un après l'autre — chacun une plus-value capitalisée — et le fleuve
   s'élargit à chaque fois. Le fil d'origine, lui, GARDE LA MÊME ÉPAISSEUR :
   c'est de son RAPPORT au fleuve, et non de sa disparition, que se lit
   l'argument. Le capital primitif ne s'évanouit pas ; sa part tend vers rien.

   PAS DE 3D, et c'est le concept qui le commande : ce qui est en cause est
   un rapport de grandeurs qui se dégrade, non un objet. La page ne charge
   donc ni WebGL ni la bibliothèque.

   LA COURSE EST DIAGONALE, et ce n'est pas un goût : la scène doit tenir
   dans une colonne haute (0,57 de rapport) comme dans une image large
   (1,60). Une descente verticale se serait écrasée dans l'une, une course
   horizontale dans l'autre ; une diagonale coin à coin s'accommode des deux.

   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var ENCRE = '#efe6cf', OR = '#d8ad4c', ROUGE = '#e5644f', SOURD = '#9a846a';
  var G = 0, cw = 0, ch = 0, dpr = 1, dernier = '';

  /* le grain du papier : tiré une fois, puis réutilisé */
  var grain = document.createElement('canvas'), gg = grain.getContext('2d');
  grain.width = grain.height = 220;
  (function () {
    var s = 29; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 5200; i++) { gg.fillStyle = 'rgba(' + (200 + r() * 55 | 0) + ',180,140,' + (r() * 0.045) + ')'; gg.fillRect(r() * 220, r() * 220, 1.6, 1.6); }
  })();

  /* ── LA COURSE ──────────────────────────────────────────────────────
     s de 0 à 1, du coin haut-gauche au coin bas-droit, avec une inflexion
     douce : un fleuve ne descend pas à la règle. */
  var M;                     /* la marge, calculée au resize */
  function pt(s) {
    var x = lerp(M.x0, M.x1, s) + Math.sin(s * 2.9 + 0.5) * M.amp;
    var y = lerp(M.y0, M.y1, s) + Math.sin(s * 2.1) * M.amp * 0.35;
    return [x, y];
  }
  function tangente(s) {
    var a = pt(Math.max(0, s - 0.004)), b = pt(Math.min(1, s + 0.004));
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }
  /* LE FIL D'ORIGINE GARDE LA MÊME ÉPAISSEUR, le fleuve grossit d'un tour
     à l'autre : cinq affluents, chacun multipliant la largeur. */
  /* SEPT CONFLUENTS ET UN RAPPORT MODESTE, plutôt que cinq et un rapport
     fort : à 1,92 le fleuve restait un cheveu sur toute sa moitié haute,
     puis s'ouvrait d'un coup. La croissance doit se lire à chaque tour. */
  var NAFF = 7, R = 1.55;
  var BOUCHES = [0.12, 0.24, 0.37, 0.50, 0.62, 0.74, 0.86];
  var LNR = Math.log(R);
  function demiLargeur(s) {
    var k = 0;
    for (var i = 0; i < BOUCHES.length; i++) k += ss(BOUCHES[i] - 0.045, BOUCHES[i] + 0.045, s);
    /* une berge parfaitement lisse ne se lit pas comme une berge */
    return M.fil * Math.exp(k * LNR) * (1 + 0.045 * Math.sin(s * 23.1 + 1.2));
  }

  function set(g) { G = g; }
  function frame() { render(); }

  function bande(s0, s1, k, style, alpha) {
    var N = 170, g1 = [], g2 = [], i, s, p, t, w;
    for (i = 0; i <= N; i++) {
      s = lerp(s0, s1, i / N); p = pt(s); t = tangente(s); w = demiLargeur(s) * k;
      g1.push([p[0] - t[1] * w, p[1] + t[0] * w]);
      g2.push([p[0] + t[1] * w, p[1] - t[0] * w]);
    }
    ctx.beginPath();
    ctx.moveTo(g1[0][0], g1[0][1]);
    for (i = 1; i <= N; i++) ctx.lineTo(g1[i][0], g1[i][1]);
    for (i = N; i >= 0; i--) ctx.lineTo(g2[i][0], g2[i][1]);
    ctx.closePath();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = style; ctx.fill();
    ctx.globalAlpha = 1;
  }

  function render() {
    if (!cw || !ch) return;
    var key = G.toFixed(3) + '|' + cw + 'x' + ch;
    if (key === dernier) return; dernier = key;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* le fond : le papier sombre de la maison */
    var f = ctx.createLinearGradient(0, 0, cw, ch);
    f.addColorStop(0, '#171009'); f.addColorStop(1, '#0d0906');
    ctx.fillStyle = f; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.globalAlpha = 0.5;
    for (var gx = 0; gx < cw; gx += 220) for (var gy = 0; gy < ch; gy += 220) ctx.drawImage(grain, gx, gy);
    ctx.restore();

    var S = ss(0.55, 5.45, G);
    var petit = Math.min(cw, ch);

    /* ── LE FLEUVE ── */
    if (S > 0.006) {
      bande(0, S, 1.00, '#2b3f4c', 1);
      bande(0, S, 0.70, '#3a5566', 1);
      bande(0, S, 0.32, '#4d6f83', 0.95);
      for (a = 0; a < NAFF; a++) {
        var s0 = BOUCHES[a]; if (S < s0 + 0.01) continue;
        var s1 = Math.min(S, s0 + 0.11);
        bande(s0, s1, 0.94, ROUGE, 0.11);
      }
      /* les deux berges, tracées : c'est ce qui rend la LARGEUR lisible */
      var NB = 170, i2, s2, p2, t2, w3;
      [-1, 1].forEach(function (c) {
        ctx.beginPath();
        for (i2 = 0; i2 <= NB; i2++) {
          s2 = S * i2 / NB; p2 = pt(s2); t2 = tangente(s2); w3 = demiLargeur(s2);
          var bx = p2[0] + c * (-t2[1]) * w3, by = p2[1] + c * t2[0] * w3;
          if (i2) ctx.lineTo(bx, by); else ctx.moveTo(bx, by);
        }
        ctx.strokeStyle = '#6b8ea3'; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }

    /* ── LES AFFLUENTS, PAR-DESSUS LE FLEUVE ───────────────────────────
       Ils sont de la MATIÈRE DU FLEUVE et non des traits d'une autre
       couleur, et ils se jettent DANS le lit — deux fois manqué : dessinés
       sous le fleuve, leur moitié utile passait dessous et il ne restait
       que des croissants détachés ; puis, la direction de la bande ayant
       été confondue avec sa normale, ils s'étalaient le long de leur
       propre course au lieu d'en travers. La règle : on construit d'abord
       la LIGNE, on prend sa dérivée, et la largeur se mesure sur la
       normale de cette dérivée. */
    for (var a = 0; a < NAFF; a++) {
      var sb = BOUCHES[a];
      var vu = ss(sb - 0.06, sb + 0.03, S);
      if (vu < 0.01) continue;
      var p = pt(sb), t = tangente(sb);
      var cote = a % 2 ? 1 : -1;
      var nx = -t[1] * cote, ny = t[0] * cote;
      var d = petit * 0.115 * vu;
      var lg = demiLargeur(sb + 0.02) * (R - 1) * 1.05;
      /* l'arrivée est DANS le lit, un peu en deçà de l'axe */
      var bx0 = p[0] + nx * demiLargeur(sb + 0.02) * 0.35;
      var by0 = p[1] + ny * demiLargeur(sb + 0.02) * 0.35;
      function AF(u) {
        var k = 1 - u;
        return [bx0 + nx * d * k - t[0] * d * 0.34 * k * k,
                by0 + ny * d * k - t[1] * d * 0.34 * k * k];
      }
      var N2 = 34, q1 = [], q2 = [], i, u, P, A, B, dx, dy, ln, w2;
      for (i = 0; i <= N2; i++) {
        u = i / N2; P = AF(u);
        A = AF(Math.max(0, u - 0.02)); B = AF(Math.min(1, u + 0.02));
        dx = B[0] - A[0]; dy = B[1] - A[1]; ln = Math.hypot(dx, dy) || 1;
        dx /= ln; dy /= ln;
        /* un affluent en pointe lisait comme une lame : on arrondit l'amont */
        w2 = lg * (0.46 + 0.54 * u) * vu;
        q1.push([P[0] - dy * w2, P[1] + dx * w2]);
        q2.push([P[0] + dy * w2, P[1] - dx * w2]);
      }
      ctx.beginPath(); ctx.moveTo(q1[0][0], q1[0][1]);
      for (i = 1; i <= N2; i++) ctx.lineTo(q1[i][0], q1[i][1]);
      for (i = N2; i >= 0; i--) ctx.lineTo(q2[i][0], q2[i][1]);
      ctx.closePath();
      ctx.fillStyle = '#3a5566'; ctx.globalAlpha = 0.92; ctx.fill();
      ctx.globalAlpha = 0.30; ctx.strokeStyle = ROUGE; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* ── LE FIL D'ORIGINE : la même épaisseur du haut en bas ── */
    if (S > 0.006) {
      var N = 90, i, s, q;
      ctx.beginPath();
      for (i = 0; i <= N; i++) { s = S * i / N; q = pt(s); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.lineCap = 'round';
      ctx.strokeStyle = OR; ctx.lineWidth = Math.max(5, M.fil * 2.0); ctx.globalAlpha = 0.22;
      ctx.stroke();
      ctx.lineWidth = Math.max(2.4, M.fil * 0.95); ctx.globalAlpha = 1; ctx.stroke();
    }

    /* ── LA GOUTTE : elle est là avant tout le reste ── */
    var pg = pt(0), rg = Math.max(5, M.fil * 2.4);
    ctx.beginPath();
    ctx.moveTo(pg[0], pg[1] - rg * 2.0);
    ctx.quadraticCurveTo(pg[0] + rg * 1.15, pg[1] + rg * 0.35, pg[0], pg[1] + rg);
    ctx.quadraticCurveTo(pg[0] - rg * 1.15, pg[1] + rg * 0.35, pg[0], pg[1] - rg * 2.0);
    ctx.closePath();
    ctx.fillStyle = OR; ctx.globalAlpha = 0.94; ctx.fill(); ctx.globalAlpha = 1;

    /* ── les deux mentions ────────────────────────────────────────────
       On NOMME, on ne chiffre pas : le texte ne donne aucun taux
       d'accumulation, et des pourcentages seraient inventés. Le rapport du
       fil au fleuve se lit directement. Elles vivent aux coins, jamais
       calées sur le tracé : posée sur la berge, la seconde tombait en
       travers du courant. */
    var pol = Math.max(10.5, Math.min(14, petit * 0.031));
    ctx.font = '600 ' + pol.toFixed(1) + 'px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'middle'; ctx.fillStyle = SOURD;
    ctx.textAlign = 'left'; ctx.globalAlpha = 0.88;
    ctx.fillText('LE CAPITAL AVANCÉ', pg[0] + rg * 2.2, pg[1] - rg * 0.5);
    var vFin = ss(3.0, 4.1, G);
    if (vFin > 0.02) {
      ctx.globalAlpha = 0.88 * vFin; ctx.textAlign = 'right';
      ctx.fillText("L'ACCUMULATION", cw - pol * 1.4, ch - pol * 1.7);
    }
    ctx.globalAlpha = 1;

    /* la pénombre gagne les bords, comme partout dans la maison */
    var v = ctx.createRadialGradient(cw * 0.5, ch * 0.46, petit * 0.20, cw * 0.5, ch * 0.5, petit * 0.95);
    v.addColorStop(0, 'rgba(8,5,3,0)'); v.addColorStop(1, 'rgba(8,5,3,.46)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, cw, ch);
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    cw = w; ch = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var petit = Math.min(cw, ch);
    /* LA LARGEUR FINALE SE FIXE D'ABORD, le fil s'en déduit. Premier jet,
       elle était bornée par la marge du HAUT (ch × 0,09), qui n'a rien à
       voir avec la place perpendiculaire d'une diagonale : le fleuve
       finissait à quarante pixels et se lisait comme une aiguille. */
    var fin = petit * 0.115;
    M = {
      x0: cw * 0.19, y0: ch * 0.10,
      x1: cw * 0.82, y1: ch * 0.88,
      amp: petit * 0.042, fil: fin / Math.pow(R, NAFF)
    };
    dernier = ''; render();
  }
  function dispose() {}
  set(0);
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: { g: 0 } };
};
