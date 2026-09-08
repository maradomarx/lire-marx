/* LE MONDE DE LA PLUS-VALUE — le fil, et la ligne qu'il écrit.

   Marx donne lui-même les deux images, et elles n'en font qu'une. Au
   chapitre VII l'exemple est LE FILEUR : du coton, une broche, et du fil.
   Au chapitre IX il représente la journée par UNE LIGNE DROITE coupée en b
   — a—b le travail nécessaire, b—c le surtravail. Or le fil qui sort de la
   broche EST cette ligne : il ne s'arrête pas quand l'ouvrier a filé la
   valeur de sa propre force, il continue, dans le même geste, de la même
   main, et c'est ce prolongement-là qui est la plus-value.

   La page est donc cette longueur. Une nature morte serrée — le bout d'un
   établi sous une lampe, la broche, la bobine qui grossit, la craie sur le
   bois — et non une salle : c'est le cadrage qui fait la différence entre
   un objet et un « dessin 3D ». Le geste ne change jamais ; ce qui change,
   c'est où va ce qu'il produit.

   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0b0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0b0806, 3.4, 9.0);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 91; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── l'établi ── */
  var woodTex = tex(1024, 512, function (g, w, h) {
    g.fillStyle = '#4b3520'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 260; i++) {
      g.strokeStyle = 'rgba(24,13,5,' + (0.05 + rnd() * 0.16) + ')'; g.lineWidth = 0.6 + rnd() * 2.4;
      g.beginPath(); var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 64) g.lineTo(x, y + (rnd() - 0.5) * 7);
      g.stroke();
    }
    for (i = 0; i < 22; i++) { /* les nœuds et les coups */
      g.strokeStyle = 'rgba(20,10,4,.22)'; g.lineWidth = 1.4;
      var cx = rnd() * w, cy = rnd() * h;
      for (var k = 1; k < 5; k++) { g.beginPath(); g.ellipse(cx, cy, 6 * k, 3.2 * k, rnd(), 0, 6.3); g.stroke(); }
    }
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  var bench = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.13, 1.35), std({ map: woodTex, roughness: 0.62, color: 0xb59a78 }));
  bench.position.set(0, -0.065, 0); bench.castShadow = bench.receiveShadow = true; scene.add(bench);
  var edge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.06), std({ color: 0x3a2614, roughness: 0.7 }));
  edge.position.set(0, 0.0, 0.66); scene.add(edge);
  [-1.35, 1.35].forEach(function (x) {
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.6, 0.13), std({ map: woodTex, roughness: 0.85 }));
    leg.position.set(x, -0.93, 0.2); leg.castShadow = true; scene.add(leg);
  });
  /* le sol, très sombre : il ne sert qu'à recevoir les ombres */
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std({ color: 0x191009, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.74; floor.receiveShadow = true; scene.add(floor);
  var backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), std({ color: 0x241a12, roughness: 0.98 }));
  backWall.position.set(0, 1.6, -2.5); backWall.receiveShadow = true; scene.add(backWall);

  /* ── la broche, et la bobine qui grossit ── */
  var BX = 0.72, BZ = -0.32, R0 = 0.038, R1 = 0.118, BH = 0.54;
  var steel = std({ color: 0x9aa0a6, metalness: 0.85, roughness: 0.34 });
  var spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.1, 12), steel);
  spindle.position.set(BX, 0.40, BZ); spindle.castShadow = true; scene.add(spindle);
  var whorl = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.045, 20), std({ color: 0x6a4a24, roughness: 0.6 }));
  whorl.position.set(BX, 0.03, BZ); whorl.castShadow = true; scene.add(whorl);
  /* le fil enroulé : une texture d'enroulement fin, et un rayon qui croît */
  var windTex = tex(64, 512, function (g, w, h) {
    g.fillStyle = '#ddd0b2'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 4) {
      g.strokeStyle = 'rgba(255,250,236,' + (0.55 + rnd() * 0.35) + ')'; g.lineWidth = 2.1;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 2.6); g.stroke();
      g.strokeStyle = 'rgba(96,76,48,' + (0.30 + rnd() * 0.26) + ')'; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(0, y + 2.2); g.lineTo(w, y + 4.8); g.stroke();
    }
  });
  windTex.wrapS = windTex.wrapT = THREE.RepeatWrapping; windTex.repeat.set(6, 1);
  var bobine = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 26, 1, true), std({ map: windTex, roughness: 0.86, side: THREE.DoubleSide }));
  bobine.position.set(BX, 0.24, BZ); bobine.castShadow = bobine.receiveShadow = true; scene.add(bobine);
  var joue = std({ color: 0x6a4726, roughness: 0.62 });
  var capTop = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.022, 26), joue);
  var capBot = capTop.clone(); capTop.castShadow = capBot.castShadow = true; scene.add(capTop); scene.add(capBot);

  /* le guide, en haut, d'où descend le fil — à demi hors du cadre */
  var guide = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 18), std({ color: 0x9a7b30, metalness: 0.8, roughness: 0.35 }));
  guide.position.set(BX, 0.90, BZ + 0.14); guide.rotation.x = Math.PI / 2; scene.add(guide);
  var fil = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 1, 6), std({ color: 0xf1e8d2, roughness: 0.95 }));
  fil.castShadow = true; scene.add(fil);

  /* ── le coton, matière première, à gauche ── */
  var roving = new THREE.Group();
  for (var i = 0; i < 4; i++) {
    var lump = new THREE.Mesh(new THREE.SphereGeometry(0.075 + rnd() * 0.03, 12, 10), std({ color: 0xdfd6bd, roughness: 1 }));
    lump.position.set(-0.76 + i * 0.075, 0.045 + rnd() * 0.018, -0.26 + (rnd() - 0.5) * 0.08);
    lump.scale.set(2.1, 0.42, 0.85); lump.rotation.y = (rnd() - 0.5) * 0.35; lump.castShadow = lump.receiveShadow = true; roving.add(lump);
  }
  scene.add(roving);

  /* ── LA CRAIE : la ligne a—b—c, écrite sur le bois ── */
  var LW = 1024, LH = 340;
  var chalkCv = document.createElement('canvas'); chalkCv.width = LW; chalkCv.height = LH;
  var cg = chalkCv.getContext('2d');
  var chalkTex = new THREE.CanvasTexture(chalkCv);
  if (THREE.sRGBEncoding) chalkTex.encoding = THREE.sRGBEncoding;
  var craie = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.52),
    new THREE.MeshBasicMaterial({ map: chalkTex, transparent: true, depthWrite: false }));
  craie.rotation.x = -Math.PI / 2; craie.position.set(0.02, 0.005, 0.30); craie.renderOrder = 3; scene.add(craie);
  var A = 0.055, B = 0.475;   /* a et b, en fractions de la planche */
  var lastKey = '';
  function drawChalk(len, cEnd, lum) {
    var key = len.toFixed(3) + '|' + cEnd.toFixed(3) + '|' + lum.toFixed(2);
    if (key === lastKey) return; lastKey = key;
    cg.clearRect(0, 0, LW, LH);
    if (len <= 0.001 || lum <= 0.01) { chalkTex.needsUpdate = true; return; }
    var y = 150, x0 = A * LW, x1 = (A + (cEnd - A) * len) * LW;
    cg.globalAlpha = lum;
    cg.strokeStyle = '#efe6cf'; cg.lineCap = 'round';
    /* le trait, d'une main qui tremble un peu */
    cg.lineWidth = 7; cg.beginPath(); cg.moveTo(x0, y);
    for (var x = x0; x <= x1; x += 14) cg.lineTo(x, y + Math.sin(x * 0.06) * 1.6);
    cg.stroke();
    function tick(fx, lab, big) {
      var X = fx * LW; if (X > x1 + 6) return;
      cg.lineWidth = big ? 6 : 4;
      cg.beginPath(); cg.moveTo(X, y - (big ? 40 : 26)); cg.lineTo(X, y + (big ? 40 : 26)); cg.stroke();
      cg.fillStyle = '#efe6cf'; cg.font = 'italic ' + (big ? 58 : 48) + 'px Georgia, serif'; cg.textAlign = 'center';
      cg.fillText(lab, X, y - 56);
    }
    tick(A, 'a', false);
    tick(B, 'b', true);
    if (len > 0.985) tick(cEnd, 'c', false);
    /* ce que chaque moitié est, dit sous le trait */
    cg.font = '30px Georgia, serif'; cg.textAlign = 'center'; cg.fillStyle = 'rgba(239,230,207,.82)';
    if (x1 > B * LW * 0.85) cg.fillText('travail nécessaire', (A + B) / 2 * LW, y + 84);
    if (x1 > (B + 0.06) * LW) cg.fillText('surtravail', (B + cEnd) / 2 * LW, y + 84);
    cg.globalAlpha = 1;
    chalkTex.needsUpdate = true;
  }

  /* ── les pièces : trois shillings pour la force, trois pour le coffre ── */
  function shilling(x, z) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.014, 24),
      std({ color: 0xe3ded0, metalness: 0.82, roughness: 0.26 }));
    m.position.set(x, 0.012, z); m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m); return m;
  }
  var paye = [shilling(-0.60, 0.06), shilling(-0.49, 0.00), shilling(-0.55, 0.13)];
  /* les trois qui ne reviennent pas : au BOUT de la ligne, là où le fil continue */
  var pris = [shilling(0.36, 0.38), shilling(0.47, 0.33), shilling(0.41, 0.48)];

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x3a2c1e, 0.5));
  /* un contre-jour tiède : sans lui les objets clairs n'ont pas de bord */
  var rim = new THREE.DirectionalLight(0xffc98a, 0.85); rim.position.set(2.6, 1.5, -2.2); scene.add(rim);
  var jour = new THREE.DirectionalLight(0xd6e2f2, 1.55);   /* le jour, par la gauche */
  jour.position.set(-3.2, 3.0, 3.4); jour.castShadow = true;
  jour.shadow.mapSize.set(2048, 2048); jour.shadow.camera.left = -3; jour.shadow.camera.right = 3;
  jour.shadow.camera.top = 3; jour.shadow.camera.bottom = -3; jour.shadow.bias = -0.0009;
  scene.add(jour);
  var LAMPY = 1.32;
  var lampe = new THREE.PointLight(0xffb765, 0, 6, 1.7); lampe.position.set(-0.05, LAMPY, 0.55);
  lampe.castShadow = true; lampe.shadow.bias = -0.0012; scene.add(lampe);
  var abatjour = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 20, 1, true), std({ color: 0x2e2015, roughness: 0.8, side: THREE.DoubleSide }));
  abatjour.position.set(-0.05, LAMPY + 0.11, 0.55); scene.add(abatjour);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);
  var haloTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  halo.scale.set(1.1, 1.1, 1); halo.position.copy(lampe.position); scene.add(halo);
  /* la poussière, dans le cône de lumière */
  var NP = 90, pp = new Float32Array(NP * 3);
  for (i = 0; i < NP; i++) { pp[i * 3] = -0.9 + rnd() * 1.9; pp[i * 3 + 1] = 0.1 + rnd() * 1.1; pp[i * 3 + 2] = -0.3 + rnd() * 1.1; }
  var dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pp, 3)),
    new THREE.PointsMaterial({ color: 0xffd9a6, size: 0.011, transparent: true, opacity: 0.4, depthWrite: false }));
  scene.add(dust);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { fil: 0, ligne: 0, cfin: 0, paye: 0, pris: 0, nuit: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.fil   = ss(0.15, 4.9, G);                 /* le fil s'enroule, sans jamais s'arrêter */
    st.ligne = ss(1.85, 4.85, G);                /* la craie suit le fil */
    st.cfin  = lerp(0.80, 0.945, ss(3.95, 4.9, G));  /* la journée se prolonge */
    st.paye  = ss(2.25, 2.75, G);
    st.pris  = ss(3.15, 3.7, G);
    st.nuit  = ss(3.9, 4.8, G);
    st.recul = ss(4.9, 5.7, G);
  }

  function frame(dt) {
    T += dt; compute();

    /* la bobine grossit — le geste est le même, ce qu'il produit s'accumule */
    var r = lerp(R0, R1, st.fil);
    bobine.scale.set(r, BH, r); bobine.rotation.y += dt * 2.6;
    var rj = R1 * 1.18;
    capTop.scale.set(rj, 1, rj); capTop.position.set(BX, 0.24 + BH / 2, BZ);
    capBot.scale.set(rj, 1, rj); capBot.position.set(BX, 0.24 - BH / 2, BZ);
    windTex.repeat.set(6, Math.max(1, r * 26));

    /* le fil, du guide au sommet de l'enroulement */
    var top = V3(BX, 0.88, BZ + 0.14), bot = V3(BX + r * 0.92, 0.24 + BH * 0.36, BZ);
    var mid = top.clone().add(bot).multiplyScalar(0.5);
    fil.position.copy(mid);
    var d = new THREE.Vector3().subVectors(bot, top);
    fil.scale.set(1, d.length(), 1);
    fil.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());

    /* la craie */
    drawChalk(st.ligne, st.cfin, ss(1.8, 2.15, G));

    paye.forEach(function (m, k) { m.visible = st.paye > (k + 0.4) / 3.4; });
    pris.forEach(function (m, k) { m.visible = st.pris > (k + 0.4) / 3.4; m.position.x = [0.36, 0.47, 0.41][k] + 0.14 * ss(0.55, 1, st.pris); });

    /* le jour tombe, la lampe prend */
    var n = st.nuit;
    jour.intensity = 1.55 * (1 - 0.94 * n);
    jour.color.setRGB(lerp(0.74, 0.34, n), lerp(0.82, 0.36, n), lerp(0.91, 0.44, n));
    lampe.intensity = (0.35 + 2.5 * n) * (1 + 0.05 * Math.sin(T * 7.7) + 0.03 * Math.sin(T * 11.3));
    halo.material.opacity = 0.15 + 0.75 * n;
    ampoule.material.color.setRGB(1, lerp(0.72, 0.85, n), lerp(0.45, 0.62, n));
    dust.material.opacity = 0.12 + 0.42 * n;
    dust.rotation.y = T * 0.03;
    scene.fog.color.setRGB(lerp(0.043, 0.028, n), lerp(0.031, 0.020, n), lerp(0.024, 0.014, n));
    renderer.setClearColor(scene.fog.color, 1);

    /* la caméra : elle serre la bobine, puis découvre l'établi et la ligne */
    var q = ss(0, 1, Math.min(1, G / 1.9));
    /* La distance se CALCULE : l'ensemble (le coton, la ligne, la bobine,
       les pièces) fait deux unités de large, et il doit tenir dans la moitié
       droite de l'écran — la colonne de texte occupe la gauche. À 38° et en
       paysage, la largeur vue vaut 1,07 fois la distance : il en faut donc
       plus de trois, quand j'en avais mis deux. */
    var cx = lerp(0.85, -0.05, q), cy = lerp(0.78, 1.55, q), cz = lerp(1.05, 3.15, q);
    cz = lerp(cz, 3.45, st.recul); cy = lerp(cy, 1.72, st.recul);
    var ax = lerp(BX, -0.03, q), ay = lerp(0.34, 0.05, q);
    camera.position.set(cx + 0.012 * Math.sin(T * 0.29), cy + 0.009 * Math.sin(T * 0.37), cz);
    var camA = V3(ax, ay, lerp(BZ, 0.04, q));
    /* la colonne de texte occupe la gauche : on vise à GAUCHE du sujet pour
       qu'il vive dans la moitié droite, d'une part proportionnelle à la
       distance mais PLAFONNÉE — sans quoi les plans longs le jettent dehors */
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    /* mise en page « marge » : la scène a sa propre colonne, rien ne la
       recouvre — on ne décale donc presque pas, elle se cadre centrée */
    /* la colonne de texte occupe 43 % de la largeur : l'ensemble, court,
       se pose entre 51 % et 92 % — le décalage vaut 0,80 à pleine distance */
    aim.copy(camA).addScaledVector(right, -Math.min(0.26 * dist, 0.80));
    camera.lookAt(aim);
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
