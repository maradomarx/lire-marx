/* LE MONDE DE LA FORCE PRODUCTIVE — l'étagère du potier.

   Le concept est un RAPPORT INVERSE : la même quantité de travail rend plus
   de choses, et chacune vaut moins. Une figure qui montrerait seulement un
   atelier qui produit davantage dirait la moitié de l'argument — celle que
   tout le monde admet. Il fallait donc que la CONSTANCE du travail dépensé
   soit visible en même temps que la multiplication du produit.

   Un séchoir à quatre tablettes. Sur chacune, au bout gauche, un bout de
   chandelle : le même, brûlé au même trait, sur les quatre — c'est la
   journée, et elle ne bouge pas. À côté, les pots : deux, quatre, huit,
   seize, et ils gardent exactement la même taille (les faire rétrécir dirait
   que le produit s'appauvrit, ce qui est faux). Au bout droit, un jeton de
   terre — ce que vaut UN pot — et il est deux fois plus petit d'une tablette
   à l'autre.

   Puis un cordon se tend au devant de chaque tablette : la part des pots qui
   paie les subsistances de celui qui les a faits. Il recule pendant que les
   pots se multiplient — c'est la plus-value relative, et elle ne demande
   aucune heure de plus.

   Au dernier temps, deux pots viennent sur la planche du bas, un de la
   première tablette et un de la dernière, avec leurs deux jetons : le pot
   n'a pas changé, le jeton a fondu.

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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.4, 6.6);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.03, 24);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 21701; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── LES MATIÈRES ─────────────────────────────────────────────────────
     Les hex sont dans la bande utile MESURÉE (un hex de matériau est traité
     comme linéaire puis encodé en sRGB : écrit trop bas, tout tombe au noir ;
     écrit à 0x2b, une fonte rend près de 200). */
  var boisTex = tex(512, 256, function (g, w, h) {
    g.fillStyle = '#4a3623'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 180; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '26,17,8' : '124,100,66') + ',' + (0.06 + rnd() * 0.17) + ')';
      g.lineWidth = 0.6 + rnd() * 2.4; g.beginPath();
      var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin((x + i * 41) / 88) * 5);
      g.stroke();
    }
  });
  boisTex.wrapS = boisTex.wrapT = THREE.RepeatWrapping;
  var bois  = std({ map: boisTex, color: 0x9d8157, roughness: 0.88 });
  var bois2 = std({ map: boisTex, color: 0x6d5738, roughness: 0.92 });

  var terreTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#b08055'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 900; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '84,52,30' : '214,172,132') + ',' + (rnd() * 0.2) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 3, 0, 0, 6.3); g.fill(); }
  });
  var terre = std({ map: terreTex, color: 0x9a7550, roughness: 0.86 });
  var terre2 = std({ map: terreTex, color: 0xa8845c, roughness: 0.8 });
  var cire  = std({ color: 0x9b8d68, roughness: 0.64 });
  var flamMat = new THREE.MeshBasicMaterial({ color: 0xffcf86, transparent: true, opacity: 0.95, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
  var cordeMat = std({ color: 0x8f3a2a, roughness: 0.92 });

  /* ── LE SOL, LE MUR ── */
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std({ map: boisTex, color: 0x6a5637, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);
  var murTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#3a2c1e'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 1100; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '16,10,5' : '112,90,62') + ',' + (rnd() * 0.14) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 8, 2 + rnd() * 5, 0, 0, 6.3); g.fill(); }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping; murTex.repeat.set(3, 2);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), std({ map: murTex, roughness: 1, color: 0xa8956f }));
  mur.position.set(0, 1.6, -1.00); mur.receiveShadow = true; scene.add(mur);

  /* ── LE SÉCHOIR : quatre tablettes ────────────────────────────────────
     Les pots gardent la MÊME taille d'une tablette à l'autre. Les faire
     rétrécir pour qu'ils tiennent dirait que le produit s'appauvrit, ce qui
     est le contraire de l'argument : ils occupent la profondeur. */
  var NT = 4, TW = 1.34, TD = 0.42, TY0 = 0.30, TH = 0.335;
  function shelfY(i) { return TY0 + (NT - 1 - i) * TH; }   /* i = 0 en HAUT */
  [-TW / 2 + 0.03, TW / 2 - 0.03].forEach(function (dx) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.055, TY0 + TH * NT + 0.06, 0.055), bois2);
    m.position.set(dx, (TY0 + TH * NT + 0.06) / 2, -0.02); m.castShadow = true; scene.add(m);
  });
  var tablettes = [];
  for (var t0 = 0; t0 < NT; t0++) {
    var tb = new THREE.Mesh(new THREE.BoxGeometry(TW, 0.030, TD), bois);
    tb.position.set(0, TY0 + t0 * TH, -0.02); tb.castShadow = tb.receiveShadow = true; scene.add(tb);
    tablettes.push(tb);
  }

  /* ── LES POTS ─────────────────────────────────────────────────────── */
  var COMPTE = [2, 4, 8, 16];
  var potGeo = new THREE.CylinderGeometry(0.030, 0.021, 0.060, 14);
  var colGeo = new THREE.CylinderGeometry(0.019, 0.024, 0.020, 14);
  var levreGeo = new THREE.TorusGeometry(0.023, 0.005, 6, 14);
  function fairePot() {
    var g0 = new THREE.Group();
    var b = new THREE.Mesh(potGeo, terre); b.castShadow = b.receiveShadow = true; g0.add(b);
    var c = new THREE.Mesh(colGeo, terre); c.position.y = 0.040; c.castShadow = true; g0.add(c);
    var l = new THREE.Mesh(levreGeo, terre2); l.position.y = 0.051; l.rotation.x = Math.PI / 2; l.castShadow = true; g0.add(l);
    return g0;
  }
  /* UNE SEULE RANGÉE, et c'est ce qui rend la figure lisible. Rangés en
     profondeur, les pots des rangs arrière se cachent derrière ceux du
     devant — la caméra est à hauteur de tablette et ne peut pas dominer les
     quatre à la fois. En une rangée à pas constant, la file GRANDIT vers la
     droite pendant que le pot garde exactement sa taille : les deux moitiés
     de l'argument se voient d'un coup. */
  var PAS = 0.058, X0 = -0.46;
  function place(n, k) { return [X0 + k * PAS, -0.02]; }
  var pots = [];
  for (var s0 = 0; s0 < NT; s0++) {
    var rangee = [];
    for (var k0 = 0; k0 < COMPTE[s0]; k0++) {
      var p = fairePot();
      var pos = place(COMPTE[s0], k0);
      p.position.set(pos[0], shelfY(s0) + 0.045, pos[1]);
      p.visible = false; scene.add(p); rangee.push(p);
    }
    pots.push(rangee);
  }

  /* ── LES CHANDELLES : la même journée, quatre fois ─────────────────── */
  var chandelles = [], flammes = [];
  for (var c0 = 0; c0 < NT; c0++) {
    var g1 = new THREE.Group();
    var coupe = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 0.012, 16), std({ color: 0x6e5a2a, metalness: 0.42, roughness: 0.42 }));
    coupe.castShadow = coupe.receiveShadow = true; g1.add(coupe);
    var cy = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.062, 14), cire);
    cy.position.y = 0.037; cy.castShadow = true; g1.add(cy);
    var fl = new THREE.Mesh(new THREE.ConeGeometry(0.0085, 0.026, 10), flamMat);
    fl.position.y = 0.081; g1.add(fl); flammes.push(fl);
    g1.position.set(-0.60, shelfY(c0) + 0.021, 0.01);
    g1.visible = false; scene.add(g1); chandelles.push(g1);
  }

  /* ── LES JETONS : ce que vaut UN pot, deux fois plus petit à chaque
     tablette. Ils sont posés SUR CHANT et adossés au montant : à plat, un
     disque de terre sur une planche de bois ne se voit pas. ── */
  var jetons = [];
  for (var j0 = 0; j0 < NT; j0++) {
    var r = 0.056 / Math.pow(1.44, j0);
    var jt = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.011, 24), terre2);
    jt.rotation.x = Math.PI / 2;
    jt.position.set(0.56, shelfY(j0) + 0.015 + r, -0.05);
    jt.castShadow = jt.receiveShadow = true; jt.visible = false; scene.add(jt); jetons.push(jt);
  }

  /* ── LES CORDONS : la part qui paie les subsistances ── */
  var PART = [0.50, 0.31, 0.19, 0.12];
  var cordons = [];
  for (var d0 = 0; d0 < NT; d0++) {
    var cd = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 8), cordeMat);
    cd.rotation.z = Math.PI / 2; cd.castShadow = true; cd.visible = false; scene.add(cd); cordons.push(cd);
  }

  /* ── LA PLANCHE DU BAS, ET LES DEUX TÉMOINS ── */
  var planche = new THREE.Mesh(new THREE.BoxGeometry(TW, 0.030, TD), bois);
  planche.position.set(0, 0.10, -0.02); planche.castShadow = planche.receiveShadow = true; scene.add(planche);
  var temA = fairePot(), temB = fairePot();
  temA.visible = temB.visible = false; scene.add(temA); scene.add(temB);
  var jetA = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.011, 24), terre2);
  var jetB = new THREE.Mesh(new THREE.CylinderGeometry(0.0187, 0.0187, 0.011, 24), terre2);
  [jetA, jetB].forEach(function (m) { m.rotation.x = Math.PI / 2; m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m); });

  /* ── LA LUMIÈRE ── */
  scene.add(new THREE.AmbientLight(0x33291d, 0.42));
  var lampe = new THREE.PointLight(0xffc287, 1.55, 5.6, 1.5);
  lampe.position.set(-0.34, 1.78, 1.34);
  lampe.castShadow = true; lampe.shadow.bias = -0.0012; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var froide = new THREE.DirectionalLight(0x92a8c4, 0.22); froide.position.set(1.6, 1.2, 1.4); scene.add(froide);
  var fond = new THREE.PointLight(0xd2a068, 0.72, 4.2, 1.5); fond.position.set(0.15, 1.55, -0.62); scene.add(fond);
  var basse = new THREE.PointLight(0xd8a468, 0.0, 3.2, 1.6); basse.position.set(0.1, 0.26, 0.5); scene.add(basse);

  /* ── CHORÉGRAPHIE ─────────────────────────────────────────────────── */
  var G = 0, T = 0;
  var st = { rangs: 0, cordon: 0, temoins: 0, lueur: 0 };
  function set(g) { G = g; }
  function compute() {
    /* une tablette par temps, de la première à la quatrième */
    st.rangs = 0;
    for (var i = 0; i < NT; i++) st.rangs += ss(0.30 + i * 0.92, 1.05 + i * 0.92, G);
    st.cordon  = ss(4.15, 4.90, G);
    st.temoins = ss(5.15, 5.80, G);
    st.lueur   = ss(4.95, 5.70, G);
  }

  function frame(dt) {
    T += dt; compute();

    for (var i = 0; i < NT; i++) {
      var f = cl(st.rangs - i);
      chandelles[i].visible = f > 0.04;
      chandelles[i].scale.setScalar(0.45 + 0.55 * cl(f / 0.35));
      flammes[i].material.opacity = 0.55 + 0.42 * (0.5 + 0.5 * Math.sin(T * (5.3 + i * 0.7) + i));
      flammes[i].scale.y = 1 + 0.14 * Math.sin(T * (7.1 + i * 0.9) + i * 2);

      /* les pots arrivent l'un après l'autre : on les COMPTE */
      var n = COMPTE[i];
      for (var k = 0; k < n; k++) {
        var fk = cl((f - 0.10) / 0.78 * n - k);
        var p = pots[i][k];
        p.visible = fk > 0.03;
        p.scale.setScalar(0.35 + 0.65 * cl(fk / 0.5));
      }

      var jt = jetons[i];
      jt.visible = f > 0.55;
      jt.scale.setScalar(0.4 + 0.6 * cl((f - 0.55) / 0.35));

      /* le cordon : la part des pots qui paie les subsistances */
      var cd = cordons[i];
      var vu = st.cordon > 0.06 && f > 0.9;
      cd.visible = vu;
      if (vu) {
        var lg = TW * 0.92 * PART[i] * cl(st.cordon / 0.7);
        cd.scale.y = Math.max(0.02, lg);
        cd.position.set(-TW * 0.46 + lg / 2, shelfY(i) + 0.021, TD / 2 - 0.03);
      }
    }

    /* LES DEUX TÉMOINS : le même pot, deux jetons */
    var tm = st.temoins;
    temA.visible = temB.visible = tm > 0.05;
    temA.scale.setScalar(cl(tm / 0.4)); temB.scale.setScalar(cl(tm / 0.4));
    temA.position.set(-0.20, 0.115 + 0.045, 0.09);
    temB.position.set(0.10, 0.115 + 0.045, 0.09);
    jetA.visible = jetB.visible = tm > 0.35;
    jetA.scale.setScalar(cl((tm - 0.35) / 0.4)); jetB.scale.setScalar(cl((tm - 0.35) / 0.4));
    jetA.position.set(-0.07, 0.115 + 0.056, 0.11);
    jetB.position.set(0.23, 0.115 + 0.0187, 0.11);

    lampe.intensity = 1.55 * (1 + 0.026 * Math.sin(T * 6.2) + 0.014 * Math.sin(T * 2.4));
    basse.intensity = 0.60 * st.lueur;

    /* LA CAMÉRA. Le séchoir fait 1,45 unité de haut pour 1,02 de large : en
       PAYSAGE (l'image fixe) la hauteur vue vaut 0,69 fois la distance, c'est
       donc elle qui commande — 2,15. En PORTRAIT (la colonne collante) la
       largeur vue vaut 0,82 fois la distance, soit 1,76 : le séchoir y tient
       avec de l'air, et la planche du bas remplit le pied du cadre.
       La caméra DESCEND pendant la lecture : on part des premières tablettes
       et l'on finit sur la planche des deux témoins. */
    var q = ss(0, 1, Math.min(1, G / 3.6));
    var d = lerp(2.04, 2.34, q) + st.temoins * 0.06;
    var camA = V3(lerp(-0.02, 0.00, q), lerp(1.30, 0.78, q) - st.temoins * 0.30, -0.02);
    camera.position.set(camA.x - 0.10 + 0.010 * Math.sin(T * 0.24),
                        camA.y + 0.16 + 0.008 * Math.sin(T * 0.30) - st.temoins * 0.10,
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
