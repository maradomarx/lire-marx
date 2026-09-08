/* LE MONDE DE LA LOI TENDANCIELLE — la planche qui se trace.

   PAS DE 3D, et c'est le concept qui le commande : la loi ne porte sur aucun
   objet. Elle énonce le comportement d'un RAPPORT DE GRANDEURS quand l'une
   de ses parties croît plus vite que l'autre — pl/(c+v) quand c/v s'élève.
   Sa figure propre est donc une planche : des axes, deux courbes, et sous
   elles la composition du capital qui se déplace. Une nature morte n'aurait
   rien dit de plus qu'un décor.

   Ce que la planche doit faire voir, et qui est le cœur de la notion :
   la courbe de la TENDANCE tombe de moitié à un septième ; celle qu'on
   OBSERVE, une fois le taux d'exploitation relevé, reste presque plate. La
   loi n'est donc pas démentie par une série statistique qui ne montre rien —
   c'est très exactement ce que le chapitre des forces contraires annonce.

   Moteur 2d : un contexte 2D dessine un trait mieux qu'un plan texturé, et
   la scène ne charge ni WebGL ni la bibliothèque. Tout est fonction de g,
   donc réversible. */
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
    var s = 11; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 5200; i++) { gg.fillStyle = 'rgba(' + (200 + r() * 55 | 0) + ',180,140,' + (r() * 0.045) + ')'; gg.fillRect(r() * 220, r() * 220, 1.6, 1.6); }
  })();

  /* les grandeurs. c/v part de un et monte à six ; le taux de plus-value
     reste constant pour la TENDANCE, et s'élève pour ce qu'on OBSERVE. */
  function kk(t) { return 1 + 5 * t; }
  function pTend(t) { return 1 / (kk(t) + 1); }
  function pObs(t) { return (1 + 2.6 * t) / (kk(t) + 1); }
  var YMAX = 0.56;

  function set(g) { G = g; }
  function frame() { render(); }

  function render() {
    if (!cw || !ch) return;
    var key = G.toFixed(3) + '|' + cw + 'x' + ch;
    if (key === dernier) return; dernier = key;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* le fond : un papier sombre, dans la palette de la maison */
    var f = ctx.createLinearGradient(0, 0, cw, ch);
    f.addColorStop(0, '#171009'); f.addColorStop(1, '#0d0906');
    ctx.fillStyle = f; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.globalAlpha = 0.5;
    for (var gx = 0; gx < cw; gx += 220) for (var gy = 0; gy < ch; gy += 220) ctx.drawImage(grain, gx, gy);
    ctx.restore();

    /* LA PLANCHE VIT DANS LA MOITIÉ DROITE : la colonne de texte occupe les
       quarante-trois premiers pour cent de la largeur, et une figure dont la
       moitié passe sous le texte ne s'explique pas toute seule. */
    var X0 = cw * 0.475, X1 = cw * 0.905, Y0 = ch * 0.285, Y1 = ch * 0.735;
    var LW = X1 - X0, LH = Y1 - Y0;
    function px(t) { return X0 + t * LW; }
    function py(v) { return Y1 - (v / YMAX) * LH; }

    var axes  = ss(0.05, 0.9, G);
    var barres = ss(1.05, 2.0, G);
    var form  = ss(2.05, 2.9, G);
    var tend  = ss(3.0, 4.0, G);
    var forces = ss(4.05, 4.7, G);
    var obs   = ss(4.3, 5.2, G);
    var final = ss(5.1, 5.9, G);

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    /* les axes, d'une main qui tremble un peu */
    function trait(x1, y1, x2, y2, part, col, ep) {
      if (part <= 0.001) return;
      ctx.strokeStyle = col; ctx.lineWidth = ep; ctx.beginPath();
      var n = 26; ctx.moveTo(x1, y1);
      for (var i = 1; i <= n * part; i++) {
        var u = i / n, w = Math.min(u, part);
        ctx.lineTo(x1 + (x2 - x1) * w + Math.sin(i * 1.7) * 0.9, y1 + (y2 - y1) * w + Math.cos(i * 2.1) * 0.9);
      }
      ctx.stroke();
    }
    trait(X0, Y1, X1 + 18, Y1, axes, ENCRE, 1.6);
    trait(X0, Y1, X0, Y0 - 18, axes, ENCRE, 1.6);
    if (axes > 0.7) {
      ctx.fillStyle = SOURD; ctx.font = 'italic ' + Math.round(ch * 0.021) + 'px Georgia, serif';
      ctx.textAlign = 'right'; ctx.fillText('taux de profit', X0 - 12, Y0 + 6);
      ctx.textAlign = 'left'; ctx.fillText('le progrès de l’accumulation →', X0 + 6, Y1 + ch * 0.052);
    }

    /* sous l'axe : la composition du capital, qui se déplace */
    if (barres > 0.01) {
      var NB = 9, bw = LW / (NB * 1.9), by = Y1 + ch * 0.075, bh = ch * 0.085;
      for (var b = 0; b < NB; b++) {
        var t = b / (NB - 1), fb = cl(barres * NB - b);
        if (fb <= 0.02) continue;
        var x = px(t) - bw / 2, part = 1 / (kk(t) + 1);   /* la part de v */
        var h = bh * fb;
        ctx.fillStyle = 'rgba(120,96,58,.55)'; ctx.fillRect(x, by, bw, h * (1 - part));
        ctx.fillStyle = OR; ctx.globalAlpha = 0.85 * fb;
        ctx.fillRect(x, by + h * (1 - part), bw, h * part); ctx.globalAlpha = 1;
      }
      if (barres > 0.85) {
        ctx.fillStyle = SOURD; ctx.font = 'italic ' + Math.round(ch * 0.019) + 'px Georgia, serif'; ctx.textAlign = 'left';
        ctx.fillText('c', px(0) - bw / 2 - ch * 0.028, by + bh * 0.34);
        ctx.fillStyle = OR; ctx.fillText('v', px(0) - bw / 2 - ch * 0.028, by + bh * 0.92);
      }
    }

    /* les deux formules : même numérateur, dénominateurs différents — et
       celui du taux de profit ENFLE à mesure que la composition s'élève */
    if (form > 0.01) {
      ctx.globalAlpha = form; ctx.textAlign = 'left';
      var fx = X0 + LW * 0.04, fy = ch * 0.15, s0 = ch * 0.032;
      ctx.fillStyle = SOURD; ctx.font = 'italic ' + Math.round(s0) + 'px Georgia, serif';
      ctx.fillText('pl', fx, fy - s0 * 0.55);
      ctx.strokeStyle = SOURD; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(fx - 2, fy - s0 * 0.2); ctx.lineTo(fx + s0 * 1.1, fy - s0 * 0.2); ctx.stroke();
      ctx.fillText('v', fx + s0 * 0.15, fy + s0 * 0.62);
      ctx.fillStyle = ENCRE; ctx.font = 'italic ' + Math.round(s0 * 0.72) + 'px Georgia, serif';
      ctx.fillText('l’exploitation', fx + s0 * 1.7, fy + s0 * 0.08);

      var gx2 = X0 + LW * 0.46, enfle = 1 + 0.55 * tend;
      ctx.fillStyle = ENCRE; ctx.font = 'italic ' + Math.round(s0) + 'px Georgia, serif';
      ctx.fillText('pl', gx2, fy - s0 * 0.55);
      ctx.strokeStyle = ENCRE; ctx.beginPath();
      ctx.moveTo(gx2 - 2, fy - s0 * 0.2); ctx.lineTo(gx2 + s0 * 1.5 * enfle, fy - s0 * 0.2); ctx.stroke();
      ctx.font = 'italic ' + Math.round(s0 * enfle) + 'px Georgia, serif';
      ctx.fillText('c + v', gx2, fy + s0 * 0.62 * enfle);
      ctx.font = 'italic ' + Math.round(s0 * 0.72) + 'px Georgia, serif';
      ctx.fillStyle = SOURD;
      ctx.fillText('le rendement', gx2 + s0 * 2.2 * enfle, fy + s0 * 0.08);
      ctx.globalAlpha = 1;
    }

    /* la courbe de la tendance */
    function courbe(fn, part, col, ep, pointille) {
      if (part <= 0.004) return;
      ctx.strokeStyle = col; ctx.lineWidth = ep;
      if (pointille && ctx.setLineDash) ctx.setLineDash([7, 7]); 
      ctx.beginPath();
      for (var i = 0; i <= 120 * part; i++) {
        var t = i / 120, X = px(t), Y = py(fn(t));
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
    }
    courbe(pTend, tend, ENCRE, 2.4, final > 0.5);
    if (tend > 0.9) {
      ctx.fillStyle = ENCRE; ctx.font = 'italic ' + Math.round(ch * 0.021) + 'px Georgia, serif'; ctx.textAlign = 'right';
      ctx.fillText('la tendance', px(1) - 6, py(pTend(1)) + ch * 0.045);
    }

    /* les forces contraires : elles poussent la courbe par en dessous */
    if (forces > 0.01) {
      ctx.strokeStyle = 'rgba(216,173,76,' + (0.55 * forces) + ')'; ctx.lineWidth = 1.5;
      for (var a = 1; a <= 6; a++) {
        var ta = a / 7, X = px(ta), yb = py(pTend(ta)), yh = py(pObs(ta));
        var fa = cl(forces * 7 - a);
        if (fa <= 0.02) continue;
        var yy = lerp(yb, yh, fa);
        ctx.beginPath(); ctx.moveTo(X, yb + 6); ctx.lineTo(X, yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X - 4, yy + 6); ctx.lineTo(X, yy); ctx.lineTo(X + 4, yy + 6); ctx.stroke();
      }
      if (forces > 0.8) {
        ctx.fillStyle = OR; ctx.font = 'italic ' + Math.round(ch * 0.019) + 'px Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillText('les forces contraires', px(0.30), py(0.545));
      }
    }

    /* ce qu'on observe : presque plat, et pourtant la tendance est là */
    courbe(pObs, obs, ROUGE, 2.6, false);
    if (obs > 0.9) {
      ctx.fillStyle = ROUGE; ctx.font = 'italic ' + Math.round(ch * 0.021) + 'px Georgia, serif'; ctx.textAlign = 'right';
      ctx.fillText('ce qu’on observe', px(1) - 6, py(pObs(1)) - ch * 0.028);
    }
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    cw = w; ch = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    dernier = ''; render();
  }
  function dispose() {}
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose };
};
