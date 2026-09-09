/* LE MONDE DU TRAVAILLEUR COLLECTIF — l'établi, et le corps qu'on y compose.

   Le chapitre XIV ne dit pas que le travail se répartit : il dit qu'un
   PRODUCTEUR NOUVEAU apparaît, dont les organes sont des hommes, et que ce
   producteur est d'autant plus parfait que chacun de ses organes est plus
   borné. La figure devait donc montrer les deux mouvements EN MÊME TEMPS,
   sans quoi elle ne dirait qu'« à plusieurs on va plus vite ».

   Un outil complet, qui fait toute la pièce et la fait lentement. Il éclate :
   ses quatre têtes s'en vont se planter en rang sur l'établi, et la pièce ne
   les traverse plus qu'une fois chacune, sur un rail. Un arbre passe sous le
   plateau et leur donne une seule cadence ; là où le débit l'exige, la
   station se dédouble — deux lames, trois poinçons, et rien d'autre : le
   rapport mathématique fixe. On ôte la dernière station : la pièce cale
   juste avant le sébile, et le débit ne ralentit pas, il cesse.

   Puis les manches tombent : chaque tête, réduite à sa lame, va plus vite,
   et les bois s'entassent derrière l'établi. L'enrichissement du corps a
   pour condition l'appauvrissement de ses membres.

   Au dernier temps un montant se lève en retrait, sans lame, battant la
   même cadence sans jamais toucher la pièce : pour être productif il suffit
   d'être un organe du travailleur collectif.

   Deux choses ont été apprises à l'image et valent d'être écrites :
   1. sur un établi long, les outils tombent sous vingt pixels et ne se
      lisent plus. L'établi a été RACCOURCI et les têtes grossies — c'est la
      lisibilité de l'organe qui commande l'échelle, pas la vraisemblance ;
   2. une scène d'atelier a besoin d'un MUR. Sans lui, les deux tiers hauts
      du cadre sont noirs et l'établi flotte dans le vide.

   Tout est fonction de g, donc réversible. Seules la cadence et le
   vacillement de la lampe sont temporels, et la cadence s'éteint hors de
   sa fenêtre. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 3.6, 10.5);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 3407; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── LES MATIÈRES ─────────────────────────────────────────────────────
     Une texture qui porte déjà sa couleur ne se multiplie JAMAIS par un
     second brun sombre : le color du matériau est une teinte claire. */
  var boisTex = tex(512, 256, function (g, w, h) {
    g.fillStyle = '#4a3623'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 190; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '28,19,10' : '122,98,66') + ',' + (0.06 + rnd() * 0.16) + ')';
      g.lineWidth = 0.6 + rnd() * 2.4; g.beginPath();
      var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin((x + i * 40) / 90) * 5);
      g.stroke();
    }
    for (var k = 0; k < 260; k++) { g.fillStyle = 'rgba(16,10,4,' + (rnd() * 0.28) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 2, rnd() * 3, 0, 6.3); g.fill(); }
  });
  boisTex.wrapS = boisTex.wrapT = THREE.RepeatWrapping;

  var solTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#241a11'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) { g.fillStyle = 'rgba(' + (48 + rnd() * 34 | 0) + ',' + (36 + rnd() * 24 | 0) + ',' + (22 + rnd() * 16 | 0) + ',' + (0.08 + rnd() * 0.18) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 18, 2 + rnd() * 7, rnd() * 3, 0, 6.3); g.fill(); }
  });
  solTex.wrapS = solTex.wrapT = THREE.RepeatWrapping; solTex.repeat.set(4, 4);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), std({ map: solTex, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  /* LE MUR : une cloison de planches verticales, tout près derrière. Sans
     elle le haut du cadre est noir et l'établi flotte. */
  var murTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#33261a'; g.fillRect(0, 0, w, h);
    for (var i = 0; i <= 8; i++) {
      var x = i * w / 8;
      g.fillStyle = 'rgba(14,9,4,0.55)'; g.fillRect(x - 2, 0, 4, h);
      g.fillStyle = 'rgba(122,98,66,0.10)'; g.fillRect(x + 3, 0, 3, h);
    }
    for (var k = 0; k < 1400; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '16,10,5' : '110,88,58') + ',' + (rnd() * 0.16) + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 7, 1 + rnd() * 3); }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping; murTex.repeat.set(2.4, 1.2);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.4), std({ map: murTex, roughness: 0.98, color: 0xcbb086 }));
  mur.position.set(0.1, 2.2, -1.28); mur.receiveShadow = true; scene.add(mur);

  var BY = 0.86;                        /* hauteur du plateau */
  var X0 = -0.90, X1 = 1.06;            /* les deux bouts de l'ensemble utile */
  var plateauTex = boisTex.clone(); plateauTex.needsUpdate = true; plateauTex.repeat.set(2.4, 1);
  var plateau = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.105, 0.76), std({ map: plateauTex, roughness: 0.86, color: 0xc7ab84 }));
  plateau.position.set(0.10, BY, 0); plateau.castShadow = plateau.receiveShadow = true; scene.add(plateau);
  /* les pieds sont du DÉCOR : plus sombres que le plateau, sinon ils
     deviennent l'objet le plus clair de l'image (mesuré une fois : 113 de
     rouge contre 80 pour le plateau, et l'établi se lisait à l'envers) */
  var pied = std({ color: 0x22170d, roughness: 0.95 });
  [[-1.02, 0.24], [-1.02, -0.24], [1.22, 0.24], [1.22, -0.24]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.085, BY - 0.05, 0.085), pied);
    m.position.set(p[0], (BY - 0.05) / 2, p[1]); m.castShadow = true; scene.add(m);
  });

  /* ── LE RAIL : la pièce ne traverse chaque organe qu'une fois ── */
  var laitonMat = std({ color: 0x7d5f26, metalness: 0.42, roughness: 0.4 });
  var laitonVif = std({ color: 0xb08c3c, metalness: 0.45, roughness: 0.26 });
  var RZ = 0.21, RY = BY + 0.075;
  var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 2.16, 8), laitonMat);
  rail.rotation.z = Math.PI / 2; rail.position.set(0.12, RY, RZ);
  rail.castShadow = true; rail.visible = false; scene.add(rail);

  /* ── LES QUATRE OPÉRATIONS ────────────────────────────────────────────
     Quatre têtes distinctes, qui vivent d'abord toutes sur le MÊME manche.
     Elles sont volontairement GROSSES : un organe qu'on ne distingue pas ne
     démontre rien. */
  var acier    = std({ color: 0x3a332b, metalness: 0.26, roughness: 0.46 });
  var acierVif = std({ color: 0x554c40, metalness: 0.3, roughness: 0.3 });
  var manche   = std({ map: boisTex, color: 0x8f7450, roughness: 0.88 });

  function teteGeo(k) {
    if (k === 0) return new THREE.BoxGeometry(0.038, 0.20, 0.10);            /* la lame qui coupe */
    if (k === 1) return new THREE.ConeGeometry(0.062, 0.215, 14);            /* la pointe qui aiguise */
    if (k === 2) return new THREE.CylinderGeometry(0.050, 0.082, 0.165, 16); /* le poinçon qui forme la tête */
    return new THREE.CylinderGeometry(0.024, 0.024, 0.20, 8);                /* le mandrin qui fixe */
  }
  var POSTX = [-0.50, -0.05, 0.40, 0.86];
  var TOOLX = 0.32;
  var TETEY = BY + 0.245;                       /* la tête, une fois plantée */
  var stations = [], grips = [], montants = [], bielles = [];
  for (var k = 0; k < 4; k++) {
    var g0 = new THREE.Group(); scene.add(g0);
    var t = new THREE.Mesh(teteGeo(k), acier);
    t.castShadow = true; g0.add(t);
    if (k === 3) {                              /* le mandrin porte une fourche */
      [-0.045, 0.045].forEach(function (dx) {
        var b = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.095, 0.019), acier);
        b.position.set(dx, 0.145, 0); b.castShadow = true; g0.add(b);
      });
    }
    var gr = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.064, 0.185, 14), manche);
    gr.position.y = -0.165; gr.castShadow = true; g0.add(gr); grips.push(gr);
    stations.push(g0);

    var mo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.056, 0.34, 12), std({ color: 0x2b251e, metalness: 0.24, roughness: 0.66 }));
    mo.castShadow = true; mo.visible = false; scene.add(mo); montants.push(mo);

    var bi = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.30, 6), std({ color: 0x453e34, metalness: 0.3, roughness: 0.5 }));
    bi.castShadow = true; bi.visible = false; scene.add(bi); bielles.push(bi);
  }

  /* le manche commun : il tient les quatre têtes au premier temps, puis il
     s'en va finir sa vie couché au bout de l'établi, vidé de ses fonctions */
  var mancheCommun = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.085, 0.42, 16), manche);
  mancheCommun.castShadow = true; scene.add(mancheCommun);
  var virole = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.05, 18), laitonMat);
  virole.castShadow = true; scene.add(virole);

  /* ── LES GROUPES : le rapport mathématique fixe ──────────────────────
     Deux lames qui coupent, trois poinçons qui forment la tête, et un seul
     de chacun des deux autres. Les doubles se rangent EN PROFONDEUR : côte
     à côte ils passeraient pour de nouvelles opérations. */
  var DOUBLES = [[0, 1], [2, 1], [2, 2]];       /* [station, rang en profondeur] */
  var doubles = [];
  DOUBLES.forEach(function (d) {
    var g0 = new THREE.Group();
    var t = new THREE.Mesh(teteGeo(d[0]), acier); t.castShadow = true; g0.add(t);
    var mo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.056, 0.34, 12), std({ color: 0x3c352c, metalness: 0.3, roughness: 0.6 }));
    mo.position.y = -0.29; mo.castShadow = true; g0.add(mo);
    /* un décalage LATÉRAL en plus de la profondeur : exactement derrière,
       le double disparaissait tout entier derrière le premier et le groupe
       ne se comptait pas */
    g0.position.set(POSTX[d[0]] + 0.062 * d[1], TETEY, RZ - 0.185 * d[1]);
    g0.visible = false; scene.add(g0); doubles.push(g0);
  });

  /* ── L'ARBRE : une seule cadence, collé sous le plateau ──────────────
     Plus bas, il flottait entre les pieds comme une barre sans attache. */
  var arbre = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 2.20, 12), std({ color: 0x37302a, metalness: 0.3, roughness: 0.56 }));
  arbre.rotation.z = Math.PI / 2; arbre.position.set(0.08, BY - 0.115, 0.02);
  arbre.castShadow = true; arbre.visible = false; scene.add(arbre);
  var cames = [];
  for (var c0 = 0; c0 < 4; c0++) {
    var cm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.036, 14), std({ color: 0x453d33, metalness: 0.3, roughness: 0.54 }));
    cm.rotation.z = Math.PI / 2; cm.castShadow = true; cm.visible = false; scene.add(cm); cames.push(cm);
  }

  /* ── LE MONTANT SANS LAME : un organe qui ne touche jamais la pièce ── */
  var veilleur = new THREE.Group();
  var vm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.056, 0.40, 12), std({ color: 0x3c352c, metalness: 0.3, roughness: 0.6 }));
  vm.castShadow = true; veilleur.add(vm);
  var vt = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.019, 8, 22), laitonMat);
  vt.position.y = 0.26; vt.rotation.x = Math.PI / 2; vt.castShadow = true; veilleur.add(vt);
  veilleur.position.set(0.26, BY + 0.20, -0.42); veilleur.visible = false; scene.add(veilleur);

  /* ── LES PIÈCES QUI COURENT SUR LE RAIL ── */
  var NP = 9, pieces = [];
  var pieceGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.105, 8);
  for (var i = 0; i < NP; i++) {
    var p = new THREE.Mesh(pieceGeo, laitonVif);
    p.rotation.z = Math.PI / 2; p.castShadow = true; p.visible = false; scene.add(p); pieces.push(p);
  }

  /* ── LE SÉBILE, AU BOUT : ce que le corps produit ── */
  var sebile = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.155, 0.072, 26, 1, true), std({ color: 0x604e33, metalness: 0.38, roughness: 0.5, side: THREE.DoubleSide }));
  sebile.position.set(X1 + 0.02, BY + 0.088, -0.02); sebile.castShadow = sebile.receiveShadow = true; scene.add(sebile);
  var fond = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.010, 26), std({ color: 0x4e3f28, roughness: 0.72 }));
  fond.position.set(X1 + 0.02, BY + 0.058, -0.02); fond.receiveShadow = true; scene.add(fond);
  var NT = 48, tas = [];
  for (var j = 0; j < NT; j++) {
    var a = rnd() * 6.283, r = 0.135 * Math.sqrt(rnd());
    var q = new THREE.Mesh(pieceGeo, laitonVif);
    q.position.set(X1 + 0.02 + Math.cos(a) * r, BY + 0.072 + 0.014 * (j / NT), -0.02 + Math.sin(a) * r * 0.9);
    q.rotation.set(Math.PI / 2, 0, rnd() * 3.14); q.castShadow = true; q.visible = false; scene.add(q); tas.push(q);
  }

  /* ── LE TAS DE MANCHES, AU FOND DU PLATEAU ── */
  var bois = [];
  for (var b0 = 0; b0 < 8; b0++) {
    var m2 = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.145, 12), std({ map: boisTex, color: 0x8d7048, roughness: 0.97 }));
    m2.position.set(0.16 + b0 * 0.115 + rnd() * 0.05, BY + 0.101 + (b0 % 3 === 0 ? 0.095 : 0), -0.295 + rnd() * 0.045);
    m2.rotation.set(Math.PI / 2, 0, 1.35 + rnd() * 0.5); m2.castShadow = m2.receiveShadow = true; m2.visible = false;
    scene.add(m2); bois.push(m2);
  }

  /* ── LA LUMIÈRE ───────────────────────────────────────────────────────
     La lampe reste HORS CADRE : c'est la flaque de lumière qui compte, pas
     son ustensile. À moins de deux unités, l'intensité doit être basse,
     sinon tout ce qui est sur le plateau sature. */
  scene.add(new THREE.AmbientLight(0x342b1d, 0.40));
  var lampe = new THREE.PointLight(0xffc287, 1.42, 8.6, 1.55);
  lampe.position.set(-0.02, 1.94, 0.66);
  lampe.castShadow = true; lampe.shadow.bias = -0.0013; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var appoint = new THREE.PointLight(0xffb877, 0.0, 5.6, 1.8);
  appoint.position.set(0.55, 1.28, -0.62); scene.add(appoint);
  var froide = new THREE.DirectionalLight(0x8fa8c6, 0.28); froide.position.set(2.6, 1.8, 1.4); scene.add(froide);
  var fond2 = new THREE.PointLight(0xd9a469, 0.62, 6.4, 1.5); fond2.position.set(0.2, 2.15, -0.42); scene.add(fond2);

  /* ── CHORÉGRAPHIE ─────────────────────────────────────────────────── */
  var G = 0, T = 0, phase = 0;
  var st = { eclat: 0, rail: 0, cadence: 0, groupe: 0, arret: 0, depouille: 0, veille: 0, lueur: 0, debit: 0 };
  function set(g) { G = g; }
  function compute() {
    st.eclat     = ss(0.55, 1.55, G);
    st.rail      = ss(1.15, 1.90, G);
    st.cadence   = ss(2.05, 2.62, G);
    st.groupe    = ss(2.28, 2.88, G);
    /* on ôte une station, tout s'arrête — puis elle revient */
    st.arret     = ss(2.70, 2.88, G) * (1 - ss(3.02, 3.20, G));
    st.depouille = ss(3.28, 4.02, G);
    st.veille    = ss(4.22, 4.88, G);
    st.lueur     = ss(5.05, 5.70, G);
    st.debit = (0.14 + 0.5 * st.eclat + 0.8 * st.cadence + 0.5 * st.depouille) * (1 - st.arret);
  }

  function frame(dt) {
    T += dt; compute();
    phase += dt * st.debit * 0.40;

    var vivant = st.cadence * (1 - st.arret);
    function bat(retard) { return 0.5 + 0.5 * Math.sin((phase - retard) * 6.283 * 1.8); }

    var e = st.eclat;
    for (var k = 0; k < 4; k++) {
      var g0 = stations[k];
      var a0 = (k / 4) * 6.283;
      var sx = TOOLX + Math.cos(a0) * 0.045, sz = 0.02 + Math.sin(a0) * 0.045, sy = BY + 0.575;
      var arc = Math.sin(Math.PI * e) * 0.24;     /* elles s'ARRACHENT du manche */
      g0.position.set(lerp(sx, POSTX[k], e), lerp(sy, TETEY, e) + arc, lerp(sz, RZ, e));
      g0.rotation.z = lerp((k - 1.5) * 0.26, 0, e);
      g0.rotation.x = lerp((k % 2 ? 1 : -1) * 0.16, 0, e);
      g0.position.y -= vivant * 0.042 * bat(k * 0.16);
      /* le retrait : c'est la DERNIÈRE station qu'on ôte, celle qui touche
         au sébile — la pièce cale alors sous les yeux, juste avant d'arriver */
      if (k === 3) g0.position.y += st.arret * 0.52;

      var mo = montants[k];
      mo.visible = e > 0.35;
      mo.position.set(POSTX[k], BY + 0.115 + (k === 3 ? st.arret * 0.52 : 0), RZ);
      mo.scale.y = cl((e - 0.35) / 0.4);

      var bi = bielles[k];
      bi.visible = st.cadence > 0.12 && !(k === 3 && st.arret > 0.5);
      var top = g0.position.y - 0.24, bot = BY - 0.115;
      bi.position.set(POSTX[k], (top + bot) / 2, 0.11);
      bi.scale.y = Math.max(0.02, (top - bot) / 0.30);

      var cm = cames[k];
      cm.visible = st.cadence > 0.12;
      cm.position.set(POSTX[k], BY - 0.115, 0.02);
      cm.rotation.x = phase * 6.283;

      /* les manches tombent : la tête, réduite à sa lame, va plus vite */
      var gr = grips[k];
      gr.visible = st.depouille < 0.94 && e > 0.42;
      gr.scale.setScalar(1 - 0.88 * st.depouille);
      g0.children[0].material = st.depouille > 0.5 ? acierVif : acier;
    }

    /* le manche commun, vidé, s'en va se coucher au bout de l'établi */
    var d0 = ss(0.55, 1.35, G);
    mancheCommun.position.set(lerp(TOOLX, X0 - 0.02, d0), lerp(BY + 0.262, BY + 0.145, d0), lerp(0.02, -0.20, d0));
    mancheCommun.rotation.z = lerp(0, Math.PI / 2, d0);
    virole.position.set(mancheCommun.position.x + d0 * 0.185, mancheCommun.position.y + (1 - d0) * 0.21, mancheCommun.position.z);
    virole.rotation.z = mancheCommun.rotation.z;

    rail.visible = st.rail > 0.05;
    rail.scale.y = cl(st.rail / 0.6);

    doubles.forEach(function (g0, n) {
      var seuil = 0.18 + n * 0.24;
      g0.visible = st.groupe > seuil;
      var f = cl((st.groupe - seuil) / 0.3);
      g0.scale.setScalar(0.4 + 0.6 * f);
      g0.position.y = TETEY - vivant * 0.042 * bat(DOUBLES[n][0] * 0.16 + 0.05 * n);
    });

    arbre.visible = st.cadence > 0.06;
    arbre.scale.y = cl(st.cadence / 0.5);
    arbre.rotation.x = phase * 6.283;

    veilleur.visible = st.veille > 0.05;
    veilleur.scale.setScalar(0.35 + 0.65 * cl(st.veille / 0.5));
    veilleur.position.y = BY + 0.20 - vivant * 0.036 * bat(0.34);

    /* les pièces sur le rail. Elles s'arrêtent avec la cadence : c'est ce
       que veut dire « un organe manquant ne ralentit pas, il supprime ». */
    var visibles = st.rail * NP;
    var A = X0 - 0.08, B = X1 - 0.10;
    var stop = (POSTX[3] - 0.10 - A) / (B - A);
    pieces.forEach(function (p, n) {
      p.visible = visibles > n + 0.2;
      if (!p.visible) return;
      var u = ((phase * 0.5 + n / NP) % 1 + 1) % 1;
      /* elles font la QUEUE devant l'organe manquant : toutes calées au
         même point, on n'en verrait qu'une, et l'arrêt ne se lirait pas */
      if (st.arret > 0.5 && u > stop) u = stop - 0.15 * (1 - (u - stop) / (1 - stop));
      p.position.set(lerp(A, B, u), RY + 0.028, RZ);
      p.material = u > 0.70 ? laitonVif : laitonMat;
    });

    /* le sébile se remplit — la production du corps, et non d'un homme */
    var fait = cl(ss(0.2, 1.4, G) * 0.10 + ss(1.3, 3.0, G) * 0.30 + ss(3.0, 6.0, G) * 0.62);
    tas.forEach(function (q, n) { q.visible = fait > (n + 0.5) / NT; });

    bois.forEach(function (m2, n) { m2.visible = st.depouille > 0.22 + n * 0.085; });

    lampe.intensity = 1.42 * (1 + 0.024 * Math.sin(T * 6.1) + 0.014 * Math.sin(T * 2.7));
    appoint.intensity = 0.70 * st.lueur;

    /* LA CAMÉRA. L'ensemble utile fait 2,15 unités : à 38° et en paysage la
       largeur vue vaut 1,07 fois la distance, il en faut donc 3,5 pour qu'il
       tienne dans les 57 % que la colonne de texte laisse, et le décalage de
       visée vaut alors 0,81. Il est PLAFONNÉ : proportionnel sans plafond,
       un plan large jetterait le sujet hors du cadre.
       La caméra DOMINE légèrement l'établi (on se tient devant un établi,
       on ne le regarde pas par la tranche) et le mur ferme le haut. */
    var q0 = ss(0, 1, Math.min(1, G / 1.8));
    var q1 = st.arret;
    var cx = lerp(-0.14, 0.12, q0), cy = lerp(1.74, 1.58, q0), cz = lerp(3.46, 3.75, q0);
    cz = lerp(cz, 3.42, q1); cx = lerp(cx, 0.30, q1);
    var camA = V3(lerp(0.22, 0.12, q0) + q1 * 0.30, lerp(1.06, 1.04, q0), 0.02);
    camera.position.set(cx + 0.014 * Math.sin(T * 0.27), cy + 0.010 * Math.sin(T * 0.31), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.20 * dist, 0.70));
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h2 = canvas.clientHeight; if (!w || !h2) return;
    renderer.setSize(w, h2, false); camera.aspect = w / h2;
    camera.fov = w / h2 > 1.2 ? 38 : Math.min(70, 2 * Math.atan(Math.tan(50 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
