/* cartes/carte.js — dessine une carte à collectionner depuis sa fiche.
 *
 *   Carte.html(c, {verso})   → la carte, recto (et verso si demandé)
 *   Carte.FAMILLES / Carte.RANGS / Carte.EPOQUES
 *
 * Une carte a trois axes de design, et c'est leur produit qui fait qu'aucune
 * ne ressemble tout à fait à une autre :
 *   - l'ÉPOQUE (gravure, internationale, constructivisme, affiche, sérigraphie,
 *     contemporain) : la langue graphique de son temps — palette, caractère,
 *     cadre, motif ;
 *   - la FAMILLE (figure, organisation, événement, œuvre, notion) : l'emblème
 *     et la manière de remplir l'image quand il n'y en a pas ;
 *   - le RANG (tract → manuscrit) : la matière du cadre, jusqu'à la dorure.
 * Et une GRAINE tirée de l'identifiant : angles, nombre de rayons, rosace du
 * guilloché, encre de la sérigraphie. Stable : la même carte se redessine
 * toujours pareil.
 *
 * Une carte est un OBJET : ses couleurs ne suivent pas le mode d'affichage.
 */
(function () {
  'use strict';

  var FAMILLES = {
    fig: { l: 'Figure', pl: 'Figures' },
    org: { l: 'Organisation', pl: 'Organisations' },
    evt: { l: 'Événement', pl: 'Événements' },
    oeu: { l: 'Œuvre', pl: 'Œuvres' },
    not: { l: 'Notion', pl: 'Notions' }
  };
  var RANGS = [
    { k: 'tract', l: 'Tract' },
    { k: 'brochure', l: 'Brochure' },
    { k: 'reliure', l: 'Édition reliée' },
    { k: 'originale', l: 'Édition originale' },
    { k: 'manuscrit', l: 'Manuscrit' }
  ];
  var EPOQUES = {
    gravure: 'avant 1848', internationale: '1848-1916', constructivisme: '1917-1939',
    affiche: '1940-1967', serigraphie: '1968-1991', contemporain: 'depuis 1992'
  };

  // Graine : FNV-1a sur l'identifiant, puis un petit générateur pseudo-aléatoire.
  function graine(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rnd(seed) {
    var a = seed || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function f2(n) { return Math.round(n * 100) / 100; }

  // ------------------------------------------------------------------ motifs
  // Chaque époque a son motif de fond, dessiné en SVG dans un repère 100 × 140.

  // Le guilloché d'un billet ou d'un titre : une rosace de courbes de
  // Lissajous. Ses paramètres viennent de la graine.
  function guilloche(R, couleur, op) {
    var k = 3 + Math.floor(R() * 6), m = 5 + Math.floor(R() * 9), tours = 11 + Math.floor(R() * 7);
    var cx = 50, cy = 70, r1 = 34 + R() * 10, r2 = 6 + R() * 8, d = '';
    for (var j = 0; j < tours; j++) {
      var ph = j / tours * Math.PI * 2 / k, pts = [];
      // 84 points par tour : au-delà, l'œil ne voit rien de plus à cette
      // taille, et l'album affiche des dizaines de cartes à la fois.
      for (var i = 0; i <= 84; i++) {
        var t = i / 84 * Math.PI * 2;
        var r = r1 + r2 * Math.sin(m * t + ph);
        pts.push(Math.round((cx + r * Math.cos(t)) * 10) / 10 + ',' + Math.round((cy + r * Math.sin(t) * 1.05) * 10) / 10);
      }
      d += 'M' + pts.join(' ');
    }
    return '<path d="' + d + '" fill="none" stroke="' + couleur + '" stroke-width=".18" opacity="' + op + '"/>';
  }

  // La taille-douce : des hachures parallèles à un angle tiré, deux nappes.
  function hachures(R, couleur) {
    var out = '', a = R() * 180;
    for (var n = 0; n < 2; n++) {
      var ang = a + n * (40 + R() * 50), lignes = '';
      for (var y = -80; y < 220; y += 2.1) lignes += 'M-60,' + f2(y) + 'L160,' + f2(y);
      out += '<path d="' + lignes + '" stroke="' + couleur + '" stroke-width=".22" opacity="' + (n ? .18 : .28) +
        '" transform="rotate(' + f2(ang) + ' 50 70)"/>';
    }
    return out;
  }

  // Le constructivisme : un disque, une barre, un coin — composés à la graine.
  function compo(R, rouge, noir) {
    // Les formes se tiennent dans le tiers haut et dans le coin bas : la zone
    // du nom reste du papier nu, comme sur une affiche de Lissitzky.
    var cx = R() < .5 ? 8 + R() * 14 : 78 + R() * 14, cy = 10 + R() * 26, rr = 14 + R() * 14;
    var a = -24 + R() * 14;
    return '<circle cx="' + f2(cx) + '" cy="' + f2(cy) + '" r="' + f2(rr) + '" fill="' + rouge + '"/>' +
      '<rect x="-40" y="' + f2(66 + R() * 6) + '" width="180" height="' + f2(2.2 + R() * 2.2) + '" fill="' + noir +
      '" transform="rotate(' + f2(a) + ' 50 70)"/>' +
      '<polygon points="' + f2(62 + R() * 18) + ',140 100,' + f2(112 + R() * 12) + ' 100,140" fill="' + rouge + '"/>';
  }

  // L'affiche : un soleil levant, ses rayons.
  function rayons(R, c1, c2) {
    var n = 12 + Math.floor(R() * 14), cx = 50, cy = 108 + R() * 22, out = '';
    var dec = R() * Math.PI;
    for (var i = 0; i < n; i++) {
      var a0 = dec + i / n * Math.PI * 2, a1 = a0 + Math.PI / n;
      out += '<polygon points="' + cx + ',' + f2(cy) + ' ' + f2(cx + 220 * Math.cos(a0)) + ',' + f2(cy + 220 * Math.sin(a0)) +
        ' ' + f2(cx + 220 * Math.cos(a1)) + ',' + f2(cy + 220 * Math.sin(a1)) + '" fill="' + (i % 2 ? c1 : c2) + '"/>';
    }
    return out + '<circle cx="50" cy="' + f2(cy) + '" r="' + f2(16 + R() * 10) + '" fill="' + c1 + '"/>';
  }

  // La sérigraphie : une trame de points, fondue le long d'une pente. Un motif
  // répété et un dégradé, plutôt que neuf cents cercles.
  var NTRAME = 0;
  function trame(R, couleur) {
    var id = 'ctT' + (++NTRAME) + Math.floor(R() * 1e6), a = R() * 360;
    return '<defs><pattern id="' + id + 'p" width="4" height="4" patternUnits="userSpaceOnUse">' +
      '<circle cx="2" cy="2" r="1.35" fill="' + couleur + '"/></pattern>' +
      '<linearGradient id="' + id + 'g" gradientTransform="rotate(' + f2(a) + ' .5 .5)">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
      '<mask id="' + id + 'm"><rect width="100" height="140" fill="url(#' + id + 'g)"/></mask></defs>' +
      '<rect width="100" height="140" fill="url(#' + id + 'p)" mask="url(#' + id + 'm)" opacity=".6"/>';
  }

  // Le contemporain : un réseau clairsemé de points reliés.
  function reseau(R, couleur) {
    var pts = [], out = '';
    for (var i = 0; i < 16; i++) { var bord = R(); pts.push(bord < .5 ? [R() * 100, R() * 22] : [bord < .75 ? R() * 9 : 91 + R() * 9, 22 + R() * 110]); }
    for (i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
      var dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
      if (dx * dx + dy * dy < 1300) out += '<line x1="' + f2(pts[i][0]) + '" y1="' + f2(pts[i][1]) + '" x2="' + f2(pts[j][0]) + '" y2="' + f2(pts[j][1]) + '"/>';
    }
    out = '<g stroke="' + couleur + '" stroke-width=".3" opacity=".5">' + out + '</g>';
    for (i = 0; i < pts.length; i++) out += '<circle cx="' + f2(pts[i][0]) + '" cy="' + f2(pts[i][1]) + '" r=".9" fill="' + couleur + '"/>';
    return out;
  }

  // Tous les motifs sont tirés à l'encre de la carte (currentColor), ton sur
  // ton : l'opacité de chaque époque est réglée dans carte.css. La couleur ne
  // dit que la rareté et l'holographie.
  function motif(c, R) {
    switch (c.e) {
      case 'gravure': return hachures(R, 'currentColor');
      case 'internationale': return guilloche(R, 'currentColor', 1);
      case 'constructivisme': return compo(R, 'currentColor', 'currentColor');
      case 'affiche': return rayons(R, 'currentColor', 'transparent');
      case 'serigraphie': return trame(R, 'currentColor');
      default: return reseau(R, 'currentColor');
    }
  }

  // ------------------------------------------------------------------ emblèmes
  // Ce qui occupe l'image quand la carte n'en a pas : ce n'est jamais un vide,
  // c'est la famille qui parle.

  function initiales(n) {
    var mots = n.replace(/[«»"()]/g, '').split(/[\s\-–]+/).filter(function (m) {
      return m && !/^(de|du|des|la|le|les|et|d'|l'|von|van|der|di|da|y)$/i.test(m);
    });
    return (mots.length > 1 ? mots[0][0] + mots[mots.length - 1][0] : (mots[0] || '?').slice(0, 2)).toUpperCase();
  }

  function sigle(n) {
    // Une organisation se dit souvent par son sigle quand elle en a un.
    var m = /\(([A-ZÀ-Ý][A-ZÀ-Ý0-9\-]{1,7})\)/.exec(n);
    if (m) return m[1];
    var mots = n.split(/\s+/).filter(function (w) { return /^[A-ZÀ-Ý]/.test(w) && w.length > 2; });
    return mots.length >= 2 ? mots.map(function (w) { return w[0]; }).join('').slice(0, 5) : initiales(n);
  }

  function embleme(c) {
    if (c.f === 'evt') return '<span class="ct-em ct-em--an">' + esc(c.a || '') + '</span>';
    if (c.f === 'not') return '<span class="ct-em ct-em--lettre">' + esc((c.n.replace(/^(L['’]|La |Le |Les )/, '')[0] || '?').toUpperCase()) + '</span>' +
      (c.de ? '<span class="ct-em-de" lang="de">' + esc(c.de) + '</span>' : '');
    if (c.f === 'oeu') return '<span class="ct-em ct-em--titre"><span class="ct-tp-au">' + esc(c.auteur || '') +
      '</span><span class="ct-tp-t">' + esc(c.n) + '</span><span class="ct-tp-an">' + esc(c.a || '') + '</span></span>';
    if (c.f === 'org') return '<span class="ct-em ct-em--sigle">' + esc(sigle(c.n)) + '</span>';
    return '<span class="ct-em ct-em--ini">' + esc(initiales(c.n)) + '</span>';
  }

  // ------------------------------------------------------------------ textes

  function dates(c) {
    if (c.f === 'fig') return c.a || c.b ? (c.a || '?') + ' – ' + (c.b || '') : '';
    if (c.f === 'org') return c.a ? c.a + (c.b ? ' – ' + c.b : '') : '';
    if (c.f === 'evt') return c.a ? (c.b && c.b !== c.a ? c.a + ' – ' + c.b : String(c.a)) : '';
    if (c.f === 'oeu') return c.a ? String(c.a) : '';
    return '';
  }

  function sousTitre(c) {
    if (c.f === 'not') return c.de ? '' : c.oeuvre || '';
    if (c.f === 'oeu') return c.auteur || c.d || '';
    if (c.f === 'fig') return c.d || (c.occ && c.occ.join(', ')) || c.pays || '';
    return c.d || c.pays || '';
  }

  function taille(n) {
    var l = n.length;
    return l > 46 ? 'xs' : l > 32 ? 's' : l > 20 ? 'm' : 'l';
  }

  // Karl Marx : la carte d'où part toute la collection, hors numérotation.
  var MARX = 'fig-Q9061';
  function no(c) { return 'n° ' + String(c.no).padStart(4, '0'); }

  var IMG = '/assets/img/cartes/';

  // Les éclats d'un manuscrit ou d'une carte irisée : leur place vient de la
  // graine, jamais sur le nom (la bande 60-85 % de la hauteur reste libre).
  function eclats(c, n) {
    var R = rnd(graine(c.id + '·éclats')), out = '';
    for (var i = 0; i < n; i++) {
      var y = R() < .7 ? 4 + R() * 52 : 86 + R() * 10;
      out += '<i style="--x:' + f2(6 + R() * 88) + '%;--y:' + f2(y) + '%;--d:' + f2(R() * 4) + 's;--p:' + f2(2.6 + R() * 2.4) +
        's;--t:' + f2(.8 + R() * 1.1) + 'em"></i>';
    }
    return '<div class="ct-eclats" aria-hidden="true">' + out + '</div>';
  }

  // La carte de Karl Marx n'a pas de cadre : elle a son propre dessin. Le
  // portrait de Mayall (1875, détouré) sort de la page manuscrite de 1846 et
  // de la gloire gravée derrière lui ; chaque plan glisse à sa vitesse sous la
  // main. L'irisée colore le portrait lui-même, comme un billet de banque.
  function gloireMarx() {
    var s = '', i, a;
    for (i = 0; i < 96; i++) {
      a = i * Math.PI / 48;
      var r = i % 2 ? 62 : (i % 8 ? 74 : 98);
      s += '<line x1="' + f2(Math.cos(a) * 34) + '" y1="' + f2(Math.sin(a) * 34) + '" x2="' + f2(Math.cos(a) * r) + '" y2="' + f2(Math.sin(a) * r) + '"/>';
    }
    return '<svg class="mx-gloire" viewBox="-100 -100 200 200" aria-hidden="true"><g class="mx-rais">' + s + '</g><circle r="34"/><circle r="31.5"/><circle r="99"/></svg>';
  }
  function rectoMarx(c, o) {
    return '<div class="ct-face ct-recto">' +
      '<div class="ct-filigrane" aria-hidden="true"></div>' +
      (o.tete ? '<div class="mx-aurore" aria-hidden="true"></div>' : '') +
      gloireMarx() +
      '<div class="ct-ecrin" aria-hidden="true"></div>' +
      '<div class="mx-portrait"><img class="mx-img" src="/assets/img/marx/marx-detoure.webp" alt="" width="640" height="788" decoding="async">' +
        (o.tete ? '<span class="mx-iris" aria-hidden="true"></span>' : '') + '</div>' +
      '<header class="ct-top mx-top"><span class="ct-fam">' + FAMILLES[c.f].l + '</span><span class="ct-no">' +
        (o.tete ? '<span class="ct-etoile" aria-label="irisée">✦</span>' : '') + no(c) + '</span></header>' +
      '<div class="mx-bas">' +
        '<h3 class="ct-nom">' + esc(c.n) + '</h3>' +
        '<p class="mx-cite">Prolétaires de tous les pays, unissez-vous&nbsp;!</p>' +
        '<footer class="ct-foot"><span class="ct-dates">' + esc(dates(c)) + '</span><span class="ct-sceau" title="Manuscrit" aria-label="Manuscrit">M</span></footer>' +
      '</div>' +
      (o.tete ? '<div class="ct-holo" aria-hidden="true"></div><div class="ct-argent" aria-hidden="true"></div>' : '') +
      '<div class="ct-foil" aria-hidden="true"></div>' +
      eclats(c, o.tete ? 14 : 10) +
    '</div>';
  }

  function recto(c, o) {
    o = o || {};
    if (c.id === MARX) return rectoMarx(c, o);
    var R = rnd(graine(c.id));
    R(); // (la graine gardait jadis une encre : on consomme son tirage pour que les motifs ne changent pas)
    var art = c.i
      // c.o : le cadrage calculé par tools/cartes.mjs (le visage, ou ce qui
      // attire l'œil) ; « c » = l'image entière
      ? '<img class="ct-img' + (c.o === 'c' ? ' ct-img--entiere' : '') + '" src="' + IMG + c.id + '.webp" alt="" loading="lazy" decoding="async" width="360" height="450"' +
        (c.o && c.o !== 'c' ? ' style="object-position:' + c.o.replace(' ', '% ') + '%"' : '') + '>' +
        (o.tete ? '<span class="ct-tirage" aria-hidden="true"></span>' : '')
      : embleme(c);
    var rang = RANGS[c.r || 0];
    var marques = '';
    for (var i = 0; i < 5; i++) marques += '<i' + (i <= (c.r || 0) ? ' class="on"' : '') + '></i>';
    var sceau = c.r === 4 ? '<span class="ct-sceau" title="Manuscrit" aria-label="Manuscrit">M</span>' : '';
    return '<div class="ct-face ct-recto">' +
      (c.r === 4 ? '<div class="ct-filigrane" aria-hidden="true"></div>' : '') +
      '<svg class="ct-motif" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + motif(c, R) + '</svg>' +
      '<div class="ct-cadre">' +
        '<header class="ct-top"><span class="ct-fam">' + FAMILLES[c.f].l + '</span><span class="ct-no">' +
          (o.tete ? '<span class="ct-etoile" aria-label="irisée">✦</span>' : '') + no(c) + '</span></header>' +
        '<div class="ct-art' + (c.i ? '' : ' ct-art--em') + '">' + art +
          '</div>' +
        '<div class="ct-txt">' +
          '<h3 class="ct-nom ct-nom--' + taille(c.n) + '">' + esc(c.n) + '</h3>' +
          (sousTitre(c) ? '<p class="ct-sub">' + esc(sousTitre(c)) + '</p>' : '') +
        '</div>' +
        '<footer class="ct-foot"><span class="ct-dates">' + esc(dates(c)) + '</span>' +
          '<span class="ct-rang" title="' + rang.l + '" aria-label="' + rang.l + '">' + marques + '</span>' + sceau + '</footer>' +
      '</div>' +
      (c.r === 4 ? '<div class="ct-ecrin" aria-hidden="true"></div>' : '') +
      (c.r >= 3 ? '<div class="ct-fers" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' : '') +
      (o.tete ? '<div class="ct-holo" aria-hidden="true"></div><div class="ct-argent" aria-hidden="true"></div>' : '') +
      '<div class="ct-foil" aria-hidden="true"></div>' +
      (c.r === 4 ? eclats(c, 8) : o.tete ? eclats(c, 5) : '') +
    '</div>';
  }

  function ligne(k, v) { return v ? '<div class="ct-l"><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>' : ''; }

  function verso(c) {
    var faits = '';
    if (c.f === 'fig') {
      faits = ligne('Naissance', [c.a, c.lieu].filter(Boolean).join(', ')) + ligne('Mort', c.b) +
        ligne('Pays', c.pays) + ligne('Métiers', (c.occ || []).join(', ')) + ligne('Courant', (c.cour || []).join(', '));
    } else if (c.f === 'org') {
      faits = ligne('Fondation', c.a) + ligne('Dissolution', c.b) + ligne('Pays', c.pays) +
        ligne('Nature', (c.types || []).join(', ')) + ligne('Courant', (c.cour || []).join(', '));
    } else if (c.f === 'evt') {
      faits = ligne('Date', dates(c)) + ligne('Lieu', [c.lieu, c.pays].filter(Boolean).join(', '));
    } else if (c.f === 'oeu') {
      faits = ligne('Auteur', c.auteur) + ligne('Parution', c.a) + ligne('Langue', c.langue) + ligne('Nature', (c.types || []).join(', '));
    } else {
      faits = ligne('Allemand', c.de) + ligne('Formule', c.fo) + ligne('Où', c.oeuvre);
    }
    var texte = c.f === 'not' ? c.d : (c.d || '');
    var lien = c.href
      ? '<a class="ct-lien" href="' + esc(c.href) + '">' + (c.f === 'oeu' ? 'Lire le texte' : 'Lire la page') + '</a>'
      : c.q ? '<a class="ct-lien" href="https://www.wikidata.org/wiki/' + c.q + '" rel="noopener">Fiche Wikidata</a>' : '';
    return '<div class="ct-face ct-verso">' +
      '<div class="ct-cadre">' +
        '<header class="ct-top"><span class="ct-fam">' + FAMILLES[c.f].l + '</span><span class="ct-no">' + no(c) + '</span></header>' +
        '<h3 class="ct-v-nom">' + esc(c.n) + '</h3>' +
        (texte ? '<p class="ct-v-txt">' + esc(texte) + '</p>' : '') +
        '<dl class="ct-faits">' + faits + '</dl>' +
        '<footer class="ct-v-pied">' + lien +
          '<span class="ct-v-src">' + (c.f === 'not' ? 'Lire Marx, abécédaire' : 'Faits : Wikidata') +
          (c.cr ? ' · image : ' + esc(c.cr) : '') + '</span></footer>' +
      '</div>' +
    '</div>';
  }

  // Le dos : le même pour toutes les cartes, comme le revers d'un jeu. Une
  // rosace d'or tirée d'une graine fixe, le portrait du logo dans un médaillon
  // serti d'or (le même que le favicon), le nom du jeu.
  var DOS = null;
  // Le dos : le sachet du booster, en carte. La nuit, le portrait tramé, le filet
  // rouge, le nom. Pas d'or. Le même pour toutes les cartes. La scène 3D de
  // l'ouverture en utilise la photographie (tools/cartes-dos.mjs, puis
  // tools/cartes.mjs versions) : toute retouche ici doit la refaire.
  function dos() {
    if (!DOS) {
      DOS = '<div class="ct-face ct-dos" aria-hidden="true">' +
        '<span class="ct-dos-art"></span><span class="ct-dos-voile"></span><span class="ct-dos-filet"></span>' +
        '<span class="ct-dos-t"><small>Marx TCG</small><b>Lire<br>Marx</b></span>' +
      '</div>';
    }
    return DOS;
  }

  function html(c, o) {
    o = o || {};
    var cls = 'ct ct--' + c.f + ' ct--e-' + c.e + ' ct--r' + (c.r || 0) + (c.id === MARX ? ' ct--marx' : '') + (o.tete ? ' ct--tete' : '');
    var R = rnd(graine(c.id + '·encre'));
    R(); // (l'ancien tirage de l'encre : consommé pour garder la même inclinaison)
    var style = '--tilt:' + f2(R() * 2 - 1);
    return '<article class="' + cls + '" style="' + style + '" data-id="' + c.id + '" aria-label="' +
      esc(c.n + ', ' + FAMILLES[c.f].l.toLowerCase() + ', ' + RANGS[c.r || 0].l.toLowerCase() + (o.tete ? ', irisée' : '')) + '">' +
      '<div class="ct-corps">' + recto(c, o) + (o.dos ? dos() : o.verso ? verso(c) : '') + '</div></article>';
  }

  // Un dos seul, sans carte derrière : la pile du booster. Rien dans le DOM ne
  // dit quelle carte il cache.
  function dosSeul() { return '<article class="ct retournee" aria-hidden="true"><div class="ct-corps">' + dos() + '</div></article>'; }

  window.Carte = { html: html, dos: dosSeul, FAMILLES: FAMILLES, RANGS: RANGS, EPOQUES: EPOQUES, graine: graine, rnd: rnd };
})();
