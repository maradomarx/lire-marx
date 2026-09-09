/* LE MONDE DE LA PLUS-VALUE ABSOLUE — la pendule et le bocal.

   La journée ne s'allonge pas seulement par des heures franches : elle
   s'allonge par grignotage, sur les bords, là où personne ne compte. Les
   inspecteurs de fabrique avaient forgé leur mot pour cela — « petty
   pilferings of minutes », petits filoutages de minutes — et Marx en tire
   la formule qui donne son nerf à toute la section : « les atomes du temps
   sont les éléments du gain ».

   D'où la scène : le cadran de l'atelier, et le bocal en dessous. Chaque
   éclat pris au début, à la fin, sur les deux repas, tombe dans le bocal —
   et le bocal se remplit d'heures qui n'ont jamais été comptées. Au
   dernier temps une garde de laiton se referme sur le cadran : c'est la
   loi, et elle doit descendre à ce degré de détail parce qu'elle s'oppose
   à une pratique qui procède par miettes.

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
  var rnd = (function () { var s = 33107; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le mur et l'étagère ── */
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#5c5142'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 11000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '34,26,16' : '168,154,128') + ',' + (rnd() * 0.09) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.9), std({ map: platre, color: 0x8d7f68, roughness: 0.97 }));
  mur.position.set(0, 0.62, -0.30); mur.receiveShadow = true; scene.add(mur);
  var etagere = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.30),
    std({ color: 0x4d3a25, roughness: 0.9 }));
  etagere.position.set(0, -0.025, -0.13); etagere.receiveShadow = true; etagere.castShadow = true; scene.add(etagere);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.20));
  var lampe = new THREE.PointLight(0xffd9a8, 1.15, 3.0, 2);
  lampe.position.set(-0.34, 0.86, 0.42); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.22);
  appoint.position.set(1.2, 0.8, 0.9); scene.add(appoint);

  /* ── LE CADRAN ────────────────────────────────────────────────────────
     La journée légale est un arc ; les deux repas y sont deux entailles
     claires. Ce qui est PRIS s'y inscrit en rouge, aux quatre bords où
     personne ne compte : le début, la fin, et les deux côtés de chaque
     repas. Le cadran se redessine seulement quand le vol change. */
  var CX = 256, CY = 256, R0 = 214, R1 = 168;
  var cadranCv = document.createElement('canvas'); cadranCv.width = cadranCv.height = 512;
  var cg = cadranCv.getContext('2d');
  var cadranTex = new THREE.CanvasTexture(cadranCv);
  if (THREE.sRGBEncoding) cadranTex.encoding = THREE.sRGBEncoding;
  var dessine = -1;
  /* la journée légale : de six heures à six heures, deux repas */
  var DEB = -Math.PI / 2 + 0.30, FIN = -Math.PI / 2 + 2 * Math.PI - 0.30;
  var REPAS = [[DEB + (FIN - DEB) * 0.30, DEB + (FIN - DEB) * 0.365],
               [DEB + (FIN - DEB) * 0.62, DEB + (FIN - DEB) * 0.665]];
  function arc(a, b, r0, r1, style) {
    cg.beginPath(); cg.arc(CX, CY, r0, a, b); cg.arc(CX, CY, r1, b, a, true);
    cg.closePath(); cg.fillStyle = style; cg.fill();
  }
  function peindre(vol) {
    cg.fillStyle = '#e6dcc0'; cg.beginPath(); cg.arc(CX, CY, 240, 0, 6.2832); cg.fill();
    for (var i = 0; i < 2600; i++) { cg.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,102,70' : '255,252,240') + ',' + (rnd() * 0.035) + ')'; cg.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
    cg.strokeStyle = 'rgba(46,32,16,.55)'; cg.lineWidth = 5;
    cg.beginPath(); cg.arc(CX, CY, 240, 0, 6.2832); cg.stroke();
    /* les heures */
    for (i = 0; i < 12; i++) {
      var a = -Math.PI / 2 + i / 12 * 6.2832;
      cg.strokeStyle = 'rgba(46,32,16,.45)'; cg.lineWidth = i % 3 === 0 ? 7 : 3;
      cg.beginPath();
      cg.moveTo(CX + Math.cos(a) * 226, CY + Math.sin(a) * 226);
      cg.lineTo(CX + Math.cos(a) * (i % 3 === 0 ? 198 : 208), CY + Math.sin(a) * (i % 3 === 0 ? 198 : 208));
      cg.stroke();
    }
    /* LA JOURNÉE DOIT SE VOIR POUR QU'ON VOIE CE QU'ON LUI PREND : à
       trente pour cent d'opacité, l'arc disparaissait et les marques
       rouges se lisaient comme des repères d'heure. */
    arc(DEB, FIN, R0, R1, 'rgba(52,38,20,.72)');                    /* la journée   */
    REPAS.forEach(function (r) { arc(r[0], r[1], R0 + 4, R1 - 4, '#e6dcc0'); }); /* les repas */
    /* CE QUI EST PRIS : quatre bords, et les deux côtés de chaque repas */
    var m = 0.175 * vol;
    var pris = [[DEB - m, DEB], [FIN, FIN + m],
                [REPAS[0][0], REPAS[0][0] + m * 0.6], [REPAS[0][1] - m * 0.6, REPAS[0][1]],
                [REPAS[1][0], REPAS[1][0] + m * 0.6], [REPAS[1][1] - m * 0.6, REPAS[1][1]]];
    if (vol > 0.01) pris.forEach(function (p) { arc(p[0], p[1], R0 + 6, R1 - 6, 'rgba(192,52,32,.95)'); });
    cadranTex.needsUpdate = true;
  }
  peindre(0);
  var pendule = new THREE.Group(); pendule.position.set(-0.02, 0.415, -0.27); scene.add(pendule);
  (function () {
    var boitier = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.045, 40),
      std({ color: 0x4a3320, roughness: 0.88 }));
    boitier.rotation.x = Math.PI / 2; boitier.castShadow = true; pendule.add(boitier);
    var face = new THREE.Mesh(new THREE.CircleGeometry(0.168, 44),
      std({ map: cadranTex, roughness: 0.94 }));
    face.position.z = 0.024; pendule.add(face);
    var cercle = new THREE.Mesh(new THREE.TorusGeometry(0.176, 0.010, 8, 44),
      std({ color: 0x8a6d2c, metalness: 0.82, roughness: 0.38 }));
    cercle.position.z = 0.020; pendule.add(cercle);
  })();
  /* l'aiguille */
  var aiguille = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.135, 0.005),
    std({ color: 0x2b2016, roughness: 0.7 }));
  aiguille.geometry.translate(0, 0.062, 0);
  aiguille.position.set(0, 0, 0.030); pendule.add(aiguille);

  /* ── LA GARDE : la loi, et elle doit descendre au détail ── */
  var garde = new THREE.Mesh(new THREE.TorusGeometry(0.196, 0.013, 8, 44, Math.PI * 1.35),
    std({ color: 0xc09a3c, metalness: 0.85, roughness: 0.30 }));
  garde.position.set(0, 0, 0.034); garde.rotation.z = 0.9; pendule.add(garde);

  /* ── LE BOCAL, et ce qui y tombe ─────────────────────────────────── */
  var bocal = new THREE.Group(); bocal.position.set(0.235, 0.001, -0.13); scene.add(bocal);
  var verreMat = new THREE.MeshStandardMaterial({ color: 0x9fb6c2, metalness: 0.12, roughness: 0.12,
    transparent: true, opacity: 0.26 });
  (function () {
    var v = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.058, 0.19, 26, 1, true), verreMat);
    v.position.y = 0.095; bocal.add(v);
    var f = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.008, 26), verreMat);
    f.position.y = 0.004; bocal.add(f);
    var col = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, 8, 26), verreMat);
    col.position.y = 0.19; bocal.add(col);
  })();
  var minutesMat = std({ color: 0xb23a26, roughness: 0.62, emissive: 0x2a0a04 });
  var tas = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 1, 26), minutesMat);
  bocal.add(tas);

  /* les éclats qui tombent : quatre, et ils partent des quatre bords */
  var eclats = [];
  for (var i = 0; i < 4; i++) {
    var e = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.010, 0.006),
      new THREE.MeshBasicMaterial({ color: 0xd8543a, transparent: true, opacity: 0 }));
    scene.add(e); eclats.push(e);
  }

  /* ── la chorégraphie ── */
  var st = { jour: 0, vol: 0, loi: 0 };
  var G = 0, T = 0;
  function set(g) { G = g; }
  function compute() {
    st.jour = ss(0.9, 1.6, G);                       /* le cadran s'allume   */
    /* LES ATOMES DU TEMPS : le vol croît par miettes, et il ne s'arrête que
       lorsque la garde se referme. */
    st.vol = ss(2.35, 4.85, G) * (1 - 0.82 * ss(5.35, 5.80, G));
    st.loi = ss(5.20, 5.70, G);
  }

  function frame(dt) {
    T += dt; compute();
    var v = Math.round(st.vol * 60) / 60;
    if (v !== dessine) { dessine = v; peindre(v); }

    pendule.scale.setScalar(0.35 + 0.65 * st.jour);
    aiguille.rotation.z = -(DEB + (FIN - DEB) * ((T * 0.16) % 1)) - Math.PI / 2;

    garde.visible = st.loi > 0.02;
    garde.scale.setScalar(0.6 + 0.4 * st.loi);
    garde.material.opacity = 1;
    garde.rotation.z = 0.9 - 0.5 * (1 - st.loi);

    var n = st.vol;
    tas.visible = n > 0.01;
    tas.scale.y = Math.max(0.001, 0.155 * n);
    tas.position.y = 0.008 + 0.155 * n / 2;
    minutesMat.emissiveIntensity = 0.6 + 0.4 * Math.sin(T * 1.7);

    /* les éclats : ils quittent le cadran et tombent dans le bocal. Le
       mouvement est temporel — c'est une pluie, pas une position — mais son
       amplitude est fonction de g, donc il s'éteint en remontant. */
    var chute = st.vol * (1 - st.loi);
    for (var i = 0; i < 4; i++) {
      var u = ((T * 0.42 + i * 0.25) % 1);
      var vis = chute > 0.04 ? Math.sin(u * Math.PI) : 0;
      eclats[i].material.opacity = vis * 0.9;
      eclats[i].visible = vis > 0.02;
      if (!eclats[i].visible) continue;
      var a = [DEB, FIN, REPAS[0][1], REPAS[1][0]][i];
      var sx = pendule.position.x + Math.cos(a) * 0.155 * pendule.scale.x;
      var sy = pendule.position.y - Math.sin(a) * 0.155 * pendule.scale.x;
      var tx = bocal.position.x, ty = 0.02 + 0.155 * st.vol;
      eclats[i].position.set(lerp(sx, tx, u), lerp(sy, ty, u) + Math.sin(u * Math.PI) * 0.05, -0.09);
      eclats[i].rotation.z = u * 5.2 + i;
    }

    lampe.intensity = 1.15 * (1 + 0.02 * Math.sin(T * 5.1) + 0.015 * Math.sin(T * 2.5));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Composition VERTICALE — le cadran en haut, le bocal en bas —, ce qui
       convient à la colonne collante ; l'étendue horizontale reste faible
       (−0,21 à +0,30), VÉRIFIÉE PAR PROJECTION. */
    var dz = lerp(1.28, 1.20, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(0.03, lerp(0.20, 0.24, ss(1.5, 4.5, G)), -0.16);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.055 + 0.006 * Math.sin(T * 0.27), camA.z + dz);
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
