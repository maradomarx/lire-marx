/* LE MONDE DE LA MACHINE-OUTIL — la transmission.

   La scène RIME avec le râtelier de la division du travail, et c'est voulu :
   c'est le même atelier à l'étape suivante. Là les outils pendaient immobiles
   à leurs chevilles ; ici ils sont serrés dans un bâti et entraînés d'en
   haut.

   Sur l'établi, le rouet et sa broche unique : le nombre d'outils qu'un homme
   met en jeu est borné par le nombre de ses organes. Puis le bâti se lève
   avec ses DOUZE broches, la poulie paraît et la courroie descend — de très
   haut, et LE MOTEUR N'EST PAS DANS LE CADRE. Cette absence est l'argument :
   le moteur a été l'homme, l'âne, l'eau, la vapeur, et la coupure n'est pas
   là. Puis tout tourne, le rouet est poussé de côté, le tabouret reste vide.
   D'autres courroies descendent aux deux bords : le système continue au-delà.
   Et le cadran monte : ce qu'on ne peut plus prendre en longueur se prend
   en vitesse.

   Le cadre est le plus souvent en PORTRAIT (la colonne collante) : la scène
   a donc de la matière en hauteur — l'établi et le sol en bas, l'étagère,
   le cadran et les courroies qui montent hors champ.

   Tout est fonction de g, donc réversible. Seules les rotations sont
   temporelles, et leur vitesse est commandée par g. */
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.2, 6.0);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 911; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── matières ── */
  var fonte = std({ color: 0x22222a, metalness: 0.28, roughness: 0.68 });
  var acier = std({ color: 0x33333a, metalness: 0.38, roughness: 0.55 });
  var laiton = std({ color: 0xa8842f, metalness: 0.80, roughness: 0.34 });
  var cuir = std({ color: 0x2c1d12, roughness: 0.88 });
  var fil = std({ color: 0xc9bda2, roughness: 0.92 });

  /* UNE TEXTURE QUI PORTE SA COULEUR NE SE MULTIPLIE PAS PAR UN SECOND BRUN :
     le piège payé sur le râtelier — le panneau y tombait à (27,12,5). */
  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8a6a42'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 300; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '58,40,20' : '196,164,116') + ',' + (0.06 + rnd() * 0.18) + ')'; g.lineWidth = 1 + rnd() * 3; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.009 + i) * 9); g.stroke(); }
  });
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8f8271'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 11000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '48,34,20' : '198,186,164') + ',' + (rnd() * 0.11) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });

  /* ── le mur, le sol ── */
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), std({ map: platre, roughness: 0.97, color: 0x6d6356 }));
  mur.position.set(0, 1.6, -0.56); mur.receiveShadow = true; scene.add(mur);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), std({ color: 0x3a3026, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(0, 0, 0.5); sol.receiveShadow = true; scene.add(sol);

  /* ── L'ÉTABLI ── */
  var BY = 0.34;
  var plateau = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.07, 0.54), std({ map: boisTex, roughness: 0.85, color: 0x8a7660 }));
  plateau.position.set(0, BY - 0.035, -0.18); plateau.castShadow = true; plateau.receiveShadow = true; scene.add(plateau);
  var tablier = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.15, 0.05), std({ map: boisTex, roughness: 0.88, color: 0x877360 }));
  tablier.position.set(0, BY - 0.145, 0.07); tablier.castShadow = true; scene.add(tablier);

  /* ── L'ÉTAGÈRE et ses bobines ── */
  var etagere = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.035, 0.16), std({ map: boisTex, roughness: 0.88, color: 0x877360 }));
  etagere.position.set(-0.31, 1.64, -0.48); etagere.castShadow = true; etagere.receiveShadow = true; scene.add(etagere);
  [-0.62, -0.42, -0.22, -0.02].forEach(function (x, i) {
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.10 + i * 0.012, 12), fil);
    b.position.set(x, 1.71 + i * 0.006, -0.48); b.castShadow = true; scene.add(b);
  });

  /* ── LE ROUET : une roue, une broche ─────────────────────────────────
     « Les virtuoses capables de filer deux fils à la fois étaient presque
     aussi rares que des veaux à deux têtes. » */
  var rouet = new THREE.Group();
  var rRoue = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.012, 8, 26), std({ map: boisTex, roughness: 0.8, color: 0xa38f72 }));
  rRoue.position.y = 0.145; rouet.add(rRoue);
  for (var i = 0; i < 6; i++) {
    var a = i / 6 * Math.PI * 2;
    var ry = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.125, 0.014), std({ map: boisTex, roughness: 0.8, color: 0xa48c70 }));
    ry.position.set(Math.cos(a) * 0.068, 0.145 + Math.sin(a) * 0.068, 0); ry.rotation.z = a - Math.PI / 2; rouet.add(ry);
  }
  var rMoy = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 10), acier);
  rMoy.rotation.x = Math.PI / 2; rMoy.position.y = 0.145; rouet.add(rMoy);
  var rBati = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.030, 0.10), std({ map: boisTex, roughness: 0.86, color: 0x9e8668 }));
  rouet.add(rBati);
  [-0.13, 0.13].forEach(function (dx) {
    var p = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.16, 0.022), std({ map: boisTex, roughness: 0.86, color: 0x9e8668 }));
    p.position.set(dx, 0.09, 0); rouet.add(p);
  });
  /* LA broche : une seule */
  var rBroche = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.15, 8), acier);
  rBroche.position.set(0.135, 0.235, 0.02); rouet.add(rBroche);
  var rBob = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.06, 12), fil);
  rBob.position.set(0.135, 0.215, 0.02); rouet.add(rBob);
  rouet.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  rouet.position.set(-0.62, BY, -0.10); scene.add(rouet);

  /* ── LA MACHINE-OUTIL : douze broches, une seule impulsion ── */
  var MX = 0.105, NB = 12;
  var machine = new THREE.Group();
  var bati = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.32), fonte);
  bati.position.y = 0.14; machine.add(bati);
  var table = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.028, 0.36), fonte);
  table.position.y = 0.29; machine.add(table);
  var pied = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.030, 0.38), fonte);
  pied.position.y = 0.015; machine.add(pied);
  [-0.26, 0.26].forEach(function (dx) {
    var nerv = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.24, 0.34), fonte);
    nerv.position.set(dx, 0.15, 0); nerv.castShadow = true; machine.add(nerv);
  });
  [-0.26, -0.09, 0.09, 0.26].forEach(function (dx) {
    var bou = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.012, 8), acier);
    bou.rotation.x = Math.PI / 2; bou.position.set(dx, 0.245, 0.161); machine.add(bou);
  });
  /* les broches : chacune sa bobine, toutes identiques */
  var broches = [];
  for (i = 0; i < NB; i++) {
    var x = -0.245 + i * 0.0445;
    var b = new THREE.Group();
    var tige = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0045, 0.25, 8), acier);
    tige.position.y = 0.125; b.add(tige);
    var bob = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.085, 12), fil);
    bob.position.y = 0.075; b.add(bob);
    var fus = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 12), laiton);
    fus.position.y = 0.012; b.add(fus);
    b.position.set(x, 0.304, 0.0);
    b.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    machine.add(b); broches.push(b);
  }
  /* LA POULIE, sur le flanc droit : c'est par elle que le mouvement arrive */
  var poulie = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.055, 22), acier);
  poulie.rotation.x = Math.PI / 2; poulie.position.set(0.375, 0.155, 0.13); machine.add(poulie);
  var poulieG = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.010, 6, 22), laiton);
  poulieG.position.set(0.375, 0.155, 0.13); machine.add(poulieG);
  /* UNE POULIE NE PEND PAS DANS LE VIDE : un bras la rattache au bâti */
  var bras = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.045), fonte);
  bras.position.set(0.315, 0.155, 0.055); bras.castShadow = true; machine.add(bras);
  var axe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.13, 10), acier);
  axe.rotation.x = Math.PI / 2; axe.position.set(0.375, 0.155, 0.10); machine.add(axe);
  machine.position.set(MX, BY, -0.20);
  bati.castShadow = table.castShadow = poulie.castShadow = true;
  bati.receiveShadow = table.receiveShadow = true;
  scene.add(machine);

  /* ── LA COURROIE : elle descend de très haut, ET LE MOTEUR N'EST PAS DANS
     LE CADRE. Cette absence est l'argument : le moteur a été l'homme, l'âne,
     l'eau, la vapeur — la coupure n'est pas là. ── */
  function brin(x, y0, y1, l) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(l || 0.032, 1, 0.012), cuir);
    m.position.set(x, (y0 + y1) / 2, 0.13); m.scale.y = (y1 - y0); m.castShadow = true; scene.add(m); return m;
  }
  var CY = BY + 0.155;
  var brinA = brin(MX + 0.375 - 0.105, CY, 2.30);
  var brinB = brin(MX + 0.375 + 0.105, CY, 2.30);
  /* LES AUTRES COURROIES : le système continue au-delà du cadre.
     Premier jet, chacune portait sa machine — un bâti gris et une grosse
     poulie pâle posés au sol, donc à demi cachés par l'établi, l'un juste
     derrière le rouet : de l'encombrement, pas un système. Il ne reste que
     LES COURROIES, qui sortent de derrière l'établi et montent hors champ.
     C'est assez : ce qu'elles entraînent n'a pas besoin d'être montré. */
  var autres = [];
  [-0.62, 0.79].forEach(function (x) {
    var g = new THREE.Group();
    [-0.075, 0.075].forEach(function (dx) {
      var t = new THREE.Mesh(new THREE.BoxGeometry(0.032, 2.20, 0.012), cuir);
      /* PAS D'OMBRE PORTÉE sur ces quatre-là : quatre lanières minces
         projetaient autant de raies sur le mur, et le fond se mettait à
         rayer toute l'image. */
      t.position.set(dx, 1.20, 0); g.add(t);
    });
    g.position.set(x, 0, -0.50); g.visible = false; scene.add(g); autres.push(g);
  });

  /* ── PAS DE TABOURET. Il en a existé un : posé sur l'établi il devenait
     une table, posé au sol devant il sortait par le bas du cadre, et un
     objet qu'on ne reconnaît pas dit moins que rien. Ce qui porte l'absence
     de la main, c'est le rouet POUSSÉ DE CÔTÉ, qui était l'outil de cette
     main — et la légende le dit. ── */

  /* ── LE CADRAN : la vitesse ── */
  var cadranTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#cbb68d'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill();
    g.strokeStyle = '#3a2a14'; g.fillStyle = '#3a2a14';
    for (var k = 0; k <= 10; k++) {
      var a = -Math.PI * 1.18 + (Math.PI * 1.36) * k / 10, gros = k % 5 === 0;
      g.lineWidth = gros ? 6 : 3; g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * (w / 2 - 14), h / 2 + Math.sin(a) * (h / 2 - 14));
      g.lineTo(w / 2 + Math.cos(a) * (w / 2 - (gros ? 46 : 32)), h / 2 + Math.sin(a) * (h / 2 - (gros ? 46 : 32)));
      g.stroke();
    }
    /* PAS DE MOT SUR CE CADRAN. Le cap d'un cylindre retourne son UV en
       miroir, et un mot de cinq lettres redressé à la main sur une pastille
       de cent vingt pixels ne se lit de toute façon pas : la graduation dit
       assez, et la légende dit le reste. */
  });
  var cadran = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.022, 26), std({ map: cadranTex, roughness: 0.8 }));
  /* LE CADRAN A CHANGÉ DE PLACE : à gauche, une des courroies lui passait
     en travers. Au-dessus du bâti, rien ne le croise. */
  cadran.rotation.x = Math.PI / 2; cadran.position.set(0.02, 1.30, -0.52);
  cadran.castShadow = cadran.receiveShadow = true; scene.add(cadran);
  var aig = new THREE.Group();
  var aigC = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.010, 0.008), laiton);
  aigC.position.x = 0.036; aig.add(aigC);
  var aigM = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 10), laiton);
  aigM.rotation.x = Math.PI / 2; aig.add(aigM);
  aig.position.set(0.02, 1.30, -0.505); scene.add(aig);

  /* ── la lumière ── */
  /* LA SOURCE EST HORS CHAMP, de loin et de haut : approchée, elle change
     les ombres en pans noirs qui se recouvrent (leçon du râtelier). */
  var ambiante = new THREE.AmbientLight(0x3a3026, 0.30); scene.add(ambiante);
  var lampe = new THREE.PointLight(0xffc286, 1.85, 6, 1.7); lampe.position.set(-0.70, 1.82, 0.98);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var appoint = new THREE.PointLight(0xb69a78, 0.42, 5, 2); appoint.position.set(1.20, 0.90, 1.10); scene.add(appoint);
  /* la lumière qui parcourt les trois parties : elle n'existe qu'au
     troisième temps, et elle finit sur la machine d'opération */
  var falot = new THREE.PointLight(0xffd9a0, 0, 0.75, 2); scene.add(falot);

  /* ── chorégraphie ─────────────────────────────────────────────────── */
  var G = 0, T = 0, TOUR = 0;
  var st = { bati: 0, courroie: 0, tourne: 0, systeme: 0, vitesse: 0, parcours: 0 };
  function set(g) { G = g; }
  function compute() {
    var s1 = ss(0.7, 1.9, G);     /* le bâti se lève */
    var s2 = ss(1.9, 3.0, G);     /* la poulie, la courroie, la lumière qui parcourt */
    var s3 = ss(3.0, 4.0, G);     /* tout tourne, le rouet est poussé */
    var s4 = ss(4.0, 5.0, G);     /* le système continue */
    var s5 = ss(5.0, 5.8, G);     /* le cadran monte */
    st.bati = s1; st.courroie = s2; st.tourne = s3; st.systeme = s4; st.vitesse = s5;
    /* le parcours des trois parties : il monte le long de la courroie et
       revient à la machine — le moteur, lui, est hors du cadre */
    st.parcours = s2 * (1 - ss(0.85, 1, s2));
    st.rpm = 0.35 * s3 + 0.85 * s4 + 1.9 * s5;
  }

  function frame(dt) {
    T += dt; compute();
    TOUR += dt * st.rpm * 7.5;

    /* le bâti se lève et les broches paraissent */
    var e = st.bati;
    machine.visible = e > 0.01;
    machine.scale.set(1, 0.06 + 0.94 * e, 1);
    machine.position.y = BY;
    broches.forEach(function (b, i) {
      var p = cl((e - 0.25 - (i / NB) * 0.45) / 0.22);
      b.visible = p > 0.02;
      b.scale.set(1, 0.05 + 0.95 * p, 1);
      b.rotation.y = TOUR * (1 + (i % 3) * 0.04);
    });
    poulie.rotation.y = 0; poulie.rotation.z = -TOUR * 0.55;
    poulieG.rotation.z = -TOUR * 0.55;
    poulie.visible = poulieG.visible = st.courroie > 0.05;

    /* la courroie descend de très haut */
    var c = st.courroie;
    [brinA, brinB].forEach(function (m) {
      m.visible = c > 0.03;
      var y1 = lerp(CY + 0.05, 2.30, ss(0, 0.75, c));
      m.scale.y = Math.max(0.02, y1 - CY); m.position.y = (CY + y1) / 2;
    });

    /* le rouet est poussé de côté, et il s'incline : la main n'y est plus */
    var d = st.tourne;
    rouet.position.set(-0.62 - 0.14 * d, BY + 0.0, -0.10 + 0.10 * d);
    rouet.rotation.z = -0.26 * d;
    rRoue.rotation.z = -TOUR * 0.10 * (1 - d);

    /* le système continue au-delà du cadre */
    autres.forEach(function (g, i) {
      var p = ss(0.10 + i * 0.28, 0.75 + i * 0.20, st.systeme);
      g.visible = p > 0.02; g.scale.set(1, 0.08 + 0.92 * p, 1);
    });

    /* le cadran : ce qu'on ne peut plus prendre en longueur se prend en vitesse */
    var v = cl(st.rpm / 3.1);
    aig.rotation.z = lerp(Math.PI * 0.88, Math.PI * 0.12, v);

    /* la lumière parcourt les trois parties et revient à la troisième */
    var u = st.parcours;
    falot.intensity = 2.1 * u;
    falot.position.set(lerp(MX + 0.32, MX, ss(0.35, 1, u)) + 0.06,
      lerp(1.95, BY + 0.42, ss(0.35, 1, u)), 0.22);
    ambiante.intensity = lerp(0.30, 0.15, u);
    lampe.intensity = lerp(1.85, 1.05, u) * (1 + 0.03 * Math.sin(T * 7.1) + 0.02 * Math.sin(T * 3.3));

    /* LE CADRAGE — l'essentiel (le rouet, le bâti, le tabouret) tient dans
       la bande que voit le cadre en paysage ; la colonne collante, plus
       haute, reçoit l'étagère, le cadran et les courroies qui montent. */
    var q = ss(0, 1, Math.min(1, G / 2.4));
    /* LA COLONNE COLLANTE EST PLUS ÉTROITE QUE L'IMAGE FIXE : à 1,76 de
       recul elle ne voyait que ±0,72, et le rouet poussé de côté comme le
       tabouret en sortaient. À 2,00 elle voit ±0,82, ce qui les tient. */
    var dz = lerp(2.16, 2.00, q);
    var camA = V3(lerp(-0.10, 0.04, q), lerp(0.77, 0.72, q), -0.14);
    camera.position.set(camA.x + 0.012 * Math.sin(T * 0.22), camA.y + 0.15 + 0.008 * Math.sin(T * 0.28), camA.z + dz);
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
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
