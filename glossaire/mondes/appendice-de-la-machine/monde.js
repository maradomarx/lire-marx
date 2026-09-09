/* LE MONDE DE L'APPENDICE DE LA MACHINE — le poste.

   Le chapitre XV donne le critère et il est vérifiable : « Là le mouvement
   de l'instrument de travail part de lui ; ici il ne fait que le suivre. »
   La figure devait donc montrer l'ORIGINE DU MOUVEMENT changer de côté, et
   non pas une cadence qui s'accélère — ce qui ne dirait rien du concept.

   Un outil d'artisan, libre en l'air : un manche et une lame. La machine
   s'en saisit — la LAME monte s'encastrer dans le coulisseau, et il ne
   reste dans la main que le manche, qu'un montant vient planter au sol, à
   une hauteur qu'on n'a pas choisie. Le bouton de bois du volant tombe : ce
   n'est plus une manivelle, c'est une poulie, et elle tourne d'elle-même.
   Dès lors le levier SUIT le coulisseau, avec le retard de ce qui est
   entraîné. L'usure du plancher, large comme les pas d'un homme qui va et
   vient, se resserre en un rectangle de la taille d'un marchepied : le
   poste. Puis le poste se répète en profondeur, identique, et l'un d'eux
   porte un billot — le corps n'a pas été mesuré à la machine, c'est la
   machine qui donne la hauteur et le corps qu'on hausse. Le tabouret, lui,
   finit couché hors de la lumière.

   Tout est fonction de g, donc réversible. Seuls la cadence et le
   vacillement de la lampe sont temporels. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x090705, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x090705, 2.3, 6.4);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 7717; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── LE PLANCHER ── */
  var solTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#2a2016'; g.fillRect(0, 0, w, h);
    for (var i = 0; i <= 10; i++) { g.fillStyle = 'rgba(12,8,4,0.55)'; g.fillRect(0, i * h / 10 - 1.5, w, 3); }
    for (var k = 0; k < 900; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '14,9,4' : '108,88,60') + ',' + (rnd() * 0.14) + ')'; g.fillRect(rnd() * w, rnd() * h, 3 + rnd() * 12, 1 + rnd() * 3); }
  });
  solTex.wrapS = solTex.wrapT = THREE.RepeatWrapping; solTex.repeat.set(3, 3);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), std({ map: solTex, roughness: 1, color: 0x9c8663 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  var murTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#2b2118'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 900; k++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '12,8,4' : '104,84,58') + ',' + (rnd() * 0.14) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 9, 2 + rnd() * 5, 0, 0, 6.3); g.fill(); }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping; murTex.repeat.set(3, 2);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.6), std({ map: murTex, roughness: 1, color: 0x8a7a63 }));
  mur.position.set(0, 1.9, -1.85); mur.receiveShadow = true; scene.add(mur);

  /* ── L'USURE DU PLANCHER ──────────────────────────────────────────────
     Large comme les pas d'un homme qui va et vient, elle se resserre en un
     rectangle de la taille d'un marchepied. C'est ELLE qui dit le poste :
     le concept nomme une place, pas une fatigue. */
  var usureTex = tex(256, 256, function (g, w, h) {
    var r = g.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(196,164,112,0.60)'); r.addColorStop(0.55, 'rgba(168,138,92,0.28)'); r.addColorStop(1, 'rgba(168,138,92,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  var usure = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: usureTex, transparent: true, depthWrite: false, fog: false }));
  usure.rotation.x = -Math.PI / 2; usure.position.set(-0.42, 0.004, 0.16); scene.add(usure);

  /* ── LA MACHINE : un bâti de fonte, un coulisseau, un volant ── */
  var fonte  = std({ color: 0x1e1d1b, metalness: 0.3, roughness: 0.56 });
  var fonte2 = std({ color: 0x252320, metalness: 0.3, roughness: 0.52 });
  var acier  = std({ color: 0x35302a, metalness: 0.32, roughness: 0.34 });
  var boisTex = tex(256, 128, function (g, w, h) {
    g.fillStyle = '#4e3a22'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '26,17,8' : '124,98,62') + ',' + (0.07 + rnd() * 0.16) + ')'; g.lineWidth = 0.6 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 24) g.lineTo(x, y + Math.sin((x + i * 30) / 60) * 3); g.stroke(); }
  });
  var bois = std({ map: boisTex, color: 0x8f7350, roughness: 0.92 });

  var MX = 0.36;
  var socle = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.07, 0.56), fonte);
  socle.position.set(MX, 0.035, -0.10); socle.castShadow = socle.receiveShadow = true; scene.add(socle);
  [-0.26, 0.26].forEach(function (dx) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.06, 0.13), fonte2);
    m.position.set(MX + dx, 0.60, -0.10); m.castShadow = true; scene.add(m);
  });
  var chapeau = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.17), fonte2);
  chapeau.position.set(MX, 1.20, -0.10); chapeau.castShadow = true; scene.add(chapeau);

  var coulisseau = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.30, 0.145), acier);
  coulisseau.castShadow = true; scene.add(coulisseau);
  var porteOutil = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, 0.085), std({ color: 0x45403a, metalness: 0.36, roughness: 0.36 }));
  porteOutil.castShadow = true; scene.add(porteOutil);
  var enclume = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.22), fonte);
  enclume.position.set(MX, 0.40, -0.10); enclume.castShadow = enclume.receiveShadow = true; scene.add(enclume);
  [-0.09, 0.09].forEach(function (dz) {
    var t = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.34, 0.04), fonte);
    t.position.set(MX, 0.21, -0.10 + dz); t.castShadow = true; scene.add(t);
  });

  /* le volant. Son BOUTON DE BOIS est la clé de la figure : tant qu'il est
     là, c'est une manivelle, et le mouvement part d'une main. */
  var volant = new THREE.Group();
  var jante = new THREE.Mesh(new THREE.TorusGeometry(0.222, 0.030, 10, 34), fonte2);
  jante.castShadow = true; volant.add(jante);
  var moyeu = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.075, 14), fonte2);
  moyeu.rotation.z = Math.PI / 2; moyeu.castShadow = true; volant.add(moyeu);
  for (var r0 = 0; r0 < 5; r0++) {
    var br = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.40, 0.026), fonte2);
    br.rotation.z = r0 * Math.PI / 5; br.castShadow = true; volant.add(br);
  }
  volant.rotation.y = Math.PI / 2;
  volant.position.set(MX + 0.375, 0.90, -0.10); scene.add(volant);
  var bouton = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.034, 0.085, 12), bois);
  bouton.rotation.z = Math.PI / 2; bouton.castShadow = true; scene.add(bouton);

  /* ── L'OUTIL : un manche et une lame. La machine prend la LAME. ── */
  var manche = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 0.26, 14), bois);
  manche.castShadow = true; scene.add(manche);
  var virole = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.035, 16), std({ color: 0x5c4418, metalness: 0.4, roughness: 0.42 }));
  virole.castShadow = true; scene.add(virole);
  var lame = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.20, 0.070), std({ color: 0x3e3a33, metalness: 0.34, roughness: 0.3 }));
  lame.castShadow = true; scene.add(lame);

  /* le billot de l'artisan : l'outil doit REPOSER quelque part, sans quoi
     il flotte en l'air et l'on croit à une erreur */
  var billotArt = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.30, 0.32), bois);
  billotArt.castShadow = billotArt.receiveShadow = true; scene.add(billotArt);

  /* ── LE POSTE : marchepied, montant, levier ─────────────────────────
     La hauteur du levier NE CHANGE JAMAIS. C'est le corps qu'on hausse. */
  var PX = -0.42, LEVY = 0.84;
  function faireposte(billot) {
    var g0 = new THREE.Group();
    var mp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.045, 0.28), bois);
    mp.position.y = billot ? 0.185 : 0.022; mp.castShadow = mp.receiveShadow = true; g0.add(mp);
    if (billot) {
      var bl = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.16, 0.24), bois);
      bl.position.y = 0.082; bl.castShadow = bl.receiveShadow = true; g0.add(bl);
    }
    var mo = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, LEVY, 12), fonte2);
    mo.position.set(-0.17, LEVY / 2, -0.02); mo.castShadow = true; g0.add(mo);
    var pivot = new THREE.Group(); pivot.position.set(-0.17, LEVY, -0.02); g0.add(pivot);
    var bras = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.024, 0.024), acier);
    bras.position.x = 0.135; bras.castShadow = true; pivot.add(bras);
    var poignee = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.11, 12), bois);
    poignee.position.x = 0.275; poignee.rotation.z = Math.PI / 2; poignee.castShadow = true; pivot.add(poignee);
    g0.userData.pivot = pivot;
    g0.userData.montant = mo;
    g0.userData.marche = mp;
    return g0;
  }
  /* le premier poste ne porte PAS son levier : c'est le manche de l'outil
     qui vient s'y planter, et c'est tout l'argument */
  var poste1 = faireposte(false);
  poste1.userData.pivot.visible = false;
  poste1.position.set(PX, 0, 0.16); scene.add(poste1);
  var montant1 = poste1.userData.montant;
  var marche1 = poste1.userData.marche;

  var postes = [];
  [[PX - 0.17, -0.70, false], [PX - 0.35, -1.30, true]].forEach(function (p) {
    var g0 = faireposte(p[2]); g0.position.set(p[0], 0, p[1]); g0.visible = false; scene.add(g0); postes.push(g0);
    /* deux montants de fonte derrière chaque poste : la même chose répétée
       jusqu'au fond de la salle, que la brume achève */
    [-0.24, 0.28].forEach(function (dx) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.02, 0.12), fonte);
      m.position.set(MX + dx, 0.58, p[1] - 0.28); m.castShadow = true; m.visible = false; g0.userData.mur = g0.userData.mur || []; g0.userData.mur.push(m); scene.add(m);
    });
  });

  /* ── LE TABOURET : il finit couché, hors de la lumière ── */
  var tabouret = new THREE.Group();
  var assise = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.125, 0.045, 16), bois);
  assise.position.y = 0.46; assise.castShadow = true; tabouret.add(assise);
  for (var t0 = 0; t0 < 3; t0++) {
    var an = t0 * 2.094;
    var pd = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.021, 0.47, 8), bois);
    pd.position.set(Math.cos(an) * 0.085, 0.235, Math.sin(an) * 0.085);
    pd.rotation.z = -Math.cos(an) * 0.12; pd.rotation.x = Math.sin(an) * 0.12;
    pd.castShadow = true; tabouret.add(pd);
  }
  scene.add(tabouret);

  /* ── LA LUMIÈRE ── */
  scene.add(new THREE.AmbientLight(0x33291c, 0.40));
  var lampe = new THREE.PointLight(0xffc287, 1.30, 7.0, 1.6);
  lampe.position.set(-0.30, 1.98, 1.02);
  lampe.castShadow = true; lampe.shadow.bias = -0.0013; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var fond = new THREE.PointLight(0xd6a065, 0.50, 5.4, 1.6); fond.position.set(0.2, 1.9, -1.1); scene.add(fond);
  var froide = new THREE.DirectionalLight(0x90a8c4, 0.26); froide.position.set(2.2, 1.6, 1.6); scene.add(froide);

  /* ── CHORÉGRAPHIE ── */
  var G = 0, T = 0, phase = 0;
  var st = { prise: 0, plante: 0, motrice: 0, cadence: 0, serre: 0, repete: 0, lueur: 0, vitesse: 0 };
  function set(g) { G = g; }
  function compute() {
    st.prise    = ss(1.05, 1.75, G);   /* la machine saisit la lame */
    st.plante   = ss(1.35, 2.05, G);   /* le manche est boulonné au montant */
    st.motrice  = ss(2.10, 2.55, G);   /* le bouton tombe : le volant tourne seul */
    st.cadence  = ss(2.30, 2.90, G);
    st.serre    = ss(2.95, 3.85, G);   /* l'usure se resserre en poste */
    st.repete   = ss(4.10, 4.95, G);
    st.lueur    = ss(5.05, 5.70, G);
    /* la vitesse monte ; l'AMPLITUDE du levier, elle, ne change jamais */
    st.vitesse = st.cadence * (1 + 0.85 * ss(3.10, 4.30, G));
  }

  function frame(dt) {
    T += dt; compute();
    phase += dt * (0.30 + 0.62 * st.vitesse);

    var bat = Math.sin(phase * 6.283);
    /* AVANT : le coulisseau suit la main. APRÈS : la main suit le
       coulisseau. Le retard est le seul signe visible de la commande, il
       est donc franc — un huitième de tour. */
    var mene = st.motrice;
    var battantHaut = 0.5 + 0.5 * Math.sin((phase - (mene > 0.5 ? 0 : 0.13)) * 6.283);
    var battantBas  = 0.5 + 0.5 * Math.sin((phase - (mene > 0.5 ? 0.13 : 0)) * 6.283);

    var course = 0.11 * st.cadence;
    coulisseau.position.set(MX, 0.86 - course * battantHaut, -0.10);
    porteOutil.position.set(MX, coulisseau.position.y - 0.185, -0.10);

    /* la lame quitte le manche et monte s'encastrer dans le porte-outil */
    var pr = st.prise;
    var lx = lerp(PX + 0.03, MX, pr), ly = lerp(0.40, porteOutil.position.y - 0.115, pr), lz = lerp(0.24, -0.10, pr);
    lame.position.set(lx, ly + Math.sin(Math.PI * pr) * 0.16, lz);
    lame.rotation.z = lerp(0.55, 0, pr); lame.rotation.x = lerp(-0.25, 0, pr);

    /* le manche : d'abord libre en l'air, puis au bout du bras du levier,
       a une hauteur qu'il n'a pas choisie */
    var pl = st.plante;
    var BRAS = 0.275, ang = -0.30 + 0.30 * battantBas;
    var pvx = PX - 0.17, pvz = 0.16 - 0.02;
    var hx = pvx + Math.cos(ang) * BRAS, hy = LEVY + Math.sin(ang) * BRAS, hz = pvz;
    manche.position.set(lerp(PX - 0.01, hx, pl), lerp(0.58, hy, pl), lerp(0.26, hz, pl));
    manche.rotation.z = lerp(0.62, Math.PI / 2 + ang, pl);
    manche.rotation.x = lerp(-0.22, 0, pl);
    virole.position.copy(manche.position);
    virole.position.y += lerp(0.115, -Math.sin(ang) * 0.072, pl);
    virole.position.x += lerp(0, -Math.cos(ang) * 0.072, pl);
    virole.rotation.z = manche.rotation.z; virole.rotation.x = manche.rotation.x;

    /* le bras et le montant du premier poste n'existent qu'une fois plantés */
    poste1.userData.pivot.visible = pl > 0.35;
    poste1.userData.pivot.rotation.z = ang;
    poste1.userData.pivot.children[1].visible = false;   /* la poignée, c'est le manche */
    montant1.visible = pl > 0.2; montant1.scale.y = cl(pl / 0.6);
    montant1.position.y = LEVY / 2 * montant1.scale.y;
    marche1.visible = st.serre > 0.25;
    marche1.scale.setScalar(0.4 + 0.6 * cl(st.serre / 0.6));

    /* LE BOUTON DU VOLANT : tant qu'il est là, c'est une manivelle */
    var mo2 = st.motrice;
    volant.rotation.x = phase * 6.283 * (0.3 + 0.7 * mo2);
    var ba = volant.rotation.x;
    bouton.visible = mo2 < 0.92;
    bouton.position.set(MX + 0.375 - 0.056, 0.90 + Math.sin(ba) * 0.172 - mo2 * mo2 * 2.4, -0.10 + Math.cos(ba) * 0.172);
    bouton.rotation.x = ba;

    /* L'USURE : large comme les pas d'un homme, puis un rectangle */
    var s2 = st.serre;
    usure.scale.set(lerp(0.98, 0.40, s2), lerp(0.74, 0.34, s2), 1);
    usure.material.opacity = 0.55 + 0.45 * s2;

    /* LE POSTE SE RÉPÈTE, identique, et l'un porte un billot */
    postes.forEach(function (g0, n) {
      var seuil = n * 0.34;
      var f = cl((st.repete - seuil) / 0.4);
      g0.visible = f > 0.04;
      g0.scale.setScalar(0.5 + 0.5 * f);
      g0.userData.pivot.rotation.z = -0.30 + 0.30 * (0.5 + 0.5 * Math.sin((phase - 0.13 - 0.18 * (n + 1)) * 6.283));
      g0.userData.mur.forEach(function (m) { m.visible = f > 0.2; });
    });

    /* LE TABOURET ET LE BILLOT : debout, puis couchés hors de la lumière */
    var tb = ss(1.30, 2.20, G);
    billotArt.position.set(lerp(PX + 0.02, PX - 0.24, tb), 0.15, lerp(0.24, 0.18, tb));
    billotArt.rotation.z = tb * 0.22;
    billotArt.visible = tb < 0.98;
    tabouret.position.set(lerp(PX - 0.10, PX - 0.17, tb), 0, lerp(0.48, 0.55, tb));
    tabouret.rotation.z = lerp(0, 1.42, tb);
    tabouret.position.y = Math.sin(Math.PI * tb) * 0.05;

    lampe.intensity = 1.30 * (1 + 0.022 * Math.sin(T * 5.9) + 0.013 * Math.sin(T * 2.3));
    fond.intensity = 0.50 + 0.55 * st.lueur;

    /* LA CAMÉRA. Ensemble d'environ 1,7 unité de haut et autant de large.
       En PORTRAIT (la colonne collante) la largeur vue vaut 0,82 fois la
       distance et la hauteur 1,40 ; en PAYSAGE (l'image fixe) c'est
       l'inverse, 1,10 et 0,69. C'est donc la HAUTEUR en paysage qui
       commande ici : 1,7 / 0,69 fait 2,5. */
    var q = ss(0, 1, Math.min(1, G / 2.2));
    var dz = lerp(2.42, 2.62, q) + st.repete * 0.16;
    var camA = V3(lerp(-0.04, 0.02, q), lerp(0.80, 0.74, q), lerp(-0.06, -0.16, q));
    camera.position.set(camA.x - 0.16 + 0.012 * Math.sin(T * 0.24), camA.y + 0.30 + 0.008 * Math.sin(T * 0.29), camA.z + dz);
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
