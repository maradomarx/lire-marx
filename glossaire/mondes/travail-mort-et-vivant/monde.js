/* LE MONDE DU TRAVAIL MORT ET DU TRAVAIL VIVANT — le fer et la flamme.

   Les deux images sont de Marx, et à la lettre. « Le fer se rouille, le
   bois pourrit » : livré à lui-même, le travail passé se défait. Et le
   travail vivant doit « ressaisir ces objets, les ressusciter des morts » —
   ils sont alors « léchés par la flamme du travail ».

   La scène est donc une masse de fer dans le noir, et une flamme qui
   passe. CE QU'ELLE ATTEINT TOURNE, ce qu'elle quitte s'arrête et se
   rouille de nouveau. Au troisième temps elle se retire tout à fait, et
   l'on voit que la masse n'a aucun mouvement propre : c'est la
   démonstration, et elle ne coûte qu'un aller-retour.

   Puis la masse GROSSIT de ce que la flamme lui donne, et au cinquième
   temps elle se met à tourner seule. La flamme n'a plus de chemin à elle :
   elle est portée sur une orbite que la grande roue lui impose. « Le moyen
   de travail converti en automate se dresse devant l'ouvrier […] sous
   forme de capital, de travail mort qui domine et pompe sa force vivante. »
   Au dernier temps, à chaque tour, un filet de lumière quitte la flamme et
   entre dans le fer ; la flamme baisse d'un cran et se reprend.

   L'angle des roues est ACCUMULÉ et non calculé sur g — c'est le seul
   endroit où la règle cède, et pour une raison : ce qui doit se voir,
   c'est qu'une roue S'ARRÊTE quand la flamme s'en va. Une rotation
   fonction de la position reviendrait en arrière au lieu de s'arrêter, et
   dirait le contraire de l'argument. Tout le reste est fonction de g. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x070605, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x070605, 1.7, 4.4);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 60013; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le sol de fabrique ── */
  var dalle = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#3a352e'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 7000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '18,15,11' : '96,88,74') + ',' + (rnd() * 0.10) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    g.strokeStyle = 'rgba(16,13,9,.5)'; g.lineWidth = 3;
    for (i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
  });
  /* le sol reçoit un peu de la chaleur du mur : entièrement noir, la
     masse ne reposait sur rien. */
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0),
    std({ map: dalle, color: 0x60594e, roughness: 0.95, emissive: 0x140c06, emissiveMap: dalle }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);
  /* LE MUR EST PROCHE, ET IL PORTE L'OMBRE. Sans lui la scène était un
     découpage sur du noir : plus de profondeur, plus de modelé, et un
     cadre à moitié vide. Il tient ici un second rôle, qui est le sujet
     même du dernier temps — la masse s'y dresse en grand derrière une
     flamme qui rétrécit. */
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#6a5a45'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 12000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '38,28,18' : '176,160,134') + ',' + (rnd() * 0.10) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    /* des assises, pas des planches : neuf traits nets se lisaient comme
       un lambris. Quatre, irréguliers et faibles, disent le plâtre. */
    g.strokeStyle = 'rgba(30,22,14,.13)'; g.lineWidth = 1.5;
    for (i = 1; i < 5; i++) {
      var y = i * h / 5 + (rnd() - 0.5) * 12; g.beginPath(); g.moveTo(0, y);
      for (var x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.5);
      g.stroke();
    }
  });
  /* Le mur est ÉMISSIF et non éclairé : il donne un fond chaud et
     constant, indépendant de la flamme, contre lequel la masse se lit en
     SILHOUETTE. C'est la leçon de l'enclosure — du fer gris sur du noir
     reste boueux quoi qu'on fasse ; du fer sombre sur un mur chaud est du
     fer. */
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7),
    std({ map: platre, color: 0x6f6350, roughness: 0.97, emissive: 0x2a1b0f, emissiveMap: platre }));
  mur.position.set(0, 0.62, -0.42); mur.receiveShadow = true; scene.add(mur);

  /* ── LA VEILLEUSE : sans elle, la première scène tombe au noir absolu et
     l'on ne voit plus la masse — c'est-à-dire la moitié de l'argument.
     Elle est froide, faible, et ne vient de nulle part. ── */
  scene.add(new THREE.AmbientLight(0xbcc8d8, 0.11));
  var lune = new THREE.DirectionalLight(0x8ba4c6, 0.24);
  lune.position.set(-1.4, 1.2, 0.9); scene.add(lune);

  /* ── LA MASSE ─────────────────────────────────────────────────────────
     Du travail humain accumulé : un arbre de couche, des roues, un socle,
     une poutre. Chaque pièce a SA matière, parce que chacune se rouille
     et s'éveille pour son compte, selon ce que la flamme atteint. */
  var ROUILLE = new THREE.Color(0x3c2110), FER = new THREE.Color(0x4a4f58);
  var pieces = [];
  function fer(mesh, tourne, vitesse, venue) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.material = std({ color: ROUILLE.clone(), roughness: 0.98, metalness: 0.16 });
    scene.add(mesh);
    pieces.push({ m: mesh, tourne: !!tourne, v: vitesse || 1, venue: venue || 0, ang: 0, base: mesh.position.clone(), ech: mesh.scale.x });
    return mesh;
  }
  function roue(x, y, z, r, ep, dents) {
    var g = new THREE.Group(); g.position.set(x, y, z);
    var d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, ep, 26), null);
    d.rotation.x = Math.PI / 2; g.add(d);
    var moy = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, ep * 1.6, 14), null);
    moy.rotation.x = Math.PI / 2; g.add(moy);
    for (var i = 0; i < dents; i++) {
      var a = i / dents * Math.PI * 2;
      var t = new THREE.Mesh(new THREE.BoxGeometry(r * 0.15, r * 0.20, ep), null);
      t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); t.rotation.z = a; g.add(t);
    }
    var mat = std({ color: ROUILLE.clone(), roughness: 0.98, metalness: 0.16 });
    g.traverse(function (o) { if (o.isMesh) { o.material = mat; o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    return { g: g, mat: mat };
  }
  var ROUES = [];
  function ajoutRoue(x, y, z, r, ep, dents, vitesse, venue) {
    var R = roue(x, y, z, r, ep, dents);
    ROUES.push({ o: R.g, mat: R.mat, v: vitesse, venue: venue || 0, ang: 0, ech: 1, pos: V3(x, y, z) });
    return R;
  }
  ajoutRoue(0.00, 0.235, 0.00, 0.185, 0.045, 14, 1.0, 0);
  ajoutRoue(-0.215, 0.150, 0.03, 0.085, 0.038, 9, -2.2, 0);
  ajoutRoue(0.185, 0.140, -0.02, 0.075, 0.034, 8, -2.6, 0);
  ajoutRoue(0.235, 0.290, 0.05, 0.060, 0.030, 7, 3.4, 3.35);
  ajoutRoue(-0.230, 0.320, -0.03, 0.070, 0.032, 8, 2.8, 3.62);
  ajoutRoue(0.045, 0.430, 0.02, 0.105, 0.036, 10, -1.6, 3.90);

  var arbre = fer(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.50, 12), null), false, 0, 0);
  arbre.rotation.z = Math.PI / 2; arbre.position.set(0, 0.235, 0);
  var socle = fer(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.085, 0.20), null), false, 0, 0);
  socle.position.set(0, 0.043, 0.02);
  var poutre = fer(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.40, 0.055), null), false, 0, 0);
  poutre.position.set(-0.255, 0.20, -0.10); poutre.rotation.z = 0.22;
  var bloc = fer(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.075, 0.13), null), false, 0, 3.15);
  /* AU PREMIER PLAN À GAUCHE, et c'est la projection qui l'a dit : posé à
     droite et en avant, il tombait à 99 % de la largeur, hors cadre. */
  bloc.position.set(-0.105, 0.038, 0.145); bloc.rotation.y = 0.35;

  /* ── LA FLAMME DU TRAVAIL ─────────────────────────────────────────────
     Dessinée, pas dégradée : enveloppe orange effilée, corps doré, cœur
     crème posé BAS, pied bleu à la mèche. UN seul plan billboard — deux
     plans croisés montrent leur couture — et le halo à part. */
  var flTex = tex(128, 256, function (g, w, h) {
    function blob(cx, cy, rx, ry, c0, c1) {
      g.save(); g.translate(cx, cy); g.scale(rx, ry);
      var r = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      r.addColorStop(0, c0); r.addColorStop(1, c1);
      g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore();
    }
    blob(64, 150, 40, 105, 'rgba(255,150,40,.92)', 'rgba(255,110,20,0)');
    blob(64, 168, 26, 74, 'rgba(255,205,110,.96)', 'rgba(255,160,40,0)');
    blob(64, 196, 15, 40, 'rgba(255,246,222,.99)', 'rgba(255,220,150,0)');
    blob(64, 222, 11, 17, 'rgba(150,190,255,.75)', 'rgba(90,140,255,0)');
  });
  var flMat = new THREE.MeshBasicMaterial({ map: flTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1 });
  var flamme = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.26), flMat);
  scene.add(flamme);
  var haloTex = tex(128, 128, function (g, w, h) {
    var r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,168,70,.30)'); r.addColorStop(0.40, 'rgba(255,130,40,.07)'); r.addColorStop(1, 'rgba(255,110,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  var halo = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46),
    new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(halo);
  /* UNE SOURCE PROCHE DEMANDE UNE INTENSITÉ BIEN PLUS FAIBLE : à 1,5 et
     1,9 unité de portée, la masse entière saturait au blanc et la rouille
     disparaissait — c'est-à-dire la moitié de l'argument. */
  var feu = new THREE.PointLight(0xffb055, 0.62, 1.55, 2);
  feu.castShadow = true; feu.shadow.mapSize.set(1024, 1024); feu.shadow.bias = -0.0018; scene.add(feu);

  /* le filet : à chaque tour, quelque chose quitte la flamme et entre
     dans le fer. C'est le vampire, et il ne se dit pas autrement. */
  var filetMat = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  var filet = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.001, 1, 6), filetMat);
  scene.add(filet);

  /* ── la chorégraphie ── */
  var st = { flamme: 0, retrait: 0, croit: 0, automate: 0, pompe: 0, fx: 0, fy: 0.20 };
  var G = 0, T = 0;
  var CENTRE = V3(0, 0.235, 0);
  function set(g) { G = g; }
  function compute() {
    /* la flamme paraît, traverse, SE RETIRE TOUT À FAIT, revient */
    st.flamme = ss(1.02, 1.30, G);
    st.retrait = ss(2.10, 2.48, G) * (1 - ss(2.66, 3.00, G));
    st.croit = ss(3.10, 4.05, G);
    st.automate = ss(4.20, 4.90, G);
    st.pompe = ss(5.10, 5.60, G);
    /* son chemin est d'abord le sien — de gauche à droite au long de la
       masse — puis il lui est IMPOSÉ : une orbite que la grande roue
       entraîne. Le décalage vers la gauche est borné : sur une page
       « plein », le voile ne s'efface qu'au-delà de 75 % de la largeur. */
    var libreX = lerp(-0.285, 0.215, ss(1.05, 2.05, G));
    libreX = lerp(libreX, -0.34, st.retrait);
    var a = ROUES[0].ang * 0.55 + 1.1;
    st.fx = lerp(libreX, CENTRE.x + Math.cos(a) * 0.170, st.automate);
    st.fy = lerp(0.185, CENTRE.y + Math.sin(a) * 0.170, st.automate);
  }

  var P = V3(), Q = V3(), UP = V3(0, 1, 0);
  function vie(pos) {
    var d = Math.hypot(pos.x - st.fx, pos.y - st.fy, pos.z * 0.5);
    return Math.max(st.automate, cl(1 - d / 0.22) * st.flamme * (1 - st.retrait));
  }

  function frame(dt) {
    T += dt; compute();
    var i, vibr = 1 + 0.055 * Math.sin(T * 9.3) + 0.04 * Math.sin(T * 15.1) + 0.03 * Math.sin(T * 4.7);

    /* la flamme passe DEVANT la masse, franchement : à 0,13 elle affleurait
       l'épaisseur des roues et se faisait rogner par une dent. */
    flamme.position.set(st.fx, st.fy, 0.21);
    halo.position.set(st.fx, st.fy, 0.18);
    feu.position.set(st.fx, st.fy + 0.03, 0.20);
    var vf = st.flamme * (1 - st.retrait);
    /* la flamme baisse à mesure que la masse grossit et se met à tourner
       seule : ce n'est pas elle qui grandit, c'est ce qu'elle nourrit. */
    var force = vf * lerp(1, 0.52, st.automate) * (1 - 0.22 * st.pompe * (0.5 + 0.5 * Math.sin(T * 2.1)));
    flamme.visible = halo.visible = force > 0.02;
    flMat.opacity = force;
    flamme.scale.set(lerp(0.8, 1, force) * (1 / vibr * 1.04), lerp(0.7, 1, force) * vibr, 1);
    /* LE HALO ADDITIF EST CE QUI LAVE UNE SCÈNE, bien avant la lumière
       elle-même : un grand plan additif devant la masse la portait au
       crème et la rouille disparaissait. On mesure les pixels avant de
       conclure quoi que ce soit sur une couleur. */
    halo.material.opacity = force * 0.42;
    halo.scale.setScalar(lerp(0.85, 1.05, force) * (0.97 + 0.05 * Math.sin(T * 3.3)));
    feu.intensity = 0.62 * force * vibr;

    for (i = 0; i < ROUES.length; i++) {
      var R = ROUES[i];
      var nee = R.venue ? ss(R.venue, R.venue + 0.30, G) * st.croit : 1;
      R.o.visible = nee > 0.02;
      R.o.scale.setScalar(0.2 + 0.8 * nee);
      var v = vie(R.pos) * nee;
      R.ang += dt * v * R.v * 2.1;
      R.o.rotation.z = R.ang;
      R.mat.color.copy(ROUILLE).lerp(FER, v);
      /* la pièce éveillée n'est pas plus CLAIRE, elle ACCROCHE la lumière :
         c'est ainsi que le fer se distingue de la rouille. */
      R.mat.roughness = lerp(0.99, 0.20, v);
      R.mat.metalness = lerp(0.10, 0.62, v);
    }
    for (i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var n2 = p.venue ? ss(p.venue, p.venue + 0.30, G) * st.croit : 1;
      p.m.visible = n2 > 0.02;
      p.m.scale.setScalar((p.ech || 1) * (0.2 + 0.8 * n2));
      var v2 = vie(p.base) * n2;
      p.m.material.color.copy(ROUILLE).lerp(FER, v2);
      p.m.material.roughness = lerp(0.99, 0.20, v2);
      p.m.material.metalness = lerp(0.10, 0.62, v2);
    }

    /* LE FILET : la flamme donne, le fer reçoit, et cela bat au rythme de
       la roue — pas à celui de la flamme. */
    var bat = st.pompe * cl(Math.sin(ROUES[0].ang * 1.1) * 2.4);
    filet.visible = bat > 0.03;
    if (filet.visible) {
      P.set(st.fx, st.fy, 0.11); Q.copy(CENTRE); Q.z = 0.04;
      var D = Q.clone().sub(P), L = D.length();
      filet.position.copy(P).addScaledVector(D, 0.5);
      filet.scale.set(1, L, 1);
      filet.quaternion.setFromUnitVectors(UP, D.normalize());
      filetMat.opacity = 0.75 * bat;
    }

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Page « plein » : la visée est décalée à GAUCHE de 0,25 de la largeur
       vue, ce qui porte la masse à environ 75 % — la part claire du voile.
       La masse et l'orbite tiennent alors entre 57 % et 93 %. */
    var dz = lerp(1.48, 1.38, ss(0, 1, Math.min(1, G / 3)));
    var visW = 1.102 * dz;
    var aim = V3(-0.245 * visW, 0.235, 0.0);
    camera.position.set(aim.x + 0.010 * Math.sin(T * 0.19), aim.y + 0.055 + 0.007 * Math.sin(T * 0.24), aim.z + dz);
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
