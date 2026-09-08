/* LE MONDE DE LA JOURNÉE DE TRAVAIL — la toise, et la barre.

   Le chapitre X démontre qu'une grandeur décisive n'est réglée par aucune
   loi économique : entre le droit de l'acheteur et celui du vendeur, tous
   deux également fondés, c'est la force qui décide. La figure devait donc
   montrer une LONGUEUR QUI MONTE et que rien n'arrête — jusqu'à ce que
   quelque chose l'arrête.

   Une toise verticale contre le mur de l'atelier, graduée en heures. Deux
   traits gravés : la limite morale, plus bas, et la limite physiologique,
   tout en haut. Un index de laiton monte — dix heures, douze, quatorze,
   seize — passe la limite morale sans rien rencontrer, approche l'autre.
   Puis une BARRE DE FER se fixe en travers, et l'index redescend contre
   elle : la loi n'a pas précédé le mouvement, elle l'a enregistré.

   Elle est VERTICALE, et c'est délibéré : la ligne a—b—c de la plus-value
   est horizontale, et deux pages voisines ne doivent pas se ressembler.
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 3.2, 8.5);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 197; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le mur de l'atelier ── */
  var platreTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#6e6050'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 4800; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '32,24,16' : '150,138,116') + ',' + (rnd() * 0.10) + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 3); }
    for (i = 0; i < 8; i++) { g.strokeStyle = 'rgba(24,16,8,.15)'; g.lineWidth = 1; g.beginPath(); var x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (var k = 0; k < 6; k++) { x += (rnd() - 0.5) * 70; y += 30 + rnd() * 40; g.lineTo(x, y); } g.stroke(); }
  });
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(7, 5.2), std({ map: platreTex, roughness: 0.97, color: 0x7d6f5c }));
  mur.position.set(0, 1.9, -0.55); mur.receiveShadow = true; scene.add(mur);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), std({ color: 0x352a1e, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(0, -0.7, 0.6); sol.receiveShadow = true; scene.add(sol);

  /* ── LA TOISE : graduée en heures, de zéro à vingt-quatre ── */
  /* UNE TOISE HAUTE NE TIENT PAS DANS UN CADRE EN PAYSAGE : à 3,7 de haut
     elle sortait par les deux bouts, et il aurait fallu reculer de six pour
     la voir entière — la graduation devenait alors illisible. Ramenée à
     deux et élargie, elle tient, et le mur autour fait le reste. */
  var Y0 = -0.30, Y24 = 1.78, TX = 0.34;
  function yh(heures) { return Y0 + (Y24 - Y0) * heures / 24; }
  var toiseTex = tex(128, 2048, function (g, w, h) {
    g.fillStyle = '#c9b58d'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 1400; i++) { g.fillStyle = 'rgba(110,88,54,' + (rnd() * 0.07) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    g.strokeStyle = '#3a2a14'; g.fillStyle = '#3a2a14'; g.textAlign = 'left';
    for (var k = 0; k <= 24; k++) {
      var y = h - 12 - (h - 24) * k / 24;
      var gros = k % 6 === 0;
      g.lineWidth = gros ? 5 : 2;
      g.beginPath(); g.moveTo(6, y); g.lineTo(gros ? 52 : 32, y); g.stroke();
      if (gros) { g.font = 'italic 56px Georgia, serif'; g.fillText(String(k), 62, y + 20); }
    }
  });
  var toise = new THREE.Mesh(new THREE.BoxGeometry(0.42, Y24 - Y0 + 0.10, 0.05), std({ map: toiseTex, roughness: 0.8 }));
  toise.position.set(TX, (Y0 + Y24) / 2, -0.50); toise.castShadow = toise.receiveShadow = true; scene.add(toise);

  /* les deux limites, gravées */
  function limite(y, col) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.020, 0.02), std({ color: col, roughness: 0.6, metalness: 0.2 }));
    m.position.set(TX, y, -0.465); m.castShadow = true; scene.add(m); return m;
  }
  var limMorale = limite(yh(12), 0x8a7a58);
  var limPhysio = limite(yh(22), 0x7a5040);

  /* ── L'INDEX : la longueur du jour ── */
  var laiton = std({ color: 0xb08a34, metalness: 0.85, roughness: 0.28 });
  var index = new THREE.Group();
  var plaque = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.062, 0.035), laiton); index.add(plaque);
  var pointe = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 4), laiton);
  pointe.rotation.z = -Math.PI / 2; pointe.position.x = -0.35; index.add(pointe);
  index.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  index.position.set(TX, yh(10), -0.44); scene.add(index);
  /* la colonne remplie sous l'index : le jour déjà pris */
  var colonneMat = std({ color: 0x9a4a30, roughness: 0.62, emissive: 0x2a0c05, emissiveIntensity: 0.25 });
  var colonne = new THREE.Mesh(new THREE.BoxGeometry(0.215, 1, 0.02), colonneMat);
  colonne.position.set(TX, 0, -0.462); scene.add(colonne);

  /* ── LA BARRE DE FER : la loi de fabrique ── */
  var barre = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.055, 0.055), std({ color: 0x6e747a, metalness: 0.7, roughness: 0.42 }));
  barre.castShadow = true; barre.visible = false; scene.add(barre);
  var rivets = [];
  [-0.40, 0.40].forEach(function (dx) {
    var r = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), std({ color: 0x5a5f64, metalness: 0.7, roughness: 0.4 }));
    r.visible = false; r.castShadow = true; scene.add(r); rivets.push([r, dx]);
  });

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x3a3026, 0.4));
  var lampe = new THREE.PointLight(0xffc286, 3.0, 7, 1.7); lampe.position.set(-0.85, 2.55, 1.25);
  lampe.castShadow = true; lampe.shadow.bias = -0.0012; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { heures: 10, marques: 0, monte: 0, force: 0, barre: 0, retombe: 0 };
  function set(g) { G = g; }
  function compute() {
    st.marques = ss(0.9, 1.9, G);
    st.monte   = ss(1.6, 3.9, G);           /* dix heures → dix-huit */
    st.force   = ss(3.9, 4.5, G);           /* la limite physiologique franchie */
    st.barre   = ss(4.6, 5.2, G);           /* la barre se pose */
    st.retombe = ss(5.15, 5.8, G);          /* l'index redescend contre elle */
    var h = lerp(10, 18, st.monte);
    h = lerp(h, 21, st.force);
    h = lerp(h, 10, st.retombe);
    st.heures = h;
  }

  function frame(dt) {
    T += dt; compute();
    var y = yh(st.heures);
    index.position.y = y + 0.004 * Math.sin(T * 1.7) * (1 - st.retombe);
    colonne.scale.y = Math.max(0.01, y - Y0);
    colonne.position.y = Y0 + (y - Y0) / 2;
    /* elle rougit quand la journée passe les limites */
    var chaud = cl((st.heures - 12) / 9);
    /* un rouge FRANC : sous la lampe chaude, un rouge clair vire au saumon —
       le piège déjà payé sur la propriété privée et sur la cire du cachet */
    colonneMat.color.setRGB(0.34 + 0.26 * chaud, 0.08 - 0.03 * chaud, 0.06 - 0.02 * chaud);
    colonneMat.emissiveIntensity = 0.2 + 0.55 * chaud;

    limMorale.visible = st.marques > 0.05; limMorale.scale.x = 0.2 + 0.8 * st.marques;
    limPhysio.visible = st.marques > 0.35; limPhysio.scale.x = 0.2 + 0.8 * cl(st.marques * 1.4 - 0.4);

    barre.visible = st.barre > 0.03;
    barre.position.set(TX, yh(10) + 0.10, -0.40);
    barre.scale.x = 0.15 + 0.85 * st.barre;
    rivets.forEach(function (p) { p[0].visible = st.barre > 0.75; p[0].position.set(TX + p[1] * st.barre, yh(10) + 0.10, -0.40); });

    lampe.intensity = 3.0 * (1 + 0.03 * Math.sin(T * 7.9));

    /* la caméra : la toise est HAUTE, donc le cadrage est vertical — on
       recule assez pour la tenir entière, et le décalage est faible parce
       que la figure est étroite */
    var q = ss(0, 1, Math.min(1, G / 1.7));
    var cx = lerp(0.86, 0.30, q), cy = lerp(0.52, 0.80, q), cz = lerp(1.90, 3.65, q);
    var camA = V3(TX, lerp(yh(10), 0.74, q), -0.48);
    camera.position.set(cx + 0.012 * Math.sin(T * 0.27), cy + 0.009 * Math.sin(T * 0.35), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.26 * dist, 0.62));
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
