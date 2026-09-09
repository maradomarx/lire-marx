/* LE MONDE DE LA FORME-VALEUR — les quatre planches.

   PAS DE 3D, et ce n'est pas un renoncement : c'est le concept qui le
   commande. La forme-valeur n'est pas un objet, c'est une manière de
   S'EXPRIMER — et Marx la donne lui-même sous forme IMPRIMÉE, en quatre
   planches successives dont la dernière porte une accolade. Une nature
   morte n'aurait fait qu'illustrer ; la page composée démontre.

   Les quatre formes sont ici les MÊMES TERMES qui changent de place.
   C'est tout l'argument du chapitre : entre la forme développée et la
   forme générale, Marx n'écrit aucune équation nouvelle, il lit la série
   à l'envers. Le lecteur doit le voir, et il le voit parce que rien
   n'apparaît ni ne disparaît — les lignes traversent l'accolade.

   Le côté DROIT est toujours celui de l'équivalent, et il est imprimé
   CREUX : une marchandise qui sert de miroir n'exprime pas sa propre
   valeur. Au troisième temps les deux membres s'échangent une fois et
   reviennent — « ces deux formes s'excluent polariquement ».

   Tout est fonction de g, donc réversible : on remonte, l'or redescend
   dans le rang, l'accolade s'efface, la série se retourne, et il ne reste
   qu'une pièce de toile devant un blanc. */
