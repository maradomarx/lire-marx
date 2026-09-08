/* LE MONDE DE L'ARGENT — ce qui passe de l'autre côté.

   Le fragment de 1844 ne décrit pas un objet mais un OPÉRATEUR : l'argent
   détache chaque qualité de celui qui la porte, et permet de réaliser le
   contraire de ce qu'on est. Sa figure propre n'est donc ni une scène ni un
   graphique : c'est une INVERSION, et une inversion se montre par des mots
   qui changent de côté.

   Un filet vertical partage la page. À gauche, ce que je suis ; à droite,
   ce que mon argent peut. Une pièce descend le filet, et chaque mot qu'elle
   dépasse traverse et devient son contraire. Au dernier temps la pièce se
   retire, les contraires tombent, et les mots reviennent — avec ce que le
   texte oppose à l'argent : aimer suppose de susciter l'amour.

   Moteur 2d, comme la loi tendancielle : ce qui se dit ici se DESSINE et
   s'écrit ; un volume n'y ajouterait qu'un décor. Tout est fonction de g,
   donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var ENCRE = '#f3e9d4', SOURD = '#9a846a', OR = '#d8ad4c', ROUGE = '#e5644f';
  /* les cinq échanges du troisième manuscrit, ramenés à un mot de chaque
     côté — on n'y transcrit pas le texte, on en donne la teneur */
  var LIGNES = [
    ['laid', 'beau'],
    ['boiteux', 'agile'],
    ['sans esprit', 'spirituel'],
    ['lâche', 'hardi'],
    ['malhonnête', 'honoré']
  ];

  var G = 0, cw = 0, ch = 0, dpr = 1, dernier = '';

  var grain = document.createElement('canvas'), gg = grain.getContext('2d');
  grain.width = grain.height = 200;
  (function () {
    var s = 29; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 4200; i++) { gg.fillStyle = 'rgba(210,186,146,' + (r() * 0.04) + ')'; gg.fillRect(r() * 200, r() * 200, 1.6, 1.6); }
  })();

  function set(g) { G = g; }
  function frame() { render(); }

  /* la pièce : un disque à cannelures, dessiné une fois par image */
  function piece(x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a;
    var g1 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g1.addColorStop(0, '#f0d99a'); g1.addColorStop(0.6, '#d0a648'); g1.addColorStop(1, '#8a6a26');
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    ctx.strokeStyle = 'rgba(60,42,14,.55)'; ctx.lineWidth = 1.1;
    for (var i = 0; i < 28; i++) {
      var t = i / 28 * 6.283;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(t) * r * 0.9, y + Math.sin(t) * r * 0.9);
      ctx.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(70,50,18,.5)'; ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, 6.3); ctx.stroke();
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

    /* LA FIGURE VIT DANS LA MOITIÉ DROITE : la colonne de texte occupe les
       quarante-trois premiers pour cent, et un mot qui passe dessous ne
       traverse rien du tout. */
    var XA = cw * 0.475, XR = cw * 0.715, XB = cw * 0.955;
    var Y0 = ch * 0.245, Y1 = ch * 0.775, PAS = (Y1 - Y0) / (LIGNES.length - 1);
    var taille = Math.max(15, Math.round(ch * 0.036));

    var filet = ss(0.05, 0.95, G);
    var mots  = ss(0.5, 1.7, G);
    var titres = ss(2.0, 2.8, G);
    var desc  = ss(2.9, 5.05, G);     /* la descente de la pièce */
    var retrait = ss(5.15, 5.85, G);  /* elle se retire, et tout revient */

    /* le filet : l'axe de l'échange */
    if (filet > 0.01) {
      ctx.strokeStyle = 'rgba(243,233,212,.34)'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      var yb = lerp(Y0 - ch * 0.075, Y1 + ch * 0.075, filet);
      ctx.moveTo(XR, Y0 - ch * 0.075);
      for (var y = Y0 - ch * 0.075; y <= yb; y += 9) ctx.lineTo(XR + Math.sin(y * 0.05) * 0.8, y);
      ctx.stroke();
    }

    if (titres > 0.01) {
      ctx.globalAlpha = titres * (1 - 0.45 * retrait);
      ctx.font = 'italic ' + Math.round(taille * 0.62) + 'px Georgia, serif';
      ctx.fillStyle = SOURD; ctx.textAlign = 'right';
      ctx.fillText('ce que je suis', XR - ch * 0.022, Y0 - ch * 0.105);
      ctx.fillStyle = OR; ctx.textAlign = 'left';
      ctx.fillText('ce que mon argent peut', XR + ch * 0.022, Y0 - ch * 0.105);
      ctx.globalAlpha = 1;
    }

    /* la pièce descend le filet, et chaque mot qu'elle dépasse traverse */
    var yPiece = lerp(Y0 - ch * 0.06, Y1 + ch * 0.06, desc);
    if (retrait > 0.01) yPiece = lerp(yPiece, Y0 - ch * 0.20, retrait);

    LIGNES.forEach(function (L, i) {
      var y = Y0 + i * PAS;
      var vu = cl((yPiece - (y - PAS * 0.42)) / (PAS * 0.84));   /* la pièce l'a-t-elle dépassé ? */
      var p = vu * (1 - retrait);
      var app = cl(mots * LIGNES.length - i);
      if (app <= 0.02) return;

      ctx.globalAlpha = app;
      /* le mot vrai : il pâlit quand son contraire prend sa place, et il
         REVIENT quand la pièce se retire — c'est le dernier temps du texte */
      ctx.textAlign = 'right';
      ctx.font = 'italic ' + taille + 'px Georgia, serif';
      ctx.fillStyle = ENCRE;
      ctx.globalAlpha = app * (1 - 0.72 * p);
      ctx.fillText(L[0], XR - ch * 0.03, y + taille * 0.34);
      /* le contraire, de l'autre côté */
      if (p > 0.01) {
        ctx.globalAlpha = app * p;
        ctx.textAlign = 'left';
        ctx.fillStyle = i % 2 ? OR : ROUGE;
        ctx.fillText(L[1], XR + ch * 0.03, y + taille * 0.34);
        /* le trait de la traversée */
        ctx.strokeStyle = 'rgba(216,173,76,' + (0.4 * p) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(XR - ch * 0.018, y); ctx.lineTo(XR + ch * 0.018, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    if (desc > 0.005 && retrait < 0.99) piece(XR, yPiece, Math.max(11, ch * 0.030), 1 - 0.85 * retrait);

    /* ce que le texte oppose à l'argent, une fois la pièce retirée */
    if (retrait > 0.35) {
      ctx.globalAlpha = ss(0.35, 0.95, retrait);
      ctx.textAlign = 'center'; ctx.fillStyle = SOURD;
      ctx.font = 'italic ' + Math.round(taille * 0.7) + 'px Georgia, serif';
      ctx.fillText('aimer suppose de susciter l’amour', (XA + XB) / 2, Y1 + ch * 0.115);
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
