/* LE MONDE DU COMMUNISME — le retour qui n'est pas un cercle.

   Tout le fragment tient dans une distinction entre deux retours. Le
   communisme grossier abolit la propriété privée en la généralisant : il
   revient EXACTEMENT au point de départ, à la simplicité contre nature de
   l'homme pauvre et sans besoins — un cercle qui se referme. La suppression
   positive, elle, est aussi un retour de l'homme à lui-même, mais accompli
   « en conservant toute la richesse du développement antérieur » : elle
   revient au-dessus du point de départ, et non sur lui.

   La figure est donc DEUX TRACÉS sur une même planche, partant du même
   point : un cercle en pointillé qui se referme, une spirale pleine qui
   passe au-dessus et continue. Ce n'est ni une scène ni un objet, parce que
   le concept n'est ni l'un ni l'autre : c'est la forme d'un mouvement.

   Moteur 2d — un trait se dessine mieux qu'il ne se modélise. */
window.LM_MONDE = function (canvas) {
  'use strict';
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var ENCRE = '#f3e9d4', SOURD = '#9a846a', OR = '#d8ad4c', ROUGE = '#e5644f';
  var G = 0, cw = 0, ch = 0, dpr = 1, dernier = '';

  var grain = document.createElement('canvas'), gg = grain.getContext('2d');
  grain.width = grain.height = 200;
  (function () {
    var s = 59; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 4200; i++) { gg.fillStyle = 'rgba(208,184,146,' + (r() * 0.04) + ')'; gg.fillRect(r() * 200, r() * 200, 1.6, 1.6); }
  })();

  function set(g) { G = g; }
  function frame() { render(); }

  function render() {
    if (!cw || !ch) return;
    var key = G.toFixed(3) + '|' + cw + 'x' + ch;
    if (key === dernier) return; dernier = key;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var f = ctx.createLinearGradient(0, 0, cw, ch);
    f.addColorStop(0, '#161009'); f.addColorStop(1, '#0c0806');
    ctx.fillStyle = f; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.globalAlpha = 0.55;
    for (var gx = 0; gx < cw; gx += 200) for (var gy = 0; gy < ch; gy += 200) ctx.drawImage(grain, gx, gy);
    ctx.restore();

    /* LA PLANCHE VIT DANS LA MOITIÉ DROITE — la colonne de texte prend les
       quarante-trois premiers pour cent. */
    var CXc = cw * 0.715, CYc = ch * 0.52, R = Math.min(cw * 0.185, ch * 0.30);
    var taille = Math.max(14, Math.round(ch * 0.024));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    var depart = ss(0.1, 0.9, G);
    var cercle = ss(1.2, 2.6, G);
    var etiq1  = ss(2.4, 3.1, G);
    var spir   = ss(3.2, 4.9, G);
    var etiq2  = ss(4.6, 5.3, G);
    var fin    = ss(5.2, 5.9, G);

    var A0 = -Math.PI / 2;          /* le point de départ, en haut */
    var P0x = CXc + Math.cos(A0) * R, P0y = CYc + Math.sin(A0) * R;

    /* LE CERCLE : il revient exactement d'où il est parti */
    if (cercle > 0.005) {
      ctx.strokeStyle = SOURD; ctx.lineWidth = 2;
      if (ctx.setLineDash) ctx.setLineDash([8, 8]);
      ctx.beginPath();
      for (var i = 0; i <= 200 * cercle; i++) {
        var a = A0 + (i / 200) * 6.2832;
        var x = CXc + Math.cos(a) * R, y = CYc + Math.sin(a) * R;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
    }

    /* LA SPIRALE : elle revient AU-DESSUS, en conservant ce qui a été acquis */
    if (spir > 0.005) {
      ctx.strokeStyle = ENCRE; ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (i = 0; i <= 260 * spir; i++) {
        var t = i / 260, a2 = A0 + t * 6.2832 * 1.06;
        var rr = R * (1 + 0.42 * t);
        var x2 = CXc + Math.cos(a2) * rr, y2 = CYc + Math.sin(a2) * rr;
        if (i === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      /* la pointe */
      if (spir > 0.98) {
        var af = A0 + 6.2832 * 1.06, rf = R * 1.42;
        var xf = CXc + Math.cos(af) * rf, yf = CYc + Math.sin(af) * rf;
        ctx.fillStyle = ENCRE; ctx.beginPath(); ctx.arc(xf, yf, 5, 0, 6.3); ctx.fill();
      }
    }

    /* le point de départ, et ce qu'il est */
    if (depart > 0.01) {
      ctx.globalAlpha = depart;
      ctx.fillStyle = OR; ctx.beginPath(); ctx.arc(P0x, P0y, 6.5, 0, 6.3); ctx.fill();
      ctx.strokeStyle = 'rgba(216,173,76,.45)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(P0x, P0y, 13, 0, 6.3); ctx.stroke();
      ctx.fillStyle = SOURD; ctx.font = 'italic ' + taille + 'px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('le point de départ', P0x, P0y - ch * 0.048);
      ctx.globalAlpha = 1;
    }

    if (etiq1 > 0.01) {
      ctx.globalAlpha = etiq1 * (1 - 0.25 * fin);
      ctx.fillStyle = SOURD; ctx.font = 'italic ' + taille + 'px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('le communisme grossier', CXc, CYc + R + ch * 0.075);
      ctx.font = 'italic ' + Math.round(taille * 0.86) + 'px Georgia, serif';
      ctx.fillText('il revient exactement d’où il est parti', CXc, CYc + R + ch * 0.075 + taille * 1.35);
      ctx.globalAlpha = 1;
    }

    if (etiq2 > 0.01) {
      ctx.globalAlpha = etiq2;
      ctx.fillStyle = ENCRE; ctx.font = 'italic ' + taille + 'px Georgia, serif'; ctx.textAlign = 'right';
      ctx.fillText('la suppression positive', CXc + R * 1.42 - ch * 0.02, CYc - R * 1.42 - ch * 0.028);
      ctx.fillStyle = OR; ctx.font = 'italic ' + Math.round(taille * 0.86) + 'px Georgia, serif';
      ctx.fillText('en conservant toute la richesse acquise', CXc + R * 1.42 - ch * 0.02, CYc - R * 1.42 + taille * 0.3);
      ctx.globalAlpha = 1;
    }

    /* l'écart entre les deux retours, mesuré */
    if (fin > 0.01) {
      var afin = A0 + 6.2832 * 1.06, rfin = R * 1.42;
      var xa = CXc + Math.cos(afin) * rfin, ya = CYc + Math.sin(afin) * rfin;
      ctx.globalAlpha = fin;
      ctx.strokeStyle = ROUGE; ctx.lineWidth = 1.6;
      if (ctx.setLineDash) ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(P0x, P0y); ctx.lineTo(xa, ya); ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
      ctx.fillStyle = ROUGE; ctx.font = 'italic ' + Math.round(taille * 0.86) + 'px Georgia, serif'; ctx.textAlign = 'left';
      ctx.fillText('ce n’est pas un retour en arrière', (P0x + xa) / 2 + ch * 0.018, (P0y + ya) / 2 + taille * 0.34);
      ctx.globalAlpha = 1;
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
