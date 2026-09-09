/* LE MONDE DES FONCTIONS DE LA MONNAIE — une pièce, quatre métiers.

   Le chapitre III ne demande pas ce qu'EST la monnaie, il demande ce
   qu'elle FAIT — et il trouve quatre emplois qui n'exigent pas le même
   degré de réalité. Mesurer ne demande aucune pièce : « dans sa fonction
   de mesure des valeurs, la monnaie n'est employée que comme monnaie
   idéale ». Circuler n'en demande qu'un semblant : à force de courir, la
   pièce devient un jeton, et « la monnaie peut donc être de la boue ».
   Thésauriser et payer, eux, exigent de l'or vrai.

   D'où la scène : une SEULE pièce, quatre places, et une MATIÈRE qui
   change avec le métier. Au-dessus de l'étiquette elle n'est qu'un
   fantôme ; sur le rail, un jeton de cuivre usé ; dans le coffre et sur le
   registre, de l'or plein.

   Le dernier temps est la crise : l'enchaînement des paiements se dérange,
   la monnaie de compte cesse de valoir, elle « est réclamée comme argent
   comptant » — et les quatre places la demandent en même temps, alors
   qu'il n'y en a qu'une.

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
  var rnd = (function () { var s = 24499; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le comptoir ── */
  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#463526'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 190; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '26,18,10' : '112,90,62') + ',' + (0.05 + rnd() * 0.16) + ')';
      g.lineWidth = 0.6 + rnd() * 2.4; g.beginPath();
      var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 30) g.lineTo(x, y + Math.sin(x * 0.013 + i) * 4);
      g.stroke();
    }
  });
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.62),
    std({ map: boisTex, color: 0x9c8768, roughness: 0.85 }));
  comptoir.position.set(0, -0.06, -0.02); comptoir.receiveShadow = true; scene.add(comptoir);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.6), std({ color: 0x150f0a, roughness: 1 }));
  fond.position.set(0, 0.62, -0.46); scene.add(fond);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.26));
  var lampe = new THREE.PointLight(0xffd9a8, 1.35, 3.0, 2);
  lampe.position.set(-0.18, 0.78, 0.36); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.28);
  appoint.position.set(1.4, 0.7, 0.8); scene.add(appoint);

  /* ── LES QUATRE PLACES ────────────────────────────────────────────────
     Quatre silhouettes qu'on ne peut pas confondre : une étiquette sur son
     pied, un rail, un coffre, un registre ouvert. C'est le SILHOUETTE qui
     fait reconnaître un petit objet, pas son détail. */
  /* LA COLONNE COLLANTE EST PLUS ÉTROITE QUE L'IMAGE FIXE (0,82 × la
     distance contre 1,10) : à ±0,315 les deux places extrêmes tombaient à
     8 % et 92 % de la colonne, c'est-à-dire au bord. Vérifié PAR
     PROJECTION, jamais à l'œil sur la capture. */
  var XP = [-0.27, -0.09, 0.09, 0.27], ZP = -0.135;
  var places = [];
  function place(i, g) { g.position.set(XP[i], 0, ZP); g.scale.setScalar(0.9); scene.add(g); places.push(g); return g; }

  /* 1 — l'étiquette : le prix est écrit, et il n'y a pas d'or. Le prix est
     dit en CERCLES, non en chiffres : deux mots de six pixels ne se lisent
     pas dans une colonne de cinq cents. */
  (function () {
    var g = new THREE.Group();
    var carteTex = tex(256, 256, function (c, w, h) {
      c.fillStyle = '#ded3b6'; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) { c.fillStyle = 'rgba(' + (rnd() < 0.5 ? '110,92,60' : '255,250,232') + ',' + (rnd() * 0.09) + ')'; c.fillRect(rnd() * w, rnd() * h, 2, 2); }
      c.strokeStyle = 'rgba(52,34,14,.75)'; c.lineWidth = 7;
      c.beginPath(); c.arc(92, 140, 40, 0, 6.2832); c.stroke();
      c.beginPath(); c.arc(168, 140, 40, 0, 6.2832); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(52, 62); c.lineTo(204, 62); c.stroke();
    });
    var carte = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.115, 0.006),
      std({ map: carteTex, color: 0xd8cfb8, roughness: 0.95 }));
    carte.position.y = 0.145; carte.rotation.x = -0.14; carte.castShadow = true; g.add(carte);
    var fil = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.10, 8), std({ color: 0x6a5a34, metalness: 0.7, roughness: 0.42 }));
    fil.position.y = 0.05; g.add(fil);
    var pied = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.012, 16), std({ color: 0x6a5a34, metalness: 0.7, roughness: 0.45 }));
    pied.position.y = 0.006; pied.castShadow = true; g.add(pied);
    place(0, g);
  })();

  /* 2 — le rail : la monnaie ne fait que passer. */
  (function () {
    var g = new THREE.Group();
    var bois = std({ color: 0x5a4429, roughness: 0.92 });
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.022, 0.062), bois);
    b.position.y = 0.011; b.castShadow = true; b.receiveShadow = true; g.add(b);
    [-1, 1].forEach(function (s) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.030, 0.062), std({ color: 0x8a6d2c, metalness: 0.8, roughness: 0.4 }));
      m.position.set(s * 0.087, 0.021, 0); m.castShadow = true; g.add(m);
    });
    place(1, g);
  })();

  /* 3 — le coffre : la monnaie s'arrête et se pétrifie. */
  (function () {
    var g = new THREE.Group();
    var fer = std({ color: 0x3f3a33, metalness: 0.55, roughness: 0.5 });
    var c = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.078, 0.095), fer);
    c.position.y = 0.039; c.castShadow = true; c.receiveShadow = true; g.add(c);
    var cv = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.135, 14, 1, false, 0, Math.PI), fer);
    cv.rotation.z = Math.PI / 2; cv.position.y = 0.078; cv.castShadow = true; g.add(cv);
    var lai = std({ color: 0x8a6d2c, metalness: 0.85, roughness: 0.36 });
    var s1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.086, 0.099), lai);
    s1.position.set(-0.042, 0.04, 0); g.add(s1);
    var s2 = s1.clone(); s2.position.x = 0.042; g.add(s2);
    var ser = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.030, 0.008), lai);
    ser.position.set(0, 0.042, 0.050); g.add(ser);
    place(2, g);
  })();

  /* 4 — le registre : la marchandise est partie, la valeur reste à venir. */
  (function () {
    var g = new THREE.Group();
    var papTex = tex(256, 256, function (c, w, h) {
      c.fillStyle = '#e2d7bb'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(60,42,20,.30)'; c.lineWidth = 2;
      for (var i = 1; i < 9; i++) { c.beginPath(); c.moveTo(18, i * 26); c.lineTo(w - 18, i * 26); c.stroke(); }
      c.strokeStyle = 'rgba(150,50,30,.55)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(w * 0.62, 10); c.lineTo(w * 0.62, h - 10); c.stroke();
      c.fillStyle = 'rgba(44,28,12,.62)';
      for (i = 1; i < 8; i++) c.fillRect(26, i * 26 - 8, 60 + rnd() * 60, 5);
    });
    var pap = std({ map: papTex, color: 0xd6ccb2, roughness: 0.96, side: THREE.DoubleSide });
    [-1, 1].forEach(function (s) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(0.088, 0.11), pap);
      p.rotation.x = -Math.PI / 2 + s * 0.16; p.rotation.z = 0;
      p.position.set(s * 0.045, 0.024 + Math.abs(s) * 0.004, 0);
      p.castShadow = true; p.receiveShadow = true; g.add(p);
    });
    var dos = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.016, 0.112), std({ color: 0x53301c, roughness: 0.9 }));
    dos.position.y = 0.012; dos.castShadow = true; g.add(dos);
    place(3, g);
  })();

  /* ── LA PIÈCE ─────────────────────────────────────────────────────────
     Une seule, et sa MATIÈRE dit son métier. */
  var pieceMat = std({ color: 0xd6a63c, metalness: 0.62, roughness: 0.30, transparent: true, opacity: 1 });
  /* La pièce et sa tranche ne font qu'un objet : séparées, elles se
     décalaient et l'on voyait un œuf. Et elle est TOUJOURS inclinée vers
     le regard — une pièce vue par la tranche n'est pas une pièce. */
  var sou = new THREE.Group(); scene.add(sou);
  var piece = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.012, 30), pieceMat);
  piece.castShadow = true; piece.receiveShadow = true; sou.add(piece);
  var tranche = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.005, 8, 30), pieceMat);
  tranche.rotation.x = Math.PI / 2; sou.add(tranche);

  var OR = new THREE.Color(0xd6a63c), CUIVRE = new THREE.Color(0x8c5a34), SPECTRE = new THREE.Color(0xbcd0dc);

  /* le billet : ce qui remplace la pièce quand la pièce peut manquer */
  var billetTex = tex(256, 128, function (c, w, h) {
    c.fillStyle = '#d9cfb4'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(48,34,16,.45)'; c.lineWidth = 3;
    c.strokeRect(9, 9, w - 18, h - 18);
    c.fillStyle = 'rgba(48,34,16,.42)';
    for (var i = 0; i < 5; i++) c.fillRect(26, 34 + i * 13, 70 + rnd() * 90, 4);
    c.strokeStyle = 'rgba(140,44,26,.5)'; c.lineWidth = 4;
    c.beginPath(); c.arc(w - 46, h - 40, 18, 0, 6.2832); c.stroke();
  });
  var billetMat = std({ map: billetTex, color: 0xd6cbaf, roughness: 0.96, transparent: true, opacity: 0, side: THREE.DoubleSide });
  var billet = new THREE.Mesh(new THREE.PlaneGeometry(0.105, 0.052), billetMat);
  billet.rotation.x = -Math.PI / 2 + 0.10; scene.add(billet);

  /* ── la chorégraphie ── */
  var st = { poser: 0, mesure: 0, cours: 0, vite: 0, tresor: 0, dette: 0, crise: 0, x: 0, y: 0, z: 0 };
  var G = 0, T = 0;
  var MAISON = V3(0, 0.075, 0.145);
  function set(g) { G = g; }
  function compute() {
    st.poser = ss(1.05, 1.85, G);          /* les quatre places paraissent */
    st.mesure = ss(2.12, 2.55, G) * (1 - ss(2.86, 3.15, G));
    st.cours = ss(2.90, 3.25, G) * (1 - ss(4.85, 5.15, G));
    st.vite = ss(3.35, 4.10, G) * (1 - ss(4.60, 4.90, G));
    st.tresor = ss(5.05, 5.35, G) * (1 - ss(5.45, 5.62, G));
    st.dette = ss(5.42, 5.70, G) * (1 - ss(5.86, 5.96, G));
    st.crise = ss(5.80, 5.99, G);
  }

  var P = V3();
  function frame(dt) {
    T += dt; compute();
    var i;

    for (i = 0; i < places.length; i++) {
      var v = ss(i * 0.16, 0.55 + i * 0.16, st.poser);
      places[i].visible = v > 0.02;
      places[i].scale.setScalar(0.9 * (0.25 + 0.75 * v));
      places[i].position.y = (1 - v) * -0.10;
    }

    /* la pièce va d'une place à l'autre ; au repos elle reste au milieu,
       devant, et tourne sur elle-même. */
    P.copy(MAISON);
    var cible = null, w = 0;
    function vers(i, p, haut) { if (p > w) { w = p; cible = V3(XP[i], haut, ZP + 0.055); } }
    vers(0, st.mesure, 0.245);
    vers(1, st.cours, 0.062);
    vers(2, st.tresor, 0.115);
    vers(3, st.dette, 0.055);
    if (cible) P.lerp(cible, w);
    /* le cours : elle va et vient sur le rail, de plus en plus vite —
       une même pièce sert plusieurs fois, il en faut d'autant moins. */
    if (st.cours > 0.02) {
      var vit = 0.55 + 4.2 * st.vite;
      P.x += Math.sin(T * vit) * 0.072 * st.cours;
    }
    /* la crise : les quatre places la réclament en même temps, et elle ne
       peut pas y être. */
    if (st.crise > 0.02) {
      var k = (T * 0.85) % 4, j = Math.floor(k), f = k - j;
      var a = V3(XP[j], 0.10, ZP + 0.055), b = V3(XP[(j + 1) % 4], 0.10, ZP + 0.055);
      P.lerp(a.lerp(b, f * f * (3 - 2 * f)), st.crise);
    }
    sou.position.copy(P);
    /* debout et de face quand elle est un signe (on la LIT), couchée quand
       elle est une chose (on la pose). */
    var debout = Math.max(st.mesure, st.dette * 0.4, st.crise);
    sou.rotation.x = lerp(0.28, 1.30, debout);
    sou.rotation.y = T * (0.35 + 1.9 * st.vite + 2.2 * st.crise);

    /* LA MATIÈRE DIT LE MÉTIER. Fantôme sur l'étiquette — mesurer ne
       demande aucun or ; cuivre usé sur le rail — circuler n'en demande
       qu'un semblant ; or plein au coffre et au registre. */
    var fant = st.mesure, jeton = st.cours * (1 - st.crise);
    pieceMat.color.copy(OR).lerp(SPECTRE, fant * 0.92).lerp(CUIVRE, jeton * 0.85);
    pieceMat.opacity = 1 - 0.66 * fant;
    pieceMat.transparent = fant > 0.01;
    pieceMat.metalness = lerp(0.62, 0.18, Math.max(fant, jeton * 0.5));
    pieceMat.roughness = lerp(0.30, 0.72, jeton);
    pieceMat.emissive = pieceMat.emissive || new THREE.Color(0, 0, 0);
    pieceMat.emissive.setRGB(0.16 * fant, 0.20 * fant, 0.24 * fant);
    piece.castShadow = fant < 0.4;

    /* le billet : il tient la place de la pièce là où un signe suffit. */
    var bv = Math.max(st.cours * st.vite * 0.9, st.dette) * (1 - st.crise);
    billet.visible = bv > 0.03;
    billetMat.opacity = bv;
    var bx = st.dette > st.cours * st.vite ? XP[3] : XP[1];
    billet.position.set(bx, 0.030, ZP + 0.075);
    billet.scale.setScalar(0.5 + 0.5 * bv);

    lampe.intensity = 1.35 * (1 + 0.022 * Math.sin(T * 5.1) + 0.016 * Math.sin(T * 2.4));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Les quatre places s'étendent de −0,38 à +0,38, VÉRIFIÉ PAR
       PROJECTION aux deux formats — la colonne collante étant la plus
       étroite (0,82 × la distance contre 1,10), c'est elle qui commande. */
    var dz = lerp(1.14, 1.05, ss(0, 1, Math.min(1, G / 2.5)));
    var camA = V3(0, lerp(0.105, 0.135, ss(1.5, 5.0, G)), ZP + 0.07);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.21), camA.y + 0.165 + 0.006 * Math.sin(T * 0.26), camA.z + dz);
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
