/* LE MONDE DU SURTRAVAIL — le second sac, et les trois sceaux.

   « Le capital n'a point inventé le surtravail. » Partout où une partie de
   la société possède le monopole des moyens de production, le producteur
   ajoute à son entretien un surplus destiné à un autre — et les formes de
   société « ne se distinguent que par le mode dont ce surtravail est
   imposé et extorqué au producteur immédiat ».

   La scène tient dans cette phrase. La meule tourne du même mouvement, et
   ne change jamais de rythme : un premier sac se remplit jusqu'au trait de
   craie, c'est l'entretien ; puis un SECOND sac se remplit, du même geste
   et sans qu'aucun signal ne l'annonce. Ce second sac est le surtravail.

   Au dernier temps, il reçoit trois sceaux l'un après l'autre — la cire
   d'un seigneur, le fer d'un maître, l'or d'un salaire. LE SAC NE CHANGE
   PAS. Ce qui change est le sceau, c'est-à-dire la forme sous laquelle il
   est pris.

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
  var rnd = (function () { var s = 65537; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
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
  var sol = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.10, 0.60),
    std({ map: boisTex, color: 0x9c8768, roughness: 0.88 }));
  sol.position.set(0, -0.05, -0.02); sol.receiveShadow = true; scene.add(sol);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.2), std({ color: 0x171009, roughness: 1 }));
  mur.position.set(0, 0.6, -0.42); scene.add(mur);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.23));
  var lampe = new THREE.PointLight(0xffd9a8, 1.28, 2.9, 2);
  lampe.position.set(-0.28, 0.82, 0.40); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.24);
  appoint.position.set(1.3, 0.7, 0.8); scene.add(appoint);

  /* ── LA MEULE ─────────────────────────────────────────────────────────
     Elle tourne du même mouvement du début à la fin : rien dans le geste
     ne dit qu'on est passé d'un sac à l'autre. */
  var moulin = new THREE.Group(); moulin.position.set(-0.10, 0, -0.14); scene.add(moulin);
  (function () {
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.145, 0.155),
      std({ map: boisTex, color: 0x8a7454, roughness: 0.9 }));
    b.position.y = 0.073; b.castShadow = true; b.receiveShadow = true; moulin.add(b);
    var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.036, 0.085, 4),
      std({ map: boisTex, color: 0x7a6444, roughness: 0.92 }));
    tr.rotation.y = Math.PI / 4; tr.position.y = 0.188; tr.castShadow = true; moulin.add(tr);
    var bec = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.024, 0.070),
      std({ color: 0x5a4429, roughness: 0.9 }));
    bec.position.set(0.118, 0.062, 0.012); bec.castShadow = true; moulin.add(bec);
  })();
  var manivelle = new THREE.Group(); manivelle.position.set(-0.115, 0.115, 0.02); moulin.add(manivelle);
  (function () {
    var fer = std({ color: 0x50555c, metalness: 0.66, roughness: 0.44 });
    var ax = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.055, 10), fer);
    ax.rotation.z = Math.PI / 2; ax.position.x = -0.020; manivelle.add(ax);
    var br = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.082, 0.010), fer);
    br.position.set(-0.048, 0.036, 0); br.castShadow = true; manivelle.add(br);
    var po = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.042, 10),
      std({ color: 0x6b4a26, roughness: 0.9 }));
    po.rotation.z = Math.PI / 2; po.position.set(-0.048, 0.072, 0); po.castShadow = true; manivelle.add(po);
  })();

  /* ── LES DEUX SACS ────────────────────────────────────────────────────
     Le même sac, deux fois : rien ne les distingue que l'ordre dans lequel
     ils se remplissent. */
  /* la lampe est chaude : un jute déjà clair sort crème, et deux sacs
     crème se lisent comme des gobelets. */
  var jute = std({ color: 0x655231, roughness: 0.98 });
  function sac(x) {
    var g = new THREE.Group(); g.position.set(x, 0, 0.055); scene.add(g);
    var c = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.070, 1, 20), jute);
    c.geometry.translate(0, 0.5, 0); c.castShadow = true; c.receiveShadow = true; g.add(c);
    var col = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.058, 0.055, 18), jute);
    col.castShadow = true; g.add(col);
    var li = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.006, 6, 18),
      std({ color: 0x4d3d26, roughness: 1 }));
    li.rotation.x = Math.PI / 2; g.add(li);
    return { g: g, corps: c, col: col, lien: li };
  }
  var SA = sac(0.075), SB = sac(0.265);

  /* le trait de craie : jusque-là, c'est l'entretien */
  var craie = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.006, 0.006),
    new THREE.MeshBasicMaterial({ color: 0xe8e0c8, transparent: true, opacity: 0 }));
  craie.position.set(0.075, 0.155, 0.125); scene.add(craie);

  /* ── LES TROIS SCEAUX ─────────────────────────────────────────────────
     La cire d'un seigneur, le fer d'un maître, l'or d'un salaire. Le sac
     ne change pas ; seul le sceau change. */
  var SCEAUX = [0x8e2f22, 0x596068, 0xc09a3c];
  var sceaux = [];
  for (var i = 0; i < 3; i++) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.010, 20),
      std({ color: SCEAUX[i], metalness: i === 2 ? 0.85 : 0.25, roughness: i === 2 ? 0.3 : 0.72,
            transparent: true, opacity: 0 }));
    m.rotation.x = Math.PI / 2;
    m.position.set(0.265, 0.115, 0.128); m.castShadow = true;
    scene.add(m); sceaux.push(m);
  }

  /* ── la chorégraphie ── */
  var st = { pose: 0, un: 0, deux: 0, sceau: 0 };
  var G = 0, T = 0;
  function set(g) { G = g; }
  function compute() {
    st.pose = ss(0.7, 1.5, G);
    st.un = ss(1.95, 3.05, G);              /* le premier sac : l'entretien */
    st.deux = ss(3.20, 4.60, G);            /* le second, du même geste     */
    st.sceau = ss(4.95, 5.95, G);           /* les trois sceaux             */
  }

  function frame(dt) {
    T += dt; compute();
    var i;
    moulin.scale.setScalar(0.3 + 0.7 * st.pose);
    /* LA MEULE NE CHANGE JAMAIS DE RYTHME : c'est le point. */
    var tourne = (st.un > 0.02 && st.un < 0.995) || (st.deux > 0.02 && st.deux < 0.995);
    manivelle.rotation.x += dt * (tourne ? 3.4 : 0);

    SA.g.visible = st.pose > 0.3;
    SB.g.visible = st.deux > 0.02;
    var ha = 0.02 + 0.155 * st.un, hb = 0.02 + 0.155 * st.deux;
    SA.corps.scale.y = ha; SA.col.position.y = ha; SA.lien.position.y = ha - 0.012;
    SB.corps.scale.y = hb; SB.col.position.y = hb; SB.lien.position.y = hb - 0.012;
    SB.g.scale.setScalar(0.4 + 0.6 * cl(st.deux * 3));

    craie.material.opacity = 0.75 * ss(0.55, 0.95, st.un) * (1 - 0.5 * st.sceau);
    craie.position.y = 0.02 + 0.155 + 0.006;

    /* les trois sceaux se posent l'un après l'autre, au même endroit */
    for (i = 0; i < 3; i++) {
      var v = ss(i * 0.32, 0.22 + i * 0.32, st.sceau);
      var s2 = i < 2 ? (1 - ss(0.30 + i * 0.32, 0.42 + i * 0.32, st.sceau)) : 1;
      var o = v * s2;
      sceaux[i].visible = o > 0.02;
      sceaux[i].material.opacity = o;
      sceaux[i].position.set(0.265, 0.02 + hb * 0.62, 0.128 + (1 - o) * 0.05);
      sceaux[i].scale.setScalar(0.6 + 0.4 * o);
    }

    lampe.intensity = 1.28 * (1 + 0.02 * Math.sin(T * 5.2) + 0.015 * Math.sin(T * 2.5));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Le moulin de −0,30 à 0,02, les deux sacs de 0,00 à 0,34 : VÉRIFIÉ
       PAR PROJECTION à la position portrait, la plus étroite. */
    var dz = lerp(1.22, 1.14, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(0.035, lerp(0.13, 0.16, ss(1.5, 4.5, G)), -0.02);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.185 + 0.006 * Math.sin(T * 0.27), camA.z + dz);
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
