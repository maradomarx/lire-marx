/* LE MONDE DES IDÉES DOMINANTES — une presse à imprimer.

   « La production intellectuelle se transforme avec la production
   matérielle » : les idées ont une fabrication, et qui tient la presse tient
   la page. Une presse à bras sur son marbre, une feuille dessous.

     g 0-1.5   la presse de fer imprime LIBERTÉ · JUSTICE ;
     g 1-2     la pile des feuilles d'avant paraît à côté ;
     g 1.5-3.2 la presse redevient de bois : LES DIEUX DE LA CITÉ, puis
               LA FOI CHRÉTIENNE ;
     g 3.2-4   de fer à nouveau : LES LUMIÈRES ;
     g 4-5.2   LIBERTÉ DE CONSCIENCE, et en or « libre concurrence » ;
     g 5.2-6   la platine se relève sur une feuille blanche.

   LA FEUILLE NE CHANGE QUE PENDANT QUE LA PLATINE LA COUVRE : autrement on
   verrait un mot se transformer en un autre, là où il faut voir une page
   imprimée à nouveau. Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0b0806, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0806, 9, 20);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 17; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bump(a, b, v) { var t = (v - a) / (b - a); return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t); }

  var murTex = tex(512, 512, function (g, w, h) {
    var gr = g.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.62);
    gr.addColorStop(0, '#43301e'); gr.addColorStop(0.5, '#1d140c'); gr.addColorStop(1, '#0b0806');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ map: murTex, fog: false }));
  fond.position.set(0, 3.5, -8); scene.add(fond);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x030202, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  var grainTex = tex(128, 128, function (g, w, h) {
    g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) { var v = 150 + rnd() * 90 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v - 6) + ',' + (0.2 + rnd() * 0.3) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });

  /* LA MATIÈRE DE LA PRESSE : un matériau unique dont la couleur et le métal
     passent du bois au fer */
  var BOIS = new THREE.Color(0.16, 0.095, 0.05), FER = new THREE.Color(0.075, 0.07, 0.066);
  var matiere = new THREE.MeshStandardMaterial({ map: grainTex, color: BOIS.clone(), roughness: 0.8, metalness: 0 });
  var marbre = new THREE.MeshStandardMaterial({ map: grainTex, color: new THREE.Color(0.10, 0.095, 0.088), roughness: 0.9 });
  var table = new THREE.MeshStandardMaterial({ map: grainTex, color: new THREE.Color(0.12, 0.075, 0.042), roughness: 0.85 });

  function mesh(geo, mat, parent) { var m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; }

  /* ── la presse ── */
  var presse = new THREE.Group(); scene.add(presse);
  [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]].forEach(function (p) { mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), matiere, presse).position.set(p[0], 0.4, p[1]); });
  mesh(new THREE.BoxGeometry(2.1, 0.16, 1.0), matiere, presse).position.set(0, 0.86, 0);        /* le bâti bas */
  var marbreM = mesh(new THREE.BoxGeometry(1.6, 0.08, 1.0), marbre, presse); marbreM.position.set(0, 0.98, 0);
  mesh(new THREE.BoxGeometry(0.16, 2.3, 0.18), matiere, presse).position.set(-0.95, 2.0, 0);    /* les jumelles */
  mesh(new THREE.BoxGeometry(0.16, 2.3, 0.18), matiere, presse).position.set(0.95, 2.0, 0);
  mesh(new THREE.BoxGeometry(2.3, 0.3, 0.36), matiere, presse).position.set(0, 3.2, 0);          /* le sommier */
  var vis = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 14), matiere, presse);
  var platine = mesh(new THREE.BoxGeometry(1.25, 0.12, 0.82), matiere, presse);
  var barreau = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 10), matiere, presse); barreau.rotation.z = Math.PI / 2;

  /* ── la feuille : son texte est redessiné quand l'époque change ── */
  var feuilleCv = document.createElement('canvas'); feuilleCv.width = 1024; feuilleCv.height = 700;
  var fg = feuilleCv.getContext('2d');
  var feuilleTex = new THREE.CanvasTexture(feuilleCv); if (THREE.sRGBEncoding) feuilleTex.encoding = THREE.sRGBEncoding;
  feuilleTex.anisotropy = 4;
  var TEXTES = ['LIBERTÉ · JUSTICE', 'LES DIEUX DE LA CITÉ', 'LA FOI CHRÉTIENNE', 'LES LUMIÈRES', 'LIBERTÉ DE CONSCIENCE', ''];
  var dernierTexte = -1, derniereOr = -1;
  function dessineFeuille(k, orA) {
    if (k === dernierTexte && Math.abs(orA - derniereOr) < 0.02) return;
    dernierTexte = k; derniereOr = orA;
    fg.fillStyle = '#e9dcc0'; fg.fillRect(0, 0, 1024, 700);
    for (var i = 0; i < 2600; i++) { var v = 180 + rnd() * 60 | 0; fg.fillStyle = 'rgba(' + v + ',' + (v - 12) + ',' + (v - 34) + ',' + (rnd() * 0.25) + ')'; fg.fillRect(rnd() * 1024, rnd() * 700, 2, 2); }
    fg.strokeStyle = 'rgba(60,40,20,.35)'; fg.lineWidth = 3; fg.strokeRect(60, 60, 904, 580);
    var t = TEXTES[k];
    if (t) {
      fg.fillStyle = '#1a120a'; fg.textAlign = 'center'; fg.textBaseline = 'middle';
      var size = 132; fg.font = '900 ' + size + 'px Georgia, serif';
      while (fg.measureText(t).width > 880 && size > 40) { size -= 4; fg.font = '900 ' + size + 'px Georgia, serif'; }
      fg.fillText(t, 512, 300);
      fg.fillStyle = 'rgba(40,26,14,.55)'; fg.font = 'italic 34px Georgia, serif';
      for (var l = 0; l < 3; l++) fg.fillRect(180, 430 + l * 44, 664 - l * 90, 6);
      if (orA > 0.01) {
        fg.save(); fg.globalAlpha = orA; fg.translate(512, 520); fg.rotate(-0.05);
        fg.fillStyle = '#a8801e'; fg.font = 'italic 700 78px Georgia, serif';
        fg.fillText('= libre concurrence', 0, 0); fg.restore();
      }
    }
    feuilleTex.needsUpdate = true;
  }
  var feuille = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.9), new THREE.MeshStandardMaterial({ map: feuilleTex, roughness: 0.95 }));
  feuille.rotation.x = -Math.PI / 2; feuille.position.set(0, 1.025, 0.02); feuille.receiveShadow = true; presse.add(feuille);

  /* ── la pile des feuilles d'avant, sur une table à côté ── */
  var cote = new THREE.Group(); cote.position.set(2.15, 0, 0.2); cote.rotation.y = -0.25; scene.add(cote);
  mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), table, cote).position.set(0, 0.8, 0);
  [[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]].forEach(function (p) { mesh(new THREE.BoxGeometry(0.07, 0.8, 0.07), table, cote).position.set(p[0], 0.4, p[1]); });
  var pile = [];
  var papier = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.36, 0.32, 0.25), roughness: 0.95 });
  for (var i = 0; i < 14; i++) { var f = mesh(new THREE.BoxGeometry(0.9, 0.012, 0.62), papier, cote); f.position.set((rnd() - 0.5) * 0.05, 0.85 + i * 0.013, (rnd() - 0.5) * 0.05); f.rotation.y = (rnd() - 0.5) * 0.12; pile.push(f); }

  /* ── la lumière ── */
  scene.add(new THREE.HemisphereLight(0xd8b48a, 0x3a2a1c, 0.5));
  scene.add(new THREE.AmbientLight(0x3a2a1c, 0.5));
  var lampe = new THREE.DirectionalLight(0xffd6a0, 2.0);
  lampe.position.set(-3.5, 8, 5); lampe.castShadow = true; lampe.shadow.mapSize.set(2048, 2048);
  lampe.shadow.camera.left = -5; lampe.shadow.camera.right = 5; lampe.shadow.camera.top = 5; lampe.shadow.camera.bottom = -2;
  lampe.shadow.camera.near = 1; lampe.shadow.camera.far = 30; lampe.shadow.bias = -0.0008;
  scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0xffe2bd, 0.45); appoint.position.set(3, 3, 7); scene.add(appoint);

  /* les coups de presse : aux instants où la feuille change */
  var COUPS = [1.5, 2.5, 3.2, 4.0, 5.2];
  var G = 0, TT = 0, st = { fer: 1, pile: 0, or: 0, epoque: 0, platine: 0, zoom: 0 };
  function set(g) { G = g; }
  function compute() {
    st.fer = 1 - ss(1.25, 1.6, G) + ss(3.3, 3.8, G);
    st.pile = ss(0.9, 1.8, G);
    st.or = ss(4.45, 4.9, G) * (1 - ss(5.0, 5.2, G));
    /* on s'approche de la feuille pour lire la surimpression : de loin, l'or
       de « libre concurrence » était illisible */
    st.zoom = ss(4.2, 4.7, G) * (1 - ss(5.05, 5.5, G));
    var k = 0; for (var i = 0; i < COUPS.length; i++) if (G >= COUPS[i]) k = i + 1;
    st.epoque = k;
    var p = 0; for (i = 0; i < COUPS.length; i++) p = Math.max(p, bump(COUPS[i] - 0.17, COUPS[i] + 0.17, G));
    st.platine = p;
  }

  function frame(dt) {
    TT += dt; compute();
    matiere.color.copy(BOIS).lerp(FER, st.fer);
    matiere.metalness = 0.4 * st.fer; matiere.roughness = lerp(0.8, 0.45, st.fer);

    /* la platine descend, couvre la feuille, remonte */
    var yP = lerp(1.95, 1.10, st.platine);
    platine.position.set(0, yP, 0);
    vis.position.set(0, (3.05 + yP) / 2 + 0.05, 0); vis.scale.set(1, Math.max(0.2, (3.05 - yP) / 1.1), 1);
    barreau.position.set(0, yP + 0.55 + 0.25 * (1 - st.platine), 0.02);
    barreau.rotation.y = st.platine * 1.2;

    dessineFeuille(st.epoque, st.epoque === 4 ? st.or : 0);

    /* la pile se remplit avec l'histoire */
    var nPile = Math.round(st.pile * 8 + st.epoque * 1.2);
    pile.forEach(function (f, k) { f.visible = st.pile > 0.02 && k < nPile; });
    cote.position.y = -0.4 * (1 - st.pile);

    /* la caméra : sur la feuille, en plongée ; recule quand la pile paraît */
    /* au départ la presse était trop près : coupée en haut, et poussée hors
       du cadre par le décalage de visée */
    var dist = lerp(6.6, 7.4, st.pile);
    var az = lerp(-0.12, 0.32, st.pile);
    var cy = lerp(1.55, 1.5, st.pile), haut = 2.6;
    dist = lerp(dist, 3.6, st.zoom); haut = lerp(haut, 2.9, st.zoom); cy = lerp(cy, 1.05, st.zoom); az = lerp(az, 0.08, st.zoom);
    var cible = new THREE.Vector3(lerp(lerp(0, 0.55, st.pile), 0, st.zoom), cy, 0);
    camera.position.set(cible.x + Math.sin(az) * dist + 0.03 * Math.sin(TT * 0.23), cy + haut + 0.02 * Math.sin(TT * 0.31), Math.cos(az) * dist);
    var large = (canvas.clientWidth || 0) >= 1100;
    var fwd = new THREE.Vector3().subVectors(cible, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    aim.copy(cible).addScaledVector(right, large ? -lerp(0.17, 0.3, st.zoom) * camera.position.distanceTo(cible) : 0);
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h > 1.2 ? 40 : Math.min(72, 2 * Math.atan(Math.tan(52 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
