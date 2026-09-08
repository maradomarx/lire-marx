/* LE MONDE DE LA FORCE DE TRAVAIL — le passage.
   Le chapitre VI se termine en franchissant un seuil : on quitte « cette
   sphère bruyante où tout se passe à la surface et aux regards de tous »
   pour « le laboratoire secret de la production ». La page est ce
   travelling — et LA MATIÈRE CHANGE AU SEUIL, parce que c'est de registre
   que Marx change.
   DEHORS, tout est dessiné : la place du marché avec l'étal des
   subsistances (ce qui fait la valeur de la force), le sablier (ce qui se
   vend est un temps), l'arche gravée LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ ·
   BENTHAM, la rue, l'atelier et son écriteau. Et la place est VIDE : dans
   l'Éden des droits, les deux contractants ne sont que des rôles.
   DEDANS, ce n'est plus de la 3D : c'est une photographie — Lewis W. Hine,
   « The Mule Room in the New Bedford Cotton Mill », 1912 (Library of
   Congress, collection National Child Labor Committee, nclc.02476,
   domaine public). Seuls corps de la page, et ils regardent l'objectif.
   La caméra ne suit personne : c'est le LECTEUR qu'elle fait entrer.
   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  var BG = 0x0c0906;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(BG, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x8a7a66, 14, 40);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 17; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le ciel, le soleil ── */
  var sky = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), new THREE.MeshBasicMaterial({ color: 0x9db4d2, fog: false }));
  sky.position.set(4, 20, -34); scene.add(sky);
  var sun = new THREE.DirectionalLight(0xfff0d0, 1.6); sun.position.set(-6, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -8; sun.shadow.camera.right = 12; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -4; sun.shadow.camera.near = 1; sun.shadow.camera.far = 40; sun.shadow.bias = -0.0008;
  sun.target.position.set(3, 0, -1); scene.add(sun); scene.add(sun.target);
  var hemi = new THREE.HemisphereLight(0xa8c0e0, 0x4a3a2a, 0.7); scene.add(hemi);
  var amb = new THREE.AmbientLight(0x6a5a48, 0.3); scene.add(amb);

  /* ── le sol pavé ── */
  var cobTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#4a4238'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 26) for (var x = (y / 26 % 2) * 20; x < w + 40; x += 40) { var v = 96 + rnd() * 34 | 0; g.fillStyle = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 20) + ')'; g.beginPath(); g.roundRect ? g.roundRect(x - 20 + 2, y + 2, 36, 22, 6) : g.rect(x - 20 + 2, y + 2, 36, 22); g.fill(); }
  });
  cobTex.wrapS = cobTex.wrapT = THREE.RepeatWrapping; cobTex.repeat.set(10, 6);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 36), std({ map: cobTex, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  /* ── les façades ── */
  function facadeTex(base, rows, cols) { return tex(512, 512, function (g, w, h) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '160,140,110') + ',' + rnd() * 0.1 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    var cw = w / cols, rh = h / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { var x = c * cw + cw * 0.3, y = r * rh + rh * 0.22, ww = cw * 0.4, hh = rh * 0.56;
      g.fillStyle = '#1e1812'; g.fillRect(x, y, ww, hh); g.fillStyle = '#5a4a3a'; g.fillRect(x + ww / 2 - 1, y, 2, hh); g.fillRect(x, y + hh / 2 - 1, ww, 2); g.fillStyle = '#7a6a56'; g.fillRect(x - 4, y + hh, ww + 8, 5); }
  }); }
  var stone = std({ color: 0xb8a88c, roughness: 0.85 });
  /* ATTENTION : ces façades sont des BOÎTES de 4 de profondeur. Les deux du
     fond doivent rester derrière le volume de l'atelier, sinon elles y
     pénètrent et se voient PAR-DESSUS le tirage, sur le bord du cadre. */
  [[-6.5, 5.6, -6.5, 7, '#8d7d68', 3, 4], [1.5, 4.8, -9.6, 6, '#9a8a72', 3, 3], [13.5, 6.2, -10.5, 8, '#7d6d58', 4, 4], [-12, 5, -6, 5, '#8a7a66', 3, 3]].forEach(function (b) {
    var t = facadeTex(b[4], b[5], b[6]); var m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[1], 4), std({ map: t, roughness: 0.9 })); m.position.set(b[0], b[1] / 2, b[2]); m.castShadow = m.receiveShadow = true; scene.add(m);
  });

  /* ── l'atelier : façade, porte, écriteau, lanterne ── */
  var shop = new THREE.Group();
  /* LA PORTE EST UN VRAI TROU : quatre panneaux autour de l'ouverture, jamais
     un bloc plein percé d'un faux trou noir. Sans cela on ne voit jamais
     l'intérieur depuis la rue — on regarde un mur — et c'est précisément
     ce que le chapitre VI demande de franchir du regard avant d'y entrer. */
  var wallMat = std({ color: 0x3a2f26, roughness: 0.92 });
  var OP_X0 = -1.83, OP_X1 = -0.57, OP_H = 2.58;   /* l'ouverture, entre les jambages */
  [[(-3.5 + OP_X0) / 2, 2.3, OP_X0 + 3.5, 4.6],
   [(OP_X1 + 3.5) / 2, 2.3, 3.5 - OP_X1, 4.6],
   [(OP_X0 + OP_X1) / 2, (OP_H + 4.6) / 2, OP_X1 - OP_X0, 4.6 - OP_H]].forEach(function (w) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w[2], w[3], 0.4), wallMat);
    m.position.set(w[0], w[1], 0); m.castShadow = m.receiveShadow = true; shop.add(m);
  });
  var jamb = std({ color: 0x241a12, roughness: 0.85 });
  [[-1.9, 1.3, 0.14, 2.6], [-0.5, 1.3, 0.14, 2.6], [-1.2, 2.65, 1.6, 0.14]].forEach(function (j) { var m = new THREE.Mesh(new THREE.BoxGeometry(j[2], j[3], 0.5), jamb); m.position.set(j[0], j[1], 0.02); shop.add(m); });
  var signTex = tex(512, 128, function (g, w, h) { g.fillStyle = '#d9c9a3'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a14'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#2b1c0e'; g.textAlign = 'center'; g.font = '700 36px "Inter", Georgia, serif'; g.fillText('NO ADMITTANCE', w / 2, 56); g.font = '600 26px "Inter", Georgia, serif'; g.fillText('EXCEPT ON BUSINESS', w / 2, 96); });
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: signTex })); sign.position.set(-1.2, 3.1, 0.22); shop.add(sign);
  var roof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.18, 1.2), std({ color: 0x241a12, roughness: 0.9 })); roof.position.set(0, 4.7, 0.3); roof.castShadow = true; shop.add(roof);
  [[1.2, 3.2], [2.6, 3.2], [2.6, 1.6]].forEach(function (p) { var wi = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshBasicMaterial({ color: 0x0d0a08 })); wi.position.set(p[0], p[1], 0.21); shop.add(wi); var bar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.05), jamb); bar.position.set(p[0], p[1] + 0.42, 0.24); shop.add(bar); });
  var lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd08a })); lampMesh.position.set(-1.2, 3.55, 0.35); shop.add(lampMesh);
  var haloTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,190,110,.6)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); halo.scale.set(1.6, 1.6, 1); halo.position.set(-1.2, 3.55, 0.45); shop.add(halo);
  var doorLamp = new THREE.PointLight(0xffb15c, 0, 8, 1.6); doorLamp.position.set(-1.2, 3.3, 1.0); shop.add(doorLamp);
  var SHOP_X = 8.4, SHOP_Z = -2.2; shop.position.set(SHOP_X, 0, SHOP_Z); scene.add(shop);
  var DOOR = V3(SHOP_X - 1.2, 0, SHOP_Z + 0.4);

  /* ── l'intérieur : LE TIRAGE ──
     Derrière la porte, ce n'est plus de la 3D. Marx finit le chapitre VI en
     changeant de registre : on quitte « cette sphère bruyante où tout se
     passe à la surface » pour le laboratoire secret de la production. La
     scène change donc de MATIÈRE au seuil — dedans, une photographie. Ce
     sont les seuls vrais corps de la page, et ils regardent l'objectif. */
  var host = document.querySelector('.nt-monde');
  var dir = (host && host.dataset.scene ? host.dataset.scene : '/glossaire/mondes/force-de-travail/monde.js').replace(/monde\.js.*$/, '');
  var inside = new THREE.Group();
  var dark = std({ color: 0x140e09, roughness: 1 });
  /* le bois sert encore à l'étal et au sablier, dehors */
  var woodTex = tex(256, 256, function (g, w, h) { g.fillStyle = '#5a3b20'; g.fillRect(0, 0, w, h); for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(30,16,6,' + (0.08 + rnd() * 0.14) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); g.lineTo(w, y + (rnd() - 0.5) * 8); g.stroke(); } });
  var wood = std({ map: woodTex, roughness: 0.7 });
  var PH_Z = -4.0, PH_W = 7.2, PH_H = PH_W * 987 / 1400, PH_Y = 2.15;
  /* le volume est franchement plus large que tout champ possible : sinon
     le décor de la rue se voit PAR-DESSUS le tirage, sur les bords */
  [[0, PH_Y, PH_Z - 0.08, 0, 22, 14], [-6.5, 3, PH_Z / 2, Math.PI / 2, 9, 14], [6.5, 3, PH_Z / 2, -Math.PI / 2, 9, 14]].forEach(function (m) {
    var q = new THREE.Mesh(new THREE.PlaneGeometry(m[4], m[5]), dark); q.position.set(m[0], m[1], m[2]); q.rotation.y = m[3]; inside.add(q); });
  var ceilIn = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), dark); ceilIn.rotation.x = Math.PI / 2; ceilIn.position.set(0, 5.6, PH_Z / 2); inside.add(ceilIn);
  var floorIn = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), dark); floorIn.rotation.x = -Math.PI / 2; floorIn.position.set(0, 0.015, PH_Z / 2); inside.add(floorIn);
  /* le tirage : Lewis Hine, mule room de la filature de New Bedford, 1912
     (Library of Congress, collection National Child Labor Committee,
     domaine public). Sans tone mapping : une photographie se rend telle
     qu'elle est, elle n'est pas une surface de la scène. */
  var photoMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
  if ('toneMapped' in photoMat) photoMat.toneMapped = false;
  var photo = new THREE.Mesh(new THREE.PlaneGeometry(PH_W, PH_H), photoMat);
  photo.position.set(0, PH_Y, PH_Z); inside.add(photo);
  var ready = new Promise(function (res) {
    new THREE.TextureLoader().load(dir + 'atelier-1912.webp', function (t) {
      if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
      t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      photoMat.map = t; photoMat.needsUpdate = true; res(t);
    }, undefined, function () { res(null); });
  });
  var insideLamp = new THREE.PointLight(0xffc27a, 0, 7, 1.7); insideLamp.position.set(0, 2.3, -1.0); inside.add(insideLamp);
  /* le volume se centre sur l'AXE DE LA PORTE, et non sur l'atelier :
     la porte est décentrée dans la façade, et c'est par elle qu'on regarde */
  inside.position.set(SHOP_X - 1.2, 0, SHOP_Z); scene.add(inside);

  /* ── l'arche de l'Éden ── */
  var arch = new THREE.Group();
  [-1.05, 1.05].forEach(function (x) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.2, 0.38), stone); p.position.set(x, 1.6, 0); p.castShadow = true; arch.add(p); var cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), stone); cap.position.set(x, 3.26, 0); arch.add(cap); });
  var lintel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 0.42), stone); lintel.position.set(0, 3.55, 0); lintel.castShadow = true; arch.add(lintel);
  var edenTex = tex(1024, 192, function (g, w, h) { g.fillStyle = '#b8a88c'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.font = '700 46px "Fraunces", Georgia, serif'; g.fillStyle = 'rgba(40,28,14,.75)'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2 + 2, h / 2 + 18); g.fillStyle = '#6b5a42'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2, h / 2 + 16); });
  var edenGlowTex = tex(1024, 192, function (g, w, h) { g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.font = '700 46px "Fraunces", Georgia, serif'; g.shadowColor = 'rgba(216,173,76,.9)'; g.shadowBlur = 18; g.fillStyle = '#ffd98a'; g.fillText('LIBERTÉ · ÉGALITÉ · PROPRIÉTÉ · BENTHAM', w / 2, h / 2 + 16); });
  var eden = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: edenTex })); eden.position.set(0, 3.55, 0.215); arch.add(eden);
  var edenGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.49), new THREE.MeshBasicMaterial({ map: edenGlowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); edenGlow.position.set(0, 3.55, 0.22); arch.add(edenGlow);
  arch.position.set(2.4, 0, -1.4); scene.add(arch);

  /* ── l'étal des subsistances ── */
  var stall = new THREE.Group();
  var top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.85), wood); top.position.y = 0.88; top.castShadow = top.receiveShadow = true; stall.add(top);
  [[-0.8, -0.32], [0.8, -0.32], [-0.8, 0.32], [0.8, 0.32]].forEach(function (c) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.88, 0.07), wood); l.position.set(c[0], 0.44, c[1]); stall.add(l); });
  var awnTex = tex(128, 64, function (g, w, h) { for (var x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#c9b48c' : '#8a3a2a'; g.fillRect(x, 0, 16, h); } });
  var awning = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), std({ map: awnTex, roughness: 0.9, side: THREE.DoubleSide })); awning.position.set(0, 2.1, -0.1); awning.rotation.x = -1.25; awning.castShadow = true; stall.add(awning);
  [-0.9, 0.9].forEach(function (x) { var p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 8), wood); p.position.set(x, 1.15, -0.48); stall.add(p); });
  var bread = std({ color: 0xc08a48, roughness: 0.8 });
  [[-0.6, 0.0], [-0.45, 0.16], [-0.66, 0.22]].forEach(function (b) { var m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), bread); m.scale.set(1.4, 0.7, 0.9); m.position.set(b[0], 0.99, b[1]); m.castShadow = true; stall.add(m); });
  var cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16), std({ color: 0xcdbb95, roughness: 0.9 })); cloth.rotation.z = Math.PI / 2; cloth.position.set(0.05, 1.02, 0.15); cloth.castShadow = true; stall.add(cloth);
  var coal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), std({ color: 0x241f1a, roughness: 1 })); coal.scale.set(1, 0.8, 1); coal.position.set(0.6, 1.05, -0.05); coal.castShadow = true; stall.add(coal);
  var bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 10), std({ color: 0x2f4a30, roughness: 0.3 })); bottle.position.set(0.3, 1.07, 0.27); stall.add(bottle);
  var hg = new THREE.Group();
  var glass = new THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.35, roughness: 0.1 }) : std({ color: 0xdfe8f0, transparent: true, opacity: 0.35 });
  var bulbT = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 14), glass); bulbT.position.y = 0.27; hg.add(bulbT);
  var bulbB = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 14), glass); bulbB.rotation.x = Math.PI; bulbB.position.y = 0.09; hg.add(bulbB);
  var sandMat = std({ color: 0xd8b46a, roughness: 1 });
  var sandT = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), sandMat); sandT.position.y = 0.25; hg.add(sandT);
  var sandB = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 12), sandMat); sandB.rotation.x = Math.PI; sandB.position.y = 0.07; hg.add(sandB);
  [0, 0.36].forEach(function (y) { var d = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 14), wood); d.position.y = y; hg.add(d); });
  [0, 2.09, 4.19].forEach(function (a) { var r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), wood); r.position.set(Math.cos(a) * 0.12, 0.18, Math.sin(a) * 0.12); hg.add(r); });
  hg.position.set(-0.15, 0.92, -0.15); stall.add(hg);
  var coins = [];
  for (var ci = 0; ci < 3; ci++) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16), std({ color: 0xd8c27a, metalness: 0.9, roughness: 0.3 })); c.position.set(0.3 + ci * 0.06, 0.926, -0.24 + ci * 0.02); c.visible = false; stall.add(c); coins.push(c); }
  var STALL = V3(-0.3, 0, -1.0); stall.position.copy(STALL); stall.rotation.y = -0.2; scene.add(stall);   /* l'étal à DROITE des deux figures : c'est lui le sujet des étapes 2 et 4 */

  /* ── PERSONNE ──
     Sur la place, aucun corps, et c'est le propos. « Cette sphère de la
     circulation était en fait un véritable Éden des droits de l'homme » :
     l'égalité qu'on y proclame est formelle, et ses deux contractants n'y
     sont que des rôles. Les seuls corps de la page sont derrière la porte,
     dans le tirage — et c'est le lecteur lui-même que la caméra fait
     franchir le seuil. Un essai d'ombres portées au sol a été retiré : au
     ras du pavé elles se confondaient avec celle de l'étal, et une figure
     à demi lisible vaut moins que pas de figure. */

  /* ── chorégraphie ── */
  var G = 0, T = 0, st = { sand: 0, eden: 0, coins: 0, dusk: 0, photo: 0, inside: 0 };
  function set(g) { G = g; }
  function compute() {
    st.sand  = ss(1.0, 1.9, G);
    st.eden  = ss(2.9, 3.5, G) * (1 - ss(5.0, 5.4, G));
    st.coins = ss(3.15, 3.7, G);
    st.dusk  = ss(4.1, 5.1, G);
    st.photo = ss(4.45, 5.8, G);
    st.inside = ss(5.05, 6.0, G);
  }
  /* la caméra : un plan clé par étape, et l'on interpole */
  var KEY = [
    { p: V3(-1.8, 2.7, 12.0), a: V3(-1.6, 1.3, -1.0) },   /* 0 la place, large — et vide */
    { p: V3(0.2, 1.6, 3.9), a: V3(-0.5, 1.05, -1.0) },    /* 1 l'étal, le sablier */
    { p: V3(-0.6, 1.55, 3.4), a: V3(-0.9, 1.05, -1.2) },  /* 2 l'étal et le sablier, de plus près : ce qui s'achète est un temps */
    { p: V3(0.4, 1.95, 3.6), a: V3(-0.4, 1.55, -1.1) },   /* 3 les pièces, et l'arche qui s'allume */
    { p: V3(0.6, 2.0, 6.6), a: V3(2.0, 1.3, -0.8) },      /* 4 la rue vers la porte */
    { p: V3(5.4, 1.85, 3.4), a: V3(7.2, 1.45, -2.2) },    /* 5 le seuil, l'écriteau */
    { p: V3(SHOP_X - 1.2, 1.95, SHOP_Z - 0.80), a: V3(SHOP_X - 1.2, PH_Y - 0.3, SHOP_Z + PH_Z) } /* 6 dedans : assez près pour que le tirage DÉBORDE du cadre — on n'y regarde plus une image, on y est */
  ];
  /* on passe PAR la porte : un plan clé dans l'embrasure même, sinon la
     ligne droite traverserait le mur */
  var KEYDOOR = { p: V3(SHOP_X - 1.2, 1.9, SHOP_Z + 0.55), a: V3(SHOP_X - 1.2, PH_Y - 0.2, SHOP_Z + PH_Z) };
  var camP = new THREE.Vector3(), camA = new THREE.Vector3();
  function frame(dt) {
    T += dt; compute();
    var d = st.dusk;
    sun.intensity = 1.6 * (1 - 0.88 * d); sun.color.setRGB(1, lerp(0.94, 0.5, d), lerp(0.82, 0.25, d));
    hemi.intensity = 0.7 * (1 - 0.75 * d); amb.intensity = 0.3 * (1 - 0.5 * d);
    sky.material.color.setRGB(lerp(0.62, 0.1, d), lerp(0.71, 0.1, d), lerp(0.82, 0.16, d));
    scene.fog.color.setRGB(lerp(0.54, 0.08, d), lerp(0.48, 0.06, d), lerp(0.4, 0.05, d));
    doorLamp.intensity = 1.8 * d * (1 + 0.06 * Math.sin(T * 9.3)); halo.material.opacity = 0.9 * d;
    /* le sablier coule, l'Éden s'allume, les pièces se posent */
    hg.rotation.z = -0.5 * Math.sin(Math.PI * Math.min(1, st.sand * 1.2)) * (st.sand > 0 ? 1 : 0);
    sandT.scale.set(1, 1 - 0.9 * st.sand, 1); sandT.position.y = 0.25 - 0.06 * st.sand; sandB.scale.setScalar(0.3 + 0.7 * st.sand);
    edenGlow.material.opacity = st.eden * (0.85 + 0.1 * Math.sin(T * 2.1));
    coins.forEach(function (c, i) { c.visible = st.coins > (i + 0.5) / 3.5; });
    /* le tirage qui vient */
    photoMat.color.setScalar(0.05 + 0.95 * st.photo);
    insideLamp.intensity = 1.2 * st.photo;
    /* la caméra */
    var seg = Math.min(5, Math.floor(G)), t = ss(0, 1, G - seg);
    if (seg === 5) {
      var u = cl(G - 5);
      if (u < 0.5) { var k = ss(0, 1, u / 0.5); camP.lerpVectors(KEY[5].p, KEYDOOR.p, k); camA.lerpVectors(KEY[5].a, KEYDOOR.a, k); }
      else { var k2 = ss(0, 1, (u - 0.5) / 0.5); camP.lerpVectors(KEYDOOR.p, KEY[6].p, k2); camA.lerpVectors(KEYDOOR.a, KEY[6].a, k2); }
    } else { camP.lerpVectors(KEY[seg].p, KEY[seg + 1].p, t); camA.lerpVectors(KEY[seg].a, KEY[seg + 1].a, t); }
    camera.position.set(camP.x + 0.02 * Math.sin(T * 0.3), camP.y + 0.015 * Math.sin(T * 0.41), camP.z);
    /* la colonne de texte occupe la gauche : on vise à GAUCHE du sujet pour
       qu'il vive dans la moitié droite — « à gauche » se mesurant dans le
       repère de la CAMÉRA. Mais face au tirage on relâche : c'est l'image
       entière qui est le sujet, et la rogner serait la trahir. */
    var dist = camP.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camP).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    /* le décalage est PLAFONNÉ : proportionnel à la distance, il atteignait
       trois unités sur le plan large et jetait le sujet hors du cadre */
    aim.copy(camA).addScaledVector(right, -Math.min(0.28 * dist, 1.4) * (1 - 0.62 * st.inside));
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() { var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h > 1.2 ? 40 : Math.min(72, 2 * Math.atan(Math.tan(52 * Math.PI / 360) / camera.aspect) * 180 / Math.PI); camera.updateProjectionMatrix(); }
  function dispose() { scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, ready: ready, camera: camera, photo: photo };
};
