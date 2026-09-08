/* LE MONDE DES BESOINS — la fenêtre qui se resserre, le rebord qui se charge.

   Le fragment dit deux mouvements et affirme qu'ils n'en font qu'un : d'un
   côté on invente des jouissances, de l'autre on abaisse le seuil de ce qui
   compte comme besoin — la lumière, l'air, la propreté la plus élémentaire
   cessent d'en être. La scène montre donc LES DEUX EN MÊME TEMPS, dans une
   seule image : le rebord d'une fenêtre se charge d'objets pendant que
   l'ouverture se referme et que le jour baisse.

   ET LE DERNIER TEMPS NE VIDE PAS LE REBORD. Ce serait le contresens que
   l'essai écarte : Marx ne prêche pas la frugalité, c'est l'économie
   politique qui prêche le renoncement. La fenêtre se rouvre, et les mêmes
   objets, espacés et éclairés, deviennent distincts — ce qui sépare un
   besoin d'un autre n'est pas son objet, c'est son rapport.

   La fenêtre est UN VRAI TROU (quatre panneaux mobiles autour de
   l'ouverture) : la leçon de la force de travail. Tout est fonction de g. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x090705, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.05, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 37; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── la pièce : un plâtre sale, un plancher ── */
  var platreTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#6a5c4c'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 5200; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '30,22,14' : '150,136,112') + ',' + (rnd() * 0.10) + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 3); }
    for (i = 0; i < 9; i++) { g.strokeStyle = 'rgba(24,16,8,.16)'; g.lineWidth = 1; g.beginPath(); var x = rnd() * w, y = rnd() * h; g.moveTo(x, y); for (var k = 0; k < 7; k++) { x += (rnd() - 0.5) * 70; y += 30 + rnd() * 40; g.lineTo(x, y); } g.stroke(); }
  });
  platreTex.wrapS = platreTex.wrapT = THREE.RepeatWrapping;
  var mur = std({ map: platreTex, roughness: 0.97, color: 0x8a7c68 });
  var WZ = -1.65, OW = 1.30, OH = 1.62, OY = 1.28;   /* l'ouverture au repos */

  /* LES QUATRE PANNEAUX : ils bougent, et c'est eux qui referment le jour */
  var panG = new THREE.Mesh(new THREE.BoxGeometry(4, 4.4, 0.16), mur);
  var panD = new THREE.Mesh(new THREE.BoxGeometry(4, 4.4, 0.16), mur);
  var panH = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 0.16), mur);
  var panB = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 0.16), mur);
  [panG, panD, panH, panB].forEach(function (p) { p.receiveShadow = true; p.castShadow = true; scene.add(p); });

  var sol = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), std({ map: platreTex, roughness: 1, color: 0x4e4034 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);
  var murL = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.4), mur);
  murL.rotation.y = Math.PI / 2; murL.position.set(-1.65, 2.2, 0.6); murL.receiveShadow = true; scene.add(murL);

  /* le rebord */
  var rebord = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.34), std({ color: 0x5c4a34, roughness: 0.86 }));
  rebord.position.set(0.55, OY - OH / 2 - 0.04, WZ + 0.16); rebord.castShadow = rebord.receiveShadow = true; scene.add(rebord);

  /* ── LE JOUR : un plan derrière l'ouverture ── */
  var jourMat = new THREE.MeshBasicMaterial({ color: 0xdfe8f2, fog: false });
  var jour = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), jourMat);
  jour.position.set(0.55, OY, WZ - 0.6); scene.add(jour);

  /* ── LES OBJETS DU REBORD : ils s'entassent, puis s'espacent ── */
  var objets = [];
  function petit(kind, col) {
    var g;
    if (kind === 0) g = new THREE.CylinderGeometry(0.045, 0.06, 0.20, 12);
    else if (kind === 1) g = new THREE.BoxGeometry(0.13, 0.10, 0.09);
    else if (kind === 2) g = new THREE.SphereGeometry(0.062, 12, 10);
    else if (kind === 3) g = new THREE.CylinderGeometry(0.075, 0.075, 0.018, 18);
    else g = new THREE.ConeGeometry(0.06, 0.17, 10);
    var m = new THREE.Mesh(g, std({ color: col, roughness: 0.34, metalness: 0.35 }));
    m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m); return m;
  }
  var COULS = [0xc9a86a, 0xa8b6c4, 0xb98f8f, 0xc8c0a4, 0x9aa88f, 0xc4a4c0, 0xb0a070];
  for (var i = 0; i < 7; i++) objets.push(petit(i % 5, COULS[i]));

  /* ── la lumière : elle vient de l'ouverture, et d'elle seule ── */
  var amb = new THREE.AmbientLight(0x3a342c, 0.55); scene.add(amb);
  /* un appoint très faible, chaud, qui ne vient de nulle part : sans lui
     la pièce refermée tombe au noir absolu et l'image ne dit plus rien —
     or ce qu'on doit voir, c'est le rebord qui se charge PENDANT que le
     jour baisse, donc les deux à la fois */
  var veilleuse = new THREE.PointLight(0xffb877, 0.9, 4.2, 1.7); veilleuse.position.set(-0.35, 1.5, 0.9); scene.add(veilleuse);
  var dehors = new THREE.DirectionalLight(0xdfe8f2, 2.5);
  dehors.position.set(0.9, 3.2, WZ - 3.4); dehors.target.position.set(0.4, 0.9, 0.4);
  dehors.castShadow = true; dehors.shadow.mapSize.set(2048, 2048);
  dehors.shadow.camera.left = -3; dehors.shadow.camera.right = 3;
  dehors.shadow.camera.top = 3.4; dehors.shadow.camera.bottom = -1;
  dehors.shadow.camera.near = 0.5; dehors.shadow.camera.far = 12; dehors.shadow.bias = -0.0011;
  scene.add(dehors); scene.add(dehors.target);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { charge: 0, ferme: 0, nuit: 0, rouvre: 0, espace: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.charge = ss(1.05, 3.6, G);     /* le rebord se charge */
    st.ferme  = ss(2.4, 4.35, G);     /* l'ouverture se referme */
    st.nuit   = ss(2.6, 4.35, G);
    st.rouvre = ss(4.55, 5.4, G);     /* elle se rouvre */
    st.espace = ss(4.85, 5.75, G);    /* les objets s'espacent et se distinguent */
    st.recul  = ss(5.0, 5.8, G);
  }

  function frame(dt) {
    T += dt; compute();

    /* l'ouverture : les quatre panneaux se resserrent, puis se rouvrent —
       et elle se rouvre PLUS GRANDE qu'au départ */
    var f = st.ferme * (1 - st.rouvre);
    var w = lerp(OW, 0.30, f) * lerp(1, 1.22, st.rouvre);
    var h = lerp(OH, 0.52, f) * lerp(1, 1.16, st.rouvre);
    panG.position.set(0.55 - w / 2 - 2, OY, WZ);
    panD.position.set(0.55 + w / 2 + 2, OY, WZ);
    panH.position.set(0.55, OY + h / 2 + 1.1, WZ);
    panB.position.set(0.55, OY - h / 2 - 1.1, WZ);

    /* le jour : il baisse et se refroidit, puis revient plus clair */
    var n = st.nuit * (1 - st.rouvre), r = st.rouvre;
    var k = lerp(lerp(1, 0.17, n), 1.32, r);
    jourMat.color.setRGB(0.875 * k, lerp(lerp(0.91, 0.72, n), 0.94, r) * k, lerp(lerp(0.95, 0.62, n), 0.98, r) * k);
    dehors.intensity = lerp(lerp(2.5, 0.55, n), 3.4, r);
    amb.intensity = lerp(lerp(0.55, 0.34, n), 0.62, r);
    veilleuse.intensity = 0.35 + 0.95 * n * (1 - r);

    /* le rebord : ils arrivent l'un après l'autre, serrés ; puis ils
       s'espacent et chacun redevient distinct */
    objets.forEach(function (m, j) {
      var a = cl(st.charge * objets.length - j);
      m.visible = a > 0.03;
      var serre = 0.55 - 0.26 + j * 0.088;                 /* entassés */
      var large = 0.55 - 0.78 + j * 0.26;                  /* espacés */
      var x = lerp(serre, large, st.espace);
      m.position.set(x, OY - OH / 2 + 0.10 + (j % 2) * 0.012, WZ + 0.17 + ((j % 3) - 1) * 0.045 * (1 - st.espace));
      m.scale.setScalar(0.35 + 0.65 * a);
      m.rotation.y = j * 0.9 + T * 0.05 * st.espace;
      m.material.roughness = lerp(0.34, 0.20, st.espace);
    });

    /* la caméra : on est DEDANS, et l'on recule un peu à la fin */
    var q = ss(0, 1, Math.min(1, G / 2.2));
    var cx = lerp(-0.34, -0.62, q), cy = lerp(1.32, 1.24, q), cz = lerp(1.15, 1.95, q);
    cz = lerp(cz, 2.35, st.recul);
    var camA = V3(lerp(0.55, 0.42, q), lerp(1.30, 1.16, q), WZ);
    camera.position.set(cx + 0.012 * Math.sin(T * 0.25), cy + 0.009 * Math.sin(T * 0.33), cz);
    /* la colonne de texte occupe la gauche : la fenêtre doit vivre à droite */
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.24 * dist, 0.62));
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w2 = canvas.clientWidth, h2 = canvas.clientHeight; if (!w2 || !h2) return;
    renderer.setSize(w2, h2, false); camera.aspect = w2 / h2;
    camera.fov = w2 / h2 > 1.2 ? 40 : Math.min(72, 2 * Math.atan(Math.tan(52 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
