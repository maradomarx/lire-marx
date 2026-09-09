/* LE MONDE DU TRAVAIL NÉCESSAIRE — l'étagère, et l'établi.

   Marx forge le terme en donnant DEUX raisons, et non une : nécessaire
   pour le travailleur, « parce qu'il est indépendant de la forme sociale
   de son travail » ; nécessaire pour le capital, « parce que ce monde a
   pour base l'existence du travailleur ». Le même segment de la journée
   répond aux deux, et c'est cette coïncidence qui fait tout le concept.

   La scène le montre en deux objets qui se font face. À gauche l'étagère
   de l'entretien — le pain, le charbon, le vêtement — qui se vide dans la
   journée. À droite l'établi, avec sa bobine qui se remplit. Un repère
   monte le long du montant : quand il atteint la marque, l'étagère est
   regarnie, et tout ce qui vient ensuite va ailleurs.

   Au cinquième temps on ESSAIE DE S'EN PASSER : l'étagère reste vide, et
   l'établi s'éteint. C'est la seconde nécessité, et elle ne se dit pas
   autrement — sans l'entretien, il n'y a personne demain.

   Tout est fonction de g, donc réversible. */
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.7, 4.2);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 12889; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#463526'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 180; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '26,18,10' : '112,90,62') + ',' + (0.05 + rnd() * 0.16) + ')';
      g.lineWidth = 0.6 + rnd() * 2.4; g.beginPath();
      var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 30) g.lineTo(x, y + Math.sin(x * 0.013 + i) * 4);
      g.stroke();
    }
  });
  var sol = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.10, 0.56),
    std({ map: boisTex, color: 0x9c8768, roughness: 0.88 }));
  sol.position.set(0, -0.05, -0.02); sol.receiveShadow = true; scene.add(sol);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), std({ color: 0x171009, roughness: 1 }));
  mur.position.set(0, 0.6, -0.40); scene.add(mur);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.22));
  var lampe = new THREE.PointLight(0xffd9a8, 1.25, 2.9, 2);
  lampe.position.set(-0.10, 0.80, 0.40); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.24);
  appoint.position.set(1.3, 0.7, 0.8); scene.add(appoint);

  /* ── L'ÉTAGÈRE DE L'ENTRETIEN ─────────────────────────────────────────
     Trois choses, et rien de symbolique : le pain, le charbon, le
     vêtement. Elles se vident dans la journée, et le travail nécessaire
     est exactement ce qu'il faut pour les remettre. */
  var XE = -0.19;
  var etagere = new THREE.Group(); etagere.position.set(XE, 0, -0.16); scene.add(etagere);
  var planche = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.020, 0.115),
    std({ map: boisTex, color: 0x8a7454, roughness: 0.9 }));
  planche.position.y = 0.175; planche.castShadow = true; planche.receiveShadow = true; etagere.add(planche);
  [-1, 1].forEach(function (s) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.185, 0.100),
      std({ map: boisTex, color: 0x7a6444, roughness: 0.92 }));
    m.position.set(s * 0.142, 0.083, 0); m.castShadow = true; etagere.add(m);
  });
  var vivres = [];
  (function () {
    var pain = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12),
      std({ color: 0xb08046, roughness: 0.95 }));
    pain.scale.set(1.25, 0.72, 0.85); pain.position.set(-0.085, 0.218, 0);
    pain.castShadow = true; etagere.add(pain); vivres.push(pain);
    var seau = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.034, 0.062, 16),
      std({ color: 0x3c3a36, metalness: 0.35, roughness: 0.7 }));
    seau.position.set(0.005, 0.216, 0); seau.castShadow = true; etagere.add(seau); vivres.push(seau);
    var habit = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.052, 0.058),
      std({ color: 0x394253, roughness: 0.92 }));
    habit.position.set(0.095, 0.211, 0); habit.castShadow = true; etagere.add(habit); vivres.push(habit);
  })();

  /* ── L'ÉTABLI, ET LA BOBINE ── */
  var XB = 0.175;
  var etabli = new THREE.Group(); etabli.position.set(XB, 0, -0.06); scene.add(etabli);
  var plateau = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.024, 0.170),
    std({ map: boisTex, color: 0x8a7454, roughness: 0.9 }));
  plateau.position.y = 0.128; plateau.castShadow = true; plateau.receiveShadow = true; etabli.add(plateau);
  [[-0.12, -0.06], [0.12, -0.06], [-0.12, 0.06], [0.12, 0.06]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.128, 0.018),
      std({ color: 0x5a4429, roughness: 0.92 }));
    m.position.set(p[0], 0.064, p[1]); m.castShadow = true; etabli.add(m);
  });
  var broche = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.19, 10),
    std({ color: 0x50555c, metalness: 0.68, roughness: 0.44 }));
  broche.position.set(-0.02, 0.235, 0); broche.castShadow = true; etabli.add(broche);
  /* du fil, pas un rouleau de papier : un beige de lin, un rayon plus
     mince, et les deux joues de bois qui font reconnaître une bobine. */
  var filMat = std({ color: 0xb9ac8c, roughness: 0.95 });
  var bobine = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1, 18), filMat);
  bobine.castShadow = true; etabli.add(bobine);
  var joueMat = std({ color: 0x6b4a26, roughness: 0.9 });
  var joueBas = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.010, 18), joueMat);
  joueBas.position.set(-0.02, 0.146, 0); joueBas.castShadow = true; etabli.add(joueBas);
  var joueHaut = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.010, 18), joueMat);
  joueHaut.castShadow = true; etabli.add(joueHaut);

  /* ── LE MONTANT ET SA MARQUE ──────────────────────────────────────────
     Le repère monte avec la journée. Quand il atteint la marque, l'étagère
     est regarnie — et tout ce qui vient ensuite va ailleurs. */
  var laiMat = std({ color: 0xc09a3c, metalness: 0.84, roughness: 0.30 });
  var montant = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.40, 10), laiMat);
  montant.position.set(-0.005, 0.20, -0.16); montant.castShadow = true; scene.add(montant);
  var marque = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.008, 0.008),
    std({ color: 0xb0503a, metalness: 0.4, roughness: 0.5 }));
  marque.position.set(-0.005, 0.155, -0.16); scene.add(marque);
  var index = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.030, 4), laiMat);
  index.rotation.z = -Math.PI / 2; index.position.set(0.022, 0.03, -0.16);
  index.castShadow = true; scene.add(index);

  /* ── la chorégraphie ── */
  var st = { pose: 0, jour: 0, regarni: 0, prive: 0, eteint: 0 };
  var G = 0, T = 0;
  var Y0 = 0.035, Y1 = 0.375, YM = 0.155;
  function set(g) { G = g; }
  function compute() {
    st.pose = ss(0.7, 1.5, G);
    /* la journée court, et elle ne s'arrête pas à la marque : rien dans le
       geste ne signale le passage d'une portion à l'autre. */
    st.jour = ss(2.10, 4.30, G) * (1 - ss(4.90, 5.25, G));
    st.regarni = ss(2.95, 3.35, G) * (1 - ss(4.90, 5.25, G));
    st.prive = ss(5.05, 5.45, G);        /* on essaie de s'en passer     */
    st.eteint = ss(5.35, 5.80, G);       /* l'établi s'arrête            */
  }

  function frame(dt) {
    T += dt; compute();
    etagere.scale.setScalar(0.3 + 0.7 * st.pose);
    etabli.scale.setScalar(0.3 + 0.7 * st.pose);
    montant.visible = marque.visible = index.visible = st.pose > 0.5;

    /* les vivres se consomment, puis sont remis — sauf au dernier temps */
    var reste = (1 - 0.72 * cl(st.jour * 1.6)) + 0.72 * st.regarni;
    reste = Math.min(1, reste) * (1 - st.prive);
    for (var i = 0; i < vivres.length; i++) {
      var v = cl(reste * 1.15 - i * 0.06);
      vivres[i].visible = v > 0.04;
      vivres[i].scale.setScalar((i === 0 ? 1 : 1) * (0.25 + 0.75 * v) * (i === 0 ? 1 : 1));
      if (i === 0) vivres[i].scale.set(1.25 * (0.25 + 0.75 * v), 0.72 * (0.25 + 0.75 * v), 0.85 * (0.25 + 0.75 * v));
    }

    /* la bobine se remplit tout du long, du même geste */
    var h = 0.02 + 0.15 * st.jour;
    bobine.scale.y = h; bobine.position.set(-0.02, 0.152 + h / 2, 0);
    joueHaut.position.set(-0.02, 0.152 + h + 0.005, 0);
    broche.rotation.y = T * (st.jour > 0.02 && st.jour < 0.99 ? 5.2 : 0) * (1 - st.eteint);
    filMat.color.setHex(0xcfc6ab);
    filMat.emissive = filMat.emissive || new THREE.Color(0, 0, 0);
    filMat.emissive.setRGB(0.05 * cl((st.jour - 0.55) * 2.2), 0.035 * cl((st.jour - 0.55) * 2.2), 0.01);

    index.position.y = lerp(Y0, Y1, st.jour);
    marque.material.emissive = marque.material.emissive || new THREE.Color(0, 0, 0);
    var atteint = cl((index.position.y - YM) * 14);
    marque.material.emissive.setRGB(0.22 * atteint, 0.05 * atteint, 0.02 * atteint);

    /* SANS L'ENTRETIEN, PERSONNE DEMAIN : l'établi s'éteint. */
    var vie = 1 - 0.86 * st.eteint;
    lampe.intensity = 1.25 * vie * (1 + 0.02 * Math.sin(T * 5.2) + 0.015 * Math.sin(T * 2.5));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       L'étagère de −0,37 à −0,06, l'établi de 0,04 à 0,35 : VÉRIFIÉ PAR
       PROJECTION à la position portrait, la plus étroite. */
    var dz = lerp(1.22, 1.14, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(-0.01, lerp(0.15, 0.18, ss(1.5, 4.5, G)), -0.08);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.20 + 0.006 * Math.sin(T * 0.27), camA.z + dz);
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
