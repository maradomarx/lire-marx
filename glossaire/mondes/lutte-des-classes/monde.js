/* LE MONDE DE LA LUTTE DES CLASSES — les couches superposées.

   La figure est prise au texte, partie I du Manifeste : le prolétariat, « la
   dernière couche de la société actuelle, ne peut se redresser sans faire
   sauter toutes les couches superposées qui constituent la société
   officielle ». Une stèle de strates de pierre, en coupe, et cinq états :

     S0  l'ÉCHELLE GRADUÉE — neuf strates étagées, de la plus large en bas à
         la plus étroite en haut ;
     S1  la SIMPLIFICATION — les strates du milieu tombent au pied et s'y
         éparpillent, le haut se referme en un seul bloc, une fissure
         rougeoie entre les deux camps ;
     S2  l'ORGANISATION — les pierres éparses s'alignent en une assise, qui
         se fend un instant (la concurrence) et se ressoude plus haute ;
     S3  le REDRESSEMENT — l'assise se lève, et le bloc du haut saute ;
     S4  l'ASSOCIATION — toutes les pierres retombent côte à côte, au même
         niveau : le vertical devient horizontal.

   Chaque pierre garde son identité d'un état à l'autre : ce sont les MÊMES
   pierres qui ont été étagées, jetées, puis posées en rang — ce qui se voit
   est une réorganisation, pas un changement de décor. Tout est fonction de
   la position de lecture g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0b0806, 1);

  var scene = new THREE.Scene();
  /* le sol se fond dans le mur : sans brouillard, l'horizon coupait le cadre
     en deux et le sol, même écrit presque noir, sortait beige sous la lampe */
  scene.fog = new THREE.Fog(0x0b0806, 8, 17);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 11; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bump(a, b, v) { var t = (v - a) / (b - a); return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t); }

  /* ── le mur : un halo chaud derrière la stèle, qui ne vient de rien ── */
  var murTex = tex(512, 512, function (g, w, h) {
    var gr = g.createRadialGradient(w * 0.5, h * 0.56, 10, w * 0.5, h * 0.56, w * 0.62);
    gr.addColorStop(0, '#46321f'); gr.addColorStop(0.5, '#1f150d'); gr.addColorStop(1, '#0b0806');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(34, 20), new THREE.MeshBasicMaterial({ map: murTex, fog: false }));
  mur.position.set(0, 3.2, -6); scene.add(mur);

  /* ── le sol ── */
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x030202, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  /* ── la pierre : une texture GRISE (la couleur est celle du matériau —
     une texture qui porte déjà sa couleur, multipliée par un second brun,
     tombe au noir), un grain et de légères marbrures ── */
  var pierreTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#d6d0c6'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 1400; i++) { var v = 150 + rnd() * 90 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v - 8) + ',' + (0.18 + rnd() * 0.3) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 2); }
    /* des marbrures, pas des veines : des lignes longues se lisaient comme
       le fil d'un bois */
    for (i = 0; i < 60; i++) { var cx = rnd() * w, cy = rnd() * h, r = 8 + rnd() * 26; g.fillStyle = 'rgba(120,114,104,' + (0.03 + rnd() * 0.04) + ')'; g.beginPath(); g.ellipse(cx, cy, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, 6.3); g.fill(); }
  });
  pierreTex.wrapS = pierreTex.wrapT = THREE.RepeatWrapping;

  /* ── les pierres, et leurs cinq états ── */
  var KEYS = ['x', 'y', 'z', 'w', 'h', 'd', 'rx', 'ry', 'rz'];
  function S(o) { var r = { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1.1, rx: 0, ry: 0, rz: 0 }; for (var k in o) r[k] = o[k]; return r; }
  function mixS(a, b, t, out) { for (var i = 0; i < KEYS.length; i++) { var k = KEYS[i]; out[k] = a[k] + (b[k] - a[k]) * t; } return out; }
  var boite = new THREE.BoxGeometry(1, 1, 1);
  var pierres = [];
  function pierre(c0, c1) {
    var m = new THREE.Mesh(boite, new THREE.MeshStandardMaterial({ map: pierreTex, color: c0.clone(), roughness: 0.93 }));
    m.castShadow = true; m.receiveShadow = true; scene.add(m);
    var p = { m: m, S: [], c0: c0, c1: c1, cur: S({}) }; pierres.push(p); return p;
  }

  /* S0 : l'échelle graduée. Neuf strates, de la plus large (en bas) à la
     plus étroite (en haut) ; les teintes montent du brun sourd à l'ocre. */
  var NS = 9, Hs = [], Ys = [], yc = 0;
  for (var k = 0; k < NS; k++) { var hk = 0.27 + (rnd() - 0.5) * 0.05; Hs.push(hk); Ys.push(yc + hk / 2); yc += hk; }
  function W(k) { return 3.2 - 0.26 * k; }
  function teinteEchelle(k) { var t = k / (NS - 1); return new THREE.Color(lerp(0.095, 0.165, t), lerp(0.086, 0.132, t), lerp(0.074, 0.082, t)); }
  var cBas = new THREE.Color(0.10, 0.09, 0.078), cHaut = new THREE.Color(0.17, 0.128, 0.068), cRang = new THREE.Color(0.135, 0.115, 0.092);

  /* Les six strates du bas se fendent chacune en deux moitiés (12 pierres,
     « B ») ; les trois du haut restent entières (3 pierres, « T »). */
  var B = [], T = [];
  for (k = 0; k < 6; k++) for (var j = 0; j < 2; j++) {
    var p = pierre(teinteEchelle(k), cBas);
    p.S[0] = S({ x: (j ? 1 : -1) * W(k) / 4, y: Ys[k], w: W(k) / 2 - 0.006, h: Hs[k], d: 1.1 });
    /* la place au pied : les moitiés gauches à gauche, les droites à droite,
       les strates les plus hautes tombant le plus loin */
    p.slot = j ? 6 + k : 5 - k;
    B.push(p);
  }
  B.sort(function (a, b) { return a.slot - b.slot; });
  for (k = 6; k < NS; k++) { p = pierre(teinteEchelle(k), cHaut); p.S[0] = S({ x: 0, y: Ys[k], w: W(k), h: Hs[k], d: 1.1 }); T.push(p); }

  /* S1 : la simplification — des pierres éparses au pied, un bloc au-dessus */
  B.forEach(function (p, i) {
    var hh = 0.26 + rnd() * 0.2;
    p.S[1] = S({ x: -2.26 + i * 0.41 + (rnd() - 0.5) * 0.08, y: hh / 2, z: (rnd() - 0.5) * 0.3,
                 w: 0.32 + rnd() * 0.06, h: hh, d: 0.9 + rnd() * 0.2,
                 ry: (rnd() - 0.5) * 0.55, rz: (rnd() - 0.5) * 0.14 });
  });
  var BLOC_W = 1.9, BLOC_H = 0.3;
  T.forEach(function (p, i) { p.S[1] = S({ x: 0, y: 0.5 + BLOC_H / 2 + i * BLOC_H, w: BLOC_W, h: BLOC_H, d: 1.0 }); });

  /* S2 : l'organisation — une assise continue, et le bloc posé dessus */
  var PAS = 0.415, ASSISE = 0.56;
  B.forEach(function (p, i) { p.S[2] = S({ x: -2.28 + i * PAS, y: ASSISE / 2, w: PAS - 0.006, h: ASSISE, d: 1.05 }); });
  T.forEach(function (p, i) { p.S[2] = S({ x: 0, y: ASSISE + 0.01 + BLOC_H / 2 + i * BLOC_H, w: BLOC_W, h: BLOC_H, d: 1.0 }); });

  /* S3 : le redressement — l'assise se lève, le bloc saute */
  B.forEach(function (p, i) { p.S[3] = S({ x: -2.28 + i * PAS, y: 0.58, w: 0.30, h: 1.16, d: 1.0 }); });
  var VOL = [[-2.05, 2.35, 0.2, 0.3, 0.2, 0.95], [0.35, 2.85, -0.3, -0.35, 0.5, -0.7], [2.1, 2.15, 0.1, 0.25, -0.3, 1.25]];
  T.forEach(function (p, i) { var v = VOL[i]; p.S[3] = S({ x: v[0], y: v[1], z: v[2], w: 1.55, h: BLOC_H, d: 0.95, rx: v[3], ry: v[4], rz: v[5] }); });

  /* S4 : l'association — les quinze pierres posées côte à côte en un seul
     pavement, au même niveau (cinq sur trois) ; le haut d'hier est au milieu.
     Un rang unique se lisait comme une file de dominos, pas comme un sol. */
  var ordre = B.slice(0, 6).concat(T, B.slice(6));
  ordre.forEach(function (p, i) { p.S[4] = S({ x: -1.28 + (i % 5) * 0.64, y: 0.14, z: -0.64 + Math.floor(i / 5) * 0.64, w: 0.62, h: 0.28, d: 0.62 }); });

  /* la fissure entre les deux camps */
  var fissure = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x5a0c05, transparent: true, opacity: 0, depthWrite: false }));
  scene.add(fissure);

  /* ── la lumière : une lampe haute à gauche, un contre-jour froid et bas ── */
  var amb = new THREE.HemisphereLight(0xd8b48a, 0x3a2a1c, 0.55); scene.add(amb);
  /* un appoint de face, sans ombre : sans lui les faces tournées de la lampe
     tombaient au noir pur, et une pierre jetée n'était plus qu'une découpe */
  var appoint = new THREE.DirectionalLight(0xffe2bd, 0.45); appoint.position.set(3, 2, 6); scene.add(appoint);
  scene.add(new THREE.AmbientLight(0x3a2a1c, 0.6));
  var lampe = new THREE.DirectionalLight(0xffd6a0, 2.1);
  lampe.position.set(-4.5, 7.5, 5.5); lampe.castShadow = true;
  lampe.shadow.mapSize.set(2048, 2048);
  lampe.shadow.camera.left = -6; lampe.shadow.camera.right = 6; lampe.shadow.camera.top = 6; lampe.shadow.camera.bottom = -3;
  lampe.shadow.camera.near = 1; lampe.shadow.camera.far = 30; lampe.shadow.bias = -0.0008;
  scene.add(lampe);
  var contre = new THREE.DirectionalLight(0x8aa0b8, 0.35); contre.position.set(5, 2.5, -4); scene.add(contre);
  var braise = new THREE.PointLight(0xff5a2a, 0, 3.2, 2); scene.add(braise);

  /* ── chorégraphie ── */
  var G = 0, TT = 0;
  var st = { simpl: 0, orga: 0, redr: 0, assoc: 0, fente: 0, fiss: 0 };
  function set(g) { G = g; }
  function compute() {
    st.simpl = ss(2.0, 2.9, G);
    st.orga  = ss(3.1, 4.0, G);
    st.redr  = ss(4.1, 4.9, G);
    st.assoc = ss(5.0, 5.8, G);
    st.fente = bump(3.3, 3.8, G);
    st.fiss  = ss(0.4, 0.95, st.simpl) * (1 - ss(0.25, 0.7, st.redr));
  }

  var tmp = S({});
  function place(p, i, estT) {
    var c = p.cur;
    mixS(p.S[0], p.S[1], st.simpl, c);
    mixS(c, p.S[2], st.orga, tmp); for (var q = 0; q < KEYS.length; q++) c[KEYS[q]] = tmp[KEYS[q]];
    mixS(c, p.S[3], st.redr, tmp); for (q = 0; q < KEYS.length; q++) c[KEYS[q]] = tmp[KEYS[q]];
    mixS(c, p.S[4], st.assoc, tmp); for (q = 0; q < KEYS.length; q++) c[KEYS[q]] = tmp[KEYS[q]];
    if (!estT) {
      /* en tombant, les pierres du milieu s'écartent avant de toucher le sol */
      c.x += (p.slot < 6 ? -1 : 1) * 0.55 * bump(0, 1, st.simpl) * (Math.abs(p.slot - 5.5) / 5.5);
      /* la fente : l'assise s'ouvre au milieu, et les pierres se déchaussent */
      c.x += (i - 5.5) * 0.05 * st.fente;
      c.rz += (((i * 37) % 11) / 11 - 0.5) * 0.22 * st.fente;
      c.h *= 1 - 0.18 * st.fente; c.y *= 1 - 0.18 * st.fente;
    } else {
      /* les pierres jetées retombent en arc sur le rang */
      c.y += 0.9 * bump(0, 1, st.assoc);
    }
    p.m.position.set(c.x, c.y, c.z);
    p.m.rotation.set(c.rx, c.ry, c.rz);
    p.m.scale.set(c.w, c.h, c.d);
    p.m.material.color.copy(p.S0col || (p.S0col = p.c0.clone())).lerp(p.c1, st.simpl).lerp(cRang, st.assoc);
  }

  function frame(dt) {
    TT += dt; compute();
    B.forEach(function (p, i) { place(p, i, false); });
    T.forEach(function (p, i) { place(p, i, true); });

    /* la fissure suit le dessous du bloc */
    var t0 = T[0].cur;
    fissure.position.set(t0.x, t0.y - t0.h / 2 - 0.004, 0);
    fissure.scale.set(t0.w * 0.98, 0.034, 1.02);
    fissure.rotation.set(t0.rx, t0.ry, t0.rz);
    var flamme = 1 + 0.9 * bump(0, 0.5, st.redr);
    fissure.material.opacity = cl(st.fiss * (0.85 + 0.15 * Math.sin(TT * 2.3)));
    fissure.material.color.setRGB(0.55 * flamme, 0.07 * flamme, 0.025 * flamme);
    braise.position.set(t0.x, t0.y - t0.h / 2, 0.8);
    braise.intensity = 1.6 * st.fiss * flamme;

    /* au dernier temps, la lumière se fait égale */
    lampe.intensity = lerp(2.1, 2.5, st.assoc);
    amb.intensity = lerp(0.55, 0.7, st.assoc);

    /* la caméra : un léger trois-quarts à l'échelle, de face à la fissure,
       puis elle recule pour tenir le rang entier */
    var cy = lerp(lerp(lerp(1.55, 0.95, st.simpl), 1.45, st.redr), 0.2, st.assoc);
    /* l'échelle se tient en retrait : au large, à 6,3 elle passait sous la
       colonne de texte et son sommet sous le cartouche de légende */
    var dist = lerp(lerp(lerp(lerp(8.6, 6.9, st.simpl), 7.0, st.orga), 7.6, st.redr), 5.8, st.assoc);
    var az = lerp(lerp(-0.30, 0.22, ss(0.3, 1.9, G)), 0.08, st.simpl);
    var cible = new THREE.Vector3(0, cy, 0);
    camera.position.set(Math.sin(az) * dist + 0.03 * Math.sin(TT * 0.23), cy + lerp(1.15, 2.9, st.assoc) + 0.02 * Math.sin(TT * 0.31), Math.cos(az) * dist);
    /* au large, la colonne de texte couvre la gauche du cadre : on vise à
       GAUCHE du sujet pour le poser dans la moitié droite — plus fort pour
       l'échelle, haute et étroite, que pour le rang et le pavement, larges,
       qu'un décalage fixe sortait du cadre par la droite (au-delà de 75 %
       de la largeur le voile est levé). Sous 1100 px, la scène est une bande
       au-dessus du texte : rien à dégager. */
    var large = (canvas.clientWidth || 0) >= 1100;
    var fwd = new THREE.Vector3().subVectors(cible, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    aim.copy(cible).addScaledVector(right, large ? -lerp(0.31, 0.16, st.simpl) * camera.position.distanceTo(cible) : 0);
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
