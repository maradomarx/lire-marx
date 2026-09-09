/* LE MONDE DU CAPITAL CONSTANT ET VARIABLE — le comptoir, et les deux piles.

   Le chapitre VIII ne classe pas des choses, il compare deux COMPORTEMENTS
   DE GRANDEUR. Une figure ne peut donc pas se contenter de montrer du
   coton et un ouvrier : il faut qu'on puisse COMPTER, et voir que d'un
   côté rien ne s'ajoute tandis que de l'autre quelque chose naît.

   D'où les pièces. Une avance en une seule colonne, indistincte — c'est
   ainsi qu'elle figure dans les livres. Elle se partage : à gauche ce qui
   deviendra coton et broches, à droite ce qui paiera la journée. Les deux
   sont dépensées, et le comptoir reste vide. Puis le produit se monte, et
   il se monte de deux manières : les pièces SOMBRES REPARAISSENT — elles
   sont exactement celles qui étaient entrées, une métempsycose, le mot est
   de Marx — tandis que les pièces CLAIRES ne viennent d'aucune pile : elles
   se forment au-dessus et tombent. Elles remboursent d'abord ce qu'a coûté
   la journée, puis continuent.

   L'anneau sur la tige marque l'AVANCE. Ce qui dépasse est la plus-value.
   Au cinquième temps on double le prix du coton : la part sombre double,
   la colonne monte d'autant, l'anneau monte d'autant — et l'écart entre
   l'anneau et le sommet ne bouge pas d'une pièce. C'est la démonstration
   du chapitre, faite en déplaçant une seule chose.

   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.9, 4.6);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 40961; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── le comptoir ── */
  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#4a3826'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 200; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '28,19,10' : '116,94,64') + ',' + (0.05 + rnd() * 0.17) + ')';
      g.lineWidth = 0.6 + rnd() * 2.6; g.beginPath();
      var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 28) g.lineTo(x, y + Math.sin(x * 0.013 + i) * 4);
      g.stroke();
    }
  });
  var comptoir = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 0.80),
    std({ map: boisTex, color: 0x9c8666, roughness: 0.84 }));
  comptoir.position.set(0, -0.07, -0.04); comptoir.receiveShadow = true; scene.add(comptoir);
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), std({ color: 0x140f0a, roughness: 1 }));
  fond.position.set(0, 0.8, -0.66); scene.add(fond);

  scene.add(new THREE.AmbientLight(0xffe6c2, 0.30));
  var lampe = new THREE.PointLight(0xffd9a8, 1.55, 3.2, 2);
  lampe.position.set(-0.20, 0.92, 0.40); lampe.castShadow = true;
  lampe.shadow.mapSize.set(1024, 1024); lampe.shadow.bias = -0.0016; scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0x9db8d8, 0.34);
  appoint.position.set(1.5, 0.8, 0.9); scene.add(appoint);

  /* ── LES PIÈCES ───────────────────────────────────────────────────────
     SOMBRE = ce qui ne fait que reparaître. CLAIR = ce qui naît. La
     distinction ne se dit ni par une étiquette ni par une flèche : elle se
     lit sur la colonne, où les deux matières sont empilées l'une sur
     l'autre et où l'on compte. */
  var RP = 0.050, EP = 0.0175;
  var geoP = new THREE.CylinderGeometry(RP, RP, 0.013, 22);
  /* MÉTAL SANS ENVIRONNEMENT = NOIR. Un `metalness` proche de 1 ne rend
     que ce qu'il réfléchit, et il n'y a rien à réfléchir ici : les pièces
     claires sortaient plus sombres que les sombres, ce qui inversait
     l'argument. On descend le métal et l'on garde la couleur. */
  var matSombre = std({ color: 0x9a6522, metalness: 0.50, roughness: 0.44 });
  var matClair = std({ color: 0xe8e5da, metalness: 0.42, roughness: 0.28 });
  function pile(n, mat) {
    var g = new THREE.Group(); scene.add(g);
    for (var i = 0; i < n; i++) {
      var m = new THREE.Mesh(geoP, mat);
      m.castShadow = true; m.receiveShadow = true;
      m.position.set((rnd() - 0.5) * 0.004, i * EP + EP * 0.5, (rnd() - 0.5) * 0.004);
      m.rotation.y = rnd() * 3.14; g.add(m);
    }
    return g;
  }
  var XC = -0.21, XV = -0.055, XP = 0.205, XT = 0.365, ZP = 0.05;
  var srcC = pile(16, matSombre), srcV = pile(4, matClair);
  var prodD = pile(16, matSombre), prodB = pile(8, matClair);
  srcC.position.set(XC, 0, ZP); srcV.position.set(XV, 0, ZP);
  prodD.position.set(XP, 0, ZP); prodB.position.set(XP, 0, ZP);

  /* ── ce que l'avance achète : le coton et les broches ── */
  var gMoyens = new THREE.Group(); gMoyens.position.set(XC, 0, ZP - 0.02); scene.add(gMoyens);
  var balle = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.135, 0.135),
    std({ color: 0xb8ad92, roughness: 0.97 }));
  balle.position.y = 0.068; balle.castShadow = true; balle.receiveShadow = true; gMoyens.add(balle);
  var corde = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.0055, 6, 20), std({ color: 0x4d3d26, roughness: 1 }));
  corde.rotation.y = Math.PI / 2; corde.position.y = 0.068; gMoyens.add(corde);
  var broche = new THREE.Group(); broche.position.set(0.145, 0, 0.02); gMoyens.add(broche);
  (function () {
    var t = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.20, 10), std({ color: 0x50555c, metalness: 0.7, roughness: 0.44 }));
    t.position.y = 0.10; t.castShadow = true; broche.add(t);
    var s = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.075, 16), std({ color: 0xcfc6ab, roughness: 0.93 }));
    s.position.y = 0.085; s.castShadow = true; broche.add(s);
    var p = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.011, 16), std({ color: 0x4a3826, roughness: 0.9 }));
    p.position.y = 0.006; broche.add(p);
  })();

  /* ── LA TIGE ET L'ANNEAU : l'anneau marque l'AVANCE, ce qui dépasse est
     la plus-value. Rien d'autre n'est écrit — un chiffre serait une
     légende, l'anneau est une mesure. ── */
  var tige = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.62, 10),
    std({ color: 0x8a6d2c, metalness: 0.82, roughness: 0.38 }));
  tige.position.set(XT, 0.31, ZP); tige.castShadow = true; scene.add(tige);
  var socle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.018, 18),
    std({ color: 0x7d6228, metalness: 0.8, roughness: 0.42 }));
  socle.position.set(XT, 0.009, ZP); socle.castShadow = true; scene.add(socle);
  var anneau = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.006, 8, 20),
    std({ color: 0xd2a648, metalness: 0.9, roughness: 0.26 }));
  anneau.rotation.x = Math.PI / 2; anneau.position.set(XT, 0.2, ZP); anneau.castShadow = true; scene.add(anneau);
  var barre = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.0045, 0.0045),
    std({ color: 0xd2a648, metalness: 0.9, roughness: 0.26 }));
  barre.position.set(XT - 0.078, 0.2, ZP); scene.add(barre);
  /* l'écart : ce qui dépasse l'avance, et qui ne bouge pas quand on double
     le prix du coton — c'est la seule chose que la scène met en évidence. */
  function crochet(mat) {
    var g = new THREE.Group(); scene.add(g);
    var v = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), mat);
    v.position.set(XT - 0.062, 0, ZP); g.add(v);
    var a = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.006, 0.006), mat);
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.006, 0.006), mat);
    a.position.set(XT - 0.083, 0, ZP); b.position.set(XT - 0.083, 0, ZP);
    g.add(a); g.add(b);
    return { g: g, v: v, a: a, b: b };
  }
  var ecartMat = new THREE.MeshBasicMaterial({ color: 0xffb022, transparent: true, opacity: 0 });
  /* LE TÉMOIN : le même écart, à la hauteur qu'il avait AVANT qu'on double
     le prix du coton. Deux crochets de longueur identique à deux hauteurs
     différentes — c'est la démonstration du chapitre, lisible d'un coup
     d'œil, et elle ne tient pas sans le second. */
  var temoinMat = new THREE.MeshBasicMaterial({ color: 0xffb022, transparent: true, opacity: 0 });
  var EC = crochet(ecartMat), TE = crochet(temoinMat);

  /* ── la chorégraphie ── */
  var NC0 = 8, NV0 = 4, NPL = 4;
  var st = { sep: 0, depense: 0, travail: 0, epreuve: 0, nomme: 0, nC: 0, nV: 0, nPd: 0, nPb: 0, avance: 0 };
  var G = 0, T = 0;
  function set(g) { G = g; }
  function compute() {
    st.sep = ss(1.02, 1.78, G);          /* l'avance se partage           */
    st.depense = ss(2.10, 2.80, G);      /* les deux parts sont dépensées */
    st.travail = ss(3.05, 4.20, G);      /* le produit se monte           */
    st.epreuve = ss(4.85, 5.45, G);      /* on double le prix du coton    */
    st.nomme = ss(5.45, 5.95, G);        /* la part qui dépasse s'éclaire */
    var c = NC0 * (1 + st.epreuve);      /* 8 pièces, puis 16             */
    st.nC = c * (1 - st.depense);
    st.nV = NV0 * (1 - st.depense);
    /* LA PART SOMBRE NE FAIT QUE REPARAÎTRE : autant qu'il en est entré,
       jamais une de plus. La part claire, elle, rembourse la journée puis
       continue. */
    st.nPd = c * st.travail;
    st.nPb = (NV0 + NPL) * st.travail;
    st.avance = c + NV0;                 /* l'anneau                      */
  }

  function poser(g, n, base) {
    var k = Math.ceil(n - 1e-6), f = n - Math.floor(n);
    for (var i = 0; i < g.children.length; i++) {
      var m = g.children[i];
      m.visible = i < k;
      if (!m.visible) continue;
      var haut = (i === k - 1 && f > 0.001) ? f : 1;
      m.scale.set(1, haut, 1);
      m.position.y = base + i * EP + EP * 0.5 * haut;
    }
  }

  function frame(dt) {
    T += dt; compute();

    /* l'avance : une seule colonne tant qu'on ne l'a pas partagée */
    srcC.position.x = lerp(-0.225, XC, st.sep);
    srcV.position.x = lerp(-0.225, XV, st.sep);
    var enfoui = -0.16 * st.depense;
    poser(srcC, st.nC, enfoui);
    poser(srcV, st.nV, lerp(NC0 * EP, 0, st.sep) + enfoui);
    /* indistinctes tant qu'elles sont ensemble : c'est ainsi qu'elles
       figurent dans les livres du capitaliste. */
    matSombre.color.setHex(0x7a5326);
    matClair.color.set(0xc6c4bc).lerp(new THREE.Color(0x7a5326), (1 - st.sep) * 0.85);

    gMoyens.visible = st.depense > 0.03;
    var reste = 1 - st.travail;
    balle.scale.set(0.35 + 0.65 * reste, 0.35 + 0.65 * reste, 0.35 + 0.65 * reste);
    balle.position.y = 0.068 * (0.35 + 0.65 * reste);
    corde.position.y = balle.position.y; corde.scale.setScalar(0.35 + 0.65 * reste);
    gMoyens.scale.setScalar(0.25 + 0.75 * st.depense);
    gMoyens.position.y = (1 - st.depense) * -0.12;
    broche.rotation.y = T * (0.4 + 3.6 * (st.travail > 0.02 && st.travail < 0.98 ? 1 : 0));

    poser(prodD, st.nPd, 0);
    poser(prodB, st.nPb, st.nPd * EP);

    /* l'anneau : le niveau de l'avance. Et la barre qui le prolonge vers
       la colonne, pour qu'on lise la mesure sur les pièces. */
    var yA = st.avance * EP * Math.min(1, st.travail / 0.55);
    anneau.position.y = yA; barre.position.y = yA;
    /* LA TIGE NE PARAÎT QU'AVEC CE QU'ELLE MESURE : plantée dès le début,
       elle occupait le quart droit du cadre sans rien dire. */
    var vis = ss(0.12, 0.4, st.travail);
    anneau.visible = barre.visible = vis > 0.02;
    var tv = ss(0.02, 0.30, st.travail);
    tige.visible = socle.visible = tv > 0.02;
    tige.scale.y = 0.05 + 0.95 * tv; tige.position.y = 0.31 * tige.scale.y;
    var sommet = (st.nPd + st.nPb) * EP;
    function poseCrochet(C, bas, haut) {
      C.v.scale.y = Math.max(0.001, haut - bas);
      C.v.position.y = (haut + bas) / 2;
      C.a.position.y = haut; C.b.position.y = bas;
    }
    EC.g.visible = st.nomme > 0.02;
    ecartMat.opacity = 0.95 * st.nomme;
    poseCrochet(EC, yA, sommet);
    var y0 = (NC0 + NV0) * EP, s0 = (NC0 + NV0 + NPL) * EP;
    TE.g.visible = st.nomme > 0.02 && st.epreuve > 0.5;
    temoinMat.opacity = 0.34 * st.nomme;
    poseCrochet(TE, y0, s0);
    matClair.emissive = matClair.emissive || new THREE.Color(0, 0, 0);
    matClair.emissive.setRGB(0.10 * st.nomme, 0.075 * st.nomme, 0.03 * st.nomme);

    lampe.intensity = 1.55 * (1 + 0.022 * Math.sin(T * 5.1) + 0.016 * Math.sin(T * 2.3));

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Colonne collante (portrait) comme image fixe (paysage) : la scène
       s'étend de −0,42 à +0,46, VÉRIFIÉ PAR PROJECTION aux deux formats.
       La colonne est la plus étroite des deux — 0,82 × la distance contre
       1,10 — c'est donc elle qui commande. */
    var dz = lerp(1.30, 1.18, ss(0, 1, Math.min(1, G / 3)));
    var camA = V3(0.055, lerp(0.20, 0.30, ss(2.6, 5.2, G)), ZP - 0.02);
    camera.position.set(camA.x + 0.009 * Math.sin(T * 0.21), camA.y + 0.20 + 0.006 * Math.sin(T * 0.26), camA.z + dz);
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
