/* LE MONDE DE LA PROPRIÉTÉ BOURGEOISE — les neuf dixièmes.

   Le texte donne lui-même la proportion, et la proportion est l'argument :
   « dans votre société la propriété privée est abolie pour les neuf dixièmes
   de ses membres ». Dix parcelles en deux rangs.

     g 0-1  dix parcelles, chacune sa maison et sa clôture ;
     g 1-2  l'intitulé passe de FÉODALE à BOURGEOISE ;
     g 2-3  neuf parcelles se vident, leur contenu s'écoule vers la dixième,
            qui grandit ;
     g 3-4  la grande parcelle s'appelle CAPITAL, reliée aux neuf autres ;
     g 4-5  la fraction s'inscrit : 9/10 et 1/10 ;
     g 5-6  la clôture de la grande parcelle tombe, chaque parcelle retrouve
            sa maison.

   Moteur 2d. Tout est fonction de g, donc réversible. */
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
  (function () { var s = 53; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 4200; i++) { gg.fillStyle = 'rgba(210,186,146,' + (r() * 0.04) + ')'; gg.fillRect(r() * 200, r() * 200, 1.6, 1.6); } })();

  function set(g) { G = g; }
  function frame() { render(); }

  function maison(x, y, t, a, coul) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = coul; ctx.lineWidth = Math.max(1.3, t * 0.07); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - t * 0.5, y + t * 0.4); ctx.lineTo(x - t * 0.5, y - t * 0.05); ctx.lineTo(x, y - t * 0.5);
    ctx.lineTo(x + t * 0.5, y - t * 0.05); ctx.lineTo(x + t * 0.5, y + t * 0.4); ctx.closePath(); ctx.stroke();
    ctx.strokeRect(x - t * 0.12, y + t * 0.1, t * 0.24, t * 0.3);
    ctx.restore();
  }
  function rectPointille(x, y, w, h, plein, coul, lw) {
    ctx.save(); ctx.strokeStyle = coul; ctx.lineWidth = lw;
    if (plein < 0.999) ctx.setLineDash([lw * 3 * (1 - plein) + 0.01 + lw * 4 * plein, lw * 4 * (1 - plein)]);
    ctx.strokeRect(x, y, w, h); ctx.restore();
  }

  function render() {
    if (!cw || !ch) return;
    var key = G.toFixed(3) + '|' + cw + 'x' + ch;
    if (key === dernier) return; dernier = key;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var f = ctx.createLinearGradient(0, 0, cw, ch);
    f.addColorStop(0, '#160f09'); f.addColorStop(1, '#0c0806');
    ctx.fillStyle = f; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.globalAlpha = 0.55;
    for (var gx = 0; gx < cw; gx += 200) for (var gy = 0; gy < ch; gy += 200) ctx.drawImage(grain, gx, gy);
    ctx.restore();

    var large = cw >= 1100;
    var X0 = large ? cw * 0.49 : cw * 0.07, X1 = large ? cw * 0.93 : cw * 0.93;
    var W = X1 - X0, cell = W / 5, Hc = Math.min(cell * 0.82, ch * 0.24);
    var Y0 = ch * 0.5 - Hc - ch * 0.02;
    /* réglé sur la hauteur : dans le bandeau mobile, un plancher de 12 px
       poussait la dernière ligne hors du cadre */
    var t = Math.max(8, Math.round(Math.min(ch * 0.03, cell * 0.2, ch * 0.9 / 19)));

    var vu = ss(0.05, 0.9, G);
    if (vu < 0.01) return;
    var histoire = ss(1.1, 1.9, G);
    var vide = ss(2.05, 2.95, G);
    var capital = ss(3.05, 3.8, G);
    var fraction = ss(4.05, 4.7, G);
    var fin = ss(5.1, 5.85, G);

    /* l'intitulé : FÉODALE barrée, BOURGEOISE */
    ctx.globalAlpha = vu; ctx.textAlign = 'left';
    ctx.font = '600 ' + Math.round(t * 0.62) + 'px Inter, system-ui, sans-serif';
    ctx.fillStyle = SOURD;
    ctx.fillText('P R O P R I É T É', X0, Y0 - t * 2.2);
    var xT = X0 + ctx.measureText('P R O P R I É T É   ').width;
    ctx.fillStyle = histoire > 0.5 ? SOURD : ENCRE;
    ctx.fillText('F É O D A L E', xT, Y0 - t * 2.2);
    if (histoire > 0.01) {
      var wF = ctx.measureText('F É O D A L E').width;
      ctx.strokeStyle = ROUGE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xT - 2, Y0 - t * 2.4); ctx.lineTo(xT - 2 + (wF + 4) * histoire, Y0 - t * 2.4); ctx.stroke();
      ctx.globalAlpha = vu * histoire; ctx.fillStyle = OR;
      ctx.fillText('B O U R G E O I S E', xT + wF + t * 1.2, Y0 - t * 2.2);
      ctx.globalAlpha = vu;
    }

    /* les dix parcelles ; la dixième (index 9, en bas à droite) grandit */
    var capX = X0 + 3 * cell, capY = Y0 + Hc, capW = 2 * cell, capH = Hc;
    for (var i = 0; i < 10; i++) {
      var cx = X0 + (i % 5) * cell, cy = Y0 + Math.floor(i / 5) * Hc;
      var estCap = i === 9;
      var app = cl(vu * 10 - i);
      if (app <= 0.01) continue;
      ctx.globalAlpha = app;
      if (estCap) {
        /* elle s'étend sur sa voisine de gauche à mesure que les autres se vident */
        var ww = lerp(cell, capW, vide), xx = lerp(cx, capX, vide);
        var clot = 1 - ss(0.1, 0.8, fin);
        ctx.fillStyle = 'rgba(216,173,76,' + (0.10 * vide * clot + 0.02) + ')';
        ctx.fillRect(xx + 4, cy + 4, ww - 8, Hc - 8);
        rectPointille(xx + 4, cy + 4, ww - 8, Hc - 8, clot, estCap && vide > 0.3 ? OR : 'rgba(243,233,212,.45)', lerp(1.2, 2.6, vide) );
        maison(xx + ww / 2, cy + Hc / 2 - (capital > 0 ? t * 0.4 * capital : 0), t * lerp(1.1, 1.5, vide), 1, ENCRE);
        if (capital > 0.01) {
          ctx.globalAlpha = app * capital; ctx.fillStyle = OR; ctx.textAlign = 'center';
          ctx.font = 'italic ' + Math.round(t * 1.05) + 'px Georgia, serif';
          ctx.fillText('capital', xx + ww / 2, cy + Hc - t * 0.8);
        }
      } else {
        if (i === 8 && vide > 0.02) { ctx.globalAlpha = app * (1 - vide); }
        var videI = cl(vide * 1.25 - (i === 8 ? 0.2 : (8 - i) * 0.02));
        var plein = 1 - videI * (1 - fin);
        rectPointille(cx + 4, cy + 4, cell - 8, Hc - 8, i === 8 ? 1 : 1 - videI * 0.9 * (1 - fin), 'rgba(243,233,212,.35)', 1.2);
        if (i !== 8 || vide < 0.98) maison(cx + cell / 2, cy + Hc / 2, t * 1.1, plein, ENCRE);
        /* le contenu qui s'écoule vers le capital */
        if (videI > 0.02 && videI < 0.98 && i !== 8) {
          var k = videI;
          ctx.globalAlpha = app * Math.sin(Math.PI * k);
          ctx.fillStyle = OR;
          for (var d = 0; d < 5; d++) {
            var u = cl(k * 1.2 - d * 0.05);
            var px = lerp(cx + cell / 2, capX + capW / 2, u), py = lerp(cy + Hc / 2, capY + capH / 2, u) - Math.sin(Math.PI * u) * Hc * 0.25;
            ctx.beginPath(); ctx.arc(px, py, Math.max(2, t * 0.14), 0, 6.3); ctx.fill();
          }
        }
        /* les traits du produit collectif */
        if (capital > 0.01 && i !== 8) {
          ctx.globalAlpha = app * capital * (1 - fin) * 0.55;
          ctx.strokeStyle = OR; ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath(); ctx.moveTo(cx + cell / 2, cy + Hc / 2 + t * 0.7); ctx.lineTo(lerp(cx + cell / 2, capX + capW / 2, capital), lerp(cy + Hc / 2 + t * 0.7, capY + capH / 2, capital)); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    ctx.globalAlpha = 1;

    /* la fraction */
    if (fraction > 0.01) {
      var yF = Y0 + 2 * Hc + t * 2.8;
      ctx.globalAlpha = fraction * (1 - 0.6 * fin);
      ctx.textAlign = 'left';
      ctx.fillStyle = ENCRE; ctx.font = '900 ' + Math.round(t * 2.2) + 'px Georgia, serif';
      ctx.fillText('9/10', X0, yF);
      var w9 = ctx.measureText('9/10').width;
      ctx.fillStyle = SOURD; ctx.font = 'italic ' + Math.round(t * 0.95) + 'px Georgia, serif';
      ctx.fillText('sans propriété', X0 + w9 + t * 0.6, yF - t * 0.2);
      ctx.fillStyle = OR; ctx.font = '900 ' + Math.round(t * 2.2) + 'px Georgia, serif';
      ctx.textAlign = 'right'; ctx.fillText('1/10', X1, yF);
      var w1 = ctx.measureText('1/10').width;
      ctx.font = 'italic ' + Math.round(t * 0.95) + 'px Georgia, serif';
      ctx.fillText('propriétaire', X1 - w1 - t * 0.6, yF - t * 0.2);
    }
    if (fin > 0.35) {
      ctx.globalAlpha = ss(0.35, 1, fin); ctx.textAlign = 'left'; ctx.fillStyle = SOURD;
      ctx.font = 'italic ' + Math.round(t * 0.95) + 'px Georgia, serif';
      ctx.fillText('sa part des produits sociaux — sans pouvoir sur le travail d’autrui', X0, Y0 + 2 * Hc + t * 5.2);
    }
    ctx.globalAlpha = 1;
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
