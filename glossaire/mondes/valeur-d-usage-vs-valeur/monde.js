/* LE MONDE DE LA VALEUR D'USAGE ET DE LA VALEUR — trois mesures, puis une.

   « Comme valeurs d'usage, les marchandises sont avant tout de qualité
   différente ; comme valeurs d'échange, elles ne peuvent être que de
   différente quantité. » La figure est cette phrase.

   Trois choses sur un comptoir — une pièce de toile, une barre de fer, un
   sac de grain — et devant chacune SA mesure, qui n'appartient qu'à elle :
   l'aune, les poids, le boisseau. Puis la valeur d'usage est mise de côté :
   les trois corps passent au FANTÔME (« ils ont tous une même réalité
   fantômatique »), les trois mesures se retirent, et un sablier paraît.
   Trois tas de sable se forment, de trois grandeurs différentes : la même
   substance, et plus qu'une différence de quantité.

   Deux points de doctrine tenus par la scène. À gauche, la motte de terre
   et la laine brute NE REÇOIVENT PAS DE TAS : ce qui est utile sans provenir
   du travail est une valeur d'usage sans être une valeur. Et au dernier
   temps les corps reviennent SANS que les tas s'effacent — la marchandise
   est deux choses à la fois, et le chapitre ne dit pas que l'une remplace
   l'autre.

   Tout est fonction de g, donc réversible. */
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.3, 5.8);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 2087; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── matières ─────────────────────────────────────────────────────────
     UNE TEXTURE QUI PORTE SA COULEUR NE SE MULTIPLIE PAS PAR UN SECOND
     BRUN : le piège payé sur le râtelier. */
  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8a6a42'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 300; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '58,40,20' : '196,164,116') + ',' + (0.06 + rnd() * 0.18) + ')'; g.lineWidth = 1 + rnd() * 3; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.009 + i) * 9); g.stroke(); }
  });
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8f8271'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 11000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '48,34,20' : '198,186,164') + ',' + (rnd() * 0.11) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });
  var toileTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#a99a7c'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '72,60,40' : '214,202,176') + ',' + (rnd() * 0.16) + ')'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 5, 1 + rnd()); }
  });
  var laiton = std({ color: 0xa8842f, metalness: 0.80, roughness: 0.34 });
  var sable = std({ color: 0x6b5a38, roughness: 0.95 });
  var verre = std({ color: 0xcfe0e6, metalness: 0, roughness: 0.07, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });

  /* ── le mur, le comptoir, l'étagère ── */
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), std({ map: platre, roughness: 0.97, color: 0x675e51 }));
  mur.position.set(0, 1.4, -0.56); mur.receiveShadow = true; scene.add(mur);
  var BY = 0.34;
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.08, 0.58), std({ map: boisTex, roughness: 0.85, color: 0x8a7660 }));
  comptoir.position.set(0, BY - 0.04, -0.16); comptoir.castShadow = comptoir.receiveShadow = true; scene.add(comptoir);
  var tablier = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.17, 0.05), std({ map: boisTex, roughness: 0.88, color: 0x877360 }));
  tablier.position.set(0, BY - 0.165, 0.12); tablier.castShadow = true; scene.add(tablier);
  var etagere = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.035, 0.18), std({ map: boisTex, roughness: 0.88, color: 0x877360 }));
  etagere.position.set(-0.44, 1.02, -0.48); etagere.castShadow = etagere.receiveShadow = true; scene.add(etagere);
  [-0.66, -0.44, -0.22].forEach(function (x, i) {
    var r = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.15, 14), std({ map: toileTex, roughness: 0.93, color: 0xb8ab90 }));
    r.rotation.z = Math.PI / 2; r.position.set(x, 1.09 + i * 0.002, -0.48); r.castShadow = true; scene.add(r);
  });

  /* ── LES TROIS CORPS, chacun avec SA matière ─────────────────────────
     Chaque matériau est propre à son objet : c'est lui qu'on fera passer
     au fantôme, et il faut donc pouvoir le teindre sans teindre les autres. */
  var X = [-0.56, -0.12, 0.32], CZ = -0.16;
  var corps = [];
  function corpsDe(g, mats) { corps.push({ g: g, mats: mats, base: mats.map(function (m) { return m.color.clone(); }) }); }

  /* la toile : une pièce roulée, avec un pan qui retombe */
  var mToile = std({ map: toileTex, roughness: 0.93, color: 0xb8ab90, transparent: true, opacity: 1 });
  var toile = new THREE.Group();
  var rouleau = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.30, 18), mToile);
  rouleau.rotation.z = Math.PI / 2; rouleau.position.y = 0.078; toile.add(rouleau);
  var pan = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.006, 0.16), mToile);
  pan.position.set(0.0, 0.004, 0.15); toile.add(pan);
  toile.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  toile.position.set(X[0], BY, CZ); scene.add(toile); corpsDe(toile, [mToile]);

  /* le fer : une barre */
  var mFer = std({ color: 0x26262c, metalness: 0.18, roughness: 0.62, transparent: true, opacity: 1 });
  var fer = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.048, 0.088), mFer);
  fer.position.set(X[1], BY + 0.024, CZ); fer.castShadow = fer.receiveShadow = true; scene.add(fer);
  corpsDe(fer, [mFer]);

  /* le froment : un sac, et quelques grains répandus */
  var mSac = std({ map: toileTex, roughness: 0.94, color: 0xa4906d, transparent: true, opacity: 1 });
  var sac = new THREE.Group();
  var ventre = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 14), mSac);
  ventre.scale.set(1, 0.86, 0.9); ventre.position.y = 0.082; sac.add(ventre);
  var goulot = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.055, 0.055, 14), mSac);
  goulot.position.y = 0.175; goulot.rotation.z = 0.16; sac.add(goulot);
  sac.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  sac.position.set(X[2], BY, CZ); scene.add(sac); corpsDe(sac, [mSac]);

  /* ── LES TROIS MESURES : chacune n'appartient qu'à sa chose ── */
  var mesures = [];
  /* l'aune, appuyée au mur */
  var aune = new THREE.Group();
  var regle = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.40, 0.012), std({ map: boisTex, roughness: 0.8, color: 0xc0a884 }));
  regle.position.y = 0.20; aune.add(regle);
  [0.08, 0.16, 0.24, 0.32].forEach(function (y) {
    var t = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.004, 0.014), std({ color: 0x35291a, roughness: 0.9 }));
    t.position.set(0, y, 0.001); aune.add(t);
  });
  aune.position.set(X[0], BY, -0.46); aune.rotation.x = 0.20;
  aune.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  scene.add(aune); mesures.push(aune);
  /* les poids */
  var poids = new THREE.Group();
  [[-0.055, 0.055, 0.048], [0.005, 0.042, 0.036], [0.055, 0.032, 0.028]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(p[2] * 0.8, p[2], p[1], 16), laiton);
    m.position.set(p[0], p[1] / 2, 0); poids.add(m);
    var an = new THREE.Mesh(new THREE.TorusGeometry(p[2] * 0.4, 0.005, 6, 12), laiton);
    an.rotation.y = Math.PI / 2; an.position.set(p[0], p[1] + 0.008, 0); poids.add(an);
  });
  poids.position.set(X[1] + 0.14, BY, -0.44);
  poids.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(poids); mesures.push(poids);
  /* le boisseau */
  var boisseau = new THREE.Group();
  var seau = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.070, 0.13, 20, 1, true), std({ map: boisTex, roughness: 0.86, color: 0xb49a76, side: THREE.DoubleSide }));
  seau.position.y = 0.065; boisseau.add(seau);
  [0.022, 0.108].forEach(function (y) {
    var c = new THREE.Mesh(new THREE.TorusGeometry(0.079, 0.006, 6, 22), std({ color: 0x4a4038, metalness: 0.4, roughness: 0.6 }));
    c.rotation.x = Math.PI / 2; c.position.y = y; boisseau.add(c);
  });
  boisseau.position.set(X[2], BY, -0.42);
  boisseau.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(boisseau); mesures.push(boisseau);

  /* ── LE SABLIER : la mesure unique, et c'est du temps ── */
  var sablier = new THREE.Group();
  [-0.105, 0.105].forEach(function (y) {
    var d = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.014, 18), std({ map: boisTex, roughness: 0.84, color: 0xa08868 }));
    d.position.y = y; sablier.add(d);
  });
  [0, 2.1, 4.2].forEach(function (a) {
    var p = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.21, 8), std({ map: boisTex, roughness: 0.86, color: 0x8e7658 }));
    p.position.set(Math.cos(a) * 0.052, 0, Math.sin(a) * 0.052); sablier.add(p);
  });
  [1, -1].forEach(function (s) {
    var c = new THREE.Mesh(new THREE.ConeGeometry(0.050, 0.098, 20, 1, true), verre);
    c.position.y = s * 0.049; c.rotation.x = s > 0 ? Math.PI : 0; sablier.add(c);
  });
  var sHaut = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.088, 18), sable);
  sHaut.rotation.x = Math.PI; sHaut.position.y = 0.055; sablier.add(sHaut);
  var sBas = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.05, 18), sable);
  sBas.position.y = -0.078; sablier.add(sBas);
  sablier.traverse(function (o) { if (o.isMesh && o.material !== verre) { o.castShadow = true; o.receiveShadow = true; } });
  sablier.position.set(0.58, BY + 0.105, -0.12); sablier.visible = false; scene.add(sablier);

  /* ── LES TROIS TAS : la même substance, trois grandeurs ── */
  var TAS = [[0.088, 0.062], [0.062, 0.040], [0.104, 0.076]];
  var tas = [];
  X.forEach(function (x, i) {
    var t = new THREE.Mesh(new THREE.ConeGeometry(TAS[i][0], TAS[i][1], 26), sable);
    t.position.set(x, BY + TAS[i][1] / 2, 0.10); t.castShadow = t.receiveShadow = true;
    t.visible = false; scene.add(t); tas.push(t);
  });

  /* ── CE QUI N'EST PAS VALEUR : la terre et la laine brute, sans tas ── */
  var reste = new THREE.Group();
  var motte = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 8), std({ color: 0x35291c, roughness: 1 }));
  motte.scale.set(1.15, 0.70, 1.00); motte.position.set(-0.032, 0.044, 0); reste.add(motte);
  for (var i = 0; i < 5; i++) {
    var fl = new THREE.Mesh(new THREE.SphereGeometry(0.030 + rnd() * 0.014, 8, 6), std({ color: 0x8c8272, roughness: 1 }));
    fl.position.set(0.056 + (rnd() - 0.5) * 0.042, 0.026 + rnd() * 0.028, (rnd() - 0.5) * 0.045); reste.add(fl);
  }
  reste.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  reste.position.set(-0.32, BY, 0.23); reste.visible = false; scene.add(reste);

  /* ── la lumière : hors champ, de loin et de haut ── */
  var ambiante = new THREE.AmbientLight(0x3a3026, 0.36); scene.add(ambiante);
  var lampe = new THREE.PointLight(0xffc286, 1.45, 6, 1.7); lampe.position.set(-0.78, 1.90, 1.05);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var appoint = new THREE.PointLight(0xb69a78, 0.38, 5, 2); appoint.position.set(1.30, 0.95, 1.05); scene.add(appoint);
  /* la lumière qui passe d'une mesure à l'autre : trois mesures, et aucune
     ne mesure la même chose */
  var falot = new THREE.PointLight(0xffd9a0, 0, 0.62, 2); scene.add(falot);

  /* ── chorégraphie ─────────────────────────────────────────────────── */
  var G = 0, T = 0;
  var st = { revue: 0, fantome: 0, mesure: 0, reste: 0, retour: 0 };
  /* un fantôme est PÂLE, FROID et TRANSLUCIDE, et il luit faiblement.
     Teindre vers un gris moyen ne suffisait pas : les matières beiges ne
     bougeaient presque pas et le fer, seul sombre, blanchissait tout seul. */
  var GRIS = new THREE.Color(0xc4c8cc), LUEUR = new THREE.Color(0x2b3238);
  function set(g) { G = g; }
  function compute() {
    st.revue = ss(0.7, 1.9, G) * (1 - ss(1.9, 2.3, G));   /* la lumière parcourt les trois mesures */
    st.fantome = ss(2.0, 3.1, G) * (1 - ss(5.05, 5.7, G)); /* les corps passent au fantôme, puis reviennent */
    st.mesure = ss(3.1, 4.2, G);                           /* le sablier, et les trois tas */
    st.reste = ss(4.2, 5.0, G);                            /* la terre et la laine */
    st.retour = ss(5.05, 5.7, G);
  }

  function frame(dt) {
    T += dt; compute();

    /* LES CORPS PASSENT AU FANTÔME : la couleur va au gris et le corps
       devient translucide. Chaque objet a ses propres matériaux, sinon on
       teindrait toute la scène. */
    var f = st.fantome;
    for (var c = 0; c < corps.length; c++) {
      var o = corps[c];
      for (var m = 0; m < o.mats.length; m++) {
        var mt = o.mats[m];
        mt.color.copy(o.base[m]).lerp(GRIS, f * 0.92);
        mt.opacity = 1 - 0.58 * f;
        mt.transparent = f > 0.01;
        mt.emissive.copy(LUEUR).multiplyScalar(f);
        if (mt.map) mt.map.needsUpdate = false;
      }
    }

    /* LES TROIS MESURES SE RETIRENT : elles s'inclinent et reculent — ce
       n'est pas qu'elles soient fausses, c'est qu'aucune ne peut servir. */
    mesures.forEach(function (g, i) {
      var r = ss(0.10 + i * 0.10, 0.60 + i * 0.10, st.fantome);
      g.rotation.z = (i === 0 ? 0 : 1) * -0.42 * r;
      g.position.x = (i === 1 ? X[1] + 0.14 : X[i]);
      g.position.z = (i === 0 ? -0.46 : i === 1 ? -0.44 : -0.42) - 0.06 * r;
      g.position.y = BY - 0.015 * r;
      g.scale.setScalar(1 - 0.20 * r);
      if (i === 0) g.rotation.x = 0.20 + 0.55 * r;
    });

    /* la lumière passe d'une mesure à l'autre */
    var u = cl(st.revue) * 2.999;
    var k = Math.min(2, Math.floor(u));
    falot.intensity = 1.5 * ss(0, 0.25, st.revue) * (1 - ss(0.8, 1, st.revue));
    falot.position.set(X[k], BY + 0.22, -0.10);

    /* LE SABLIER et LES TAS */
    sablier.visible = st.mesure > 0.02;
    sablier.scale.setScalar(0.3 + 0.7 * ss(0, 0.45, st.mesure));
    sablier.rotation.z = 0.10 * Math.sin(T * 0.6) * st.mesure;
    var coule = ss(0.25, 1, st.mesure);
    sHaut.scale.setScalar(Math.max(0.05, 1 - 0.75 * coule));
    sBas.scale.set(1, 0.2 + 1.9 * coule, 1);
    sBas.position.y = -0.104 + 0.05 * (0.2 + 1.9 * coule) / 2;
    tas.forEach(function (t, i) {
      var p = ss(0.20 + i * 0.14, 0.75 + i * 0.14, st.mesure);
      t.visible = p > 0.02;
      t.scale.set(0.15 + 0.85 * p, 0.10 + 0.90 * p, 0.15 + 0.85 * p);
      t.position.y = BY + TAS[i][1] * (0.10 + 0.90 * p) / 2;
    });

    /* CE QUI N'EST PAS VALEUR */
    reste.visible = st.reste > 0.02;
    reste.scale.setScalar(0.35 + 0.65 * ss(0, 0.6, st.reste));

    lampe.intensity = 1.45 * (1 + 0.03 * Math.sin(T * 7.1) + 0.02 * Math.sin(T * 3.3));

    /* LE CADRAGE — l'essentiel (les trois corps, le sablier, l'étagère)
       tient dans la bande que voit le cadre en paysage ; la colonne
       collante, plus haute, reçoit le sol en bas. Et elle est plus
       ÉTROITE : la terre est à −0,90 et le sablier à 0,72, ce qui la
       remplit tout juste — rien ne doit aller plus loin. */
    var q = ss(0, 1, Math.min(1, G / 2.4));
    var dz = lerp(2.22, 2.06, q);
    var camA = V3(lerp(-0.04, -0.02, q), lerp(0.76, 0.72, q), -0.26);
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
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
