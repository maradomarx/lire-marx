/* LE MONDE DU TAUX DE LA PLUS-VALUE — la même masse, deux pesées.

   Un excédent seul ne dit rien : tout est dans ce à quoi on le rapporte.
   Quatre-vingt-dix livres sur quatre-vingt-dix font cent pour cent ;
   quatre-vingt-dix sur cinq cents en font dix-huit. Le même fait, deux
   nombres, et deux questions différentes — quelle part du travail vivant
   n'a pas été payée, et quel rendement l'avance totale a donné.

   D'où la scène : UNE SEULE MASSE, et deux balances. À gauche on la pèse
   contre le seul capital variable, et le fléau bascule tout entier ; à
   droite contre l'avance entière, et il bouge à peine. Rien n'a changé de
   ce qu'on pèse. Ce qui change est le contrepoids.

   Au dernier temps, la dernière heure de Senior : un poids étranger — le
   capital constant — est glissé du côté du contrepoids de gauche, et la
   balance ment. C'est exactement l'erreur du professeur, et elle a servi
   des années contre la limitation de la journée.

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
  var rnd = (function () { var s = 48271; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
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

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.24));
  var lampe = new THREE.PointLight(0xffd9a8, 1.28, 2.9, 2);
  lampe.position.set(0, 0.84, 0.42); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.24);
  appoint.position.set(1.3, 0.7, 0.8); scene.add(appoint);

  /* ── DEUX BALANCES, ET UNE SEULE MASSE ────────────────────────────────
     La masse pesée — l'excédent — est la même des deux côtés. Seul le
     contrepoids change, et c'est de là que viennent deux nombres. */
  var laiMat = std({ color: 0xc09a3c, metalness: 0.84, roughness: 0.30 });
  var ferMat = std({ color: 0x4c525a, metalness: 0.55, roughness: 0.46 });
  var XB = [-0.185, 0.185], BRAS = 0.105, YP = 0.245;
  var bals = [];
  for (var i = 0; i < 2; i++) {
    var g = new THREE.Group(); g.position.set(XB[i], 0, -0.03); scene.add(g);
    var pied = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.014, 20), laiMat);
    pied.position.y = 0.007; pied.castShadow = true; g.add(pied);
    var col = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, YP, 12), laiMat);
    col.position.y = YP / 2; col.castShadow = true; g.add(col);
    var fl = new THREE.Group(); fl.position.y = YP; g.add(fl);
    var barre = new THREE.Mesh(new THREE.BoxGeometry(BRAS * 2 + 0.02, 0.010, 0.012), laiMat);
    barre.castShadow = true; fl.add(barre);
    /* LA SUSPENSION EST AU BOUT DU BRAS, non au pivot. Placée à l'origine
       du fléau, sa contre-rotation annulait le mouvement entier : les
       plateaux restaient à la même hauteur, et une balance dont les
       plateaux ne bougent pas ne pèse rien. */
    var plats = [], susp = [];
    for (var k = 0; k < 2; k++) {
      var sg = new THREE.Group();
      sg.position.set((k ? 1 : -1) * BRAS, 0, 0);
      fl.add(sg); susp.push(sg);
      var fil = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.070, 6), ferMat);
      fil.position.set(0, -0.035, 0); sg.add(fil);
      var pl = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.044, 0.008, 22), laiMat);
      pl.position.set(0, -0.070, 0); pl.castShadow = true; pl.receiveShadow = true; sg.add(pl);
      plats.push(pl);
    }
    bals.push({ g: g, fl: fl, plats: plats, susp: susp });
  }

  /* la MASSE : le même excédent, posé sur le plateau gauche des deux */
  var masseMat = std({ color: 0xd6a63c, metalness: 0.72, roughness: 0.28 });
  var masses = [];
  /* les CONTREPOIDS : v seul à gauche, c+v à droite */
  var poidsMat = std({ color: 0x3f4650, metalness: 0.45, roughness: 0.58 });
  var poids = [];
  for (i = 0; i < 2; i++) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.030, 20), masseMat);
    m.castShadow = true; scene.add(m); masses.push(m);
    var p = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.034, 1, 20), poidsMat);
    p.geometry.translate(0, 0.5, 0); p.castShadow = true; scene.add(p); poids.push(p);
  }
  /* le poids ÉTRANGER de Senior : le constant glissé du mauvais côté */
  var intrus = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.034, 0.075, 20),
    std({ color: 0x8e2f22, metalness: 0.35, roughness: 0.66, transparent: true, opacity: 0 }));
  intrus.castShadow = true; scene.add(intrus);

  /* ── la chorégraphie ── */
  var st = { pose: 0, masse: 0, gauche: 0, droite: 0, senior: 0, ang: [0, 0] };
  var G = 0, T = 0;
  function set(g) { G = g; }
  function compute() {
    st.pose = ss(0.7, 1.5, G);
    st.masse = ss(1.85, 2.45, G);       /* la même masse sur les deux    */
    st.gauche = ss(2.75, 3.45, G);      /* contrepoids v                 */
    st.droite = ss(3.95, 4.65, G);      /* contrepoids c + v             */
    st.senior = ss(5.15, 5.85, G);      /* le poids étranger             */
    /* le fléau : la masse d'un côté, le contrepoids de l'autre. À gauche
       ils s'égalent (cent pour cent) ; à droite le contrepoids l'emporte
       largement. */
    var mg = st.masse, md = st.masse;
    var cg = st.gauche * 1.0 + st.senior * 3.6;
    var cd = st.droite * 4.6;
    st.ang[0] = Math.atan((cg - mg) * 0.30) * 0.9;
    st.ang[1] = Math.atan((cd - md) * 0.30) * 0.9;
  }

  function frame(dt) {
    T += dt; compute();
    var i;
    for (i = 0; i < 2; i++) {
      var v = ss(i * 0.22, 0.6 + i * 0.22, st.pose);
      bals[i].g.visible = v > 0.02;
      bals[i].g.scale.setScalar(0.3 + 0.7 * v);
      bals[i].fl.rotation.z = -st.ang[i];
      /* les plateaux restent horizontaux : c'est une balance, pas une
         bascule de foire. */
      bals[i].susp[0].rotation.z = st.ang[i];
      bals[i].susp[1].rotation.z = st.ang[i];
      var e = bals[i].g.scale.x;
      /* la masse, posée sur le plateau gauche des deux balances */
      var pm = bals[i].plats[0].getWorldPosition(new THREE.Vector3());
      masses[i].visible = st.masse > 0.03 && bals[i].g.visible;
      masses[i].position.set(pm.x, pm.y + 0.019 * e, pm.z);
      masses[i].scale.setScalar(e * (0.3 + 0.7 * st.masse));
      /* le contrepoids, sur le plateau droit */
      var pp = bals[i].plats[1].getWorldPosition(new THREE.Vector3());
      var hp = (i === 0 ? st.gauche * 0.036 : st.droite * 0.150);
      poids[i].visible = hp > 0.002 && bals[i].g.visible;
      poids[i].position.set(pp.x, pp.y + 0.004 * e, pp.z);
      poids[i].scale.set(e, hp * e, e);
    }
    /* LE POIDS ÉTRANGER : Senior met le constant du côté du contrepoids de
       gauche, et la balance ment. */
    var pi = bals[0].plats[1].getWorldPosition(new THREE.Vector3());
    intrus.visible = st.senior > 0.03;
    intrus.material.opacity = st.senior;
    intrus.position.set(pi.x, pi.y + (0.004 + st.gauche * 0.036) * bals[0].g.scale.x + 0.038 * st.senior, pi.z);
    intrus.scale.setScalar(bals[0].g.scale.x * (0.4 + 0.6 * st.senior));

    lampe.intensity = 1.28 * (1 + 0.02 * Math.sin(T * 5.2) + 0.015 * Math.sin(T * 2.5));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Les deux balances s'étendent de −0,34 à +0,34 : VÉRIFIÉ PAR
       PROJECTION à la position portrait, la plus étroite. */
    var dz = lerp(1.24, 1.16, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(0, lerp(0.17, 0.20, ss(1.5, 4.5, G)), -0.02);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.10 + 0.006 * Math.sin(T * 0.27), camA.z + dz);
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
