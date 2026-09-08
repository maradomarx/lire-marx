/* LE MONDE DE LA COOPÉRATION — la poutre, les cordes, et l'écart.

   Le chapitre XIII ne dit pas que plusieurs font plus qu'un : il dit qu'ils
   font PLUS QUE LEUR SOMME, et que cet excédent n'est le prix de personne.
   La figure devait donc rendre l'écart mesurable — sans quoi elle ne dirait
   que « à plusieurs on soulève mieux », ce qui n'est pas le concept.

   Une poutre de pierre au sol, des cordes qui montent vers une chèvre. Les
   cordes s'attellent une à une, et la poutre monte. À côté, une règle porte
   DEUX index : la somme des forces individuelles, qui monte proportion-
   nellement au nombre de cordes ; et la hauteur réelle, qui monte plus vite.
   L'écart entre les deux, c'est la force collective.

   Au dernier temps, une pièce se pose au pied de chaque corde — chacune est
   payée à sa valeur — et l'écart, lui, n'en reçoit aucune : « la force
   sociale du travail ne coûte rien au capital ».

   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.03; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 4, 11);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 149; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  var solTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#31251a'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (60 + rnd() * 40 | 0) + ',' + (48 + rnd() * 30 | 0) + ',' + (30 + rnd() * 20 | 0) + ',' + (0.1 + rnd() * 0.2) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 5 + rnd() * 20, 3 + rnd() * 8, rnd() * 3, 0, 6.3); g.fill(); }
  });
  solTex.wrapS = solTex.wrapT = THREE.RepeatWrapping; solTex.repeat.set(3, 3);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), std({ map: solTex, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  /* ── LA POUTRE DE PIERRE ── */
  var pierreTex = tex(512, 256, function (g, w, h) {
    /* une PIERRE, et non du bois clair : sous une lampe chaude un gris
       moyen suffit à passer pour une planche — il faut descendre franchement */
    g.fillStyle = '#584f45'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '26,22,18' : '124,116,104') + ',' + (rnd() * 0.13) + ')'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 5, 2 + rnd() * 4); }
  });
  var PX = 0.55;
  var bloc = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.34, 0.5), std({ map: pierreTex, roughness: 0.96, color: 0x8a8278 }));
  bloc.position.set(PX, 0.17, 0); bloc.castShadow = bloc.receiveShadow = true; scene.add(bloc);

  /* ── LA CHÈVRE : deux montants et un sommier ── */
  /* SOMBRE et MINCE : en bois clair et à quatre montants, la chèvre passait
     pour une chaise et la pierre pour son assise. Deux montants suffisent. */
  var bois = std({ color: 0x2e1e0f, roughness: 0.9 });
  var HT = 2.35;
  [[-1.02, 0.0], [1.02, 0.0]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.046, HT, 10), bois);
    m.position.set(PX + p[0], HT / 2, p[1]);
    m.rotation.z = p[0] > 0 ? -0.14 : 0.14; m.rotation.x = p[1] > 0 ? -0.06 : 0.06;
    m.castShadow = true; scene.add(m);
  });
  var sommier = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.07, 0.08), bois);
  sommier.position.set(PX, HT, 0); sommier.castShadow = true; scene.add(sommier);

  /* ── LES CORDES : elles s'attellent une à une ── */
  var NC = 6;
  var cordeMat = std({ color: 0x9a7f4c, roughness: 1 });
  var cordes = [], sous = [];
  for (var i = 0; i < NC; i++) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1, 8), cordeMat);
    c.castShadow = true; c.visible = false; scene.add(c); cordes.push(c);
    var p = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.013, 20),
      std({ color: 0xdcd6c6, metalness: 0.8, roughness: 0.27 }));
    p.position.set(PX - 0.72 + i * 0.29, 0.008, 0.62); p.castShadow = p.receiveShadow = true; p.visible = false;
    scene.add(p); sous.push(p);
  }

  /* ── LA RÈGLE ET SES DEUX INDEX ── */
  var regleTex = tex(96, 1024, function (g, w, h) {
    g.fillStyle = '#c9b58d'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a2a14';
    for (var k = 0; k <= 20; k++) { var y = h - 10 - (h - 20) * k / 20; g.lineWidth = k % 5 === 0 ? 4 : 2; g.beginPath(); g.moveTo(5, y); g.lineTo(k % 5 === 0 ? 46 : 28, y); g.stroke(); }
  });
  var RX = PX + 1.42, RY0 = 0.02, RY1 = 1.72;
  var regle = new THREE.Mesh(new THREE.BoxGeometry(0.19, RY1 - RY0, 0.045), std({ map: regleTex, roughness: 0.82 }));
  regle.position.set(RX, (RY0 + RY1) / 2, -0.05); regle.castShadow = regle.receiveShadow = true; scene.add(regle);
  function index(col) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.028), std({ color: col, metalness: 0.7, roughness: 0.34 }));
    m.position.set(RX, RY0, 0.0); m.castShadow = true; m.visible = false; scene.add(m); return m;
  }
  var idxSomme = index(0x9a8a6a);     /* la somme des forces individuelles */
  var idxReel  = index(0xd8ad4c);     /* ce qui est réellement soulevé */

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x39301f, 0.45));
  var lampe = new THREE.PointLight(0xffc286, 4.2, 12, 1.6); lampe.position.set(-1.5, 3.1, 2.2);
  lampe.castShadow = true; lampe.shadow.bias = -0.0014; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var lune = new THREE.DirectionalLight(0x9ab4d6, 0.5); lune.position.set(3, 2.4, -2); scene.add(lune);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { n: 0, monte: 0, regle: 0, ecart: 0, paye: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.n     = ss(0.4, 3.7, G) * NC;      /* les cordes s'attellent */
    st.regle = ss(1.5, 2.3, G);
    st.ecart = ss(3.6, 4.6, G);
    st.paye  = ss(4.5, 5.4, G);
    st.recul = ss(4.4, 5.5, G);
  }

  function frame(dt) {
    T += dt; compute();
    var n = st.n;                                   /* nombre de cordes attelées */
    /* L'ÉCART DOIT PERSISTER À PLEINE CHARGE, sinon le concept disparaît :
       avec une racine, les deux index se rejoignaient au bout et la force
       collective n'existait plus qu'à mi-course. La somme reste linéaire,
       le tout lui ajoute un terme qui croît avec le NOMBRE — c'est bien ce
       que dit le chapitre : l'excédent grandit avec la réunion. */
    var u = n / NC;
    var somme = 0.62 * u;
    var reel = 0.62 * u + 0.38 * u * u;
    var h = 0.30 + 1.10 * reel;
    bloc.position.y = h + 0.004 * Math.sin(T * 2.1) * (n > 0.2 ? 1 : 0);
    bloc.rotation.z = 0.012 * Math.sin(T * 1.3) * (n > 0.2 ? 1 : 0);

    cordes.forEach(function (c, k) {
      var f = cl(n - k);
      c.visible = f > 0.03;
      var x = PX - 0.70 + k * 0.28;
      var haut = V3(x, HT - 0.06, 0), bas = V3(x, bloc.position.y + 0.17, 0.02);
      var mid = haut.clone().add(bas).multiplyScalar(0.5);
      c.position.copy(mid);
      var d = new THREE.Vector3().subVectors(bas, haut);
      c.scale.set(1, d.length(), 1);
      c.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
      c.material = cordeMat;
    });
    sous.forEach(function (p, k) { p.visible = st.paye > (k + 0.3) / (NC + 0.4); });

    idxSomme.visible = st.regle > 0.05; idxReel.visible = st.regle > 0.05;
    idxSomme.position.y = RY0 + (RY1 - RY0) * somme * 0.86;
    idxReel.position.y  = RY0 + (RY1 - RY0) * reel * 0.86;
    idxReel.scale.x = 1 + 0.25 * st.ecart;

    lampe.intensity = 4.2 * (1 + 0.03 * Math.sin(T * 7.3));

    /* la caméra. L'ensemble fait environ trois unités et demie (le bloc, la
       chèvre, la règle) : à 38° et en paysage la largeur vue vaut 1,07 fois
       la distance, il en faut donc six pour qu'il tienne dans les 57 % que la
       colonne de texte laisse — et le décalage vaut alors 1,4. */
    var q = ss(0, 1, Math.min(1, G / 2.0));
    var cx = lerp(1.3, 0.35, q), cy = lerp(0.72, 1.18, q), cz = lerp(3.4, 6.0, q);
    cz = lerp(cz, 6.4, st.recul);
    var camA = V3(lerp(PX, PX + 0.30, q), lerp(0.60, 1.00, q), 0);
    camera.position.set(cx + 0.02 * Math.sin(T * 0.25), cy + 0.014 * Math.sin(T * 0.33), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.24 * dist, 1.40));
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
