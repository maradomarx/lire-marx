/* LE MONDE DE L'ACCUMULATION PRIMITIVE — la terre qu'on ferme.

   Le concept ne dit pas un entassement, il dit une SÉPARATION : « au fond du
   système capitaliste il y a donc la séparation radicale du producteur d'avec
   les moyens de production ». Il fallait donc montrer, non des richesses qui
   s'amassent, mais une ligne qui se pose — et une terre qui, sans changer,
   cesse d'être accessible. La figure est l'enclosure : des pieux plantés, une
   haie qui les relie, la chaumière qui perd son toit (« la guerre aux
   chaumières »), et les moutons dans le clos, les villages ayant été détruits
   « pour faire des parcs à moutons ».

   TOUT EST EN SILHOUETTE contre un ciel de crépuscule : c'est ce qui sauve
   une scène de plein air de ressembler à un dessin en trois dimensions — un
   pieu noir sur un ciel d'or est un pieu, une boîte grise éclairée n'est
   qu'une boîte. Le geste de la page est une ligne qui traverse, et elle ne
   s'arrête pas au dernier temps : la séparation « se reproduit sur une
   échelle progressive ».

   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.setClearColor(0x1a1008, 1);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 260);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le ciel : un dégradé de fin de jour, redessiné quand la lumière change ── */
  var skyCv = document.createElement('canvas'); skyCv.width = 8; skyCv.height = 256;
  var sg = skyCv.getContext('2d');
  var skyTex = new THREE.CanvasTexture(skyCv);
  if (THREE.sRGBEncoding) skyTex.encoding = THREE.sRGBEncoding;
  var lastSky = -1;
  function drawSky(n) {
    if (Math.abs(n - lastSky) < 0.012) return; lastSky = n;
    var gr = sg.createLinearGradient(0, 0, 0, 256);
    function mix(a, b) { return [lerp(a[0], b[0], n) | 0, lerp(a[1], b[1], n) | 0, lerp(a[2], b[2], n) | 0]; }
    var hi = mix([70, 62, 78], [26, 24, 34]), md = mix([196, 132, 74], [96, 62, 52]), lo = mix([246, 206, 138], [150, 96, 64]);
    gr.addColorStop(0, 'rgb(' + hi + ')'); gr.addColorStop(0.55, 'rgb(' + md + ')'); gr.addColorStop(1, 'rgb(' + lo + ')');
    sg.fillStyle = gr; sg.fillRect(0, 0, 8, 256); skyTex.needsUpdate = true;
  }
  drawSky(0);
  var sky = new THREE.Mesh(new THREE.PlaneGeometry(400, 130), new THREE.MeshBasicMaterial({ map: skyTex, fog: false, depthWrite: false }));
  sky.position.set(0, 40, -120); scene.add(sky);

  /* ── la terre : une plaine, ses sillons, ses touffes ── */
  var solTex = tex(1024, 1024, function (g, w, h) {
    g.fillStyle = '#2a1d12'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) { g.fillStyle = 'rgba(' + (58 + rnd() * 40 | 0) + ',' + (44 + rnd() * 30 | 0) + ',' + (26 + rnd() * 20 | 0) + ',' + (0.10 + rnd() * 0.22) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 26, 3 + rnd() * 9, rnd() * 3, 0, 6.3); g.fill(); }
    for (i = 0; i < 26; i++) { /* les sillons */
      g.strokeStyle = 'rgba(16,10,5,' + (0.10 + rnd() * 0.12) + ')'; g.lineWidth = 3 + rnd() * 5;
      var y = i * (h / 26) + rnd() * 8; g.beginPath(); g.moveTo(0, y);
      for (var x = 0; x <= w; x += 48) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 4);
      g.stroke();
    }
  });
  solTex.wrapS = solTex.wrapT = THREE.RepeatWrapping; solTex.repeat.set(9, 9);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), std({ map: solTex, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  /* ── la chaumière : elle perd son toit ── */
  var noir = std({ color: 0x140d07, roughness: 1 });
  var maison = new THREE.Group();
  var murs = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 2.4), noir); murs.position.y = 0.95; murs.castShadow = true; maison.add(murs);
  var toit = new THREE.Group();
  var pan = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.5, 4), noir); pan.rotation.y = Math.PI / 4; pan.position.y = 2.65; pan.castShadow = true; toit.add(pan);
  var chem = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.15, 0.42), noir); chem.position.set(1.0, 3.0, 0); chem.castShadow = true; toit.add(chem);
  maison.add(toit);
  maison.position.set(8.2, 0, -11.4); maison.rotation.y = -0.42; maison.scale.setScalar(1.3); scene.add(maison);
  /* la fumée : elle s'arrête quand le toit tombe */
  var fumTex = tex(64, 64, function (g, w, h) { var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(210,190,165,.5)'); gr.addColorStop(1, 'rgba(210,190,165,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var fumee = [];
  for (var f = 0; f < 7; f++) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fumTex, transparent: true, opacity: 0, depthWrite: false }));
    s.scale.setScalar(0.9 + f * 0.42); scene.add(s); fumee.push(s);
  }

  /* ── LA LIGNE : les pieux, puis la haie qui les relie ── */
  var NP = 26, ZL = -4.2, X0 = -26, PAS = 2.35;
  var pieux = [], haies = [];
  for (var i = 0; i < NP; i++) {
    var x = X0 + i * PAS;
    var p = new THREE.Mesh(new THREE.BoxGeometry(0.17, 1.85, 0.17), noir);
    p.position.set(x, 0.92, ZL + Math.sin(i * 0.7) * 0.22); p.rotation.z = (rnd() - 0.5) * 0.09;
    p.castShadow = true; p.visible = false; scene.add(p); pieux.push(p);
    if (i < NP - 1) {
      var hgt = new THREE.Group();
      for (var k = 0; k < 2; k++) {
        var b = new THREE.Mesh(new THREE.SphereGeometry(0.78 + rnd() * 0.18, 8, 6), noir);
        b.position.set(x + PAS * (0.3 + k * 0.42), 0.36 + rnd() * 0.14, ZL + (rnd() - 0.5) * 0.4);
        b.scale.set(1.15, 0.52, 0.7); b.castShadow = true; hgt.add(b);
      }
      hgt.visible = false; hgt.scale.y = 0.001; scene.add(hgt); haies.push(hgt);
    }
  }

  /* ── les moutons, dans le clos ── */
  var moutons = [];
  [[2.6, -6.6], [5.4, -7.8], [0.2, -7.0], [8.2, -6.2], [3.8, -9.0]].forEach(function (q) {
    var m = new THREE.Group();
    var corps = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), noir); corps.scale.set(1.35, 0.9, 0.85); corps.position.y = 0.62; corps.castShadow = true; m.add(corps);
    var tete = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), noir); tete.position.set(0.56, 0.74, 0); tete.castShadow = true; m.add(tete);
    [[-0.28, -0.18], [0.3, -0.18], [-0.28, 0.18], [0.3, 0.18]].forEach(function (c) {
      var l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), noir); l.position.set(c[0], 0.21, c[1]); m.add(l);
    });
    m.position.set(q[0], 0, q[1]); m.rotation.y = rnd() * 2; m.visible = false; scene.add(m); moutons.push(m);
  });

  /* ── la lumière : un soleil bas, qui descend ── */
  /* SILHOUETTE : l'appoint est presque nul et le soleil vient de DERRIÈRE.
     Un pieu noir sur un ciel d'or est un pieu ; le même pieu éclairé de
     face n'est qu'une boîte brune, et c'est ce qu'on avait. */
  var amb = new THREE.AmbientLight(0x4a3a2c, 0.12); scene.add(amb);
  var hemi = new THREE.HemisphereLight(0xd9a86a, 0x1a1008, 0.14); scene.add(hemi);
  var soleil = new THREE.DirectionalLight(0xffc07a, 2.2);
  soleil.position.set(-40, 9, -26); soleil.castShadow = true;
  soleil.shadow.mapSize.set(2048, 2048);
  soleil.shadow.camera.left = -34; soleil.shadow.camera.right = 34;
  soleil.shadow.camera.top = 20; soleil.shadow.camera.bottom = -20;
  soleil.shadow.camera.near = 1; soleil.shadow.camera.far = 130; soleil.shadow.bias = -0.0012;
  scene.add(soleil);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { maison: 0, pieux: 0, haie: 0, toit: 0, moutons: 0, nuit: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.maison  = ss(0.85, 1.6, G);
    st.pieux   = ss(1.9, 3.0, G);     /* la ligne se plante */
    st.haie    = ss(3.0, 4.1, G);     /* elle se ferme */
    st.toit    = ss(3.3, 3.9, G);     /* la guerre aux chaumières */
    st.moutons = ss(4.1, 4.8, G);
    st.nuit    = ss(3.8, 5.2, G);
    st.recul   = ss(4.9, 5.8, G);
  }

  function frame(dt) {
    T += dt; compute();
    var n = st.nuit;
    drawSky(n);
    soleil.intensity = 2.2 * (1 - 0.72 * n);
    soleil.color.setRGB(1, lerp(0.75, 0.48, n), lerp(0.48, 0.30, n));
    soleil.position.set(-40, lerp(9, 3.2, n), -26);
    amb.intensity = 0.12 * (1 - 0.45 * n); hemi.intensity = 0.14 * (1 - 0.5 * n);

    /* la chaumière, puis son toit qui tombe */
    maison.visible = st.maison > 0.01;
    maison.scale.setScalar(0.001 + 0.999 * st.maison);
    toit.visible = st.toit < 0.995;
    toit.position.y = -2.6 * st.toit; toit.rotation.z = 0.5 * st.toit;
    var fum = st.maison * (1 - ss(0.05, 0.5, st.toit));
    fumee.forEach(function (s, k) {
      var u = ((T * 0.16 + k / fumee.length) % 1);
      s.position.set(9.3 + u * 1.5 + Math.sin(u * 6 + k) * 0.5, 4.3 + u * 4.4, -11.4);
      s.material.opacity = fum * 0.5 * (1 - u) * (1 - ss(0.6, 1, u));
    });

    /* LA LIGNE : les pieux d'abord, de gauche à droite ; la haie ensuite */
    pieux.forEach(function (p, k) {
      var f = cl(st.pieux * NP - k);
      p.visible = f > 0.02; p.scale.y = 0.02 + 0.98 * f; p.position.y = 0.92 * (0.02 + 0.98 * f);
    });
    haies.forEach(function (hgt, k) {
      var f = cl(st.haie * (NP - 1) - k);
      hgt.visible = f > 0.02; hgt.scale.y = 0.02 + 0.98 * f;
    });
    moutons.forEach(function (m, k) {
      m.visible = st.moutons > (k + 0.3) / 5.4;
      m.position.y = Math.abs(Math.sin(T * 0.7 + k)) * 0.02;
    });

    /* la caméra : au ras du sol, puis elle se relève et découvre la ligne */
    var q = ss(0, 1, Math.min(1, G / 2.6));
    /* la caméra reste basse : c'est ce qui fait passer la ligne AU-DESSUS
       de l'horizon, donc sur le ciel — au-dessus, elle retombe sur la terre
       sombre et il n'y a plus de silhouette du tout */
    var cx = lerp(-2.0, -5.2, q), cy = lerp(1.02, 1.42, q), cz = lerp(4.6, 9.0, q);
    cz = lerp(cz, 12.5, st.recul); cy = lerp(cy, 1.72, st.recul);
    var camA = V3(lerp(3.2, 3.6, q), lerp(1.05, 1.15, q), lerp(-7.0, -9.5, q));
    camera.position.set(cx + 0.03 * Math.sin(T * 0.21), cy + 0.02 * Math.sin(T * 0.31), cz);
    /* la colonne de texte occupe la gauche : on vise à GAUCHE du sujet, d'une
       part proportionnelle à la distance et plafonnée — ici le sujet est une
       LIGNE qui traverse tout le champ, on décale donc peu : c'est la
       chaumière et le clos qui doivent tenir dans la moitié droite */
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.20 * dist, 2.6));
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
