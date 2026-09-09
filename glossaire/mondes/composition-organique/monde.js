/* LE MONDE DE LA COMPOSITION ORGANIQUE — le miroir, et ce qu'il rend.

   Le mot est de Marx : la composition organique est la composition-valeur
   « en tant qu'elle dépend de sa composition technique, et que, par
   conséquent, les changements survenus dans celle-ci SE RÉFLÉCHISSENT
   dans celle-là ». La figure est donc un miroir, et tout le concept tient
   dans le fait que ce miroir n'est pas fidèle.

   À gauche, la chose : un outil — la part de l'ouvrier — et la masse des
   moyens de production, qui grossit. À droite, dans le cadre, son reflet :
   la même scène comptée en valeur. Quand la masse grandit, le reflet
   grandit avec elle, MOINS VITE, parce que la productivité qui multiplie
   les machines les rend aussi meilleur marché. Puis le prix du fer tombe
   sans qu'un seul outil ait bougé : le reflet se rétracte tout seul, et
   ce mouvement-là n'est PAS de la composition organique.

   Au dernier temps, la glace se ternit : ce qu'on mesure est le reflet
   entier, jamais la part du reflet qui suit l'objet.

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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.6, 4.0);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 51001; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
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
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.58),
    std({ map: boisTex, color: 0x9c8768, roughness: 0.86 }));
  comptoir.position.set(0, -0.06, -0.02); comptoir.receiveShadow = true; scene.add(comptoir);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.4), std({ color: 0x150f0a, roughness: 1 }));
  fond.position.set(0, 0.6, -0.44); scene.add(fond);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.24));
  var lampe = new THREE.PointLight(0xffd9a8, 1.30, 2.8, 2);
  lampe.position.set(-0.30, 0.72, 0.34); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.26);
  appoint.position.set(1.3, 0.7, 0.8); scene.add(appoint);

  /* ── LA CHOSE, et son REFLET ──────────────────────────────────────────
     Le même tas construit deux fois : à gauche il est compté en masse, à
     droite en valeur. Le reflet est bâti à l'identique, retourné et
     refroidi — c'est ce qui le fait lire comme un reflet et non comme un
     second tas. */
  /* Resserré, et VÉRIFIÉ PAR PROJECTION : à −0,235 / +0,215 le bord droit
     du cadre tombait à 102 % de la colonne collante, hors champ. */
  var XR = -0.20, XM = 0.185, ZB = -0.05;
  var ferMat = std({ color: 0x4e535c, metalness: 0.56, roughness: 0.44 });
  var ferRef = std({ color: 0x46505c, metalness: 0.30, roughness: 0.62, transparent: true, opacity: 0.86 });
  var boisMat = std({ color: 0x6b4a26, roughness: 0.92 });
  var boisRef = std({ color: 0x5d4626, roughness: 0.94, transparent: true, opacity: 0.86 });

  var PARTS = [];
  (function () { var s = 91; for (var i = 0; i < 14; i++) { s = (s * 16807) % 2147483647; var r = s / 2147483647;
    PARTS.push({ r: 0.030 + r * 0.026, h: 0.020 + ((s >> 7) % 100) / 100 * 0.020,
      a: r * 6.283, d: 0.030 + r * 0.085, y: 0 }); } })();

  function tas(mf, mb) {
    var g = new THREE.Group(); scene.add(g);
    /* l'outil de l'ouvrier : UN, et il ne bougera pas. */
    var o = new THREE.Group();
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.026, 0.058), mf);
    m.position.y = 0.075; m.castShadow = true; o.add(m);
    var mn = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.008, 0.13, 10), mb);
    mn.position.y = 0.02; mn.rotation.z = 0.18; mn.castShadow = true; o.add(mn);
    o.position.set(-0.088, 0, 0.055); g.add(o);
    /* la masse des moyens de production */
    var pieces = [];
    for (var i = 0; i < PARTS.length; i++) {
      var P = PARTS[i];
      var p = new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r, P.h, 14), mf);
      p.castShadow = true; p.receiveShadow = true;
      p.position.set(0.035 + Math.cos(P.a) * P.d, P.h / 2, Math.sin(P.a) * P.d * 0.6);
      p.rotation.y = P.a; g.add(p); pieces.push(p);
    }
    return { g: g, outil: o, pieces: pieces };
  }
  var reel = tas(ferMat, boisMat);
  var reflet = tas(ferRef, boisRef);
  reel.g.position.set(XR, 0, ZB);
  reflet.g.position.set(XM, 0, ZB - 0.055);
  reflet.g.scale.x = -1;                         /* retourné, comme un reflet */

  /* ── LE MIROIR ── */
  var cadre = new THREE.Group(); cadre.position.set(XM, 0, ZB + 0.075); scene.add(cadre);
  (function () {
    var lai = std({ color: 0x7d6228, metalness: 0.78, roughness: 0.42 });
    var W = 0.26, H = 0.235, e = 0.015;
    [[0, H / 2, W + e * 2, e], [0, -H / 2, W + e * 2, e]].forEach(function (b) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(b[2], b[3], 0.016), lai);
      m.position.set(b[0], b[1] + H / 2 + 0.012, 0); m.castShadow = true; cadre.add(m);
    });
    [[-W / 2 - e / 2, 0], [W / 2 + e / 2, 0]].forEach(function (b) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(e, H, 0.016), lai);
      m.position.set(b[0], H / 2 + 0.012, 0); m.castShadow = true; cadre.add(m);
    });
    var pied = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.014, 18), lai);
    pied.position.y = 0.007; pied.castShadow = true; cadre.add(pied);
    var tige = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 8), lai);
    tige.position.y = 0.012; cadre.add(tige);
  })();
  /* la glace : une lame sombre à peine transparente. Elle ne réfléchit
     rien — c'est le tas de droite qui joue le reflet — mais elle donne au
     regard la raison de le lire comme tel. */
  var glaceTex = tex(256, 256, function (c, w, h) {
    var gr = c.createLinearGradient(0, h, w, 0);
    gr.addColorStop(0, 'rgba(180,206,226,.02)'); gr.addColorStop(0.42, 'rgba(206,228,244,.30)');
    gr.addColorStop(0.52, 'rgba(160,190,214,.05)'); gr.addColorStop(1, 'rgba(180,206,226,.02)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  });
  /* UNE VITRE INVISIBLE N'EST PAS UNE VITRE : sans un reflet oblique, le
     cadre se lisait comme un cadre vide et le tas de droite comme un
     second tas. */
  var glaceMat = new THREE.MeshBasicMaterial({ map: glaceTex, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending });
  var glace = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.235), glaceMat);
  glace.position.set(0, 0.142, 0.004); cadre.add(glace);

  /* ── la chorégraphie ── */
  var st = { miroir: 0, tech: 0, prix: 0, seul: 0, terni: 0, nR: 1, nM: 1 };
  var G = 0, T = 0;
  function set(g) { G = g; }
  function compute() {
    st.miroir = ss(1.05, 1.75, G);
    st.tech = ss(2.15, 3.55, G);           /* la masse grandit             */
    st.prix = ss(3.95, 4.55, G);           /* le prix du fer tombe         */
    st.seul = ss(4.70, 5.30, G);           /* l'outil est resté seul       */
    st.terni = ss(5.55, 5.95, G);          /* la glace se ternit           */
    /* LE REFLET SUIT MOINS VITE : la productivité qui multiplie les moyens
       les rend aussi meilleur marché. Puis il se rétracte SANS que la
       chose bouge — et ce mouvement-là n'est pas de la composition
       organique. */
    st.nR = 1 + 13 * st.tech;
    st.nM = (1 + 8.2 * st.tech) * (1 - 0.34 * st.prix);
  }

  function poser(t, n, ech) {
    for (var i = 0; i < t.pieces.length; i++) {
      var v = cl(n - i);
      t.pieces[i].visible = v > 0.02;
      if (!v) continue;
      t.pieces[i].scale.set(ech * v, ech * v, ech * v);
      t.pieces[i].position.y = PARTS[i].h / 2 * ech * v;
    }
  }

  function frame(dt) {
    T += dt; compute();
    cadre.visible = reflet.g.visible = st.miroir > 0.02;
    cadre.scale.setScalar(0.25 + 0.75 * st.miroir);
    cadre.position.y = (1 - st.miroir) * -0.14;
    reflet.g.scale.set(-0.62, 0.62, 0.62);
    /* le reflet vit DANS la glace, non derrière le cadre : posé sur le
       comptoir, il débordait sous la traverse basse et se lisait comme un
       second tas. */
    reflet.g.position.y = (1 - st.miroir) * -0.14 + 0.076;

    poser(reel, st.nR, 1);
    poser(reflet, st.nM, 1);
    /* l'outil ne grandit pas et ne se multiplie pas : c'est là tout
       l'argument sur la demande de travail. */
    var seul = 1 + 0.22 * st.seul;
    reel.outil.scale.setScalar(seul);
    reflet.outil.scale.setScalar(seul);

    glaceMat.opacity = 0.55 + 0.85 * st.terni;
    ferRef.opacity = boisRef.opacity = 0.86 - 0.34 * st.terni;

    lampe.intensity = 1.30 * (1 + 0.02 * Math.sin(T * 5.3) + 0.015 * Math.sin(T * 2.6));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       La chose de −0,40 à −0,06, le cadre de 0,04 à 0,39 : VÉRIFIÉ PAR
       PROJECTION à la position portrait, qui est la plus étroite. */
    var dz = lerp(1.26, 1.18, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(-0.005, lerp(0.10, 0.135, ss(1.5, 4.5, G)), ZB + 0.04);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.145 + 0.006 * Math.sin(T * 0.27), camA.z + dz);
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
