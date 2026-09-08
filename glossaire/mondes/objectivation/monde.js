/* LE MONDE DE L'OBJECTIVATION — le cachet et la cire.

   Le concept est le FAIT NEUTRE dont l'aliénation n'est qu'une modalité :
   le travail se réalise dans un objet, où il se fixe et demeure. Il fallait
   donc une figure qui montre un passage de forme, et rien de plus — pas une
   dépossession, que la page du travail aliéné porte déjà.

   Un cachet descend sur une goutte de cire ; il presse ; il se relève ; et
   la forme est PASSÉE — elle est maintenant dans la cire, dure, séparée,
   durable. Le cachet, lui, est intact : rien ne lui a été pris. C'est très
   exactement ce que dit le concept, et c'est pourquoi la scène doit être
   belle plutôt que sombre : objectiver n'est pas perdre.

   Au dernier temps le cachet s'écarte et la cire refroidit — elle passe du
   rouge fondu au rouge mat, et le sceau reste. Tout est fonction de g. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0705, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.04; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0705, 2.4, 6.6);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 13; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── la table, et la feuille ── */
  var boisTex = tex(1024, 512, function (g, w, h) {
    g.fillStyle = '#3c2917'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 200; i++) {
      g.strokeStyle = 'rgba(16,9,3,' + (0.06 + rnd() * 0.15) + ')'; g.lineWidth = 0.7 + rnd() * 2;
      g.beginPath(); var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 60) g.lineTo(x, y + (rnd() - 0.5) * 6); g.stroke();
    }
  });
  var table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), std({ map: boisTex, roughness: 0.66, color: 0xb59976 }));
  table.position.set(0, -0.06, 0); table.receiveShadow = table.castShadow = true; scene.add(table);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), std({ color: 0x1a1209, roughness: 0.98 }));
  fond.position.set(0, 1.2, -1.7); fond.receiveShadow = true; scene.add(fond);
  var papierTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#d9cdae'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(120,100,72,' + (rnd() * 0.05) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    g.strokeStyle = 'rgba(70,52,28,.28)'; g.lineWidth = 2;
    for (i = 0; i < 9; i++) { var y = 90 + i * 30; g.beginPath(); g.moveTo(70, y); g.lineTo(70 + 200 + rnd() * 160, y); g.stroke(); }
  });
  var feuille = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.62), std({ map: papierTex, roughness: 0.94 }));
  feuille.rotation.x = -Math.PI / 2; feuille.position.set(0.34, 0.004, 0.06); feuille.receiveShadow = true; scene.add(feuille);

  /* ── LA CIRE ── */
  var CX = 0.48, CZ = -0.02;
  var cireMat = std({ color: 0xd2402c, roughness: 0.28, metalness: 0.0, emissive: 0x2a0603, emissiveIntensity: 0.0 });
  var cire = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.125, 0.052, 28), cireMat);
  cire.position.set(CX, 0.024, CZ); cire.castShadow = cire.receiveShadow = true; scene.add(cire);
  /* l'empreinte : un disque gravé, qui n'apparaît qu'une fois la forme passée */
  var sceauTex = tex(256, 256, function (g, w, h) {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(60,10,4,.85)'; g.lineWidth = 9;
    g.beginPath(); g.arc(128, 128, 96, 0, 6.3); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(128, 128, 80, 0, 6.3); g.stroke();
    g.fillStyle = 'rgba(60,10,4,.85)'; g.textAlign = 'center';
    g.font = 'italic 108px Georgia, serif'; g.fillText('M', 128, 168);
    for (var a = 0; a < 12; a++) { var t = a / 12 * 6.283; g.beginPath(); g.arc(128 + Math.cos(t) * 88, 128 + Math.sin(t) * 88, 5, 0, 6.3); g.fill(); }
  });
  var empreinte = new THREE.Mesh(new THREE.CircleGeometry(0.108, 40),
    new THREE.MeshBasicMaterial({ map: sceauTex, transparent: true, opacity: 0, depthWrite: false }));
  empreinte.rotation.x = -Math.PI / 2; empreinte.position.set(CX, 0.051, CZ); empreinte.renderOrder = 3; scene.add(empreinte);

  /* ── LE CACHET ── */
  var laiton = std({ color: 0xb08a34, metalness: 0.86, roughness: 0.28 });
  var cachet = new THREE.Group();
  var tete = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.055, 28), laiton); cachet.add(tete);
  var col = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.075, 0.10, 20), laiton); col.position.y = 0.078; cachet.add(col);
  var manche = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.030, 0.44, 18), std({ color: 0x4a2c16, roughness: 0.62 }));
  manche.position.y = 0.35; cachet.add(manche);
  var pomme = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), std({ color: 0x4a2c16, roughness: 0.6 }));
  pomme.position.y = 0.58; cachet.add(pomme);
  cachet.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(cachet);

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x3c2e20, 0.38));
  var lampe = new THREE.PointLight(0xffc07a, 3.1, 5.2, 1.8); lampe.position.set(-0.34, 1.05, 0.62);
  lampe.castShadow = true; lampe.shadow.bias = -0.0013; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);
  var abat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 20, 1, true), std({ color: 0x2b1d13, roughness: 0.82, side: THREE.DoubleSide }));
  abat.position.set(-0.34, 1.15, 0.62); scene.add(abat);
  var froide = new THREE.DirectionalLight(0xcfe0ff, 0.55); froide.position.set(1.5, 1.1, 1.1); scene.add(froide);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { chaud: 0, presse: 0, releve: 0, froid: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.chaud  = ss(0.15, 1.4, G) * (1 - ss(3.3, 4.6, G));   /* la cire fond, puis prend */
    st.presse = ss(1.7, 2.9, G);                            /* le cachet descend et presse */
    st.releve = ss(3.0, 3.9, G);                            /* il se relève : la forme est passée */
    st.froid  = ss(3.6, 4.9, G);                            /* la cire durcit */
    st.recul  = ss(4.8, 5.7, G);
  }

  function frame(dt) {
    T += dt; compute();

    /* le cachet : il descend, presse, se relève — et il est INTACT */
    /* le cachet ne monte pas plus haut que le cadre : relevé à 0,62 il
       sortait par le haut et sa tête était coupée */
    var bas = 0.056, haut = 0.42;
    var y = lerp(haut, bas, st.presse);
    y = lerp(y, haut + 0.05, st.releve);
    cachet.position.set(CX, y, CZ);
    cachet.rotation.z = 0.04 * Math.sin(T * 0.5) * (1 - st.presse) + 0.06 * st.releve;

    /* la cire : molle et luisante, puis pressée, puis dure et mate */
    var p = st.presse * (1 - st.releve * 0.0);
    cire.scale.set(1 + 0.16 * p, lerp(1, 0.62, p), 1 + 0.16 * p);
    cire.position.y = 0.024 * lerp(1, 0.62, p);
    cireMat.roughness = lerp(0.22, 0.72, st.froid);
    cireMat.emissiveIntensity = 0.28 * st.chaud * (1 - st.froid);
    /* un rouge FRANC : sous la lampe chaude et le tone mapping, un rouge
       clair vire au saumon — le piège déjà payé sur la propriété privée */
    cireMat.color.setRGB(lerp(0.56, 0.34, st.froid), lerp(0.09, 0.06, st.froid), lerp(0.06, 0.05, st.froid));

    /* l'empreinte : elle paraît quand le cachet se relève. La forme est
       PASSÉE — elle est dans la cire, et le cachet n'a rien perdu. */
    empreinte.material.opacity = 0.95 * st.releve;
    empreinte.position.y = 0.051 * lerp(1, 0.62, p) + 0.001;
    empreinte.scale.setScalar(1 + 0.16 * p);

    lampe.intensity = 3.1 * (1 + 0.03 * Math.sin(T * 7.1));

    /* la caméra : serrée sur la cire, puis un peu de recul.
       L'ensemble tient dans une unité ; à 38° la largeur vue vaut 1,07 fois
       la distance, et la colonne de texte prend 43 % — d'où 2,0 et 0,45. */
    var q = ss(0, 1, Math.min(1, G / 1.7));
    var cx = lerp(0.62, 0.22, q), cy = lerp(0.44, 0.72, q), cz = lerp(0.86, 1.72, q);
    cz = lerp(cz, 2.0, st.recul); cy = lerp(cy, 0.84, st.recul);
    var camA = V3(lerp(CX, CX - 0.16, q), lerp(0.09, 0.10, q), CZ);
    camera.position.set(cx + 0.010 * Math.sin(T * 0.31), cy + 0.007 * Math.sin(T * 0.39), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.26 * dist, 0.45));
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
