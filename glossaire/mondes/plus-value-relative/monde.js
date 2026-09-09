/* LE MONDE DE LA PLUS-VALUE RELATIVE — la barre du prix commun.

   Personne ne cherche à produire de la plus-value relative : on cherche un
   avantage sur ses concurrents. Qu'un fabricant double sa productivité, et
   la valeur individuelle de sa pièce tombe au-dessous de la valeur
   sociale ; comme le marché ne connaît que la seconde, il empoche l'écart.
   Puis les autres suivent — « loi coercitive de la concurrence » — et
   l'écart s'évanouit. Ce qui reste n'est plus à personne : le prix a
   baissé pour tous.

   D'où la scène : quatre établis, quatre jauges, et une barre de laiton
   posée en travers, qui est la valeur sociale. Une jauge descend : l'écart
   qui s'ouvre sous la barre est le survalu extra, et il brille. Les trois
   autres descendent à leur tour, la barre suit, l'écart se referme. Alors
   seulement une SECONDE barre, plus basse — la valeur de la force de
   travail — descend elle aussi, mais à une condition : que ce qu'on
   produit là entre dans l'entretien de l'ouvrier.

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
  var rnd = (function () { var s = 71003; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
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
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.52),
    std({ map: boisTex, color: 0x9c8768, roughness: 0.86 }));
  comptoir.position.set(0, -0.06, -0.02); comptoir.receiveShadow = true; scene.add(comptoir);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), std({ color: 0x150f0a, roughness: 1 }));
  fond.position.set(0, 0.6, -0.42); scene.add(fond);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.24));
  var lampe = new THREE.PointLight(0xffd9a8, 1.25, 2.9, 2);
  lampe.position.set(-0.26, 0.82, 0.38); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.26);
  appoint.position.set(1.3, 0.7, 0.8); scene.add(appoint);

  /* ── QUATRE PRODUCTEURS, QUATRE JAUGES ────────────────────────────────
     Chaque jauge est la valeur INDIVIDUELLE d'un atelier. La barre posée
     en travers est la valeur SOCIALE : elle ne peut pas descendre plus bas
     que le plus haut de ceux qui la portent. */
  var XJ = [-0.225, -0.075, 0.075, 0.225], H0 = 0.30;
  var jauges = [], socles = [];
  var ferMat = std({ color: 0x555a62, metalness: 0.5, roughness: 0.42 });
  var laiMat = std({ color: 0xc09a3c, metalness: 0.84, roughness: 0.30 });
  for (var i = 0; i < 4; i++) {
    var s0 = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.036, 0.105),
      std({ map: boisTex, color: 0x8a7454, roughness: 0.9 }));
    s0.position.set(XJ[i], 0.018, 0); s0.castShadow = true; s0.receiveShadow = true; scene.add(s0);
    socles.push(s0);
    var j = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 1, 12), ferMat);
    j.geometry.translate(0, 0.5, 0);
    j.position.set(XJ[i], 0.036, 0); j.castShadow = true; scene.add(j);
    var t0 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.014, 16), laiMat);
    t0.castShadow = true; scene.add(t0);
    jauges.push({ tige: j, tete: t0, h: H0 });
  }
  var barre = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.020, 0.042), laiMat);
  barre.castShadow = true; scene.add(barre);

  /* LE SURVALU EXTRA : l'écart entre la tête d'une jauge et la barre. Il
     brille, et il ne dure pas. */
  /* L'écart est une LUEUR, pas une brique : plein et opaque, il se lisait
     comme un cinquième objet posé là. */
  var extraMat = new THREE.MeshBasicMaterial({ color: 0xffb42e, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false });
  var extra = new THREE.Mesh(new THREE.BoxGeometry(0.046, 1, 0.046), extraMat);
  scene.add(extra);

  /* LA SECONDE BARRE : la valeur de la force de travail. Elle ne descend
     qu'à une condition — que ce qu'on produit là entre dans l'entretien de
     l'ouvrier. */
  var barreFT = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.016, 0.034),
    std({ color: 0xb0503a, metalness: 0.45, roughness: 0.46 }));
  barreFT.position.z = 0.105; barreFT.castShadow = true; scene.add(barreFT);

  /* ── la chorégraphie ── */
  var st = { pose: 0, un: 0, autres: 0, ft: 0, h: [], barre: H0, extra: 0 };
  var G = 0, T = 0;
  function set(g) { G = g; }
  function compute() {
    st.pose = ss(0.85, 1.60, G);
    st.un = ss(2.25, 2.95, G);                     /* le premier innove    */
    st.autres = ss(3.85, 4.85, G);                 /* les autres suivent   */
    st.ft = ss(5.10, 5.75, G);                     /* la force de travail  */
    /* elle ne PARAÎT qu'une fois l'abaissement général : plus tôt, elle
       barrait la scène sans rien dire encore. */
    st.ftvis = ss(4.55, 5.05, G);
    st.h = [];
    for (var i = 0; i < 4; i++) {
      var d = i === 0 ? st.un : ss(i * 0.20, 0.45 + i * 0.20, st.autres);
      st.h.push(H0 * (1 - 0.42 * d));
    }
    /* LA BARRE NE PEUT PAS DESCENDRE PLUS BAS QUE LE PLUS HAUT : c'est ce
       qui fait que le premier garde son écart tant que les autres n'ont
       pas suivi. */
    st.barre = Math.max(st.h[0], st.h[1], st.h[2], st.h[3]);
    st.extra = st.barre - st.h[0];
  }

  function frame(dt) {
    T += dt; compute();
    var i;
    for (i = 0; i < 4; i++) {
      var v = ss(i * 0.14, 0.5 + i * 0.14, st.pose);
      socles[i].visible = jauges[i].tige.visible = jauges[i].tete.visible = v > 0.02;
      socles[i].scale.setScalar(0.3 + 0.7 * v);
      var h = st.h[i] * v;
      jauges[i].tige.scale.y = Math.max(0.001, h);
      jauges[i].tete.position.set(XJ[i], 0.036 + h, 0);
    }
    barre.visible = st.pose > 0.55;
    barre.position.set(0, 0.036 + st.barre + 0.017, 0);

    extra.visible = st.extra > 0.004 && st.pose > 0.6;
    extraMat.opacity = 0.42 + 0.40 * cl(st.extra / (H0 * 0.42));
    extra.scale.y = Math.max(0.001, st.extra);
    extra.position.set(XJ[0], 0.036 + st.h[0] + st.extra / 2, 0);

    /* la seconde barre suit la première, mais SEULEMENT une fois que
       l'abaissement est général — et seulement parce que ce qu'on produit
       ici entre dans le panier de l'ouvrier. */
    barreFT.visible = st.ftvis > 0.03;
    barreFT.scale.set(0.3 + 0.7 * st.ftvis, 1, 1);
    barreFT.position.y = 0.036 + lerp(H0 * 0.50, H0 * 0.50 - 0.062, st.ft);
    barreFT.material.emissive = barreFT.material.emissive || new THREE.Color(0, 0, 0);
    barreFT.material.emissive.setRGB(0.10 * st.ft, 0.03 * st.ft, 0.01 * st.ft);

    lampe.intensity = 1.25 * (1 + 0.02 * Math.sin(T * 5.2) + 0.015 * Math.sin(T * 2.5));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Quatre jauges de −0,30 à +0,30 avec la barre : VÉRIFIÉ PAR
       PROJECTION à la position portrait, la plus étroite. */
    /* UNE SCÈNE VUE À HAUTEUR D'ŒIL EST PLATE : les socles se perdaient
       dans l'ombre et rien ne disait la profondeur. La caméra domine
       légèrement. */
    var dz = lerp(1.16, 1.08, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(0, lerp(0.15, 0.18, ss(1.5, 4.5, G)), 0.02);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.235 + 0.006 * Math.sin(T * 0.27), camA.z + dz);
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