window.LM_MONDE = function (canvas) {
  'use strict';
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var PAPIER = '#e4d8b8', ENCRE = '#2b1c0c', SOURD = '#6d5a3a', ROUGE = '#9d3b2b', OR = '#87621c';
  var G = 0, cw = 0, ch = 0, dpr = 1, dernier = '';

  /* le grain du papier : tiré une fois, puis réutilisé */
  var grain = document.createElement('canvas'), gg = grain.getContext('2d');
  grain.width = grain.height = 200;
  (function () {
    var s = 7919; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 5000; i++) {
      gg.fillStyle = 'rgba(' + (r() < 0.5 ? '92,74,46' : '255,248,226') + ',' + (r() * 0.07) + ')';
      gg.fillRect(r() * 200, r() * 200, 1.7, 1.7);
    }
  })();

  /* ── LES TERMES ───────────────────────────────────────────────────────
     Ceux de Marx, dans son ordre. Rien d'ajouté : l'or est dans la série
     de la forme développée BIEN AVANT d'en sortir pour prendre la place
     de l'équivalent général — c'est ce qui fait qu'il n'a aucune vertu
     propre, et la planche doit le montrer. */
  var TERMES = [
    { id: 'toile', t: '20 mètres de toile' },
    { id: 'habit', t: '1 habit' },
    { id: 'the',   t: '10 livres de thé' },
    { id: 'cafe',  t: '40 livres de café' },
    { id: 'or',    t: '2 onces d’or' },
    { id: 'fer',   t: '½ tonne de fer' },
    { id: 'autre', t: 'x marchandise A' }
  ];
  /* Pour chaque planche : la COLONNE (−1 à gauche, +1 à droite), le rang
     compté depuis le milieu du bloc, et si la ligne porte son signe
     d'égalité — car il n'y en a qu'UN par ligne, et il appartient à la
     série, non au terme qui lui fait face. Colonne nulle = absent. */
  var PLANCHES = {
    /*        A                B                 C                 D          */
    toile: [[-1, 0, 1], [-1, 0, 0], [1, 0, 0], [-1, -2.5, 1]],
    habit: [[1, 0, 0], [1, -2.5, 1], [-1, -2.5, 1], [-1, -1.5, 1]],
    the: [[0, 0, 0], [1, -1.5, 1], [-1, -1.5, 1], [-1, -0.5, 1]],
    cafe: [[0, 0, 0], [1, -0.5, 1], [-1, -0.5, 1], [-1, 0.5, 1]],
    or: [[0, 0, 0], [1, 0.5, 1], [-1, 0.5, 1], [1, 0, 0]],
    fer: [[0, 0, 0], [1, 1.5, 1], [-1, 1.5, 1], [-1, 1.5, 1]],
    autre: [[0, 0, 0], [1, 2.5, 1], [-1, 2.5, 1], [-1, 2.5, 1]]
  };
  var NOMS = [
    'A. Forme simple ou accidentelle de la valeur',
    'B. Forme valeur totale ou développée',
    'C. Forme valeur générale',
    'D. Forme monnaie ou argent'
  ];

  var st = { g: 0, poids: [1, 0, 0, 0], bascule: 0, pole: 0, vide: 1, accolade: 0 };
  function set(g) { G = g; }
  function compute() {
    st.g = G;
    var pB = ss(2.98, 3.34, G);        /* la série se déploie          */
    var pC = ss(4.14, 4.80, G);        /* LE RENVERSEMENT              */
    var pD = ss(5.16, 5.78, G);        /* l'or prend la place          */
    st.poids = [(1 - pB), pB * (1 - pC), pC * (1 - pD), pD];
    /* les deux pôles s'excluent : l'équation bascule une fois, et revient */
    st.bascule = ss(2.22, 2.50, G) * (1 - ss(2.62, 2.90, G));
    st.pole = ss(2.02, 2.24, G) * (1 - ss(2.86, 3.02, G));
    st.vide = 1 - ss(1.02, 1.42, G);   /* le membre de droite manque    */
    st.accolade = pC;
  }

  /* la place d'un terme : interpolée entre les quatre planches */
  function place(id) {
    var P = PLANCHES[id], c = 0, r = 0, v = 0, e = 0;
    for (var i = 0; i < 4; i++) {
      var w = st.poids[i]; if (!w) continue;
      var col = P[i][0];
      /* un terme absent d'une planche garde la colonne de la suivante :
         il ENTRE en fondu, il ne glisse pas depuis le milieu. */
      if (col === 0) { c += w * P[1][0]; r += w * P[1][1]; }
      else { c += w * col; r += w * P[i][1]; v += w; e += w * P[i][2]; }
    }
    return { c: c, r: r, v: v, e: v > 0.001 ? e / v : 0 };
  }

  function papier() {
    ctx.fillStyle = PAPIER; ctx.fillRect(0, 0, cw, ch);
    var p = ctx.createPattern(grain, 'repeat');
    ctx.fillStyle = p; ctx.fillRect(0, 0, cw, ch);
    /* la lumière de la lampe tombe un peu à gauche, comme partout ici */
    var v = ctx.createRadialGradient(cw * 0.42, ch * 0.40, Math.min(cw, ch) * 0.10,
      cw * 0.5, ch * 0.5, Math.max(cw, ch) * 0.78);
    v.addColorStop(0, 'rgba(255,246,220,.20)'); v.addColorStop(1, 'rgba(60,40,16,.30)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, cw, ch);
  }

  /* Le terme qui SERT est imprimé creux : il ne dit pas sa propre valeur. */
  function poser(txt, x, y, taille, creux, couleur) {
    ctx.font = '400 ' + taille.toFixed(1) + 'px Spectral, Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (creux > 0.02) {
      ctx.fillStyle = couleur; ctx.globalAlpha = ctx.globalAlpha * (1 - 0.72 * creux);
      ctx.fillText(txt, x, y);
      ctx.globalAlpha = ctx.globalAlpha / (1 - 0.72 * creux);
      ctx.lineWidth = Math.max(0.8, taille * 0.021); ctx.strokeStyle = couleur;
      ctx.globalAlpha = ctx.globalAlpha * creux; ctx.strokeText(txt, x, y);
      ctx.globalAlpha = ctx.globalAlpha / creux;
    } else {
      ctx.fillStyle = couleur; ctx.fillText(txt, x, y);
    }
  }

  function render() {
    if (!cw || !ch) return;
    papier();
    var petit = Math.min(cw, ch);
    var S = Math.max(11, Math.min(cw * 0.038, ch * 0.052));   /* le corps */
    var LH = S * 1.86;
    var midY = ch * 0.53;
    var signX = cw * 0.505;
    /* LE BLANC AUTOUR DU SIGNE. Il doit loger le signe d'égalité ET
       l'accolade sans que l'un morde sur l'autre : premier jet, les deux
       tombaient au même endroit et le « = » se lisait comme un défaut
       d'impression. */
    var jour = S * 1.55;

    /* le titre de la planche — les quatre noms se fondent l'un dans l'autre */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var k = 0; k < 4; k++) {
      if (st.poids[k] < 0.02) continue;
      ctx.globalAlpha = st.poids[k];
      ctx.fillStyle = ENCRE;
      ctx.font = '500 ' + (S * 0.80).toFixed(1) + 'px Fraunces, Georgia, serif';
      ctx.fillText(NOMS[k], cw * 0.5, ch * 0.135);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ROUGE; ctx.lineWidth = Math.max(1, petit * 0.0032);
    ctx.beginPath(); ctx.moveTo(cw * 0.30, ch * 0.185); ctx.lineTo(cw * 0.70, ch * 0.185); ctx.stroke();

    /* L'ACCOLADE — celle que Marx imprime à la forme III, et qu'il faut
       tracer soi-même : elle embrasse la colonne de gauche et vient
       pointer sur l'équivalent. */
    if (st.accolade > 0.02) {
      var hb = LH * 2.74, ax = signX - jour * 0.06, ay = midY;
      ctx.globalAlpha = st.accolade; ctx.strokeStyle = ENCRE;
      ctx.lineWidth = Math.max(1.2, S * 0.075); ctx.lineCap = 'round';
      var d = S * 0.34;
      ctx.beginPath();
      ctx.moveTo(ax - d, ay - hb);
      ctx.quadraticCurveTo(ax, ay - hb * 0.94, ax, ay - hb * 0.52);
      ctx.lineTo(ax, ay - d * 1.1);
      ctx.quadraticCurveTo(ax, ay, ax + d * 0.95, ay);
      ctx.quadraticCurveTo(ax, ay, ax, ay + d * 1.1);
      ctx.lineTo(ax, ay + hb * 0.52);
      ctx.quadraticCurveTo(ax, ay + hb * 0.94, ax - d, ay + hb);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* LES TERMES */
    var poles = [];
    for (var i = 0; i < TERMES.length; i++) {
      var T = TERMES[i], P = place(T.id);
      var c = P.c, vis = P.v;
      if (T.id === 'toile' || T.id === 'habit') {
        if (st.bascule > 0.5) c = -c;
        vis *= 1 - Math.sin(Math.PI * st.bascule);
      }
      if (T.id === 'habit') vis *= 1 - st.vide;
      if (vis < 0.02) continue;

      ctx.font = '400 ' + S.toFixed(1) + 'px Spectral, Georgia, serif';
      var w = ctx.measureText(T.t).width;
      var x = signX + c * (jour + w / 2);
      var y = midY + P.r * LH;
      /* LES DEUX MEMBRES NE SE TRAVERSENT PAS. Ils s'échangent en passant
         l'un au-dessus de l'autre — deux lignes de composition qu'on
         déplace, non deux mots imprimés au même endroit. */
      /* LES DEUX MEMBRES NE SE TRAVERSENT PAS, et ils ne se croisent pas
         non plus : on RECOMPOSE la ligne. Les deux termes s'effacent, les
         places s'échangent, ils reparaissent de l'autre côté. C'est le
         geste du compositeur, et c'est aussi ce que dit le texte — il faut
         renverser l'équation, on ne peut pas la lire dans les deux sens à
         la fois. */
      var yl = y;
      var creux = cl((c + 0.35) / 0.7);        /* la droite est l'équivalent */
      if (st.pole > 0.02 && Math.abs(c) > 0.5) poles.push([x, c]);
      var enc = (T.id === 'or' && st.poids[3] > 0.4 && c > 0.4) ? OR : ENCRE;
      ctx.globalAlpha = vis;
      poser(T.t, x, y, S, creux, enc);

      /* LE SIGNE D'ÉGALITÉ : un seul par ligne, et il appartient à la
         série, non au terme qui lui fait face. Sa place ne dépend donc pas
         du terme mais de la planche — au milieu du blanc tant qu'il n'y a
         pas d'accolade, contre la colonne de gauche dès qu'il y en a une. */
      if (P.e > 0.02) {
        ctx.globalAlpha = vis * P.e;
        ctx.fillStyle = SOURD;
        ctx.font = '400 ' + (S * 0.92).toFixed(1) + 'px Spectral, Georgia, serif';
        ctx.fillText('=', signX - jour * 0.72 * st.accolade, yl);
      }
      ctx.globalAlpha = 1;
    }

    /* LE BLANC — au premier temps, la valeur n'a rien où se dire. */
    if (st.vide > 0.02) {
      ctx.globalAlpha = st.vide * 0.85;
      ctx.strokeStyle = SOURD; ctx.lineWidth = Math.max(1, petit * 0.003);
      ctx.setLineDash([S * 0.30, S * 0.30]);
      ctx.beginPath();
      ctx.moveTo(signX + jour * 0.55, midY + S * 0.62);
      ctx.lineTo(signX + jour * 0.55 + S * 4.2, midY + S * 0.62);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    /* LES DEUX PÔLES — nommés le temps qu'on les distingue, et nommés
       SOUS LEUR TERME : une étiquette posée à une place fixe mentirait
       pendant que la ligne se recompose. */
    if (st.pole > 0.02 && poles.length) {
      ctx.globalAlpha = st.pole * (1 - Math.sin(Math.PI * st.bascule)); ctx.fillStyle = ROUGE;
      ctx.font = 'italic 400 ' + (S * 0.60).toFixed(1) + 'px Spectral, Georgia, serif';
      ctx.textAlign = 'center';
      for (var q = 0; q < poles.length; q++)
        ctx.fillText(poles[q][1] > 0 ? 'forme équivalent' : 'forme relative', poles[q][0], midY + LH * 0.92);
      ctx.globalAlpha = 1;
    }

    /* le trait de la forme argent : ce qui s'est fixé */
    if (st.poids[3] > 0.05) {
      ctx.globalAlpha = st.poids[3];
      ctx.strokeStyle = OR; ctx.lineWidth = Math.max(1, petit * 0.0034);
      ctx.font = '400 ' + S.toFixed(1) + 'px Spectral, Georgia, serif';
      var wor = ctx.measureText('2 onces d’or').width;
      ctx.beginPath();
      ctx.moveTo(signX + jour, midY + S * 0.86);
      ctx.lineTo(signX + jour + wor, midY + S * 0.86);
      ctx.stroke(); ctx.globalAlpha = 1;
    }

    /* etc. — la série n'est jamais close */
    if (st.poids[1] + st.poids[2] + st.poids[3] > 0.05) {
      ctx.globalAlpha = 0.55 * (st.poids[1] + st.poids[2] + st.poids[3]);
      ctx.fillStyle = SOURD; ctx.textAlign = 'center';
      ctx.font = 'italic 400 ' + (S * 0.72).toFixed(1) + 'px Spectral, Georgia, serif';
      var cc = lerp(1, -1, ss(0, 1, st.poids[2] + st.poids[3]));
      ctx.fillText('etc.', signX + cc * jour * 1.9, midY + LH * 3.34);
      ctx.globalAlpha = 1;
    }
  }

  function frame() { compute(); var k = st.g.toFixed(3); if (k !== dernier) { dernier = k; render(); } }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    cw = w; ch = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dernier = ''; compute(); render();
  }
  function dispose() {}
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st };
};
