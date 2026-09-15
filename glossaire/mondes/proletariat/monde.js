/* LE MONDE DU PROLÉTARIAT — un inventaire.

   Le prolétariat se définit par ce qu'il n'a pas : « Le prolétaire est sans
   propriété ». Sa figure propre est donc un registre de possessions qu'on
   raye, et non une scène — un document qu'on lit.

     g 0-2  la feuille, sept lignes cochées ;
     g 2-3  les quatre premières lignes se barrent (la terre, l'outil,
            l'atelier, le produit du travail) ;
     g 3-4  la septième change de sens : à vendre, au jour le jour ;
     g 4-5  la patrie et la propriété à garantir se barrent aussi ;
     g 5-6  au pied, les deux phrases qui ferment le texte.

   Moteur 2d. Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var ENCRE = '#f3e9d4', SOURD = '#9a846a', OR = '#d8ad4c', ROUGE = '#d5402f';
  var LIGNES = ['la terre qu’il cultivait', 'l’outil de son métier', 'l’atelier', 'le produit de son travail',
                'une patrie', 'une propriété à garantir', 'sa force de travail'];
  /* l'ordre des ratures : quatre, puis deux, la septième jamais */
  var RATURE = [[2.0, 2.35], [2.2, 2.55], [2.4, 2.75], [2.6, 2.95], [4.05, 4.45], [4.3, 4.7]];

  var G = 0, cw = 0, ch = 0, dpr = 1, dernier = '';
  var grain = document.createElement('canvas'), gg = grain.getContext('2d');
  grain.width = grain.height = 200;
  (function () { var s = 41; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 4200; i++) { gg.fillStyle = 'rgba(210,186,146,' + (r() * 0.04) + ')'; gg.fillRect(r() * 200, r() * 200, 1.6, 1.6); } })();

  function set(g) { G = g; }
  function frame() { render(); }

  /* une coche tracée à la plume */
  function coche(x, y, t, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = OR; ctx.lineWidth = Math.max(1.6, t * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - t * 0.32, y - t * 0.02); ctx.lineTo(x - t * 0.08, y + t * 0.22); ctx.lineTo(x + t * 0.34, y - t * 0.34); ctx.stroke();
    ctx.restore();
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

    /* LA FEUILLE VIT DANS LA MOITIÉ DROITE au large (la colonne de texte
       couvre les 43 premiers pour cent) ; en bande étroite, elle est centrée */
    var large = cw >= 1100;
    var X0 = large ? cw * 0.49 : cw * 0.08, X1 = large ? cw * 0.93 : cw * 0.92;
    var H = Math.min(ch * 0.8, (X1 - X0) * 1.05), Y0 = (ch - H) / 2 + ch * 0.01;
    /* la taille se règle sur la HAUTEUR disponible : la feuille compte vingt-deux
       lignes de texte en tout, et dans le bandeau mobile (225 px) une taille
       plancher de 12 px la faisait déborder */
    var t = Math.max(7, Math.round(Math.min(ch * 0.031, (X1 - X0) * 0.042, ch * 0.9 / 23)));

    var feuille = ss(0.05, 0.8, G);
    if (feuille < 0.01) return;
    ctx.globalAlpha = feuille;

    /* le cadre de la feuille : un filet double, à la manière d'un registre */
    ctx.strokeStyle = 'rgba(243,233,212,.22)'; ctx.lineWidth = 1;
    ctx.strokeRect(X0, Y0, X1 - X0, H);
    ctx.strokeStyle = 'rgba(243,233,212,.10)';
    ctx.strokeRect(X0 + 6, Y0 + 6, X1 - X0 - 12, H - 12);

    /* l'en-tête */
    var pad = (X1 - X0) * 0.08;
    ctx.textAlign = 'left'; ctx.fillStyle = OR;
    ctx.font = '600 ' + Math.round(t * 0.62) + 'px Inter, system-ui, sans-serif';
    var titre = 'I N V E N T A I R E';
    ctx.fillText(titre, X0 + pad, Y0 + pad + t * 0.4);
    ctx.fillStyle = SOURD; ctx.font = 'italic ' + Math.round(t * 0.78) + 'px Georgia, serif';
    ctx.fillText('de ce que possède le travailleur moderne', X0 + pad, Y0 + pad + t * 1.45);
    ctx.strokeStyle = 'rgba(216,173,76,.35)'; ctx.beginPath(); ctx.moveTo(X0 + pad, Y0 + pad + t * 2.05); ctx.lineTo(X1 - pad, Y0 + pad + t * 2.05); ctx.stroke();

    /* les lignes */
    var LY0 = Y0 + pad + t * 3.3, PAS = t * 2.05;
    var apparition = ss(0.4, 1.7, G);
    var vente = ss(3.1, 3.8, G);
    for (var i = 0; i < LIGNES.length; i++) {
      var y = LY0 + i * PAS;
      var app = cl(apparition * LIGNES.length - i);
      if (app <= 0.01) continue;
      var r = i < RATURE.length ? ss(RATURE[i][0], RATURE[i][1], G) : 0;
      ctx.globalAlpha = feuille * app;

      /* le libellé : il pâlit (par la couleur) quand la rature le prend */
      ctx.font = 'italic ' + t + 'px Georgia, serif'; ctx.textAlign = 'left';
      ctx.fillStyle = r > 0.5 ? SOURD : ENCRE;
      if (i === LIGNES.length - 1 && vente > 0.5) ctx.fillStyle = OR;
      ctx.fillText(LIGNES[i], X0 + pad, y);
      var wTxt = ctx.measureText(LIGNES[i]).width;

      /* les points conducteurs jusqu'à la colonne des coches */
      var xc = X1 - pad - t * 0.4;
      ctx.fillStyle = 'rgba(243,233,212,.22)';
      for (var dx = X0 + pad + wTxt + t * 0.5; dx < xc - t * 0.9; dx += t * 0.42) ctx.fillRect(dx, y - t * 0.08, 1.5, 1.5);

      /* la coche : elle tombe quand la ligne est rayée */
      var cA = 1 - ss(0.2, 0.7, r);
      if (i === LIGNES.length - 1) cA = 1 - vente;
      if (cA > 0.02) coche(xc, y - t * 0.3, t, feuille * app * cA);

      /* la rature : un trait rouge qui avance de gauche à droite */
      if (r > 0.01) {
        ctx.globalAlpha = feuille * app;
        ctx.strokeStyle = ROUGE; ctx.lineWidth = Math.max(1.8, t * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X0 + pad - t * 0.15, y - t * 0.3);
        ctx.lineTo(lerp(X0 + pad - t * 0.15, xc + t * 0.45, r), y - t * 0.3 - Math.sin(r * 3) * 1.2); ctx.stroke();
      }

      /* la septième ligne : à vendre, au jour le jour */
      if (i === LIGNES.length - 1 && vente > 0.01) {
        ctx.globalAlpha = feuille * vente;
        ctx.fillStyle = OR; ctx.textAlign = 'right';
        ctx.font = '600 ' + Math.round(t * 0.6) + 'px Inter, system-ui, sans-serif';
        ctx.fillText('À  V E N D R E ,  A U  J O U R  L E  J O U R', X1 - pad, y + t * 1.05);
      }
    }

    /* au pied : les deux phrases qui ferment le Manifeste (Lafargue) */
    var fin = ss(5.1, 5.8, G);
    if (fin > 0.01) {
      var yF = LY0 + LIGNES.length * PAS + t * 1.4;
      ctx.globalAlpha = feuille * fin; ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(216,173,76,.35)'; ctx.beginPath(); ctx.moveTo(X0 + pad, yF - t * 1.1); ctx.lineTo(X1 - pad, yF - t * 1.1); ctx.stroke();
      ctx.fillStyle = SOURD; ctx.font = 'italic ' + Math.round(t * 0.92) + 'px Georgia, serif';
      ctx.fillText('rien à y perdre, hors leurs chaînes.', X0 + pad, yF);
      ctx.globalAlpha = feuille * ss(5.4, 5.95, G);
      ctx.fillStyle = OR; ctx.font = 'italic ' + Math.round(t * 1.18) + 'px Georgia, serif';
      ctx.fillText('Ils ont un monde à gagner.', X0 + pad, yF + t * 1.7);
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
