/* LE MONDE DE LA DIVISION DU TRAVAIL — le râtelier.

   Marx donne la figure lui-même, et elle est vérifiable : à Birmingham, cinq
   cents variétés de marteaux, dont chacune ne sert qu'à un seul procès. La
   DIFFÉRENCIATION DE L'OUTIL est la trace matérielle de la décomposition de
   l'homme — et c'est la seule qu'on puisse montrer sans figure humaine, la
   règle de la maison interdisant de découper une figure dans un groupe
   sculpté.

   Un panneau d'atelier. Au centre, un seul marteau : celui de l'artisan, qui
   sert à tout, et sur l'établi la roue de carrosse, son ouvrage entier. Puis
   deux variantes paraissent — la double origine de la manufacture —, puis les
   rangées se remplissent du centre vers les bords, et le grand marteau prend
   sa place parmi les autres : les instruments de même espèce ont perdu leur
   forme commune. Chacun est cloué à sa cheville, la lumière se resserre sur
   un seul, et pour finir un porte-outil se lève sur l'établi et en saisit un :
   un outil réduit à un geste unique est un outil qu'une machine peut prendre.

   Le cadre est le plus souvent en PORTRAIT (la colonne collante) : la scène a
   donc de la matière en hauteur — l'établi et le sol en bas, la poutre et la
   lampe en haut — pendant que l'essentiel, le panneau, tient dans la bande
   que voit le cadre en paysage de l'image fixe.

   Tout est fonction de g, donc réversible. Seul le vacillement de la lampe
   est temporel. */
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.4, 6.2);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 419; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── matières ── */
  /* LE FER NE DOIT PAS LIRE COMME DE L'ALUMINIUM. Deux passes : sous une
     lampe chaude et le tone mapping ACES, un métal à forte métallicité
     renvoie la couleur de la source, et les têtes ressortaient BLANCHES.
     C'est le cousin du piège du rouge qui vire au saumon — il faut baisser
     la MÉTALLICITÉ, pas seulement assombrir la couleur. */
  var fer = std({ color: 0x2a2a30, metalness: 0.34, roughness: 0.62 });
  var manche = std({ color: 0x7a5a34, roughness: 0.82 });
  var laiton = std({ color: 0xa8842f, metalness: 0.84, roughness: 0.32 });

  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8a6a42'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 300; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '58,40,20' : '196,164,116') + ',' + (0.06 + rnd() * 0.18) + ')'; g.lineWidth = 1 + rnd() * 3; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.009 + i) * 9); g.stroke(); }
  });
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8f8271'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 11000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '48,34,20' : '198,186,164') + ',' + (rnd() * 0.11) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });

  /* ── le mur, le sol, la poutre ── */
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), std({ map: platre, roughness: 0.97, color: 0x6d6356 }));
  mur.position.set(0, 1.4, -0.56); mur.receiveShadow = true; scene.add(mur);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), std({ color: 0x3a3026, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(0, 0, 0.4); sol.receiveShadow = true; scene.add(sol);
  var poutre = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 0.22), std({ map: boisTex, roughness: 0.9, color: 0x877360 }));
  poutre.position.set(0, 2.00, -0.24); poutre.castShadow = true; poutre.receiveShadow = true; scene.add(poutre);

  /* ── L'ÉTABLI ── */
  var BY = 0.32;
  var plateau = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.07, 0.52), std({ map: boisTex, roughness: 0.85, color: 0x8a7660 }));
  plateau.position.set(0, BY - 0.035, -0.16); plateau.castShadow = true; plateau.receiveShadow = true; scene.add(plateau);
  var tablier = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.14, 0.05), std({ map: boisTex, roughness: 0.88, color: 0xac947c }));
  tablier.position.set(0, BY - 0.14, 0.07); tablier.castShadow = true; scene.add(tablier);
  [-1.05, 1.05].forEach(function (x) {
    var p = new THREE.Mesh(new THREE.BoxGeometry(0.10, BY - 0.07, 0.10), std({ map: boisTex, roughness: 0.9, color: 0x7e6a54 }));
    p.position.set(x, (BY - 0.07) / 2, -0.02); p.castShadow = true; scene.add(p);
  });

  /* ── LA ROUE DE CARROSSE : l'ouvrage entier, qui ne change pas ─────────
     « Un carrosse fut le produit collectif des travaux d'un grand nombre
     d'artisans indépendants les uns des autres. » Elle est là au premier
     temps et elle y est encore au dernier : ce n'est pas le produit qui
     change, c'est la manière de le faire. */
  var roue = new THREE.Group();
  var jante = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.026, 10, 28), std({ map: boisTex, roughness: 0.8, color: 0xa38f72 }));
  roue.add(jante);
  var cercle = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.010, 8, 30), fer); roue.add(cercle);
  var moyeu = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.085, 16), std({ map: boisTex, roughness: 0.78, color: 0xa89076 }));
  moyeu.rotation.x = Math.PI / 2; roue.add(moyeu);
  for (var r = 0; r < 8; r++) {
    var a = r / 8 * Math.PI * 2;
    var ray = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.145, 0.026), std({ map: boisTex, roughness: 0.8, color: 0xa48c70 }));
    ray.position.set(Math.cos(a) * 0.108, Math.sin(a) * 0.108, 0); ray.rotation.z = a - Math.PI / 2; roue.add(ray);
  }
  roue.rotation.x = -Math.PI / 2 + 0.04; roue.position.set(-0.52, BY + 0.028, -0.02);
  roue.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(roue);

  /* ── LE PANNEAU ── */
  var PZ = -0.50, PW = 0.98, PH = 1.06, PCY = 0.95;
  var panneau = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.04), std({ map: boisTex, roughness: 0.9, color: 0x836f56 }));
  panneau.position.set(0, PCY, PZ); panneau.castShadow = true; panneau.receiveShadow = true; scene.add(panneau);
  /* un cadre de laiton : au dernier temps, le panneau se lit comme UN seul instrument */
  var cadre = new THREE.Group();
  [[0, PH / 2], [0, -PH / 2]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.05, 0.018, 0.05), laiton); m.position.set(p[0], p[1], 0); m.castShadow = true; cadre.add(m);
  });
  [[-PW / 2, 0], [PW / 2, 0]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.018, PH + 0.05, 0.05), laiton); m.position.set(p[0], p[1], 0); m.castShadow = true; cadre.add(m);
  });
  cadre.position.set(0, PCY, PZ + 0.03); scene.add(cadre);

  /* ── LES MARTEAUX ─────────────────────────────────────────────────────
     Chacun tire sa forme d'un germe : longueur et largeur de tête, panne
     ronde ou fendue, longueur de manche. Ils sont PRESQUE identiques, et
     c'est le point — une famille dont aucun membre ne sert à ce que sert
     son voisin. */
  function marteau(k) {
    var g = new THREE.Group();
    var lm = 0.135 + rnd() * 0.055, rm = 0.0085 + rnd() * 0.0035;
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rm * 0.85, rm, lm, 8), manche);
    m.position.y = -lm / 2 - 0.012; g.add(m);
    var lt = 0.052 + rnd() * 0.042, ht = 0.020 + rnd() * 0.012;
    var t = new THREE.Mesh(new THREE.BoxGeometry(lt, ht, ht * (0.8 + rnd() * 0.5)), fer);
    g.add(t);
    /* la panne : tantôt un coin, tantôt une boule — la variété se voit à ça */
    var panne;
    if (rnd() < 0.55) { panne = new THREE.Mesh(new THREE.ConeGeometry(ht * 0.52, 0.026 + rnd() * 0.030, 4), fer); panne.rotation.z = -Math.PI / 2; }
    else { panne = new THREE.Mesh(new THREE.SphereGeometry(ht * 0.50, 10, 8), fer); }
    panne.position.x = lt / 2 + 0.012; g.add(panne);
    var oeil = new THREE.Mesh(new THREE.CylinderGeometry(ht * 0.36, ht * 0.36, ht * 1.15, 10), fer);
    oeil.position.x = -lt * (0.10 + rnd() * 0.12); g.add(oeil);
    g.rotation.z = (rnd() - 0.5) * 0.10; g.userData.rz = g.rotation.z;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.userData.k = k;
    return g;
  }
  /* les chevilles : elles existent d'emblée, le panneau les attend */
  function cheville(x, y) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), fer);
    c.rotation.x = Math.PI / 2; c.position.set(x, y, PZ + 0.045); c.castShadow = true; scene.add(c); return c;
  }
  var COLS = [-0.36, -0.18, 0, 0.18, 0.36], LIGNES = [1.30, 1.06, 0.82, 0.58];
  var petits = [], chevilles = [];
  LIGNES.forEach(function (y, iy) {
    COLS.forEach(function (x, ix) {
      /* la case du milieu est RÉSERVÉE au marteau de l'artisan, qui vient y
         prendre sa place : deux outils sur la même cheville se traversaient */
      if (ix === 2 && iy === 1) { chevilles.push(cheville(x, y + 0.014)); return; }
      var d = Math.abs(x) / 0.36 * 0.55 + Math.abs(y - PCY) / 0.40 * 0.45;   /* du centre vers les bords */
      var g = marteau(petits.length);
      g.position.set(x, y, PZ + 0.075);
      g.userData.ordre = d; g.userData.base = g.position.clone();
      g.scale.setScalar(0.001); g.visible = false;
      scene.add(g); petits.push(g);
      chevilles.push(cheville(x, y + 0.014));
    });
  });
  petits.sort(function (a, b) { return a.userData.ordre - b.userData.ordre; });
  /* l'ÉLU : celui sur lequel la lumière se resserre, puis que la machine prend */
  var ELU = petits[7];

  /* LE MARTEAU DE L'ARTISAN : grand, seul, au centre — puis il prend sa
     place parmi les autres, à la taille commune. Sa forme commune est
     perdue, et c'est ce que dit le chapitre. */
  var grand = new THREE.Group();
  var gm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.30, 10), manche);
  gm.position.y = -0.168; grand.add(gm);
  var gt = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.048, 0.046), fer); grand.add(gt);
  var gp = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.052, 4), fer);
  gp.rotation.z = -Math.PI / 2; gp.position.x = 0.096; grand.add(gp);
  var go = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.056, 12), fer);
  go.position.x = -0.020; grand.add(go);
  grand.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  grand.position.set(0, 1.06, PZ + 0.085); scene.add(grand);
  cheville(0, 1.08);

  /* ── LE PORTE-OUTIL : la machine s'empare de l'outil ── */
  var porte = new THREE.Group();
  var pPost = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.045), fer); pPost.position.y = 0.17; porte.add(pPost);
  var pSocle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.030, 16), fer); pSocle.position.y = 0.015; porte.add(pSocle);
  var pBras = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.034, 0.034), fer); pBras.position.set(-0.085, 0.335, 0); porte.add(pBras);
  var pMors = new THREE.Group();
  [-0.026, 0.026].forEach(function (dy) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.020, 0.048), laiton); m.position.y = dy; pMors.add(m);
  });
  pMors.position.set(-0.175, 0.335, 0); porte.add(pMors);
  porte.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  porte.position.set(0.56, BY, -0.06); porte.visible = false; scene.add(porte);
  var pris = null;   /* le marteau que le porte-outil tient */

  /* ── la lumière ── */
  var ambiante = new THREE.AmbientLight(0x3a3026, 0.28); scene.add(ambiante);
  /* LA LAMPE EST PRÈS : à 2,9 d'intensité et 1,7 de distance, tout ce qui
     est sur le panneau SATURAIT — manches de bois compris, qui rendaient
     crème. Ce n'est pas la couleur des matières qu'il fallait corriger mais
     l'éclairement. La règle : une source proche demande une intensité
     bien plus faible qu'une source de plafond. */
  /* LA SOURCE EST HORS CHAMP, ET C'EST LE BON CHOIX. Essayée pendue à la
     poutre, dans le cadre, elle passait à quatre-vingt-dix centimètres du
     panneau : les ombres des dix-neuf marteaux devenaient d'énormes pans
     noirs qui se recouvraient, et le râtelier ne se lisait plus. De loin
     et de haut, elles sont courtes et donnent le relief. Un luminaire
     qu'on ne verra jamais n'a donc pas été dessiné — c'est la flaque de
     lumière qui compte, pas son ustensile. */
  var lampe = new THREE.PointLight(0xffc286, 1.75, 6, 1.7); lampe.position.set(-0.62, 1.78, 0.92);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  /* la lumière qui se resserre sur un seul outil : elle n'existe qu'au
     troisième temps, et elle est ÉTEINTE le reste du temps */
  var falot = new THREE.PointLight(0xffd9a0, 0, 0.6, 2); scene.add(falot);

  /* ── chorégraphie ─────────────────────────────────────────────────── */
  var G = 0, T = 0;
  var st = { paru: 0, serre: 0, prise: 0, nb: 1 };
  function set(g) { G = g; }
  function compute() {
    st.s1 = ss(0.7, 1.8, G);     /* les deux premières variantes */
    st.s2 = ss(1.7, 3.0, G);     /* les rangées se remplissent */
    st.s3 = ss(3.0, 4.0, G);     /* clouées, et la lumière se resserre */
    st.s4 = ss(4.0, 5.0, G);     /* le porte-outil se lève et prend */
    st.s5 = ss(5.0, 5.8, G);     /* le panneau complet, la lumière revient */
    st.paru = st.s2;
    st.serre = st.s3 * (1 - st.s5);
    st.prise = st.s4;
  }

  function frame(dt) {
    T += dt; compute();

    /* LES VARIANTES PARAISSENT DU CENTRE VERS LES BORDS. Chacune a son
       seuil : la vague traverse le panneau au lieu de tout allumer d'un
       coup — et comme le seuil est fonction de g, on la remonte. */
    var n = petits.length, vus = 0;
    for (var i = 0; i < n; i++) {
      var g = petits[i];
      /* les deux premières arrivent dès le second temps : la double origine */
      var t0 = i < 2 ? 0 : 0.06 + (i / n) * 0.80;
      var av = i < 2 ? Math.max(st.s1, st.paru) : st.paru;
      var p = cl((av - t0) / 0.16);
      g.visible = p > 0.01;
      if (g.visible) {
        vus++;
        var e = p * p * (3 - 2 * p);
        g.scale.setScalar(0.28 + 0.72 * e);
        g.position.y = g.userData.base.y + 0.055 * (1 - e);
        g.position.z = g.userData.base.z + 0.06 * (1 - e);
      }
      chevilles[i].visible = true;
    }
    st.nb = vus + 1;

    /* le grand marteau rejoint la taille commune : la forme commune est perdue */
    var fondu = ss(0.25, 0.85, st.paru);
    grand.scale.setScalar(lerp(1, 0.46, fondu));
    grand.position.y = lerp(1.06, LIGNES[1], fondu);
    grand.position.x = lerp(0, COLS[2], fondu);

    /* le cadre de laiton : le panneau devient UN instrument */
    var vc = ss(0.15, 0.9, st.s4);
    cadre.visible = vc > 0.02;
    cadre.scale.set(0.2 + 0.8 * vc, 0.2 + 0.8 * vc, 1);

    /* LE PORTE-OUTIL prend l'un des marteaux */
    porte.visible = st.prise > 0.02;
    porte.scale.set(1, 0.25 + 0.75 * ss(0, 0.5, st.prise), 1);
    var t4 = ss(0.45, 1, st.prise);
    if (t4 > 0.02) {
      if (pris !== ELU) { pris = ELU; }
      ELU.position.lerpVectors(ELU.userData.base, V3(0.385, BY + 0.335, -0.06), t4);
      ELU.rotation.z = lerp(ELU.userData.rz, -Math.PI / 2, t4);
    } else if (pris === ELU) {
      pris = null; ELU.position.copy(ELU.userData.base); ELU.rotation.z = ELU.userData.rz;
    }

    /* la lumière se resserre, puis revient */
    ambiante.intensity = lerp(0.28, 0.10, st.serre);
    lampe.intensity = lerp(1.75, 0.62, st.serre) * (1 + 0.03 * Math.sin(T * 7.1) + 0.02 * Math.sin(T * 3.3));
    falot.intensity = 0.9 * st.serre;
    falot.position.set(ELU.position.x + 0.10, ELU.position.y + 0.02, PZ + 0.30);

    /* LE CADRAGE — le panneau tient dans la bande que voit le cadre en
       paysage (0,69 × la distance en hauteur), et la colonne collante, plus
       haute, reçoit l'établi en bas et la poutre en haut. */
    var q = ss(0, 1, Math.min(1, G / 2.4));
    /* LA ROUE ÉTAIT COUPÉE PAR LE BAS : le panneau tenait 3 % à 83 % de la
       hauteur du cadre en paysage et il ne restait rien pour l'établi. On
       recule, et le panneau descend à 6 %-74 % — l'ouvrage entier se voit. */
    var dz = lerp(2.44, 2.26, q);
    var camA = V3(lerp(-0.05, 0, q), lerp(0.84, 0.80, q), PZ + 0.10);
    camera.position.set(camA.x + 0.012 * Math.sin(T * 0.23), camA.y + 0.16 + 0.009 * Math.sin(T * 0.29), camA.z + dz);
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
