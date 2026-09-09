/* LE MONDE DE LA VALEUR QUI SE VALORISE — le même plateau, six fois.

   Le concept n'est pas un objet mais un MOUVEMENT, et il ne fallait pourtant
   pas d'un circuit : le jeu du site en est un, et la page du communisme a
   déjà ses deux tracés. Le mouvement se joue donc SUR PLACE.

   Un seul plateau de comptoir. La forme y alterne — une colonne d'écus, puis
   un ballot de coton, puis les écus de nouveau — pendant que la grandeur
   monte d'un dixième à chaque tour : c'est la même valeur, elle change
   d'aspect ET de grandeur, et elle revient toujours au même endroit.
   Derrière, l'ardoise du comptoir inscrit la série — cent, cent dix, cent
   vingt et un… — et la dernière ligne se perd sous le bord : le mouvement ne
   contient en lui-même aucun terme. À droite la bourse, qui est le point de
   départ de l'argent et son point de retour.

   Deux réglages qui tiennent la démonstration : la taille de la colonne
   d'écus ne change qu'au moment où elle est INVISIBLE (à mi-tour), et celle
   du ballot qu'au moment où il l'est — sinon on verrait grossir un objet,
   au lieu de voir revenir une somme plus grande.

   Tout est fonction de g, donc réversible. Seul le vacillement de la lampe
   est temporel. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.1, 5.6);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 577; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── matières ─────────────────────────────────────────────────────────
     UNE TEXTURE QUI PORTE SA COULEUR NE SE MULTIPLIE PAS PAR UN SECOND
     BRUN : le piège payé sur le râtelier, où le panneau tombait au noir. */
  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8a6a42'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 300; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '58,40,20' : '196,164,116') + ',' + (0.06 + rnd() * 0.18) + ')'; g.lineWidth = 1 + rnd() * 3; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.009 + i) * 9); g.stroke(); }
  });
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8f8271'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 11000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '48,34,20' : '198,186,164') + ',' + (rnd() * 0.11) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });
  var toile = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#b6a684'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 3000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '80,66,44' : '224,212,186') + ',' + (rnd() * 0.16) + ')'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 5, 1 + rnd()); }
  });
  var argent = std({ color: 0x8e8778, metalness: 0.34, roughness: 0.52 });
  var laiton = std({ color: 0xa8842f, metalness: 0.80, roughness: 0.34 });
  var corde = std({ color: 0x6d5836, roughness: 0.9 });
  var peau = std({ color: 0x2b1c10, roughness: 0.86 });

  /* ── le mur, le sol ── */
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), std({ map: platre, roughness: 0.97, color: 0x6d6356 }));
  mur.position.set(0, 1.6, -0.58); mur.receiveShadow = true; scene.add(mur);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), std({ color: 0x3a3026, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(0, 0, 0.5); sol.receiveShadow = true; scene.add(sol);

  /* ── LE COMPTOIR ── */
  var BY = 0.34;
  var plateauB = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.08, 0.56), std({ map: boisTex, roughness: 0.84, color: 0x8a7660 }));
  plateauB.position.set(0, BY - 0.04, -0.14); plateauB.castShadow = plateauB.receiveShadow = true; scene.add(plateauB);
  var tablier = new THREE.Mesh(new THREE.BoxGeometry(2.20, 0.17, 0.05), std({ map: boisTex, roughness: 0.88, color: 0x877360 }));
  tablier.position.set(0, BY - 0.165, 0.11); tablier.castShadow = true; scene.add(tablier);

  /* ── L'ARDOISE : la forme où l'identité de la valeur est constatée ──── */
  var ARD_W = 580, ARD_H = 640, ecrit = -1;
  var ardCv = document.createElement('canvas'); ardCv.width = ARD_W; ardCv.height = ARD_H;
  var ardCtx = ardCv.getContext('2d');
  var ardTex = new THREE.CanvasTexture(ardCv);
  if (THREE.sRGBEncoding) ardTex.encoding = THREE.sRGBEncoding;
  var SERIE = ['100', '110', '121', '133', '146', '161', '177'];
  function ecrire(k) {
    if (k === ecrit) return; ecrit = k;
    var g = ardCtx, w = ARD_W, h = ARD_H;
    g.fillStyle = '#2b2d2a'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 5000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '20,22,20' : '120,126,118') + ',' + (rnd() * 0.10) + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    /* la craie n'est pas un trait net : on repasse deux fois, décalé */
    for (var n = 0; n < Math.min(k, SERIE.length); n++) {
      var y = 78 + n * 96;
      g.font = 'italic 500 84px Georgia, serif';
      g.fillStyle = 'rgba(238,234,220,.92)'; g.fillText(SERIE[n], w / 2, y);
      g.fillStyle = 'rgba(238,234,220,.28)'; g.fillText(SERIE[n], w / 2 + 1.6, y + 1.6);
    }
    ardTex.needsUpdate = true;
  }
  ecrire(0);
  var ardoise = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.64, 0.035), std({ map: ardTex, roughness: 0.92 }));
  ardoise.position.set(0.05, 1.14, -0.545); ardoise.castShadow = ardoise.receiveShadow = true; scene.add(ardoise);
  var cadre = new THREE.Group();
  [[0, 0.336], [0, -0.336]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.042, 0.05), std({ map: boisTex, roughness: 0.86, color: 0x877360 }));
    m.position.set(p[0], p[1], 0); m.castShadow = true; cadre.add(m);
  });
  [[-0.313, 0], [0.313, 0]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.71, 0.05), std({ map: boisTex, roughness: 0.86, color: 0x877360 }));
    m.position.set(p[0], p[1], 0); m.castShadow = true; cadre.add(m);
  });
  cadre.position.set(0.05, 1.14, -0.535); scene.add(cadre);

  /* ── LE PLATEAU : la place, toujours la même ── */
  var PX = 0.02, PZ = -0.14, PY = BY + 0.012;
  var plat = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.195, 0.022, 30), laiton);
  plat.position.set(PX, PY, PZ); plat.castShadow = plat.receiveShadow = true; scene.add(plat);

  /* ── LA COLONNE D'ÉCUS ── */
  var NEC = 26, ecus = [], EC_H = 0.0145;
  for (var i = 0; i < NEC; i++) {
    var e = new THREE.Mesh(new THREE.CylinderGeometry(0.055 + rnd() * 0.005, 0.055 + rnd() * 0.005, EC_H, 22), argent);
    e.position.set(PX + (rnd() - 0.5) * 0.020, PY + 0.011 + i * EC_H, PZ + (rnd() - 0.5) * 0.020);
    e.rotation.set((rnd() - 0.5) * 0.10, rnd() * 3, (rnd() - 0.5) * 0.10);
    e.userData.rx = e.rotation.x; e.userData.rz = e.rotation.z;
    e.userData.dx = e.position.x; e.userData.dz = e.position.z;
    e.castShadow = e.receiveShadow = true; scene.add(e); ecus.push(e);
  }
  var colonne = new THREE.Group();   /* pour l'échelle d'ensemble */

  /* ── LE BALLOT : la même valeur, une autre forme ── */
  var ballot = new THREE.Group();
  var sac = new THREE.Mesh(new THREE.BoxGeometry(0.30, 1, 0.24), std({ map: toile, roughness: 0.93 }));
  sac.position.y = 0.5; ballot.add(sac);
  [-0.09, 0.09].forEach(function (dx) {
    var c = new THREE.Mesh(new THREE.BoxGeometry(0.018, 1.02, 0.26), corde);
    c.position.set(dx, 0.5, 0); ballot.add(c);
  });
  var cq = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.016, 0.018), corde);
  cq.position.set(0, 0.5, 0.13); ballot.add(cq);
  ballot.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  ballot.position.set(PX, PY + 0.011, PZ); scene.add(ballot);

  /* ── LA BOURSE : le point de départ et le point de retour ── */
  var bourse = new THREE.Group();
  var sph = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 14), peau);
  sph.scale.set(1.12, 0.60, 0.92); sph.position.y = 0.052; bourse.add(sph);
  var col = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.038, 0.042, 14), peau);
  col.position.y = 0.106; bourse.add(col);
  var lien = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 6, 16), corde);
  lien.rotation.x = Math.PI / 2; lien.position.y = 0.104; bourse.add(lien);
  /* trois écus tombés à côté : c'est ce qui dit « bourse » d'un coup d'œil.
     Trois plis en boules avaient été essayés — ils faisaient des oreilles. */
  [[-0.115, -0.028, 0.4], [-0.145, 0.030, 1.9], [-0.100, 0.052, 3.1]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.008, 18), argent);
    m.position.set(p[0], 0.006, p[1]); m.rotation.y = p[2]; bourse.add(m);
  });
  bourse.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  /* LA COLONNE COLLANTE EST ÉTROITE : à 0,62 la bourse touchait le bord
     droit (96 % de la largeur en portrait). À 0,55 elle y tient. */
  bourse.position.set(0.55, BY, -0.04); scene.add(bourse);

  /* ── l'étagère et le coffret : la matière du haut, pour la colonne ── */
  var etagere = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, 0.18), std({ map: boisTex, roughness: 0.88, color: 0x877360 }));
  etagere.position.set(-0.52, 1.74, -0.50); etagere.castShadow = etagere.receiveShadow = true; scene.add(etagere);
  var coffret = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.17, 0.16), std({ map: boisTex, roughness: 0.8, color: 0x7e6a54 }));
  coffret.position.set(-0.56, 1.845, -0.50); coffret.castShadow = true; scene.add(coffret);
  var ferrure = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.022, 0.17), laiton);
  ferrure.position.set(-0.56, 1.90, -0.50); ferrure.castShadow = true; scene.add(ferrure);

  /* ── la lumière : la source est hors champ, de loin et de haut ── */
  var ambiante = new THREE.AmbientLight(0x3a3026, 0.36); scene.add(ambiante);
  var lampe = new THREE.PointLight(0xffc286, 1.45, 6, 1.7); lampe.position.set(-0.72, 1.86, 1.02);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var appoint = new THREE.PointLight(0xb69a78, 0.40, 5, 2); appoint.position.set(1.25, 0.95, 1.05); scene.add(appoint);
  var falot = new THREE.PointLight(0xffd9a0, 0, 0.55, 2); falot.position.set(0.55, 0.50, 0.22); scene.add(falot);

  /* ── chorégraphie ─────────────────────────────────────────────────── */
  var G = 0, T = 0;
  var st = { tour: 0, somme: 100, wMon: 1, wCom: 0, ecrit: 1, poche: 0 };
  function set(g) { G = g; }
  function compute() {
    /* cinq tours, répartis sur presque tout le document */
    var tau = 5 * cl((G - 0.55) / 4.85);
    st.tour = tau;
    var u = tau - Math.floor(tau);
    var vers = ss(0.15, 0.42, u);      /* les écus s'en vont, le ballot arrive */
    var revient = ss(0.58, 0.85, u);   /* le ballot s'en va, les écus reviennent */
    st.wCom = cl(vers - revient);
    st.wMon = 1 - st.wCom;
    /* LA GRANDEUR NE CHANGE QUE QUAND LA FORME EST INVISIBLE : les écus au
       demi-tour, le ballot au tour entier — sinon on verrait un objet
       grossir, au lieu d'une somme revenir plus grande. */
    st.nMon = Math.floor(tau + 0.5);
    st.nCom = Math.floor(tau);
    st.somme = 100 * Math.pow(1.1, st.nMon);
    st.ecrit = 1 + st.nMon;
    st.poche = ss(3.9, 4.6, G) * (1 - ss(5.2, 5.6, G));
  }

  function frame(dt) {
    T += dt; compute();
    ecrire(st.ecrit);

    /* LA COLONNE D'ÉCUS : le nombre de pièces dit la somme */
    var nb = Math.round(13 * Math.pow(1.1, st.nMon));
    var em = ss(0, 1, st.wMon);
    for (var i = 0; i < NEC; i++) {
      var e = ecus[i];
      var vis = i < nb && em > 0.02;
      e.visible = vis;
      if (vis) {
        /* elles arrivent par le haut, la pile se pose */
        var d = cl((em - 0.10 - (i / Math.max(1, nb)) * 0.55) / 0.35);
        e.position.y = PY + 0.011 + i * EC_H + 0.09 * (1 - d) * (1 - d);
        e.position.x = e.userData.dx; e.position.z = e.userData.dz;
        e.scale.setScalar(0.55 + 0.45 * em);
      }
    }

    /* LE BALLOT : sa hauteur dit la même somme */
    var hb = 0.19 * Math.pow(1.1, st.nCom) * (0.35 + 0.65 * ss(0, 1, st.wCom));
    ballot.visible = st.wCom > 0.02;
    ballot.scale.set(0.60 + 0.40 * ss(0, 1, st.wCom), hb, 0.60 + 0.40 * ss(0, 1, st.wCom));
    ballot.position.set(PX, PY + 0.011, PZ);

    /* LA BOURSE : elle est là depuis le début, et le regard vient la
       prendre quand le concept en a besoin */
    falot.intensity = 1.5 * st.poche;
    bourse.position.y = BY + 0.012 * st.poche;
    bourse.rotation.z = -0.10 * st.poche;

    lampe.intensity = 1.45 * (1 + 0.03 * Math.sin(T * 7.1) + 0.02 * Math.sin(T * 3.3));

    /* LE CADRAGE — l'essentiel (le plateau, l'ardoise, la bourse) tient dans
       la bande que voit le cadre en paysage ; la colonne collante, plus
       haute, reçoit l'étagère en haut et le sol en bas. Et elle est plus
       ÉTROITE : la bourse à 0,62 y tient de justesse, rien ne doit aller
       plus loin. */
    var q = ss(0, 1, Math.min(1, G / 2.4));
    var dz = lerp(2.10, 1.94, q);
    var camA = V3(lerp(0.00, 0.06, q), lerp(0.88, 0.83, q), -0.28);
    camera.position.set(camA.x + 0.012 * Math.sin(T * 0.22), camA.y + 0.14 + 0.008 * Math.sin(T * 0.27), camA.z + dz);
    camera.lookAt(camA);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h > 1.2 ? 38 : Math.min(70, 2 * Math.atan(Math.tan(50 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    ardTex.dispose(); renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
