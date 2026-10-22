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
  renderer.setClearColor(0x0d0907, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.14; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0d0907, 2.4, 5.2);
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
  /* Octobre 2026 : le sol était noir et tenait la moitié basse du cadre.
     La caméra le regarde maintenant de plus haut, et il reçoit la lueur
     du mur (la lumière de contre-jour) : la masse y pose son ombre vers
     nous, et elle repose enfin sur quelque chose. */
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0),
    std({ map: dalle, color: 0xb0a48e, roughness: 0.92, emissive: 0x5a3818, emissiveMap: dalle }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; sol.material.envMapIntensity = 0.2; scene.add(sol);
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
  /* LE MUR NE JOUAIT PLUS (mesuré en octobre 2026 : 35 sur 255 derrière
     la masse, autant qu'au bord) — la silhouette ne se découpait sur rien
     et le fer animé passait pour un aplat gris. Sa lueur est maintenant
     CENTRÉE DERRIÈRE LA MASSE, comme la gueule d'un four qu'on ne voit
     pas : elle reste constante et indépendante de la flamme, et c'est
     contre elle que les roues se lisent, dents comprises. */
  var lueur = tex(512, 256, function (g, w, h) {
    g.drawImage(platre.image, 0, 0, w, h);
    g.globalCompositeOperation = 'multiply';
    var r = g.createRadialGradient(w * 0.5, h * 0.70, 0, w * 0.5, h * 0.70, w * 0.42);
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.45, '#9a8e80'); r.addColorStop(1, '#2a2622');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7),
    std({ map: platre, color: 0x6f6350, roughness: 0.97, emissive: 0xe0843a, emissiveMap: lueur }));
  mur.position.set(0, 0.62, -0.42); mur.receiveShadow = true; mur.material.envMapIntensity = 0.2; scene.add(mur);

  /* ── LA VEILLEUSE : sans elle, la première scène tombe au noir absolu et
     l'on ne voit plus la masse — c'est-à-dire la moitié de l'argument.
     Elle est froide, faible, et ne vient de nulle part. ── */
  scene.add(new THREE.AmbientLight(0xbcc8d8, 0.16));
  var lune = new THREE.DirectionalLight(0x8ba4c6, 0.24);
  lune.position.set(-1.4, 1.2, 0.9); scene.add(lune);

  /* LE CONTRE-JOUR : la lueur du mur éclaire aussi ce qui est devant lui.
     Elle découpe le bord des dents et pose sur le sol l'ombre de la masse,
     vers nous. Sans elle, la silhouette n'avait pas d'arête. */
  var contre = new THREE.DirectionalLight(0xff9a4a, 0.85);
  contre.position.set(0.35, 0.95, -1.3); contre.target.position.set(0, 0.15, 0.2);
  contre.castShadow = true; contre.shadow.mapSize.set(1024, 1024); contre.shadow.bias = -0.0012;
  contre.shadow.camera.left = -0.9; contre.shadow.camera.right = 0.9; contre.shadow.camera.top = 0.9; contre.shadow.camera.bottom = -0.9;
  contre.shadow.camera.near = 0.2; contre.shadow.camera.far = 3.2;
  scene.add(contre); scene.add(contre.target);

  /* CE QUE LE FER REFLÈTE. Un métal sans environnement n'a rien à
     réfléchir : la masse animée tombait en aplat gris. Un équirectangle
     dessiné — noir, la lueur du mur derrière, un peu de jour froid en haut
     — donne au fer éveillé ses reflets, et à la rouille presque rien
     (l'intensité suit l'éveil, plus bas). */
  var envTex = tex(512, 256, function (g, w, h) {
    g.fillStyle = '#060504'; g.fillRect(0, 0, w, h);
    var r = g.createRadialGradient(w * 0.25, h * 0.48, 0, w * 0.25, h * 0.48, w * 0.22);
    r.addColorStop(0, 'rgba(255,170,90,1)'); r.addColorStop(0.5, 'rgba(200,110,50,.55)'); r.addColorStop(1, 'rgba(120,60,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
    var c = g.createLinearGradient(0, 0, 0, h * 0.35);
    c.addColorStop(0, 'rgba(150,170,200,.35)'); c.addColorStop(1, 'rgba(150,170,200,0)');
    g.fillStyle = c; g.fillRect(0, 0, w, h * 0.35);
    /* derrière la caméra, un gris d'acier : c'est ce que les faces
       tournées vers nous reflètent, et c'est ce qui fait du fer éveillé
       un fer CLAIR, distinct de la rouille brune. */
    var f = g.createRadialGradient(w * 0.75, h * 0.62, 0, w * 0.75, h * 0.62, w * 0.24);
    f.addColorStop(0, 'rgba(160,166,178,.50)'); f.addColorStop(0.6, 'rgba(100,102,110,.25)'); f.addColorStop(1, 'rgba(60,60,64,0)');
    g.fillStyle = f; g.fillRect(0, 0, w, h);
  });
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envRT = pmrem.fromEquirectangular(envTex);
  scene.environment = envRT.texture; pmrem.dispose(); envTex.dispose();

  /* ── LA MASSE ─────────────────────────────────────────────────────────
     Du travail humain accumulé : un arbre de couche, des roues, un socle,
     une poutre. Chaque pièce a SA matière, parce que chacune se rouille
     et s'éveille pour son compte, selon ce que la flamme atteint. */
  var ROUILLE = new THREE.Color(0x3c2110), FER = new THREE.Color(0x9aa0aa);
  var pieces = [];
  /* la fonte des pièces fixes : un grain marbré, sans quoi le socle était
     un aplat au premier plan. */
  var fonte = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 2600; k++) {
      var v = 140 + Math.floor(rnd() * 115), rr = 1 + rnd() * 3;
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.25 + rnd() * 0.35) + ')';
      g.beginPath(); g.arc(rnd() * w, rnd() * h, rr, 0, 6.2832); g.fill();
    }
    for (k = 0; k < 700; k++) { g.fillStyle = 'rgba(40,24,12,' + (rnd() * 0.25) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
  function fer(mesh, tourne, vitesse, venue) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.material = std({ color: ROUILLE.clone(), roughness: 0.98, metalness: 0.16, map: fonte });
    scene.add(mesh);
    pieces.push({ m: mesh, tourne: !!tourne, v: vitesse || 1, venue: venue || 0, ang: 0, base: mesh.position.clone(), ech: mesh.scale.x });
    return mesh;
  }
  /* LA FACE TOURNÉE. Une roue plate rendait un aplat, quelle que soit sa
     matière : le fer éveillé passait pour du carton gris. Des stries
     concentriques de tour, une couronne plus sombre et le moyeu donnent à
     la face son modelé — la rouille y prend ses piqûres, le fer ses
     reflets qui tournent avec lui. */
  var tourne = tex(256, 256, function (g, w, h) {
    var c = w / 2;
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 90; k++) {
      var rr = (k / 90) * c, v = 190 + Math.floor(rnd() * 60);
      g.strokeStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(c, c, rr, 0, 6.2832); g.stroke();
    }
    var o = g.createRadialGradient(c, c, c * 0.55, c, c, c);
    o.addColorStop(0, 'rgba(0,0,0,0)'); o.addColorStop(0.82, 'rgba(0,0,0,.18)'); o.addColorStop(1, 'rgba(0,0,0,.42)');
    g.fillStyle = o; g.fillRect(0, 0, w, h);
    var s = g.createLinearGradient(0, 0, w, h);
    s.addColorStop(0, 'rgba(255,255,255,.16)'); s.addColorStop(0.5, 'rgba(255,255,255,0)'); s.addColorStop(1, 'rgba(0,0,0,.20)');
    g.fillStyle = s; g.fillRect(0, 0, w, h);
    for (k = 0; k < 900; k++) { g.fillStyle = 'rgba(40,24,12,' + (rnd() * 0.22) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
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
    var mat = std({ color: ROUILLE.clone(), roughness: 0.98, metalness: 0.16, map: tourne });
    /* les dents et la jante prennent la fonte : la face tournée, posée sur
       une dent, en faisait une bille */
    var matD = std({ color: ROUILLE.clone(), roughness: 0.98, metalness: 0.16, map: fonte });
    g.traverse(function (o) { if (o.isMesh) { o.material = o.geometry.type === 'BoxGeometry' ? matD : [matD, mat, mat]; o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    return { g: g, mat: mat, matD: matD };
  }
  var ROUES = [];
  function ajoutRoue(x, y, z, r, ep, dents, vitesse, venue) {
    var R = roue(x, y, z, r, ep, dents);
    ROUES.push({ o: R.g, mat: R.mat, matD: R.matD, v: vitesse, venue: venue || 0, ang: 0, ech: 1, pos: V3(x, y, z) });
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
  /* toneMapped:false — sous ACES la flamme additive était écrasée, et
     posée sur le fer éclairé ou le dessus du socle elle disparaissait. */
  var flMat = new THREE.MeshBasicMaterial({ map: flTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1, toneMapped: false });
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
    /* la phase n'a pas de sens propre (l'angle accumulé dépend de la
       vitesse de lecture) ; elle est choisie pour que l'image fixe prenne
       la flamme en haut de son orbite, sur le fer, et non au ras du socle
       où elle se perdait. */
    var a = ROUES[0].ang * 0.55 - 0.62;
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
    /* Octobre 2026 : 0,27 et non plus 0,21. Vue de plus haut, la flamme
       basse sur son orbite passait DERRIÈRE le bloc posé au premier plan
       (son angle avance jusqu'à z = 0,24) et l'image fixe la perdait. */
    flamme.position.set(st.fx, st.fy, 0.27);
    halo.position.set(st.fx, st.fy, 0.24);
    feu.position.set(st.fx, st.fy + 0.03, 0.26);
    var vf = st.flamme * (1 - st.retrait);
    /* la flamme baisse à mesure que la masse grossit et se met à tourner
       seule : ce n'est pas elle qui grandit, c'est ce qu'elle nourrit. */
    var force = vf * lerp(1, 0.52, st.automate) * (1 - 0.22 * st.pompe * (0.5 + 0.5 * Math.sin(T * 2.1)));
    flamme.visible = halo.visible = force > 0.02;
    /* elle baisse — par la taille et par l'éclat —, mais elle doit rester
       VUE sur son orbite : posée sur le fer éclairé, une flamme additive à
       40 % ne se lisait plus (octobre 2026). */
    flMat.opacity = lerp(force, Math.min(1, force * 1.6), st.automate);
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
      /* la pièce éveillée n'est pas plus CLAIRE, elle ACCROCHE la lumière :
         c'est ainsi que le fer se distingue de la rouille. */
      for (var k = 0; k < 2; k++) {
        var M = k ? R.matD : R.mat;
        M.color.copy(ROUILLE).lerp(FER, v);
        M.roughness = lerp(0.99, 0.40, v);
        M.metalness = lerp(0.10, 0.88, v);
        M.envMapIntensity = lerp(0.15, 1.6, v);
      }
    }
    for (i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var n2 = p.venue ? ss(p.venue, p.venue + 0.30, G) * st.croit : 1;
      p.m.visible = n2 > 0.02;
      p.m.scale.setScalar((p.ech || 1) * (0.2 + 0.8 * n2));
      var v2 = vie(p.base) * n2;
      p.m.material.color.copy(ROUILLE).lerp(FER, v2);
      p.m.material.roughness = lerp(0.99, 0.40, v2);
      p.m.material.metalness = lerp(0.10, 0.88, v2);
      p.m.material.envMapIntensity = lerp(0.15, 1.6, v2);
    }

    /* LE FILET : la flamme donne, le fer reçoit, et cela bat au rythme de
       la roue — pas à celui de la flamme. */
    var bat = st.pompe * cl(Math.sin(ROUES[0].ang * 1.1) * 2.4);
    filet.visible = bat > 0.03;
    if (filet.visible) {
      P.set(st.fx, st.fy, 0.22); Q.copy(CENTRE); Q.z = 0.04;
      var D = Q.clone().sub(P), L = D.length();
      filet.position.copy(P).addScaledVector(D, 0.5);
      filet.scale.set(1, L, 1);
      filet.quaternion.setFromUnitVectors(UP, D.normalize());
      filetMat.opacity = 0.75 * bat;
    }

    /* ── LE CADRAGE ───────────────────────────────────────────────────
       Page « plein » : la visée est décalée à GAUCHE de 0,25 de la largeur
       vue, ce qui porte la masse à environ 75 % — la part claire du voile.
       La masse et l'orbite tiennent alors entre 57 % et 93 %.
       Depuis octobre 2026 la scène est aussi une figure en bas de page :
       là, et sur tout canevas de moins de 1100 px, elle se cadre centrée. */
    /* Octobre 2026 : la masse ne tenait que le tiers haut d'un cadre dont
       la moitié basse était du sol noir. La caméra s'est approchée et
       s'est levée un peu : elle regarde la masse de trois quarts haut, et
       le bas du cadre est le sol éclairé, à ses pieds. La masse grandie et
       l'orbite de la flamme tiennent entières (de 0,07 à 0,64 en hauteur). */
    var dz = lerp(1.18, 1.10, ss(0, 1, Math.min(1, G / 3)));
    var visW = 1.102 * dz;
    var large = canvas.clientWidth >= 1100 && !(canvas.closest && canvas.closest('.nt-fig'));
    var aim = V3(large ? -0.245 * visW : 0, 0.27, 0.0);
    camera.position.set(aim.x + 0.010 * Math.sin(T * 0.19), aim.y + 0.20 + 0.007 * Math.sin(T * 0.24), aim.z + dz);
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
    scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      [].concat(o.material || []).forEach(function (m) { if (m.map) m.map.dispose(); if (m.emissiveMap) m.emissiveMap.dispose(); m.dispose(); });
    });
    envRT.dispose(); renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
