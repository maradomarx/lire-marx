/* LE MONDE DE LA PROPRIÉTÉ PRIVÉE — le minéral, et les deux regards.

   Marx donne lui-même la figure, au troisième manuscrit : le marchand de
   minéraux ne voit pas la beauté ni la nature propre du minéral, il en voit
   la valeur marchande. Il a bien un œil pour la pierre, mais un œil qui ne
   perçoit d'elle qu'une grandeur. C'est le sens de l'avoir, qui a remplacé
   tous les autres.

   La scène est donc UN SEUL OBJET vu deux fois. Un cristal facetté sur une
   table, sous une lampe : il tourne, ses facettes accrochent la lumière. On
   le pose sur une balance, on lui attache une étiquette, un nombre paraît —
   et il S'ÉTEINT : le matériau devient mat, les éclats meurent, il ne reste
   lisible que le chiffre. Au dernier temps l'étiquette tombe, et il reprend
   la lumière en jetant des couleurs sur le bois : « la suppression positive
   de la propriété privée est l'émancipation complète de tous les sens ».

   Rien n'a changé dans la pierre. C'est le regard qui a changé, et c'est
   exactement ce que dit le concept. Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.6, 7.4);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 71; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── la table ── */
  var boisTex = tex(1024, 512, function (g, w, h) {
    g.fillStyle = '#3a2716'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 220; i++) {
      g.strokeStyle = 'rgba(16,9,3,' + (0.06 + rnd() * 0.15) + ')'; g.lineWidth = 0.7 + rnd() * 2;
      g.beginPath(); var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 60) g.lineTo(x, y + (rnd() - 0.5) * 6);
      g.stroke();
    }
  });
  var table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.25), std({ map: boisTex, roughness: 0.68, color: 0xb69a76 }));
  table.position.set(0, -0.06, 0); table.receiveShadow = table.castShadow = true; scene.add(table);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), std({ color: 0x1b1309, roughness: 0.98 }));
  fond.position.set(0, 1.3, -1.9); fond.receiveShadow = true; scene.add(fond);

  /* ── LE MINÉRAL ── */
  var CX = 0.30, CZ = -0.05;
  var pierreMat = std({ color: 0xcfe0ea, roughness: 0.12, metalness: 0.05, flatShading: true });
  /* UN MINÉRAL, PAS UN DÉ : l'icosaèdre régulier se reconnaît tout de suite
     pour ce qu'il est. On tire ses sommets au hasard et on l'étire, et il
     redevient une pierre clivée. */
  var pgeo = new THREE.IcosahedronGeometry(0.21, 0);
  (function () {
    var pos = pgeo.attributes.position, v = new THREE.Vector3();
    var vus = {};
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var k = v.x.toFixed(3) + ',' + v.y.toFixed(3) + ',' + v.z.toFixed(3);
      if (!vus[k]) vus[k] = 0.74 + rnd() * 0.52;
      v.multiplyScalar(vus[k]); pos.setXYZ(i, v.x, v.y * 1.28, v.z);
    }
    pgeo.computeVertexNormals();
  })();
  var pierre = new THREE.Mesh(pgeo, pierreMat);
  pierre.position.set(CX, 0.20, CZ); pierre.castShadow = pierre.receiveShadow = true; scene.add(pierre);
  /* le petit lit d'étoffe sous elle */
  var etoffe = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.23, 0.022, 22), std({ color: 0x231d19, roughness: 1 })   /* GRIS et non brun-rouge : sous une lampe chaude et le tone mapping, un rouge sombre vire au saumon */);
  etoffe.position.set(CX, 0.014, CZ); etoffe.receiveShadow = true; scene.add(etoffe);

  /* les éclats : ce que le marchand ne voit pas */
  var eclatTex = tex(64, 64, function (g, w, h) {
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.25, 'rgba(210,235,255,.5)'); gr.addColorStop(1, 'rgba(180,220,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var eclats = [];
  for (var i = 0; i < 7; i++) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: eclatTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    s.scale.setScalar(0.10 + rnd() * 0.07); scene.add(s); eclats.push(s);
  }
  /* les couleurs qu'elle jette sur le bois, une fois l'étiquette tombée */
  var tacheTex = tex(64, 64, function (g, w, h) {
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var taches = [];
  [[0xff9c6a, -0.34, 0.26], [0x8fd3ff, 0.42, 0.31], [0xffd98a, 0.06, 0.40], [0xc9a0ff, -0.12, -0.34]].forEach(function (q) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26),
      new THREE.MeshBasicMaterial({ map: tacheTex, color: q[0], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    m.rotation.x = -Math.PI / 2; m.position.set(CX + q[1], 0.007, CZ + q[2]); scene.add(m); taches.push(m);
  });

  /* ── L'APPAREIL DU MARCHAND : la balance, et l'étiquette ── */
  var laiton = std({ color: 0xa8842f, metalness: 0.8, roughness: 0.34 });
  var balance = new THREE.Group();
  var pied = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.03, 20), laiton); balance.add(pied);
  var mat_ = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.46, 10), laiton); mat_.position.y = 0.245; balance.add(mat_);
  var fleau = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.014, 0.014), laiton); fleau.position.y = 0.47; balance.add(fleau);
  [-0.24, 0.24].forEach(function (x) {
    var pan = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.012, 18), laiton);
    pan.position.set(x, 0.40, 0); balance.add(pan);
    var fil = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 6), laiton);
    fil.position.set(x, 0.435, 0); balance.add(fil);
  });
  balance.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  balance.position.set(CX - 0.70, 0.015, CZ - 0.16); balance.visible = false; scene.add(balance);

  /* l'étiquette : un carton, un fil, et un nombre */
  var etiqCv = document.createElement('canvas'); etiqCv.width = 256; etiqCv.height = 152;
  var eg = etiqCv.getContext('2d');
  var etiqTex = new THREE.CanvasTexture(etiqCv);
  if (THREE.sRGBEncoding) etiqTex.encoding = THREE.sRGBEncoding;
  var lastEt = -1;
  function drawEtiq(n) {
    if (Math.abs(n - lastEt) < 0.02) return; lastEt = n;
    eg.fillStyle = '#ddd0ae'; eg.fillRect(0, 0, 256, 152);
    eg.strokeStyle = 'rgba(90,70,40,.5)'; eg.lineWidth = 3; eg.strokeRect(6, 6, 244, 140);
    eg.beginPath(); eg.arc(128, 26, 9, 0, 6.3); eg.fillStyle = '#2c1c0c'; eg.fill();
    if (n > 0.02) {
      eg.globalAlpha = n; eg.fillStyle = '#2a1a0c'; eg.textAlign = 'center';
      eg.font = 'italic 62px Georgia, serif'; eg.fillText('42 fr.', 128, 108);
      eg.globalAlpha = 1;
    }
    etiqTex.needsUpdate = true;
  }
  drawEtiq(0);
  var etiquette = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.145), std({ map: etiqTex, roughness: 0.92, side: THREE.DoubleSide }));
  etiquette.position.set(CX + 0.26, 0.16, CZ + 0.16); etiquette.rotation.y = -0.42; etiquette.castShadow = true;
  etiquette.visible = false; scene.add(etiquette);
  var ficelle = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.24, 6), std({ color: 0xbfae8a, roughness: 1 }));
  ficelle.position.set(CX + 0.14, 0.235, CZ + 0.10); ficelle.rotation.z = 1.05; ficelle.visible = false; scene.add(ficelle);

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x382b1e, 0.3));
  var lampe = new THREE.PointLight(0xffc98a, 3.0, 5.5, 1.8); lampe.position.set(-0.30, 1.12, 0.66);
  lampe.castShadow = true; lampe.shadow.bias = -0.0013; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var abat = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.15, 20, 1, true), std({ color: 0x2b1d13, roughness: 0.82, side: THREE.DoubleSide }));
  abat.position.set(-0.30, 1.23, 0.66); scene.add(abat);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);
  /* un petit trait froid, qui n'éclaire que la pierre — c'est lui qui meurt */
  var froide = new THREE.DirectionalLight(0xbcd8ff, 1.5); froide.position.set(1.6, 1.4, 1.2); scene.add(froide);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { tourne: 0, balance: 0, etiq: 0, nombre: 0, mat: 0, rendu: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.tourne  = ss(0.05, 0.9, G);
    st.balance = ss(1.1, 1.9, G);
    st.etiq    = ss(2.15, 2.85, G);
    st.nombre  = ss(2.6, 3.2, G);
    st.mat     = ss(3.15, 4.05, G);     /* elle s'éteint */
    st.rendu   = ss(4.45, 5.25, G);     /* l'étiquette tombe, elle reprend la lumière */
    st.recul   = ss(5.1, 5.85, G);
  }

  function frame(dt) {
    T += dt; compute();
    pierre.rotation.y = T * 0.34; pierre.rotation.x = 0.28 + Math.sin(T * 0.21) * 0.05;

    /* le matériau : vif, puis mat, puis rendu — plus vif qu'avant */
    var m = st.mat * (1 - st.rendu), r = st.rendu;
    pierreMat.roughness = lerp(lerp(0.10, 0.97, m), 0.06, r);
    pierreMat.color.setRGB(lerp(lerp(0.78, 0.27, m), 0.90, r), lerp(lerp(0.85, 0.26, m), 0.95, r), lerp(lerp(0.90, 0.24, m), 1.0, r));
    froide.intensity = 1.5 * (1 - 0.88 * m) * (1 + 0.5 * r);

    var vif = (1 - m) * (0.55 + 0.75 * st.tourne + 0.7 * r);
    eclats.forEach(function (s, k) {
      var a = T * (0.5 + k * 0.11) + k * 1.7;
      s.position.set(CX + Math.cos(a) * 0.19, 0.20 + Math.sin(a * 1.3) * 0.15, CZ + Math.sin(a) * 0.19);
      s.material.opacity = cl(vif) * (0.35 + 0.65 * Math.abs(Math.sin(a * 2.1)));
    });
    taches.forEach(function (t2, k) {
      t2.material.opacity = 0.55 * r * (0.6 + 0.4 * Math.sin(T * 0.8 + k));
    });

    balance.visible = st.balance > 0.02;
    balance.scale.setScalar(0.35 + 0.65 * st.balance);
    fleau.rotation.z = 0.10 * Math.sin(T * 0.9) * (1 - st.balance * 0.7) - 0.05 * st.balance;

    /* l'étiquette : elle se noue, puis elle tombe */
    var e = st.etiq * (1 - st.rendu);
    etiquette.visible = e > 0.02; ficelle.visible = e > 0.02;
    etiquette.position.set(CX + 0.26, lerp(0.42, 0.16, st.etiq) - 0.34 * st.rendu, CZ + 0.16);
    etiquette.rotation.z = -0.9 * st.rendu; etiquette.rotation.y = -0.42 + 0.5 * st.rendu;
    etiquette.material.opacity = 1; 
    drawEtiq(st.nombre);

    lampe.intensity = 3.0 * (1 + 0.03 * Math.sin(T * 7.3));

    /* la caméra. L'ensemble fait à peu près une unité et quart ; à 38° et en
       paysage la largeur vue vaut 1,07 fois la distance, et la colonne de
       texte prend 43 % — d'où deux unités et demie, et un décalage de 0,52. */
    var q = ss(0, 1, Math.min(1, G / 1.8));
    var cx = lerp(0.46, 0.10, q), cy = lerp(0.52, 0.84, q), cz = lerp(1.05, 2.30, q);
    cz = lerp(cz, 2.55, st.recul); cy = lerp(cy, 0.96, st.recul);
    var camA = V3(lerp(CX, CX - 0.235, q), lerp(0.20, 0.14, q), CZ);
    camera.position.set(cx + 0.012 * Math.sin(T * 0.29), cy + 0.008 * Math.sin(T * 0.37), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.26 * dist, 0.42));
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
