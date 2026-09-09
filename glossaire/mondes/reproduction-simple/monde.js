/* LE MONDE DE LA REPRODUCTION SIMPLE — l'avance mangée.

   Le chapitre XXIII ne dit pas qu'une fortune grossit : il dit qu'une somme
   CHANGE DE NATURE du seul fait qu'elle tourne. La figure devait donc
   montrer une masse qui ne varie pas d'un pouce et dont, à la fin, plus
   rien n'est ce qu'il était.

   Un comptoir vu de haut — on baisse les yeux sur son argent. Dans un
   râtelier, cinq pièces sur chant : l'avance. Chaque année une pièce claire
   monte du fond de l'atelier, prend une place dans le râtelier, et la pièce
   sombre qu'elle remplace s'en va dans le sébile, mangée. Une entaille de
   plus à la taille. Au bout de cinq tours la masse est exactement la même,
   le râtelier tient toujours cinq pièces — et il n'y reste pas un atome de
   l'ancien capital. Le sébile en contient cinq, sombres : ce qu'il a
   consommé égale ce qu'il avait avancé.

   Au dernier temps une sixième encoche s'ouvre et une pièce claire y reste
   au lieu de s'en aller : le cercle s'étend et se change en spirale.

   La CAMÉRA DOMINE le comptoir : une nature morte à plat laisse les deux
   tiers hauts du cadre vides, et le bois de l'établi n'est pas un vide.

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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.9, 5.2);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.03, 20);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 90211; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── LE COMPTOIR ── */
  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#4b3722'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 240; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '26,17,8' : '128,102,66') + ',' + (0.06 + rnd() * 0.17) + ')';
      g.lineWidth = 0.6 + rnd() * 2.6; g.beginPath();
      var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin((x + i * 37) / 95) * 6);
      g.stroke();
    }
    for (var k = 0; k < 420; k++) { g.fillStyle = 'rgba(14,9,4,' + (rnd() * 0.26) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 5, 1 + rnd() * 2.5, rnd() * 3, 0, 6.3); g.fill(); }
  });
  var bois = std({ map: boisTex, color: 0x9d8157, roughness: 0.86 });
  var boisSombre = std({ map: boisTex, color: 0x6a5436, roughness: 0.9 });
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(2.30, 0.11, 1.50), bois);
  comptoir.position.set(0, -0.055, 0); comptoir.castShadow = comptoir.receiveShadow = true; scene.add(comptoir);
  var fondSalle = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), std({ map: boisTex, color: 0x3f3222, roughness: 1 }));
  fondSalle.position.set(0, 0.9, -1.45); fondSalle.receiveShadow = true; scene.add(fondSalle);

  /* ── LE RÂTELIER ET SES SIX ENCOCHES ─────────────────────────────────
     Les pièces sont SUR CHANT et non empilées : une pile ne se compte pas,
     et tout le chapitre est un compte. */
  var RX = -0.30, RZ = -0.13, PAS = 0.115, N = 5;
  var socleR = new THREE.Mesh(new THREE.BoxGeometry(PAS * N + 0.09, 0.05, 0.17), boisSombre);
  socleR.position.set(RX + PAS * (N - 1) / 2, 0.025, RZ); socleR.castShadow = socleR.receiveShadow = true; scene.add(socleR);
  var joues = [];
  for (var e0 = 0; e0 <= N + 1; e0++) {
    var j = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.052, 0.17), boisSombre);
    j.position.set(RX - PAS / 2 + e0 * PAS, 0.075, RZ); j.castShadow = true; scene.add(j); joues.push(j);
  }

  var piece2 = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#c9c9c9'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,70,70,0.85)'; g.lineWidth = 9;
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.40, 0, 6.283); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h / 2, w * 0.335, 0, 6.283); g.stroke();
    for (var a = 0; a < 34; a++) {
      var t0 = a / 34 * 6.283;
      g.strokeStyle = 'rgba(64,64,64,0.7)'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(w / 2 + Math.cos(t0) * w * 0.455, h / 2 + Math.sin(t0) * w * 0.455);
      g.lineTo(w / 2 + Math.cos(t0) * w * 0.49, h / 2 + Math.sin(t0) * w * 0.49); g.stroke();
    }
    g.fillStyle = 'rgba(78,78,78,0.72)';
    for (var b = 0; b < 8; b++) {
      var t1 = b / 8 * 6.283;
      g.beginPath(); g.ellipse(w / 2 + Math.cos(t1) * w * 0.115, h / 2 + Math.sin(t1) * w * 0.115, w * 0.055, w * 0.030, t1, 0, 6.283); g.fill();
    }
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.048, 0, 6.283); g.fill();
  });
  var sombre = std({ map: piece2, color: 0x2b1b09, metalness: 0.22, roughness: 0.74 });
  var claire = std({ map: piece2, color: 0xe3b656, metalness: 0.5, roughness: 0.2 });
  var pieceGeo = new THREE.CylinderGeometry(0.066, 0.066, 0.016, 28);
  function faireePiece(mat) {
    var m = new THREE.Mesh(pieceGeo, mat);
    m.rotation.x = Math.PI / 2;                    /* sur chant */
    m.castShadow = m.receiveShadow = true; scene.add(m); return m;
  }
  var avances = [], surplus = [];
  for (var i = 0; i < N; i++) { avances.push(faireePiece(sombre)); surplus.push(faireePiece(claire)); }
  var sixieme = faireePiece(claire); sixieme.visible = false;

  /* ── LE SÉBILE : le fonds de consommation ── */
  var sebile = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.128, 0.052, 28, 1, true), std({ color: 0x6b5a3b, metalness: 0.36, roughness: 0.5, side: THREE.DoubleSide }));
  sebile.castShadow = sebile.receiveShadow = true; scene.add(sebile);
  var fondSeb = new THREE.Mesh(new THREE.CylinderGeometry(0.130, 0.130, 0.008, 28), std({ color: 0x574828, roughness: 0.68 }));
  fondSeb.receiveShadow = true; scene.add(fondSeb);
  var SEBX = 0.46, SEBZ = 0.20;

  /* ── LA TAILLE : une entaille par année ── */
  var TX = -0.02;
  var taille = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.028, 0.062), boisSombre);
  taille.position.set(TX, 0.014, 0.30); taille.rotation.y = 0.07;
  taille.castShadow = taille.receiveShadow = true; scene.add(taille);
  var crans = [];
  for (var c0 = 0; c0 < N; c0++) {
    var cr = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.030, 0.064), std({ color: 0x140d05, roughness: 1 }));
    cr.position.set(TX - 0.18 + c0 * 0.090, 0.020, 0.30 + (-0.18 + c0 * 0.090) * 0.07);
    cr.rotation.y = 0.07; cr.visible = false; scene.add(cr); crans.push(cr);
  }

  /* ── LA LUMIÈRE ── */
  scene.add(new THREE.AmbientLight(0x352b1d, 0.42));
  var lampe = new THREE.PointLight(0xffc287, 1.45, 4.6, 1.55);
  lampe.position.set(-0.34, 1.05, 0.72);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var froide = new THREE.DirectionalLight(0x93a9c6, 0.22); froide.position.set(1.4, 1.0, 0.9); scene.add(froide);
  var arriere = new THREE.PointLight(0xc79059, 0.0, 3.4, 1.6); arriere.position.set(-0.85, 0.42, -0.55); scene.add(arriere);

  /* ── CHORÉGRAPHIE ─────────────────────────────────────────────────────
     Cinq échanges, un par « année », étalés de g = 1,05 à g = 4,05. */
  var G = 0, T = 0;
  var st = { tours: 0, egal: 0, spirale: 0, lueur: 0 };
  function set(g) { G = g; }
  function compute() {
    st.tours   = 0;
    for (var i = 0; i < N; i++) st.tours += ss(1.05 + i * 0.62, 1.72 + i * 0.62, G);
    st.egal    = ss(4.25, 4.95, G);
    st.spirale = ss(5.15, 5.80, G);
    st.lueur   = ss(4.10, 5.10, G);
  }

  function frame(dt) {
    T += dt; compute();

    /* la position du sébile : il vient se ranger contre le râtelier pour
       que l'égalité se COMPTE — cinq sombres contre cinq claires */
    var sx = lerp(SEBX, RX + N * PAS + 0.27, st.egal);
    var sz = lerp(SEBZ, RZ + 0.02, st.egal);
    sebile.position.set(sx, 0.055, sz); fondSeb.position.set(sx, 0.032, sz);

    for (var i = 0; i < N; i++) {
      var f = cl(st.tours - i);                       /* avancement du i-e échange */
      var slot = RX + i * PAS;

      /* LA PIÈCE CLAIRE monte du fond de l'atelier et prend la place */
      var p = surplus[i];
      p.visible = f > 0.02;
      var ax = lerp(-0.95, slot, f), ay = lerp(0.09, 0.090, f), az = lerp(-0.62, RZ, f);
      p.position.set(ax, ay + Math.sin(Math.PI * cl(f)) * 0.09, az);
      p.rotation.z = (1 - f) * 1.2;

      /* LA PIÈCE SOMBRE s'en va dans le sébile, mangée. Elle s'y couche :
         ce n'est plus du capital, c'est de la consommation. */
      var q = avances[i];
      var ang = (i / N) * 6.283 + 0.6, rr = 0.062 * (0.45 + 0.55 * ((i * 7) % 5) / 5);
      var bx = sx + Math.cos(ang) * rr, bz = sz + Math.sin(ang) * rr * 0.9;
      q.position.set(lerp(slot, bx, f), lerp(0.090, 0.044 + 0.010 * i, f) + Math.sin(Math.PI * cl(f)) * 0.10, lerp(RZ, bz, f));
      q.rotation.x = lerp(Math.PI / 2, 0, f);         /* de chant, elle se couche */
      q.rotation.y = f * ang;

      crans[i].visible = f > 0.55;
    }

    /* LA SIXIÈME ENCOCHE : une pièce claire reste au lieu de s'en aller.
       Le cercle s'étend et se change en spirale. */
    var sp = st.spirale;
    joues[N + 1].visible = sp > 0.06;
    joues[N + 1].scale.y = cl(sp / 0.5);
    joues[N + 1].position.y = 0.075 * joues[N + 1].scale.y;
    sixieme.visible = sp > 0.15;
    sixieme.position.set(lerp(-0.95, RX + N * PAS, cl((sp - 0.15) / 0.7)), 0.090 + Math.sin(Math.PI * cl((sp - 0.15) / 0.7)) * 0.09, lerp(-0.62, RZ, cl((sp - 0.15) / 0.7)));
    sixieme.rotation.z = (1 - cl((sp - 0.15) / 0.7)) * 1.2;
    socleR.scale.x = 1 + PAS / (PAS * N + 0.09) * sp;
    socleR.position.x = RX + PAS * (N - 1) / 2 + PAS / 2 * sp;

    lampe.intensity = 1.45 * (1 + 0.024 * Math.sin(T * 6.3) + 0.013 * Math.sin(T * 2.5));
    arriere.intensity = 0.42 * st.lueur;

    /* LA CAMÉRA DOMINE le comptoir : une nature morte à plat laisserait les
       deux tiers hauts du cadre vides. L'ensemble utile fait environ 1,25
       unité de large ; en PORTRAIT la largeur vue vaut 0,82 fois la
       distance, il en faut donc un peu plus d'un et demi. */
    var q0 = ss(0, 1, Math.min(1, G / 2.4));
    var d = lerp(1.36, 1.50, q0) + st.egal * 0.06 + st.spirale * 0.08;
    var camA = V3(lerp(0.06, 0.15, q0), 0.06, lerp(0.00, 0.04, q0));
    var incl = lerp(0.86, 0.78, q0);                  /* radians au-dessus du plan */
    camera.position.set(camA.x - 0.10 + 0.008 * Math.sin(T * 0.23),
                        camA.y + Math.sin(incl) * d + 0.006 * Math.sin(T * 0.31),
                        camA.z + Math.cos(incl) * d);
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
