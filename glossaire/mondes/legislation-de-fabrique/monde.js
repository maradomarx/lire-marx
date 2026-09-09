/* LE MONDE DE LA LÉGISLATION DE FABRIQUE — l'horloge publique.

   Ce chapitre est une leçon sur ce qui fait qu'une limite EXISTE : de 1802 à
   1833, trois lois sans un centime pour les exécuter sont restées lettre
   morte. Ce qui change en 1833 n'est pas le principe, déjà écrit, mais
   l'appareil — et la loi de 1844 le prescrit à la lettre : une horloge
   PUBLIQUE, que le fabricant ne règle pas, et sur laquelle la cloche de la
   fabrique doit se régler.

   La figure est donc UN SEUL INSTRUMENT, en gros plan : le cadran de la
   fabrique. Une plaque de fonte, un cadran, une aiguille — et rien pour la
   contredire. Un repère de laiton marque l'heure fixée : l'aiguille le
   dépasse et personne ne peut le prouver, parce qu'il n'y a rien à quoi la
   comparer.

   Puis un SECOND cadran, petit, est encastré dans le premier, plombé d'un
   sceau au bout d'un fil : c'est l'horloge publique. Dès lors l'écart entre
   les deux aiguilles est un ANGLE, c'est-à-dire une chose qui se voit et se
   consigne. Une plaque de laiton se visse sous le cadran — le corps
   d'inspection — et d'autres plaques suivent, une par industrie soumise.

   Au dernier temps il reste UN TROU DE VIS VIDE : la plaque qui n'a jamais
   été faite. Ce sont les cinq cents pieds cubes d'air, que la loi n'a pas
   imposés parce que les imposer aurait exproprié des milliers de petits
   capitalistes.

   Tout est fonction de g, donc réversible. Seuls le vacillement de la lampe
   et le battement de l'aiguille sont temporels. */
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.6, 4.6);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.02, 16);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 33391; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── LE MUR DE BRIQUE, juste ce qu'il faut derrière ── */
  var murTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#33251a'; g.fillRect(0, 0, w, h);
    for (var r = 0; r < 12; r++) for (var c = 0; c < 6; c++) {
      var dx = (r % 2) * 42, x = c * 85 + dx - 42, y = r * 43;
      g.fillStyle = 'rgba(' + (96 + rnd() * 34 | 0) + ',' + (66 + rnd() * 24 | 0) + ',' + (44 + rnd() * 18 | 0) + ',0.30)';
      g.fillRect(x + 3, y + 3, 79, 37);
    }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping; murTex.repeat.set(2.4, 2.4);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.6), std({ map: murTex, roughness: 1, color: 0x7e6b4e }));
  mur.position.set(0, 0, -0.20); mur.receiveShadow = true; scene.add(mur);

  /* ── LE CADRAN DE LA FABRIQUE ─────────────────────────────────────────
     Les chiffres sont DESSINÉS sur la texture, et c'est le seul endroit du
     dossier où du texte est légitime : un cadran porte des chiffres. */
  var R = 0.42;
  function cadranTex(n, gros) {
    return tex(1024, 1024, function (g, w, h) {
      var c = w / 2;
      g.fillStyle = '#e6dcc4'; g.beginPath(); g.arc(c, c, c * 0.98, 0, 6.3); g.fill();
      g.strokeStyle = '#2a2118'; g.lineWidth = w * 0.012;
      g.beginPath(); g.arc(c, c, c * 0.90, 0, 6.3); g.stroke();
      for (var i = 0; i < 60; i++) {
        var a = i / 60 * 6.283 - Math.PI / 2, gr = i % 5 === 0;
        g.strokeStyle = '#2a2118'; g.lineWidth = gr ? w * 0.011 : w * 0.004;
        var r1 = c * (gr ? 0.78 : 0.83), r2 = c * 0.89;
        g.beginPath(); g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
        g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2); g.stroke();
      }
      g.fillStyle = '#231b13'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '600 ' + (w * (gros ? 0.082 : 0.090)) + 'px Georgia, serif';
      var ROM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (var k = 0; k < 12; k++) {
        var a2 = k / 12 * 6.283 - Math.PI / 2;
        g.fillText(ROM[k], c + Math.cos(a2) * c * 0.700, c + Math.sin(a2) * c * 0.700);
      }
      if (n) { g.font = '600 ' + (w * 0.052) + 'px Georgia, serif'; g.fillStyle = '#4b3a22'; g.fillText(n, c, c + c * 0.40); }
    });
  }
  var boite = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.12, 48), std({ color: 0x201d18, metalness: 0.3, roughness: 0.56 }));
  boite.rotation.x = Math.PI / 2; boite.position.set(0, 0, -0.09); boite.castShadow = boite.receiveShadow = true; scene.add(boite);
  var cadran = new THREE.Mesh(new THREE.CircleGeometry(R, 64), std({ map: cadranTex('', false), roughness: 0.74, color: 0x8c8471 }));
  cadran.position.set(0, 0, -0.028); cadran.receiveShadow = true; scene.add(cadran);
  var lunette = new THREE.Mesh(new THREE.TorusGeometry(R + 0.012, 0.020, 10, 56), std({ color: 0x2a2620, metalness: 0.34, roughness: 0.5 }));
  lunette.position.set(0, 0, -0.024); lunette.castShadow = true; scene.add(lunette);

  var laiton = std({ color: 0x4e3a12, metalness: 0.46, roughness: 0.3 });
  var noirci = std({ color: 0x191510, metalness: 0.24, roughness: 0.6 });

  /* l'aiguille du fabricant, et le repère de laiton de l'heure fixée */
  var aigG = new THREE.Group(); aigG.position.set(0, 0, 0.006); scene.add(aigG);
  var aig = new THREE.Mesh(new THREE.BoxGeometry(0.026, R * 0.72, 0.010), noirci);
  aig.position.y = R * 0.30; aig.castShadow = true; aigG.add(aig);
  var contre = new THREE.Mesh(new THREE.BoxGeometry(0.032, R * 0.20, 0.010), noirci);
  contre.position.y = -R * 0.11; contre.castShadow = true; aigG.add(contre);
  var moyeu = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.022, 20), noirci);
  moyeu.rotation.x = Math.PI / 2; moyeu.position.set(0, 0, 0.010); moyeu.castShadow = true; scene.add(moyeu);
  var repere = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.100, 0.016), laiton);
  repere.castShadow = true; scene.add(repere);

  /* ── LE SECOND CADRAN : l'horloge publique, plombée ─────────────────
     Encastré dans le grand, EN BAS À DROITE : posé au centre il masquait le
     moyeu de la grande aiguille, et l'on ne voyait plus l'écart. */
  var pub = new THREE.Group(); pub.position.set(-R * 0.46, -R * 0.40, 0.004); pub.visible = false; scene.add(pub);
  var rp = 0.132;
  var pb = new THREE.Mesh(new THREE.CylinderGeometry(rp + 0.016, rp + 0.016, 0.05, 32), std({ color: 0x231f19, metalness: 0.3, roughness: 0.54 }));
  pb.rotation.x = Math.PI / 2; pb.castShadow = true; pub.add(pb);
  var pc = new THREE.Mesh(new THREE.CircleGeometry(rp, 48), std({ map: cadranTex('', true), roughness: 0.74, color: 0x8c8471 }));
  pc.position.z = 0.026; pub.add(pc);
  var pl = new THREE.Mesh(new THREE.TorusGeometry(rp + 0.006, 0.010, 8, 40), std({ color: 0x2a2620, metalness: 0.34, roughness: 0.5 }));
  pl.position.z = 0.028; pl.castShadow = true; pub.add(pl);
  var paigG = new THREE.Group(); paigG.position.z = 0.032; pub.add(paigG);
  var paig = new THREE.Mesh(new THREE.BoxGeometry(0.016, rp * 0.80, 0.007), noirci);
  paig.position.y = rp * 0.34; paig.castShadow = true; paigG.add(paig);
  /* le PLOMB au bout de son fil : c'est ce qui dit qu'on ne peut pas y
     toucher, et c'est tout l'argument du chapitre */
  var fil = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.11, 6), std({ color: 0x3a352c, metalness: 0.3, roughness: 0.6 }));
  fil.position.set(-rp * 0.72, -rp * 0.80, 0.030); fil.rotation.z = 0.5; pub.add(fil);
  var plomb = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.012, 18), std({ color: 0x2e2c28, metalness: 0.38, roughness: 0.44 }));
  plomb.rotation.x = Math.PI / 2; plomb.position.set(-rp * 0.98, -rp * 1.18, 0.030); plomb.castShadow = true; pub.add(plomb);

  /* ── LES PLAQUES VISSÉES SUR LA BOÎTE, et le trou resté vide ── */
  var NP = 5;
  var plaques = [], trous = [];
  var PY = -R - 0.20, PX0 = -0.40, PPAS = 0.170;
  for (var p0 = 0; p0 < NP; p0++) {
    var xx = PX0 + p0 * PPAS;
    var pq = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.052, 0.011), laiton);
    pq.position.set(xx, PY, -0.175); pq.castShadow = true; pq.visible = false; scene.add(pq); plaques.push(pq);
    var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.024, 12), std({ color: 0x0d0b08, roughness: 0.95 }));
    tr.rotation.x = Math.PI / 2; tr.position.set(xx, PY, -0.192); tr.visible = false; scene.add(tr); trous.push(tr);
  }
  /* le SIXIÈME trou, au bout de la rangée, qui ne recevra jamais sa plaque */
  var trouVide = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.028, 12), std({ color: 0x0b0906, roughness: 0.96 }));
  trouVide.rotation.x = Math.PI / 2;
  trouVide.position.set(PX0 + NP * PPAS, PY, -0.190);
  trouVide.visible = false; scene.add(trouVide);

  /* ── LA CLOCHE, réglée sur l'horloge publique ── */
  var cloche = new THREE.Group(); cloche.position.set(-R - 0.20, R * 0.52, -0.10); cloche.visible = false; scene.add(cloche);
  var cl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.072, 0.098, 20, 1, true), std({ color: 0x453210, metalness: 0.46, roughness: 0.34, side: THREE.DoubleSide }));
  cl1.castShadow = true; cloche.add(cl1);
  var cl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.05, 8), std({ color: 0x2a2620, metalness: 0.3, roughness: 0.5 }));
  cl2.position.y = 0.072; cloche.add(cl2);
  var cordon = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 1, 6), std({ color: 0x5a3a1c, roughness: 0.92 }));
  cordon.visible = false; scene.add(cordon);

  /* ── LA LUMIÈRE ── */
  scene.add(new THREE.AmbientLight(0x34291c, 0.44));
  var lampe = new THREE.PointLight(0xffc287, 1.18, 3.6, 1.45);
  lampe.position.set(-0.52, 0.86, 1.02);
  lampe.castShadow = true; lampe.shadow.bias = -0.0010; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var froide = new THREE.DirectionalLight(0x92a8c4, 0.24); froide.position.set(1.2, 0.6, 1.1); scene.add(froide);
  var fond = new THREE.PointLight(0xd2a068, 0.30, 2.8, 1.5); fond.position.set(0.2, -0.5, 0.5); scene.add(fond);

  /* ── CHORÉGRAPHIE ── */
  var G = 0, T = 0;
  var st = { vol: 0, publique: 0, plaque: 0, generalise: 0, vide: 0, lueur: 0 };
  function set(g) { G = g; }
  function compute() {
    st.vol        = ss(0.85, 1.95, G);   /* l'aiguille dépasse le repère */
    st.publique   = ss(2.05, 2.90, G);   /* le second cadran, plombé */
    st.plaque     = ss(3.05, 3.75, G);   /* la première plaque, la cloche */
    st.generalise = ss(4.10, 4.95, G);   /* les autres plaques */
    st.vide       = ss(5.20, 5.85, G);   /* le trou resté vide */
    st.lueur      = ss(5.05, 5.80, G);
  }

  /* l'heure fixée par l'avis : cinq heures du soir, soit -30° depuis XII */
  var A_LOI = -Math.PI * 2 * (4 / 12);
  function frame(dt) {
    T += dt; compute();

    /* LE REPÈRE DE LAITON : l'heure que l'avis affiche */
    repere.position.set(Math.sin(-A_LOI) * (R * 0.955), Math.cos(-A_LOI) * (R * 0.955), 0.004);
    repere.rotation.z = A_LOI;

    /* L'AIGUILLE DU FABRICANT le dépasse, et rien ne le contredit. Le
       battement est temporel mais son AMPLITUDE tient à la fenêtre. */
    var vol = st.vol * (1 - 0.55 * st.plaque);
    var trem = 0.006 * Math.sin(T * 1.7) * st.vol;
    aigG.rotation.z = A_LOI - vol * 0.52 + trem;

    /* LE SECOND CADRAN : plombé, et son aiguille reste sur l'heure fixée.
       L'ÉCART DEVIENT UN ANGLE — c'est-à-dire une chose qui se consigne. */
    pub.visible = st.publique > 0.04;
    pub.scale.setScalar(0.4 + 0.6 * cl(st.publique / 0.45));
    paigG.rotation.z = A_LOI;

    /* LA PREMIÈRE PLAQUE, et la cloche qu'un cordon relie au cadran public */
    var k1 = st.plaque;
    plaques[0].visible = k1 > 0.10; trous[0].visible = k1 > 0.04;
    plaques[0].scale.setScalar(0.35 + 0.65 * cl((k1 - 0.10) / 0.4));
    cloche.visible = k1 > 0.35;
    cloche.scale.setScalar(0.4 + 0.6 * cl((k1 - 0.35) / 0.4));
    var cv = k1 > 0.55;
    cordon.visible = cv;
    if (cv) {
      var A = V3(cloche.position.x, cloche.position.y + 0.02, -0.04);
      var B = V3(-R - 0.02, 0.02, -0.03);   /* le bord de la boîte, jamais la face */
      var mid = A.clone().add(B).multiplyScalar(0.5);
      var dv = new THREE.Vector3().subVectors(B, A);
      cordon.position.copy(mid); cordon.scale.set(1, dv.length(), 1);
      cordon.quaternion.setFromUnitVectors(V3(0, 1, 0), dv.clone().normalize());
    }

    /* LES AUTRES PLAQUES : une par industrie soumise */
    for (var i = 1; i < NP; i++) {
      var seuil = (i - 1) / (NP - 1) * 0.72;
      var f = cl((st.generalise - seuil) / 0.28);
      plaques[i].visible = f > 0.04; trous[i].visible = f > 0.02;
      plaques[i].scale.setScalar(0.35 + 0.65 * f);
    }

    /* LE TROU RESTÉ VIDE : la plaque qui n'a jamais été faite */
    trouVide.visible = st.vide > 0.06;
    trouVide.scale.setScalar(0.4 + 0.6 * cl(st.vide / 0.5));

    lampe.intensity = 1.18 * (1 + 0.022 * Math.sin(T * 6.4) + 0.012 * Math.sin(T * 2.6));
    fond.intensity = 0.30 + 0.52 * st.lueur;

    /* LA CAMÉRA. Un cadran de 0,94 unité de diamètre, plus les plaques et la
       cloche : l'ensemble tient dans un carré de 1,45. Une figure CIRCULAIRE
       est la seule qui se cadre aussi bien en portrait qu'en paysage, et
       c'est pourquoi elle a été choisie ici — la hauteur vue en paysage vaut
       0,69 fois la distance, la largeur en portrait 0,82 : il faut 2,10.
       La caméra se rapproche du second cadran quand il paraît, puis recule
       pour montrer la couronne de plaques. */
    var q = ss(0, 1, Math.min(1, G / 2.2));
    var d = lerp(2.16, 1.88, q);
    d = lerp(d, 2.26, st.generalise);
    var camA = V3(lerp(-0.01, 0.04, q) * (1 - st.generalise),
                  lerp(0.03, -0.06, q) * (1 - st.generalise), 0);
    camera.position.set(camA.x + 0.006 * Math.sin(T * 0.26), camA.y + 0.005 * Math.sin(T * 0.32), camA.z + d);
    camera.lookAt(camA);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h2 = canvas.clientHeight; if (!w || !h2) return;
    renderer.setSize(w, h2, false); camera.aspect = w / h2;
    camera.fov = w / h2 > 1.2 ? 38 : Math.min(70, 2 * Math.atan(Math.tan(50 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
