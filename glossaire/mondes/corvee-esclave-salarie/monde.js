/* LE MONDE DE CORVÉE · ESCLAVE · SALARIÉ — les trois tailles.

   Le chapitre XIX ne compare pas trois duretés, il compare trois
   TRANSPARENCES : dans les trois formes la journée est coupée au même
   endroit, et ce qui change est ce que la forme laisse voir de la coupure.
   La figure devait donc poser la MÊME entaille trois fois, puis montrer ce
   que chaque forme en fait.

   Trois tailles pendues au mur, verticales : la journée monte du bas vers le
   haut, l'entaille est à mi-hauteur, et elle est au même endroit sur les
   trois. Puis :
   — la première est SCIÉE à l'entaille et ses deux morceaux pendent à deux
     chevilles écartées : « nettement séparés l'un de l'autre par le temps et
     l'espace » ;
   — la deuxième prend un fourreau de cuir sombre qui la couvre tout entière :
     tout le travail revêt l'apparence de travail non payé ;
   — la troisième prend un fourreau de toile claire, qui la couvre tout
     entière aussi : même le travail non payé revêt l'apparence de travail
     payé. Les deux fourreaux sont l'exacte symétrie l'un de l'autre, et ils
     cachent la même chose.

   Puis les fourreaux deviennent translucides — l'histoire met du temps à
   déchiffrer le secret du salaire — et au dernier temps ils tombent, les
   deux morceaux se rejoignent, et les trois entailles se retrouvent sur une
   seule ligne.

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
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.9, 5.4);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.03, 20);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 51203; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  var boisTex = tex(256, 512, function (g, w, h) {
    g.fillStyle = '#4e3924'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 150; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '26,17,8' : '128,104,68') + ',' + (0.06 + rnd() * 0.18) + ')';
      g.lineWidth = 0.6 + rnd() * 2.2; g.beginPath();
      var x = rnd() * w; g.moveTo(x, 0);
      for (var y = 0; y <= h; y += 34) g.lineTo(x + Math.sin((y + i * 37) / 76) * 4, y);
      g.stroke();
    }
  });
  boisTex.wrapS = boisTex.wrapT = THREE.RepeatWrapping;
  var bois = std({ map: boisTex, color: 0xa78a5c, roughness: 0.88 });

  /* ── LE MUR ET LA TABLETTE ── */
  var murTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#382a1c'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 1600; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '16,10,5' : '118,96,66') + ',' + (rnd() * 0.13) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 9, 2 + rnd() * 6, 0, 0, 6.3); g.fill(); }
    for (var i = 0; i < 5; i++) { g.strokeStyle = 'rgba(12,7,3,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5 + (rnd() - 0.5) * 8); g.stroke(); }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping; murTex.repeat.set(2.2, 2.2);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.4), std({ map: murTex, roughness: 1, color: 0x9d8b66 }));
  mur.position.set(0, 1.1, -0.10); mur.receiveShadow = true; scene.add(mur);
  var tablette = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.036, 0.20), bois);
  tablette.position.set(0, 0.24, 0.05); tablette.castShadow = tablette.receiveShadow = true; scene.add(tablette);

  /* ── LES TROIS TAILLES ────────────────────────────────────────────────
     Chacune est faite de DEUX morceaux séparés par une entaille, ce qui
     permet à la première d'être sciée sans rien recalculer, et fait que
     l'entaille est un vrai creux et non un trait peint. */
  var XS = [-0.34, 0.00, 0.34];
  var Y0 = 0.34, LT = 0.88, ENC = 0.020;   /* l'entaille est à MI-HAUTEUR */
  var acierS = std({ color: 0x1c1811, metalness: 0.26, roughness: 0.54 });
  var creux = std({ color: 0x1d150c, roughness: 0.95 });
  var demiGeo = new THREE.BoxGeometry(0.052, LT / 2 - ENC / 2, 0.048);
  var tailles = [];
  for (var i0 = 0; i0 < 3; i0++) {
    var bas = new THREE.Mesh(demiGeo, bois); bas.castShadow = bas.receiveShadow = true; scene.add(bas);
    var haut = new THREE.Mesh(demiGeo, bois); haut.castShadow = haut.receiveShadow = true; scene.add(haut);
    var enc = new THREE.Mesh(new THREE.BoxGeometry(0.058, ENC, 0.054), creux);
    enc.castShadow = true; scene.add(enc);
    /* la cheville : une taille se PEND, elle ne flotte pas */
    var chev = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, 0.09, 10), acierS);
    chev.rotation.x = Math.PI / 2; chev.position.set(XS[i0], Y0 + LT + 0.03, -0.06);
    chev.castShadow = true; scene.add(chev);
    var chev2 = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, 0.09, 10), acierS);
    chev2.rotation.x = Math.PI / 2; chev2.position.set(XS[i0] - 0.17, Y0 + LT / 2 - 0.03, -0.06);
    chev2.castShadow = true; chev2.visible = false; scene.add(chev2);
    tailles.push({ bas: bas, haut: haut, enc: enc, chev: chev, chev2: chev2 });
  }

  /* ── LES DEUX FOURREAUX : l'exacte symétrie l'un de l'autre ── */
  var cuirTex = tex(128, 256, function (g, w, h) {
    g.fillStyle = '#2a2119'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 700; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '10,7,4' : '92,76,56') + ',' + (rnd() * 0.2) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 5, 1 + rnd() * 4, 0, 0, 6.3); g.fill(); }
  });
  var toileTex = tex(128, 256, function (g, w, h) {
    g.fillStyle = '#a9997a'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(72,60,42,' + (0.06 + rnd() * 0.1) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, i * h / 90); g.lineTo(w, i * h / 90); g.stroke(); }
    for (var j = 0; j < 40; j++) { g.strokeStyle = 'rgba(200,184,150,' + (0.05 + rnd() * 0.1) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(j * w / 40, 0); g.lineTo(j * w / 40, h); g.stroke(); }
  });
  var fourGeo = new THREE.BoxGeometry(0.072, LT + 0.02, 0.068);
  var fCuir = new THREE.Mesh(fourGeo, std({ map: cuirTex, color: 0x8a7a64, roughness: 0.78, transparent: true, opacity: 1 }));
  var fToile = new THREE.Mesh(fourGeo, std({ map: toileTex, color: 0x9a8d70, roughness: 0.92, transparent: true, opacity: 1 }));
  [fCuir, fToile].forEach(function (m) { m.castShadow = true; m.visible = false; scene.add(m); });
  /* un cachet sur le cuir, une pièce sur la toile : chaque fourreau dit de
     quel rapport il vient — la propriété d'un côté, l'argent de l'autre */
  var cachet = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.010, 18), std({ color: 0x1a0705, roughness: 0.74 }));
  cachet.rotation.x = Math.PI / 2; cachet.castShadow = true; cachet.visible = false; scene.add(cachet);
  var piece = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.009, 22), std({ color: 0x4a3510, metalness: 0.44, roughness: 0.28 }));
  piece.rotation.x = Math.PI / 2; piece.castShadow = true; piece.visible = false; scene.add(piece);

  /* ── CE QUI DIT L'ESPACE, sous les deux morceaux de la première ──
     Une gerbe sous le morceau du bas (son champ), une borne sous celui du
     haut (la terre du seigneur). */
  var gerbe = new THREE.Group();
  for (var b0 = 0; b0 < 9; b0++) {
    var br = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.13, 5), std({ map: boisTex, color: 0x8a7444, roughness: 0.95 }));
    br.position.set((rnd() - 0.5) * 0.045, 0.065, (rnd() - 0.5) * 0.03);
    br.rotation.z = (rnd() - 0.5) * 0.3; br.castShadow = true; gerbe.add(br);
  }
  var lien = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.004, 5, 14), std({ color: 0x3a2a12, roughness: 0.9 }));
  lien.position.y = 0.07; lien.rotation.x = Math.PI / 2; gerbe.add(lien);
  gerbe.visible = false; scene.add(gerbe);
  var borne = new THREE.Group();
  var bl = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.041, 0.142, 6), std({ color: 0x0e0c09, roughness: 0.96 }));
  bl.position.y = 0.071; bl.castShadow = bl.receiveShadow = true; borne.add(bl);
  var sc = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.008, 16), std({ color: 0x1a0705, roughness: 0.74 }));
  sc.position.set(0, 0.104, 0.038); sc.rotation.x = Math.PI / 2; borne.add(sc);
  borne.visible = false; scene.add(borne);

  /* ── LA LIGNE DES TROIS ENTAILLES, au dernier temps ── */
  var ligne = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.0055, 0.004),
    new THREE.MeshBasicMaterial({ color: 0xb06e11, transparent: true, opacity: 0, fog: false }));
  ligne.position.set(0, Y0 + LT / 2, 0.032); scene.add(ligne);

  /* ── LA LUMIÈRE ── */
  scene.add(new THREE.AmbientLight(0x33291c, 0.44));
  var lampe = new THREE.PointLight(0xffc287, 1.30, 4.6, 1.5);
  lampe.position.set(-0.46, 1.62, 1.06);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var froide = new THREE.DirectionalLight(0x92a8c4, 0.22); froide.position.set(1.5, 1.1, 1.2); scene.add(froide);
  var fond = new THREE.PointLight(0xd2a068, 0.42, 3.6, 1.5); fond.position.set(0.1, 1.15, 0.42); scene.add(fond);

  /* ── CHORÉGRAPHIE ── */
  var G = 0, T = 0;
  var st = { scie: 0, cuir: 0, toile: 0, translu: 0, tombe: 0, lueur: 0 };
  function set(g) { G = g; }
  function compute() {
    st.scie    = ss(1.05, 1.95, G);   /* la première est sciée, et s'écarte */
    st.cuir    = ss(2.05, 2.85, G);   /* le fourreau sombre descend */
    st.toile   = ss(3.05, 3.85, G);   /* le fourreau clair monte */
    st.translu = ss(4.20, 4.95, G);   /* on commence à déchiffrer */
    st.tombe   = ss(5.15, 5.80, G);   /* les fourreaux tombent, tout se range */
    st.lueur   = ss(5.25, 5.85, G);
  }

  function frame(dt) {
    T += dt; compute();

    var sc0 = st.scie * (1 - st.tombe);
    for (var i = 0; i < 3; i++) {
      var t0 = tailles[i], x = XS[i];
      var demi = LT / 2 - ENC / 2;
      var yb = Y0 + demi / 2, yh = Y0 + LT - demi / 2;
      if (i === 0) {
        /* SCIÉE : le morceau du bas descend et s'écarte, à sa propre
           cheville. « Séparés par le temps et l'espace » : deux chevilles. */
        t0.bas.position.set(x - 0.17 * sc0, yb - 0.055 * sc0, -0.02);
        t0.haut.position.set(x, yh, -0.02);
        t0.enc.position.set(x, Y0 + LT / 2, -0.02);
        t0.enc.material = creux;
        t0.enc.scale.set(1, 1 - 0.9 * sc0, 1);
        t0.chev2.visible = sc0 > 0.25;
        t0.chev2.position.set(x - 0.17 * sc0, yb + demi / 2 + 0.03, -0.06);
      } else {
        t0.bas.position.set(x, yb, -0.02);
        t0.haut.position.set(x, yh, -0.02);
        t0.enc.position.set(x, Y0 + LT / 2, -0.02);
        t0.enc.scale.set(1, 1, 1);
      }
    }

    /* LE FOURREAU DE CUIR descend sur la deuxième ; LE FOURREAU DE TOILE
       monte sur la troisième. Les deux couvrent tout, et c'est le point. */
    var kc = st.cuir * (1 - st.tombe), kt = st.toile * (1 - st.tombe);
    var opac = 1 - 0.62 * st.translu * (1 - st.tombe);
    fCuir.visible = kc > 0.03;
    fCuir.position.set(XS[1], Y0 + LT / 2 + (1 - kc) * (LT + 0.34), -0.02);
    fCuir.material.opacity = opac;
    fCuir.material.depthWrite = opac > 0.92;
    cachet.visible = kc > 0.55;
    cachet.position.set(XS[1], fCuir.position.y + 0.24, 0.020);
    cachet.material.opacity = 1;

    fToile.visible = kt > 0.03;
    fToile.position.set(XS[2], Y0 + LT / 2 - (1 - kt) * (LT + 0.34), -0.02);
    fToile.material.opacity = opac;
    fToile.material.depthWrite = opac > 0.92;
    piece.visible = kt > 0.55;
    piece.position.set(XS[2], fToile.position.y - 0.24, 0.020);

    /* LES MARQUES DE L'ESPACE, sous les deux morceaux de la première */
    var gv = sc0 > 0.35;
    gerbe.visible = gv; borne.visible = gv;
    gerbe.position.set(XS[0] - 0.17 * sc0, 0.258, 0.05);
    gerbe.scale.setScalar(0.4 + 0.6 * cl((sc0 - 0.35) / 0.4));
    borne.position.set(XS[0] + 0.145, 0.258, 0.05);
    borne.scale.setScalar(0.4 + 0.6 * cl((sc0 - 0.35) / 0.4));

    /* LA LIGNE : les trois entailles au même endroit */
    ligne.material.opacity = 0.82 * st.tombe;
    ligne.scale.x = 0.25 + 0.75 * cl(st.tombe / 0.7);

    lampe.intensity = 1.30 * (1 + 0.024 * Math.sin(T * 6.1) + 0.013 * Math.sin(T * 2.5));
    fond.intensity = 0.42 + 0.5 * st.lueur;

    /* LA CAMÉRA. L'ensemble fait environ 1,05 unité de large pour 1,05 de
       haut. En PORTRAIT la largeur vue vaut 0,82 fois la distance, en
       PAYSAGE la hauteur en vaut 0,69 : c'est la seconde qui commande, et il
       faut 1,55. La caméra se rapproche un peu de chaque taille à son tour,
       puis recule pour la ligne des trois entailles. */
    var q = ss(0, 1, Math.min(1, G / 4.0));
    var d = lerp(1.60, 1.74, q) + st.tombe * 0.12;
    var cx = -0.05 - 0.06 * (1 - q);   /* les trois tailles sont centrées dès le premier temps : visée quasi fixe */
    var camA = V3(cx, Y0 + LT / 2 + lerp(0.02, -0.02, q), -0.02);
    camera.position.set(camA.x - 0.06 + 0.008 * Math.sin(T * 0.25),
                        camA.y + 0.10 + 0.006 * Math.sin(T * 0.31),
                        camA.z + d);
    camera.lookAt(camA);
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
