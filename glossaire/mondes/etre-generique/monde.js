/* LE MONDE DE L'ÊTRE GÉNÉRIQUE — une mesure, ou toutes.

   Le concept se démontre par une comparaison : l'animal produit d'une seule
   manière, celle de son espèce, sous l'empire du besoin immédiat ; l'homme
   produit selon la mesure de TOUTE espèce, et même selon aucune — d'après
   les lois de la beauté. La figure est donc une opposition de mesures, et
   non un décor.

   À gauche, une rangée de cellules hexagonales identiques qui se répète,
   toujours la même, sans jamais varier. À droite, sur le même établi, des
   formes qui arrivent une à une et dont aucune ne ressemble à la
   précédente — et la dernière ne répond à aucun besoin : c'est une forme
   pure, et c'est elle que la lumière prend.

   Le dernier temps ÉTEINT le côté humain sauf une cellule : quand le
   travail est aliéné, la production humaine retombe à la mesure unique.
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.8, 7.2);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 101; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  var boisTex = tex(1024, 512, function (g, w, h) {
    g.fillStyle = '#3d2a18'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 210; i++) {
      g.strokeStyle = 'rgba(16,9,3,' + (0.06 + rnd() * 0.15) + ')'; g.lineWidth = 0.7 + rnd() * 2;
      g.beginPath(); var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 60) g.lineTo(x, y + (rnd() - 0.5) * 6); g.stroke();
    }
  });
  var etabli = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.13, 1.15), std({ map: boisTex, roughness: 0.66, color: 0xb59a78 }));
  etabli.position.set(0, -0.065, 0); etabli.castShadow = etabli.receiveShadow = true; scene.add(etabli);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), std({ color: 0x1a1209, roughness: 0.98 }));
  fond.position.set(0, 1.3, -1.75); fond.receiveShadow = true; scene.add(fond);
  /* un filet gravé sépare les deux moitiés de l'établi */
  var filet = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.9), std({ color: 0x241608, roughness: 1 }));
  filet.position.set(-0.14, 0.004, 0.02); scene.add(filet);

  /* ── À GAUCHE : la mesure unique, répétée ── */
  var cire = std({ color: 0xd8ac57, roughness: 0.52, metalness: 0.12 });
  var cellules = [];
  for (var i = 0; i < 8; i++) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.11, 6), cire);
    var r0 = Math.floor(i / 4), c0 = i % 4;
    c.position.set(-0.86 + c0 * 0.118, 0.055, -0.16 + r0 * 0.112 + (c0 % 2) * 0.056);
    c.castShadow = c.receiveShadow = true; c.visible = false; scene.add(c); cellules.push(c);
  }

  /* ── À DROITE : la mesure de toute espèce ── */
  var formes = [];
  function forme(kind, x, col, h) {
    var g;
    if (kind === 0) g = new THREE.BoxGeometry(0.15, 0.10, 0.13);
    else if (kind === 1) g = new THREE.CylinderGeometry(0.055, 0.075, 0.20, 16);
    else if (kind === 2) g = new THREE.TorusGeometry(0.075, 0.024, 10, 24);
    else if (kind === 3) g = new THREE.ConeGeometry(0.078, 0.19, 5);
    else g = new THREE.TorusKnotGeometry(0.062, 0.019, 64, 10);
    var m = new THREE.Mesh(g, std({ color: col, roughness: 0.4, metalness: 0.25 }));
    m.position.set(x, h, 0.02); m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m);
    if (kind === 2) m.rotation.x = Math.PI / 2;
    return m;
  }
  var XF = [0.00, 0.22, 0.44, 0.66, 0.88];
  var COL = [0xa8b4be, 0xbfa075, 0x9fb39a, 0xc0a2b0, 0xe0d6b4];
  var HT = [0.055, 0.10, 0.028, 0.098, 0.085];
  for (i = 0; i < 5; i++) formes.push(forme(i, XF[i], COL[i], HT[i]));

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x3a2e22, 0.4));
  var lampe = new THREE.PointLight(0xffc286, 3.0, 5.6, 1.8); lampe.position.set(-0.10, 1.16, 0.66);
  lampe.castShadow = true; lampe.shadow.bias = -0.0013; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var abat = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.15, 20, 1, true), std({ color: 0x2b1d13, roughness: 0.82, side: THREE.DoubleSide }));
  abat.position.set(-0.10, 1.27, 0.66); scene.add(abat);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);
  /* un trait froid réservé à la forme pure : c'est elle que la lumière prend */
  var beaute = new THREE.SpotLight(0xdcecff, 0, 4, 0.34, 0.6, 1.4);
  beaute.position.set(1.15, 1.5, 0.9); beaete_target(); function beaete_target() { beaute.target.position.set(XF[4], 0.09, 0.02); }
  scene.add(beaute); scene.add(beaute.target);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { ruche: 0, varie: 0, pure: 0, retombe: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.ruche   = ss(0.15, 1.5, G);
    st.varie   = ss(1.8, 3.7, G);
    st.pure    = ss(3.75, 4.5, G);
    st.retombe = ss(4.75, 5.6, G);   /* le travail aliéné : retour à la mesure unique */
    st.recul   = ss(4.6, 5.5, G);
  }

  function frame(dt) {
    T += dt; compute();
    cellules.forEach(function (c, k) {
      var f = cl(st.ruche * cellules.length - k);
      c.visible = f > 0.03; c.scale.setScalar(0.3 + 0.7 * f);
    });
    /* les quatre premières formes, puis la cinquième — celle qui ne répond
       à aucun besoin, et que la lumière prend */
    formes.forEach(function (m, k) {
      var f = k < 4 ? cl(st.varie * 4 - k) : st.pure;
      /* au dernier temps, tout retombe à la mesure unique : elles s'effacent */
      f *= (1 - st.retombe * (k < 4 ? 1 : 0.82));
      m.visible = f > 0.03; m.scale.setScalar(0.3 + 0.7 * f);
      m.rotation.y = k * 0.7 + T * (k === 4 ? 0.35 : 0.05);
    });
    beaute.intensity = 3.2 * st.pure * (1 - 0.6 * st.retombe);
    lampe.intensity = 3.0 * (1 - 0.2 * st.retombe) * (1 + 0.03 * Math.sin(T * 7.7));

    /* la caméra. L'ensemble fait deux unités et quart ; à 38° et en paysage
       la largeur vue vaut 1,07 fois la distance, et la colonne de texte prend
       43 % — d'où une distance de trois et demie, et un décalage de 0,80. */
    var q = ss(0, 1, Math.min(1, G / 1.9));
    /* l'ensemble fait deux unités : à 38° la largeur vue vaut 1,07 fois la
       distance, il en faut donc trois et demie pour qu'il tienne ENTIER
       dans les 57 % que la colonne de texte laisse — et le décalage vaut
       alors 0,78. Plus près, la cinquième forme sortait du cadre. */
    var cx = lerp(0.30, 0.00, q), cy = lerp(0.62, 1.06, q), cz = lerp(1.45, 3.40, q);
    cz = lerp(cz, 3.65, st.recul); cy = lerp(cy, 1.16, st.recul);
    var camA = V3(lerp(-0.48, 0.00, q), lerp(0.10, 0.06, q), 0.0);
    camera.position.set(cx + 0.012 * Math.sin(T * 0.27), cy + 0.008 * Math.sin(T * 0.35), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.26 * dist, 0.78));
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
