/* LE MONDE DE LA FORME-SALAIRE — ce qui est payé, ce qui paraît payé.

   Le concept ne dit pas qu'on vole l'ouvrier sur le prix : il dit qu'une
   COUPURE disparaît. La journée se divise en un temps qui reproduit la
   valeur de la force et un temps qui ne revient pas au travailleur ; le
   salaire arrive d'un seul bloc, et rien dans le paiement n'indique où
   passait la limite.

   La scène est donc celle d'une limite qu'on recouvre. Douze jetons sur un
   comptoir — les douze heures —, une marque à la craie après le sixième,
   les pièces comptées à côté ; puis une BANDE DE PAPIER posée en travers,
   qui couvre les jetons et la marque, et sur laquelle il n'y a plus qu'une
   ligne : douze heures, six francs. La rangée se lit alors d'une seule
   venue.

   Au dernier temps une lumière prend SOUS le comptoir, et la division
   reparaît par transparence : « il faut distinguer entre les apparences des
   choses et leur réalité ». Le passage au travers n'est pas un effet de
   rendu mais un DESSIN sur la texture du papier — un plan opaque ne laisse
   rien voir, et l'on veut ici que la marque se lise exactement.

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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 3.0, 8.4);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 53; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le comptoir ── */
  var boisTex = tex(1024, 512, function (g, w, h) {
    g.fillStyle = '#3e2a17'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 240; i++) {
      g.strokeStyle = 'rgba(18,10,4,' + (0.06 + rnd() * 0.16) + ')'; g.lineWidth = 0.7 + rnd() * 2.2;
      g.beginPath(); var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 56) g.lineTo(x, y + (rnd() - 0.5) * 6);
      g.stroke();
    }
  });
  boisTex.wrapS = boisTex.wrapT = THREE.RepeatWrapping;
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 1.15), std({ map: boisTex, roughness: 0.66, color: 0xb79b78 }));
  comptoir.position.set(0, -0.07, 0); comptoir.castShadow = comptoir.receiveShadow = true; scene.add(comptoir);
  var chant = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.055), std({ color: 0x2c1c0e, roughness: 0.7 }));
  chant.position.set(0, 0.0, 0.575); scene.add(chant);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), std({ color: 0x1d1409, roughness: 0.98 }));
  fond.position.set(0, 1.5, -2.1); fond.receiveShadow = true; scene.add(fond);

  /* ── les douze heures ── */
  var NJ = 12, PASJ = 0.108, XJ0 = -0.62, ZJ = -0.06;
  var laiton = std({ color: 0xb98f3e, metalness: 0.82, roughness: 0.31 });
  var jetons = [];
  for (var i = 0; i < NJ; i++) {
    var j = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.012, 22), laiton);
    j.position.set(XJ0 + i * PASJ, 0.008, ZJ); j.castShadow = j.receiveShadow = true; scene.add(j); jetons.push(j);
  }
  /* la marque : après le sixième, la limite */
  var XM = XJ0 + 5.5 * PASJ;
  var marque = new THREE.Mesh(new THREE.PlaneGeometry(0.016, 0.34),
    new THREE.MeshBasicMaterial({ color: 0xe7503c, transparent: true, opacity: 0 }));
  marque.rotation.x = -Math.PI / 2; marque.position.set(XM, 0.004, ZJ); marque.renderOrder = 2; scene.add(marque);

  /* ── les pièces : six francs, comptés à côté ── */
  var pieces = [];
  [[-0.60, 0.30], [-0.49, 0.26], [-0.55, 0.37], [-0.44, 0.35], [-0.38, 0.27], [-0.50, 0.45]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.012, 24), std({ color: 0xdcd6c6, metalness: 0.8, roughness: 0.27 }));
    m.position.set(p[0], 0.008, p[1]); m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m); pieces.push(m);
  });

  /* ── LA BANDE DE PAPIER, et ce qui se lit dessus ── */
  var PW = 1024, PH = 268;
  var papCv = document.createElement('canvas'); papCv.width = PW; papCv.height = PH;
  var pg = papCv.getContext('2d');
  var papTex = new THREE.CanvasTexture(papCv);
  if (THREE.sRGBEncoding) papTex.encoding = THREE.sRGBEncoding;
  var lastPap = '';
  function drawPapier(ecrit, jour) {
    var key = ecrit.toFixed(2) + '|' + jour.toFixed(2);
    if (key === lastPap) return; lastPap = key;
    pg.fillStyle = '#ded2b6'; pg.fillRect(0, 0, PW, PH);
    for (var i = 0; i < 900; i++) { pg.fillStyle = 'rgba(120,100,72,' + (rnd() * 0.05) + ')'; pg.fillRect(rnd() * PW, rnd() * PH, 2, 2); }
    /* ce qui transparaît quand la lumière prend dessous : les douze jetons,
       et la marque — la coupure est toujours là, sous l'apparence */
    /* L'ÉCRITURE EN HAUT, LA TRANSPARENCE EN BAS : posées au même endroit
       elles se disputaient la bande et l'on ne lisait ni l'une ni l'autre.
       Et l'apparence PÂLIT quand la lumière prend dessous — c'est le geste
       de la page : ce qui se dit recule quand ce qui est reparaît. */
    if (jour > 0.01) {
      for (i = 0; i < NJ; i++) {
        pg.fillStyle = 'rgba(86,64,28,' + (0.55 * jour) + ')';
        pg.beginPath(); pg.arc(64 + i * 79, PH * 0.74, 27, 0, 6.3); pg.fill();
      }
      pg.fillStyle = 'rgba(206,66,44,' + (0.9 * jour) + ')';
      pg.fillRect(64 + 5.5 * 79 - 5, PH * 0.46, 10, PH * 0.52);
    }
    if (ecrit > 0.01) {
      pg.globalAlpha = ecrit * (1 - 0.55 * jour);
      pg.fillStyle = '#2a1a0c'; pg.textAlign = 'center';
      pg.font = 'italic 54px Georgia, serif';
      pg.fillText('douze heures', PW * 0.29, PH * 0.36);
      pg.font = '44px Georgia, serif';
      pg.fillText('—', PW * 0.50, PH * 0.34);
      pg.font = 'italic 54px Georgia, serif';
      pg.fillText('six francs', PW * 0.71, PH * 0.36);
      pg.globalAlpha = 1;
    }
    papTex.needsUpdate = true;
  }
  drawPapier(0, 0);
  var papier = new THREE.Mesh(new THREE.PlaneGeometry(1.60, 0.42), std({ map: papTex, roughness: 0.92 }));
  papier.rotation.x = -Math.PI / 2; papier.position.set(XJ0 + 5.5 * PASJ, 0.026, ZJ);
  papier.castShadow = true; papier.visible = false; scene.add(papier);

  /* ── la lumière : la lampe au-dessus, puis celle de dessous ── */
  scene.add(new THREE.AmbientLight(0x3a2c1e, 0.34));
  var lampe = new THREE.PointLight(0xffb765, 3.2, 6, 1.8); lampe.position.set(-0.55, 1.18, 0.62);
  lampe.castShadow = true; lampe.shadow.bias = -0.0013; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var abat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 20, 1, true), std({ color: 0x2b1d13, roughness: 0.82, side: THREE.DoubleSide }));
  abat.position.set(-0.55, 1.29, 0.62); scene.add(abat);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);
  /* celle de dessous : elle ne sert qu'à border le comptoir d'un liseré */
  var dessous = new THREE.PointLight(0xffcf8a, 0, 2.2, 2.0); dessous.position.set(XM, -0.42, ZJ + 0.1); scene.add(dessous);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { jetons: 0, marque: 0, pieces: 0, bande: 0, ecrit: 0, jour: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.jetons = ss(0.1, 1.5, G);
    st.marque = ss(1.5, 2.2, G);
    st.pieces = ss(2.3, 3.0, G);
    st.bande  = ss(3.2, 3.95, G);
    st.ecrit  = ss(3.9, 4.6, G);
    st.jour   = ss(4.95, 5.75, G);
    st.recul  = ss(4.7, 5.6, G);
  }

  function frame(dt) {
    T += dt; compute();
    jetons.forEach(function (j, k) {
      var f = cl(st.jetons * NJ - k);
      j.visible = f > 0.03; j.scale.setScalar(0.3 + 0.7 * f);
      j.position.y = 0.008 + 0.05 * (1 - f);
    });
    marque.material.opacity = 0.92 * st.marque * (1 - 0.55 * st.bande);
    pieces.forEach(function (m, k) { m.visible = st.pieces > (k + 0.3) / 6.4; });

    /* la bande se pose, et couvre ; puis ce qui s'y écrit ; puis ce qui
       reparaît par transparence */
    papier.visible = st.bande > 0.02;
    papier.position.y = 0.026 + 0.30 * (1 - st.bande);
    papier.rotation.z = 0.16 * (1 - st.bande);
    papier.scale.set(1, 1, 0.35 + 0.65 * st.bande);
    drawPapier(st.ecrit, st.jour);

    lampe.intensity = 3.2 * (1 - 0.42 * st.jour) * (1 + 0.04 * Math.sin(T * 8.1));
    dessous.intensity = 2.6 * st.jour;
    ampoule.material.color.setRGB(1, lerp(0.84, 0.66, st.jour), lerp(0.60, 0.42, st.jour));

    /* la caméra : serrée sur la rangée, puis elle prend le comptoir entier.
       La colonne de texte occupe 43 % de la largeur ; l'ensemble fait une
       unité et demie, et à 38° la largeur vue vaut 1,07 fois la distance —
       il en faut donc près de deux et demie, et le décalage vaut 0,55. */
    var q = ss(0, 1, Math.min(1, G / 2.0));
    var cx = lerp(-0.10, -0.16, q), cy = lerp(0.50, 0.86, q), cz = lerp(1.00, 1.98, q);
    cz = lerp(cz, 2.24, st.recul); cy = lerp(cy, 1.02, st.recul);
    var camA = V3(lerp(XJ0 + 3 * PASJ, -0.02, q), 0.03, lerp(ZJ, 0.06, q));
    camera.position.set(cx + 0.012 * Math.sin(T * 0.27), cy + 0.008 * Math.sin(T * 0.35), cz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.26 * dist, 0.55));
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
